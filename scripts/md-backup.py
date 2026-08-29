#!/usr/bin/env python
"""
Copy the MotherDuck warehouse to local Parquet, and optionally load it into a
second MotherDuck account.

    python scripts/md-backup.py list
    python scripts/md-backup.py export
    python scripts/md-backup.py verify
    python scripts/md-backup.py views  --account alt
    python scripts/md-backup.py import --account alt

Why Parquet in the middle instead of account-to-account directly: the local
copy is the actual safety net. If both accounts become unreachable — billing
dispute, suspension, a token revoked — the data still exists on disk, and
analysis can run against it with no warehouse at all.

The export is resumable. Free tier has a daily compute cap, and re-scanning
3.4M rows because the run died at table nine is exactly how you hit it.

Tokens are read from .env.local into the process environment and never printed,
never passed on a command line, and never interpolated into a connection string
(they would surface in tracebacks).

Accounts are named for their ROLE, not their identity: `live` is whatever
MOTHERDUCK_TOKEN points at — the warehouse the app and the ETL actually use —
and `alt` is MOTHERDUCK_TOKEN_B. Earlier revisions called these "a" and "b",
which inverted the day the tokens were swapped and made every command mean the
opposite of what it read. Roles survive a swap; identities do not. Writes are
refused against `live`.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
# Outside the repo on purpose: a 1 GB directory inside a project folder is one
# careless `git add .` away from a very slow push.
DEFAULT_OUT = REPO.parent / "bdmflow-backup"

# Leftovers from earlier migrations; no route or view references them.
SKIP_SUFFIX = "_backup"


def load_env() -> None:
    """Read .env.local into os.environ without echoing any value."""
    path = REPO / ".env.local"
    if not path.exists():
        sys.exit(f"[fatal] {path} not found")
    for line in path.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$", line)
        if not m:
            continue
        key, val = m.group(1), m.group(2)
        if len(val) >= 2 and val[0] == val[-1] and val[0] in "\"'":
            val = val[1:-1]
        os.environ.setdefault(key, val)


_connected_account: str | None = None


def connect(account: str):
    """Connect to MotherDuck. The token goes via env, not the DSN.

    One account per process, enforced. The MotherDuck extension caches its
    connection process-wide, so a second duckdb.connect('md:') with a different
    token silently hands back the FIRST account instead of failing. A script
    that loops over accounts therefore compares an account against itself and
    reports perfect parity no matter what is really there — which is exactly
    how a migration verification can pass while proving nothing.
    """
    import duckdb

    global _connected_account
    if _connected_account is not None and _connected_account != account:
        sys.exit(
            f"[fatal] this process already connected to account {_connected_account.upper()}; "
            f"the MotherDuck extension would silently reuse it instead of connecting to "
            f"{account.upper()}. Run one account per process."
        )

    var = "MOTHERDUCK_TOKEN" if account == "live" else "MOTHERDUCK_TOKEN_B"
    token = os.environ.get(var)
    if not token:
        sys.exit(f"[fatal] {var} is not set in .env.local")
    # The DuckDB extension reads this name specifically.
    os.environ["motherduck_token"] = token
    con = duckdb.connect("md:")
    _connected_account = account
    db = con.execute("SELECT current_database()").fetchone()[0]
    print(f"[ok] connected to account {account.upper()}, database '{db}'")
    return con, db


def discover(con, db: str) -> list[tuple[str, str, str]]:
    """Every base table worth copying, as (catalog, schema, name)."""
    rows = con.execute(
        """
        SELECT table_catalog, table_schema, table_name
        FROM information_schema.tables
        WHERE table_type = 'BASE TABLE'
          AND table_catalog = ?
          AND table_schema NOT IN ('information_schema', 'pg_catalog', 'temp')
        ORDER BY table_schema, table_name
        """,
        [db],
    ).fetchall()
    # The tb_* tables are ETL output and could in principle be rebuilt rather
    # than copied. They are copied anyway: several views select from them, so a
    # warehouse without them cannot even create its view layer, and the ETL that
    # would regenerate them needs that view layer to run. They are ~13k rows.
    return [(c, s, n) for c, s, n in rows if not n.endswith(SKIP_SUFFIX)]


def fq(cat: str, schema: str, name: str) -> str:
    return f'"{cat}"."{schema}"."{name}"'


def manifest_path(out: Path) -> Path:
    return out / "_manifest.json"


def read_manifest(out: Path) -> dict:
    p = manifest_path(out)
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}


def write_manifest(out: Path, data: dict) -> None:
    manifest_path(out).write_text(json.dumps(data, indent=2), encoding="utf-8")


def cmd_list(args) -> None:
    con, db = connect("live")
    tables = discover(con, db)
    print(f"\n{len(tables)} table(s) to export:\n")
    total = 0
    for cat, schema, name in tables:
        n = con.execute(f"SELECT COUNT(*) FROM {fq(cat, schema, name)}").fetchone()[0]
        total += n
        print(f"  {schema}.{name:<32} {n:>10,} rows")
    print(f"\n  {'TOTAL':<34} {total:>10,} rows")
    con.close()


def cmd_export(args) -> None:
    out: Path = args.out
    out.mkdir(parents=True, exist_ok=True)
    con, db = connect("live")
    tables = discover(con, db)
    man = read_manifest(out)

    print(f"\n[export] {len(tables)} table(s) -> {out}\n")
    for cat, schema, name in tables:
        key = f"{schema}.{name}"
        target = out / f"{key}.parquet"

        # Resume: trust a file only if the manifest says it finished and the row
        # count still matches upstream. A half-written Parquet from a killed run
        # would otherwise be treated as done.
        if target.exists() and key in man:
            src_n = con.execute(f"SELECT COUNT(*) FROM {fq(cat, schema, name)}").fetchone()[0]
            if man[key].get("rows") == src_n:
                print(f"  = {key:<40} {src_n:>10,} rows (already done)")
                continue
            print(f"  ! {key} changed upstream, re-exporting")

        t0 = time.time()
        con.execute(
            f"COPY (SELECT * FROM {fq(cat, schema, name)}) TO '{target.as_posix()}' "
            "(FORMAT PARQUET, COMPRESSION ZSTD)"
        )
        n = con.execute(f"SELECT COUNT(*) FROM read_parquet('{target.as_posix()}')").fetchone()[0]
        mb = target.stat().st_size / 1e6
        man[key] = {"rows": n, "bytes": target.stat().st_size, "schema": schema, "name": name}
        write_manifest(out, man)  # after every table, so a crash keeps progress
        print(f"  + {key:<40} {n:>10,} rows  {mb:>7.1f} MB  {time.time() - t0:>5.1f}s")

    con.close()
    total_mb = sum(v["bytes"] for v in man.values()) / 1e6
    print(f"\n[done] {len(man)} table(s), {total_mb:.1f} MB in {out}")


def cmd_verify(args) -> None:
    """Re-count every Parquet file against the live source."""
    import duckdb

    out: Path = args.out
    man = read_manifest(out)
    if not man:
        sys.exit(f"[fatal] no manifest in {out} — run export first")
    con, db = connect("live")
    local = duckdb.connect()
    bad = 0
    print()
    for key, meta in sorted(man.items()):
        target = out / f"{key}.parquet"
        if not target.exists():
            print(f"  MISSING  {key}")
            bad += 1
            continue
        n_local = local.execute(
            f"SELECT COUNT(*) FROM read_parquet('{target.as_posix()}')"
        ).fetchone()[0]
        n_src = con.execute(
            f'SELECT COUNT(*) FROM "{db}"."{meta["schema"]}"."{meta["name"]}"'
        ).fetchone()[0]
        ok = n_local == n_src
        bad += 0 if ok else 1
        print(f"  {'ok ' if ok else 'DIFF'}  {key:<40} local {n_local:>10,}  source {n_src:>10,}")
    con.close()
    print(f"\n[verify] {len(man) - bad}/{len(man)} match")
    sys.exit(1 if bad else 0)


def cmd_import(args) -> None:
    out: Path = args.out
    man = read_manifest(out)
    if not man:
        sys.exit(f"[fatal] no manifest in {out} — run export first")
    con, db = connect(args.account)
    if args.account == "live":
        sys.exit("[fatal] refusing to overwrite the live warehouse; pass --account alt")

    print(f"\n[import] {len(man)} table(s) -> account {args.account.upper()} / '{db}'\n")
    for key, meta in sorted(man.items()):
        target = out / f"{key}.parquet"
        if not target.exists():
            print(f"  SKIP {key} (file missing)")
            continue
        schema, name = meta["schema"], meta["name"]
        con.execute(f'CREATE SCHEMA IF NOT EXISTS "{db}"."{schema}"')
        t0 = time.time()
        con.execute(
            f'CREATE OR REPLACE TABLE "{db}"."{schema}"."{name}" AS '
            f"SELECT * FROM read_parquet('{target.as_posix()}')"
        )
        n = con.execute(f'SELECT COUNT(*) FROM "{db}"."{schema}"."{name}"').fetchone()[0]
        flag = "ok " if n == meta["rows"] else "DIFF"
        print(f"  {flag} {key:<40} {n:>10,} rows  {time.time() - t0:>5.1f}s")
    con.close()
    print("\n[done] now run the ETL against account B to rebuild the tb_* tables")


# The exporter qualifies market and ksei views but emits main-schema views bare
# ("CREATE VIEW vw_x"), so the schema has to come from the file it lives in.
# Missing those 27 is not a small gap: they are the foundation layer the market
# views build on, so an unqualified parse silently loses most of the graph.
VIEW_FILES = {"views_market.sql": "market", "views_main.sql": "main", "views_ksei.sql": "ksei"}
VIEW_RE = re.compile(
    r"^\s*CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(?:([A-Za-z0-9_]+)\.)?([A-Za-z0-9_]+)\s+AS\b", re.I
)


def cmd_views(args) -> None:
    """Replay the exported view DDL into an account.

    The ETL references views 45 times, so account B cannot rebuild its tb_*
    tables until these exist. Every view is replayed, including ones slated for
    the orphan drop — a view costs nothing until queried, and a missing
    dependency would break the ETL in a way that is tedious to trace.
    """
    con, db = connect(args.account)
    if args.account == "live":
        sys.exit("[fatal] refusing to rewrite views in the live warehouse; pass --account alt")

    stmts: list[tuple[str, str, str]] = []
    for fname, default_schema in VIEW_FILES.items():
        path = REPO / "sql" / fname
        if not path.exists():
            sys.exit(f"[fatal] {path} not found")
        found = 0
        for line in path.read_text(encoding="utf-8").splitlines():
            m = VIEW_RE.match(line)
            if not m:
                continue
            found += 1
            schema = m.group(1) or default_schema
            name = m.group(2)
            # Rebuild the header so the name is always qualified, and so a retry
            # does not collide with an attempt that already succeeded.
            body = line.strip()[m.end() :]
            stmts.append((schema, name, f'CREATE OR REPLACE VIEW "{schema}"."{name}" AS{body}'))
        print(f"  {fname}: {found} view(s)")

    declared = sum(int(m) for m in re.findall(r"·\s*(\d+)\s*views", "".join(
        (REPO / "sql" / f).read_text(encoding="utf-8")[:200] for f in VIEW_FILES)))
    if declared and declared != len(stmts):
        sys.exit(f"[fatal] parsed {len(stmts)} views but the dumps declare {declared} — parser is dropping definitions")

    for schema in sorted({s for s, _, _ in stmts}):
        con.execute(f'CREATE SCHEMA IF NOT EXISTS "{db}"."{schema}"')

    print(f"\n[views] replaying {len(stmts)} view(s) into account {args.account.upper()}\n")
    pending = stmts
    rnd = 0
    while pending:
        rnd += 1
        failed = []
        for schema, name, sql in pending:
            try:
                con.execute(sql)
            except Exception as exc:  # dependency not created yet, or genuinely broken
                failed.append((schema, name, sql, exc))
        done = len(pending) - len(failed)
        print(f"  pass {rnd}: {done} created, {len(failed)} deferred")
        if not failed:
            pending = []
            break
        if done == 0:
            pending = [(s, n, q) for s, n, q, _ in failed]
            print(f"\n[stuck] {len(failed)} view(s) could not be created:\n")
            for schema, name, _, exc in failed:
                first = str(exc).strip().splitlines()[0][:130]
                print(f"  {schema}.{name:<40} {first}")
            break
        pending = [(s, n, q) for s, n, q, _ in failed]

    total = con.execute(
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_type = 'VIEW' AND table_catalog = ?",
        [db],
    ).fetchone()[0]
    con.close()
    print(f"\n[done] account {args.account.upper()} now has {total} view(s)")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT, help=f"default: {DEFAULT_OUT}")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("list").set_defaults(fn=cmd_list)
    sub.add_parser("export").set_defaults(fn=cmd_export)
    sub.add_parser("verify").set_defaults(fn=cmd_verify)
    # No default on the writing commands: the target must be stated out loud.
    imp = sub.add_parser("import")
    imp.add_argument("--account", required=True, choices=["live", "alt"])
    imp.set_defaults(fn=cmd_import)
    vws = sub.add_parser("views")
    vws.add_argument("--account", required=True, choices=["live", "alt"])
    vws.set_defaults(fn=cmd_views)

    args = ap.parse_args()
    load_env()
    args.fn(args)


if __name__ == "__main__":
    main()

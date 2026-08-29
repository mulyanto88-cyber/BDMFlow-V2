# Postgres compatibility audit

Scope: every SQL template literal under `src/` — the 31 named queries in
`src/lib/query-registry.ts` plus the inline SQL in the API routes (~4,000 lines).
Run 2026-08-04 with `scratchpad/pg-compat.py`, entirely against source code and
the local Parquet backup. **Zero MotherDuck queries.**

Prerequisite for moving the serving layer to Supabase (task #27).

## Headline

The codebase uses **none** of the DuckDB features that would be genuinely hard
to port: no `QUALIFY`, no `GROUP BY ALL`, no `SELECT * EXCLUDE`, no
`first()`/`last()`, no `arg_max`/`arg_min`, no `list()`, no `datediff`, no
`epoch()`, no `ASOF JOIN`, no `SUMMARIZE`, no `read_parquet`. Everything found is
mechanical.

Better still, **every fix below was verified to run on DuckDB as well**, so the
SQL can be made dual-compatible in place. No fork, no parallel maintenance, and
each change can be tested against the current MotherDuck warehouse before
Supabase exists.

## Findings

| # | Issue | Sites | Fix | Verified on DuckDB |
|---|---|--:|---|---|
| 1 | `ORDER BY … DESC` NULL placement | 101 | append `NULLS LAST` | **done** 2026-08-04 |
| 2 | `DOUBLE` casts (`::DOUBLE` and `CAST(… AS DOUBLE)`) | 344 | codemod to `FLOAT8` | **done** 2026-08-04 |
| 3 | `ROUND(x, n)` on a double | 141 | `ROUND((x)::NUMERIC, n)` | **done** 2026-08-04 |
| 4 | Mixed-case column names | 187 | rename columns in the ETL — **no app edits** | **done** 2026-08-04 |
| 5 | `median()` | 3 | `percentile_cont(0.5) WITHIN GROUP (ORDER BY x)` | **done** 2026-08-04 |
| — | integer division | 6 | none needed — false positives (`* 100.0`) | — |

**All hard incompatibilities are now zero.** Final state: `tsc` clean, 48/48 API
endpoints healthy against MotherDuck, scanner reporting 0 hard sites.

The 187 mixed-case hits still show in the scanner because the *source text* keeps
writing `Date`, `Price` and friends capitalised. That is now harmless: the
warehouse columns are lower-case, and both engines fold an unquoted capitalised
name down to match. Verified in the live warehouse — `ksei.monthly_snapshot` 88
columns with only the deliberate `"Sec._Num"` left, `tb_stealth_accumulation` and
`tb_ksei_screener` fully lower-case.

Items 2 and 3 were applied with `scratchpad/pg-codemod.py`, which walks
parentheses rather than matching a regex: `ROUND(approx_quantile(score, 0.5), 1)`
has a comma inside its first argument, and a regex stopping at the first comma
would wrap the wrong half. It found **141** two-argument ROUNDs where the
scanner's regex saw 127. Afterwards `tsc` was clean and 48/48 API endpoints
answered healthily against MotherDuck.

Item 4 is patched in the ETL repo — `scripts/ksei_full.py` for the 88 columns of
`ksei.monthly_snapshot`, `refresh_materialized.yml` for the derived
`tb_stealth_accumulation` and `tb_ksei_screener` — and takes effect on the next
run. Verified offline against the Parquet backup: the app's existing capitalised,
unquoted references still resolve once the columns are lower-case, so no app
edits are needed. `"Sec._Num"` is deliberately left alone; the app never reads it
and the two views that do already quote it, which behaves identically on Postgres.

### 1. NULL ordering — the dangerous one

DuckDB sorts NULLs **last** in both directions. Postgres sorts them **last on
ASC but first on DESC**.

```
DuckDB    ORDER BY v DESC  ->  a(3), e(2), c(1), b(NULL), d(NULL)
Postgres  ORDER BY v DESC  ->  b(NULL), d(NULL), a(3), e(2), c(1)
```

Every `ORDER BY score DESC … LIMIT 10` over a nullable column — and most of these
scores arrive through `LEFT JOIN`, so they are nullable — would return rows of
NULLs where the top-ranked stocks should be. No error, plausible-looking output,
completely wrong ranking. This is the finding that matters most.

Fix: `ORDER BY v DESC NULLS LAST`. Needs judgement per site, not a blind codemod:
a few sorts may genuinely want NULLs first.

### 2. `::DOUBLE` — 337 sites

Postgres has no type called `DOUBLE`; it is `double precision`, alias `FLOAT8`.
DuckDB accepts `FLOAT8` too, so a single textual codemod `::DOUBLE` → `::FLOAT8`
fixes every site on both engines.

### 3. `ROUND(x, n)` — 127 sites

Postgres ships `round(numeric, int)` but **not** `round(double precision, int)`.
DuckDB has both, so this passes locally and fails on Supabase. Fix:
`ROUND(x::NUMERIC, n)`, which DuckDB also accepts.

### 4. Mixed-case columns — 187 sites, but zero app edits

Three KSEI tables inherit capitalised headers from KSEI's own files:

| table | mixed-case columns |
|---|--:|
| `ksei.monthly_snapshot` | 88 (`Date`, `Code`, `Type`, `Sec._Num`, `Price`, `Local_IS`, …) |
| `ksei.tb_stealth_accumulation` | 8 (`Code`, `Date`, `Price`, `Prev_Price`, …) |
| `ksei.tb_ksei_screener` | 7 (`Is_Split_Suspect`, `Top_Buyer`, …) |

Postgres folds an unquoted `Date` to `date`, so `SELECT Date FROM …` would fail
against a column actually named `Date`.

The cheap fix is **not** to quote 187 references. Rename the columns to
snake_case in the ETL: DuckDB resolves an unquoted `Date` against a column named
`date` just as Postgres does, so every existing reference keeps working
unchanged on both engines. One ETL change replaces 187 app edits.

Note `Sec._Num` contains a dot and needs quoting even today.

## Limits of this audit

- The scanner only reads SQL inside template literals. Clauses assembled at
  runtime (e.g. `${dateFilter.clause}`) are covered only where the fragment
  itself is a literal.
- Column names came from the local Parquet backup, a snapshot of 2026-08-04.
  Re-run after the ETL adds columns.
- Behavioural differences not covered here and worth testing on real data before
  cutover: string collation and sort order, `NULL` handling in string
  concatenation, and timestamp/timezone casting.
- Nothing was executed against Postgres. Every "verified" above means *verified
  to still work on DuckDB*; correctness on Postgres is reasoned from its
  documented behaviour, not measured.

## Suggested order

1. Fix #4 in the ETL first — it is one change and it unblocks the KSEI queries.
2. Codemod #2 and #3, then run the 48-endpoint sweep once against MotherDuck.
3. Work through #1 by hand, sort by sort.
4. Rewrite the 3 `median()` calls.
5. Only then stand up Supabase and repoint.

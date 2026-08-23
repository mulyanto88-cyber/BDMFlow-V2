// ============================================================
// scripts/fetch-all-logos.mjs
// Unduh SEMUA logo emiten saham IDX ke public/logos/{KODE}.png
// ============================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';

const OUT_DIR = join(process.cwd(), 'public', 'logos');
mkdirSync(OUT_DIR, { recursive: true });

const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };
const CONCURRENCY = 15;
const FORCE = process.argv.includes('--force');

async function getDbTickers() {
  const tickers = new Set();
  try {
    const raw = readFileSync('.env.local', 'utf8');
    let token = '';
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*MOTHERDUCK_TOKEN\s*=\s*(.*?)\s*$/);
      if (m) token = m[1].replace(/['"]/g, '');
    }
    if (token) {
      const pool = new pg.Pool({
        host: 'pg.us-east-1-aws.motherduck.com',
        port: 5432,
        user: 'postgres',
        password: token,
        database: 'md:',
        ssl: { rejectUnauthorized: true },
        max: 2,
        connectionTimeoutMillis: 30000,
      });

      const res1 = await pool.query('SELECT DISTINCT UPPER(TRIM(Code)) as code FROM ksei.monthly_snapshot WHERE LENGTH(TRIM(Code)) = 4');
      for (const r of res1.rows) {
        if (r.code && /^[A-Z]{4}$/.test(r.code)) tickers.add(r.code);
      }

      const res2 = await pool.query('SELECT DISTINCT UPPER(TRIM(kode_efek)) as code FROM ksei.data5_mutasi WHERE LENGTH(TRIM(kode_efek)) = 4');
      for (const r of res2.rows) {
        if (r.code && /^[A-Z]{4}$/.test(r.code)) tickers.add(r.code);
      }

      await pool.end();
      console.log(`[DB] ${tickers.size} kode saham dari database.`);
    }
  } catch (err) {
    console.warn(`[DB Warn] ${err.message}`);
  }
  return tickers;
}

async function getWikipediaTickers() {
  const tickers = new Set();
  try {
    const res = await fetch(
      'https://id.wikipedia.org/w/api.php?action=parse&page=' +
      encodeURIComponent('Daftar perusahaan yang tercatat di Bursa Efek Indonesia') +
      '&prop=wikitext&format=json&redirects=1',
      { headers: UA }
    );
    const j = await res.json();
    const text = j.parse?.wikitext?.['*'] || '';
    for (const raw of text.split('\n')) {
      const line = raw.trim();
      if (!line.startsWith('|')) continue;
      const cells = [];
      let rest = line;
      while (cells.length < 2) {
        const i = rest.indexOf('[[');
        if (i === -1) break;
        const k = rest.indexOf(']]', i);
        if (k === -1) break;
        cells.push(rest.slice(i + 2, k));
        rest = rest.slice(k + 2);
      }
      if (cells.length < 2) continue;
      const code = cells[0].split('|').pop().trim().toUpperCase();
      if (/^[A-Z]{4}$/.test(code)) {
        tickers.add(code);
      }
    }
    console.log(`[Wikipedia] ${tickers.size} kode emiten.`);
  } catch (err) {
    console.warn(`[Wikipedia Warn] ${err.message}`);
  }
  return tickers;
}

function getLocalTickers() {
  const tickers = new Set();
  if (existsSync('src/lib/company-names.ts')) {
    const content = readFileSync('src/lib/company-names.ts', 'utf8');
    const matches = content.match(/"([A-Z]{4})":/g) || [];
    for (const m of matches) {
      const code = m.replace(/[\":]/g, '');
      tickers.add(code);
    }
  }
  if (existsSync('scratch_fca_analysis_results.json')) {
    try {
      const fca = JSON.parse(readFileSync('scratch_fca_analysis_results.json', 'utf8'));
      for (const item of fca) {
        if (item.stock_code && /^[A-Z]{4}$/.test(item.stock_code)) {
          tickers.add(item.stock_code);
        }
      }
    } catch {}
  }
  console.log(`[Local] ${tickers.size} kode lokal.`);
  return tickers;
}

async function downloadLogo(code) {
  const pngPath = join(OUT_DIR, `${code}.png`);

  // Jika sudah ada file PNG dan bukan FORCE, lewati
  if (!FORCE && existsSync(pngPath) && statSync(pngPath).size > 100) {
    return { code, status: 'SKIPPED_PNG', size: statSync(pngPath).size };
  }

  // 1. Stockbit CDN
  try {
    const sbUrl = `https://assets.stockbit.com/logos/companies/${code}.png`;
    const res = await fetch(sbUrl, { headers: UA });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('image')) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 200 && buf.length < 250000) {
          writeFileSync(pngPath, buf);
          return { code, status: 'OK_STOCKBIT', size: buf.length };
        }
      }
    }
  } catch {}

  // 2. GoStock CDN
  try {
    const altUrl = `https://gostock.id/assets/img/logos/${code}.png`;
    const res = await fetch(altUrl, { headers: UA });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('image')) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 200 && buf.length < 250000) {
          writeFileSync(pngPath, buf);
          return { code, status: 'OK_GOSTOCK', size: buf.length };
        }
      }
    }
  } catch {}

  return { code, status: 'NOT_FOUND' };
}

async function main() {
  console.log('=== MEMULAI PENGUNDUHAN LOGO SEMUA SAHAM IDX ===');
  const allTickersSet = new Set();

  const [dbTickers, wikiTickers, localTickers] = await Promise.all([
    getDbTickers(),
    getWikipediaTickers(),
    Promise.resolve(getLocalTickers()),
  ]);

  for (const c of dbTickers) allTickersSet.add(c);
  for (const c of wikiTickers) allTickersSet.add(c);
  for (const c of localTickers) allTickersSet.add(c);

  const allTickers = Array.from(allTickersSet).sort();
  console.log(`\nTotal saham IDX yang diproses: ${allTickers.length} emiten\n`);

  let successCount = 0;
  let skippedCount = 0;
  let notFoundCount = 0;
  let totalBytes = 0;
  const notFoundList = [];

  let currentIndex = 0;
  const startTime = Date.now();

  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (currentIndex < allTickers.length) {
      const idx = currentIndex++;
      const code = allTickers[idx];
      const result = await downloadLogo(code);

      if (result.status.startsWith('OK_')) {
        successCount++;
        totalBytes += result.size;
        console.log(`[${idx + 1}/${allTickers.length}] ${code} -> OK (${(result.size / 1024).toFixed(1)} KB) via ${result.status.replace('OK_', '')}`);
      } else if (result.status.startsWith('SKIPPED')) {
        skippedCount++;
        totalBytes += result.size;
      } else {
        notFoundCount++;
        notFoundList.push(code);
      }
    }
  });

  await Promise.all(workers);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n================ RINGKASAN ================');
  console.log(`Total Emiten Diproses : ${allTickers.length}`);
  console.log(`Berhasil Diunduh Baru : ${successCount}`);
  console.log(`Sudah Ada Sebelumnya  : ${skippedCount}`);
  console.log(`Total Logo PNG Siap   : ${successCount + skippedCount} (${(((successCount + skippedCount) / allTickers.length) * 100).toFixed(1)}%)`);
  console.log(`Tidak Ditemukan       : ${notFoundCount}`);
  console.log(`Waktu Eksekusi        : ${duration} detik`);
  console.log('===========================================\n');
}

main();

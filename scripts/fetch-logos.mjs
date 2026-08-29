// ============================================================
// scripts/fetch-logos.mjs
// Unduh logo emiten IDX ke public/logos/{KODE}.{svg|png}
//
// Sumber (berurutan):
//   1. Infobox Wikipedia (logo = ...) — logo asli, bukan foto gedung
//   2. Wikidata P154 — file logo resmi yang dipakai Wikipedia
//   3. TradingView S3  — cadangan (SVG)
// Tanpa API key. Idempoten: file yang sudah ada dilewati (pakai --force untuk ulang).
// Jalankan:  node scripts/fetch-logos.mjs [--force]
// ============================================================
import { mkdirSync, existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const UA = { 'User-Agent': 'BDMFlowBot/1.0 (kontak: mulyanto.my88@gmail.com)' }
const OUT = join(process.cwd(), 'public', 'logos')
const FORCE = process.argv.includes('--force')
const MAX_BYTES = 150_000
const CONCURRENCY = 2
const DELAY_MS = 800

const STOCKS = [
  ['BBCA','Bank Central Asia'], ['BMRI','Bank Mandiri'], ['BBRI','Bank Rakyat Indonesia'], ['BBNI','Bank Negara Indonesia'],
  ['BRIS','Bank Syariah Indonesia'], ['BTPN','Bank BTPN'], ['ARTO','Bank Jago'], ['NISP','Bank OCBC NISP'],
  ['PNBN','Bank Pan Indonesia'], ['BJBR','Bank BJB'], ['BJTM','Bank Jatim'], ['BDMN','Bank Danamon'], ['MEGA','Bank Mega'], ['BBTN','Bank Tabungan Negara'],
  ['ADRO','Adaro Energy'], ['PTBA','Bukit Asam'], ['ITMG','Indo Tambangraya Megah'], ['UNTR','United Tractors'],
  ['INCO','Vale Indonesia'], ['ANTM','Aneka Tambang'], ['MDKA','Merdeka Copper Gold'], ['BRMS','Bumi Resources Minerals'],
  ['MEDC','Medco Energi'], ['PGAS','Perusahaan Gas Negara'], ['ELSA','Elnusa'], ['AKRA','AKR Corporindo'],
  ['BREN','Barito Renewables Energy'], ['AMMN','Amman Mineral Internasional'], ['DSSA','Dian Swastatika Sentosa'], ['BRPT','Barito Pacific'],
  ['TPIA','Chandra Asri Pacific'], ['CPIN','Charoen Pokphand Indonesia'], ['JPFA','Japfa Comfeed'], ['SIMP','Salim Ivomas Pratama'],
  ['TLKM','Telkom Indonesia'], ['ISAT','Indosat'], ['EXCL','XL Axiata'], ['TOWR','Sarana Menara Nusantara'],
  ['MTEL','Dayamitra Telekomunikasi'], ['TBIG','Tower Bersama Infrastructure'], ['GOTO','GoTo Gojek Tokopedia'], ['BUKA','Bukalapak'],
  ['EMTK','Elang Mahkota Teknologi'], ['MNCN','Media Nusantara Citra'], ['SCMA','Surya Citra Media'], ['MLPT','Multipolar Technology'],
  ['ICBP','Indofood CBP Sukses Makmur'], ['INDF','Indofood Sukses Makmur'], ['MYOR','Mayora Indah'], ['ULTJ','Ultrajaya Milk'],
  ['CMRY','Cisarua Mountain Dairy'], ['KLBF','Kalbe Farma'], ['SIDO','Industri Jamu dan Farmasi Sido Muncul'], ['UNVR','Unilever Indonesia'],
  ['HMSP','HM Sampoerna'], ['GGRM','Gudang Garam'], ['AMRT','Sumber Alfaria Trijaya'], ['ACES','Ace Hardware Indonesia'],
  ['MAPI','Mitra Adiperkasa'], ['ERAA','Erajaya Swasembada'], ['LPPF','Matahari Department Store'], ['RALS','Ramayana Lestari Sentosa'],
  ['AALI','Astra Agro Lestari'], ['LSIP','PP London Sumatra Indonesia'], ['SMAR','Sinar Mas Agro Resources'], ['ANJT','Austindo Nusantara Jaya'],
  ['BSDE','Bumi Serpong Damai'], ['CTRA','Ciputra Development'], ['PWON','Pakuwon Jati'], ['SMRA','Summarecon Agung'], ['ASRI','Alam Sutera Realty'],
  ['JSMR','Jasa Marga'], ['WIKA','Wijaya Karya'], ['PTPP','PP'], ['ADHI','Adhi Karya'], ['SMGR','Semen Indonesia'],
  ['INTP','Indocement Tunggal Prakarsa'], ['ASII','Astra International'], ['GIAA','Garuda Indonesia'],
  ['MIKA','Mitra Keluarga'], ['SILO','Siloam International Hospitals'], ['HEAL','Medikaloka Hermina'],
  ['ISSP','Steel Pipe Industry of Indonesia'], ['KRAS','Krakatau Steel'], ['INKP','Indah Kiat Pulp & Paper'], ['TKIM','Pabrik Kertas Tjiwi Kimia'],
]

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function getJson(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: UA })
    if (res.ok) return res.json()
    if (res.status === 429) { await sleep(2500 * (i + 1)); continue }
    throw new Error('HTTP ' + res.status)
  }
  throw new Error('HTTP 429 (rate limited)')
}

async function fileInfo(fileName) {
  // File logo perusahaan Indonesia sering di-host LOKAL di id.wikipedia
  // (fair-use), bukan di Commons. Coba id.wikipedia dulu, lalu Commons.
  for (const base of ['https://id.wikipedia.org/w/api.php', 'https://commons.wikimedia.org/w/api.php']) {
    const url = base + '?action=query&titles=File:' +
      encodeURIComponent(fileName) + '&prop=imageinfo&iiprop=url|size&format=json'
    const ii = await getJson(url)
    const page = Object.values(ii.query?.pages || {})[0]
    const info = page?.imageinfo?.[0]
    if (!info?.url) continue
    const ext = info.url.split('?')[0].split('.').pop().toLowerCase()
    if (ext !== 'svg' && ext !== 'png') return null
    if ((info.size || 0) > MAX_BYTES) return null
    return { url: info.url, ext }
  }
  return null
}

// 1. Infobox Wikipedia — baris "| logo = ..." berisi file logo asli perusahaan.
async function infoboxLogo(name) {
  try {
    const p = await getJson('https://id.wikipedia.org/w/api.php?action=parse&page=' +
      encodeURIComponent(name) + '&prop=wikitext&format=json&redirects=1')
    const text = p.parse?.wikitext?.['*'] || ''
    const findParam = (key) => {
      for (const raw of text.split('\n')) {
        const l = raw.trim()
        const rest = l.startsWith('|') ? l.slice(1).trim() : l
        if (rest === key || rest.startsWith(key + '=') || rest.startsWith(key + ' ')) {
          const eq = l.indexOf('=')
          if (eq !== -1) {
            const v = l.slice(eq + 1).trim()
            if (v) return v
          }
        }
      }
      return ''
    }
    let value = findParam('logo')
    if (!value) value = findParam('image') // sebagian infobox menaruh logo di param image
    if (!value) return null
    // Format: [[Berkas:X.svg|250px]] | Berkas:X.svg | X.png
    let file = value
    for (const tag of ['[[Berkas:', '[[File:', '[[Image:']) {
      if (file.startsWith(tag)) { file = file.slice(tag.length); break }
    }
    for (const pre of ['Berkas:', 'File:', 'Image:', 'berkas:', 'file:', 'image:']) {
      if (file.startsWith(pre)) { file = file.slice(pre.length); break }
    }
    file = file.replace('[[', '').replace(']]', '').split('|')[0].trim()
    const lower = file.toLowerCase()
    if (!(lower.endsWith('.svg') || lower.endsWith('.png'))) return null
    return await fileInfo(file)
  } catch (e) { console.warn('  [infobox warn]', name, String(e.message).slice(0, 80)) }
  return null
}

// 2. Wikidata P154.
async function wikidataLogo(name) {
  try {
    const s = await getJson('https://www.wikidata.org/w/api.php?action=wbsearchentities&search=' +
      encodeURIComponent(name) + '&language=id&format=json&limit=3')
    for (const hit of (s.search || [])) {
      const c = await getJson('https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=' + hit.id + '&property=P154&format=json')
      const file = c.claims?.P154?.[0]?.mainsnak?.datavalue?.value
      if (!file) continue
      const info = await fileInfo(file)
      if (info) return info
    }
  } catch (e) { console.warn('  [wikidata warn]', name, String(e.message).slice(0, 80)) }
  return null
}

// 3. TradingView — beberapa varian slug (tanpa regex).
const tvSlug = (s) => s.toLowerCase()
  .split(/[^a-z0-9]+/)
  .filter(w => w && w !== 'pt' && w !== 'tbk' && w !== 'persero')
  .join('-')

async function tradingviewLogo(name) {
  const slug = tvSlug(name)
  const variants = [slug]
  const noId = tvSlug(name.toLowerCase().replace('indonesia', ''))
  if (noId && noId !== slug) variants.push(noId)
  const first = name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)[0]
  if (first && !variants.includes(first)) variants.push(first)
  for (const s of variants) {
    const res = await fetch('https://s3-symbol-logo.tradingview.com/' + s + '.svg', { headers: UA })
    if (!res.ok) continue
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length <= MAX_BYTES) return { buffer: buf, ext: 'svg', source: 'tradingview' }
  }
  return null
}

async function processOne([code, name]) {
  const outSvg = join(OUT, code + '.svg')
  const outPng = join(OUT, code + '.png')
  if (!FORCE && (existsSync(outSvg) || existsSync(outPng))) { console.log('SKIP', code); return 'skip' }

  let hit = await infoboxLogo(name)
  if (!hit) hit = await wikidataLogo(name)
  if (hit) {
    const res = await fetch(hit.url, { headers: UA })
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length <= MAX_BYTES) {
        writeFileSync(join(OUT, code + '.' + hit.ext), buf)
        console.log('OK  ', code, hit.ext, '(', (buf.length / 1024).toFixed(1) + ' KB) wikipedia')
        return 'wikipedia'
      }
    }
  }

  const tv = await tradingviewLogo(name)
  if (tv) {
    writeFileSync(join(OUT, code + '.svg'), tv.buffer)
    console.log('OK  ', code, 'svg', '(', (tv.buffer.length / 1024).toFixed(1) + ' KB) tradingview')
    return 'tradingview'
  }

  console.log('MISS', code, '— monogram fallback')
  return 'missing'
}

mkdirSync(OUT, { recursive: true })
let idx = 0
let wiki = 0, tv = 0, miss = 0, skip = 0
const workers = Array.from({ length: CONCURRENCY }, async () => {
  while (idx < STOCKS.length) {
    const item = STOCKS[idx++]
    const r = await processOne(item)
    if (r === 'wikipedia') wiki++
    else if (r === 'tradingview') tv++
    else if (r === 'missing') miss++
    else skip++
    await sleep(DELAY_MS)
  }
})
await Promise.all(workers)
console.log('')
console.log('SELESAI — wikipedia: ' + wiki + ' | tradingview: ' + tv + ' | missing: ' + miss + ' | skip: ' + skip + ' | total: ' + STOCKS.length)
// scripts/gen-company-names.mjs
// Generate src/lib/company-names.ts dari 3 sumber:
//  1. daftar kurasi (86 saham besar)
//  2. data FCA lokal (scratch_fca_analysis_results.json)
//  3. Wikipedia: Daftar perusahaan yang tercatat di Bursa Efek Indonesia
import { readFileSync, writeFileSync } from 'node:fs'
const UA = { 'User-Agent': 'BDMFlowBot/1.0 (kontak: mulyanto.my88@gmail.com)' }
const CURATED = {
  BBCA: 'Bank Central Asia', BMRI: 'Bank Mandiri', BBRI: 'Bank Rakyat Indonesia', BBNI: 'Bank Negara Indonesia',
  BRIS: 'Bank Syariah Indonesia', BTPN: 'Bank BTPN', ARTO: 'Bank Jago', NISP: 'Bank OCBC NISP',
  PNBN: 'Bank Pan Indonesia', BJBR: 'Bank BJB', BJTM: 'Bank Jatim', BDMN: 'Bank Danamon', MEGA: 'Bank Mega', BBTN: 'Bank Tabungan Negara',
  ADRO: 'Adaro Energy', PTBA: 'Bukit Asam', ITMG: 'Indo Tambangraya Megah', UNTR: 'United Tractors',
  INCO: 'Vale Indonesia', ANTM: 'Aneka Tambang', MDKA: 'Merdeka Copper Gold', BRMS: 'Bumi Resources Minerals',
  MEDC: 'Medco Energi', PGAS: 'Perusahaan Gas Negara', ELSA: 'Elnusa', AKRA: 'AKR Corporindo',
  BREN: 'Barito Renewables Energy', AMMN: 'Amman Mineral Internasional', DSSA: 'Dian Swastatika Sentosa', BRPT: 'Barito Pacific',
  TPIA: 'Chandra Asri Pacific', CPIN: 'Charoen Pokphand Indonesia', JPFA: 'Japfa Comfeed', SIMP: 'Salim Ivomas Pratama',
  TLKM: 'Telkom Indonesia', ISAT: 'Indosat', EXCL: 'XL Axiata', TOWR: 'Sarana Menara Nusantara',
  MTEL: 'Dayamitra Telekomunikasi', TBIG: 'Tower Bersama Infrastructure', GOTO: 'GoTo Gojek Tokopedia', BUKA: 'Bukalapak',
  EMTK: 'Elang Mahkota Teknologi', MNCN: 'Media Nusantara Citra', SCMA: 'Surya Citra Media', MLPT: 'Multipolar Technology',
  ICBP: 'Indofood CBP Sukses Makmur', INDF: 'Indofood Sukses Makmur', MYOR: 'Mayora Indah', ULTJ: 'Ultrajaya Milk',
  CMRY: 'Cisarua Mountain Dairy', KLBF: 'Kalbe Farma', SIDO: 'Industri Jamu dan Farmasi Sido Muncul', UNVR: 'Unilever Indonesia',
  HMSP: 'HM Sampoerna', GGRM: 'Gudang Garam', AMRT: 'Sumber Alfaria Trijaya', ACES: 'Ace Hardware Indonesia',
  MAPI: 'Mitra Adiperkasa', ERAA: 'Erajaya Swasembada', LPPF: 'Matahari Department Store', RALS: 'Ramayana Lestari Sentosa',
  AALI: 'Astra Agro Lestari', LSIP: 'PP London Sumatra Indonesia', SMAR: 'Sinar Mas Agro Resources', ANJT: 'Austindo Nusantara Jaya',
  BSDE: 'Bumi Serpong Damai', CTRA: 'Ciputra Development', PWON: 'Pakuwon Jati', SMRA: 'Summarecon Agung', ASRI: 'Alam Sutera Realty',
  JSMR: 'Jasa Marga', WIKA: 'Wijaya Karya', PTPP: 'PP', ADHI: 'Adhi Karya', SMGR: 'Semen Indonesia',
  INTP: 'Indocement Tunggal Prakarsa', ASII: 'Astra International', GIAA: 'Garuda Indonesia',
  MIKA: 'Mitra Keluarga', SILO: 'Siloam International Hospitals', HEAL: 'Medikaloka Hermina',
  ISSP: 'Steel Pipe Industry of Indonesia', KRAS: 'Krakatau Steel', INKP: 'Indah Kiat Pulp & Paper', TKIM: 'Pabrik Kertas Tjiwi Kimia',
}

const map = {}
for (const [k, v] of Object.entries(CURATED)) map[k] = v

// 2. FCA lokal
try {
  const fca = JSON.parse(readFileSync('scratch_fca_analysis_results.json', 'utf8'))
  for (const r of fca) {
    if (r.stock_code && r.company_name && !map[r.stock_code]) map[r.stock_code] = r.company_name
  }
  console.log('after FCA:', Object.keys(map).length)
} catch (e) { console.log('FCA skip:', e.message) }

// 3. Wikipedia — daftar emiten IDX
const res = await fetch('https://id.wikipedia.org/w/api.php?action=parse&page=' +
  encodeURIComponent('Daftar perusahaan yang tercatat di Bursa Efek Indonesia') + '&prop=wikitext&format=json&redirects=1', { headers: UA })
const j = await res.json()
const text = j.parse?.wikitext?.['*'] || ''
console.log('wikitext length:', text.length)
let added = 0
for (const raw of text.split('\n')) {
  const line = raw.trim()
  if (!line.startsWith('|')) continue
  // ambil dua [[...]] pertama
  const cells = []
  let rest = line
  while (cells.length < 2) {
    const i = rest.indexOf('[[')
    if (i === -1) break
    const k = rest.indexOf(']]', i)
    if (k === -1) break
    cells.push(rest.slice(i + 2, k))
    rest = rest.slice(k + 2)
  }
  if (cells.length < 2) continue
  const code = cells[0].split('|').pop().trim()
  let name = cells[1].split('|')[0].trim()
  if (name.endsWith(' (perusahaan)')) name = name.slice(0, -' (perusahaan)'.length)
  if (!/^[A-Z]{4}$/.test(code)) continue
  if (name.length < 3) continue
  if (!map[code]) { map[code] = name; added++ }
}
console.log('added from Wikipedia:', added, '| total:', Object.keys(map).length)

// tulis TS
const lines = ['// Generated oleh scripts/gen-company-names.mjs — jangan edit manual.',
  '// Sumber: daftar kurasi + data FCA lokal + Wikipedia (daftar emiten BEI).',
  'export const COMPANY_NAMES: Record<string, string> = {']
for (const code of Object.keys(map).sort()) {
  const v = String(map[code]).replace(/\"/g, "'")
  lines.push('  "' + code + '": "' + v + '",')
}
lines.push('}')
writeFileSync('src/lib/company-names.ts', lines.join('\n'), 'utf8')
console.log('written src/lib/company-names.ts')
console.log('BMHS:', map['BMHS'] || '(tidak ada)')
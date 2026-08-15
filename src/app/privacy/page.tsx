import type { Metadata } from 'next'
import LegalPage, { Section, P } from '@/components/legal-page'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi — BDMFlow',
  description: 'Kebijakan privasi layanan BDMFlow IDX Flow Intelligence.',
}

export default function PrivacyPage() {
  return (
    <LegalPage title="Kebijakan Privasi" updated="15 Agustus 2026">
      <P>
        Privasi Anda penting bagi kami. Kebijakan ini menjelaskan data apa yang kami kumpulkan,
        bagaimana data digunakan, serta hak Anda atas data tersebut saat menggunakan BDMFlow.
      </P>

      <Section title="1. Data yang Kami Kumpulkan">
        <P>
          <strong>Data akun:</strong> alamat email dan nama yang Anda berikan saat mendaftar atau
          masuk (termasuk melalui Google). <strong>Data penggunaan layanan:</strong> daftar
          watchlist yang Anda simpan, preferensi tampilan, dan interaksi dengan fitur.
          <strong>Data analitik:</strong> statistik kunjungan anonim (halaman dibuka, perangkat,
          sumber kunjungan) yang dikumpulkan melalui Vercel Analytics. <strong>Penyimpanan
          lokal:</strong> preferensi kecil (tema, pencarian terakhir, status masa percobaan)
          disimpan di peramban Anda melalui localStorage.
        </P>
      </Section>

      <Section title="2. Data yang TIDAK Kami Simpan">
        <P>
          Kami tidak menyimpan data kartu kredit/debit atau kredensial pembayaran Anda. Seluruh
          proses pembayaran ditangani langsung oleh payment gateway pihak ketiga sesuai kebijakan
          privasinya masing-masing.
        </P>
      </Section>

      <Section title="3. Tujuan Penggunaan Data">
        <P>
          Data digunakan untuk: (a) menyediakan dan mempersonalisasi layanan (akun, watchlist,
          langganan); (b) mengelola masa percobaan dan status langganan; (c) memelihara keamanan
          dan mencegah penyalahgunaan; (d) menganalisis penggunaan untuk meningkatkan produk;
          (e) berkomunikasi terkait layanan (misalnya konfirmasi akun).
        </P>
      </Section>

      <Section title="4. Penyimpanan & Pihak Ketiga">
        <P>
          Data akun dan watchlist disimpan di Supabase (penyedia basis data dan autentikasi) pada
          infrastruktur yang dienkripsi. Analitik kunjungan diproses oleh Vercel. Data pasar saham
          yang ditampilkan diambil dari gudang data MotherDuck dan tidak mengandung data pribadi
          Anda. Kami memilih penyedia yang memiliki kebijakan keamanan memadai dan membatasi akses
          data Anda hanya untuk keperluan operasional layanan.
        </P>
      </Section>

      <Section title="5. Kami Tidak Menjual Data Anda">
        <P>
          Kami tidak menjual, menyewakan, atau memperdagangkan data pribadi Anda kepada pihak
          mana pun untuk keperluan periklanan atau komersial pihak ketiga.
        </P>
      </Section>

      <Section title="6. Cookie & Penyimpanan Lokal">
        <P>
          Layanan menggunakan localStorage peramban untuk preferensi (tema, pencarian terakhir)
          dan session Supabase untuk autentikasi. Anda dapat menghapus data ini kapan saja melalui
          pengaturan peramban; beberapa fitur (seperti tema yang tersimpan) akan kembali ke
          pengaturan awal.
        </P>
      </Section>

      <Section title="7. Keamanan">
        <P>
          Kami menerapkan langkah pengamanan yang wajar (enkripsi saat transit, kontrol akses,
          prinsip data minimal) untuk melindungi data Anda. Meski demikian, tidak ada metode
          transmisi atau penyimpanan elektronik yang sepenuhnya bebas risiko.
        </P>
      </Section>

      <Section title="8. Hak Anda">
        <P>
          Anda berhak meminta akses, perbaikan, atau penghapusan data pribadi Anda. Anda juga
          dapat menghapus akun Anda. Kirim permintaan melalui email di bagian Kontak; kami akan
          menanggapi maksimal 1&times;24 jam pada hari kerja.
        </P>
      </Section>

      <Section title="9. Perubahan Kebijakan">
        <P>
          Kebijakan ini dapat diperbarui sewaktu-waktu. Versi terbaru selalu tersedia di halaman
          ini beserta tanggal pembaruannya.
        </P>
      </Section>

      <Section title="10. Kontak">
        <P>
          Untuk pertanyaan privasi: <a href="mailto:mulyanto.my88@gmail.com" className="text-foreground underline underline-offset-2">mulyanto.my88@gmail.com</a>{' '}
          · WhatsApp <a href="tel:+6285782672208" className="text-foreground underline underline-offset-2">+62 857-8267-2208</a>.
        </P>
      </Section>
    </LegalPage>
  )
}

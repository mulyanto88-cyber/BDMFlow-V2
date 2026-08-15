import type { Metadata } from 'next'
import LegalPage, { Section, P } from '@/components/legal-page'

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan — BDMFlow',
  description: 'Syarat dan ketentuan penggunaan layanan BDMFlow IDX Flow Intelligence.',
}

export default function TermsPage() {
  return (
    <LegalPage title="Syarat & Ketentuan" updated="15 Agustus 2026">
      <P>
        Selamat datang di BDMFlow (&ldquo;Layanan&rdquo;), platform analitik data pasar saham
        Indonesia. Dengan mengakses atau menggunakan Layanan, Anda menyetujui syarat dan
        ketentuan berikut. Jika tidak setuju, mohon untuk tidak menggunakan Layanan.
      </P>

      <Section title="1. Deskripsi Layanan">
        <P>
          BDMFlow menyediakan data dan analitik pasar saham Indonesia (IDX) yang bersumber dari
          data publik, termasuk ringkasan transaksi broker, data kepemilikan KSEI, aliran dana
          asing, dan indikator turunan lainnya. Data disajikan dengan keterlambatan T+1 (satu
          hari bursa) dan hanya untuk tujuan informasi.
        </P>
      </Section>

      <Section title="2. Bukan Nasihat Keuangan">
        <P>
          Seluruh konten BDMFlow bersifat informatif dan edukatif, <strong>bukan</strong> nasihat
          investasi, rekomendasi jual/beli, atau ajakan bertransaksi efek apa pun. Setiap keputusan
          investasi adalah tanggung jawab Anda sepenuhnya. Kami tidak bertanggung jawab atas
          keuntungan maupun kerugian yang timbul dari penggunaan informasi dalam Layanan.
        </P>
      </Section>

      <Section title="3. Akun Pengguna">
        <P>
          Anda bertanggung jawab menjaga kerahasiaan kredensial akun serta semua aktivitas yang
          terjadi pada akun Anda. Data yang Anda berikan saat mendaftar harus akurat dan mutakhir.
          Anda dilarang berbagi akun untuk penggunaan komersial ulang atau membuat banyak akun
          untuk mengeksploitasi masa percobaan.
        </P>
      </Section>

      <Section title="4. Langganan & Pembayaran">
        <P>
          Paket Pro dikenakan biaya Rp 55.000 per bulan dan diproses melalui payment gateway pihak
          ketiga. Masa aktif bertambah sesuai periode yang dibayar. Kami tidak menyimpan data kartu
          atau kredensial pembayaran Anda; seluruh data pembayaran diproses oleh penyedia payment
          gateway sesuai kebijakannya masing-masing. Pembayaran yang telah berhasil pada umumnya
          tidak dapat dikembalikan (non-refundable), kecuali diwajibkan oleh hukum.
        </P>
        <P>
          Harga dapat berubah sewaktu-waktu dengan pemberitahuan terlebih dahulu melalui situs.
          Perubahan harga tidak berlaku surut terhadap masa aktif yang sudah dibayar.
        </P>
      </Section>

      <Section title="5. Masa Percobaan">
        <P>
          Pengguna baru mendapatkan masa percobaan 7 hari. Masa percobaan hanya dapat digunakan
          sekali per identitas pengguna. Kami berhak membatalkan masa percobaan apabila ditemukan
          indikasi penyalahgunaan.
        </P>
      </Section>

      <Section title="6. Akurasi & Ketersediaan Data">
        <P>
          Kami berupaya menyajikan data secara akurat dan tepat waktu, namun tidak memberikan
          jaminan apa pun atas kelengkapan, keakuratan, atau keandalan data. Data dapat mengalami
          keterlambatan, koreksi, atau ketidaksesuaian dengan sumber asli (IDX/KSEI). Layanan
          dapat mengalami gangguan, pemeliharaan, atau perubahan fitur tanpa pemberitahuan.
        </P>
      </Section>

      <Section title="7. Penggunaan yang Dilarang">
        <P>
          Anda tidak diperkenankan untuk: (a) menyalin, menjual kembali, mendistribusikan ulang,
          atau menerbitkan ulang data Layanan secara massal tanpa izin tertulis; (b) melakukan
          scraping otomatis di luar penggunaan wajar; (c) menggunakan Layanan untuk kegiatan yang
          melanggar hukum; (d) mengganggu keamanan atau ketersediaan Layanan.
        </P>
      </Section>

      <Section title="8. Hak Kekayaan Intelektual">
        <P>
          Seluruh elemen Layanan — termasuk nama, logo, desain, perangkat lunak, serta pengolahan
          data turunan — adalah milik BDMFlow dan dilindungi peraturan perundang-undangan yang
          berlaku. Data mentah dari sumber publik tetap menjadi milik pemiliknya masing-masing.
        </P>
      </Section>

      <Section title="9. Batasan Tanggung Jawab">
        <P>
          Sejauh diizinkan hukum, BDMFlow tidak bertanggung jawab atas kerugian langsung maupun
          tidak langsung — termasuk kerugian finansial, kehilangan keuntungan, atau kerugian data —
          yang timbul dari penggunaan atau ketidakmampuan menggunakan Layanan.
        </P>
      </Section>

      <Section title="10. Perubahan Ketentuan">
        <P>
          Kami dapat memperbarui syarat & ketentuan ini sewaktu-waktu. Versi terbaru selalu
          dipublikasikan di halaman ini; dengan tetap menggunakan Layanan setelah perubahan,
          Anda dianggap menyetujui ketentuan yang baru.
        </P>
      </Section>

      <Section title="11. Hukum yang Berlaku">
        <P>
          Ketentuan ini diatur oleh hukum Republik Indonesia. Setiap sengketa yang timbul akan
          diselesaikan secara musyawarah, dan apabila tidak tercapai kesepakatan, melalui
          pengadilan yang berwenang di Indonesia.
        </P>
      </Section>

      <Section title="12. Kontak">
        <P>
          Pertanyaan seputar ketentuan ini dapat dikirim ke{' '}
          <a href="mailto:mulyanto.my88@gmail.com" className="text-foreground underline underline-offset-2">mulyanto.my88@gmail.com</a>{' '}
          atau WhatsApp <a href="tel:+6285782672208" className="text-foreground underline underline-offset-2">+62 857-8267-2208</a>.
        </P>
      </Section>
    </LegalPage>
  )
}

import type { AgentInput, LabLogistics } from "./agent-types"

interface ActivityEquipment {
  items: { item: string; quantity: number; status: "available" | "limited" | "needs_order" | "out_of_stock" }[]
  setup: string[]
  safety: string[]
  labMessage: string
}

const EQUIPMENT_MAP: Record<string, ActivityEquipment> = {
  kinematics: {
    items: [
      { item: "Ticker timer (pita detak)", quantity: 6, status: "available" },
      { item: "Pita kertas ticker timer (roll)", quantity: 12, status: "limited" },
      { item: "Troli dinamika", quantity: 6, status: "available" },
      { item: "Rel presisi (1,2 m)", quantity: 3, status: "available" },
      { item: "Stopwatch digital", quantity: 12, status: "available" },
      { item: "Meteran (3 m)", quantity: 6, status: "available" },
      { item: "Bola pingpong", quantity: 12, status: "available" },
      { item: "Karbon kertas ticker (pack)", quantity: 3, status: "needs_order" }
    ],
    setup: [
      "Pasang rel presisi di atas meja praktikum dengan kemiringan 0° untuk percobaan GLB",
      "Siapkan ticker timer di ujung rel, pastikan pita kertas terpasang dengan benar",
      "Beri tanda 0 cm, 50 cm, dan 100 cm pada rel menggunakan spidol whiteboard",
      "Pastikan stopwatch berfungsi dan baterai tidak habis",
      "Siapkan 6 troli — beri label A1-A6 dan periksa rodanya berputar lancar",
      "Kalibrasi ticker timer: atur frekuensi 50 Hz (setiap 0,02 detik satu titik)"
    ],
    safety: [
      "Pastikan semua kabel ticker timer tidak terkelupas untuk menghindari sengatan listrik",
      "Jauhkan pita kertas dari sumber api",
      "Pastikan area sekitar rel bersih dari rintangan agar troli tidak jatuh",
      "Siswa dilarang berlari atau mendorong troli dengan kecepatan berlebihan",
      "Gunakan sepatu tertutup selama praktikum"
    ],
    labMessage: `Untuk praktikum Kinematika Grade ${7}-${12}:

Mohon siapkan 6 set ticker timer dan troli dinamika. Periksa stok pita kertas ticker — tersisa 8 roll dari pembelian terakhir. Jika kurang, segera order 3 pack karbon kertas ticker.

Paling penting: kalibrasi ticker timer sebelum praktikum. Setel ke 50 Hz dan uji coba dengan troli kosong.

Terima kasih!`
  },
  forces: {
    items: [
      { item: "Neraca digital (0,1 g accuracy)", quantity: 6, status: "available" },
      { item: "Set beban (10g - 500g)", quantity: 6, status: "limited" },
      { item: "Dinamometer (0-5 N)", quantity: 12, status: "available" },
      { item: "Katrol tunggal", quantity: 6, status: "available" },
      { item: "Tali nilon (3 mm × 5 m)", quantity: 3, status: "available" },
      { item: "Balok kayu (berbagai massa)", quantity: 6, status: "available" },
      { item: "Kertas pasir/amplas (lembar)", quantity: 6, status: "available" },
      { item: "Bidang miring (30°, 45°, 60°)", quantity: 3, status: "out_of_stock" }
    ],
    setup: [
      "Siapkan 6 stasiun praktikum dengan neraca digital dan dinamometer",
      "Set beban dikelompokkan berdasarkan massa: 10g, 20g, 50g, 100g, 200g, 500g",
      "Pasang katrol di ujung meja menggunakan clamp",
      "Siapkan balok kayu dengan berbagai massa dan permukaan (halus vs amplas)",
      "Bidang miring — set sudut 30°, 45°, dan 60° untuk percobaan gaya pada bidang miring"
    ],
    safety: [
      "Pastikan beban tidak dijatuhkan ke lantai — dapat merusak ubin dan membahayakan kaki",
      "Gunakan dinamometer dengan hati-hati — jangan melebihi kapasitas 5 N",
      "Tali nilon jangan dililitkan ke tangan",
      "Hati-hati dengan ujung kawat katrol yang tajam"
    ],
    labMessage: `Assalamu'alaikum, Lab Assistant.

Minggu ini praktikum Gaya — Grade ${7}-${9}.

Mohon periksa stok bidang miring — 3 set terakhir kelihatannya sudah tidak layak. Frame kayu ada yang retak. Jika ada, tolong siapkan yang masih bagus. 

Juga, tolong sortir set beban — beberapa beban 100g mungkin tercampur dengan set lain. Timbang ulang dan beri label.

Syukron.`
  },
  energy: {
    items: [
      { item: "Bola tenis", quantity: 12, status: "available" },
      { item: "Bola basket", quantity: 6, status: "available" },
      { item: "Meteran roll 5m", quantity: 6, status: "available" },
      { item: "Stopwatch digital", quantity: 12, status: "available" },
      { item: "Mobil mainan (wind-up)", quantity: 6, status: "limited" },
      { item: "Pegas (konstanta berbeda)", quantity: 12, status: "available" },
      { item: "Termometer digital", quantity: 6, status: "available" },
      { item: "Kalorimeter sederhana (gelas styrofoam)", quantity: 6, status: "available" }
    ],
    setup: [
      "Siapkan area jatuh bebas — beri tanda ketinggian 1m, 1.5m, 2m pada dinding",
      "Pasang meteran vertikal di dinding menggunakan selotip",
      "Siapkan stasiun energi kinetik dengan mobil mainan dan meteran horizontal",
      "Set up calorimeter stations: gelas styrofoam, termometer, air hangat"
    ],
    safety: [
      "Pastikan area jatuh bebas bebas dari orang",
      "Jangan melempar bola — jatuhkan saja",
      "Air hangat untuk kalorimeter maksimal 50°C — periksa suhu sebelum praktikum",
      "Bersihkan tumpahan air segera untuk menghindari terpeleset"
    ],
    labMessage: `Lab Assistant,

Praktikum Energi Grade ${10} minggu ini. Siapkan 6 set percobaan jatuh bebas dengan bola tenis dan basket.

Mohon cek mobil mainan wind-up — beberapa mungkin perlu diganti baterainya (atau winding mechanism-nya). Kalau ada yang rusak, beri tahu hari Selasa agar bisa cari alternatif.

Juga, pastikan air hangat tidak lebih dari 50°C — safety first.

Terima kasih.`
  },
  electricity: {
    items: [
      { item: "Baterai 1,5 V (D-cell)", quantity: 24, status: "available" },
      { item: "Bohlam 2,5 V (small)", quantity: 24, status: "available" },
      { item: "Fitting bohlam", quantity: 24, status: "available" },
      { item: "Kabel penghubung (banana plug)", quantity: 48, status: "limited" },
      { item: "Amperemeter DC", quantity: 12, status: "available" },
      { item: "Voltmeter DC", quantity: 12, status: "available" },
      { item: "Resistor (10Ω, 20Ω, 50Ω, 100Ω)", quantity: 24, status: "available" },
      { item: "Saklar SPST", quantity: 12, status: "available" },
      { item: "Multimeter digital", quantity: 6, status: "available" }
    ],
    setup: [
      "Siapkan 6 stasiun rangkaian listrik dengan papan breadboard",
      "Uji semua bohlam — ganti yang putus sebelum praktikum",
      "Kelompokkan resistor berdasarkan nilai dan label",
      "Periksa baterai dengan multimeter — tegangan harus 1,5 V ± 0,1 V",
      "Siapkan lembar instruksi rangkaian seri dan paralel"
    ],
    safety: [
      "Tegangan rendah (1,5-6 V) — aman, tapi tetap awasi siswa",
      "PERINGATAN: Jangan menghubungkan kutub baterai langsung tanpa beban (konsleting)",
      "Periksa kabel dari isolasi terkelupas",
      "Bohlam bisa panas — biarkan dingin sebelum disentuh",
      "Pastikan tangan kering saat merangkai komponen listrik"
    ],
    labMessage: `Dear Lab Assistant,

Minggu ini Grade ${10} praktikum Listrik — rangkaian seri dan paralel.

Mohon cek kabel banana plug — beberapa mungkin perlu disolder ulang. Kalau ada yang putus, tolong ganti.

Paling urgent: periksa semua bohlam 2,5V. Dari pengalaman, beberapa sering putus dalam penyimpanan.

Baterai tolong dites satu per satu dengan multimeter.

Jazakumullah khairan.`
  },
  waves: {
    items: [
      { item: "Slinky besar", quantity: 6, status: "available" },
      { item: "Ripple tank (tangki riak)", quantity: 3, status: "limited" },
      { item: "Motor vibrator untuk ripple tank", quantity: 3, status: "limited" },
      { item: "Sumber cahaya (overhead projector)", quantity: 3, status: "available" },
      { item: "Penggaris 30 cm", quantity: 12, status: "available" },
      { item: "Garpu tala (256 Hz, 512 Hz)", quantity: 6, status: "available" },
      { item: "Tali nilon 3m", quantity: 6, status: "available" }
    ],
    setup: [
      "Siapkan slinky di lantai — regangkan sekitar 3m untuk demonstrasi gelombang longitudinal",
      "Isi ripple tank dengan air setinggi 1-2 cm — pastikan level air rata",
      "Set up motor vibrator dan atur frekuensi",
      "Atur sumber cahaya di atas ripple tank untuk proyeksi bayangan",
      "Siapkan garpu tala dan palu pemukul"
    ],
    safety: [
      "Hati-hati dengan air di sekitar ripple tank — jauhkan dari peralatan listrik",
      "Slinky jangan ditarik melebihi batas elastis — bisa putus",
      "Garpu tala jangan dipukul terlalu keras",
      "Lantai licin karena air — segera lap tumpahan"
    ],
    labMessage: `Lab Assistant,

Praktikum Gelombang untuk Grade ${11} AS Level.

Tolong siapkan 3 ripple tank. Isi air 1-2 cm. Cek motor vibrator — mungkin perlu baterai baru.

Kalau ada slinky yang rusak, tolong report. Sisanya aman.

Pastikan area praktikum bebas dari kabel listrik di lantai karena akan ada air.

Syukron.`
  }
}

export async function generateLogistics(input: AgentInput): Promise<LabLogistics> {
  const key = input.topic.toLowerCase()
  let equipment: ActivityEquipment | undefined

  for (const [k, v] of Object.entries(EQUIPMENT_MAP)) {
    if (key.includes(k)) { equipment = v; break }
  }

  if (!equipment) {
    equipment = {
      items: [
        { item: "Papan tulis whiteboard", quantity: 1, status: "available" },
        { item: "Spidol whiteboard (set)", quantity: 6, status: "available" },
        { item: "Laptop + proyektor", quantity: 1, status: "available" },
        { item: "Alat tulis siswa", quantity: 30, status: "available" },
        { item: "Kertas HVS (rim)", quantity: 2, status: "available" }
      ],
      setup: [
        "Siapkan ruang kelas dalam formasi kelompok (4-5 siswa per kelompok)",
        "Pastikan proyektor berfungsi dan terhubung ke laptop guru",
        "Cetak worksheet untuk semua siswa (30 eksemplar)"
      ],
      safety: [
        "Prosedur standar ruang kelas berlaku"
      ],
      labMessage: `Praktikum ${input.topic} minggu ini bersifat demonstrasi di kelas — tidak perlu persiapan laboratorium khusus. Cukup siapkan proyektor dan alat tulis.`
    }
  }

  return {
    lab_required: true,
    equipment_list: equipment.items,
    setup_instructions: equipment.setup,
    safety_notes: equipment.safety,
    lab_technician_message: equipment.labMessage
  }
}

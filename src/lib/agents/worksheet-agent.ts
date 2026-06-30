import type { AgentInput, Worksheet, WorksheetLevel, WorksheetQuestion } from "./agent-types"

const EXAM_SOURCES_BY_GRADE: Record<number, string> = {
  7: "Cambridge Checkpoint 0893",
  8: "Cambridge Checkpoint 0893",
  9: "Cambridge IGCSE 0625",
  10: "Cambridge IGCSE 0625",
  11: "Cambridge AS Level 9702",
  12: "Cambridge A Level 9702"
}

interface TopicQuestionBank {
  level1: WorksheetQuestion[]
  level2: WorksheetQuestion[]
  level3: WorksheetQuestion[]
}

const QUESTION_BANKS: Record<string, TopicQuestionBank> = {
  kinematics: {
    level1: [
      {
        id: "k1-01",
        type: "multiple_choice",
        bloom: "remember",
        question: "Manakah dari berikut yang merupakan satuan SI untuk kecepatan?",
        options: ["m/s", "m/s²", "km/jam", "N/kg"],
        correct: "m/s",
        explanation: "Kecepatan dalam SI diukur dalam meter per detik (m/s). km/jam bukan satuan SI.",
        mark_scheme: "1 poin untuk jawaban benar (m/s)"
      },
      {
        id: "k1-02",
        type: "multiple_choice",
        bloom: "understand",
        question: "Seorang pelari menempuh jarak 100 meter dalam waktu 10 detik. Berapakah kelajuan rata-ratanya?",
        options: ["5 m/s", "10 m/s", "100 m/s", "0,1 m/s"],
        correct: "10 m/s",
        explanation: "v = s/t = 100/10 = 10 m/s",
        mark_scheme: "1 poin untuk jawaban benar (10 m/s)"
      },
      {
        id: "k1-03",
        type: "short_answer",
        bloom: "remember",
        question: "Apa perbedaan utama antara jarak (distance) dan perpindahan (displacement)?",
        mark_scheme: "1 poin: jarak adalah besaran skalar (hanya nilai), perpindahan adalah besaran vektor (nilai dan arah). 1 poin: menyebutkan jarak = total lintasan, perpindahan = posisi akhir - posisi awal."
      }
    ],
    level2: [
      {
        id: "k2-01",
        type: "long_answer",
        bloom: "analyze",
        question: "Sebuah mobil bergerak dengan kecepatan tetap 20 m/s selama 5 detik, kemudian dipercepat 2 m/s² selama 3 detik. Hitung:\n\na) Jarak total yang ditempuh mobil\nb) Kecepatan akhir mobil\nc) Buatlah grafik kecepatan-waktu untuk gerakan ini\n\nPetunjuk: Soal ini mengandung INTENTIONAL ERROR pada langkah tertentu — temukan dan perbaiki!",
        intentional_error: "Pada langkah (a), jika siswa lupa membedakan GLB dan GLBB dan menggunakan rumus s = vt untuk seluruh gerakan, hasilnya akan salah. GLB (20 m/s × 5 s = 100 m) harus dipisah dari GLBB (s = v₀t + ½at² = 20×3 + ½×2×9 = 60 + 9 = 69 m).",
        solution_steps: [
          "Bagian GLB: s₁ = v × t₁ = 20 × 5 = 100 m",
          "Bagian GLBB: v₀ = 20 m/s, a = 2 m/s², t₂ = 3 s",
          "s₂ = v₀t + ½at² = 20(3) + ½(2)(9) = 60 + 9 = 69 m",
          "s_total = s₁ + s₂ = 100 + 69 = 169 m",
          "Kecepatan akhir: v = v₀ + at = 20 + 2(3) = 26 m/s",
          "Grafik: linear horizontal 20 m/s dari t=0 ke t=5, lalu garis lurus naik ke 26 m/s dari t=5 ke t=8"
        ],
        mark_scheme: "a) 2 poin: s_total = 169 m. b) 1 poin: v = 26 m/s. c) 2 poin: grafik benar dengan sumbu berlabel dan skala tepat. 1 poin: mengidentifikasi intentional error.",
        peer_grade: true,
        exam_source: `${EXAM_SOURCES_BY_GRADE[10]} October 2023 Paper 2 Variant 2 (adapted)`
      },
      {
        id: "k2-02",
        type: "long_answer",
        bloom: "analyze",
        question: "Dua buah mobil, A dan B, bergerak saling mendekat. Mobil A bergerak dengan kecepatan 15 m/s dari kiri, dan mobil B bergerak dengan kecepatan 10 m/s dari kanan. Jarak awal antara kedua mobil adalah 500 meter.\n\na) Kapan dan di mana kedua mobil akan bertemu?\nb) Jika mobil A mulai bergerak 2 detik lebih dulu, bagaimana waktu pertemuan berubah?\n\n⚠️ Soal mengandung intentional error dalam penyelesaian yang disediakan — temukan!",
        intentional_error: "Kesalahan umum: menjumlahkan kecepatan tanpa memperhatikan arah relatif. Juga, pada bagian (b), siswa sering lupa memperhitungkan jeda 2 detik saat A sudah bergerak tapi B belum.",
        solution_steps: [
          "a) Kecepatan relatif = v_A + v_B = 15 + 10 = 25 m/s (saling mendekat)",
          "Waktu bertemu: t = s / v_rel = 500 / 25 = 20 detik",
          "Posisi dari A: s_A = 15 × 20 = 300 m dari kiri",
          "Posisi dari B: s_B = 10 × 20 = 200 m dari kanan",
          "b) Dalam 2 detik, A menempuh 15 × 2 = 30 m",
          "Sisa jarak = 500 - 30 = 470 m",
          "Waktu tersisa = 470 / 25 = 18,8 detik",
          "Total waktu dari awal A = 2 + 18,8 = 20,8 detik"
        ],
        mark_scheme: "a) 2 poin: t = 20 s, posisi = 300 m dari A. b) 2 poin: t = 20,8 s. 1 poin: mengidentifikasi error.",
        peer_grade: true,
        exam_source: `${EXAM_SOURCES_BY_GRADE[10]} March 2023 Paper 4 Variant 1 (adapted)`
      }
    ],
    level3: [
      {
        id: "k3-01",
        type: "experimental_design",
        bloom: "evaluate",
        question: "Fenomena: Sebuah bola tenis dan bola bowling dijatuhkan dari ketinggian yang sama secara bersamaan. Bola bowling mencapai tanah lebih dulu.\n\nTugas CER:\nCLAIM: Apakah pernyataan tersebut benar atau salah secara fisika? Jelaskan!\nEVIDENCE: Dukung claim-mu dengan hukum fisika dan perhitungan (abaikan hambatan udara untuk penyederhanaan).\nREASONING: Jika ada perbedaan waktu, faktor apa yang menyebabkannya? Jika tidak seharusnya, mengapa pengamatan sehari-hari sering menunjukkan hasil berbeda?\n\nEvalusai kelemahan dari percobaan ini sebagai model fisika!",
        phenomenon: "Bola bowling lebih berat dari bola tenis, tapi dalam vakum keduanya jatuh bersamaan.",
        mark_scheme: "CLAIM (2 poin): Menyatakan benar atau salah dengan justifikasi ilmiah. EVIDENCE (3 poin): Menggunakan h = ½gt², hitung waktu jatuh — tanpa hambatan udara, massa tidak mempengaruhi waktu. REASONING (3 poin): Udara menyebabkan hambatan — bola tenis lebih ringan, lebih terpengaruh. Evaluasi kelemahan (2 poin): Model mengabaikan hambatan udara yang signifikan untuk benda ringan.",
        model_answer: "CLAIM: Secara fisika, pernyataan itu salah dalam vakum — kedua bola akan jatuh bersamaan. Namun di dunia nyata, hambatan udara menyebabkan perbedaan kecil.\n\nEVIDENCE: h = ½gt² → t = √(2h/g). Percepatan gravitasi g = 9,8 m/s² KONSTAN untuk semua benda. Massa tidak muncul dalam rumus — jadi waktu jatuh TIDAK tergantung massa.\n\nREASONING: Di udara, bola tenis memiliki rasio luas permukaan terhadap massa yang lebih besar, sehingga hambatan udara lebih signifikan. Ini memperlambat bola tenis. Model fisika dasar (tanpa hambatan udara) adalah idealisasi — bagus untuk memahami prinsip dasar, tapi tidak sempurna untuk memprediksi situasi nyata.",
        derivation_method: "h = ½gt² → t = √(2h/g). Percepatan gravitasi g = 9,8 m/s² untuk semua massa. Bukti eksperimental: Apollo 15 — bulu dan palu jatuh bersamaan di Bulan."
      }
    ]
  },
  forces: {
    level1: [
      {
        id: "f1-01",
        type: "multiple_choice",
        bloom: "remember",
        question: "Hukum Newton I juga dikenal sebagai hukum...",
        options: ["Aksi-Reaksi", "Kelembaman (Inersia)", "Percepatan", "Gravitasi"],
        correct: "Kelembaman (Inersia)",
        explanation: "Hukum Newton I menyatakan benda cenderung mempertahankan keadaannya (diam atau bergerak lurus beraturan) — dikenal sebagai hukum inersia/kelembaman.",
        mark_scheme: "1 poin untuk jawaban benar"
      },
      {
        id: "f1-02",
        type: "multiple_choice",
        bloom: "understand",
        question: "Sebuah buku bermassa 2 kg diletakkan di atas meja. Berapakah gaya normal yang bekerja pada buku? (g = 9,8 m/s²)",
        options: ["0 N", "2 N", "19,6 N", "9,8 N"],
        correct: "19,6 N",
        explanation: "Gaya normal = berat = m × g = 2 × 9,8 = 19,6 N (ke atas).",
        mark_scheme: "1 poin untuk jawaban benar dengan satuan"
      },
      {
        id: "f1-03",
        type: "short_answer",
        bloom: "understand",
        question: "Sebutkan dan jelaskan tiga jenis gaya gesek!",
        mark_scheme: "1 poin per jenis gaya gesek yang disebut dan dijelaskan dengan benar: (1) Gesekan statis — benda diam, (2) Gesekan kinetis — benda bergerak, (3) Gesekan rolling/gelinding — benda menggelinding."
      }
    ],
    level2: [
      {
        id: "f2-01",
        type: "long_answer",
        bloom: "analyze",
        question: "Sebuah balok bermassa 5 kg ditarik dengan gaya horizontal 30 N di atas lantai kasar. Koefisien gesekan kinetis antara balok dan lantai adalah 0,2. (g = 10 m/s²)\n\na) Gambarkan diagram gaya bebas (free body diagram) balok!\nb) Hitung percepatan balok!\nc) Berapa jarak yang ditempuh balok dalam 4 detik jika gaya terus diberikan?\n\nPetunjuk: Soal mengandung intentional error — periksa apakah semua gaya sudah diperhitungkan!",
        intentional_error: "Siswa sering lupa menghitung gaya normal terlebih dahulu (N = mg), lalu gaya gesek (f = μN), sehingga percepatan yang dihitung terlalu besar. Juga, lupa bahwa gaya gesek mengurangi gaya total.",
        solution_steps: [
          "Identifikasi gaya: F_tarik = 30 N (horizontal), W = mg = 50 N (ke bawah), N (ke atas) = W = 50 N, f_gesek = μ × N = 0,2 × 50 = 10 N (berlawanan arah gerak)",
          "ΣF_x = F_tarik - f_gesek = 30 - 10 = 20 N",
          "a = ΣF / m = 20 / 5 = 4 m/s²",
          "s = v₀t + ½at² = 0 + ½(4)(16) = 32 m",
          "FBD: Panah ke kanan (30N), ke kiri (10N), ke atas (50N), ke bawah (50N)"
        ],
        mark_scheme: "a) 2 poin: FBD benar dengan 4 gaya. b) 2 poin: a = 4 m/s². c) 1 poin: s = 32 m. 1 poin: identifikasi error.",
        peer_grade: true,
        exam_source: `${EXAM_SOURCES_BY_GRADE[10]} IGCSE 0625 May 2023 Paper 3 (adapted)`
      }
    ],
    level3: [
      {
        id: "f3-01",
        type: "experimental_design",
        bloom: "evaluate",
        question: "Fenomena: Sebuah mobil yang melaju 72 km/jam direm mendadak dan berhenti setelah menempuh jarak 40 meter.\n\nTugas CER:\nCLAIM: Apakah jarak pengereman akan lebih panjang atau lebih pendek jika mobil membawa beban 500 kg? Jelaskan dengan konsep gaya, massa, dan percepatan!\nEVIDENCE: Gunakan hukum Newton II untuk membuktikan claim-mu.\nREASONING: Jelaskan faktor-faktor apa saja yang mempengaruhi jarak pengereman di dunia nyata — jangan hanya terbatas pada massa!",
        phenomenon: "Mobil bermuatan penuh membutuhkan jarak pengereman lebih panjang daripada mobil kosong.",
        mark_scheme: "CLAIM (2 poin): Menyatakan dengan benar pengaruh massa terhadap jarak pengereman lengkap dengan justifikasi. EVIDENCE (3 poin): Menggunakan F = ma, dengan F_rem tetap, jika m naik maka a (perlambatan) turun. Ditambah rumus v² = u² + 2as. REASONING (3 poin): Faktor lain — kondisi ban, permukaan jalan, kecepatan awal, cuaca, sistem ABS. 2 poin untuk evaluasi kritis.",
        model_answer: "CLAIM: Jarak pengereman akan LEBIH PANJANG jika mobil membawa beban 500 kg.\n\nEVIDENCE: F = ma → a = F/m. Gaya rem maksimum relatif konstan (terbatas oleh gesekan ban-jalan). Jika massa bertambah dari m menjadi m+500, percepatan (perlambatan) berkurang. v² = u² + 2as, dengan v=0 maka s = -u²/(2a). Jika a lebih kecil, s lebih besar.\n\nEvaluasi: Model ini mengasumsikan gaya rem konstan. Di dunia nyata, massa lebih besar → gaya normal lebih besar → gaya gesek maksimum lebih besar (f = μN). Jadi hubungannya tidak linear sederhana. Jalan basah, kondisi ban, dan sistem ABS juga mempengaruhi secara signifikan.",
        derivation_method: "v² = u² + 2as. v = 0, u = 72 km/jam = 20 m/s, s = 40 m. 0 = 400 + 2a(40) → a = -5 m/s². F_rem = ma = 1500 × 5 = 7500 N (untuk massa mobil ~1500 kg)."
      }
    ]
  },
  energy: {
    level1: [
      {
        id: "e1-01",
        type: "multiple_choice",
        bloom: "remember",
        question: "Hukum Kekekalan Energi menyatakan bahwa...",
        options: [
          "Energi dapat diciptakan dan dimusnahkan",
          "Energi tidak dapat diciptakan atau dimusnahkan, hanya berubah bentuk",
          "Energi selalu berkurang seiring waktu",
          "Energi hanya ada dalam satu bentuk"
        ],
        correct: "Energi tidak dapat diciptakan atau dimusnahkan, hanya berubah bentuk",
        explanation: "Hukum Kekekalan Energi: energi total dalam sistem terisolasi tetap konstan.",
        mark_scheme: "1 poin untuk jawaban benar"
      },
      {
        id: "e1-02",
        type: "multiple_choice",
        bloom: "understand",
        question: "Sebuah bola bermassa 0,5 kg dijatuhkan dari ketinggian 10 m. Berapakah energi potensial bola saat di puncak? (g = 10 m/s²)",
        options: ["5 J", "50 J", "0,5 J", "500 J"],
        correct: "50 J",
        explanation: "EP = mgh = 0,5 × 10 × 10 = 50 Joule",
        mark_scheme: "1 poin untuk jawaban benar"
      },
      {
        id: "e1-03",
        type: "short_answer",
        bloom: "understand",
        question: "Berikan 3 contoh perubahan energi dalam kehidupan sehari-hari! Tentukan bentuk energi awal dan akhir!",
        mark_scheme: "1 poin per contoh yang benar. Contoh: (1) Lampu — energi listrik → cahaya + panas, (2) Kipas angin — listrik → kinetik, (3) Makanan — kimia → panas + gerak."
      }
    ],
    level2: [
      {
        id: "e2-01",
        type: "long_answer",
        bloom: "analyze",
        question: "Sebuah roller coaster bermassa 500 kg meluncur dari titik A pada ketinggian 40 m. Lintasan berbentuk lingkaran vertikal dengan jari-jari 10 m di titik terendah. (g = 10 m/s², abaikan gesekan)\n\na) Hitung kecepatan roller coaster di titik terendah (titik B)!\nb) Hitung kecepatan roller coaster di puncak lingkaran (titik C)! \nc) Apakah roller coaster akan mencapai titik C? Buktikan dengan perhitungan!\n\n⚠️ Intentional error: Pada langkah (b), perhatikan bahwa titik C memiliki ketinggian 20 m dari titik B, bukan 40 m!",
        intentional_error: "Siswa sering menggunakan h = 40 m untuk semua perhitungan, padahal titik C hanya 20 m dari titik B (diameter lingkaran 20 m). Juga, lupa bahwa EP di A diubah menjadi EK + EP di setiap titik.",
        solution_steps: [
          "a) EP_A = mgh_A = 500 × 10 × 40 = 200.000 J",
          "Di B: EP_B = 0 (referensi), EK_B = EP_A = 200.000 J",
          "½mv_B² = 200.000 → v_B² = 800 → v_B = 28,28 m/s",
          "b) Di C: ketinggian = 20 m (diameter lingkaran = 2R = 20m)",
          "EP_C = mgh_C = 500 × 10 × 20 = 100.000 J",
          "EK_C = EP_A - EP_C = 200.000 - 100.000 = 100.000 J",
          "½mv_C² = 100.000 → v_C² = 400 → v_C = 20 m/s",
          "c) Syarat mencapai puncak lingkaran: v_min = √(gR) = √(10×10) = 10 m/s",
          "v_C = 20 m/s > 10 m/s, jadi roller coaster mencapai titik C dengan aman."
        ],
        mark_scheme: "a) 2 poin: v_B = 28,28 m/s. b) 2 poin: v_C = 20 m/s. c) 2 poin: perbandingan dengan v_min dan kesimpulan. 1 poin: identifikasi error.",
        peer_grade: true,
        exam_source: `${EXAM_SOURCES_BY_GRADE[11]} AS Level 9702 November 2022 Paper 4 (adapted)`
      }
    ],
    level3: [
      {
        id: "e3-01",
        type: "experimental_design",
        bloom: "evaluate",
        question: "Fenomena: Sebuah bola dijatuhkan dari ketinggian 2 meter. Setelah memantul, bola hanya mencapai ketinggian 1,2 meter.\n\nTugas CER:\nCLAIM: Apakah energi hilang saat bola memantul? Kemana perginya energi?\nEVIDENCE: Hitung energi potensial sebelum dan sesudah pantulan. Tentukan persentase energi yang 'hilang'.\nREASONING: Jelaskan konsep kekekalan energi — jika energi tidak hilang, dalam bentuk apa energi tersebut? Evaluasi model 'bola sempurna' vs 'bola nyata'!",
        phenomenon: "Bola memantul semakin rendah setiap kali menyentuh tanah.",
        mark_scheme: "CLAIM (2 poin): Energi TIDAK hilang — berubah bentuk. EVIDENCE (2 poin): EP_awal = mgh₁, EP_akhir = mgh₂, hitung rasio dan persentase. REASONING (3 poin): Energi berubah menjadi panas pada titik tumbukan + suara. Evaluasi (3 poin): Model bola ideal (pantulan sempurna) vs nyata (tidak elastis sempurna), koefisien restitusi.",
        model_answer: "CLAIM: Energi tidak hilang — energi mekanik berubah menjadi energi panas dan suara saat tumbukan.\n\nEVIDENCE: EP_awal = m × 9,8 × 2 = 19,6m J. EP_setelah = m × 9,8 × 1,2 = 11,76m J. Persentase energi mekanik tersisa = 11,76/19,6 × 100% = 60%. 'Hilang' 40%.\n\nREASONING: Hukum kekekalan energi tetap berlaku. Energi yang 'hilang' dari EP berubah menjadi: (1) panas — molekul bola dan lantai bergetar lebih cepat, (2) suara — gelombang bunyi. Model bola ideal mengabaikan deformasi dan pemanasan — ini penyederhanaan yang berguna untuk perhitungan awal tapi tidak akurat untuk situasi nyata. Koefisien restitusi e = √(h₂/h₁) = √(1,2/2) = 0,775.",
        derivation_method: "EP = mgh. Perbandingan EP setelah/before = h₂/h₁ (massa sama, g sama). Persentase 'kehilangan' = (1 - h₂/h₁) × 100% = 40%."
      }
    ]
  }
}

function findBank(topic: string): { bank: TopicQuestionBank; label: string } {
  const key = topic.toLowerCase()
  for (const [k, v] of Object.entries(QUESTION_BANKS)) {
    if (key.includes(k)) return { bank: v, label: k.charAt(0).toUpperCase() + k.slice(1) }
  }
  return {
    bank: {
      level1: [
        {
          id: "gen-l1-01",
          type: "multiple_choice",
          bloom: "remember",
          question: `Apa konsep utama dalam topik ${topic}?`,
          options: ["Konsep A", "Konsep B", "Konsep C", "Konsep D"],
          correct: "Konsep A",
          explanation: "Penjelasan singkat tentang konsep utama.",
          mark_scheme: "1 poin"
        }
      ],
      level2: [],
      level3: []
    },
    label: topic
  }
}

export async function generateWorksheet(input: AgentInput): Promise<Worksheet> {
  const { bank, label } = findBank(input.topic)
  const examRef = EXAM_SOURCES_BY_GRADE[input.grade] || "Cambridge IGCSE 0625"

  const levels: WorksheetLevel[] = [
    {
      level: 1,
      name: "Sanity Check",
      minutes: 10,
      questions: bank.level1.map(q => ({
        ...q,
        bloom: q.bloom as "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create"
      }))
    },
    {
      level: 2,
      name: "Productive Struggle",
      minutes: 20,
      questions: bank.level2.map(q => ({
        ...q,
        bloom: "analyze",
        exam_source: q.exam_source?.replace("adapted", `adapted for Grade ${input.grade} ${input.syllabus_ref}`)
      }))
    },
    {
      level: 3,
      name: "CER Challenge",
      minutes: 10,
      questions: bank.level3.map(q => ({
        ...q,
        bloom: "evaluate"
      }))
    }
  ]

  const title = `${label} — ${examRef} | Leveled Worksheet (Grade ${input.grade})`

  return { title, levels }
}

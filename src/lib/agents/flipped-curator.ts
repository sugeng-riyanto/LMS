import type { AgentInput, PreClassMaterial } from "./agent-types"

const VIDEO_LIBRARY: Record<string, { title: string; url: string; source: string; duration: number; concepts: string[] }> = {
  kinematics: {
    title: "Position, Velocity, and Acceleration | FuseSchool",
    url: "https://www.youtube.com/watch?v=QJDMQjK6jB0",
    source: "FuseSchool - Global Education",
    duration: 6,
    concepts: ["Displacement vs distance", "Velocity vs speed", "Acceleration", "Graphs of motion"]
  },
  forces: {
    title: "Forces and Newton's Laws of Motion | FuseSchool",
    url: "https://www.youtube.com/watch?v=5Z2q6MOhSPk",
    source: "FuseSchool - Global Education",
    duration: 8,
    concepts: ["Newton's First Law", "Newton's Second Law", "Newton's Third Law", "Free body diagrams"]
  },
  energy: {
    title: "Energy | FuseSchool",
    url: "https://www.youtube.com/watch?v=5L2kWMVFpOs",
    source: "FuseSchool - Global Education",
    duration: 7,
    concepts: ["Conservation of energy", "Kinetic energy", "Potential energy", "Energy transfers"]
  },
  waves: {
    title: "Wave Properties | FuseSchool",
    url: "https://www.youtube.com/watch?v=WCVU5RXX7zY",
    source: "FuseSchool - Global Education",
    duration: 6,
    concepts: ["Transverse waves", "Longitudinal waves", "Wavelength", "Frequency", "Amplitude"]
  },
  electricity: {
    title: "What is Electricity? | FuseSchool",
    url: "https://www.youtube.com/watch?v=zplsalylQpc",
    source: "FuseSchool - Global Education",
    duration: 7,
    concepts: ["Electric current", "Voltage", "Resistance", "Ohm's Law", "Series and parallel circuits"]
  },
  magnetism: {
    title: "Electromagnetism | FuseSchool",
    url: "https://www.youtube.com/watch?v=3Hj7mDbyTgs",
    source: "FuseSchool - Global Education",
    duration: 8,
    concepts: ["Magnetic fields", "Electromagnets", "Motor effect", "Generator effect"]
  },
  thermal: {
    title: "Thermal Energy | FuseSchool",
    url: "https://www.youtube.com/watch?v=9vjvzkS_2Tc",
    source: "FuseSchool - Global Education",
    duration: 6,
    concepts: ["Conduction", "Convection", "Radiation", "Specific heat capacity"]
  },
  pressure: {
    title: "Pressure in Fluids | FuseSchool",
    url: "https://www.youtube.com/watch?v=1zDMDk1Rc5M",
    source: "FuseSchool - Global Education",
    duration: 7,
    concepts: ["Pressure formula", "Atmospheric pressure", "Hydrostatic pressure", "Pascal's principle"]
  },
  density: {
    title: "Density | FuseSchool",
    url: "https://www.youtube.com/watch?v=1zDMDk1Rc5M",
    source: "FuseSchool - Global Education",
    duration: 5,
    concepts: ["Mass", "Volume", "Density formula", "Floating and sinking", "Archimedes' principle"]
  }
}

const SIMULATION_LIBRARY: Record<string, { title: string; url: string; instructions: string; questions: string[] }> = {
  kinematics: {
    title: "Moving Man Simulation",
    url: "https://phet.colorado.edu/sims/cheerpj/moving-man/latest/moving-man.html?simulation=moving-man",
    instructions: "Buka simulasi Moving Man. Setel posisi awal = 0 m, kecepatan awal = 0 m/s. Gunakan tombol 'play' untuk menggerakkan karakter. Coba kecepatan konstan, lalu percepatan konstan. Amati grafik posisi, kecepatan, dan percepatan yang terbentuk secara real-time.",
    questions: [
      "Apa bentuk grafik posisi-waktu untuk gerakan dengan kecepatan konstan?",
      "Apa yang terjadi pada grafik kecepatan jika karakter dipercepat?",
      "Bisakah kamu membuat grafik posisi berbentuk parabola? Bagaimana caranya?"
    ]
  },
  forces: {
    title: "Forces and Motion: Basics",
    url: "https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_all.html",
    instructions: "Pilih tab 'Net Force'. Letakkan beberapa orang di sisi kiri dan kanan. Amati resultan gaya. Lalu pilih tab 'Motion' — beri gaya pada peti dan amati hubungan gaya, massa, dan percepatan.",
    questions: [
      "Jika gaya yang diberikan sama, peti mana yang bergerak lebih cepat: peti ringan atau berat?",
      "Apa yang terjadi jika gaya total (net force) = 0?",
      "Bagaimana grafik kecepatan berubah jika gaya konstan diberikan?"
    ]
  },
  energy: {
    title: "Energy Skate Park: Basics",
    url: "https://phet.colorado.edu/sims/html/energy-skate-park-basics/latest/energy-skate-park-basics_all.html",
    instructions: "Pilih tab 'Playground'. Tempatkan pemain skateboard di titik awal yang tinggi. Aktifkan 'Bar Graph' dan 'Speed' untuk melihat energi dan kecepatan. Coba berbagai lintasan dan amati perubahan energi potensial dan kinetik.",
    questions: [
      "Apa yang terjadi pada energi potensial saat pemain menuruni lintasan?",
      "Di titik mana energi kinetik maksimum?",
      "Apakah energi total berubah? Mengapa atau mengapa tidak?"
    ]
  },
  waves: {
    title: "Wave on a String",
    url: "https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string_all.html",
    instructions: "Atur 'Oscillate' on, 'Amplitude' 0.5 cm, 'Frequency' 1 Hz. Amati gelombang yang merambat. Coba ubah frekuensi, amplitudo, dan redaman (damping). Bandingkan gelombang transversal dengan longitudinal.",
    questions: [
      "Apa pengaruh frekuensi terhadap panjang gelombang?",
      "Apa yang terjadi jika redaman (damping) diperbesar?",
      "Bisakah kamu membuat gelombang berdiri (standing wave)? Bagaimana?"
    ]
  },
  electricity: {
    title: "Circuit Construction Kit: DC",
    url: "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html",
    instructions: "Buat rangkaian seri sederhana dengan baterai, lampu, dan saklar. Tambahkan amperemeter dan voltmeter. Ukur arus dan tegangan. Kemudian ubah menjadi rangkaian paralel dan bandingkan.",
    questions: [
      "Bagaimana perbandingan arus di rangkaian seri vs paralel?",
      "Apa yang terjadi jika satu lampu dilepas di rangkaian seri? Di paralel?",
      "Bagaimana pengaruh penambahan resistor terhadap arus total?"
    ]
  },
  magnetism: {
    title: "Magnets and Electromagnets",
    url: "https://phet.colorado.edu/sims/html/magnets-and-electromagnets/latest/magnets-and-electromagnets_all.html",
    instructions: "Jelajahi medan magnet di sekitar magnet batang menggunakan kompas. Amati arah garis medan. Lalu buat elektromagnet dengan melilitkan kabel pada paku besi dan hubungkan ke baterai.",
    questions: [
      "Apa yang terjadi pada jarum kompas saat didekatkan magnet?",
      "Bagaimana cara memperkuat elektromagnet?",
      "Apa perbedaan medan magnet di sekitar magnet batang vs elektromagnet?"
    ]
  },
  thermal: {
    title: "Energy Forms and Changes",
    url: "https://phet.colorado.edu/sims/html/energy-forms-and-changes/latest/energy-forms-and-changes_all.html",
    instructions: "Pilih tab 'Systems'. Tempatkan pemanas di bawah bejana berisi air. Amati transfer energi. Coba berbagai bahan (besi, batu bata, aluminium) dan ukur perubahan suhu. Gunakan termometer untuk memonitor.",
    questions: [
      "Bahan mana yang paling cepat panas? Mengapa?",
      "Apa yang terjadi pada molekul air saat dipanaskan?",
      "Bagaimana perbandingan kapasitas panas spesifik berbagai bahan?"
    ]
  },
  pressure: {
    title: "Under Pressure",
    url: "https://phet.colorado.edu/sims/html/under-pressure/latest/under-pressure_all.html",
    instructions: "Tempatkan pressure gauge di berbagai kedalaman dalam fluida. Amati bagaimana tekanan berubah dengan kedalaman. Coba berbagai jenis fluida (air, minyak, madu). Ubah gravitasi dan lihat efeknya.",
    questions: [
      "Bagaimana tekanan berubah dengan bertambahnya kedalaman?",
      "Fluida mana yang memberikan tekanan terbesar di kedalaman sama?",
      "Apa hubungan antara densitas fluida dan tekanan?"
    ]
  },
  density: {
    title: "Density",
    url: "https://phet.colorado.edu/sims/html/density/latest/density_all.html",
    instructions: "Pilih tab 'Intro'. Masukkan berbagai benda ke dalam air dan amati apakah mengapung atau tenggelam. Hitung densitas setiap benda. Gunakan tabel densitas untuk mengidentifikasi bahan yang tidak diketahui.",
    questions: [
      "Benda dengan densitas seperti apa yang akan mengapung di air?",
      "Mengapa benda yang sama bisa mengapung di air garam tapi tenggelam di air tawar?",
      "Bagaimana cara mengukur densitas benda tidak beraturan?"
    ]
  }
}

export async function generatePreClass(input: AgentInput): Promise<PreClassMaterial> {
  const key = input.topic.toLowerCase()
  let video: typeof VIDEO_LIBRARY[string] | undefined
  let sim: typeof SIMULATION_LIBRARY[string] | undefined

  for (const [k, v] of Object.entries(VIDEO_LIBRARY)) {
    if (key.includes(k)) { video = v; break }
  }
  for (const [k, v] of Object.entries(SIMULATION_LIBRARY)) {
    if (key.includes(k)) { sim = v; break }
  }

  if (!video) {
    video = {
      title: `${input.topic} - Introduction | FuseSchool`,
      url: "https://www.youtube.com/results?search_query=" + encodeURIComponent(`${input.topic} physics fuse school`),
      source: "FuseSchool - Global Education",
      duration: 7,
      concepts: [input.topic]
    }
  }

  if (!sim) {
    sim = {
      title: `${input.topic} - Interactive Simulation`,
      url: "https://phet.colorado.edu/en/search?q=" + encodeURIComponent(input.topic),
      instructions: `Cari simulasi terkait ${input.topic} di PhET. Ikuti petunjuk dalam simulasi dan catat pengamatanmu.`,
      questions: [
        `Apa konsep utama dalam ${input.topic} yang kamu pelajari dari simulasi?`,
        "Buatlah satu prediksi sebelum menjalankan simulasi dan bandingkan dengan hasilnya.",
        "Bagaimana simulasi ini membantu memahami konsep fisika di baliknya?"
      ]
    }
  }

  const fillBlank1 = input.topic.toLowerCase()
  const blanks = [
    {
      prompt: `${input.topic} adalah cabang fisika yang mempelajari tentang ____. Konsep utamanya meliputi ____ dan ____.`,
      answer: `pergerakan/perubahan; besaran-besaran terkait; hubungan antarbesaran`
    },
    {
      prompt: `Dalam ${input.topic}, rumus yang paling sering digunakan adalah ____. Satuan SI untuk besaran ini adalah ____.`,
      answer: `rumus-rumus fisika sesuai konteks; satuan SI sesuai konteks`
    },
    {
      prompt: `Hukum/Konsep penting dalam ${input.topic}: ____. Contoh penerapannya dalam kehidupan sehari-hari adalah ____.`,
      answer: `hukum/konsep sesuai dengan topik; contoh aplikasi nyata`
    },
    {
      prompt: `Satu kesalahan umum (misconception) tentang ${input.topic} adalah ____, padahal sebenarnya ____.`,
      answer: `mitos/kesalahpahaman umum; penjelasan ilmiah yang benar`
    }
  ]

  return {
    video_resource: {
      title: video.title,
      url: video.url,
      source: video.source,
      duration_minutes: video.duration,
      key_concepts: video.concepts,
      watch_guide: `Tonton video dari menit 0:00 sampai selesai. Catat: (1) 3 konsep utama, (2) 1 hal yang sudah kamu tahu, (3) 1 hal yang baru kamu pelajari. Siapkan 1 pertanyaan untuk dibahas di kelas.`
    },
    interactive_simulation: {
      title: sim.title,
      url: sim.url,
      platform: "PhET Interactive Simulations, University of Colorado Boulder",
      instructions: sim.instructions,
      inquiry_questions: sim.questions
    },
    guided_notes: {
      title: `Guided Notes: ${input.topic} | Grade ${input.grade}`,
      fill_in_blanks: blanks,
      completed_example: `Setelah menonton video dan melakukan simulasi, lengkapi catatan terbimbing ini. Bandingkan jawabanmu dengan teman sekelas di awal pelajaran.`
    },
    entry_ticket_quiz: {
      questions: [
        {
          question: `Manakah pernyataan yang BENAR tentang ${input.topic}?`,
          options: [
            `Pernyataan A (jawaban benar)`,
            `Pernyataan B (distraktor masuk akal)`,
            `Pernyataan C (misconception umum)`,
            `Pernyataan D (distraktor kurang relevan)`
          ],
          correct: 0,
          explanation: `Penjelasan mengapa jawaban A benar dan opsi lainnya salah.`
        },
        {
          question: `Dalam ${input.topic}, besaran ____ diukur dalam satuan ____.`,
          options: [
            `opsi 1`,
            `opsi 2`,
            `opsi 3`,
            `opsi 4`
          ],
          correct: 0,
          explanation: `Penjelasan tentang satuan yang tepat.`
        },
        {
          question: `Berdasarkan simulasi yang kamu lakukan, apa yang terjadi jika ____?`,
          options: [
            `Prediksi A (benar)`,
            `Prediksi B (distraktor)`,
            `Prediksi C (distraktor)`,
            `Prediksi D (distraktor)`
          ],
          correct: 0,
          explanation: `Penjelasan berdasarkan hasil simulasi.`
        }
      ],
      passing_score: 2
    }
  }
}

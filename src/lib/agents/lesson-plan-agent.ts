import type { AgentInput, LessonPlan, LessonPlanPhase } from "./agent-types"

const TOPIC_PHYSICS: Record<string, { hook: string; myth: string; phenomenon: string }> = {
  "kinematics": {
    hook: "Bisakah seekor cheetah mengejar mobil yang melaju 100 km/jam? Mari kita hitung!",
    myth: "Banyak yang kira benda lebih berat jatuh lebih cepat — padahal tanpa hambatan udara, semua benda jatuh dengan percepatan yang sama (9.8 m/s²)!",
    phenomenon: "Mengapa astronot di ISS terlihat melayang padahal gravitasi di sana 90% dari gravitasi Bumi?"
  },
  "forces": {
    hook: "Kenapa pesawat terbang seberat 400 ton bisa tetap di udara?",
    myth: "Udara panas TIDAK membuat balon udara naik — perbedaan densitaslah penyebabnya!",
    phenomenon: "Sebuah telur bisa tenggelam di air tawar tapi mengapung di air garam — mengapa?"
  },
  "energy": {
    hook: "Apakah energi benar-benar bisa diciptakan? Spoiler: TIDAK!",
    myth: "Kita tidak 'menghabiskan' energi — kita hanya mengubahnya dari satu bentuk ke bentuk lain!",
    phenomenon: "Sebuah bola basket yang dijatuhkan tidak pernah memantul kembali ke tinggi awalnya — ke mana perginya energi?"
  },
  "waves": {
    hook: "Bagaimana paus biru bisa 'berbicara' dengan paus lain yang jaraknya ratusan kilometer?",
    myth: "Gelombang membawa energi, BUKAN materi — itulah kenapa kapal tidak ikut terbawa gelombang ke pantai!",
    phenomenon: "Mengapa langit berwarna biru di siang hari tapi merah saat matahari terbenam?"
  },
  "electricity": {
    hook: "Apa yang terjadi jika kita menyentuh stop kontak dengan garpu? (Jangan dicoba!)",
    myth: "Arus listrik mengalir dari positif ke negatif — padahal sebenarnya elektron bergerak dari negatif ke positif!",
    phenomenon: "Mengapa burung bisa bertengger di kabel listrik tegangan tinggi tanpa tersengat?"
  },
  "magnetism": {
    hook: "Bisakah kita membuat kereta yang melayang tanpa menyentuh rel?",
    myth: "Kutub utara kompas menunjuk ke Utara — tapi sebenarnya itu adalah kutub SELATAN magnet Bumi!",
    phenomenon: "Mengapa hard drive bisa kehilangan data jika didekatkan magnet kuat?"
  },
  "thermal": {
    hook: "Kenapa termos bisa menjaga kopi tetap panas selama 12 jam?",
    myth: "Jaket tidak menghangatkan tubuh — jaket menjebak panas tubuh agar tidak keluar!",
    phenomenon: "Mengapa minuman dalam kaleng aluminium lebih cepat dingin daripada dalam gelas kaca?"
  },
  "pressure": {
    hook: "Bagaimana pisau yang tajam bisa memotong lebih mudah daripada pisau tumpul?",
    myth: "Isapan sedotan bukan karena 'menarik' — tapi karena tekanan udara luar yang mendorong!",
    phenomenon: "Mengapa telinga kita terasa 'tersumbat' saat naik pesawat?"
  },
  "density": {
    hook: "Mengapa es batu mengapung di air padahal es adalah air yang sama?",
    myth: "Benda yang lebih besar belum tentu lebih berat — densitaslah yang menentukan!",
    phenomenon: "Mengapa kapal laut dari besi bisa mengapung tapi paku besi tenggelam?"
  }
}

function getTopicContent(topic: string): { hook: string; myth: string; phenomenon: string } {
  const key = topic.toLowerCase()
  for (const [k, v] of Object.entries(TOPIC_PHYSICS)) {
    if (key.includes(k)) return v
  }
  return {
    hook: `Apa yang akan terjadi jika ${topic} tidak ada di dunia ini?`,
    myth: "Mari kita bedah mitos umum seputar topik ini!",
    phenomenon: "Fenomena menarik apa yang bisa kita amati terkait konsep ini?"
  }
}

export async function generateLessonPlan(input: AgentInput): Promise<LessonPlan> {
  const content = getTopicContent(input.topic)
  const gradeLabel = `Grade ${input.grade}`
  const title = `${input.topic} — ${gradeLabel} | Flipped Classroom Lesson`

  const phases: LessonPlanPhase[] = [
    {
      phase: "Entry Ticket & Hook",
      minutes: 5,
      hook_question: content.hook,
      activity: `Siswa mengerjakan entry ticket quiz (3 soal pilihan ganda) tentang ${input.topic} secara individu. Guru menampilkan hook question dan memfasilitasi diskusi singkat. Gunakan polling interaktif untuk melihat prediksi awal siswa.`,
      mythbuster_or_analogy: content.myth,
      differentiation: "Siswa with IEP diberikan visual aid berupa concept map dan opsi menjawab secara lisan. Entry ticket disediakan dalam format digital dengan font yang dapat diperbesar."
    },
    {
      phase: "Productive Struggle",
      minutes: 20,
      activity: `Siswa bekerja dalam kelompok heterogen (3-4 orang) mengerjakan Level 2 worksheet tentang ${input.topic}. Setiap kelompok mendapat intentional error yang berbeda untuk diidentifikasi dan diperbaiki. Guru berkeliling memberikan scaffolding prompts.`,
      group_rule: "Setiap anggota harus berkontribusi minimal satu ide. Gunakan 'talking chips' — setiap bicara, serahkan chip. Jika chip habis, giliran anggota lain.",
      differentiation: "Support: Kartu prompt dengan langkah-langkah penyelesaian disediakan untuk kelompok yang membutuhkan. Challenge: Siswa advanced diberikan soal tanpa kerangka jawaban dan diminta membuat solusi alternatif.",
      peer_grading_instruction: "Setelah 15 menit, tukar jawaban antarkelompok. Gunakan rubrik: (1) Apakah variabel diidentifikasi dengan benar? (2) Apakah rumus tepat? (3) Apakah unit sesuai? Beri skor 1-4 dan tulis satu saran perbaikan."
    },
    {
      phase: "CER Challenge",
      minutes: 10,
      phenomenon: content.phenomenon,
      cer_template: `CLAIM: [Jawab pertanyaan fenomena dalam satu kalimat]

EVIDENCE: [Data/rumus/hasil perhitungan yang mendukung claim]
- Dari simulasi/percobaan: ...
- Dari perhitungan: ...
- Dari grafik/tabel: ...

REASONING: [Penjelasan ilmiah mengapa evidence mendukung claim]
- Konsep fisika yang relevan: ...
- Hubungan sebab-akibat: ...
- Prinsip/hukum yang mendasari: ...`,
      activity: `Guru menampilkan fenomena singkat terkait ${input.topic}. Siswa secara individu menulis CLAIM, EVIDENCE, dan REASONING dalam 10 menit. Dua relawan mempresentasikan jawabannya untuk diskusi kelas.`,
      differentiation: "Support: Sentence starters disediakan ('My claim is...', 'The evidence shows...', 'This happens because...'). Challenge: Siswa diminta mengevaluasi kelemahan dari reasoning mereka sendiri."
    },
    {
      phase: "Wrap-up & Mistake Journal",
      minutes: 5,
      reflection_prompt: `Tuliskan di Mistake Journal kamu:
1️⃣ Satu konsep dari ${input.topic} yang PALING membingungkan hari ini
2️⃣ Kesalahan apa yang kamu buat saat mengerjakan soal?
3️⃣ Dalam skala 1-5, seberapa paham kamu dengan topik ini? (lingkari)
4️⃣ Satu pertanyaan yang masih kamu miliki untuk pertemuan berikutnya

💡 "Mistakes are proof that you are trying."`,
      activity: `Siswa menulis refleksi singkat di Mistake Journal digital. Guru memberikan preview topik minggu depan dan mengingatkan siswa untuk menonton video pre-class.`,
      differentiation: "Siswa dapat memilih menulis atau merekam voice note untuk refleksinya. Prompt tambahan diberikan untuk siswa yang kesulitan mengartikulasikan pemikiran."
    }
  ]

  return {
    title,
    grade: input.grade,
    duration_minutes: 40,
    phases
  }
}

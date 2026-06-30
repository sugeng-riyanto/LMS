export function formatCERPrompt(phenomenon: string, grade: number): {
  claim: string
  evidence: string
  reasoning: string
} {
  const gradeLevel = grade <= 8 ? "basic" : grade <= 10 ? "intermediate" : "advanced"

  const templates: Record<string, { claim: string; evidence: string; reasoning: string }> = {
    basic: {
      claim: `Tuliskan CLAIM-mu dalam satu kalimat:\n"Menurut saya, [fenomena] terjadi karena...\n\nPetunjuk: Claim adalah jawabanmu terhadap pertanyaan fenomena. Harus spesifik dan bisa diuji!"`,
      evidence: `Kumpulkan EVIDENCE untuk mendukung claim-mu:\n1. Dari pengamatan: ____________________\n2. Dari perhitungan: ____________________\n3. Dari sumber/bacaan: ____________________\n\nPetunjuk: Evidence harus berupa data konkret — angka, fakta, atau hasil observasi!`,
      reasoning: `Tuliskan REASONING-mu:\n"Evidence di atas mendukung claim karena...\n\nPetunjuk: Reasoning menghubungkan evidence dengan claim menggunakan konsep fisika. Jelaskan HUBUNGAN SEBAB-AKIBAT-nya!"`
    },
    intermediate: {
      claim: `📝 CLAIM (1-2 kalimat):\nBerdasarkan fenomena: "${phenomenon}"\n\nTuliskan pernyataan yang menjawab pertanyaan utama. Claim harus:\n✅ Spesifik (bukan generalisasi)\n✅ Dapat diuji\n✅ Berdasarkan konsep fisika`,
      evidence: `📊 EVIDENCE (minimal 3 poin):\nKumpulkan bukti untuk mendukung claim-mu:\n• Data eksperimen/grafik: ____________________\n• Perhitungan/rumus: ____________________\n• Prinsip fisika yang relevan: ____________________\n\nTambahkan sketsa atau diagram jika diperlukan!`,
      reasoning: `🔗 REASONING (3-5 kalimat):\nJelaskan BAGAIMANA evidence-mu mendukung claim. Hubungkan dengan:\n1. Hukum/prinsip fisika yang mendasari\n2. Mekanisme sebab-akibat\n3. Mengapa penjelasan alternatif tidak tepat`
    },
    advanced: {
      claim: `CLAIM:\nFormulasikan pernyataan yang membedakan antara fenomena yang diamati dan prediksi teoretis. Sertakan batasan (limitation) dari claim-mu.`,
      evidence: `EVIDENCE:\nBerikan bukti kuantitatif dan kualitatif. Sertakan:\n• Data numerik dengan ketidakpastian\n• Analisis grafik (gradien, intercept)\n• Perbandingan dengan nilai teoretis\n• Persentase perbedaan/error`,
      reasoning: `REASONING:\nEvaluasi bagaimana evidence mendukung claim dengan mempertimbangkan:\n1. Kekuatan dan kelemahan evidence\n2. Asumsi yang dibuat\n3. Faktor-faktor yang mempengaruhi hasil\n4. Koneksi ke konsep fisika yang lebih luas\n5. Saran untuk penyelidikan lebih lanjut`
    }
  }

  return templates[gradeLevel] || templates.intermediate
}

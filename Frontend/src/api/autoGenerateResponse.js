import corpus from './corpus_final.json';

function buildKeywordIndex(corpus) {
  const arr = [];
  corpus.forEach(item => {
    item.keywords.forEach(keyword => {
      arr.push({
        keyword: keyword.toLowerCase(),
        intent: item.intent,
        context: item.context_for_indexing,
        response: item.response_to_display,
        followUps: item.follow_up_questions,
        followUpAnswers: item.follow_up_answers
      });
    });
  });
  return arr;
}

function getTypeFromIntent(intent) {
  if (/esteem|worth|insecure|imposter|self_care|self_blame|lack_of_support|depression|isolation|loneliness|validation|not valued|guilt|overthinking/i.test(intent)) return "validasi";
  if (/motivation|burnout|loss|stuck|semangat|direction|purpose|lack_of_direction|motivation_loss|motivasi/i.test(intent)) return "motivasi";
  if (/stress|anxiety|academic|overthinking|pressure|procrastination|focus|structure|identity|lab|task|deadline|financial|burnout|academic_stress|anxiety|pressure|overwhelmed/i.test(intent)) return "tips";
  if (/reflection|refleksi|identity_crisis|about_mindfulness|use_cases|limitations|general_wellbeing_check|self_care_neglect/i.test(intent)) return "edukasi";
  if (/relationship|peer|family|social|comparison|relasi|hubungan|relationship_issues|peer_pressure|family_pressure|comparison_trap/i.test(intent)) return "relasi";
  return "umum";
}

function findBestMatch(userMessage, keywordIndex) {
  const msg = userMessage.toLowerCase();
  // urutkan agar keyword yang lebih spesifik/mirip diprioritaskan
  const sorted = keywordIndex.slice().sort((a, b) => b.keyword.length - a.keyword.length);
  return sorted.find(item => msg.includes(item.keyword));
}

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Variasi template yang saling terkait (tidak kebalik)
const templates = {
  motivasi: [
    (k, ctx, resp) => `Langkahmu menghadapi "${k}" sangat berani. ${resp} Kadang memang berat, tapi ketekunanmu akan membuahkan hasil.`,
    (k, ctx, resp) => `Tidak semua orang berani terbuka soal "${k}". ${ctx} ${resp} Ingat, setiap usaha yang kamu lakukan itu penting.`,
    (k, ctx, resp) => `Apa yang kamu ceritakan soal "${k}" adalah bentuk keberanian. ${resp} Jangan lupa rayakan setiap progres-mu, sekecil apapun.`,
    (k, ctx, resp) => `Menghadapi "${k}" memang tidak mudah. ${ctx} Tapi kamu sudah membuktikan bisa bertahan. ${resp}`,
    (k, ctx, resp) => `Setiap orang punya proses berbeda dalam hal "${k}". ${resp} Percayalah, kamu sudah melakukan yang terbaik untuk dirimu sendiri.`,
    (k, ctx, resp) => `Ketika kamu berjuang menghadapi "${k}", itu adalah bukti bahwa kamu peduli dengan perkembangan dirimu. ${resp}`,
    (k, ctx, resp) => `Perjalananmu terkait "${k}" pasti penuh tantangan. ${ctx} Tapi setiap langkah kecil yang kamu ambil sangat berarti. ${resp}`,
    (k, ctx, resp) => `Kamu sudah membuktikan bahwa kamu tidak menyerah pada "${k}". ${resp} Satu langkah kecil setiap hari tetap berarti.`,
    (k, ctx, resp) => `Banyak orang juga merasa berat dalam urusan "${k}". ${ctx} ${resp} Kamu sudah luar biasa bertahan sejauh ini!`
  ],
  validasi: [
    (k, ctx, resp) => `Normal jika kamu merasa "${k}". ${ctx} ${resp} Perasaanmu sangat valid dan layak untuk diterima.`,
    (k, ctx, resp) => `Kamu tidak sendiri merasakan "${k}". ${resp} Banyak orang juga pernah di posisi itu dan bisa melalui masa sulitnya.`,
    (k, ctx, resp) => `Apa yang kamu sampaikan soal "${k}" sangat manusiawi. ${ctx} ${resp} Jangan terlalu keras pada diri sendiri.`,
    (k, ctx, resp) => `Mengakui perasaan seperti "${k}" adalah langkah awal yang baik. ${resp} Jika ingin berbagi lebih dalam, aku siap mendengarkan.`,
    (k, ctx, resp) => `Semua orang pasti pernah merasa "${k}". ${resp} Tidak apa-apa jika saat ini kamu sedang tidak baik-baik saja.`,
    (k, ctx, resp) => `Kadang kita hanya ingin didengar saat merasa "${k}". ${ctx} Aku di sini untukmu. ${resp}`
  ],
  tips: [
    (k, ctx, resp) => `Menghadapi "${k}" memang butuh strategi khusus. ${ctx} ${resp} Cobalah mulai dari langkah kecil yang bisa kamu lakukan sekarang.`,
    (k, ctx, resp) => `Jika "${k}" membuatmu kewalahan, jangan ragu minta bantuan atau dukungan. ${resp}`,
    (k, ctx, resp) => `Masalah "${k}" memang umum terjadi. ${resp} Coba buat to-do-list kecil agar kamu bisa lebih fokus satu persatu.`,
    (k, ctx, resp) => `Saat kamu mengalami "${k}", penting untuk mengatur waktu istirahat dan menentukan prioritas. ${resp}`,
    (k, ctx, resp) => `Jangan biarkan "${k}" membuatmu merasa sendirian. ${ctx} ${resp} Selalu ada cara untuk mulai kembali, meski pelan-pelan.`,
    (k, ctx, resp) => `Tekanan karena "${k}" bisa diredakan dengan berbagi cerita ke teman atau mengatur napas dalam. ${resp}`,
    (k, ctx, resp) => `Kalau merasa terjebak dengan "${k}", coba ubah metode atau suasana belajar/kerja. ${resp}`
  ],
  edukasi: [
    (k, ctx, resp) => `Pertanyaanmu tentang "${k}" sangat bagus! ${resp} Jika butuh penjelasan lebih detail, aku siap membantu.`,
    (k, ctx, resp) => `Info tentang "${k}" sangat penting untuk kesehatan mental. ${ctx} ${resp}`,
    (k, ctx, resp) => `Penjelasan ringkas seputar "${k}": ${resp} Jangan ragu untuk bertanya lebih lanjut.`,
    (k, ctx, resp) => `Senang sekali kamu ingin tahu lebih dalam soal "${k}". ${resp} Pengetahuan ini bisa membantu banyak orang.`,
    (k, ctx, resp) => `Bertanya tentang "${k}" adalah bentuk kepedulian pada diri sendiri. ${ctx} ${resp}`
  ],
  relasi: [
    (k, ctx, resp) => `Relasi soal "${k}" memang sering menyisakan perasaan campur aduk. ${resp} Kamu berhak mendapat dukungan yang sehat.`,
    (k, ctx, resp) => `Permasalahan "${k}" itu wajar dalam hubungan. ${ctx} ${resp} Jangan ragu untuk terbuka pada orang terdekat.`,
    (k, ctx, resp) => `Cerita tentang "${k}" sering terjadi di lingkungan sekitar kita. ${resp} Kamu tidak sendirian menghadapi hal ini.`,
    (k, ctx, resp) => `Jika kamu merasa berat dengan masalah "${k}", cobalah cerita ke teman atau keluarga yang kamu percaya. ${resp}`,
    (k, ctx, resp) => `Terkadang, support system sangat berarti saat kamu berhadapan dengan "${k}". ${ctx} ${resp}`
  ],
  umum: [
    (k, ctx, resp) => `${resp}`,
    (k, ctx, resp) => `Terima kasih sudah bercerita tentang "${k}". ${resp}`,
    (k, ctx, resp) => `Aku paham kekhawatiranmu soal "${k}". ${resp}`,
    (k, ctx, resp) => `Jangan lupa kasih ruang untuk dirimu sendiri, meski sedang menghadapi "${k}". ${resp}`,
    (k, ctx, resp) => `Aku siap membantu kapan saja kamu ingin membahas "${k}". ${resp}`,
    (k, ctx, resp) => `Semoga jawaban ini bisa membantu kamu menghadapi "${k}". ${resp}`
  ]
};

function autoGenerateResponse(userMessage, corpus = CORPUS_DATA) {
  const keywordIndex = buildKeywordIndex(corpus);
  const match = findBestMatch(userMessage, keywordIndex);
  if (!match) return null;

  const type = getTypeFromIntent(match.intent);
  const tmplArr = templates[type] || templates.umum;
  // Gabungkan context, response, dan keyword dengan urutan yang benar
  const finalText = randomPick(tmplArr)(match.keyword, match.context, match.response);

  return {
    text: finalText,
    followUps: match.followUps,
    followUpAnswers: match.followUpAnswers
  };
}

export { autoGenerateResponse };

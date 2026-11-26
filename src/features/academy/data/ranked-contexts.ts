import type {
  RankedContextProfile,
  SevenDimensionRow,
} from "../types/academy.types";

/**
 * Matriks 7 Dimensi Perbedaan Konteks Ranked (PRO_TO_RANKED_ADAPTATION.md — ADR-008).
 */
export const SEVEN_DIMENSION_MATRIX: readonly SevenDimensionRow[] = [
  {
    dimension: "1. Communication",
    proPlay: "Voice comms penuh, panggilan cooldown & posisi real-time.",
    FIVE_MAN: "Voice comms penuh (kualitas bergantung disiplin tim).",
    TRIO: "Voice comms untuk 3 pemain; 2 rekan mengandalkan ping/chat.",
    DUO: "Voice comms hanya 2 pemain; 3 rekan acak.",
    SOLO: "Tidak ada jaminan voice comms; murni minimap & ping.",
  },
  {
    dimension: "2. Coordination",
    proPlay: "Sinkronisasi lintas 5 role terlatih.",
    FIVE_MAN: "Tinggi bila sudah rutin bermain bersama.",
    TRIO: "Terpusat pada core triad (mis. Jungle–Mid–Roam).",
    DUO: "Terbatas pada sinergi pasangan (mis. Gold–Roam / Jungle–Roam).",
    SOLO: "Sangat rendah; koordinasi bersifat reaktif/oportunistik.",
  },
  {
    dimension: "3. Draft Control",
    proPlay: "Urutan pick/ban terencana, flex pick, analisis lawan.",
    FIVE_MAN: "Kontrol penuh komposisi & counter-pick tim.",
    TRIO: "Kontrol 3 dari 5 pick; 2 slot berisiko tumpang tindih.",
    DUO: "Kontrol 2 dari 5 pick; sulit menjamin win condition tim.",
    SOLO: "Kontrol hanya 1 pick; wajib memilih hero self-sufficient.",
  },
  {
    dimension: "4. Decision-Making",
    proPlay: "Dipimpin shotcaller dengan rencana makro jelas.",
    FIVE_MAN: "Ada shotcaller, namun eksekusi bisa terpecah saat tertekan.",
    TRIO: "3 pemain mengarahkan tempo mid-map & objektif.",
    DUO: "2 pemain menciptakan keunggulan lokal untuk memancing tim.",
    SOLO: "Keputusan mandiri berdasarkan pembacaan minimap pribadi.",
  },
  {
    dimension: "5. Risk Profile",
    proPlay: "Risiko terukur dengan rencana backup tim.",
    FIVE_MAN: "Risiko sedang-tinggi jika over-forcing tanpa vision.",
    TRIO: "Risiko muncul bila 2 pemain acak tidak merespons rotasi.",
    DUO: "Risiko tinggi bila mengandalkan follow-up dari 3 rekan acak.",
    SOLO: "Risiko sangat tinggi untuk strategi yang bergantung pada penyelamatan rekan.",
  },
  {
    dimension: "6. Strategy Viability",
    proPlay: "Taktik kompleks (lane swap, funnel, delayed freeze, cross-trade).",
    FIVE_MAN: "Hampir seluruh taktik pro dapat diadaptasi bertahap.",
    TRIO: "Cocok untuk kontrol mid-triangle, invasi terukur, & setup Turtle.",
    DUO: "Cocok untuk memenangkan 1–2 lane & pick-off berpasangan.",
    SOLO: "Fokus stabilitas laning, efisiensi farm, hindari blunder, & dampak mandiri.",
  },
  {
    dimension: "7. Execution",
    proPlay: "Presisi waktu hingga hitungan detik.",
    FIVE_MAN: "Membutuhkan latihan timing dan kejelasan tugas.",
    TRIO: "Bergantung pada keselarasan 3 pemain inti.",
    DUO: "Bergantung pada komunikasi dua arah yang ringkas.",
    SOLO: "Mengutamakan eksekusi sederhana, andal, dan tidak rapuh.",
  },
] as const;

export const ANTI_MISLEADING_GUARDRAILS = [
  "Strategi pro yang memerlukan voice comms 5 pemain (PRO_LEVEL_VOICE_REQUIRED) wajib ditandai NOT_RECOMMENDED atau HIGH_RISK di Solo Queue disertai alternatif aman.",
  "Prioritas pick/ban di panggung turnamen (MSC/MPL/M-Series) tidak otomatis optimal di Solo Rank jika kekuatannya bergantung pada peeling terkoordinasi.",
  "Seluruh materi di halaman ini adalah interpretasi strategis (STRATEGIC_INTERPRETATION) yang mengacu pada pola turnamen global, bukan jaminan win rate.",
  "Periksa kompatibilitas patch aktif sebelum menerapkan tempo objektif atau prioritas lane tertentu.",
] as const;

/**
 * 4 Profil Konteks Ranked terstruktur di TypeScript (ADR-008) beserta tips & trik per fase.
 */
export const RANKED_CONTEXTS: readonly RankedContextProfile[] = [
  {
    id: "SOLO",
    title: "Solo Rank Academy",
    shortLabel: "Solo Queue",
    coordinationLabel: "Tanpa Komunikasi Suara Terjamin",
    draftControlLabel: "Kontrol 1 dari 5 Pick",
    riskProfileLabel: "Risiko Tinggi pada Taktik Bergantung Rekan",
    focusSummary:
      "Mengutamakan hero mandiri (wave clear, mobilitas, atau pick-off), disiplin minimap, keputusan objektif anti-bunuh-diri, dan konsistensi ekonomi pribadi.",
    idealSynergyNote:
      "Jangan bergantung pada set-up sempurna rekan acak. Pilih hero yang tetap berguna saat tim tertinggal maupun unggul.",
    goldenRules: [
      "Asumsikan rekan tidak mendengar panggilanmu; baca pergerakan mereka di minimap lalu adaptasi tempo.",
      "Prioritaskan wave minion dan turret dibanding mengejar kill tanpa vision di jungle lawan.",
      "Jika kalah jumlah di area Turtle, tukar objektif di sisi berlawanan alih-alih memaksa kontes 1v3.",
    ],
    tips: [
      {
        id: "solo-draft-self-sufficient",
        phase: "DRAFT",
        title: "Prioritaskan Hero Mandiri (Self-Sufficient)",
        principle:
          "Di Solo Queue kamu hanya mengontrol 1 pick. Hero yang punya wave clear cepat, alat kabur, atau kemampuan menghentikan carry lawan lebih stabil dibanding hero yang butuh 2–3 pelindung.",
        actionSteps: [
          "Siapkan 2–3 hero nyaman per role utama agar fleksibel menyesuaikan draft rekan.",
          "Perhatikan kekurangan tim di pick ke-4/5: jika tim tanpa wave clear atau tanpa hard CC, tutup celah itu.",
          "Hindari memaksa pick pure-utility tanpa damage bila komposisi tim belum jelas sumber damage-nya.",
        ],
        commonMistake:
          "Meniru hero prioritas turnamen (mis. roamer/jungler murni utility) padahal tim Solo tidak memiliki follow-up sinkron.",
        recommendedRoles: "Semua Role (khususnya Jungler, Mid, Gold, EXP)",
      },
      {
        id: "solo-early-minimap-tempo",
        phase: "EARLY",
        title: "Aturan 3 Detik Minimap & Disiplin Plating Menit 0–5",
        principle:
          "Tanpa voice comms, minimap adalah satu-satunya sistem peringatan dini terhadap gank mid-trio lawan.",
        actionSteps: [
          "Cek posisi Mid dan Roam lawan setiap 3–5 detik; jika keduanya hilang dari mid, mundur ke jarak aman turret.",
          "Fokus last-hit minion dan manfaatkan gold shield turret lawan hanya saat jungler musuh terlihat di sisi peta berlawanan.",
          "Gunakan ping cepat ('Enemy Missing', 'Retreat', 'Gather') 5–10 detik sebelum rotasi, bukan setelah perang terjadi.",
        ],
        commonMistake:
          "Terus memukul turret gold lane saat Mid + Roam lawan tidak terlihat di peta sehingga terkena gank 3v1.",
      },
      {
        id: "solo-mid-cross-trade",
        phase: "MID",
        title: "Tukar Objektif Saat Kalah Jumlah (Anti-Coinflip)",
        principle:
          "Diambil dari prinsip Turtle Trade tim pro: ketika timmu terlambat berkumpul atau kalah posisi, kontes paksa justru memperlebar selisih gold.",
        actionSteps: [
          "Hitung jumlah rekan yang benar-benar bergerak ke Turtle/Lord di minimap sebelum masuk sungai.",
          "Jika kalah jumlah (mis. 2v4), segera dorong turret outer sisi berlawanan atau ambil camp jungle lawan yang kosong.",
          "Bersihkan wave mid terlebih dahulu sebelum bergerak membantu side lane agar turret tengah tidak jebol gratis.",
        ],
        commonMistake:
          "Melompat sendirian ke pit Turtle/Lord berharap 'curi Retribution' lalu mati dan memberi lawan objektif + turret.",
      },
      {
        id: "solo-late-death-timer",
        phase: "LATE",
        title: "Disiplin Death Timer & Pengelolaan Wave Menit 12+",
        principle:
          "Pada menit 12 ke atas, satu kematian solo tanpa vision sering kali langsung berujung kekalahan karena waktu respawn panjang dan Evolved Lord.",
        actionSteps: [
          "Jangan face-check bush gelap sendirian jika bermain Marksman, Mage, atau Assassin.",
          "Pastikan 2–3 lane sudah terdorong melewati sungai sebelum menantang Lord agar lawan terpaksa membagi fokus.",
          "Simpan Battle Spell defensif (Flicker/Purify) atau item cadangan (Immortality/Winter Crown) untuk teamfight penentu.",
        ],
        commonMistake:
          "Clearing minion terlalu maju di side lane sendirian saat Lord sudah hidup sehingga di-pick-off dan tim kalah 4v5.",
      },
    ],
  },
  {
    id: "DUO",
    title: "Duo Rank Academy",
    shortLabel: "Duo Rank",
    coordinationLabel: "Koordinasi Voice 2 Pemain",
    draftControlLabel: "Kontrol 2 dari 5 Pick",
    riskProfileLabel: "Rentan Jika Mengandalkan Follow-Up 3 Rekan Acak",
    focusSummary:
      "Menciptakan keunggulan lokal melalui sinergi pasangan (Jungle–Roam, Mid–Roam, atau Gold–Roam) yang bisa mengeksekusi pick-off dan kontrol lane secara mandiri.",
    idealSynergyNote:
      "Kombinasi paling konsisten di Duo adalah 1 inisiator/penjaga visi + 1 sumber damage/eksekutor (mis. Roam + Jungle atau Roam + Mid).",
    goldenRules: [
      "Pilih pasangan role yang memang sering berada di area peta yang sama sejak menit 1.",
      "Eksekusi gank yang bisa diselesaikan oleh damage 2 orang—anggap bantuan rekan acak sebagai bonus, bukan syarat wajib.",
      "Selaraskan timing recall & respawn kalian berdua agar tidak terpisah tempo.",
    ],
    tips: [
      {
        id: "duo-draft-pairing",
        phase: "DRAFT",
        title: "Pilih Pasangan Role dengan Interaksi Tinggi",
        principle:
          "Keunggulan Duo hilang bila kalian bermain di dua ujung peta terpisah (mis. EXP + Gold) tanpa interaksi 5 menit pertama.",
        actionSteps: [
          "Prioritaskan pasangan Jungle–Roam (kontrol objektif & invasi), Mid–Roam (rotasi cepat 2 sisi), atau Gold–Roam (menang lane mutlak).",
          "Pastikan pasangan kalian punya kombinasi lengkap: satu pemegang CC/vision dan satu pemegang burst/follow-up damage.",
          "Amankan setidaknya 1 sumber magic dan 1 physical bila bermain di dua role carry.",
        ],
        commonMistake:
          "Bermain Duo sebagai dua hero late-game pasif (mis. Marksman lemah early + Roam tanpa inisiasi) sehingga peta dikuasai lawan sejak menit awal.",
        recommendedRoles: "Jungle–Roam, Mid–Roam, atau Gold–Roam",
      },
      {
        id: "duo-early-shadow-gank",
        phase: "EARLY",
        title: "Rotasi Sinkron Menit 1–3 & Penguasaan Bush Sungai",
        principle:
          "Dua pemain dengan voice comms sudah cukup untuk memenangkan perebutan Lithowanderer atau memaksa Battle Spell lawan keluar di menit awal.",
        actionSteps: [
          "Roamer membuka vision di bush sungai dan menghitung waktu jungle clear rekan sebelum mengajak kontes.",
          "Tentukan target lane pertama bersama sejak loading screen (mis. incar Gold Laner lawan yang tanpa dash di menit 1:30).",
          "Komunikasikan cooldown skill kunci (Flicker/Ultimate lawan) secara singkat agar gank kedua 100% berbuah kill.",
        ],
        commonMistake:
          "Roamer memaksa engage sementara rekan Duo masih 1 camp tertinggal atau belum mencapai level 4.",
      },
      {
        id: "duo-mid-pickoff-trap",
        phase: "MID",
        title: "Perangkap Pick-Off Berdua Sebelum Objektif",
        principle:
          "Sebelum Turtle/Lord muncul, menghilangkan 1 core lawan lewat jebakan bush berdua jauh lebih mudah dikoordinasikan daripada teamfight 5v5 acak.",
        actionSteps: [
          "Dorong wave side lane untuk memancing Marksman/Mage lawan keluar membersihkan minion.",
          "Pasang posisi di jalur rotasi lawan (bush sungai atau gerbang jungle) 15 detik sebelum objektif muncul.",
          "Begitu 1 target tumbang, langsung ping 'Attack Turtle/Lord' agar 3 rekan acak ikut berkumpul.",
        ],
        commonMistake:
          "Mengejar kill terlalu dalam ke jungle musuh tanpa tahu posisi 4 lawan lainnya.",
      },
      {
        id: "duo-late-peel-or-dive",
        phase: "LATE",
        title: "Satu Tugas Jelas di Teamfight: Peel atau Dive Bersama",
        principle:
          "Di late game, Duo yang terpisah fokus (satu menyelam ke belakang, satu menjaga carry) sering membuat keduanya gagal.",
        actionSteps: [
          "Sepakati sebelum perang: apakah kalian melindungi carry utama dari Assassin lawan (peel) atau mengunci backline musuh bersamaan (dive).",
          "Hitung mundur singkat ('3-2-1 masuk') agar CC dan burst mendarat di frame yang sama sebelum lawan sempat menekan Winter Crown/Purify.",
          "Jika salah satu tumbang lebih dulu, segera beri info agar rekan satunya tidak memaksa 1v4.",
        ],
        commonMistake:
          "Inisiator langsung maju jauh di depan sementara rekan damage masih tertahan frontline lawan.",
      },
    ],
  },
  {
    id: "TRIO",
    title: "Trio Rank Academy",
    shortLabel: "Trio Rank",
    coordinationLabel: "Inti Rotasi Voice 3 Pemain",
    draftControlLabel: "Kontrol 3 dari 5 Pick (Core Triad)",
    riskProfileLabel: "Risiko Jika 2 Rekan Acak Terisolasi",
    focusSummary:
      "Menguasai poros Mid-Triangle (Jungle–Mid–Roam) seperti panggung MPL untuk mendikte tempo peta, setup Turtle/Lord, dan membuka ruang bagi 2 rekan acak.",
    idealSynergyNote:
      "Poros terkuat Trio adalah Jungle + Mid + Roam karena ketiganya mengendalikan tengah peta, sungai, dan arah gank ke EXP maupun Gold Lane.",
    goldenRules: [
      "Menangkan Mid Wave Priority terlebih dahulu—siapa clear mid lebih cepat, dialah yang pertama sampai di Gold/EXP Lane.",
      "Jangan paksa 2 rekan acak melakukan lane swap rumit; justru pakai Trio kalian untuk menyokong lane yang sedang unggul.",
      "Tutup ruang gerak jungler lawan di sekitar Turtle 20 detik sebelum spawn.",
    ],
    tips: [
      {
        id: "trio-draft-mid-triangle",
        phase: "DRAFT",
        title: "Kunci Poros Mid-Triangle (Jungle–Mid–Roam)",
        principle:
          "Di turnamen MPL maupun MSC, poros 3 pemain tengah menentukan tempo 0–8 menit. Menguasai 3 role ini di Trio memberi kendali peta terbesar.",
        actionSteps: [
          "Kombinasikan Mid dengan wave clear cepat + Roam pembuka vision/CC + Jungler yang selaras tempo (early invade atau objective secure).",
          "Sisakan fleksibilitas untuk 2 rekan acak di Gold/EXP agar mereka bisa memilih hero paling nyaman.",
          "Pastikan komposisi Trio sudah mencakup setidaknya 1 frontline atau 1 hard CC andal.",
        ],
        commonMistake:
          "Ketiga pemain Trio mengambil hero scaling lambat sekaligus sehingga seluruh jungle dan Turtle dikuasai lawan sebelum menit 5.",
        recommendedRoles: "Jungle + Mid Lane + Roam",
      },
      {
        id: "trio-early-wave-priority",
        phase: "EARLY",
        title: "Eksekusi Mid Priority → Gank 3v1 / 4v2",
        principle:
          "Pola standar tim pro: Roamer membantu Mid membersihkan wave 1 dengan cepat agar bisa langsung masuk sungai atau mengganggu buff/Gold Lane lebih dulu.",
        actionSteps: [
          "Detik 0:25–0:45: bantu Mid membersihkan wave pertama lalu segera geser ke sungai untuk vision Lithowanderer.",
          "Tentukan arah rotasi pertama (ke Gold Lane atau EXP Lane) bersamaan dengan selesainya rotasi buff Jungler menuju level 4.",
          "Berikan ping 'Launch Attack' 5 detik sebelum masuk ke lane rekan acak agar ia siap menahan wave dan ikut menyerang.",
        ],
        commonMistake:
          "Roamer terlalu lama diam di Gold Lane sejak detik awal sehingga Mid kalah clear dan Jungler terkena invasi tanpa bantuan.",
      },
      {
        id: "trio-mid-objective-zoning",
        phase: "MID",
        title: "Setup Area Turtle/Lord 20 Detik Lebih Awal",
        principle:
          "Tim pro jarang memperebutkan objektif secara 50-50; mereka merebut bush terlebih dahulu untuk memaksa lawan berjalan ke area gelap (face-check).",
        actionSteps: [
          "20 detik sebelum Turtle/Lord spawn, Mid dorong wave tengah lalu seluruh Trio masuk mengisi bush di sisi sungai musuh.",
          "Roamer menahan jalur masuk Jungler lawan (zoning), Mid menjaga poke area pit, Jungler fokus mengamankan Retribution.",
          "Jika lawan mengirim 5 orang sementara 2 rekan acak sedang push lane lain, tarik objektif (reset) atau tukar turret tanpa panik.",
        ],
        commonMistake:
          "Langsung memukul Turtle/Lord dengan HP setengah habis sementara posisi Jungler dan Mage burst lawan belum terlihat.",
      },
      {
        id: "trio-late-tempo-lock",
        phase: "LATE",
        title: "Kunci Tempo Peta & Dukung Rekan Acak yang Jadi Win Condition",
        principle:
          "Di late game, jika Marksman acak timmu sudah memiliki item penuh, tugas Trio bergeser menjadi perisai dan pembuka ruang baginya.",
        actionSteps: [
          "Gunakan Trio untuk menyinkronkan dorongan 2 wave sekaligus sebelum memicu teamfight Lord.",
          "Tetapkan satu orang dari Trio (Roam atau Mid) untuk mengawal Marksman acak bila Assassin lawan mengincarnya.",
          "Gunakan keunggulan voice Trio untuk memanggil 'Reset / Mundur' segera setelah turret inhibitor jatuh agar tidak terkena comeback wipe-out.",
        ],
        commonMistake:
          "Trio terlalu asyik bermain bertiga mengejar kill hingga meninggalkan Marksman tim sendirian di belakang.",
      },
    ],
  },
  {
    id: "FIVE_MAN",
    title: "5-Man Squad Academy",
    shortLabel: "5-Man Squad",
    coordinationLabel: "Koordinasi Penuh 5 Pemain (Voice)",
    draftControlLabel: "Kontrol Penuh 5 Pick & Ban",
    riskProfileLabel: "Risiko Over-Forcing Jika Shotcall Terpecah",
    focusSummary:
      "Menerapkan prinsip makro kompetitif secara utuh: arsitektur draft, pembagian shotcaller, wave cutting & freeze, cross-map trade, dan disiplin siege High-Ground.",
    idealSynergyNote:
      "Di 5-Man, kalian akan bertemu squad 5-Man terorganisir lain. Kemenangan paling sering ditentukan oleh kualitas draft, disiplin vision, dan satu suara shotcaller.",
    goldenRules: [
      "Tentukan struktur shotcall jelas: 1 suara utama untuk tempo Early (biasanya Roam/Jungle) dan 1 suara pengambil keputusan akhir Mid/Late.",
      "Setiap draft wajib menjawab 4 syarat: Wave Clear, Frontline/Vision, Sumber Damage Campuran, dan Win Condition yang jelas.",
      "Jangan mulai teamfight 5v5 hanya karena ingin bertarung—setiap perang harus punya tujuan (objektif, turret, atau zona jungle).",
    ],
    tips: [
      {
        id: "five-draft-architecture",
        phase: "DRAFT",
        title: "Arsitektur Draft: Flex Pick, Win Condition, & Counter",
        principle:
          "Dalam turnamen resmi MPL dan MSC, draft bukan sekadar memilih 5 hero kuat individu, melainkan menyusun 5 hero yang memiliki garis waktu power spike selaras.",
        actionSteps: [
          "Buka fase pertama dengan hero fleksibel (bisa 2 role/lane) agar lawan sulit membaca komposisi kalian.",
          "Tentukan apakah komposisi kalian bermain tempo cepat (snowball early), front-to-back teamfight, atau pick-off/split push.",
          "Simpan pick ke-4 atau ke-5 untuk counter spesifik lane/komposisi lawan (mis. anti-dash atau anti-sustain).",
        ],
        commonMistake:
          "Draft berisi 5 hero kuat individu tetapi tanpa wave clear atau tanpa pembuka vision sehingga buntu saat bertahan maupun siege.",
        recommendedRoles: "Seluruh 5 Role Terpadu",
      },
      {
        id: "five-early-exp-cut-and-swap",
        phase: "EARLY",
        title: "Sinkronisasi EXP Wave Cut & Transisi Menit ke-5",
        principle:
          "Tim pro memanfaatkan keunggulan tempo EXP Laner (memotong wave sebelum Turtle) untuk menciptakan pertarungan 4v3 atau 5v4 di pit objektif.",
        actionSteps: [
          "EXP Laner mengejar level 4 sebelum menit 2:00 dan memotong wave hanya saat Mid+Roam memberi info posisi musuh aman.",
          "Jika matchup Gold Lane kalah berat, siapkan pertukaran lane (lane swap) atau rotasi penuh setelah turret shield menit ke-5 hilang.",
          "Catat timer Battle Spell kunci lawan (Flicker 120 dtk, Purify 90 dtk) di voice agar menjadi target utama rotasi berikutnya.",
        ],
        commonMistake:
          "EXP Laner memotong wave tanpa informasi posisi Jungler/Mid lawan sehingga mati gratis sebelum Turtle muncul.",
      },
      {
        id: "five-mid-freeze-and-starve",
        phase: "MID",
        title: "Kontrol Map, Starving Jungle, & Cross-Map Trade",
        principle:
          "Saat unggul 2.000–3.000 gold, tim pro tidak terburu-buru menabrak base turret—mereka menguasai 3 lane dan menyapu seluruh jungle lawan.",
        actionSteps: [
          "Setelah outer turret jatuh, pindahkan Gold Laner ke Mid agar aman sambil membuka ruang Roam+Mid menguasai bush jungle musuh.",
          "Ambil buff lawan tepat pada timer respawn untuk mencekik ekonomi Jungler musuh.",
          "Jika kalah setup di satu sisi peta, lakukan panggilan serentak untuk cross-map trade (turret + jungle sisi berlawanan).",
        ],
        commonMistake:
          "Memaksa dive ke inner/base turret tanpa Lord saat masih banyak spell lawan aktif, memicu shutdown bounty dan membalikkan keadaan.",
      },
      {
        id: "five-late-lord-dance-siege",
        phase: "LATE",
        title: "Lord Dance, Zoning Retribution, & 3-Lane High-Ground Siege",
        principle:
          "Penutupan game di panggung turnamen dunia selalu dimulai dari sinkronisasi wave 3 lane bersamaan dengan kedatangan Lord agar lawan tidak sempat membersihkan semua sisi.",
        actionSteps: [
          "Gunakan 'Lord Dance' (memancing Lord lalu berhenti memukul untuk menjebak tim lawan yang memaksa masuk sungai).",
          "Tugaskan Roam/EXP menjaga jalur masuk Jungler musuh agar Jungler tim tidak perlu adu 50-50 Retribution.",
          "Saat mendorong bersama Lord, tahan 2 lane lain agar tiba di base turret pada detik yang sama—jangan serang base turret sebelum wave masuk serentak.",
        ],
        commonMistake:
          "Menyerang 1 lane saja secara terburu-buru sementara 2 lane lain kosong sehingga Mage lawan mudah membersihkan seluruh wave.",
      },
    ],
  },
] as const;

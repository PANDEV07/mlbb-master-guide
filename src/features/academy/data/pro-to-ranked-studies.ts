import type { ProToRankedCaseStudy } from "../types/academy.types";

/**
 * Studi Adaptasi Strategi Turnamen Global → Ranked (Solo / Duo / Trio / 5-Man).
 * Mematuhi AGENTS.md §4 (5 Pertanyaan Inti) & PRO_TO_RANKED_ADAPTATION.md §3 (Anti-Misleading Guardrails).
 * Klasifikasi: STRATEGIC_INTERPRETATION (pola taktis lintas turnamen global, bukan klaim angka skor/VOD per-game).
 */
export const PRO_TO_RANKED_STUDIES: readonly ProToRankedCaseStudy[] = [
  {
    id: "mid-trio-wave-priority",
    title: "Kontrol Mid-Trio & Wave Priority Menit 1–3",
    category: "ROTATION",
    coordinationRequirement: "HIGH",
    tournamentCircuits: [
      "MPL Indonesia (COMP009–COMP010)",
      "MPL Philippines (COMP011–COMP012)",
      "MSC at Esports World Cup (COMP001)",
    ],
    references: [
      {
        label: "Portal Resmi MPL Indonesia",
        region: "Indonesia / SEA",
        url: "https://id-mpl.com/statistics",
        sourceTier: "TIER_1_OFFICIAL",
      },
      {
        label: "Portal Resmi MPL Philippines",
        region: "Philippines / SEA",
        url: "https://ph-mpl.com/",
        sourceTier: "TIER_1_OFFICIAL",
      },
    ],
    observedProExecution:
      "Tim profesional di MPL ID, MPL PH, dan MSC secara rutin menempatkan Roamer membantu Mid Laner membersihkan gelombang minion pertama lebih cepat daripada lawan, lalu bergerak bertiga bersama Jungler untuk merebut visi sungai (Lithowanderer) dan menentukan arah gank pertama ke Gold atau EXP Lane.",
    whyItWorks:
      "Mid Lane adalah jalur terpendek di peta. Tim yang membersihkan wave tengah lebih dulu memiliki keunggulan waktu 2–4 detik untuk masuk ke bush sungai terlebih dahulu, memaksa lawan berjalan ke area tanpa visi dan mengontrol arah rotasi awal.",
    requiredConditions: [
      "Mid Laner memiliki kemampuan clear wave level 1–2 yang cepat.",
      "Roamer tidak terpaku diam di Gold Lane sejak detik awal.",
      "Jungler menyelaraskan jalur buff menuju sisi peta yang akan ditekan.",
    ],
    rankedRealismCheck:
      "Sangat realistis untuk Duo (Mid–Roam / Jungle–Roam), Trio, dan 5-Man. Di Solo Queue sifatnya kondisional karena tidak ada jaminan Roamer atau Mid akan bergerak serentak.",
    modeAdaptations: {
      SOLO: {
        rating: "CONDITIONAL",
        howToExecute:
          "Jika kamu Mid, fokus clear cepat lalu ikuti arah gerak Jungler atau Roamer yang paling aktif di minimap. Jika kamu Roam, bantu Mid clear wave 1 selama 5 detik lalu buka visi sungai sebelum turun ke Gold Lane.",
        risks:
          "Jika Mid dan Jungler tidak merespons visi yang kamu buka di sungai, kamu berisiko tertangkap 1v3 oleh Mid-Trio lawan.",
        safeAlternative:
          "Cukup berikan visi dari jarak aman (tanpa face-check jauh ke jungle musuh) dan fokus mengawal side lane yang paling rentan terkena gank.",
      },
      DUO: {
        rating: "RECOMMENDED",
        howToExecute:
          "Kombinasi Mid–Roam atau Jungle–Roam cukup kuat untuk langsung merebut kendali sungai dan memaksa rotasi pertama ke Gold Lane lawan.",
        risks:
          "Jika satu komponen poros (mis. Jungler acak) memilih arah farm berlawanan, jangan paksa perang 2v3 di sungai.",
        safeAlternative: null,
      },
      TRIO: {
        rating: "RECOMMENDED",
        howToExecute:
          "Ambil penuh 3 peran Jungle–Mid–Roam. Panggil hitungan clear mid → visi sungai → gank serentak 3v1 ke lane dengan peluang kill tertinggi.",
        risks:
          "Side laner acak bisa kalah 1v1 jika terlalu lama tidak dikunjungi; beri ping cepat jika lawan mengarah ke sisi mereka.",
        safeAlternative: null,
      },
      FIVE_MAN: {
        rating: "RECOMMENDED",
        howToExecute:
          "Rencanakan sejak draft: tentukan apakah Mid-Trio akan melindungi Gold Lane (scaling) atau menekan EXP/Turtle sejak level 4.",
        risks:
          "Over-commit ke satu sisi tanpa menjaga informasi EXP/Gold dapat dibalas cross-map trade oleh squad 5-Man lawan.",
        safeAlternative: null,
      },
    },
    limitations:
      "Efektivitas bergantung pada kecepatan clear hero Mid pada patch aktif; beberapa komposisi Roamer pasif tetap harus menjaga Gold Laner bila menghadapi duo lane agresif lawan.",
    claimClassification: "STRATEGIC_INTERPRETATION",
    verificationStatus: "PARTIALLY_VERIFIED",
    confidenceLevel: "MEDIUM",
    referencePatchNote:
      "Prinsip makro umum turnamen 2026; angka detail timer minion/buff tetap mengikuti patch live (2.2.23).",
  },
  {
    id: "cross-map-turtle-trade",
    title: "Cross-Map Turtle Trade (Tukar Objektif Saat Kalah Tempo)",
    category: "OBJECTIVE",
    coordinationRequirement: "MEDIUM",
    tournamentCircuits: [
      "MPL Indonesia (COMP009–COMP010)",
      "MPL Malaysia (COMP013, COMP021)",
      "MCC EECA (COMP029–COMP030)",
    ],
    references: [
      {
        label: "Portal Resmi MPL Indonesia",
        region: "Indonesia / SEA",
        url: "https://id-mpl.com/statistics",
        sourceTier: "TIER_1_OFFICIAL",
      },
      {
        label: "Rilis Resmi MOONTON MCT SEA 2026",
        region: "Southeast Asia",
        url: "https://en.moonton.com/news/398.html",
        sourceTier: "TIER_1_OFFICIAL",
      },
    ],
    observedProExecution:
      "Ketika kalah posisi rotasi atau memiliki komposisi early game yang lebih lemah saat Turtle pertama/kedua muncul, tim profesional tidak memaksa kontes 4v4 yang merugikan. Mereka sengaja melepas Turtle dan langsung menekan sisi peta berlawanan: menghancurkan gold shield/plating turret Gold Lane, menyapu camp jungle musuh, atau menculik side laner lawan.",
    whyItWorks:
      "Memaksa kontes saat tertinggal berisiko memberi lawan Turtle SEKALIGUS 2–3 kill. Dengan cross-map trade, selisih ekonomi dinetralkan melalui gold plating turret dan percepatan item inti Marksman tanpa mengambil risiko wipe-out.",
    requiredConditions: [
      "Informasi pasti bahwa mayoritas pemain lawan sedang berkumpul di pit Turtle.",
      "Side laner atau Jungler berada di sisi peta berlawanan dengan wave minion siap mendorong turret.",
      "Disiplin untuk tidak ada satu pun rekan yang nekat masuk pit Turtle sendirian.",
    ],
    rankedRealismCheck:
      "Sangat realistis dan justru merupakan salah satu prinsip pro PALING BERGUNA untuk semua mode (termasuk Solo Queue) guna mencegah blunder snowball.",
    modeAdaptations: {
      SOLO: {
        rating: "RECOMMENDED",
        howToExecute:
          "Begitu melihat 3–4 musuh sudah menguasai area Turtle sementara rekanmu terpencar, segera ping 'Retreat' di Turtle lalu ambil plating turret Gold Lane atau camp jungle lawan di sisi seberang.",
        risks:
          "Beberapa rekan Solo mungkin tetap nekat masuk ke pit Turtle dan menyalahkan tim jika tidak melihat sinyal 'Retreat' lebih awal.",
        safeAlternative: null,
      },
      DUO: {
        rating: "RECOMMENDED",
        howToExecute:
          "Jika kalian Duo Gold–Roam atau Jungle–Gold, manfaatkan ketidakhadiran Roamer musuh di Gold Lane untuk langsung dive/menekan turret dan mengambil seluruh gold shield.",
        risks:
          "Pastikan Mid lawan benar-benar terlihat di sisi Turtle sebelum melakukan turret dive.",
        safeAlternative: null,
      },
      TRIO: {
        rating: "RECOMMENDED",
        howToExecute:
          "Ambil keputusan cepat 10 detik sebelum Turtle spawn: jika draft kalian lebih kuat late game, arahkan Trio menghancurkan turret Gold Lane sambil menyapu buff sisi seberang lawan.",
        risks:
          "Jika EXP Laner acak tetap memaksa masuk ke Turtle sendirian, beri ping mundur berulang sebelum perang terjadi.",
        safeAlternative: null,
      },
      FIVE_MAN: {
        rating: "RECOMMENDED",
        howToExecute:
          "Shotcaller memanggil trade secara eksplisit ('Lepas Turtle, hancurkan Gold Turret + ambil Orange Buff lawan') sehingga seluruh 5 pemain bergerak serentak menghasilkan nilai gold setara atau lebih tinggi.",
        risks:
          "Terlalu sering melepas seluruh 3 Turtle tanpa kompensasi turret akan memberi lawan keunggulan EXP global dan kontrol peta.",
        safeAlternative: null,
      },
    },
    limitations:
      "Nilai plating turret hanya aktif pada 5 menit awal; setelah menit 5, kompensasi trade harus berupa penghancuran outer turret penuh atau pengamanan buff utama.",
    claimClassification: "STRATEGIC_INTERPRETATION",
    verificationStatus: "PARTIALLY_VERIFIED",
    confidenceLevel: "HIGH",
    referencePatchNote:
      "Selaras dengan prinsip ekonomi turret & objektif pada PATCH_UPDATE_SYSTEM.md.",
  },
  {
    id: "exp-lane-wave-cutting",
    title: "Wave Cutting EXP Lane 15–20 Detik Sebelum Objektif",
    category: "LANE_CONTROL",
    coordinationRequirement: "HIGH",
    tournamentCircuits: [
      "MPL Philippines (COMP011–COMP012)",
      "MSC at Esports World Cup (COMP001)",
      "MTC Türkiye (COMP031–COMP032)",
    ],
    references: [
      {
        label: "Portal Resmi MPL Philippines",
        region: "Philippines / SEA",
        url: "https://ph-mpl.com/",
        sourceTier: "TIER_1_OFFICIAL",
      },
    ],
    observedProExecution:
      "EXP Laner profesional kerap memotong gelombang minion lawan di antara outer dan inner turret sekitar 15–20 detik sebelum Turtle atau Lord muncul, lalu langsung berotasi menuju sungai terlebih dahulu.",
    whyItWorks:
      "Memotong wave menciptakan dilema bagi EXP Laner lawan: jika ia tetap membersihkan minion di bawah turret, timnya kalah jumlah 4v5 di pit objektif; jika ia meninggalkan minion untuk ikut perang, ia kehilangan gelombang EXP/gold dan turret-nya terancam hancur.",
    requiredConditions: [
      "Informasi pasti posisi Jungler dan Mid lawan (tidak sedang menuju EXP Lane).",
      "Hero EXP memiliki mobilitas/ketahanan cukup untuk mundur jika dikepung.",
      "Tim siap langsung memicu setup objektif begitu keunggulan jumlah 5v4 tercipta.",
    ],
    rankedRealismCheck:
      "Efektif di Trio dan 5-Man; berisiko tinggi di Solo Queue karena minimnya informasi posisi lawan serta tim belum tentu memanfaatkan jendela keunggulan 15 detik tersebut.",
    modeAdaptations: {
      SOLO: {
        rating: "HIGH_RISK",
        howToExecute:
          "Hanya lakukan cut wave jika Jungler dan Mid lawan 100% terlihat di sisi Gold Lane pada minimap dan kamu memakai EXP ber-mobilitas tinggi.",
        risks:
          "Tanpa informasi posisi musuh, cut wave di Solo Queue sering berakhir mati terjepit 1v3 tepat sebelum Turtle muncul.",
        safeAlternative:
          "Lakukan fast-clear wave secara normal di depan turret (tanpa melewati outer turret lawan), lalu langsung berjalan lebih dulu ke area Turtle.",
      },
      DUO: {
        rating: "CONDITIONAL",
        howToExecute:
          "Bisa dilakukan jika rekan Duo-mu (Roam/Mid) memberi info posisi Jungler musuh secara real-time di voice.",
        risks:
          "Jika rekan tim lain belum siap ke objektif, keunggulan tempo 15 detik dari cut wave bisa terbuang percuma.",
        safeAlternative:
          "Cukup dorong wave cepat dan rotasi ke bush sungai bersama rekan Duo.",
      },
      TRIO: {
        rating: "RECOMMENDED",
        howToExecute:
          "Trio Mid-Triangle mengunci visi sisi sungai sambil memberi sinyal aman bagi EXP untuk memotong wave dan langsung menutup sudut flank di Turtle/Lord.",
        risks:
          "Jangan memotong wave bila outer turret lawan masih utuh dan seluruh lawan hilang dari minimap.",
        safeAlternative: null,
      },
      FIVE_MAN: {
        rating: "RECOMMENDED",
        howToExecute:
          "Koordinasikan cut wave 20 detik sebelum objektif bersamaan dengan dorongan wave Mid, lalu paksa perang 5v4 segera sebelum EXP lawan sempat tiba.",
        risks:
          "Squad 5-Man lawan yang peka dapat memasang jebakan 3 orang di jalur belakang EXP untuk menghukum kebiasaan cut wave yang terlalu terbaca.",
        safeAlternative: null,
      },
    },
    limitations:
      "Tidak disarankan menggunakan EXP Laner lambat tanpa skill kabur atau saat tertinggal 2 level dari lawan lane.",
    claimClassification: "STRATEGIC_INTERPRETATION",
    verificationStatus: "PARTIALLY_VERIFIED",
    confidenceLevel: "MEDIUM",
    referencePatchNote:
      "Berlaku pada mekanika wave timing standar; tetap pantau perubahan durasi/stat minion per patch.",
  },
  {
    id: "level-1-coordinated-invade",
    title: "Level-1 Multi-Man Jungle Invade Terkoordinasi",
    category: "INVADE",
    coordinationRequirement: "PRO_LEVEL_VOICE_REQUIRED",
    tournamentCircuits: [
      "MPL Indonesia (COMP009–COMP010)",
      "MPL Philippines (COMP011–COMP012)",
      "MCT East Asia Ulaanbaatar (COMP004)",
    ],
    references: [
      {
        label: "Portal Resmi MPL Indonesia",
        region: "Indonesia / SEA",
        url: "https://id-mpl.com/statistics",
        sourceTier: "TIER_1_OFFICIAL",
      },
      {
        label: "Rilis Resmi MOONTON MCT East Asia",
        region: "East Asia",
        url: "https://en.moonton.com/news/395.html",
        sourceTier: "TIER_1_OFFICIAL",
      },
    ],
    observedProExecution:
      "Pada draft dengan keunggulan level-1 yang dominan (mis. Roam/Mid kuat di level 1 melawan Jungler lawan yang lemah di awal atau sangat bergantung pada Purple Buff), tim profesional mengirim 3–4 pemain serentak masuk ke jungle musuh untuk memaksa reset buff, mencuri camp, atau memperlambat level 4 Jungler lawan.",
    whyItWorks:
      "Mengganggu rotasi buff pertama membuat Jungler lawan kehilangan tempo level 4 pada Turtle pertama, memaksa Mid dan side laner lawan turun meninggalkan gelombang minion mereka.",
    requiredConditions: [
      "Komunikasi suara real-time (PRO_LEVEL_VOICE_REQUIRED) untuk masuk dan mundur pada detik yang sama.",
      "Keunggulan draft level-1 yang jelas dibandingkan komposisi lawan.",
      "Perhitungan ketat terhadap perlindungan anti-invade menit awal dan timer Retribution.",
    ],
    rankedRealismCheck:
      "TIDAK direkomendasikan di Solo Queue dan berisiko tinggi di Duo. Baru layak dijalankan secara terkontrol pada 5-Man Squad (atau Trio yang sangat sinkron dengan draft khusus).",
    modeAdaptations: {
      SOLO: {
        rating: "NOT_RECOMMENDED",
        howToExecute:
          "Jangan meniru level-1 invade penuh secara sepihak di Solo Queue. Rekan acak sangat jarang bergerak pada detik yang sama dan kamu rentan terjebak di wilayah jungle musuh.",
        risks:
          "Memberikan First Blood gratis, tertinggal level di lane sendiri, dan memicu snowball lawan sejak menit 1.",
        safeAlternative:
          "Cukup intip lokasi buff awal Jungler lawan dari tepi sungai (scouting aman) lalu beri ping posisi buff tersebut agar tim tahu arah rotasi lawan.",
      },
      DUO: {
        rating: "HIGH_RISK",
        howToExecute:
          "Hindari invade penuh ke dalam pit buff kecuali 100% yakin Mid dan Roam lawan tidak menjaga buff tersebut.",
        risks:
          "Jika Mid + Roam + EXP lawan merespons serentak, Duo akan kalah jumlah 2v3/2v4 di area jungle musuh yang memiliki perlindungan menit awal.",
        safeAlternative:
          "Lakukan gangguan ringan (poke/reset buff singkat tanpa komitmen nyawa) lalu segera amankan Lithowanderer.",
      },
      TRIO: {
        rating: "CONDITIONAL",
        howToExecute:
          "Hanya jalankan dengan 3 pemain yang memiliki keunggulan level 1 mutlak (mis. Roam ganggu buff + Mid clear cepat) dan siapkan panggilan mundur begitu buff tunda 5–8 detik.",
        risks:
          "Jika 2 rekan acak di side lane tidak menjaga jarak, rotasi balasan musuh bisa membalikkan keadaan.",
        safeAlternative:
          "Mainkan tempo standar menuju level 4 lalu baru lakukan invasi terukur pada siklus buff kedua (menit 2:30+).",
      },
      FIVE_MAN: {
        rating: "RECOMMENDED",
        howToExecute:
          "Rencanakan sejak fase draft, tentukan titik masuk dan jalur mundur di voice sebelum minion muncul, dan pastikan seluruh 5 pemain tahu kapan harus berhenti mengejar.",
        risks:
          "Invade yang terlalu lama menyebabkan lane sendiri kehilangan wave 1–2 sehingga justru kalah level saat kontes Turtle.",
        safeAlternative: null,
      },
    },
    limitations:
      "Mekanisme anti-invade shield di jungle menit awal membuat invasi paksa tanpa keunggulan draft level-1 sangat tidak efisien.",
    claimClassification: "STRATEGIC_INTERPRETATION",
    verificationStatus: "PARTIALLY_VERIFIED",
    confidenceLevel: "HIGH",
    referencePatchNote:
      "Mematuhi aturan Anti-Misleading Guardrail PRO_TO_RANKED_ADAPTATION.md §3.1 (dilarang blind copy ke Solo).",
  },
  {
    id: "four-one-split-lord-bait",
    title: "4-1 Split Push & Cross-Map Lord Bait",
    category: "MACRO",
    coordinationRequirement: "PRO_LEVEL_VOICE_REQUIRED",
    tournamentCircuits: [
      "MSC at Esports World Cup (COMP001)",
      "MPL Philippines (COMP011–COMP012)",
      "MCC EECA (COMP029–COMP030)",
    ],
    references: [
      {
        label: "Portal Resmi MPL Philippines",
        region: "Philippines / SEA",
        url: "https://ph-mpl.com/",
        sourceTier: "TIER_1_OFFICIAL",
      },
    ],
    observedProExecution:
      "Pada mid-to-late game, tim profesional mengirim 1 side laner kuat duel/push (EXP atau hero mobilitas tinggi) menekan lane terjauh dari Lord, sementara 4 pemain lain mengontrol area pit Lord—memaksa lawan memilih antara mengirim 2 orang menahan split push (sehingga kehilangan Lord) atau berkumpul 5 orang di Lord (sehingga base/inhibitor jebol).",
    whyItWorks:
      "Menciptakan tekanan dua titik serentak di peta yang secara matematis tidak bisa dijawab sempurna oleh tim yang kalah kendali visi.",
    requiredConditions: [
      "Komunikasi suara 5 pemain (PRO_LEVEL_VOICE_REQUIRED) agar 4 pemain di Lord tahu persis kapan harus mundur (disengage) dan tidak terpancing perang 4v5.",
      "Pemain split-push mampu menang duel 1v1 atau melarikan diri bila didatangi 2 lawan.",
      "Penguasaan visi di jalur rotasi lawan antara side lane dan pit Lord.",
    ],
    rankedRealismCheck:
      "Sangat sulit dijalankan di Solo Queue karena 4 pemain acak hampir selalu terpancing perang 4v5 saat kamu sedang split push. Baru optimal di 5-Man Squad.",
    modeAdaptations: {
      SOLO: {
        rating: "NOT_RECOMMENDED",
        howToExecute:
          "Jangan berharap 4 rekan acak di Solo Queue menahan diri tidak perang 4v5 saat kamu split push jauh dari Lord.",
        risks:
          "Timmu kalah perang 4v5 di Lord, lawan langsung mengamankan Evolved Lord dan mengakhiri game sementara kamu baru sampai di inner turret.",
        safeAlternative:
          "Cukup dorong wave side lane melewati garis tengah sungai 25 detik sebelum Lord, lalu segera bergabung bersama tim untuk perang 5v5.",
      },
      DUO: {
        rating: "HIGH_RISK",
        howToExecute:
          "Sulit mengeksekusi 4-1 murni karena 3 rekan acak tidak berada dalam panggilan disengage.",
        risks:
          "Salah paham timing membuat 3 rekan acak tetap memulai perang tanpa kehadiran split pusher.",
        safeAlternative:
          "Dorong wave side lane secukupnya lalu lakukan rotasi berdua untuk menjebak lawan yang datang membersihkan wave.",
      },
      TRIO: {
        rating: "CONDITIONAL",
        howToExecute:
          "Bisa dicoba bila Trio berada di grup 4 pemain (menjaga disiplin disengage di Lord) sementara 1 rekan side laner memang secara alami sedang mendorong lane jauh.",
        risks:
          "Jika side laner acak terlalu dalam tanpa visi, ia bisa mati terculik sebelum Lord sempat dimulai.",
        safeAlternative:
          "Gunakan keunggulan Trio untuk menyiapkan wave secara sinkron dan memenangkan teamfight 5v5 di area sungai.",
      },
      FIVE_MAN: {
        rating: "RECOMMENDED",
        howToExecute:
          "Tugaskan 1 pemain dengan wave clear/duel kuat di lane berlawanan Lord. 4 pemain di Lord wajib disiplin melakukan poke & reset (dilarang hard-engage 4v5) hingga terlihat minimal 1–2 musuh mundur membersihkan lane.",
        risks:
          "Jika grup 4 pemain terkena hard-engage inisiator lawan (mis. Flicker combo) sebelum musuh terpecah, strategi langsung runtuh.",
        safeAlternative: null,
      },
    },
    limitations:
      "Membutuhkan disiplin tinggi dari kelompok 4 pemain untuk tidak memaksa teamfight; sangat rentan melawan komposisi lawan yang memiliki global mobility atau engage jarak jauh.",
    claimClassification: "STRATEGIC_INTERPRETATION",
    verificationStatus: "PARTIALLY_VERIFIED",
    confidenceLevel: "HIGH",
    referencePatchNote:
      "Mematuhi aturan Anti-Misleading Guardrail PRO_TO_RANKED_ADAPTATION.md §3.1 (dilarang blind copy ke Solo).",
  },
  {
    id: "post-5min-gold-lane-rotation",
    title: "Rotasi Gold Laner Pasca Menit ke-5 (Hilangnya Turret Shield)",
    category: "ROTATION",
    coordinationRequirement: "HIGH",
    tournamentCircuits: [
      "MPL Indonesia (COMP009–COMP010)",
      "MPL Malaysia (COMP013, COMP021)",
      "MCT East Asia Ulaanbaatar (COMP004)",
    ],
    references: [
      {
        label: "Portal Resmi MPL Indonesia",
        region: "Indonesia / SEA",
        url: "https://id-mpl.com/statistics",
        sourceTier: "TIER_1_OFFICIAL",
      },
      {
        label: "Rilis Resmi MOONTON MCT East Asia",
        region: "East Asia",
        url: "https://en.moonton.com/news/395.html",
        sourceTier: "TIER_1_OFFICIAL",
      },
    ],
    observedProExecution:
      "Sekitar menit ke-5 saat pelindung gold shield pada outer turret berakhir dan outer turret Gold Lane mulai jatuh, tim profesional memindahkan Marksman/Gold Laner ke Mid Lane (atau lane teraman dengan pengawalan Roam) agar bisa farm cepat sambil mengancam outer turret tengah dan tetap dekat ke kedua sisi objektif.",
    whyItWorks:
      "Setelah outer turret Gold Lane jatuh, lane samping menjadi terlalu panjang dan berbahaya bagi Marksman tanpa mobilitas. Memindahkannya ke Mid memperpendek jarak aman, mempercepat akses ke kedua sisi peta, dan menekan turret tengah lawan yang paling strategis.",
    requiredConditions: [
      "Mid Laner bersedia bertukar membersihkan wave di side lane secara aman (atau memiliki mobilitas/jarak aman).",
      "Roamer mengawal jalur transisi di sekitar sungai agar Marksman tidak terculik saat berpindah.",
      "Pembagian wave yang jelas agar Mid dan Gold tidak saling berebut EXP/gold di lane yang sama.",
    ],
    rankedRealismCheck:
      "Sangat efektif di Trio dan 5-Man. Di Solo/Duo sering memicu kebingungan jika Mid Laner tidak paham konsep tukar lane dan tetap tinggal di tengah.",
    modeAdaptations: {
      SOLO: {
        rating: "CONDITIONAL",
        howToExecute:
          "Jika kamu Gold Laner dan turret luar sudah hancur, dorong wave Gold secukupnya lalu bantu tekan Mid bersama tim—namun jangan paksa tinggal di Mid bila Mage timmu menolak bertukar lane.",
        risks:
          "Berbagi 1 gelombang minion Mid berdua terus-menerus memperlambat level dan item kedua carry sekaligus.",
        safeAlternative:
          "Ambil wave side lane hanya saat posisi musuh terlihat, lalu segera berputar ke Mid untuk ikut teamfight/siege tanpa menelantarkan wave samping.",
      },
      DUO: {
        rating: "CONDITIONAL",
        howToExecute:
          "Jika bermain Duo Mid–Gold atau Gold–Roam, kalian bisa langsung bertukar posisi secara rapi begitu menit 5 lewat atau outer turret jatuh.",
        risks:
          "Jika Duo tidak memegang posisi Mid, perlu sinyal ping 'Gather' yang jelas agar tidak tumpang tindih wave.",
        safeAlternative:
          "Roamer mengawal Gold Laner mendorong lane samping secara aman sebelum bersama-sama menekan Mid.",
      },
      TRIO: {
        rating: "RECOMMENDED",
        howToExecute:
          "Begitu menit 5 lewat dan outer turret Gold jatuh, Trio memindahkan tekanan ke Mid Turret sambil mengawal rotasi Marksman.",
        risks:
          "Pastikan ada 1 pemain (EXP atau Mid) yang tetap menjaga wave side lane agar tidak ditembus split push lawan.",
        safeAlternative: null,
      },
      FIVE_MAN: {
        rating: "RECOMMENDED",
        howToExecute:
          "Eksekusi swap terencana: Gold+Roam mengambil poros Mid untuk mengunci visi kedua sisi sungai, sementara EXP dan Mid (berjarak aman) mengelola gelombang side lane.",
        risks:
          "Salah membaca rotasi Assassin lawan saat transisi lane dapat membuat Marksman terculik di sungai.",
        safeAlternative: null,
      },
    },
    limitations:
      "Beberapa Mage tanpa mobilitas tinggi tidak cocok ditaruh sendirian di side lane panjang melawan Assassin/Fighter pick-off; sesuaikan pembagian lane dengan keamanan komposisi.",
    claimClassification: "STRATEGIC_INTERPRETATION",
    verificationStatus: "PARTIALLY_VERIFIED",
    confidenceLevel: "MEDIUM",
    referencePatchNote:
      "Mengacu pada transisi berakhirnya turret shield menit ke-5 pada aturan battlefield standar.",
  },
] as const;

export const GLOBAL_ESPORTS_REFERENCE_STATS = {
  totalAuditedEvents2026: 39,
  totalRegions: 6,
  regionsLabel: "SEA, East Asia, Americas, EECA, EMEA, & International",
  majorCircuits: [
    "MSC at Esports World Cup",
    "M-Series World Championship",
    "MPL ID / PH / MY / SG / KH / MENA",
    "MCC EECA & MTC Türkiye",
    "MCT SEA / East Asia / Americas",
  ],
  auditReferenceDoc: "docs/research/GLOBAL_ESPORTS_COVERAGE.md",
} as const;

// i18n.js - Мультиязычная локализация портала «Спектр геополитики»
// Поддерживаемые языки: Русский (ru), O'zbekcha (uz), English (en), 中文 (zh), Deutsch (de), العربية (ar)

const I18N_DATA = {
    ru: {
        flag: "🇷🇺",
        name: "Русский",
        dir: "ltr",
        translations: {
            // Header & Nav
            "nav_portal_title": "СПЕКТР ГЕОПОЛИТИКИ",
            "nav_portal_sub": "Мировая библиотека & Ситуационный центр",
            "nav_library": "Библиотека (42 книги)",
            "nav_markets": "Биржи",
            "nav_forums": "Форумы",
            "nav_alliances": "Альянсы",
            "nav_regions": "Регионы",
            "nav_chat": "Чат",
            "nav_search_placeholder": "Поиск среди 42 книг...",
            "nav_favorites": "Избранное",
            "nav_quiz": "Тест",
            "nav_to_chat": "В чат",
            
            // Ticker
            "ticker_live": "СВОДКА LIVE",
            "ticker_online": "В сети",
            "ticker_views": "Просмотры",
            "ticker_downloads": "Скачиваний",

            // Hero
            "hero_badge": "Антология геостратегии • Радар мировых саммитов • Ситуационный чат",
            "hero_title_1": "Геополитика как судьба:",
            "hero_title_2": "от классиков Хартленда",
            "hero_title_3": "до саммитов XXI века",
            "hero_desc": "Свод фундаментальной литературы, радар текущих и предстоящих геополитических форумов, интерактивная карта блоков и ситуационный чат исследователей с экспортом в PDF.",
            "hero_stat_views": "Всего просмотров",
            "hero_stat_today": "за сегодня",
            "hero_stat_downloads": "Скачано книг & PDF",
            "hero_stat_downloads_sub": "реальных скачиваний",
            "hero_stat_online": "В сети онлайн",
            "hero_stat_online_sub": "активных исследователей",
            "hero_stat_forums": "Форумов в радаре",
            "hero_stat_forums_sub": "1 идёт прямо сейчас",
            "hero_btn_library": "Книжная библиотека (42 труда)",
            "hero_btn_markets": "Биржевой барометр",
            "hero_btn_forums": "Форумы (LIVE)",
            "hero_btn_alliances": "Альянсы",
            "hero_btn_chat": "Чат",

            // Library Main
            "lib_badge": "Каталог классиков, скачивание и печать",
            "lib_title": "Фундаментальная библиотека",
            "lib_desc": "Каждый труд снабжен аналитическим конспектом с возможностью мгновенного экспорта в PDF или текстовый формат.",
            "lib_search_placeholder": "Поиск автора, названия книги, тезиса...",
            "lib_btn_reset": "Сброс",
            "lib_view_all_books": "Все книги (42 труда)",
            "lib_view_authors": "По авторам (20)",
            "lib_shown": "Показано",
            "lib_books_word": "книг",
            "lib_authors_word": "мыслителей",
            "lib_sort_label": "Сортировка:",
            "lib_sort_chrono": "По эпохам (от Ратцеля к современникам)",
            "lib_sort_popular": "По популярности (просмотрам)",
            "lib_sort_downloads": "По числу скачиваний",
            "lib_sort_alpha": "По названию книги (А-Я)",

            // Book Card
            "card_thesis": "Ключевой тезис:",
            "card_btn_txt": "TXT",
            "card_btn_md": "MD",
            "card_btn_pdf": "PDF",
            "card_btn_read": "Читать онлайн & Конспект",
            "card_year_suffix": "г.",
            "card_read_full": "Читать онлайн",
            "card_export_pdf": "Экспорт в PDF",

            // Other Sections
            "sec_markets_badge": "Геоэкономический барометр • Мировые биржи",
            "sec_markets_title": "Сводка мировых биржевых показателей",
            "sec_markets_pdf_btn": "Скачать сводку в PDF",
            "sec_forums_badge": "Мониторинг международных площадок принятия решений",
            "sec_forums_title": "Геополитические форумы & Саммиты",
            "sec_alliances_badge": "Многополярный баланс сил",
            "sec_alliances_title": "Интерактивный радар мировых альянсов",
            "sec_regions_badge": "Стратегическая география XXI века",
            "sec_regions_title": "Расширенная аналитика по регионам мира",
            "sec_concepts_badge": "Пространство и стратегия",
            "sec_concepts_title": "Ключевые геополитические концепции",
            "sec_chat_badge": "Оперативный канал связи исследователей",
            "sec_chat_title": "Диалоговое окно геополитиков: Живой чат по темам"
        }
    },
    uz: {
        flag: "🇺🇿",
        name: "O'zbekcha",
        dir: "ltr",
        translations: {
            "nav_portal_title": "GEOSIYOSAT SPEKTRI",
            "nav_portal_sub": "Jahon kutubxonasi & Situatsion markaz",
            "nav_library": "Kutubxona (42 kitob)",
            "nav_markets": "Birjalar",
            "nav_forums": "Forumlar",
            "nav_alliances": "Ittifoqlar",
            "nav_regions": "Mintaqalar",
            "nav_chat": "Chat",
            "nav_search_placeholder": "42 ta kitob ichidan qidirish...",
            "nav_favorites": "Tanlanganlar",
            "nav_quiz": "Test",
            "nav_to_chat": "Chatga o'tish",

            "ticker_live": "LIVE HISOBOT",
            "ticker_online": "Tarmoqda",
            "ticker_views": "Ko'rishlar",
            "ticker_downloads": "Yuklab olishlar",

            "hero_badge": "Geostrategiya antologiyasi • Jahon sammitlari radari • Situatsion chat",
            "hero_title_1": "Geosiyosat — bu taqdir:",
            "hero_title_2": "Hartlend klassiklaridan",
            "hero_title_3": "XXI asr sammitlarigacha",
            "hero_desc": "Fundamental adabiyotlar to'plami, xalqaro forumlar radari, bloklar xaritasi va tahlilchilar situatsion chati (PDF eksport bilan).",
            "hero_stat_views": "Jami ko'rishlar",
            "hero_stat_today": "bugun",
            "hero_stat_downloads": "Yuklangan kitoblar & PDF",
            "hero_stat_downloads_sub": "haqiqiy yuklashlar",
            "hero_stat_online": "Onlayn foydalanuvchilar",
            "hero_stat_online_sub": "faol tadqiqotchilar",
            "hero_stat_forums": "Radardagi forumlar",
            "hero_stat_forums_sub": "1 tasi hozir bo'lib o'tmoqda",
            "hero_btn_library": "Kitoblar kutubxonasi (42 asar)",
            "hero_btn_markets": "Birja barometri",
            "hero_btn_forums": "Forumlar (LIVE)",
            "hero_btn_alliances": "Ittifoqlar",
            "hero_btn_chat": "Chat",

            "lib_badge": "Klassiklar katalogi, yuklab olish va chop etish",
            "lib_title": "Fundamental kutubxona",
            "lib_desc": "Har bir asar tahliliy konspekt va bir zumda PDF yoki matn formatida yuklab olish imkoniyatiga ega.",
            "lib_search_placeholder": "Muallif, kitob nomi yoki tezisni qidirish...",
            "lib_btn_reset": "Tozalash",
            "lib_view_all_books": "Barcha kitoblar (42 asar)",
            "lib_view_authors": "Mualliflar bo'yicha (20)",
            "lib_shown": "Ko'rsatildi",
            "lib_books_word": "kitob",
            "lib_authors_word": "mutafakkir",
            "lib_sort_label": "Saralash:",
            "lib_sort_chrono": "Davrlar bo'yicha (Ratseldan hozirgigacha)",
            "lib_sort_popular": "Mashhurlik bo'yicha",
            "lib_sort_downloads": "Yuklab olishlar soni bo'yicha",
            "lib_sort_alpha": "Kitob nomi bo'yicha (A-Z)",

            "card_thesis": "Asosiy tezis:",
            "card_btn_txt": "TXT",
            "card_btn_md": "MD",
            "card_btn_pdf": "PDF",
            "card_btn_read": "Onlayn o'qish & Konspekt",
            "card_year_suffix": "y.",
            "card_read_full": "Onlayn o'qish",
            "card_export_pdf": "PDF formatida yuklash",

            "sec_markets_badge": "Geoiqtisodiy barometr • Jahon birjalari",
            "sec_markets_title": "Jahon birja ko'rsatkichlari xulosasi",
            "sec_markets_pdf_btn": "Hisobotni PDF-da yuklash",
            "sec_forums_badge": "Xalqaro qaror qabul qilish maydonchalari",
            "sec_forums_title": "Geosiyosiy forumlar va Sammitlar",
            "sec_alliances_badge": "Ko'pqutbli kuchlar balansi",
            "sec_alliances_title": "Jahon ittifoqlarining interaktiv radari",
            "sec_regions_badge": "XXI asr strategik geografiyasi",
            "sec_regions_title": "Dunyo mintaqalari bo'yicha tahlil",
            "sec_concepts_badge": "Makon va strategiya",
            "sec_concepts_title": "Asosiy geosiyosiy konsepsiyalar",
            "sec_chat_badge": "Tadqiqotchilar tezkor aloqa kanali",
            "sec_chat_title": "Geosiyosatchilar muloqot oynasi: Jonli chat"
        }
    },
    en: {
        flag: "🇺🇸",
        name: "English",
        dir: "ltr",
        translations: {
            "nav_portal_title": "SPECTRUM OF GEOPOLITICS",
            "nav_portal_sub": "Global Library & Situation Center",
            "nav_library": "Library (42 Books)",
            "nav_markets": "Markets",
            "nav_forums": "Forums",
            "nav_alliances": "Alliances",
            "nav_regions": "Regions",
            "nav_chat": "Chat",
            "nav_search_placeholder": "Search among 42 books...",
            "nav_favorites": "Bookmarks",
            "nav_quiz": "Quiz",
            "nav_to_chat": "Join Chat",

            "ticker_live": "LIVE REPORT",
            "ticker_online": "Online",
            "ticker_views": "Views",
            "ticker_downloads": "Downloads",

            "hero_badge": "Geostrategy Anthology • World Summits Radar • Situation Chat",
            "hero_title_1": "Geopolitics as Destiny:",
            "hero_title_2": "from Heartland classics",
            "hero_title_3": "to 21st century summits",
            "hero_desc": "Corpus of foundational strategic thought, live monitoring of geopolitical summits, interactive alliances map, and researcher chat with PDF export.",
            "hero_stat_views": "Total Page Views",
            "hero_stat_today": "today",
            "hero_stat_downloads": "Downloaded Books & PDF",
            "hero_stat_downloads_sub": "real downloads",
            "hero_stat_online": "Users Online",
            "hero_stat_online_sub": "active researchers",
            "hero_stat_forums": "Summits Tracked",
            "hero_stat_forums_sub": "1 currently in session",
            "hero_btn_library": "Book Library (42 Works)",
            "hero_btn_markets": "Market Barometer",
            "hero_btn_forums": "Summits (LIVE)",
            "hero_btn_alliances": "Alliances",
            "hero_btn_chat": "Chat",

            "lib_badge": "Classic Literature Catalog, Downloads & Print",
            "lib_title": "Foundational Library",
            "lib_desc": "Every work features an academic analytical abstract with instant export to PDF or text format.",
            "lib_search_placeholder": "Search author, book title, strategic thesis...",
            "lib_btn_reset": "Reset",
            "lib_view_all_books": "All Books (42 Works)",
            "lib_view_authors": "By Authors (20)",
            "lib_shown": "Showing",
            "lib_books_word": "books",
            "lib_authors_word": "thinkers",
            "lib_sort_label": "Sort by:",
            "lib_sort_chrono": "Chronological (Ratzel to Modern)",
            "lib_sort_popular": "Popularity (Views)",
            "lib_sort_downloads": "Downloads Count",
            "lib_sort_alpha": "Book Title (A-Z)",

            "card_thesis": "Key Strategic Thesis:",
            "card_btn_txt": "TXT",
            "card_btn_md": "MD",
            "card_btn_pdf": "PDF",
            "card_btn_read": "Read Online & Abstract",
            "card_year_suffix": "",
            "card_read_full": "Read Online",
            "card_export_pdf": "Export to PDF",

            "sec_markets_badge": "Geoeconomic Barometer • Global Exchanges",
            "sec_markets_title": "Global Market Indicators Briefing",
            "sec_markets_pdf_btn": "Download Briefing in PDF",
            "sec_forums_badge": "International Decision-Making Platforms Monitoring",
            "sec_forums_title": "Geopolitical Forums & Summits",
            "sec_alliances_badge": "Multipolar Balance of Power",
            "sec_alliances_title": "Interactive Radar of Global Alliances",
            "sec_regions_badge": "21st Century Strategic Geography",
            "sec_regions_title": "Advanced Regional Analytics",
            "sec_concepts_badge": "Space and Strategy",
            "sec_concepts_title": "Key Geopolitical Concepts",
            "sec_chat_badge": "Operational Communication Channel",
            "sec_chat_title": "Geopoliticians Dialogue: Live Thematic Chat"
        }
    },
    zh: {
        flag: "🇨🇳",
        name: "中文",
        dir: "ltr",
        translations: {
            "nav_portal_title": "地缘政治光谱",
            "nav_portal_sub": "全球图书馆与战略态势中心",
            "nav_library": "图书馆 (42本典籍)",
            "nav_markets": "市场指数",
            "nav_forums": "峰会论坛",
            "nav_alliances": "同盟阵营",
            "nav_regions": "全球区域",
            "nav_chat": "态势讨论",
            "nav_search_placeholder": "在42本经典著作中搜索...",
            "nav_favorites": "收藏夹",
            "nav_quiz": "学派测试",
            "nav_to_chat": "进入讨论",

            "ticker_live": "实时简报",
            "ticker_online": "在线分析师",
            "ticker_views": "总浏览量",
            "ticker_downloads": "已下载著作",

            "hero_badge": "地缘战略巨著 • 全球峰会雷达 • 实时态势对话",
            "hero_title_1": "地缘政治即命运：",
            "hero_title_2": "从心脏地带经典",
            "hero_title_3": "到21世纪多极峰会",
            "hero_desc": "汇聚世界地缘战略奠基典籍、重大国际峰会实时追踪、同盟阵营交互地图与支持PDF导出的学者研究室。",
            "hero_stat_views": "真实访问量",
            "hero_stat_today": "今日新增",
            "hero_stat_downloads": "已下载图书 & PDF",
            "hero_stat_downloads_sub": "真实读者下载",
            "hero_stat_online": "当前在线人数",
            "hero_stat_online_sub": "位活跃研究员",
            "hero_stat_forums": "雷达收录峰会",
            "hero_stat_forums_sub": "1个正在召开中",
            "hero_btn_library": "典籍图书馆 (42部巨著)",
            "hero_btn_markets": "地缘经济指数",
            "hero_btn_forums": "多极峰会 (LIVE)",
            "hero_btn_alliances": "同盟阵营",
            "hero_btn_chat": "态势对话",

            "lib_badge": "经典著作目录、离线下载与打印",
            "lib_title": "地缘战略奠基图书馆",
            "lib_desc": "每部典籍均配有详尽学术导读与关键论点，支持一键导出为PDF或文本文件。",
            "lib_search_placeholder": "搜索作者、书名、核心论点...",
            "lib_btn_reset": "重置",
            "lib_view_all_books": "全部著作 (42部)",
            "lib_view_authors": "按思想家 (20位)",
            "lib_shown": "当前显示",
            "lib_books_word": "部著作",
            "lib_authors_word": "位思想家",
            "lib_sort_label": "排序方式：",
            "lib_sort_chrono": "按历史时期 (拉策尔至现代)",
            "lib_sort_popular": "按热门程度 (浏览量)",
            "lib_sort_downloads": "按下载次数",
            "lib_sort_alpha": "按书名字母顺序",

            "card_thesis": "核心战略论点：",
            "card_btn_txt": "TXT",
            "card_btn_md": "MD",
            "card_btn_pdf": "PDF",
            "card_btn_read": "在线阅读与导读",
            "card_year_suffix": "年",
            "card_read_full": "在线阅读",
            "card_export_pdf": "导出为PDF",

            "sec_markets_badge": "地缘经济晴雨表 • 全球金融与大宗商品",
            "sec_markets_title": "全球关键市场指标简报",
            "sec_markets_pdf_btn": "下载PDF版简报",
            "sec_forums_badge": "国际战略决策平台动态追踪",
            "sec_forums_title": "地缘政治论坛与大国峰会",
            "sec_alliances_badge": "多极世界力量平衡",
            "sec_alliances_title": "全球同盟与安全机制交互雷达",
            "sec_regions_badge": "21世纪战略地理学",
            "sec_regions_title": "全球关键宏观区域深度剖析",
            "sec_concepts_badge": "空间与战略学说",
            "sec_concepts_title": "核心地缘战略学说与咽喉水道",
            "sec_chat_badge": "战略学者即时交流通道",
            "sec_chat_title": "学者态势研讨室：分主题实时研讨"
        }
    },
    de: {
        flag: "🇩🇪",
        name: "Deutsch",
        dir: "ltr",
        translations: {
            "nav_portal_title": "SPEKTRUM DER GEOPOLITIK",
            "nav_portal_sub": "Weltbibliothek & Lagezentrum",
            "nav_library": "Bibliothek (42 Bücher)",
            "nav_markets": "Märkte",
            "nav_forums": "Gipfel",
            "nav_alliances": "Allianzen",
            "nav_regions": "Regionen",
            "nav_chat": "Chat",
            "nav_search_placeholder": "In 42 Büchern suchen...",
            "nav_favorites": "Favoriten",
            "nav_quiz": "Doktrin-Test",
            "nav_to_chat": "Zum Chat",

            "ticker_live": "LIVE-BERICHT",
            "ticker_online": "Online",
            "ticker_views": "Aufrufe",
            "ticker_downloads": "Downloads",

            "hero_badge": "Anthologie der Geostrategie • Gipfelradar • Lagezentrum",
            "hero_title_1": "Geopolitik als Schicksal:",
            "hero_title_2": "von den Heartland-Klassikern",
            "hero_title_3": "bis zu den Gipfeln des 21. Jahrhunderts",
            "hero_desc": "Fundamentalwerk der Geostrategie, Live-Überwachung von Gipfeltreffen, interaktive Allianzenkarte und Situationschat mit PDF-Export.",
            "hero_stat_views": "Seitenaufrufe",
            "hero_stat_today": "heute",
            "hero_stat_downloads": "Heruntergeladene Bücher & PDF",
            "hero_stat_downloads_sub": "echte Downloads",
            "hero_stat_online": "Forscher online",
            "hero_stat_online_sub": "aktive Nutzer",
            "hero_stat_forums": "Gipfeltreffen im Radar",
            "hero_stat_forums_sub": "1 findet gerade statt",
            "hero_btn_library": "Bibliothek (42 Werke)",
            "hero_btn_markets": "Geoökonomischer Barometer",
            "hero_btn_forums": "Gipfel (LIVE)",
            "hero_btn_alliances": "Allianzen",
            "hero_btn_chat": "Chat",

            "lib_badge": "Klassiker-Katalog, Download & Druck",
            "lib_title": "Fundamentale Bibliothek",
            "lib_desc": "Jedes Werk enthält eine akademische Zusammenfassung mit sofortigem Export in PDF oder TXT.",
            "lib_search_placeholder": "Autor, Buchtitel, These suchen...",
            "lib_btn_reset": "Zurücksetzen",
            "lib_view_all_books": "Alle Bücher (42 Werke)",
            "lib_view_authors": "Nach Autoren (20)",
            "lib_shown": "Angezeigt",
            "lib_books_word": "Bücher",
            "lib_authors_word": "Denker",
            "lib_sort_label": "Sortierung:",
            "lib_sort_chrono": "Chronologisch (Ratzel bis heute)",
            "lib_sort_popular": "Nach Beliebtheit (Aufrufe)",
            "lib_sort_downloads": "Nach Download-Zahlen",
            "lib_sort_alpha": "Nach Buchtitel (A-Z)",

            "card_thesis": "Kernthese:",
            "card_btn_txt": "TXT",
            "card_btn_md": "MD",
            "card_btn_pdf": "PDF",
            "card_btn_read": "Online lesen & Abstract",
            "card_year_suffix": "",
            "card_read_full": "Online lesen",
            "card_export_pdf": "Als PDF exportieren",

            "sec_markets_badge": "Geoökonomisches Barometer • Weltbörsen",
            "sec_markets_title": "Übersicht der weltweiten Marktindikatoren",
            "sec_markets_pdf_btn": "Bericht als PDF herunterladen",
            "sec_forums_badge": "Überwachung internationaler Entscheidungsgremien",
            "sec_forums_title": "Geopolitische Foren & Gipfel",
            "sec_alliances_badge": "Multipolare Kräftebalance",
            "sec_alliances_title": "Interaktives Radar globaler Allianzen",
            "sec_regions_badge": "Strategische Geographie des 21. Jahrhunderts",
            "sec_regions_title": "Erweiterte Regionalanalyse",
            "sec_concepts_badge": "Raum und Strategie",
            "sec_concepts_title": "Zentrale geopolitische Konzepte",
            "sec_chat_badge": "Operativer Kommunikationskanal",
            "sec_chat_title": "Dialogfenster für Geopolitiker: Thematischer Live-Chat"
        }
    },
    ar: {
        flag: "🇸🇦",
        name: "العربية",
        dir: "rtl",
        translations: {
            "nav_portal_title": "طيف الجيوسياسة",
            "nav_portal_sub": "المكتبة العالمية ومركز الموقف الاستراتيجي",
            "nav_library": "المكتبة (42 كتاباً)",
            "nav_markets": "الأسواق",
            "nav_forums": "القمم",
            "nav_alliances": "التحالفات",
            "nav_regions": "المناطق",
            "nav_chat": "الدردشة",
            "nav_search_placeholder": "ابحث في 42 كتاباً...",
            "nav_favorites": "المفضلة",
            "nav_quiz": "اختبار العقيدة",
            "nav_to_chat": "إلى الحوار",

            "ticker_live": "موجز مباشر",
            "ticker_online": "متصل الآن",
            "ticker_views": "المشاهدات",
            "ticker_downloads": "التحميلات",

            "hero_badge": "موسوعة الاستراتيجية العالمية • رادار القمم • غرفة الموقف",
            "hero_title_1": "الجغرافيا السياسية كقدر:",
            "hero_title_2": "من رواد قلب الأرض",
            "hero_title_3": "إلى قمم القرن الحادي والعشرين",
            "hero_desc": "مجموعة أمهات الكتب في الجيوسياسة، ورادار القمم الدولية، وخريطة التحالفات، وغرفة الحوار الاستراتيجي مع تصدير PDF.",
            "hero_stat_views": "إجمالي الزيارات الحقيقية",
            "hero_stat_today": "اليوم",
            "hero_stat_downloads": "الكتب المحملة وملفات PDF",
            "hero_stat_downloads_sub": "تحميلات حقيقية",
            "hero_stat_online": "المتصلون الآن",
            "hero_stat_online_sub": "باحث نشط",
            "hero_stat_forums": "القمم المرصودة",
            "hero_stat_forums_sub": "1 تنعقد الآن",
            "hero_btn_library": "مكتبة الكتب (42 مؤلفاً)",
            "hero_btn_markets": "مؤشرات الاقتصاد الجيوسياسي",
            "hero_btn_forums": "القمم (مباشر)",
            "hero_btn_alliances": "التحالفات",
            "hero_btn_chat": "غرفة الموقف",

            "lib_badge": "دليل الكتب الكلاسيكية والتحميل المباشر",
            "lib_title": "المكتبة التأسيسية",
            "lib_desc": "يتضمن كل عمل ملخصاً تحليلياً أكاديمياً مع إمكانية التصدير الفوري إلى PDF أو نص.",
            "lib_search_placeholder": "ابحث عن مؤلف، كتاب، أو أطروحة...",
            "lib_btn_reset": "إعادة ضبط",
            "lib_view_all_books": "جميع الكتب (42 مؤلفاً)",
            "lib_view_authors": "حسب المؤلفين (20)",
            "lib_shown": "المعروض",
            "lib_books_word": "كتاباً",
            "lib_authors_word": "مفكراً",
            "lib_sort_label": "الترتيب:",
            "lib_sort_chrono": "حسب الحقب (من راتزل إلى المعاصرين)",
            "lib_sort_popular": "حسب الشهرة (المشاهدات)",
            "lib_sort_downloads": "حسب عدد التحميلات",
            "lib_sort_alpha": "أبجدياً (أ-ي)",

            "card_thesis": "الأطروحة الجيواستراتيجية الكبرى:",
            "card_btn_txt": "TXT",
            "card_btn_md": "MD",
            "card_btn_pdf": "PDF",
            "card_btn_read": "قراءة أونلاين والملخص",
            "card_year_suffix": "م",
            "card_read_full": "قراءة أونلاين",
            "card_export_pdf": "تصدير إلى PDF",

            "sec_markets_badge": "مؤشرات الجيواقتصاد • البورصات العالمية",
            "sec_markets_title": "موجز المؤشرات والسلع الاستراتيجية",
            "sec_markets_pdf_btn": "تحميل الموجز بتنسيق PDF",
            "sec_forums_badge": "رصد منصات صنع القرار العالمية",
            "sec_forums_title": "المنتديات والقمم الجيوسياسية",
            "sec_alliances_badge": "توازن القوى متعدد الأقطاب",
            "sec_alliances_title": "الرادار التفاعلي للتحالفات العالمية",
            "sec_regions_badge": "الجغرافيا الاستراتيجية للقرن 21",
            "sec_regions_title": "تحليل معمق للأقاليم الحيوية",
            "sec_concepts_badge": "المكان والاستراتيجية",
            "sec_concepts_title": "المفاهيم الجيوسياسية الحاكمة والمضائق",
            "sec_chat_badge": "قناة الاتصال التفاعلية للباحثين",
            "sec_chat_title": "غرفة حوار خبراء الجيوسياسة: نقاشات حية"
        }
    }
};

// Global i18n Controller
window.SpektrI18n = {
    currentLang: localStorage.getItem("spektr_lang") || "ru",

    init() {
        if (!I18N_DATA[this.currentLang]) this.currentLang = "ru";
        this.applyLanguage(this.currentLang);
        this.setupEventListeners();
    },

    get(key, defaultVal = "") {
        const langPack = I18N_DATA[this.currentLang] || I18N_DATA.ru;
        return langPack.translations[key] || defaultVal || key;
    },

    setLanguage(lang) {
        if (!I18N_DATA[lang]) return;
        this.currentLang = lang;
        localStorage.setItem("spektr_lang", lang);
        this.applyLanguage(lang);
    },

    applyLanguage(lang) {
        const langPack = I18N_DATA[lang] || I18N_DATA.ru;
        const root = document.documentElement;
        
        root.setAttribute("lang", lang);
        root.setAttribute("dir", langPack.dir || "ltr");

        // Update Flag & Label in selector
        const flagEl = document.getElementById("currentLangFlag");
        const textEl = document.getElementById("currentLangText");
        if (flagEl) flagEl.textContent = langPack.flag;
        if (textEl) textEl.textContent = lang.toUpperCase();

        // Update Checkmarks in dropdown
        document.querySelectorAll(".lang-check").forEach(el => {
            const checkLang = el.getAttribute("data-check");
            if (checkLang === lang) {
                el.classList.remove("hidden");
            } else {
                el.classList.add("hidden");
            }
        });

        // Translate all data-i18n elements
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            const translation = langPack.translations[key];
            if (translation) {
                el.textContent = translation;
            }
        });

        // Translate placeholders
        document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
            const key = el.getAttribute("data-i18n-placeholder");
            const translation = langPack.translations[key];
            if (translation) {
                el.setAttribute("placeholder", translation);
            }
        });

        // Re-render dynamic components if app.js functions are available
        if (typeof window.renderBooksShowcase === "function" && typeof window.getFilteredAuthors === "function") {
            const authors = window.getFilteredAuthors();
            window.renderBooksShowcase(authors);
        }
        if (typeof window.renderAuthors === "function") {
            window.renderAuthors();
        }
    },

    setupEventListeners() {
        const dropdownBtn = document.getElementById("langDropdownBtn");
        const menu = document.getElementById("langMenu");

        if (dropdownBtn && menu) {
            dropdownBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                menu.classList.toggle("hidden");
            });

            document.addEventListener("click", () => {
                menu.classList.add("hidden");
            });
        }

        document.querySelectorAll(".lang-option").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const selectedLang = btn.getAttribute("data-lang");
                if (selectedLang) {
                    this.setLanguage(selectedLang);
                    if (menu) menu.classList.add("hidden");
                }
            });
        });
    }
};

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    window.SpektrI18n.init();
});

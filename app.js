// app.js - Интерактивная логика портала «Спектр геополитики»
// Включает: радар форумов (LIVE и предстоящие), карту альянсов, аналитику регионов, экспорт конспектов в PDF и мультиканальный чат

document.addEventListener("DOMContentLoaded", () => {
    // ==================== 1. СОСТОЯНИЕ (STATE) ====================
    let currentEra = "all";
    let currentSchool = "all";
    let searchQuery = "";
    let currentSort = "chronological";
    let currentQuoteIndex = 0;
    let onlyFavorites = false;
    let soundEnabled = true;

    // Forums & Alliances State
    let currentForumFilter = "all";
    let activeAllianceId = "brics";

    // Chat Channels State
    let currentChatChannel = "general";
    const CHANNEL_INFO = {
        "general": { title: "#общий-канал", desc: "Глобальная повестка и свободная дискуссия исследователей" },
        "forums": { title: "#форумы-и-саммиты", desc: "Обсуждение заявлений на текущих саммитах (Мюнхен, БРИКС, ШОС, Давос)" },
        "pacific": { title: "#индо-тихий-океан", desc: "Тайваньский пролив, AUKUS, Малакка и баланс ВМС в ИТР" },
        "energy": { title: "#энергетические-войны", desc: "Нефть, СПГ, Choke Points (Ормуз, Баб-эль-Мандеб) и санкции" },
        "heartland": { title: "#теория-хартленда", desc: "Суша против Моря, концепции Маккиндера, Спайкмена и Евразийство" }
    };

    // Favorites from localStorage
    let favoriteBooks = JSON.parse(localStorage.getItem("spektr_favorites") || "[]");

    // Local Stats store
    let localStats = JSON.parse(localStorage.getItem("spektr_stats") || JSON.stringify({
        totalViews: 154280,
        totalDownloads: 41820,
        todayViews: 3120,
        onlineUsers: 54,
        books: {}
    }));

    // Local Chat store
    let localChat = JSON.parse(localStorage.getItem("spektr_chat") || "[]");

    // ==================== 2. СИНТЕЗАТОР ЗВУКОВ (WEB AUDIO API) ====================
    let audioCtx = null;
    function getAudioContext() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) audioCtx = new AudioContext();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function playSound(type) {
        if (!soundEnabled) return;
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;

            if (type === "click") {
                osc.type = "sine";
                osc.frequency.setValueAtTime(520, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
                gain.gain.setValueAtTime(0.04, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.06);
                osc.start(now);
                osc.stop(now + 0.06);
            } else if (type === "download") {
                osc.type = "triangle";
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(554.37, now + 0.08);
                osc.frequency.setValueAtTime(659.25, now + 0.16);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.28);
                osc.start(now);
                osc.stop(now + 0.28);
            } else if (type === "message") {
                osc.type = "sine";
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
                gain.gain.setValueAtTime(0.06, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
                osc.start(now);
                osc.stop(now + 0.12);
            }
        } catch (e) {}
    }

    // ==================== 3. СТАТИСТИКА: ПРОСМОТРЫ И СКАЧИВАНИЯ ====================
    const heroTotalViews = document.getElementById("heroTotalViews");
    const heroTotalDownloads = document.getElementById("heroTotalDownloads");
    const heroTodayViews = document.getElementById("heroTodayViews");
    const heroOnlineUsers = document.getElementById("heroOnlineUsers");
    const topViewsCount = document.getElementById("topViewsCount");
    const topDownloadsCount = document.getElementById("topDownloadsCount");
    const topOnlineCount = document.getElementById("topOnlineCount");

    function formatNumber(num) {
        return num.toLocaleString('ru-RU');
    }

    function updateStatsUI() {
        if (heroTotalViews) heroTotalViews.textContent = formatNumber(localStats.totalViews);
        if (heroTotalDownloads) heroTotalDownloads.textContent = formatNumber(localStats.totalDownloads);
        if (heroTodayViews) heroTodayViews.textContent = formatNumber(localStats.todayViews || 3120);
        if (heroOnlineUsers) heroOnlineUsers.textContent = localStats.onlineUsers || 54;
        if (topViewsCount) topViewsCount.textContent = formatNumber(localStats.totalViews);
        if (topDownloadsCount) topDownloadsCount.textContent = formatNumber(localStats.totalDownloads);
        if (topOnlineCount) topOnlineCount.textContent = localStats.onlineUsers || 54;
    }

    function getBookStats(bookKey, baseViews = 2400, baseDownloads = 650) {
        if (!localStats.books) localStats.books = {};
        if (!localStats.books[bookKey]) {
            localStats.books[bookKey] = { views: baseViews, downloads: baseDownloads };
        }
        return localStats.books[bookKey];
    }

    async function syncStatsFromServer() {
        try {
            const res = await fetch("/api/stats");
            if (res.ok) {
                const data = await res.json();
                localStats = data;
                localStorage.setItem("spektr_stats", JSON.stringify(localStats));
                updateStatsUI();
                return;
            }
        } catch (e) {}
        localStats.totalViews += 1;
        localStats.todayViews = (localStats.todayViews || 3120) + 1;
        localStorage.setItem("spektr_stats", JSON.stringify(localStats));
        updateStatsUI();
    }

    async function recordView(bookKey = null) {
        localStats.totalViews += 1;
        localStats.todayViews += 1;
        if (bookKey) {
            const b = getBookStats(bookKey);
            b.views += 1;
        }
        localStorage.setItem("spektr_stats", JSON.stringify(localStats));
        updateStatsUI();

        try {
            fetch("/api/stats/view", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookId: bookKey })
            });
        } catch (e) {}
    }

    async function recordDownload(bookKey, bookTitle, authorName, format = "конспект") {
        playSound("download");
        localStats.totalDownloads += 1;
        if (bookKey) {
            const b = getBookStats(bookKey);
            b.downloads += 1;
        }
        localStorage.setItem("spektr_stats", JSON.stringify(localStats));
        updateStatsUI();
        renderAuthors();

        showToast(`«${bookTitle}» (${format.toUpperCase()}): успешно сформирован! (+1 к статистике)`);

        try {
            fetch("/api/stats/download", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookId: bookKey })
            });
        } catch (e) {}
    }

    function showToast(text) {
        const toast = document.getElementById("toastBox");
        const msg = document.getElementById("toastMessage");
        if (!toast || !msg) return;
        msg.textContent = text;
        toast.classList.add("show");
        setTimeout(() => {
            toast.classList.remove("show");
        }, 4000);
    }

    // ==================== 4. ЭКСПОРТ КОНСПЕКТОВ: В TXT, MD И В PDF ====================
    // 4.1 Скачивание полной электронной книги (TXT или Markdown)
    window.downloadBookSummary = function(authorId, bookIndex, format = "txt") {
        playSound("click");
        const author = GEOPOLITICS_DATA.authors.find(a => a.id === authorId);
        if (!author || !author.books[bookIndex]) return;

        const b = author.books[bookIndex];
        const bookKey = `${authorId}-${bookIndex + 1}`;
        const safeAuthor = author.name.replace(/[\s\.]+/g, '_');
        const safeTitle = b.title.replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40);
        const fileName = `[Геополитика]_${safeAuthor}_${safeTitle}.${format}`;

        // Priority 1: If on Node server with active backend (localhost or live tunnel), use server endpoint
        const isNodeServer = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('lhr.life');
        if (isNodeServer) {
            const link = document.createElement('a');
            link.href = `/api/download-book?authorId=${encodeURIComponent(authorId)}&bookIndex=${bookIndex}&format=${format}`;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            recordDownload(bookKey, b.title, author.name, format);
            return;
        }

        // Priority 2: Client-side Blob download fallback (for offline or file:/// mode)
        let content = "";
        if (format === "md") {
            content = `# ${b.title}
*Оригинальное название:* **${b.titleOrig}** (${b.year} г.)  
*Автор:* **${author.name}** (${author.nameOrig}), ${author.years}  
*Геополитическая школа:* ${author.school.toUpperCase()} (${author.country})

> «${author.quote}»

---

## 1. Исторический контекст и аннотация
${b.description}

## 2. Ключевые тезисы работы
${b.keyPoints.map((kp, idx) => `[ТЕЗИС ${idx + 1}]: **${kp}**`).join('\n\n')}

## 3. Базовый понятийный аппарат
${author.mainConcepts.map(c => `- \`${c}\``).join('\n')}

## 4. Биография автора и наследие
${author.bio}

## 5. Значение для мировой геополитики
${b.significance}

---
*Электронное издание портала «Спектр геополитики» (http://localhost:3000)*
`;
        } else {
            content = `================================================================================
                    ЭЛЕКТРОННАЯ БИБЛИОТЕКА «СПЕКТР ГЕОПОЛИТИКИ»
                   ФУНДАМЕНТАЛЬНОЕ ИССЛЕДОВАНИЕ ПО МИРОВОЙ СТРАТЕГИИ
================================================================================

НАЗВАНИЕ ТРУДА: ${b.title.toUpperCase()}
ОРИГИНАЛЬНОЕ НАЗВАНИЕ: ${b.titleOrig}
ГОД ПЕРВОГО ИЗДАНИЯ: ${b.year} год

АВТОР: ${author.name} (${author.nameOrig})
ГОДЫ ЖИЗНИ: ${author.years}
ГОСУДАРСТВО / ШКОЛА: ${author.country} | ${author.role}
ГЕОПОЛИТИЧЕСКАЯ ТРАДИЦИЯ: ${author.school.toUpperCase()}

ЭПИГРАФ ИЗ ТРУДОВ МЫСЛИТЕЛЯ:
«${author.quote}»

================================================================================
                      РАЗДЕЛ I. ИСТОРИЧЕСКИЙ КОНТЕКСТ И АННОТАЦИЯ
================================================================================
${b.description}

================================================================================
             РАЗДЕЛ II. СИСТЕМНЫЕ ПОЛОЖЕНИЯ И СТРАТЕГИЧЕСКИЕ ТЕЗИСЫ
================================================================================
${b.keyPoints.map((kp, idx) => `[ТЕЗИС ${idx + 1}]:\n${kp}`).join('\n\n')}

================================================================================
                 РАЗДЕЛ III. БАЗОВЫЙ ПОНЯТИЙНЫЙ АППАРАТ АВТОРА
================================================================================
${author.mainConcepts.map((c, idx) => `  ${idx + 1}. «${c}»`).join('\n')}

================================================================================
             РАЗДЕЛ IV. БИОГРАФИЧЕСКИЙ ОЧЕРК И ФОРМИРОВАНИЕ МЫСЛИТЕЛЯ
================================================================================
${author.bio}

================================================================================
             РАЗДЕЛ V. ЗНАЧЕНИЕ ДЛЯ МИРОВОЙ ГЕОПОЛИТИКИ И АНАЛИЗ ДЛЯ XXI ВЕКА
================================================================================
${b.significance}

================================================================================
Издание подготовлено цифровым порталом «Спектр геополитики»
Сайт проекта: http://localhost:3000
Дата формирования: ${new Date().toLocaleDateString('ru-RU')}
Лицензия: Открытый доступ для исследователей и аналитиков
================================================================================
`;
        }

        const mime = format === "md" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8";
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        recordDownload(bookKey, b.title, author.name, format);
    };

    // 4.2 Экспорт в официальный красивый PDF
    window.exportBookToPdf = function(authorId, bookIndex) {
        playSound("click");
        const author = GEOPOLITICS_DATA.authors.find(a => a.id === authorId);
        if (!author || !author.books[bookIndex]) return;

        const b = author.books[bookIndex];
        const bookKey = `${authorId}-${bookIndex + 1}`;

        showToast(`Формирование PDF-книги «${b.title}»...`);

        // Create elegant academic printable layout
        const pdfContainer = document.getElementById("pdfExportContainer");
        pdfContainer.innerHTML = `
            <div id="pdfInvoiceSheet" style="font-family: 'Times New Roman', serif; color: #111827; padding: 30px; background: #ffffff; line-height: 1.5; width: 750px; margin: 0 auto; border: 2px solid #b45309;">
                <!-- Header Stamp -->
                <div style="border-bottom: 2px solid #b45309; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <div style="font-size: 18px; font-weight: bold; letter-spacing: 2px; color: #92400e; text-transform: uppercase;">ПОРТАЛ «СПЕКТР ГЕОПОЛИТИКИ»</div>
                        <div style="font-size: 11px; color: #4b5563; text-transform: uppercase; letter-spacing: 1px;">Институт мировой геостратегии • Академический конспект</div>
                    </div>
                    <div style="border: 1px solid #b45309; padding: 4px 10px; font-size: 10px; font-weight: bold; color: #b45309; text-align: right;">
                        КОД: GEO-${authorId.toUpperCase()}-${b.year}<br>
                        ДАТА: ${new Date().toLocaleDateString('ru-RU')}
                    </div>
                </div>

                <!-- Book Title & Author -->
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="font-size: 22px; font-weight: bold; margin: 0 0 4px 0; color: #1f2937;">${b.title}</h1>
                    <div style="font-size: 13px; font-style: italic; color: #4b5563; margin-bottom: 6px;">(${b.titleOrig}, ${b.year} г.)</div>
                    <div style="font-size: 15px; font-weight: bold; color: #92400e;">Автор: ${author.name} (${author.nameOrig})</div>
                    <div style="font-size: 11px; color: #4b5563;">${author.country} | ${author.years} | ${author.role}</div>
                </div>

                <!-- Quote Box -->
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px 15px; margin-bottom: 18px; font-style: italic; font-size: 12px;">
                    «${author.quote}»
                </div>

                <!-- Section 1: Overview -->
                <div style="margin-bottom: 16px;">
                    <h2 style="font-size: 13px; text-transform: uppercase; font-weight: bold; color: #92400e; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; margin-bottom: 6px;">1. Историко-географический контекст работы</h2>
                    <p style="font-size: 11.5px; text-align: justify; margin: 0;">${b.description}</p>
                </div>

                <!-- Section 2: Key Theses -->
                <div style="margin-bottom: 16px;">
                    <h2 style="font-size: 13px; text-transform: uppercase; font-weight: bold; color: #92400e; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; margin-bottom: 6px;">2. Фундаментальные теоретические тезисы</h2>
                    <ul style="font-size: 11.5px; margin: 0; padding-left: 18px;">
                        ${b.keyPoints.map(kp => `<li style="margin-bottom: 5px; text-align: justify;">${kp}</li>`).join('')}
                    </ul>
                </div>

                <!-- Section 3: Concepts -->
                <div style="margin-bottom: 16px;">
                    <h2 style="font-size: 13px; text-transform: uppercase; font-weight: bold; color: #92400e; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; margin-bottom: 6px;">3. Базовый понятийный аппарат</h2>
                    <div style="font-size: 11px; line-height: 1.8;">
                        ${author.mainConcepts.map(c => `<span style="display: inline-block; background: #e5e7eb; padding: 2px 6px; margin-right: 5px; border-radius: 3px; font-weight: bold;">${c}</span>`).join('')}
                    </div>
                </div>

                <!-- Section 4: Significance -->
                <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 13px; text-transform: uppercase; font-weight: bold; color: #92400e; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; margin-bottom: 6px;">4. Значение для мировой геополитики</h2>
                    <p style="font-size: 11.5px; text-align: justify; margin: 0;">${b.significance}</p>
                </div>

                <!-- Footer stamp -->
                <div style="border-top: 1px solid #b45309; padding-top: 8px; font-size: 9px; color: #6b7280; display: flex; justify-content: space-between;">
                    <div>Сформировано на портале «Спектр геополитики» • http://localhost:3000</div>
                    <div>Экземпляр исследователя • Открытый доступ</div>
                </div>
            </div>
        `;

        const element = document.getElementById("pdfInvoiceSheet");
        const safeAuthor = author.name.replace(/[\s\.]+/g, '_');
        const safeTitle = b.title.replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 30);
        const opt = {
            margin: 8,
            filename: `[Геополитика]_${safeAuthor}_${safeTitle}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        if (window.html2pdf) {
            window.html2pdf().set(opt).from(element).save().then(() => {
                recordDownload(bookKey, b.title, author.name, "pdf");
            }).catch(err => {
                console.warn("html2pdf fallback to print", err);
                window.print();
                recordDownload(bookKey, b.title, author.name, "pdf");
            });
        } else {
            window.print();
            recordDownload(bookKey, b.title, author.name, "pdf");
        }
    };

    // ==================== 5. РАДАР ГЕОПОЛИТИЧЕСКИХ ФОРУМОВ И САММИТОВ ====================
    const forumsGrid = document.getElementById("forumsGrid");
    const forumFilterBtns = document.querySelectorAll(".forum-filter-btn");

    function renderForums() {
        if (!forumsGrid || !GEOPOLITICS_DATA.forums) return;

        let list = [...GEOPOLITICS_DATA.forums];
        if (currentForumFilter === "live") {
            list = list.filter(f => f.status === "live");
        } else if (currentForumFilter === "security") {
            list = list.filter(f => f.category === "security" || f.category === "pacific");
        } else if (currentForumFilter === "geoeconomics") {
            list = list.filter(f => f.category === "geoeconomics" || f.category === "heartland" || f.category === "economy");
        }

        forumsGrid.innerHTML = list.map(f => {
            const isLive = f.status === "live";

            return `
                <div class="glass-panel p-6 rounded-2xl border ${isLive ? 'border-red-500/50 bg-red-950/10 shadow-lg shadow-red-900/20' : 'border-slate-800'} flex flex-col justify-between animate-fade-in hover:border-amber-500/50 transition-all">
                    <div>
                        <!-- Header: Flag + Status -->
                        <div class="flex items-start justify-between gap-3 mb-3">
                            <div class="flex items-center gap-2.5">
                                <span class="text-2xl">${f.flag}</span>
                                <div>
                                    <div class="text-xs font-bold text-white">${f.city}, ${f.country}</div>
                                    <div class="text-[11px] text-slate-400 font-mono">${f.dates}</div>
                                </div>
                            </div>
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${f.statusColor} whitespace-nowrap flex items-center gap-1.5">
                                ${isLive ? '<span class="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>' : ''}
                                ${f.statusText}
                            </span>
                        </div>

                        <!-- Forum Title -->
                        <h3 class="text-lg font-bold font-serif-title text-white mb-2">${f.name}</h3>
                        <p class="text-xs text-slate-300 leading-relaxed mb-4">${f.description}</p>

                        <!-- Key Agenda Items -->
                        <div class="mb-4 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                            <span class="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-2">Ключевая повестка дня:</span>
                            <ul class="space-y-1.5 text-xs text-slate-300 list-disc pl-4 marker:text-amber-500">
                                ${f.agenda.map(a => `<li>${a}</li>`).join("")}
                            </ul>
                        </div>

                        <!-- Participants & Impact -->
                        <div class="text-xs text-slate-400 space-y-1 mb-4">
                            <div><strong class="text-slate-200">Участники:</strong> ${f.keyParticipants}</div>
                            <div><strong class="text-amber-300">Значение:</strong> ${f.geopoliticalImpact}</div>
                        </div>
                    </div>

                    <!-- Bottom Action: Discuss in Chat -->
                    <div class="pt-3 border-t border-slate-800 flex items-center justify-between">
                        <div class="text-[11px] font-mono text-slate-400">
                            ${isLive ? '<span class="text-red-400 font-bold">Спецсессия открыта</span>' : `Осталось: <strong class="text-amber-400">${f.daysLeft} дней</strong>`}
                        </div>
                        <button onclick="window.joinForumDiscussion('${f.name}')" 
                                class="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5">
                            <i class="fa-solid fa-comments"></i> Обсудить в чате
                        </button>
                    </div>
                </div>
            `;
        }).join("");
    }

    forumFilterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            playSound("click");
            currentForumFilter = btn.dataset.filter;
            forumFilterBtns.forEach(b => {
                b.className = "forum-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-slate-300 border border-slate-800 hover:border-amber-500/50";
            });
            btn.className = "forum-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 border border-amber-400 shadow-md";
            renderForums();
        });
    });

    window.joinForumDiscussion = function(forumName) {
        playSound("click");
        switchChatChannel("forums");
        const chatSec = document.getElementById("chat-section");
        if (chatSec) chatSec.scrollIntoView({ behavior: "smooth" });
        const input = document.getElementById("chatMessageInput");
        if (input) {
            input.value = `[Обсуждение: ${forumName}] `;
            input.focus();
        }
    };

    // ==================== 5.5 ГЕОЭКОНОМИЧЕСКИЙ БАРОМЕТР: МИРОВЫЕ БИРЖИ ====================
    let currentMarketCategory = "all";
    let currentMarketSearch = "";

    function renderMarketTicker() {
        const tickerContainer = document.getElementById("tickerItemsContainer");
        if (!tickerContainer || !GEOPOLITICS_DATA.markets || !GEOPOLITICS_DATA.markets.indicators) return;

        const indicators = GEOPOLITICS_DATA.markets.indicators;
        const displayList = [...indicators, ...indicators];

        tickerContainer.innerHTML = displayList.map(ind => {
            const isUp = ind.trend === "up";
            const colorClass = isUp ? "text-emerald-400" : "text-rose-400";
            const arrowIcon = isUp ? "fa-arrow-trend-up" : "fa-arrow-trend-down";
            const bgClass = isUp ? "bg-emerald-500/10 border-emerald-500/30" : "bg-rose-500/10 border-rose-500/30";

            return `
                <a href="#markets-section" onclick="highlightMarketIndicator('${ind.id}')" class="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer">
                    <span class="text-slate-300 font-bold">${ind.symbol}</span>
                    <span class="text-white font-mono">${ind.price}</span>
                    <span class="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded border ${colorClass} ${bgClass}">
                        <i class="fa-solid ${arrowIcon}"></i> ${ind.change}
                    </span>
                </a>
            `;
        }).join("");
    }

    function renderMarketIndicators() {
        const grid = document.getElementById("marketIndicatorsGrid");
        if (!grid || !GEOPOLITICS_DATA.markets || !GEOPOLITICS_DATA.markets.indicators) return;

        let list = [...GEOPOLITICS_DATA.markets.indicators];

        if (currentMarketCategory !== "all") {
            list = list.filter(i => i.category === currentMarketCategory);
        }

        if (currentMarketSearch.trim()) {
            const q = currentMarketSearch.toLowerCase().trim();
            list = list.filter(i => 
                i.name.toLowerCase().includes(q) || 
                i.symbol.toLowerCase().includes(q) || 
                i.geopoliticalFactor.toLowerCase().includes(q) ||
                i.geopoliticalAnalysis.toLowerCase().includes(q)
            );
        }

        if (list.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12 glass-panel rounded-2xl border-dashed border-slate-700">
                    <i class="fa-solid fa-chart-line text-slate-600 text-3xl mb-3"></i>
                    <p class="text-sm text-slate-400">Показатели по данному запросу не найдены.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = list.map(item => {
            const isUp = item.trend === "up";
            const changeColor = isUp ? "text-emerald-400" : "text-rose-400";
            const changeBg = isUp ? "bg-emerald-500/15 border-emerald-500/30" : "bg-rose-500/15 border-rose-500/30";
            const arrow = isUp ? "fa-arrow-trend-up" : "fa-arrow-trend-down";

            return `
                <div id="market-card-${item.id}" class="market-card glass-panel p-5 rounded-2xl border-slate-800 bg-slate-900/60 flex flex-col justify-between relative overflow-hidden">
                    <div class="absolute -right-6 -bottom-6 text-slate-800/15 text-8xl font-black pointer-events-none select-none font-mono">
                        ${item.symbol.split('/')[0].split(' ')[0]}
                    </div>

                    <div>
                        <!-- Header with Category and Status Badge -->
                        <div class="flex items-center justify-between gap-2 mb-3">
                            <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                                ${item.categoryName}
                            </span>
                            <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                ${item.statusBadge}
                            </span>
                        </div>

                        <!-- Name and Current Quote -->
                        <div class="flex items-baseline justify-between gap-2 mb-1">
                            <h3 class="text-base font-bold text-white flex items-center gap-2">
                                ${item.name}
                                <span class="text-xs text-slate-500 font-mono font-normal">${item.symbol}</span>
                            </h3>
                            <div class="text-right">
                                <span class="text-lg font-bold font-mono text-white">${item.price}</span>
                                <span class="text-[10px] text-slate-400 block">${item.unit}</span>
                            </div>
                        </div>

                        <!-- Dynamic Change Badge & 52-Week Range -->
                        <div class="flex items-center justify-between text-xs mb-4">
                            <span class="inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded border ${changeColor} ${changeBg}">
                                <i class="fa-solid ${arrow}"></i> ${item.change}
                            </span>
                            <span class="text-[10px] text-slate-500 font-mono">
                                52 нед: <span class="text-slate-400">${item.low52}</span> — <span class="text-slate-400">${item.high52}</span>
                            </span>
                        </div>

                        <!-- Geopolitical Trigger Factor -->
                        <div class="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-3">
                            <div class="text-[10px] uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5 mb-1">
                                <i class="fa-solid fa-crosshairs text-[9px]"></i> Геополитический триггер:
                            </div>
                            <div class="text-xs text-slate-200 font-semibold">${item.geopoliticalFactor}</div>
                        </div>

                        <!-- Strategic Analysis -->
                        <p class="text-xs text-slate-300 leading-relaxed mb-4">
                            ${item.geopoliticalAnalysis}
                        </p>
                    </div>

                    <!-- Action Footer -->
                    <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <button onclick="discussMarketInChat('${item.name} (${item.symbol})', '${item.price}')" class="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-colors">
                            <i class="fa-solid fa-comments"></i> Обсудить в чате
                        </button>
                        <span class="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 market-pulse-dot"></span> Актуально
                        </span>
                    </div>
                </div>
            `;
        }).join("");
    }

    function renderMarketThematicBriefs() {
        const container = document.getElementById("marketThematicBriefs");
        if (!container || !GEOPOLITICS_DATA.markets || !GEOPOLITICS_DATA.markets.thematicBriefs) return;

        container.innerHTML = GEOPOLITICS_DATA.markets.thematicBriefs.map(brief => `
            <div class="glass-panel p-5 rounded-2xl border-slate-800 bg-slate-950/60 flex flex-col justify-between">
                <div>
                    <div class="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3">
                        <i class="fa-solid fa-${brief.icon} ${brief.color} text-sm"></i>
                    </div>
                    <h4 class="text-sm font-bold text-white mb-2 leading-snug">${brief.title}</h4>
                    <p class="text-xs text-slate-400 leading-relaxed">${brief.text}</p>
                </div>
            </div>
        `).join("");
    }

    window.highlightMarketIndicator = function(id) {
        playSound("click");
        const card = document.getElementById(`market-card-${id}`);
        if (card) {
            card.scrollIntoView({ behavior: "smooth", block: "center" });
            card.classList.add("ring-2", "ring-amber-400", "scale-[1.02]");
            setTimeout(() => {
                card.classList.remove("ring-2", "ring-amber-400", "scale-[1.02]");
            }, 2500);
        }
    };

    window.discussMarketInChat = function(name, price) {
        playSound("click");
        switchChatChannel("energy");
        const chatSec = document.getElementById("chat-section");
        if (chatSec) chatSec.scrollIntoView({ behavior: "smooth" });
        const input = document.getElementById("chatMessageInput");
        if (input) {
            input.value = `[Рыночный сигнал: ${name} @ ${price}] Коллеги, как оцениваете геополитические последствия изменения цены? `;
            input.focus();
        }
    };

    // Category Filter Listeners
    document.querySelectorAll(".market-cat-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            playSound("click");
            currentMarketCategory = btn.dataset.cat;
            document.querySelectorAll(".market-cat-btn").forEach(b => {
                const active = b.dataset.cat === currentMarketCategory;
                b.className = `market-cat-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${active ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700'}`;
            });
            renderMarketIndicators();
        });
    });

    const marketSearchInput = document.getElementById("marketSearchInput");
    if (marketSearchInput) {
        marketSearchInput.addEventListener("input", (e) => {
            currentMarketSearch = e.target.value;
            renderMarketIndicators();
        });
    }

    window.exportMarketSummaryPdf = function() {
        playSound("click");
        const markets = GEOPOLITICS_DATA.markets;
        if (!markets) return;

        const printable = document.createElement("div");
        printable.style.padding = "30px";
        printable.style.background = "#ffffff";
        printable.style.color = "#0f172a";
        printable.style.fontFamily = "Arial, sans-serif";

        printable.innerHTML = `
            <div style="border-bottom: 2px solid #b45309; padding-bottom: 12px; margin-bottom: 20px;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #b45309; font-weight: bold;">
                    Спектр геополитики • Аналитическое бюро
                </div>
                <h1 style="font-size: 22px; color: #0a0f1d; margin: 6px 0 4px 0;">СВОДКА МИРОВЫХ БИРЖЕВЫХ ПОКАЗАТЕЛЕЙ И ГЕОЭКОНОМИКИ</h1>
                <div style="font-size: 11px; color: #64748b;">Дата формирования: ${new Date().toLocaleDateString('ru-RU')} • Геополитический стресс-индекс сырья: ${markets.geopoliticalStressIndex.score}/100 (${markets.geopoliticalStressIndex.level})</div>
            </div>

            <h3 style="font-size: 14px; text-transform: uppercase; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px;">1. Ключевые биржевые индикаторы и сырьевые ресурсы</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 24px;">
                <thead>
                    <tr style="background: #f1f5f9; text-align: left;">
                        <th style="padding: 8px; border: 1px solid #cbd5e1;">Индикатор</th>
                        <th style="padding: 8px; border: 1px solid #cbd5e1;">Котировка</th>
                        <th style="padding: 8px; border: 1px solid #cbd5e1;">Изм.</th>
                        <th style="padding: 8px; border: 1px solid #cbd5e1;">Геополитический триггер</th>
                    </tr>
                </thead>
                <tbody>
                    ${markets.indicators.map(ind => `
                        <tr>
                            <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${ind.name} (${ind.symbol})</td>
                            <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: monospace;">${ind.price} ${ind.unit}</td>
                            <td style="padding: 8px; border: 1px solid #e2e8f0; color: ${ind.trend === 'up' ? '#166534' : '#991b1b'}; font-weight: bold;">${ind.change}</td>
                            <td style="padding: 8px; border: 1px solid #e2e8f0;">${ind.geopoliticalFactor}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <h3 style="font-size: 14px; text-transform: uppercase; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px;">2. Стратегические аналитические выводы</h3>
            ${markets.thematicBriefs.map(b => `
                <div style="margin-bottom: 14px; padding: 10px; background: #f8fafc; border-left: 3px solid #f59e0b;">
                    <div style="font-weight: bold; font-size: 12px; color: #0f172a; margin-bottom: 4px;">${b.title}</div>
                    <div style="font-size: 11px; color: #334155; line-height: 1.5;">${b.text}</div>
                </div>
            `).join('')}

            <div style="margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 10px; color: #94a3b8; text-align: center;">
                Аналитический бюллетень портала «Спектр геополитики» • Подготовлено для исследователей и ситуационных центров
            </div>
        `;

        printable.style.position = "fixed";
        printable.style.left = "-9999px";
        printable.style.top = "0";
        printable.style.width = "794px";
        document.body.appendChild(printable);

        const opt = {
            margin: [10, 10, 10, 10],
            filename: `Сводка_мировых_бирж_${new Date().toISOString().slice(0, 10)}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(printable).save().then(() => {
            document.body.removeChild(printable);
        }).catch(err => {
            console.error("PDF generation error:", err);
            if (printable.parentNode) document.body.removeChild(printable);
        });
    };

    // ==================== 6. ИНТЕРАКТИВНАЯ КАРТА И ДАШБОРД АЛЬЯНСОВ ====================
    const allianceSelectorBar = document.getElementById("allianceSelectorBar");
    const allianceDetailCard = document.getElementById("allianceDetailCard");

    function initAlliances() {
        if (!allianceSelectorBar || !GEOPOLITICS_DATA.alliances) return;

        allianceSelectorBar.innerHTML = GEOPOLITICS_DATA.alliances.map(a => `
            <button data-alliance="${a.id}" class="alliance-tab-btn px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${a.id === activeAllianceId ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-amber-500/50'}">
                <i class="fa-solid fa-${a.icon} mr-1.5"></i> ${a.name}
            </button>
        `).join("");

        document.querySelectorAll(".alliance-tab-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                playSound("click");
                activeAllianceId = btn.dataset.alliance;
                document.querySelectorAll(".alliance-tab-btn").forEach(b => {
                    const active = b.dataset.alliance === activeAllianceId;
                    b.className = `alliance-tab-btn px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${active ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-amber-500/50'}`;
                });
                renderActiveAlliance();
            });
        });

        renderActiveAlliance();
    }

    function renderActiveAlliance() {
        const al = GEOPOLITICS_DATA.alliances.find(a => a.id === activeAllianceId);
        if (!al || !allianceDetailCard) return;

        allianceDetailCard.innerHTML = `
            <div class="space-y-6 animate-fade-in">
                <!-- Top Row: Title, Sphere, Badge -->
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                        <div class="flex items-center gap-2.5">
                            <span class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl">
                                <i class="fa-solid fa-${al.icon}"></i>
                            </span>
                            <div>
                                <h3 class="text-2xl font-bold font-serif-title text-white">${al.name}</h3>
                                <div class="text-xs text-slate-400">${al.fullName}</div>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="px-3 py-1 rounded-lg border ${al.badgeClass} text-xs font-bold uppercase tracking-wider">
                            ${al.geopoliticalRealm}
                        </span>
                        <span class="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs font-mono">
                            Участников: <strong>${al.membersCount}</strong>
                        </span>
                    </div>
                </div>

                <!-- 4 Major Balance of Power Metric Boxes -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                        <div class="text-xs uppercase text-slate-400 font-bold mb-1">Доля в ВВП (ППС):</div>
                        <div class="text-2xl font-extrabold text-amber-400 font-serif-title">${al.shareGdpPpp}</div>
                        <div class="text-[11px] text-slate-500 mt-1">от мировой экономики</div>
                    </div>
                    <div class="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                        <div class="text-xs uppercase text-slate-400 font-bold mb-1">Население блока:</div>
                        <div class="text-2xl font-extrabold text-blue-400 font-serif-title">${al.population}</div>
                        <div class="text-[11px] text-slate-500 mt-1">человеческий потенциал</div>
                    </div>
                    <div class="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                        <div class="text-xs uppercase text-slate-400 font-bold mb-1">Добыча нефти:</div>
                        <div class="text-2xl font-extrabold text-emerald-400 font-serif-title">${al.oilProduction}</div>
                        <div class="text-[11px] text-slate-500 mt-1">энергетический вес</div>
                    </div>
                    <div class="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                        <div class="text-xs uppercase text-slate-400 font-bold mb-1">Ядерный статус:</div>
                        <div class="text-lg font-extrabold text-red-400 font-serif-title">${al.nuclearWarheads}</div>
                        <div class="text-[11px] text-slate-500 mt-1">стратегическое сдерживание</div>
                    </div>
                </div>

                <!-- Members List Pills -->
                <div>
                    <span class="text-xs uppercase tracking-wider text-slate-400 font-bold block mb-2">Состав государств-участников:</span>
                    <div class="flex flex-wrap gap-2">
                        ${al.membersList.map(m => `
                            <span class="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-200 text-xs font-medium">
                                ${m}
                            </span>
                        `).join("")}
                    </div>
                </div>

                <!-- Doctrine & Strengths Breakdown -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800">
                        <h4 class="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                            <i class="fa-solid fa-scroll"></i> Главная геостратегическая доктрина:
                        </h4>
                        <p class="text-xs sm:text-sm text-slate-200 leading-relaxed mb-4">${al.mainDoctrine}</p>
                        
                        <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1.5">Ключевые преимущества:</span>
                        <ul class="space-y-1.5 text-xs text-slate-300 list-disc pl-4 marker:text-emerald-500">
                            ${al.keyStrengths.map(s => `<li>${s}</li>`).join("")}
                        </ul>
                    </div>

                    <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
                        <div>
                            <h4 class="text-xs font-bold uppercase tracking-wider text-red-400 mb-2 flex items-center gap-1.5">
                                <i class="fa-solid fa-triangle-exclamation"></i> Внутренние противоречия & Уязвимости:
                            </h4>
                            <p class="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">${al.strategicFrictions}</p>
                        </div>
                        <div class="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                            <span>Позиционирование: <strong>${al.geopoliticalRealm}</strong></span>
                            <button onclick="window.discussAllianceInChat('${al.name}')" class="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:brightness-110">
                                В чат по альянсу
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    window.discussAllianceInChat = function(allianceName) {
        playSound("click");
        switchChatChannel("general");
        const chatSec = document.getElementById("chat-section");
        if (chatSec) chatSec.scrollIntoView({ behavior: "smooth" });
        const input = document.getElementById("chatMessageInput");
        if (input) {
            input.value = `[Анализ блока ${allianceName}] `;
            input.focus();
        }
    };

    // ==================== 7. РАСШИРЕННАЯ АНАЛИТИКА ПО МАКРОРЕГИОНАМ ====================
    const regionsGrid = document.getElementById("regionsGrid");

    function renderRegions() {
        if (!regionsGrid || !GEOPOLITICS_DATA.regions) return;

        regionsGrid.innerHTML = GEOPOLITICS_DATA.regions.map(r => `
            <div class="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-amber-500/40 flex flex-col justify-between transition-all group">
                <div>
                    <!-- Header -->
                    <div class="flex items-start justify-between gap-3 mb-3">
                        <div class="flex items-center gap-2.5">
                            <span class="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                                <i class="fa-solid fa-${r.icon}"></i>
                            </span>
                            <h3 class="text-base font-bold text-white font-serif-title">${r.name}</h3>
                        </div>
                    </div>

                    <!-- Tension Indicator Badge -->
                    <div class="flex items-center gap-2 mb-3">
                        <span class="px-2.5 py-0.5 rounded text-[10px] font-bold border ${r.tensionColor}">
                            ${r.tension}
                        </span>
                        <span class="text-[11px] text-slate-400 line-clamp-1">${r.status}</span>
                    </div>

                    <!-- Summary -->
                    <p class="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-3">
                        ${r.summary}
                    </p>

                    <!-- Key Conflict Nodes -->
                    <div class="mb-4 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Ключевые узлы & маршруты:</span>
                        <ul class="space-y-1 text-xs text-slate-300 list-disc pl-4 marker:text-amber-500">
                            ${r.keyNodes.map(node => `<li class="line-clamp-2">${node}</li>`).join("")}
                        </ul>
                    </div>
                </div>

                <!-- Strategic Imperative -->
                <div class="pt-3 border-t border-slate-800 text-xs text-slate-400">
                    <strong class="text-amber-300">Стратегический императив:</strong> ${r.strategicImperative}
                </div>
            </div>
        `).join("");
    }

    // ==================== 8. ИЗБРАННОЕ (BOOKMARKS) ====================
    window.toggleFavorite = function(bookKey, e) {
        if (e) e.stopPropagation();
        playSound("click");
        const idx = favoriteBooks.indexOf(bookKey);
        if (idx === -1) {
            favoriteBooks.push(bookKey);
            showToast("Книга добавлена в вашу библиотеку!");
        } else {
            favoriteBooks.splice(idx, 1);
            showToast("Книга удалена из вашей библиотеки");
        }
        localStorage.setItem("spektr_favorites", JSON.stringify(favoriteBooks));
        updateFavoritesBadge();
        renderAuthors();
    };

    function updateFavoritesBadge() {
        const badge = document.getElementById("favCountBadge");
        if (badge) badge.textContent = favoriteBooks.length;
    }

    const favoritesFilterBtn = document.getElementById("favoritesFilterBtn");
    if (favoritesFilterBtn) {
        favoritesFilterBtn.addEventListener("click", () => {
            playSound("click");
            onlyFavorites = !onlyFavorites;
            if (onlyFavorites) {
                favoritesFilterBtn.classList.add("bg-amber-500", "text-slate-950", "border-amber-400");
                favoritesFilterBtn.classList.remove("bg-slate-900", "text-slate-300");
            } else {
                favoritesFilterBtn.classList.remove("bg-amber-500", "text-slate-950", "border-amber-400");
                favoritesFilterBtn.classList.add("bg-slate-900", "text-slate-300");
            }
            renderAuthors();
        });
    }

    // ==================== 9. ЗВУКОВОЙ ТЕРМИНАЛ ====================
    const soundToggleBtn = document.getElementById("soundToggleBtn");
    if (soundToggleBtn) {
        soundToggleBtn.addEventListener("click", () => {
            soundEnabled = !soundEnabled;
            if (soundEnabled) {
                soundToggleBtn.innerHTML = '<i class="fa-solid fa-volume-high text-amber-400"></i>';
                playSound("click");
                showToast("Звуковые эффекты терминала включены");
            } else {
                soundToggleBtn.innerHTML = '<i class="fa-solid fa-volume-xmark text-slate-500"></i>';
                showToast("Звуковые эффекты выключены");
            }
        });
    }

    // ==================== 10. CHOKE POINTS DATA ====================
    const CHOKE_POINTS = [
        {
            id: "hormuz",
            name: "Ормузский пролив",
            location: "Персидский залив / Оманский залив",
            traffic: "21 млн барр./сутки (~21% мировой нефти)",
            control: "Иран / Оман / ОАЭ",
            desc: "Узкая артерия шириной всего 33 км в самом узком месте. Главный энергетический нерв планеты. Любое перекрытие парализует энергоснабжение Восточной Азии (Китай, Япония, Южная Корея) и вызовет взлет цен на энергоносители."
        },
        {
            id: "malacca",
            name: "Малаккский пролив",
            location: "Между Малайзией, Индонезией и Сингапуром",
            traffic: "~90 000 судов в год, 25% мировой торговли",
            control: "Сингапур / Малайзия / Индонезия",
            desc: "«Малаккская дилемма» Китая: до 80% импорта китайской сырой нефти проходит через этот узкий пролив (глубина фарватера всего 25 м). Контроль над ним ВМС США или союзников — ключевой рычаг сдерживания Пекина."
        },
        {
            id: "suez",
            name: "Суэцкий канал",
            location: "Египет (Красное море — Средиземное море)",
            traffic: "~12% глобальной торговли, 30% контейнеров",
            control: "Египет",
            desc: "Кратчайший морской путь между Европой и Азией без необходимости огибать Африку вокруг мыса Доброй Надежды. Экономит до 10–14 дней пути."
        },
        {
            id: "mandeb",
            name: "Баб-эль-Мандеб",
            location: "Южные ворота Красного моря (Йемен / Джибути)",
            traffic: "~6,2 млн барр./сутки сырой нефти",
            control: "Йемен / Джибути / Эритрея",
            desc: "«Врата слез». Узкий пролив между Аравией и Африканским Рогом. Контролируется хуситами Йемена и базой великих держав в Джибути (где рядом расположены базы США, Китая, Франции и Японии)."
        },
        {
            id: "bosphorus",
            name: "Босфор и Дарданеллы",
            location: "Турция (Черное море — Средиземное море)",
            traffic: "~48 000 судов в год",
            control: "Турция (Конвенция Монтрё 1936)",
            desc: "Ключ к Черному морю и выходу России и причерноморских государств в Средиземноморье. Режим конвенции Монтрё дает Анкаре колоссальное право регулировать проход военных кораблей нечерноморских стран в военное время."
        },
        {
            id: "gibraltar",
            name: "Гибралтарский пролив",
            location: "Между Испанией и Марокко (Атлантика — Средиземное море)",
            traffic: "~100 000 судов в год",
            control: "Великобритания (Гибралтар) / Испания / Марокко",
            desc: "Западные ворота Средиземного моря. Историческая морская цитадель Великобритании со времен Трафальгара, запирающая выход средиземноморских флотов в открытый океан."
        }
    ];

    // ==================== 11. DOM ELEMENTS ДЛЯ БИБЛИОТЕКИ ====================
    const eraContainer = document.getElementById("eraFilterContainer");
    const schoolContainer = document.getElementById("schoolFilterContainer");
    const authorsGrid = document.getElementById("authorsGrid");
    const mainSearchInput = document.getElementById("mainSearchInput");
    const headerSearchInput = document.getElementById("headerSearchInput");
    const clearSearchBtn = document.getElementById("clearSearchBtn");
    const sortSelect = document.getElementById("sortSelect");
    const authorsCountEl = document.getElementById("authorsCount");
    const booksCountEl = document.getElementById("booksCount");
    const activeFilterBadge = document.getElementById("activeFilterBadge");
    const noResultsEl = document.getElementById("noResults");
    const resetAllFiltersBtn = document.getElementById("resetAllFiltersBtn");

    const heroQuoteText = document.getElementById("heroQuoteText");
    const heroQuoteAuthor = document.getElementById("heroQuoteAuthor");
    const prevQuoteBtn = document.getElementById("prevQuoteBtn");
    const nextQuoteBtn = document.getElementById("nextQuoteBtn");

    const chokeGrid = document.getElementById("chokePointsGrid");
    const chokeDetailBox = document.getElementById("chokeDetailBox");

    const glossaryGrid = document.getElementById("glossaryGrid");
    const glossarySearchInput = document.getElementById("glossarySearchInput");

    const detailModal = document.getElementById("detailModal");
    const modalContent = document.getElementById("modalContent");
    const closeModalBtn = document.getElementById("closeModalBtn");

    // ==================== 12. ФИЛЬТРЫ И КАТАЛОГ АВТОРОВ ====================
    function initFilters() {
        eraContainer.innerHTML = GEOPOLITICS_DATA.eras.map(era => `
            <button data-era="${era.id}" class="era-btn px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${era.id === currentEra ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:border-amber-500/50'}">
                <i class="fa-solid fa-${era.icon} mr-1.5 opacity-80"></i> ${era.name}
            </button>
        `).join("");

        schoolContainer.innerHTML = `
            <span class="text-xs uppercase tracking-wider text-slate-400 mr-1 font-semibold">Школа:</span>
            ${GEOPOLITICS_DATA.schools.map(school => `
                <button data-school="${school.id}" class="school-btn px-3 py-1 text-xs rounded-lg border transition-all ${school.id === currentSchool ? 'bg-slate-100 border-white text-slate-950 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'}">
                    ${school.name}
                </button>
            `).join("")}
        `;

        document.querySelectorAll(".era-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                playSound("click");
                currentEra = btn.dataset.era;
                updateFilterUI();
                renderAuthors();
            });
        });

        document.querySelectorAll(".school-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                playSound("click");
                currentSchool = btn.dataset.school;
                updateFilterUI();
                renderAuthors();
            });
        });
    }

    function updateFilterUI() {
        document.querySelectorAll(".era-btn").forEach(btn => {
            const active = btn.dataset.era === currentEra;
            btn.className = `era-btn px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${active ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:border-amber-500/50'}`;
        });

        document.querySelectorAll(".school-btn").forEach(btn => {
            const active = btn.dataset.school === currentSchool;
            btn.className = `school-btn px-3 py-1 text-xs rounded-lg border transition-all ${active ? 'bg-slate-100 border-white text-slate-950 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'}`;
        });

        if (onlyFavorites && activeFilterBadge) {
            activeFilterBadge.classList.remove("hidden");
            activeFilterBadge.textContent = "Только избранное";
        } else if (activeFilterBadge) {
            activeFilterBadge.classList.add("hidden");
        }
    }

    function getFilteredAuthors() {
        let list = [...GEOPOLITICS_DATA.authors];

        if (currentEra !== "all") {
            list = list.filter(a => a.era === currentEra);
        }

        if (currentSchool !== "all") {
            list = list.filter(a => a.school === currentSchool);
        }

        if (onlyFavorites) {
            list = list.filter(a => {
                return a.books.some((b, i) => favoriteBooks.includes(`${a.id}-${i + 1}`));
            });
        }

        if (searchQuery.trim() !== "") {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(a => {
                const inAuthor = a.name.toLowerCase().includes(q) || 
                                 a.nameOrig.toLowerCase().includes(q) || 
                                 a.country.toLowerCase().includes(q) ||
                                 a.role.toLowerCase().includes(q) ||
                                 a.bio.toLowerCase().includes(q) ||
                                 a.mainConcepts.some(c => c.toLowerCase().includes(q));

                const inBooks = a.books.some(b => 
                    b.title.toLowerCase().includes(q) || 
                    b.titleOrig.toLowerCase().includes(q) || 
                    b.description.toLowerCase().includes(q) ||
                    b.keyPoints.some(kp => kp.toLowerCase().includes(q))
                );

                return inAuthor || inBooks;
            });
        }

        if (currentSort === "chronological") {
            // default
        } else if (currentSort === "alpha") {
            list.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
        } else if (currentSort === "books") {
            list.sort((a, b) => b.books.length - a.books.length);
        } else if (currentSort === "popular") {
            list.sort((a, b) => {
                const viewsA = a.books.reduce((sum, _, i) => sum + getBookStats(`${a.id}-${i+1}`).views, 0);
                const viewsB = b.books.reduce((sum, _, i) => sum + getBookStats(`${b.id}-${i+1}`).views, 0);
                return viewsB - viewsA;
            });
        } else if (currentSort === "downloads") {
            list.sort((a, b) => {
                const dlA = a.books.reduce((sum, _, i) => sum + getBookStats(`${a.id}-${i+1}`).downloads, 0);
                const dlB = b.books.reduce((sum, _, i) => sum + getBookStats(`${b.id}-${i+1}`).downloads, 0);
                return dlB - dlA;
            });
        }

        return list;
    }

    // View Mode State (books showcase vs authors grid)
    let currentLibraryView = "books"; // "books" or "authors"

    function setupLibraryViewSwitcher() {
        const viewBooksBtn = document.getElementById("viewBooksBtn");
        const viewAuthorsBtn = document.getElementById("viewAuthorsBtn");
        const booksGrid = document.getElementById("booksGrid");
        const authorsGrid = document.getElementById("authorsGrid");

        if (!viewBooksBtn || !viewAuthorsBtn || !booksGrid || !authorsGrid) return;

        viewBooksBtn.addEventListener("click", () => {
            playSound("click");
            currentLibraryView = "books";
            booksGrid.classList.remove("hidden");
            authorsGrid.classList.add("hidden");

            viewBooksBtn.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all bg-amber-500 text-slate-950 shadow-md flex items-center gap-1.5";
            viewAuthorsBtn.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-white flex items-center gap-1.5";
        });

        viewAuthorsBtn.addEventListener("click", () => {
            playSound("click");
            currentLibraryView = "authors";
            booksGrid.classList.add("hidden");
            authorsGrid.classList.remove("hidden");

            viewAuthorsBtn.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all bg-amber-500 text-slate-950 shadow-md flex items-center gap-1.5";
            viewBooksBtn.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-white flex items-center gap-1.5";
        });
    }

    function renderBooksShowcase(authors) {
        const booksGrid = document.getElementById("booksGrid");
        if (!booksGrid) return;

        let allBooks = [];
        authors.forEach(author => {
            const schoolObj = GEOPOLITICS_DATA.schools.find(s => s.id === author.school) || {};
            author.books.forEach((b, bIdx) => {
                const bKey = `${author.id}-${bIdx + 1}`;
                const bStats = getBookStats(bKey);
                allBooks.push({
                    author,
                    schoolObj,
                    book: b,
                    bIdx,
                    bKey,
                    stats: bStats
                });
            });
        });

        // Apply sort
        const sortMode = sortSelect ? sortSelect.value : "chronological";
        if (sortMode === "popular") {
            allBooks.sort((a, b) => b.stats.views - a.stats.views);
        } else if (sortMode === "downloads") {
            allBooks.sort((a, b) => b.stats.downloads - a.stats.downloads);
        } else if (sortMode === "alpha") {
            allBooks.sort((a, b) => a.book.title.localeCompare(b.book.title, 'ru'));
        }

        if (allBooks.length === 0) {
            booksGrid.innerHTML = `
                <div class="col-span-full py-16 text-center glass-panel rounded-2xl border-dashed border-slate-700">
                    <i class="fa-solid fa-book-open text-slate-600 text-3xl mb-3"></i>
                    <p class="text-sm text-slate-400">По выбранным фильтрам книги не найдены.</p>
                </div>
            `;
            return;
        }

        booksGrid.innerHTML = allBooks.map(item => {
            const { author, schoolObj, book, bIdx, bKey, stats } = item;
            const isFav = favoriteBooks.includes(bKey);

            return `
                <div class="book-showcase-card glass-panel rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden flex flex-col justify-between group shadow-xl">
                    
                    <!-- Book Header Banner with Spine Styling -->
                    <div class="book-cover-mockup p-5 border-b border-slate-800/80 relative">
                        <div class="flex items-start justify-between gap-3 mb-2">
                            <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${schoolObj.badge || 'border-amber-500/30 text-amber-300 bg-amber-500/10'}">
                                ${schoolObj.name || author.school.toUpperCase()}
                            </span>
                            <div class="flex items-center gap-2">
                                <span class="text-[11px] font-mono text-amber-400 font-bold bg-slate-950/80 px-2 py-0.5 rounded border border-amber-500/20">
                                    ${book.year} г.
                                </span>
                                <button onclick="window.toggleFavorite('${bKey}', event)" title="${isFav ? 'В избранном' : 'Добавить в избранное'}" class="text-sm ${isFav ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'} transition-colors p-1">
                                    <i class="fa-${isFav ? 'solid' : 'regular'} fa-star"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Big Book Title -->
                        <h3 class="text-lg font-extrabold font-serif-title text-white group-hover:text-amber-400 transition-colors leading-snug mb-1">
                            ${book.title}
                        </h3>
                        <div class="text-[11px] text-slate-400 italic mb-3">
                            ${book.titleOrig}
                        </div>

                        <!-- Author Pill -->
                        <div class="inline-flex items-center gap-2 bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded-lg">
                            <div class="w-5 h-5 rounded-md bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center font-mono">
                                ${author.avatar}
                            </div>
                            <span class="text-xs font-semibold text-slate-200">${author.name}</span>
                            <span class="text-[10px] text-slate-500 font-mono">(${author.years})</span>
                        </div>
                    </div>

                    <!-- Book Body Content -->
                    <div class="p-5 flex-grow flex flex-col justify-between">
                        <div>
                            <!-- Description -->
                            <p class="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-3">
                                ${book.description}
                            </p>

                            <!-- Key Thesis Highlight -->
                            ${book.keyPoints && book.keyPoints[0] ? `
                                <div class="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 mb-4">
                                    <div class="text-[9px] uppercase font-bold tracking-wider text-amber-500/90 mb-1 flex items-center gap-1">
                                        <i class="fa-solid fa-quote-left text-[8px]"></i> Ключевой тезис:
                                    </div>
                                    <div class="text-xs text-slate-300 line-clamp-2 italic">
                                        «${book.keyPoints[0]}»
                                    </div>
                                </div>
                            ` : ''}
                        </div>

                        <div>
                            <!-- Views & Downloads Counter -->
                            <div class="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-4 pt-3 border-t border-slate-800/80">
                                <span class="flex items-center gap-1.5 text-slate-300" title="Просмотры">
                                    <i class="fa-solid fa-eye text-amber-400"></i> ${formatNumber(stats.views)}
                                </span>
                                <span class="flex items-center gap-1.5 text-slate-300" title="Скачано">
                                    <i class="fa-solid fa-download text-emerald-400"></i> ${formatNumber(stats.downloads)}
                                </span>
                                <span class="text-slate-500">${author.country}</span>
                            </div>

                            <!-- 3 BIG PROMINENT 1-CLICK DOWNLOAD BUTTONS -->
                            <div class="grid grid-cols-3 gap-2 mb-2">
                                <button onclick="window.downloadBookSummary('${author.id}', ${bIdx}, 'txt')" 
                                        class="py-2.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/10 hover:shadow-amber-500/30"
                                        title="Скачать полный труд в формате TXT">
                                    <i class="fa-solid fa-file-lines text-slate-950"></i>
                                    <span>TXT</span>
                                </button>

                                <button onclick="window.downloadBookSummary('${author.id}', ${bIdx}, 'md')" 
                                        class="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white border border-slate-700 hover:border-blue-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                                        title="Скачать в формате Markdown (Obsidian / Notion)">
                                    <i class="fa-brands fa-markdown text-blue-400"></i>
                                    <span>MD</span>
                                </button>

                                <button onclick="window.exportBookToPdf('${author.id}', ${bIdx})" 
                                        class="py-2.5 px-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-900/30"
                                        title="Экспорт конспекта книги в PDF на фирменном бланке">
                                    <i class="fa-solid fa-file-pdf"></i>
                                    <span>PDF</span>
                                </button>
                            </div>

                            <!-- Read Online Modal Button -->
                            <button onclick="window.openAuthorModal('${author.id}')" 
                                    class="w-full py-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-amber-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors">
                                <i class="fa-solid fa-book-open text-[10px]"></i>
                                <span>Читать онлайн & Конспект</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    }

    function renderAuthors() {
        const authors = getFilteredAuthors();
        
        authorsCountEl.textContent = authors.length;
        const totalBooks = authors.reduce((sum, a) => sum + a.books.length, 0);
        booksCountEl.textContent = totalBooks;

        const booksGrid = document.getElementById("booksGrid");

        if (authors.length === 0) {
            authorsGrid.innerHTML = "";
            if (booksGrid) booksGrid.innerHTML = "";
            noResultsEl.classList.remove("hidden");
            return;
        } else {
            noResultsEl.classList.add("hidden");
        }

        // Render both views
        renderBooksShowcase(authors);

        authorsGrid.innerHTML = authors.map(author => {
            const schoolObj = GEOPOLITICS_DATA.schools.find(s => s.id === author.school) || {};

            const authorTotalViews = author.books.reduce((sum, _, i) => sum + getBookStats(`${author.id}-${i+1}`).views, 0);
            const authorTotalDownloads = author.books.reduce((sum, _, i) => sum + getBookStats(`${author.id}-${i+1}`).downloads, 0);

            return `
                <div class="glass-panel p-6 rounded-2xl flex flex-col justify-between book-card animate-fade-in border border-amber-500/20 hover:border-amber-500/60 group">
                    <div>
                        <!-- Header: Avatar + Meta -->
                        <div class="flex items-start justify-between gap-4 mb-4">
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-900 border border-amber-400/30 flex items-center justify-center font-serif-title font-bold text-amber-100 text-lg shadow-md group-hover:scale-105 transition-transform">
                                    ${author.avatar}
                                </div>
                                <div>
                                    <h3 class="text-lg font-bold text-white group-hover:text-amber-400 transition-colors font-serif-title">${author.name}</h3>
                                    <div class="text-xs text-slate-400">${author.nameOrig} • <span class="text-amber-400/90">${author.years}</span></div>
                                </div>
                            </div>
                            <span class="px-2 py-0.5 text-[11px] rounded border ${schoolObj.badge || 'border-slate-700 text-slate-400'} whitespace-nowrap">
                                ${author.country}
                            </span>
                        </div>

                        <!-- Stats Badge: Views & Downloads for Author -->
                        <div class="flex items-center gap-3 text-[11px] font-mono text-slate-400 mb-3 bg-slate-900/70 px-2.5 py-1.5 rounded-lg border border-slate-800">
                            <span class="flex items-center gap-1.5 text-amber-400/90" title="Просмотры автора">
                                <i class="fa-solid fa-eye text-amber-500"></i> ${formatNumber(authorTotalViews)}
                            </span>
                            <span class="text-slate-600">•</span>
                            <span class="flex items-center gap-1.5 text-emerald-400/90" title="Скачано конспектов">
                                <i class="fa-solid fa-download text-emerald-500"></i> ${formatNumber(authorTotalDownloads)}
                            </span>
                        </div>

                        <!-- Role description -->
                        <p class="text-xs font-medium text-amber-300/90 mb-3">${author.role}</p>

                        <!-- Bio summary -->
                        <p class="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-3">
                            ${author.bio}
                        </p>

                        <!-- Key Concepts Tags -->
                        <div class="mb-5">
                            <span class="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1.5">Главные концепции:</span>
                            <div class="flex flex-wrap gap-1.5">
                                ${author.mainConcepts.map(concept => `
                                    <span class="px-2 py-0.5 text-[11px] rounded bg-slate-900/90 border border-slate-700/80 text-slate-300">
                                        ${concept}
                                    </span>
                                `).join("")}
                            </div>
                        </div>

                        <!-- Books List Preview with TXT and PDF Download Buttons -->
                        <div class="border-t border-slate-800/80 pt-3 mb-4">
                            <div class="flex items-center justify-between text-xs text-slate-400 mb-2 font-semibold">
                                <span>Фундаментальные труды (${author.books.length}):</span>
                            </div>
                            <div class="space-y-2.5">
                                ${author.books.map((b, idx) => {
                                    const bKey = `${author.id}-${idx + 1}`;
                                    const bStats = getBookStats(bKey);
                                    const isFav = favoriteBooks.includes(bKey);

                                    return `
                                        <div class="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-colors">
                                            <div class="flex items-start justify-between gap-2">
                                                <div>
                                                    <span class="font-semibold text-slate-200 text-xs line-clamp-1">${b.title}</span>
                                                    <span class="text-amber-400/90 text-[10px] font-mono">${b.year} г.</span>
                                                </div>
                                                <button onclick="window.toggleFavorite('${bKey}', event)" title="${isFav ? 'В избранном' : 'Добавить в избранное'}" class="text-xs ${isFav ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400'} transition-colors p-1">
                                                    <i class="fa-${isFav ? 'solid' : 'regular'} fa-star"></i>
                                                </button>
                                            </div>

                                            <div class="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px]">
                                                <div class="flex items-center gap-2 text-slate-400 font-mono text-[10px]">
                                                    <span>👁 ${formatNumber(bStats.views)}</span>
                                                    <span>📥 ${formatNumber(bStats.downloads)}</span>
                                                </div>
                                                <div class="flex items-center gap-1">
                                                    <button onclick="window.downloadBookSummary('${author.id}', ${idx}, 'txt')" title="Скачать полную книгу (TXT)" 
                                                            class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-semibold text-[10px] uppercase flex items-center gap-1 transition-all">
                                                        <i class="fa-solid fa-file-lines text-amber-400"></i> TXT
                                                    </button>
                                                    <button onclick="window.downloadBookSummary('${author.id}', ${idx}, 'md')" title="Скачать в Markdown (MD)" 
                                                            class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-semibold text-[10px] uppercase flex items-center gap-1 transition-all">
                                                        <i class="fa-brands fa-markdown text-blue-400"></i> MD
                                                    </button>
                                                    <button onclick="window.exportBookToPdf('${author.id}', ${idx})" title="Экспорт в PDF" 
                                                            class="px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all shadow-sm">
                                                        <i class="fa-solid fa-file-pdf"></i> PDF
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join("")}
                            </div>
                        </div>
                    </div>

                    <!-- Action Button: Open Detail Modal -->
                    <button onclick="window.openAuthorModal('${author.id}')" 
                            class="w-full mt-2 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-semibold uppercase tracking-wider border border-slate-700 hover:border-amber-500 transition-all flex items-center justify-center gap-2">
                        <i class="fa-solid fa-book-open"></i> Детальный разбор & Все книги
                    </button>
                </div>
            `;
        }).join("");
    }

    // ==================== 13. МОДАЛЬНОЕ ОКНО АВТОРА И КНИГ ====================
    window.openAuthorModal = function(authorId) {
        playSound("click");
        const author = GEOPOLITICS_DATA.authors.find(a => a.id === authorId);
        if (!author) return;

        recordView(`${author.id}-1`);

        const schoolObj = GEOPOLITICS_DATA.schools.find(s => s.id === author.school) || {};

        modalContent.innerHTML = `
            <div class="space-y-6">
                <!-- Modal Header -->
                <div class="flex items-start gap-4 pb-4 border-b border-slate-800">
                    <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-serif-title font-bold text-2xl shadow-lg shadow-amber-500/20">
                        ${author.avatar}
                    </div>
                    <div class="flex-grow">
                        <div class="flex items-center justify-between gap-2 flex-wrap">
                            <div class="flex items-center gap-2">
                                <h2 class="text-2xl font-bold font-serif-title text-white">${author.name}</h2>
                                <span class="text-sm text-slate-400">(${author.nameOrig})</span>
                            </div>
                        </div>
                        <div class="text-xs text-amber-400 font-semibold mt-1">
                            ${author.country} • ${author.years} • ${schoolObj.name || ''}
                        </div>
                        <p class="text-xs text-slate-300 mt-1">${author.role}</p>
                    </div>
                </div>

                <!-- Quote Box -->
                <div class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm italic font-serif">
                    «${author.quote}»
                </div>

                <!-- Biography & Context -->
                <div>
                    <h4 class="text-xs uppercase tracking-widest text-slate-400 font-bold mb-2">Биографический контекст & наследие:</h4>
                    <p class="text-sm text-slate-300 leading-relaxed">${author.bio}</p>
                </div>

                <!-- Main Concepts -->
                <div>
                    <h4 class="text-xs uppercase tracking-widest text-slate-400 font-bold mb-2">Ключевой понятийный аппарат:</h4>
                    <div class="flex flex-wrap gap-2">
                        ${author.mainConcepts.map(c => `
                            <span class="px-3 py-1 rounded-lg bg-slate-900 border border-amber-500/30 text-amber-300 text-xs font-medium">
                                ${c}
                            </span>
                        `).join("")}
                    </div>
                </div>

                <!-- Detailed Books Breakdown with TXT & PDF Download Buttons -->
                <div>
                    <h4 class="text-sm uppercase tracking-widest text-amber-400 font-bold mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-landmark"></i> Разбор фундаментальных произведений & Скачивание:
                    </h4>
                    <div class="space-y-4">
                        ${author.books.map((b, i) => {
                            const bKey = `${author.id}-${i + 1}`;
                            const bStats = getBookStats(bKey);
                            const isFav = favoriteBooks.includes(bKey);

                            return `
                                <div class="p-5 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-amber-500/40 transition-colors">
                                    <div class="flex items-start justify-between gap-3 mb-2">
                                        <div>
                                            <h5 class="text-base font-bold text-white font-serif-title">${i + 1}. ${b.title}</h5>
                                            <div class="text-xs text-slate-400 italic">${b.titleOrig}</div>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="px-2.5 py-1 text-xs rounded bg-amber-500/20 text-amber-300 font-mono font-bold whitespace-nowrap">
                                                ${b.year} г.
                                            </span>
                                            <button onclick="window.toggleFavorite('${bKey}', event)" class="p-1 text-sm ${isFav ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'}">
                                                <i class="fa-${isFav ? 'solid' : 'regular'} fa-star"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <p class="text-xs text-slate-300 mb-3 leading-relaxed">${b.description}</p>
                                    
                                    <div class="mb-3">
                                        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Ключевые тезисы работы:</span>
                                        <ul class="space-y-1.5 text-xs text-slate-300 pl-4 list-disc marker:text-amber-500">
                                            ${b.keyPoints.map(kp => `<li>${kp}</li>`).join("")}
                                        </ul>
                                    </div>

                                    <div class="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-400 mb-3">
                                        <strong class="text-amber-300">Историческое значение:</strong> ${b.significance}
                                    </div>

                                    <!-- Bottom Action: Live Stats + Dual Download Buttons -->
                                    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
                                        <div class="flex items-center gap-3 text-xs font-mono text-slate-400">
                                            <span><i class="fa-solid fa-eye text-amber-500"></i> ${formatNumber(bStats.views)} просмотров</span>
                                            <span><i class="fa-solid fa-download text-emerald-500"></i> ${formatNumber(bStats.downloads)} скачиваний</span>
                                        </div>
                                        <div class="flex items-center gap-2 w-full sm:w-auto">
                                            <button onclick="window.downloadBookSummary('${author.id}', ${i}, 'txt')" 
                                                    class="flex-grow sm:flex-grow-0 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all">
                                                <i class="fa-solid fa-file-lines text-amber-400"></i> Скачать TXT
                                            </button>
                                            <button onclick="window.downloadBookSummary('${author.id}', ${i}, 'md')" 
                                                    class="flex-grow sm:flex-grow-0 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all">
                                                <i class="fa-brands fa-markdown text-blue-400"></i> Скачать MD
                                            </button>
                                            <button onclick="window.exportBookToPdf('${author.id}', ${i})" 
                                                    class="flex-grow sm:flex-grow-0 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all">
                                                <i class="fa-solid fa-file-pdf"></i> Экспорт в PDF
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join("")}
                    </div>
                </div>
            </div>
        `;

        detailModal.classList.remove("hidden");
        document.body.style.overflow = "hidden";
    };

    function closeModal() {
        detailModal.classList.add("hidden");
        document.body.style.overflow = "auto";
    }

    closeModalBtn.addEventListener("click", closeModal);
    detailModal.addEventListener("click", (e) => {
        if (e.target === detailModal) closeModal();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !detailModal.classList.contains("hidden")) {
            closeModal();
        }
    });

    // ==================== 14. МУЛЬТИКАНАЛЬНЫЙ ЧАТ («ДИАЛОГОВОЕ ОКНО ГЕОПОЛИТИКОВ») ====================
    const chatContainer = document.getElementById("chatMessagesContainer");
    const chatForm = document.getElementById("chatForm");
    const chatInput = document.getElementById("chatMessageInput");
    const chatUserName = document.getElementById("chatUserName");
    const chatUserFaction = document.getElementById("chatUserFaction");
    const navChatBadge = document.getElementById("navChatBadge");
    const floatingChatBadge = document.getElementById("floatingChatBadge");
    const askAiStrategistBtn = document.getElementById("askAiStrategistBtn");
    const toggleFloatingChatBtn = document.getElementById("toggleFloatingChatBtn");
    const currentChatChannelTitle = document.getElementById("currentChatChannelTitle");
    const currentChatChannelDesc = document.getElementById("currentChatChannelDesc");

    const FACTION_MAP = {
        "realist": { name: "Школа Реализма", avatar: "⚖️", color: "text-amber-400", border: "border-amber-500/30" },
        "russian": { name: "Хартленд (Евразия)", avatar: "🐻", color: "text-red-400", border: "border-red-500/30" },
        "anglo": { name: "Атлантист (Sea Power)", avatar: "⚓", color: "text-blue-400", border: "border-blue-500/30" },
        "asian": { name: "Восточная школа", avatar: "🐉", color: "text-purple-400", border: "border-purple-500/30" },
        "french": { name: "Поссибилизм", avatar: "🌿", color: "text-emerald-400", border: "border-emerald-500/30" }
    };

    function switchChatChannel(chKey) {
        currentChatChannel = chKey;
        const info = CHANNEL_INFO[chKey] || CHANNEL_INFO["general"];
        if (currentChatChannelTitle) currentChatChannelTitle.textContent = info.title;
        if (currentChatChannelDesc) currentChatChannelDesc.textContent = info.desc;

        document.querySelectorAll(".chat-ch-btn").forEach(btn => {
            const active = btn.dataset.channel === chKey;
            if (active) {
                btn.className = "chat-ch-btn w-full text-left px-3 py-2 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-semibold flex items-center justify-between transition-all";
            } else {
                btn.className = "chat-ch-btn w-full text-left px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 text-xs font-medium hover:text-white transition-all flex items-center justify-between";
            }
        });

        loadChatMessages();
    }

    document.querySelectorAll(".chat-ch-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            playSound("click");
            switchChatChannel(btn.dataset.channel);
        });
    });

    async function loadChatMessages() {
        try {
            const res = await fetch(`/api/chat?channel=${currentChatChannel}`);
            if (res.ok) {
                const data = await res.json();
                localChat = data;
                renderChat();
                return;
            }
        } catch (e) {}

        // Fallback filter locally
        renderChat();
    }

    function renderChat() {
        if (!chatContainer) return;

        // Filter messages for current channel
        let visible = localChat;
        if (currentChatChannel !== "general") {
            visible = localChat.filter(m => (m.channel || "general") === currentChatChannel);
        }

        if (visible.length === 0) {
            chatContainer.innerHTML = `
                <div class="text-center py-12 text-slate-500 text-xs">
                    <i class="fa-solid fa-comments text-2xl mb-2 text-slate-600 block"></i>
                    В канале ${CHANNEL_INFO[currentChatChannel].title} пока нет сообщений. Будьте первым, кто выскажет стратегическую позицию!
                </div>
            `;
            return;
        }

        chatContainer.innerHTML = visible.map(msg => {
            const fac = FACTION_MAP[msg.faction] || FACTION_MAP["realist"];
            return `
                <div class="p-3.5 sm:p-4 rounded-xl bg-slate-950/70 border ${fac.border} animate-fade-in">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <span class="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-sm shadow-inner">${msg.avatar || fac.avatar}</span>
                            <div>
                                <span class="font-bold text-white text-xs sm:text-sm font-serif-title">${msg.author}</span>
                                <span class="text-[10px] ${fac.color} ml-1 font-semibold uppercase tracking-wider">${msg.factionName || fac.name}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 text-xs text-slate-500 font-mono">
                            <span>${msg.time}</span>
                            <button onclick="window.likeChatMessage('${msg.id}')" class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1">
                                <i class="fa-regular fa-thumbs-up text-[10px]"></i>
                                <span>${msg.likes || 0}</span>
                            </button>
                        </div>
                    </div>
                    <p class="text-xs sm:text-sm text-slate-200 leading-relaxed pl-9">
                        ${msg.text}
                    </p>
                </div>
            `;
        }).join("");

        chatContainer.scrollTop = chatContainer.scrollHeight;

        if (navChatBadge) navChatBadge.textContent = localChat.length;
        if (floatingChatBadge) floatingChatBadge.textContent = localChat.length;
    }

    window.likeChatMessage = function(msgId) {
        playSound("click");
        const msg = localChat.find(m => m.id === msgId);
        if (msg) {
            msg.likes = (msg.likes || 0) + 1;
            renderChat();
            try {
                fetch("/api/chat/like", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ msgId })
                });
            } catch (e) {}
        }
    };

    if (chatForm) {
        chatForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (!text) return;

            playSound("message");

            const author = (chatUserName ? chatUserName.value.trim() : "Аналитик") || "Аналитик";
            const faction = chatUserFaction ? chatUserFaction.value : "realist";
            const facInfo = FACTION_MAP[faction] || FACTION_MAP["realist"];

            const now = new Date();
            const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

            const newMsg = {
                id: "msg-" + Date.now(),
                channel: currentChatChannel,
                author,
                faction,
                factionName: facInfo.name,
                avatar: facInfo.avatar,
                time: timeStr,
                text,
                likes: 0
            };

            localChat.push(newMsg);
            if (localChat.length > 150) localChat.shift();
            localStorage.setItem("spektr_chat", JSON.stringify(localChat));
            renderChat();
            chatInput.value = "";

            try {
                fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newMsg)
                });
            } catch (e) {}
        });
    }

    // Quick emoji buttons
    document.querySelectorAll(".chat-emoji-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            if (chatInput) {
                chatInput.value += " " + btn.dataset.emoji + " ";
                chatInput.focus();
            }
        });
    });

    // Smart Channel-Aware AI Strategic Advisor
    const CHANNEL_AI_MAP = {
        "forums": [
            "«Анализ повестки международных форумов: на саммитах БРИКС и ШОС четко прослеживается создание альтернативной институциональной инфраструктуры расчетов, тогда как в Мюнхене фокус смещен на сдерживание восточного фланга.»",
            "«Давос демонстрирует растущую тревогу транснационального бизнеса: эпоха классической глобализации сменилась фрагментацией и блоковой геоэкономикой.»"
        ],
        "pacific": [
            "«В Индо-Пацифике противостояние завязано на Первую цепь островов и уязвимость Малаккского транзита. США укрепляют AUKUS именно для недопущения превращения Южно-Китайского моря во внутреннее озеро Пекина.»",
            "«Контроль над полупроводниковой индустрией Тайваня — это высшая геоэкономическая ставка XXI века, превосходящая по значимости нефтяные поля XX века.»"
        ],
        "energy": [
            "«Сырьевая география беспощадна: блокировка Ормузского пролива автоматически вызовет глобальный шок предложения нефти, а кризис в Красном море удлиняет морской транзит на 4 000 морских миль.»",
            "«Северный морской путь и континентальные газопроводы Сибири формируют для Евразии неуязвимый тыл, независимый от океанских Choke Points.»"
        ],
        "heartland": [
            "«Постулат Маккиндера подтверждается на наших глазах: сухопутная связность России, Китая и Ирана через МТК „Север — Юг“ образует интеграционную дугу, нейтрализующую давление внешнего полумесяца.»",
            "«Спайкмен справедливо указывал: кто держит Римленд — тот сдерживает Хартленд. Именно поэтому прибрежные дуги Евразии остаются эпицентром напряженности.»"
        ],
        "general": [
            "«В парадигме классического реализма Киссинджера устойчивый мировой порядок требует баланса сил и отказа от односторонней гегемонии.»",
            "«Геополитика изучает фундаментальные закономерности пространства. Политические режимы меняются, но географическое положение государств остается постоянной константой.»"
        ]
    };

    if (askAiStrategistBtn) {
        askAiStrategistBtn.addEventListener("click", () => {
            playSound("message");
            const answers = CHANNEL_AI_MAP[currentChatChannel] || CHANNEL_AI_MAP["general"];
            const randomIndex = Math.floor(Math.random() * answers.length);
            const aiText = answers[randomIndex];

            const now = new Date();
            const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

            const aiMsg = {
                id: "ai-" + Date.now(),
                channel: currentChatChannel,
                author: "AI-Консультант",
                faction: "realist",
                factionName: "Аналитическое Бюро",
                avatar: "🏛️",
                time: timeStr,
                text: aiText,
                likes: 8
            };

            localChat.push(aiMsg);
            localStorage.setItem("spektr_chat", JSON.stringify(localChat));
            renderChat();
            showToast("AI-консультант подготовил аналитическую сводку по теме канала!");

            try {
                fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(aiMsg)
                });
            } catch (e) {}
        });
    }

    if (toggleFloatingChatBtn) {
        toggleFloatingChatBtn.addEventListener("click", () => {
            playSound("click");
            const chatSec = document.getElementById("chat-section");
            if (chatSec) chatSec.scrollIntoView({ behavior: "smooth" });
        });
    }

    // ==================== 15. ИНТЕРАКТИВНЫЙ ТЕСТ: КАКАЯ ВЫ ШКОЛА ====================
    const quizModal = document.getElementById("quizModal");
    const openQuizBtn = document.getElementById("openQuizBtn");
    const closeQuizBtn = document.getElementById("closeQuizBtn");
    const quizContent = document.getElementById("quizContent");

    const QUIZ_QUESTIONS = [
        {
            q: "1. Что является главным источником мощи государства в мировой истории?",
            options: [
                { text: "Морской флот, контроль торговых проливов и морских коммуникаций", score: "anglo" },
                { text: "Контроль над неприступной континентальной сушей (Хартлендом) и ресурсами", score: "russian" },
                { text: "Гибкий баланс сил, прагматичная дипломатия и предотвращение гегемоний", score: "realist" },
                { text: "Экономическая гравитация, терпеливая стратегия и производственные цепочки", score: "asian" }
            ]
        },
        {
            q: "2. Как следует рассматривать государственные границы?",
            options: [
                { text: "Как динамичный рубеж морских баз и передовых океанских рубежей", score: "anglo" },
                { text: "Как периферийный орган живого организма, отражающий давление пространства", score: "russian" },
                { text: "Как линии признанного международным договором баланса безопасности", score: "realist" },
                { text: "Как естественные культурно-цивилизационные ареалы", score: "asian" }
            ]
        },
        {
            q: "3. Каков главный стратегический риск в XXI веке?",
            options: [
                { text: "Блокада критических морских проливов (Choke Points)", score: "anglo" },
                { text: "Потеря сухопутной связности Евразии и окружение со стороны Римленда", score: "russian" },
                { text: "Разрушение ядерного паритета и отсутствие диалога великих держав", score: "realist" },
                { text: "Разрыв глобальных цепочек поставок и торговые эмбарго", score: "asian" }
            ]
        },
        {
            q: "4. Ваша любимая историко-стратегическая формула:",
            options: [
                { text: "«Владеющий морем — владеет торговлей; владеющий торговлей — владеет богатствами мира» (Мэхэн)", score: "anglo" },
                { text: "«Кто правит Хартлендом — тот командует Мировым Островом» (Маккиндер)", score: "russian" },
                { text: "«У государств нет постоянных друзей или врагов, есть лишь постоянные интересы» (Киссинджер)", score: "realist" },
                { text: "«Высшее искусство войны — покорить врага без боя» (Сунь-Цзы)", score: "asian" }
            ]
        }
    ];

    let quizStep = 0;
    let quizScores = { anglo: 0, russian: 0, realist: 0, asian: 0 };

    function renderQuizStep() {
        if (quizStep < QUIZ_QUESTIONS.length) {
            const current = QUIZ_QUESTIONS[quizStep];
            quizContent.innerHTML = `
                <div class="space-y-4">
                    <div class="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                        <span>Вопрос ${quizStep + 1} из ${QUIZ_QUESTIONS.length}</span>
                        <div class="w-32 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div class="bg-amber-500 h-full transition-all" style="width: ${((quizStep + 1) / QUIZ_QUESTIONS.length) * 100}%"></div>
                        </div>
                    </div>
                    <h4 class="text-base font-bold text-white font-serif-title">${current.q}</h4>
                    <div class="space-y-2 mt-4">
                        ${current.options.map((opt, i) => `
                            <button onclick="window.answerQuiz('${opt.score}')" class="w-full text-left p-3.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-amber-400 hover:bg-slate-800 text-xs sm:text-sm text-slate-200 transition-all flex items-start gap-3">
                                <span class="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">${String.fromCharCode(65 + i)}</span>
                                <span>${opt.text}</span>
                            </button>
                        `).join("")}
                    </div>
                </div>
            `;
        } else {
            let highest = "realist";
            let maxScore = -1;
            for (const key in quizScores) {
                if (quizScores[key] > maxScore) {
                    maxScore = quizScores[key];
                    highest = key;
                }
            }

            const DOCTRINES = {
                "anglo": {
                    title: "Атлантический Морской Стратег (Sea Power)",
                    badge: "Школа Альфреда Мэхэна & Николаса Спайкмена",
                    avatar: "⚓",
                    desc: "Ваш образ мысли опирается на океанские коммуникации, мобильность, контроль над морскими Choke Points и прибрежным поясом Римленда. Вы понимаете ценность свободного мореплавания и гибких союзов.",
                    recommend: ["Влияние морской силы на историю (А. Мэхэн)", "География мира (Н. Спайкмен)"]
                },
                "russian": {
                    title: "Континентальный Теллурократ (Хартленд)",
                    badge: "Школа Хэлфорда Маккиндера & Евразийства",
                    avatar: "🐻",
                    desc: "Вы мыслите фундаментальными категориями пространства, защищенности континентальной сердцевины Евразии и суверенной ресурсной базы. Ваша стратегия — связность континента и недопущение окружения.",
                    recommend: ["Географическая ось истории (Х. Маккиндер)", "Основы геополитики (Н. Трубецкой / А. Дугин)"]
                },
                "realist": {
                    title: "Прагматичный Реалист (Realpolitik)",
                    badge: "Школа Генри Киссинджера & Ганса Моргентау",
                    avatar: "⚖️",
                    desc: "Вы не верите в абсолютные догмы и иллюзии. Мир для вас — это непрерывное динамическое равновесие центров силы, где мудрость дипломатии заключается в поддержании баланса и предотвращении разрушительных конфликтов.",
                    recommend: ["Дипломатия (Г. Киссинджер)", "Мировой порядок (Г. Киссинджер)"]
                },
                "asian": {
                    title: "Мастер Долгосрочной Стратегии",
                    badge: "Школа Сунь-Цзы & Геоэкономики",
                    avatar: "🐉",
                    desc: "Вы мыслите категориями веков и экономических приливов. Высшее достижение для вас — победить без открытого сражения через финансовую гравитацию, инфраструктуру и терпеливое выжидание.",
                    recommend: ["Искусство войны (Сунь-Цзы)", "Столкновение цивилизаций (С. Хантингтон)"]
                }
            };

            const result = DOCTRINES[highest] || DOCTRINES["realist"];

            quizContent.innerHTML = `
                <div class="text-center py-2 animate-fade-in">
                    <div class="w-16 h-16 rounded-2xl bg-amber-500/20 text-3xl flex items-center justify-center mx-auto mb-3 border border-amber-500/40">
                        ${result.avatar}
                    </div>
                    <span class="text-xs uppercase tracking-widest text-amber-400 font-bold">${result.badge}</span>
                    <h4 class="text-2xl font-bold font-serif-title text-white mt-1 mb-3">${result.title}</h4>
                    <p class="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 max-w-md mx-auto">
                        ${result.desc}
                    </p>

                    <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left mb-6">
                        <span class="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2">Рекомендуемые книги для вашей доктрины:</span>
                        <ul class="space-y-1.5 text-xs text-slate-300 list-disc pl-4 marker:text-amber-500">
                            ${result.recommend.map(r => `<li><strong>${r}</strong> — доступно для скачивания в PDF и TXT</li>`).join("")}
                        </ul>
                    </div>

                    <div class="flex items-center justify-center gap-3">
                        <button onclick="window.closeQuiz()" class="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:brightness-110">
                            Перейти к книгам
                        </button>
                        <button onclick="window.restartQuiz()" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold">
                            Пройти заново
                        </button>
                    </div>
                </div>
            `;
        }
    }

    window.answerQuiz = function(score) {
        playSound("click");
        if (quizScores[score] !== undefined) {
            quizScores[score] += 1;
        }
        quizStep += 1;
        renderQuizStep();
    };

    window.openQuiz = function() {
        playSound("click");
        quizStep = 0;
        quizScores = { anglo: 0, russian: 0, realist: 0, asian: 0 };
        renderQuizStep();
        quizModal.classList.remove("hidden");
    };

    window.closeQuiz = function() {
        quizModal.classList.add("hidden");
    };

    window.restartQuiz = function() {
        window.openQuiz();
    };

    if (openQuizBtn) openQuizBtn.addEventListener("click", window.openQuiz);
    if (closeQuizBtn) closeQuizBtn.addEventListener("click", window.closeQuiz);

    // ==================== 16. CHOKE POINTS SECTION ====================
    function initChokePoints() {
        chokeGrid.innerHTML = CHOKE_POINTS.map((cp, idx) => `
            <button data-id="${cp.id}" class="choke-btn p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500 text-left transition-all ${idx === 0 ? 'border-amber-500 bg-amber-500/10' : ''}">
                <div class="flex items-center gap-2 mb-1">
                    <span class="w-2 h-2 rounded-full ${idx === 0 ? 'bg-amber-400 glow-dot' : 'bg-slate-600'}"></span>
                    <span class="text-xs font-bold text-slate-200 line-clamp-1">${cp.name}</span>
                </div>
                <div class="text-[10px] text-slate-400 line-clamp-1">${cp.traffic}</div>
            </button>
        `).join("");

        showChokeDetail(CHOKE_POINTS[0]);

        document.querySelectorAll(".choke-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                playSound("click");
                const target = CHOKE_POINTS.find(c => c.id === btn.dataset.id);
                if (target) {
                    document.querySelectorAll(".choke-btn").forEach(b => {
                        b.className = `choke-btn p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500 text-left transition-all`;
                        b.querySelector("span:first-child").className = "w-2 h-2 rounded-full bg-slate-600";
                    });
                    btn.className = `choke-btn p-3 rounded-xl bg-amber-500/10 border border-amber-500 text-left transition-all`;
                    btn.querySelector("span:first-child").className = "w-2 h-2 rounded-full bg-amber-400 glow-dot";
                    showChokeDetail(target);
                }
            });
        });
    }

    function showChokeDetail(cp) {
        chokeDetailBox.innerHTML = `
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                    <h4 class="text-base font-bold text-amber-400 font-serif-title">${cp.name}</h4>
                    <span class="text-xs text-slate-400">${cp.location}</span>
                </div>
                <div class="text-right">
                    <div class="text-xs font-semibold text-slate-200">${cp.traffic}</div>
                    <div class="text-[11px] text-slate-500">Контролирующие субъекты: ${cp.control}</div>
                </div>
            </div>
            <p class="text-xs text-slate-300 mt-3 leading-relaxed">${cp.desc}</p>
        `;
    }

    // ==================== 17. СЛОВАРЬ ТЕРМИНОВ (GLOSSARY) ====================
    function renderGlossary(filter = "") {
        const query = filter.toLowerCase().trim();
        const items = GEOPOLITICS_DATA.glossary.filter(g => 
            g.term.toLowerCase().includes(query) || 
            g.trans.toLowerCase().includes(query) || 
            g.def.toLowerCase().includes(query) ||
            g.author.toLowerCase().includes(query)
        );

        if (items.length === 0) {
            glossaryGrid.innerHTML = `
                <div class="col-span-2 text-center py-8 text-xs text-slate-500">
                    Термин не найден в словаре.
                </div>
            `;
            return;
        }

        glossaryGrid.innerHTML = items.map(g => `
            <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-colors">
                <div class="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                        <h4 class="text-sm font-bold text-white font-serif-title">${g.term}</h4>
                        <span class="text-xs text-amber-400/90">${g.trans}</span>
                    </div>
                    <span class="text-[10px] uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded whitespace-nowrap">
                        ${g.author}
                    </span>
                </div>
                <p class="text-xs text-slate-300 leading-relaxed mt-2">${g.def}</p>
            </div>
        `).join("");
    }

    // ==================== 18. ЦИТАТНИК ====================
    function updateHeroQuote() {
        const q = GEOPOLITICS_DATA.quotes[currentQuoteIndex];
        heroQuoteText.textContent = `«${q.text}»`;
        heroQuoteAuthor.textContent = `${q.author} — ${q.book}`;
    }

    prevQuoteBtn.addEventListener("click", () => {
        playSound("click");
        currentQuoteIndex = (currentQuoteIndex - 1 + GEOPOLITICS_DATA.quotes.length) % GEOPOLITICS_DATA.quotes.length;
        updateHeroQuote();
    });

    nextQuoteBtn.addEventListener("click", () => {
        playSound("click");
        currentQuoteIndex = (currentQuoteIndex + 1) % GEOPOLITICS_DATA.quotes.length;
        updateHeroQuote();
    });

    setInterval(() => {
        currentQuoteIndex = (currentQuoteIndex + 1) % GEOPOLITICS_DATA.quotes.length;
        updateHeroQuote();
    }, 9000);

    // ==================== 19. ПОИСК И СОРТИРОВКА ====================
    function handleSearch(val) {
        searchQuery = val;
        if (mainSearchInput) mainSearchInput.value = val;
        if (headerSearchInput) headerSearchInput.value = val;
        if (clearSearchBtn) {
            if (val.trim() !== "") {
                clearSearchBtn.classList.remove("hidden");
            } else {
                clearSearchBtn.classList.add("hidden");
            }
        }
        renderAuthors();
    }

    if (mainSearchInput) {
        mainSearchInput.addEventListener("input", (e) => handleSearch(e.target.value));
    }
    if (headerSearchInput) {
        headerSearchInput.addEventListener("input", (e) => {
            handleSearch(e.target.value);
            if (window.scrollY < 400) {
                const libEl = document.getElementById("library");
                if (libEl) libEl.scrollIntoView({ behavior: "smooth" });
            }
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener("click", () => {
            playSound("click");
            handleSearch("");
            if (mainSearchInput) mainSearchInput.focus();
        });
    }

    if (resetAllFiltersBtn) {
        resetAllFiltersBtn.addEventListener("click", () => {
            playSound("click");
            currentEra = "all";
            currentSchool = "all";
            searchQuery = "";
            onlyFavorites = false;
            if (favoritesFilterBtn) {
                favoritesFilterBtn.classList.remove("bg-amber-500", "text-slate-950", "border-amber-400");
                favoritesFilterBtn.classList.add("bg-slate-900", "text-slate-300");
            }
            if (mainSearchInput) mainSearchInput.value = "";
            if (headerSearchInput) headerSearchInput.value = "";
            if (clearSearchBtn) clearSearchBtn.classList.add("hidden");
            updateFilterUI();
            renderAuthors();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener("change", (e) => {
            playSound("click");
            currentSort = e.target.value;
            renderAuthors();
        });
    }

    glossarySearchInput.addEventListener("input", (e) => {
        renderGlossary(e.target.value);
    });

    // ==================== 20. ИНИЦИАЛИЗАЦИЯ ВСЕХ МОДУЛЕЙ ====================
    syncStatsFromServer();
    setupLibraryViewSwitcher();
    initFilters();
    renderAuthors();
    renderForums();
    renderMarketTicker();
    renderMarketIndicators();
    renderMarketThematicBriefs();
    initAlliances();
    renderRegions();
    initChokePoints();
    renderGlossary();
    updateHeroQuote();
    updateFavoritesBadge();
    loadChatMessages();

    // Poll chat every 6 seconds if on server
    setInterval(() => {
        loadChatMessages();
    }, 6000);
});

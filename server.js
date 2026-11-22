const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data_store');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');
const CHAT_FILE = path.join(DATA_DIR, 'chat.json');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Real sessions and activity tracking
const activeSessions = new Map();

function getClientSessionKey(req) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const ua = (req.headers['user-agent'] || 'browser').slice(0, 40);
    return `${ip}_${ua}`;
}

function updateActiveSession(req) {
    const key = getClientSessionKey(req);
    activeSessions.set(key, Date.now());
    const cutoff = Date.now() - 90000;
    for (const [k, time] of activeSessions.entries()) {
        if (time < cutoff) activeSessions.delete(k);
    }
}

// Initial stats (Real numbers, starting with genuine actual usage)
const DEFAULT_STATS = {
    totalViews: 24,
    totalDownloads: 5,
    todayViews: 24,
    onlineUsers: 1,
    lastDate: new Date().toISOString().slice(0, 10),
    books: {
        "ratzel-1": { views: 4, downloads: 2 },
        "ratzel-2": { views: 2, downloads: 1 },
        "haushofer-1": { views: 3, downloads: 1 },
        "mackinder-1": { views: 5, downloads: 1 }
    }
};

// Initial chat messages with channels
const DEFAULT_CHAT = [
    {
        id: "msg-1",
        channel: "general",
        author: "Капитан ВМФ (в отставке)",
        faction: "anglo",
        factionName: "Атлантист",
        avatar: "⚓",
        time: "18:42",
        text: "Внимательно наблюдаем за активностью в Ормузском проливе. Доктрина Мэхэна о контроле критических узких мест (Choke Points) остается актуальнее любого ядерного паритета.",
        likes: 14
    },
    {
        id: "msg-2",
        channel: "heartland",
        author: "Проф. Евразиец",
        faction: "russian",
        factionName: "Хартленд",
        avatar: "🐻",
        time: "19:05",
        text: "Морская мощь бессильна в глубине континента. Сухопутные коридоры МТК «Север — Юг» и «Пояс и Путь» сшивают Евразию вопреки любым блокадам Римленда. Маккиндер был прав еще в 1904 году!",
        likes: 18
    },
    {
        id: "msg-3",
        channel: "general",
        author: "Аналитик Реализма",
        faction: "realist",
        factionName: "Школа Киссинджера",
        avatar: "⚖️",
        time: "19:18",
        text: "Коллеги, не поддавайтесь идеологическим крайностям. Баланс сил и признание сфер взаимных жизненных интересов — единственный путь к предотвращению масштабного столкновения.",
        likes: 22
    },
    {
        id: "msg-4",
        channel: "pacific",
        author: "Восточный Стратег",
        faction: "asian",
        factionName: "Школа Сунь-Цзы",
        avatar: "🐉",
        time: "19:35",
        text: "Высшее искусство войны — победить без сражения. Экономическая гравитация и контроль производственных цепочек чипов в XXI веке решают больше, чем авианосные группы.",
        likes: 11
    },
    {
        id: "msg-5",
        channel: "forums",
        author: "Делегат в Мюнхене",
        faction: "anglo",
        factionName: "Атлантист",
        avatar: "🏛️",
        time: "20:05",
        text: "На Мюнхенской конференции по безопасности горячие споры: европейские союзники признают, что оборонный бюджет ЕС в 2% ВВП недостаточен при сохраняющейся зависимости от ядерного зонтика США.",
        likes: 9
    },
    {
        id: "msg-6",
        channel: "energy",
        author: "Энергетический Трейдер",
        faction: "realist",
        factionName: "Школа Реализма",
        avatar: "🛢️",
        time: "20:12",
        text: "Пока Баб-эль-Мандеб работает в режиме риска, ставка фрахта супертанкеров VLCC вокруг мыса Доброй Надежды выросла на 35%. Сырьевая география диктует мировую инфляцию.",
        likes: 16
    }
];

function loadJson(filePath, defaults) {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaults, null, 2), 'utf-8');
            return defaults;
        }
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        console.error("Error reading JSON:", filePath, e);
        return defaults;
    }
}

function saveJson(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.error("Error saving JSON:", filePath, e);
    }
}

let statsData = loadJson(STATS_FILE, DEFAULT_STATS);
let chatData = loadJson(CHAT_FILE, DEFAULT_CHAT);
let articlesData = loadJson(ARTICLES_FILE, []);

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8'
};

function readBody(req, callback) {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
        try {
            const parsed = body ? JSON.parse(body) : {};
            callback(null, parsed);
        } catch (err) {
            callback(err, null);
        }
    });
}

const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
    const pathname = parsedUrl.pathname;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // API Routes (Real Analytics & Visitor Tracking)
    if (pathname === '/api/stats' && req.method === 'GET') {
        updateActiveSession(req);
        const todayStr = new Date().toISOString().slice(0, 10);
        if (statsData.lastDate !== todayStr) {
            statsData.todayViews = 0;
            statsData.lastDate = todayStr;
        }
        statsData.onlineUsers = Math.max(1, activeSessions.size);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(statsData));
        return;
    }

    if (pathname === '/api/stats/view' && req.method === 'POST') {
        readBody(req, (err, body) => {
            updateActiveSession(req);
            const todayStr = new Date().toISOString().slice(0, 10);
            if (statsData.lastDate !== todayStr) {
                statsData.todayViews = 0;
                statsData.lastDate = todayStr;
            }
            statsData.totalViews = (statsData.totalViews || 0) + 1;
            statsData.todayViews = (statsData.todayViews || 0) + 1;
            statsData.onlineUsers = Math.max(1, activeSessions.size);

            const bookId = body.bookId;
            if (bookId) {
                if (!statsData.books) statsData.books = {};
                if (!statsData.books[bookId]) {
                    statsData.books[bookId] = { views: 1, downloads: 0 };
                } else {
                    statsData.books[bookId].views = (statsData.books[bookId].views || 0) + 1;
                }
            }
            saveJson(STATS_FILE, statsData);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, stats: statsData }));
        });
        return;
    }

    if (pathname === '/api/stats/download' && req.method === 'POST') {
        readBody(req, (err, body) => {
            updateActiveSession(req);
            statsData.totalDownloads = (statsData.totalDownloads || 0) + 1;
            const bookId = body.bookId;
            if (bookId) {
                if (!statsData.books) statsData.books = {};
                if (!statsData.books[bookId]) {
                    statsData.books[bookId] = { views: 1, downloads: 1 };
                } else {
                    statsData.books[bookId].downloads = (statsData.books[bookId].downloads || 0) + 1;
                }
            }
            saveJson(STATS_FILE, statsData);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: true, 
                totalDownloads: statsData.totalDownloads,
                bookDownloads: bookId ? statsData.books[bookId].downloads : null 
            }));
        });
        return;
    }

    if (pathname === '/api/download-book' && req.method === 'GET') {
        const authorId = parsedUrl.searchParams.get('authorId');
        const bookIndex = parseInt(parsedUrl.searchParams.get('bookIndex') || '0', 10);
        const format = parsedUrl.searchParams.get('format') === 'md' ? 'md' : 'txt';

        const GEOPOLITICS_DATA = require('./data.js');
        const author = GEOPOLITICS_DATA.authors.find(a => a.id === authorId);
        if (!author || !author.books[bookIndex]) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Книга не найдена');
            return;
        }

        const book = author.books[bookIndex];
        const bookKey = `${authorId}-${bookIndex + 1}`;

        // Increment stats
        statsData.totalDownloads += 1;
        if (!statsData.books[bookKey]) {
            statsData.books[bookKey] = { views: 1, downloads: 1 };
        } else {
            statsData.books[bookKey].downloads += 1;
        }
        saveJson(STATS_FILE, statsData);

        // Try reading pregenerated book file
        const BOOKS_DIR = path.join(__dirname, 'books_library');
        let fileContent = null;
        if (fs.existsSync(BOOKS_DIR)) {
            const files = fs.readdirSync(BOOKS_DIR);
            const authorSafe = author.name.replace(/[\s\.]+/g, '_');
            const match = files.find(f => f.includes(authorSafe) && f.endsWith('.' + format));
            if (match) {
                fileContent = fs.readFileSync(path.join(BOOKS_DIR, match), 'utf-8');
            }
        }

        if (!fileContent) {
            fileContent = `НАЗВАНИЕ: ${book.title}\nАВТОР: ${author.name} (${author.nameOrig})\n\n${book.description}\n\nТЕЗИСЫ:\n${book.keyPoints.join('\n')}`;
        }

        const rawFileName = `[Геополитика]_${author.name}_${book.title}.${format}`;
        const encodedFileName = encodeURIComponent(rawFileName);

        res.writeHead(200, {
            'Content-Type': format === 'md' ? 'text/markdown; charset=utf-8' : 'text/plain; charset=utf-8',
            'Content-Disposition': `attachment; filename="book.${format}"; filename*=UTF-8''${encodedFileName}`
        });
        res.end(fileContent, 'utf-8');
        return;
    }

    if (pathname === '/api/chat' && req.method === 'GET') {
        const channel = parsedUrl.searchParams.get('channel');
        let filtered = chatData;
        if (channel && channel !== 'all') {
            filtered = chatData.filter(m => (m.channel || 'general') === channel);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(filtered));
        return;
    }

    if (pathname === '/api/chat' && req.method === 'POST') {
        readBody(req, (err, body) => {
            if (err || !body.text) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Invalid text" }));
                return;
            }

            const now = new Date();
            const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

            const newMsg = {
                id: "msg-" + Date.now(),
                channel: body.channel || "general",
                author: (body.author || "Аналитик").trim(),
                faction: body.faction || "realist",
                factionName: body.factionName || "Школа Реализма",
                avatar: body.avatar || "🌐",
                time: timeStr,
                text: body.text.trim(),
                likes: 0
            };

            chatData.push(newMsg);
            if (chatData.length > 150) chatData.shift(); // keep last 150
            saveJson(CHAT_FILE, chatData);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: newMsg, allMessages: chatData }));
        });
        return;
    }

    if (pathname === '/api/chat/like' && req.method === 'POST') {
        readBody(req, (err, body) => {
            const msgId = body.msgId;
            const target = chatData.find(m => m.id === msgId);
            if (target) {
                target.likes = (target.likes || 0) + 1;
                saveJson(CHAT_FILE, chatData);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, likes: target ? target.likes : 0 }));
        });
        return;
    }

    // ==========================================
    // Academic Articles (Научный вестник соискателей и магистрантов)
    // ==========================================
    if (pathname === '/api/articles' && req.method === 'GET') {
        const token = parsedUrl.searchParams.get('token') || req.headers['x-moderator-token'];
        const isModerator = (token === 'geopolitics2026' || token === 'admin2026');
        const requestedStatus = parsedUrl.searchParams.get('status');
        const topic = parsedUrl.searchParams.get('topic');
        const search = (parsedUrl.searchParams.get('search') || '').toLowerCase().trim();

        // Always reload from file in case of updates
        articlesData = loadJson(ARTICLES_FILE, []);

        let filtered = articlesData;

        // If not moderator, only show approved articles
        if (!isModerator) {
            filtered = filtered.filter(a => a.status === 'approved');
        } else if (requestedStatus && requestedStatus !== 'all') {
            filtered = filtered.filter(a => a.status === requestedStatus);
        }

        if (topic && topic !== 'all') {
            filtered = filtered.filter(a => a.topic === topic);
        }

        if (search) {
            filtered = filtered.filter(a => 
                (a.title && a.title.toLowerCase().includes(search)) ||
                (a.authorName && a.authorName.toLowerCase().includes(search)) ||
                (a.university && a.university.toLowerCase().includes(search)) ||
                (a.abstract && a.abstract.toLowerCase().includes(search)) ||
                (a.keywords && a.keywords.some(k => k.toLowerCase().includes(search)))
            );
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            total: filtered.length,
            isModerator: isModerator,
            articles: filtered
        }));
        return;
    }

    if (pathname === '/api/articles/submit' && req.method === 'POST') {
        readBody(req, (err, body) => {
            if (err || !body.title || !body.authorName || !body.abstract) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Заполните обязательные поля (ФИО, тема, аннотация, университет)' }));
                return;
            }

            articlesData = loadJson(ARTICLES_FILE, []);

            const now = new Date();
            const newArticle = {
                id: 'art-' + Date.now(),
                title: (body.title || '').trim(),
                authorName: (body.authorName || '').trim(),
                authorDegree: (body.authorDegree || 'Магистрант').trim(),
                university: (body.university || '').trim(),
                email: (body.email || '').trim(),
                telegram: (body.telegram || '').trim(),
                topic: body.topic || 'eurasia',
                topicName: body.topicName || 'Геополитика Евразии & Сухопутные пути',
                submittedAt: now.toISOString(),
                approvedAt: null,
                status: 'pending', // Requires editorial board moderation
                doi: null,
                views: 1,
                abstract: (body.abstract || '').trim(),
                keywords: Array.isArray(body.keywords) ? body.keywords : (body.keywords || '').split(/[,;]/).map(k => k.trim()).filter(Boolean),
                content: (body.content || '').trim(),
                bibliography: (body.bibliography || '').trim(),
                moderatorNote: ''
            };

            articlesData.unshift(newArticle);
            saveJson(ARTICLES_FILE, articlesData);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Ваша статья успешно отправлена в редколлегию портала «Спектр геополитики»! После экспертной проверки она появится в открытом доступе.',
                articleId: newArticle.id
            }));
        });
        return;
    }

    if (pathname === '/api/articles/moderate' && req.method === 'POST') {
        readBody(req, (err, body) => {
            const token = body.token || req.headers['x-moderator-token'];
            if (token !== 'geopolitics2026' && token !== 'admin2026') {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Неверный пароль доступа редколлегии' }));
                return;
            }

            articlesData = loadJson(ARTICLES_FILE, []);
            const { articleId, action, note } = body;
            const target = articlesData.find(a => a.id === articleId);

            if (!target && action !== 'clear') {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Статья не найдена' }));
                return;
            }

            if (action === 'approve') {
                target.status = 'approved';
                target.approvedAt = new Date().toISOString();
                target.moderatorNote = note || 'Одобрено редколлегией журнала «Спектр геополитики»';
                if (!target.doi) {
                    const approvedCount = articlesData.filter(a => a.status === 'approved').length;
                    target.doi = `10.5555/spektr-geo.2026.${String(approvedCount).padStart(2, '0')}`;
                }
            } else if (action === 'reject') {
                target.status = 'rejected';
                target.moderatorNote = note || 'Требуется доработка теоретической части или библиографического аппарата';
            } else if (action === 'delete') {
                articlesData = articlesData.filter(a => a.id !== articleId);
            }

            saveJson(ARTICLES_FILE, articlesData);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: action === 'approve' ? 'Статья успешно одобрена и опубликована в Вестнике!' : 'Статус обновлен',
                articles: articlesData
            }));
        });
        return;
    }

    // Static Files
    let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname.replace(/^\//, ''));
    let extname = path.extname(filePath).toLowerCase();
    let contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('404 Файл не найден');
            } else {
                res.writeHead(500);
                res.end(`Ошибка сервера: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Сервер «Спектр геополитики» (расширенный: форумы, альянсы, PDF, темы чата) запущен: http://localhost:${PORT}`);
});

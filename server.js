const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data_store');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');
const CHAT_FILE = path.join(DATA_DIR, 'chat.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial stats
const DEFAULT_STATS = {
    totalViews: 154280,
    totalDownloads: 41820,
    todayViews: 3120,
    onlineUsers: 54,
    books: {
        "ratzel-1": { views: 4210, downloads: 1350 },
        "ratzel-2": { views: 2890, downloads: 870 },
        "kjellen-1": { views: 3410, downloads: 1120 },
        "kjellen-2": { views: 2750, downloads: 780 },
        "mahan-1": { views: 8940, downloads: 3420 },
        "mahan-2": { views: 5610, downloads: 1890 },
        "mackinder-1": { views: 12450, downloads: 4920 },
        "mackinder-2": { views: 7830, downloads: 2650 },
        "haushofer-1": { views: 4980, downloads: 1610 },
        "spykman-1": { views: 9340, downloads: 3580 },
        "kissinger-1": { views: 11200, downloads: 4310 },
        "brzezinski-1": { views: 13800, downloads: 5490 },
        "huntington-1": { views: 10450, downloads: 3820 },
        "dugin-1": { views: 6720, downloads: 2210 }
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

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
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

    // API Routes
    if (pathname === '/api/stats' && req.method === 'GET') {
        statsData.onlineUsers = Math.max(42, Math.min(68, Math.floor(52 + (Math.sin(Date.now() / 60000) * 14))));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(statsData));
        return;
    }

    if (pathname === '/api/stats/view' && req.method === 'POST') {
        readBody(req, (err, body) => {
            statsData.totalViews += 1;
            statsData.todayViews += 1;
            const bookId = body.bookId;
            if (bookId) {
                if (!statsData.books[bookId]) {
                    statsData.books[bookId] = { views: 1, downloads: 0 };
                } else {
                    statsData.books[bookId].views += 1;
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
            statsData.totalDownloads += 1;
            const bookId = body.bookId;
            if (bookId) {
                if (!statsData.books[bookId]) {
                    statsData.books[bookId] = { views: 1, downloads: 1 };
                } else {
                    statsData.books[bookId].downloads += 1;
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

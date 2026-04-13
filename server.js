// 服务器端脚本
const http = require('http');
const fs = require('fs');
const path = require('path');

// 加载环境变量
require('dotenv').config();



// 存储登录失败记录
const loginAttempts = {};
const MAX_ATTEMPTS = 3;
const LOCKOUT_TIME = 10 * 60 * 1000; // 10分钟

// 定期清理过期的登录失败记录
setInterval(() => {
    const now = Date.now();
    for (const ip in loginAttempts) {
        if (now - loginAttempts[ip].lastAttempt > LOCKOUT_TIME) {
            delete loginAttempts[ip];
        }
    }
}, 60000); // 每分钟清理一次

const PORT = 8080;
const DATA_DIR = path.join(__dirname, 'data');
const VIDEOS_DIR = path.join(__dirname, 'videos');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 确保视频目录存在
if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

// 数据文件路径
const FILES = {
    articles: path.join(DATA_DIR, 'articles.json'),
    videos: path.join(DATA_DIR, 'videos.json'),
    about: path.join(DATA_DIR, 'about.json')
};

// 初始化默认数据
function initializeData() {
    // 初始化文章数据
    if (!fs.existsSync(FILES.articles)) {
        fs.writeFileSync(FILES.articles, JSON.stringify([], null, 2), { encoding: 'utf8' });
    }
    
    // 初始化视频数据
    if (!fs.existsSync(FILES.videos)) {
        fs.writeFileSync(FILES.videos, JSON.stringify([], null, 2), { encoding: 'utf8' });
    }
    
    // 初始化关于数据
    if (!fs.existsSync(FILES.about)) {
        const defaultAbout = {
            name: '时雨绘华',
            description: '热爱编程，专注前端开发和技术分享。喜欢探索新技术，乐于解决复杂问题。',
            location: '中国 · 武汉',
            email: '2437460945@qq.com',
            phone: '+86 15827483584',
            experiences: [
                {
                    period: '2022 - 至今',
                    title: '高级前端工程师',
                    company: '某知名互联网公司',
                    description: '负责核心产品的前端架构设计和开发'
                },
                {
                    period: '2020 - 2022',
                    title: '前端工程师',
                    company: '某科技公司',
                    description: '参与多个 Web 项目的开发和优化'
                },
                {
                    period: '2018 - 2020',
                    title: '初级前端工程师',
                    company: '某创业公司',
                    description: '负责公司官网和后台管理系统开发'
                }
            ],
            educations: [
                {
                    period: '2014 - 2018',
                    degree: '计算机科学与技术 - 本科',
                    school: '某重点大学',
                    description: '主修软件工程方向'
                }
            ]
        };
        fs.writeFileSync(FILES.about, JSON.stringify(defaultAbout, null, 2), { encoding: 'utf8' });
    }
}

// 读取数据
function readData(file) {
    try {
        const data = fs.readFileSync(file, { encoding: 'utf8' });
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${file}:`, error);
        return [];
    }
}

// 写入数据
function writeData(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2), { encoding: 'utf8' });
        return true;
    } catch (error) {
        console.error(`Error writing ${file}:`, error);
        return false;
    }
}

// 处理 API 请求
function handleApiRequest(req, res, url) {
    console.log('Request received:', req.method, req.url);
    
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, charset=utf-8');
    
    // 处理 OPTIONS 请求
    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
    }
    
    // 解析 URL
    const parts = url.pathname.split('/').filter(Boolean);
    
    if (parts[0] === 'api') {
        const resource = parts[1];
        
        switch (resource) {
            case 'articles':
                handleArticlesRequest(req, res, parts.slice(2));
                break;
            case 'videos':
                handleVideosRequest(req, res, parts.slice(2));
                break;
            case 'about':
                handleAboutRequest(req, res);
                break;
            case 'login':
                handleLoginRequest(req, res);
                break;
            default:
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'Not Found' }));
        }
    } else {
        serveStaticFile(req, res, url);
    }
}

// 处理文章请求
function handleArticlesRequest(req, res, parts) {
    const articles = readData(FILES.articles);
    
    switch (req.method) {
        case 'GET':
            res.end(JSON.stringify(articles));
            break;
        case 'POST':
            let body = Buffer.alloc(0);
            req.on('data', chunk => {
                body = Buffer.concat([body, chunk]);
            });
            req.on('end', () => {
                try {
                    const bodyStr = body.toString('utf8');
                    const newArticle = JSON.parse(bodyStr);
                    newArticle.id = Date.now().toString();
                    newArticle.date = new Date().toISOString().split('T')[0];

                    articles.unshift(newArticle);
                    writeData(FILES.articles, articles);
                    res.statusCode = 201;
                    res.end(JSON.stringify(newArticle));
                } catch (error) {
                    console.error('Error parsing body:', error);
                    res.statusCode = 400;
                    res.end(JSON.stringify({ error: 'Invalid data' }));
                }
            });
            break;
        case 'PUT':
            if (parts[0]) {
                let body = Buffer.alloc(0);
                req.on('data', chunk => {
                    body = Buffer.concat([body, chunk]);
                });
                req.on('end', () => {
                    try {
                        const bodyStr = body.toString('utf8');
                        const updatedArticle = JSON.parse(bodyStr);
                        const index = articles.findIndex(a => a.id === parts[0]);
                        if (index !== -1) {
                            articles[index] = { ...articles[index], ...updatedArticle };
                            writeData(FILES.articles, articles);
                            res.end(JSON.stringify(articles[index]));
                        } else {
                            res.statusCode = 404;
                            res.end(JSON.stringify({ error: 'Article not found' }));
                        }
                    } catch (error) {
                        console.error('Error parsing body:', error);
                        res.statusCode = 400;
                        res.end(JSON.stringify({ error: 'Invalid data' }));
                    }
                });
            } else {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing article ID' }));
            }
            break;
        case 'DELETE':
            if (parts[0]) {
                const filtered = articles.filter(a => a.id !== parts[0]);
                writeData(FILES.articles, filtered);
                res.end(JSON.stringify({ success: true }));
            } else {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing article ID' }));
            }
            break;
        default:
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
}

// 解析 multipart/form-data
function parseFormData(req, callback) {
    const boundary = req.headers['content-type'].split('boundary=')[1];
    let body = Buffer.alloc(0);
    
    req.on('data', chunk => {
        body = Buffer.concat([body, chunk]);
    });
    
    req.on('end', () => {
        const result = {};
        const boundaryBuffer = Buffer.from(`--${boundary}`);
        
        // 分割Buffer而不是转换为字符串
        let start = 0;
        while (start < body.length) {
            const end = body.indexOf(boundaryBuffer, start);
            if (end === -1) break;
            
            const part = body.slice(start, end);
            start = end + boundaryBuffer.length;
            
            // 跳过空部分
            if (part.length < 4) continue;
            
            // 查找头部结束位置
            const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
            if (headerEnd === -1) continue;
            
            const header = part.slice(0, headerEnd).toString();
            const match = header.match(/Content-Disposition: form-data; name="([^"]+)"(?:; filename="([^"]+)")?/);
            
            if (match) {
                const [, name, filename] = match;
                const content = part.slice(headerEnd + 4); // 跳过\r\n\r\n
                if (filename) {
                    // 对于文件，直接保存Buffer
                    result[name] = { filename, content };
                } else {
                    // 对于普通字段，转换为字符串
                    result[name] = content.toString().replace(/\r\n$/, '');
                }
            }
        }
        
        callback(result);
    });
}

// 保存视频文件
function saveVideoFile(fileData, videoId) {
    const ext = path.extname(fileData.filename);
    const videoPath = path.join(VIDEOS_DIR, `${videoId}${ext}`);
    
    // 直接写入Buffer
    fs.writeFileSync(videoPath, fileData.content);
    return `/videos/${videoId}${ext}`;
}

// 处理视频请求
function handleVideosRequest(req, res, parts) {
    const videos = readData(FILES.videos);
    
    switch (req.method) {
        case 'GET':
            res.end(JSON.stringify(videos));
            break;
        case 'POST':
            if (req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/form-data')) {
                parseFormData(req, formData => {
                    try {
                        const newVideo = {
                            id: Date.now().toString(),
                            title: formData.title,
                            description: formData.description,
                            date: new Date().toISOString().split('T')[0],

                        };
                        
                        if (formData.video) {
                            newVideo.videoUrl = saveVideoFile(formData.video, newVideo.id);
                        }
                        
                        videos.unshift(newVideo);
                        writeData(FILES.videos, videos);
                        res.statusCode = 201;
                        res.end(JSON.stringify(newVideo));
                    } catch (error) {
                        console.error('Error processing video upload:', error);
                        res.statusCode = 400;
                        res.end(JSON.stringify({ error: 'Invalid data' }));
                    }
                });
            } else {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Expected multipart/form-data' }));
            }
            break;
        case 'PUT':
            if (parts[0]) {
                if (req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/form-data')) {
                    parseFormData(req, formData => {
                        try {
                            const updatedVideo = {
                                title: formData.title,
                                description: formData.description
                            };
                            
                            const index = videos.findIndex(v => v.id === parts[0]);
                            if (index !== -1) {
                                if (formData.video) {
                                    updatedVideo.videoUrl = saveVideoFile(formData.video, parts[0]);
                                }
                                videos[index] = { ...videos[index], ...updatedVideo };
                                writeData(FILES.videos, videos);
                                res.end(JSON.stringify(videos[index]));
                            } else {
                                res.statusCode = 404;
                                res.end(JSON.stringify({ error: 'Video not found' }));
                            }
                        } catch (error) {
                            console.error('Error processing video update:', error);
                            res.statusCode = 400;
                            res.end(JSON.stringify({ error: 'Invalid data' }));
                        }
                    });
                } else {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ error: 'Expected multipart/form-data' }));
                }
            } else {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing video ID' }));
            }
            break;
        case 'DELETE':
            if (parts[0]) {
                const video = videos.find(v => v.id === parts[0]);
                if (video && video.videoUrl) {
                    const videoPath = path.join(__dirname, video.videoUrl);
                    if (fs.existsSync(videoPath)) {
                        fs.unlinkSync(videoPath);
                    }
                }
                const filtered = videos.filter(v => v.id !== parts[0]);
                writeData(FILES.videos, filtered);
                res.end(JSON.stringify({ success: true }));
            } else {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing video ID' }));
            }
            break;
        default:
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
}

// 处理关于请求
function handleAboutRequest(req, res) {
    switch (req.method) {
        case 'GET':
            const aboutData = readData(FILES.about);
            res.end(JSON.stringify(aboutData));
            break;
        case 'PUT':
            let body = Buffer.alloc(0);
            req.on('data', chunk => {
                body = Buffer.concat([body, chunk]);
            });
            req.on('end', () => {
                try {
                    const bodyStr = body.toString('utf8');
                    const updatedAbout = JSON.parse(bodyStr);
                    writeData(FILES.about, updatedAbout);
                    res.end(JSON.stringify(updatedAbout));
                } catch (error) {
                    console.error('Error parsing body:', error);
                    res.statusCode = 400;
                    res.end(JSON.stringify({ error: 'Invalid data' }));
                }
            });
            break;
        default:
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
}

// 处理登录请求
function handleLoginRequest(req, res) {
    if (req.method === 'POST') {
        let body = Buffer.alloc(0);
        req.on('data', chunk => {
            body = Buffer.concat([body, chunk]);
        });
        req.on('end', () => {
            try {
                // 获取客户端IP地址
                const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                
                // 检查是否被锁定
                if (loginAttempts[clientIP] && loginAttempts[clientIP].attempts >= MAX_ATTEMPTS) {
                    const now = Date.now();
                    if (now - loginAttempts[clientIP].lastAttempt < LOCKOUT_TIME) {
                        res.statusCode = 423;
                        res.end(JSON.stringify({ success: false, message: '登录失败次数过多，请10分钟后再试' }));
                        return;
                    } else {
                        // 锁定时间已过，重置登录失败记录
                        delete loginAttempts[clientIP];
                    }
                }
                
                const bodyStr = body.toString('utf8');
                const loginData = JSON.parse(bodyStr);
                const { username, password } = loginData;
                
                // 从环境变量中获取管理员账号密码
                const adminUsername = process.env.ADMIN_USERNAME;
                const adminPassword = process.env.ADMIN_PASSWORD;
                

                
                if (username === adminUsername && password === adminPassword) {
                    // 登录成功，重置登录失败记录
                    delete loginAttempts[clientIP];
                    res.statusCode = 200;
                    res.end(JSON.stringify({ success: true, message: '登录成功' }));
                } else {
                    // 登录失败，记录失败次数
                    if (!loginAttempts[clientIP]) {
                        loginAttempts[clientIP] = {
                            attempts: 1,
                            lastAttempt: Date.now()
                        };
                    } else {
                        loginAttempts[clientIP].attempts++;
                        loginAttempts[clientIP].lastAttempt = Date.now();
                    }
                    
                    const remainingAttempts = MAX_ATTEMPTS - loginAttempts[clientIP].attempts;
                    let message = '用户名或密码错误';
                    if (remainingAttempts > 0) {
                        message += `，还有${remainingAttempts}次机会`;
                    } else {
                        message = '登录失败次数过多，请10分钟后再试';
                    }
                    
                    res.statusCode = 401;
                    res.end(JSON.stringify({ success: false, message }));
                }
            } catch (error) {
                console.error('Error parsing body:', error);
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, message: '无效的请求数据' }));
            }
        });
    } else {
        res.statusCode = 405;
        res.end(JSON.stringify({ success: false, message: 'Method not allowed' }));
    }
}

// 提供静态文件
function serveStaticFile(req, res, url) {
    const decodedPath = decodeURIComponent(url.pathname);
    let filePath = path.join(__dirname, decodedPath === '/' ? 'index.html' : decodedPath);
    
    // 检查文件是否存在
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // 如果文件不存在，尝试添加 .html 扩展名
            const htmlPath = filePath + '.html';
            fs.access(htmlPath, fs.constants.F_OK, (errHtml) => {
                if (errHtml) {
                    res.statusCode = 404;
                    res.setHeader('Content-Type', 'text/html');
                    res.end('<h1>404 Not Found</h1>');
                } else {
                    serveFile(htmlPath, res);
                }
            });
        } else {
            serveFile(filePath, res);
        }
    });
}

// 提供文件
function serveFile(filePath, res) {
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.jpg':
        case '.jpeg':
            contentType = 'image/jpeg';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.mp4':
            contentType = 'video/mp4';
            break;
        case '.webm':
            contentType = 'video/webm';
            break;
        case '.mov':
            contentType = 'video/quicktime';
            break;
    }
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.statusCode = 500;
            res.end('Internal Server Error');
        } else {
            res.setHeader('Content-Type', contentType);
            res.end(content, 'utf8');
        }
    });
}

// 初始化数据
initializeData();

// 创建服务器
const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    handleApiRequest(req, res, url);
});

// 启动服务器
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('API endpoints:');
    console.log('  GET    /api/articles     - Get all articles');
    console.log('  POST   /api/articles     - Create new article');
    console.log('  PUT    /api/articles/:id - Update article');
    console.log('  DELETE /api/articles/:id - Delete article');
    console.log('  GET    /api/videos       - Get all videos');
    console.log('  POST   /api/videos       - Create new video');
    console.log('  PUT    /api/videos/:id   - Update video');
    console.log('  DELETE /api/videos/:id   - Delete video');
    console.log('  GET    /api/about        - Get about info');
    console.log('  PUT    /api/about        - Update about info');
});

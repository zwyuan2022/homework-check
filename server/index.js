const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { AccessToken } = require('livekit-server-sdk');
const os = require('os');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const httpProxy = require('http-proxy');

const app = express();
const HTTP_PORT = 3000;
const HTTPS_PORT = 3443;
const LIVEKIT_API_KEY = 'devkey';
const LIVEKIT_API_SECRET = 'secret-key-change-in-production';
const LIVEKIT_WS_PORT = 7880;

// 自动获取本机局域网 IPv4 地址（优先真实网卡，跳过虚拟适配器）
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(interfaces)) {
    const isVirtual = /vmware|virtualbox|hyper-v|vethernet|virtual|loopback|bluetooth/i.test(name);
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (!isVirtual) {
          return iface.address;
        }
        candidates.push(iface.address);
      }
    }
  }
  return candidates[0] || '127.0.0.1';
}
const LOCAL_IP = getLocalIP();

// 返回 HTTPS/WSS 地址（局域网访问需要安全上下文才能使用屏幕共享）
function getWsUrl() {
  return `wss://${LOCAL_IP}:${HTTPS_PORT}`;
}

const rooms = new Map();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
// 从 node_modules 提供 livekit-client（离线可用）
app.use('/lib/livekit-client', express.static(__dirname + '/../node_modules/livekit-client/dist'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/../public/index.html');
});

// 提供服务器信息，前端用于生成正确的邀请地址
app.get('/api/server-info', (req, res) => {
  res.json({
    lanIP: LOCAL_IP,
    httpPort: HTTP_PORT,
    httpsPort: HTTPS_PORT,
    preferredURL: `https://${LOCAL_IP}:${HTTPS_PORT}`,
  });
});

app.post('/api/create-room', (req, res) => {
  const { teacherName } = req.body;
  if (!teacherName) {
    return res.status(400).json({ error: '请输入教师姓名' });
  }
  const roomId = uuidv4().slice(0, 8).toUpperCase();
  const roomCode = `ROOM-${roomId}`;
  rooms.set(roomCode, {
    code: roomCode,
    teacher: teacherName,
    createdAt: Date.now(),
  });
  console.log(`[创建教室] ${roomCode} - 教师: ${teacherName}`);
  res.json({ roomCode });
});

app.post('/api/token', async (req, res) => {
  const { roomCode, userName, role } = req.body;
  if (!roomCode || !userName || !role) {
    return res.status(400).json({ error: '缺少参数' });
  }
  if (!rooms.has(roomCode)) {
    return res.status(404).json({ error: '教室不存在' });
  }

  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: `${role}-${userName}-${Date.now()}`,
    name: userName,
    metadata: JSON.stringify({ role, displayName: userName }),
    ttl: '2h',
  });

  token.addGrant({
    roomCreate: role === 'teacher',
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    room: roomCode,
  });

  const jwt = await token.toJwt();
  console.log(`[生成令牌] ${userName}(${role}) → ${roomCode}`);

  res.json({
    token: jwt,
    wsUrl: getWsUrl(),
    roomCode,
    role,
  });
});

// ---- 启动 HTTP 服务（本地 localhost 用）----
http.createServer(app).listen(HTTP_PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log('  作业检查系统已启动');
  console.log('========================================');
  console.log(`  本机 HTTP : http://localhost:${HTTP_PORT}`);
  console.log(`  局域网 HTTP: http://${LOCAL_IP}:${HTTP_PORT}`);
  console.log('----------------------------------------');
  console.log(`  🔒 局域网 HTTPS: https://${LOCAL_IP}:${HTTPS_PORT}`);
  console.log('     （支持屏幕共享，需接受证书警告）');
  console.log('========================================');
});

// ---- 启动 HTTPS 服务 + WebSocket 代理（局域网屏幕共享用）----
const certPath = path.join(__dirname, 'cert.pem');
const keyPath = path.join(__dirname, 'key.pem');

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };

  // WebSocket 代理：将 WSS 请求转发到 LiveKit WS
  const proxy = httpProxy.createProxyServer({
    target: {
      host: 'localhost',
      port: LIVEKIT_WS_PORT,
      protocol: 'ws:',
    },
    ws: true,
  });

  proxy.on('error', (err, req, socket) => {
    console.error('[代理错误]', err.message);
    if (socket) socket.destroy();
  });

  const httpsServer = https.createServer(httpsOptions, app);

  httpsServer.on('upgrade', (req, socket, head) => {
    console.log(`[WSS 代理] ${req.url}`);
    proxy.ws(req, socket, head);
  });

  httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`  HTTPS 代理已启动，WSS → WS(localhost:${LIVEKIT_WS_PORT})`);
  });
} else {
  console.log('  ⚠ 未找到 SSL 证书，HTTPS 未启用（屏幕共享仅限 localhost）');
}

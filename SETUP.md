# 作业检查系统 — 搭建说明

## 系统概述

基于 Web 的局域网作业检查系统，教师创建教室后，学生可通过浏览器加入并共享屏幕展示作业。教师可查看所有学生屏幕、控制可见范围（仅教师/全班可见），以及听到学生发言。

**技术栈**：Node.js + Express + LiveKit (WebRTC)，纯 HTML/CSS/JS 前端。

---

## 1. 环境要求

- **Node.js** ≥ 18.x（[下载](https://nodejs.org)）
- **Git**（[下载](https://git-scm.com)）
- **OpenSSL**（Git Bash 自带，用于生成证书）
- Windows / macOS / Linux 均可，所有电脑需连接同一局域网

---

## 2. 克隆项目

```bash
git clone https://github.com/zwyuan2022/homework-check.git
cd homework-check
```

---

## 3. 安装依赖

```bash
npm install --registry=https://registry.npmmirror.com
```

---

## 4. 下载 LiveKit Server

LiveKit Server 是 WebRTC 媒体服务器，需单独下载。

**Windows：**
```bash
# 下载最新版本（替换版本号）
curl -L -o livekit-server.zip "https://github.com/livekit/livekit/releases/download/v1.13.2/livekit_1.13.2_windows_amd64.zip"
unzip -o livekit-server.zip
rm livekit-server.zip
```

**macOS：**
```bash
brew install livekit
```

**Linux：**
```bash
curl -L -o livekit-server.tar.gz "https://github.com/livekit/livekit/releases/download/v1.13.2/livekit_1.13.2_linux_amd64.tar.gz"
tar -xzf livekit-server.tar.gz
rm livekit-server.tar.gz
```

---

## 5. 生成 SSL 证书

局域网浏览器要求 HTTPS 安全上下文才允许屏幕共享（`getDisplayMedia` API）。需生成自签名证书：

**Windows (Git Bash)：**
```bash
MSYS_NO_PATHCONV=1 openssl req -x509 -newkey rsa:2048 \
  -keyout server/key.pem -out server/cert.pem \
  -days 3650 -nodes \
  -subj "/CN=localhost/O=HomeworkCheck"
```

**macOS / Linux：**
```bash
openssl req -x509 -newkey rsa:2048 \
  -keyout server/key.pem -out server/cert.pem \
  -days 3650 -nodes \
  -subj "/CN=localhost/O=HomeworkCheck"
```

> 证书为自签名，浏览器访问时会提示「不安全」，点击「高级」→「继续前往」即可。

---

## 6. 启动系统

```bash
# 终端 1：启动 LiveKit Server
./livekit-server --config server/livekit.yaml

# 终端 2：启动后端服务
node server/index.js
```

启动成功后会显示：

```
========================================
  作业检查系统已启动
========================================
  本机 HTTP : http://localhost:3000
  局域网 HTTP: http://192.168.x.x:3000
----------------------------------------
  🔒 局域网 HTTPS: https://192.168.x.x:3443
     （支持屏幕共享，需接受证书警告）
========================================
```

---

## 7. 使用流程

### 教师端

1. 浏览器打开 `http://localhost:3000`（本机）或 `https://192.168.x.x:3443`（局域网）
2. 选择「我是教师」→ 输入姓名 → 创建教室
3. 点击「📋 复制邀请信息」发送给学生

### 学生端

1. 浏览器打开邀请信息中的 **HTTPS 地址**（如 `https://192.168.x.x:3443`）
2. 遇到证书警告 → 点击「高级」→「继续前往」
3. 选择「我是学生」→ 输入姓名和教室码 → 加入
4. 点击「📺 共享屏幕」展示作业
5. （首次使用需允许麦克风和屏幕录制权限）

### 教师操作

- 点击学生卡片 → 全屏放大查看
- 点击「🔒 仅教师」→ 切换该学生屏幕是否全班可见
- 按 ESC 退出全屏

---

## 8. 端口说明

| 端口 | 协议 | 用途 |
|------|------|------|
| 3000 | HTTP | Web 页面（localhost 访问） |
| 3443 | HTTPS + WSS | Web 页面 + LiveKit 代理（局域网访问，支持屏幕共享） |
| 7880 | WebSocket | LiveKit 媒体信令（内部） |
| 50000-60000 | UDP | WebRTC 媒体传输 |

---

## 9. 常见问题

### Q: 学生端无法共享屏幕？
A: 必须使用 **HTTPS** 地址（`https://192.168.x.x:3443`）访问。HTTP 和 localhost 以外的地址不支持 `getDisplayMedia`。

### Q: 首次连接时 Windows 防火墙弹窗？
A: 点击「允许访问」，否则 WebRTC 媒体流会被阻止。

### Q: 切换 WiFi 后 IP 变了？
A: 重启 `node server/index.js`，系统会自动检测新的局域网 IP。

### Q: 教师听不到学生声音？
A: 学生点击「共享屏幕」后麦克风自动开启。如果仍无声，检查浏览器是否已允许麦克风权限。

### Q: 手机端能用吗？
A: 手机浏览器不支持屏幕共享 API，学生端需用电脑。教师端可在手机上查看（不需共享屏幕）。

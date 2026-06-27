

# 📚 作业检查系统

基于 WebRTC 的局域网屏幕共享教学工具。教师创建教室，学生加入后共享屏幕展示作业，支持教师控制可见范围和实时语音。

## ✨ 功能

- 🏫 教师一键创建教室，自动生成邀请码
- 📺 学生浏览器共享屏幕（无需安装软件）
- 🔍 教师全屏放大查看学生屏幕
- 👁️ 教师控制可见范围（仅教师 / 全班可见）
- 🎤 学生发言教师实时收听
- 🌐 自动检测局域网 IP，多设备即开即用
- 🔒 HTTPS + WSS 双协议，支持屏幕共享 API

## 🚀 快速开始

```bash
git clone https://github.com/zwyuan2022/homework-check.git
cd homework-check
npm install
```

下载 LiveKit Server 并生成证书（详见 [SETUP.md](SETUP.md)），然后启动：

```bash
# 终端 1
./livekit-server --config server/livekit.yaml

# 终端 2
node server/index.js
```

## 📖 详细说明

完整的搭建步骤、端口说明和常见问题见 **[SETUP.md](SETUP.md)**。

## 🛠 技术栈

| 层       | 技术              |
| -------- | ----------------- |
| 后端     | Node.js + Express |
| 实时通信 | LiveKit (WebRTC)  |
| 前端     | 原生 HTML/CSS/JS  |
| 安全     | 自签名 SSL 证书   |

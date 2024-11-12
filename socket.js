// """"""""""""""""""""""""""""""""""""""
//         websocket
// """"""""""""""""""""""""""""""""""""""


const https = require('https');
const fs = require('fs');
const socketIo = require('socket.io');
require('dotenv').config();
const express = require('express');
const app = express();

app.get('/test', (req, res) => {
      res.send('Hello World!');
});

// SSL/TLS 証明書の読み込み
const options = {
      key: fs.readFileSync("/www/server/panel/vhost/letsencrypt/chat-bot.tokyo/privkey.pem"),
      cert: fs.readFileSync("/www/server/panel/vhost/letsencrypt/chat-bot.tokyo/fullchain.pem"),
};

// HTTPS サーバーの作成
const server = https.createServer(options, app);

const PORT = 3002;
app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
  });
  


//指定されたドメインのみが WebSocket 経由で通信できるようにする
// WebSocket プロトコルの性質上、別途 Socket.IO 側でも CORS 設定（必須ではない）
const io = socketIo(server, {
      path: '/api2/socket.io',  // パスを追加
      cors: {
            origin: ["http://127.0.0.1:8000", "https://twitter-clone.click", "https://chat-bot.tokyo/api2"], // オリジンを追加
            methods: ['GET', 'POST'],
      },
});


// ソケットの接続処理
io.on('connection', (socket) => {
      console.log("connected!");
});





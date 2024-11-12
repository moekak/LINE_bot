require('dotenv').config();
const express = require('express');
// 暗号化やハッシュ化を行うライブラリ
const crypto = require('crypto');
const { Client } = require('@line/bot-sdk');
const { insertUserID } = require('./database');
const { getAdminLineAccountInfo, getUserLineName } = require('./line_api');
const { generateMessageTemplate, generateGreetingMessageTemplate } = require('./template');
const app = express();
// MySQLデータベースとのやり取りをPromiseベースで行えるライブラリ
const mysql = require('mysql2/promise'); // promiseベースでmysqlを使う


// nodeサーバーをポート3001で起動
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


app.get('/test', (req, res) => {
    res.send('Hello World!');
});

//Redisサーバーを起動

// LINE情報
const configs = [
    {
        channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN1,
        channelSecret: process.env.CHANNEL_SECRET1
    },
    {
        channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN2,
        channelSecret: process.env.CHANNEL_SECRET2
    }
]



// 署名の検証を行う
// 複数のChannel Secretで検証を行う関数
const validateSignatureWithMultipleSecrets =(body, signature) =>{
    return configs.some(config => {
        try {
            const hash = crypto
                .createHmac('SHA256', config.channelSecret)
                .update(body)
                .digest('base64');
            
            if (hash === signature) {
                // 一致したconfigを後で使用できるようにグローバルまたはリクエストスコープで保存
                global.currentConfig = config;  // または req.lineConfig = config などで保存
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Validation error with config ${config.botId}:`, error);
            return false;
        }
    });
}


let account_info={
    user_account_id : "",
}


app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    
    const signature = req.headers['x-line-signature'];
    const body = req.body.toString('utf-8');

    if (validateSignatureWithMultipleSecrets(body, signature)) {
        const events = JSON.parse(body).events;
        //LINEのAPIにアクセスするためのクライアントを作成
        // このクライアントを通じてメッセージ送信などのAPIリクエストを行う

        const client = new Client({
            channelAccessToken: global.currentConfig.channelAccessToken,
            channelSecret: global.currentConfig.channelSecret
        });

        // user IDのみを取得してデータベースに保存する
        account_info["user_account_id"] = JSON.parse(body).events[0].source.userId

        console.log((account_info["user_account_id"] ));
        
        // 全てのeventsに対して非同期処理を同時に実行
        Promise
            .all(events.map(event => handleEvent(event, client)))
            .then((result) => res.json(result))
            .catch((err) => {
                console.error(err);
                res.status(500).end();
            });
    } else {
        console.error('署名検証失敗');
        res.sendStatus(403);
    }
});


// イベントハンドラー
const handleEvent = async (event, client) => {
    let connection;
    try{
        // DB接続を確立
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,      // データベースホスト
            user: process.env.DB_USER,      // データベースユーザー
            password: process.env.DB_PASS, 	// データベースパスワード
            database: process.env.DB_NAME,  // データベース名
        });

         // ここでDB接続を使用して処理を実行
        const admin_user_id = await getAdminLineAccountInfo();

        if (event.type === 'message' && event.message.type === 'text') {
            return client.replyMessage(event.replyToken, generateMessageTemplate(admin_user_id, account_info["user_account_id"]));

        } else if (event.type === 'follow') {
            const user_data = await getUserLineName(account_info["user_account_id"]);

            await insertUserID(connection, account_info["user_account_id"], admin_user_id, user_data[0], user_data[1]);

            return client.replyMessage(event.replyToken, generateGreetingMessageTemplate(admin_user_id, account_info["user_account_id"]));

        } else {
            // eventがmessageでもfollowでもない場合、何も処理しない
            return Promise.resolve(null);
        }


    }catch (error) {
        console.error('Error handling event:', error);
        throw error;
    // 必ず実行されることを保証
    } finally {
        if (connection) {
            // DB接続をクローズ
            await connection.end();
        }
    }

}


// """"""""""""""""""""""""""""""""""""""
//         websocket
// """"""""""""""""""""""""""""""""""""""

// app.get('/test', (req, res) => {
//     res.send('Hello World!');
// });

// const https = require('https');
// const fs = require('fs');
// const socketIo = require('socket.io');
// require('dotenv').config();


// // SSL/TLS 証明書の読み込み
// const options = {
//     key: fs.readFileSync("/www/server/panel/vhost/letsencrypt/chat-bot.tokyo/privkey.pem"),
//     cert: fs.readFileSync("/www/server/panel/vhost/letsencrypt/chat-bot.tokyo/fullchain.pem"),
// };

// // HTTPS サーバーの作成
// const server = https.createServer(options, app);
// //指定されたドメインのみが WebSocket 経由で通信できるようにする
// // WebSocket プロトコルの性質上、別途 Socket.IO 側でも CORS 設定（必須ではない）
// const io = socketIo(server, {
//     cors: {
//         origin: ["http://127.0.0.1:8000", "https://twitter-clone.click", "https://chat-bot.tokyo"], // オリジンを追加
//         methods: ['GET', 'POST'],
//     },
// });

// // // 静的ファイルの提供
// // app.use(express.static('public'));

// const userSockets = new Map(); // ユーザーIDとソケットのマッピング


// // ソケットの接続処理
// io.on('connection', (socket) => {
//     console.log("connected!");
// });





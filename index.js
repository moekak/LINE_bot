require('dotenv').config();
const express = require('express');
// 暗号化やハッシュ化を行うライブラリ
const crypto = require('crypto');
const { Client } = require('@line/bot-sdk');
const { insertUserID } = require('./database');
const { getAdminLineAccountInfo, getUserLineName } = require('./line_api');
const axios = require('axios');
const { generateMessageTemplate, generateGreetingMessageTemplate } = require('./template');
const app = express();
// MySQLデータベースとのやり取りをPromiseベースで行えるライブラリ
const mysql = require('mysql2/promise'); // promiseベースでmysqlを使う


// サーバーをポート3001で起動
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// LINE情報
const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET
};

//LINEのAPIにアクセスするためのクライアントを作成
// このクライアントを通じてメッセージ送信などのAPIリクエストを行う
const client = new Client(config);

// 署名の検証を行う
const validateSignature =(body, signature, channelSecret) =>{
    const hash = crypto.createHmac('SHA256', channelSecret).update(body).digest('base64');
    return hash === signature;
}


let account_info={
    user_account_id : "",
}


app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const signature = req.headers['x-line-signature'];
    const body = req.body.toString('utf-8');

    if (validateSignature(body, signature, config.channelSecret)) {

        const events = JSON.parse(body).events;
        // user IDのみを取得してデータベースに保存する
        account_info["user_account_id"] = JSON.parse(body).events[0].source.userId
        // 全てのeventsに対して非同期処理を同時に実行
        Promise
            .all(events.map(handleEvent))
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
const handleEvent = async (event) => {
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


console.log(getAdminLineAccountInfo());


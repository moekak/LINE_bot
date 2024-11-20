require('dotenv').config();
const express = require('express');
// 暗号化やハッシュ化を行うライブラリ
const crypto = require('crypto');
const { Client　} = require('@line/bot-sdk');
const { getAdminLineAccountInfo, getUserLineName } = require('./util/line_api');
const { generateMessageTemplate, generateGreetingMessageTemplate } = require('./util/template');
const app = express();
// MySQLデータベースとのやり取りをPromiseベースで行えるライブラリ
const mysql = require('mysql2/promise'); // promiseベースでmysqlを使う
const { insertUserID, getChannelTokenAndSecretToekn } = require('./util/database');
const { decryptLaravelData } = require('./util/decryptor');


// nodeサーバーをポート3001で起動
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

let configs = [];

// チャネルアクセストークンとチャネルシークレットを復号化する
(async () => {
	try {
		const tokens = await getChannelTokenAndSecretToekn(mysql);
		const decryptedData = await decryptLaravelData(tokens);
        configs = decryptedData
	} catch (error) {
		console.error('Error fetching tokens:', error);
	}
})();



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

    console.log(configs);
    // res.status(200).send('OK');

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
            timezone: '+09:00',
            dateStrings: true,
        });

        // 接続後にタイムゾーンを設定
        await connection.query('SET time_zone="+09:00"');

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




//リクエストボディをJSONフォーマットとして解析するための設定
app.use(express.json());
// URL-encodedボディパーサーも追加
app.use(express.urlencoded({ extended: true }));

app.get('/test', (req, res) => {
    res.send('Hello World!');
});

app.post("/notify", (req, res)=>{
    const { channel_access_token, channel_secret } = req.body;
    configs.push({
        channelAccessToken: channel_access_token,
        channelSecret: channel_secret
    })

    console.log("Channel Access Token:", channel_access_token);
    console.log("Channel Secret:", channel_secret);
    res.json({ message: "Received", data: req.body });
})

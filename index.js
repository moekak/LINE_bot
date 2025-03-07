require('dotenv').config();
const express = require('express');
// 暗号化やハッシュ化を行うライブラリ
const crypto = require('crypto');
const { Client} = require('@line/bot-sdk');
const app = express();
// MySQLデータベースとのやり取りをPromiseベースで行えるライブラリ
const DatabaseQueryService = require('./services/util/DatabaseQueryService.js');
const LineApiService = require('./services/util/LineApiService.js');
const WriteErrorLog = require('./services/util/WriteErrorLog.js');
const MessageTemplateGeneratorService = require('./services/util/MessageTemplateGeneratorService.js');
const ChannelTokenService = require('./services/util/ChannelTokenService.js');


// nodeサーバーをポート3001で起動
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


const databaseQueryService = new DatabaseQueryService()
const writeErrorLog = new WriteErrorLog()
const channelTokenService = new ChannelTokenService()

// 署名の検証を行う
// 複数のChannel Secretで検証を行う関数
const validateSignatureWithMultipleSecrets = async (body, signature) =>{
    let configs = await channelTokenService.generateConfig()


    for (const config of configs) {
        try {
            const hash = crypto
                .createHmac('SHA256', config.channelSecret)
                .update(body)
                .digest('base64');

            if (hash === signature) {
                global.currentConfig = config; // 非同期内でも値を確実に設定
                return true;
            }
        } catch (error) {
            await writeErrorLog.writeLog(`Validation error with config ${config.botId}`, error)
        }
    }
    return false; // 全ての検証が失敗した場合
}


let account_info={
    user_account_id : "",
}


app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try{

        const signature = req.headers['x-line-signature'];
        const body = req.body.toString('utf-8');
    
        if (await validateSignatureWithMultipleSecrets(body, signature)) {
            const events = JSON.parse(body).events;

            //LINEのAPIにアクセスするためのクライアントを作成
            // このクライアントを通じてメッセージ送信などのAPIリクエストを行う
    
            const client = new Client({
                channelAccessToken: global.currentConfig.channelAccessToken,
                channelSecret: global.currentConfig.channelSecret
            });
    
            // user IDのみを取得してデータベースに保存する
            account_info["user_account_id"] = JSON.parse(body).events[0].source.userId
            
            // 全てのeventsに対して非同期処理を同時に実行
            Promise
                .all(events.map(event => handleEvent(event, client)))
                .then((result) => res.json(result))
                .catch((err) => {
                    console.error(err);
                    res.status(500).end();
                });
        } else {
            await writeErrorLog.writeLog('署名検証失敗')
            res.sendStatus(403);
        }
    }catch(error){
        await writeErrorLog.writeLog(error)
    }

});


// イベントハンドラー
const handleEvent = async (event, client) => {
    try{

        const lineApiService = new LineApiService()
        const messageTemplateGeneratorError = new MessageTemplateGeneratorService()
        const admin_user_id = await lineApiService.getAdminLineAccountInfo();

        console.log("関数呼び出し");
        


        // もしLINE内にメッセージが送られてきた場合
        if (event.type === 'message' && event.message.type === 'text') {

            console.log("message!");
            
            return client.replyMessage(event.replyToken, messageTemplateGeneratorError.generateMessageTemplate(admin_user_id, account_info["user_account_id"]));

        } else if (event.type === 'follow') {

            console.log("follow!!!!!");
            
            
            // もしすでに追加があった場合は初回メッセージのボタンではなく、別のメッセージボタンを送信する
            if(await databaseQueryService.checkIfUserExists(account_info["user_account_id"], admin_user_id)){
                return client.replyMessage(event.replyToken, messageTemplateGeneratorError.generateMessageTemplate(admin_user_id, account_info["user_account_id"]));
            }

            const user_data = await lineApiService.getUserLineName(account_info["user_account_id"]);
            await databaseQueryService.insertUserID(account_info["user_account_id"], admin_user_id, user_data[0], user_data[1]);

            return client.replyMessage(event.replyToken, messageTemplateGeneratorError.generateGreetingMessageTemplate(admin_user_id, account_info["user_account_id"]));

        } else {
            // eventがmessageでもfollowでもない場合、何も処理しない
            console.log("else!!!!");
            console.log(event.type);
            
            return Promise.resolve(null);
        }


    }catch (error) {
        await writeErrorLog.writeLog(error)
    } 

}

//リクエストボディをJSONフォーマットとして解析するための設定
app.use(express.json());
// URL-encodedボディパーサーも追加
app.use(express.urlencoded({ extended: true }));

app.get('/test', (req, res) => {
    res.send('Hello World!');
});

app.get('/healthcheck', (req, res) => {
    res.status(200).send('OK');
});

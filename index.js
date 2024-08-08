

const express = require('express');
const crypto = require('crypto');
const { Client } = require('@line/bot-sdk');
const { insertUserID } = require('./database');

const app = express();

const config = {
    channelAccessToken: 'BNB/7weqbM+rh+/DQOR64lvtlwe1zXBBKviMj5wIrtV2NW4eAo1xe0qC8Tja5UewIEUCnjTzVfKMeZlzK76Wk9T/Wgl47pfWeCFCopsX3WABCkmVn0EX3JPXhmwtU6qXxGlaNOeccX/OYHgYI0GqlwdB04t89/1O/w1cDnyilFU=',
    channelSecret: '02c50e03d6127523ab592c18c9444ce8'
};

const client = new Client(config);

function validateSignature(body, signature, channelSecret) {
    const hash = crypto.createHmac('SHA256', channelSecret).update(body).digest('base64');
    return hash === signature;
}


let data={
    user_id : ""
}
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const signature = req.headers['x-line-signature'];
    const body = req.body.toString('utf-8');

    if (validateSignature(body, signature, config.channelSecret)) {
        console.log('署名検証成功');
        console.log('受信したデータ:', body); // 受信したデータをコンソールに出力
  
        const events = JSON.parse(body).events;
        // user IDのみを取得してデータベースに保存する
        data["user_id"] = JSON.parse(body).events[0].source.userId
        console.log(data["user_id"] );
        console.log(data["user_id"] );


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
function handleEvent(event) {
    if (event.type === 'message' && event.message.type === 'text') {
        // テキストメッセージイベントの場合
        const templateMessage = {
            type: 'template',
            altText: 'This is a buttons template',
            template: {
                type: 'buttons',
                // thumbnailImageUrl: 'https://example.com/bot/images/image.jpg',
                // imageAspectRatio: 'rectangle',
                // imageSize: 'cover',
                // imageBackgroundColor: '#FFFFFF',
                // title: 'ご質問',
                text: 'メッセージは下記リンクより送信いただけます。',
                actions: [
                    {
                        type: 'uri',
                        label: 'チャットを確認',
                        uri: 'http://example.com/page/123'
                    }
                ]
            }
        };
        
        return client.replyMessage(event.replyToken, templateMessage);
    } else if (event.type === 'follow') {
        // 友達追加イベントの場合
    const templateMessage = {
        type: 'template',
        template: {
            type: 'buttons',
            title: 'ご質問',
            text: '今までは副業の経験はありますかー？？',
            actions: [
                {
                    type: 'uri',
                    label: 'チャットを確認',
                    uri: 'http://example.com/page/123'
                }
            ]
        }
    };
    
        insertUserID(data["user_id"] )
        return client.replyMessage(event.replyToken, templateMessage);
        
    } else {
        // その他のイベントは無視
        return Promise.resolve(null);
    }
}

// テストエンドポイント
app.get('/test', (req, res) => {
    res.send('Server is working!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});



// メッセージを任意のタイミングで送信
app.get('/send-message', (req, res) => {
    const message = "ヤッホー"
    userIds = ["U816cc8212a3ede3d46f5822903f65d55", "U7f0efeb4f8af446c5d8695a7b33da061"]

    // 保存された全てのユーザーにメッセージを送信
    userIds.forEach(userId => {
        client.pushMessage(userId, {
            type: 'text',
            text: message
        })
        .then(() => {
            console.log(`メッセージを送信しました: ${userId}`);
        })
        .catch((err) => {
            console.error(err);
        });
    });

    res.send('メッセージを送信しました');
});
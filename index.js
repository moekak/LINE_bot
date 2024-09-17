const express = require('express');
const crypto = require('crypto');
const { Client } = require('@line/bot-sdk');
const { insertUserID } = require('./database');
const { getAdminLineAccountInfo, getUserLineName } = require('./line_api');
const axios = require('axios');
const app = express();


const config = {
    channelAccessToken: 'SGhx03izYuFtsEaNT1UrvEYOqsxtronY1041KfyHNYtdVQMGTzrApsBLISvB74wehNfDE83Qgtg7lrkPKpAceWSBAln25bIypZ57FCemFQOro5+OnGF5/bm+11pg1z0wisbvymCvofsjcx+L53So2AdB04t89/1O/w1cDnyilFU=',
    channelSecret: '91c7169b106ffda2bdca9e247eb5b552'
};

const client = new Client(config);

function validateSignature(body, signature, channelSecret) {
    const hash = crypto.createHmac('SHA256', channelSecret).update(body).digest('base64');
    return hash === signature;
}


let user_info={
    user_id : ""
}


app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  
    const signature = req.headers['x-line-signature'];
    const body = req.body.toString('utf-8');

    if (validateSignature(body, signature, config.channelSecret)) {

        const events = JSON.parse(body).events;
        // user IDのみを取得してデータベースに保存する
        user_info["user_id"] = JSON.parse(body).events[0].source.userId

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
const handleEvent = (event) => {

    if (event.type === 'message' && event.message.type === 'text') {
        // テキストメッセージイベントの場合
        getAdminLineAccountInfo(axios)
            .then(admin_user_id => {
                console.log(`https://line-chat.tokyo/chat/${admin_user_id}/${user_info["user_id"]}`);
                const templateMessage = {
                    type: 'template',
                    altText: 'This is a buttons template',
                    template: {
                        type: 'buttons',
                        text: 'メッセージは下記リンクより送信いただけます。',
                        actions: [
                            {
                                type: 'uri',
                                label: 'チャットを確認',
                                uri: `https://line-chat.tokyo/chat/${admin_user_id}/${user_info["user_id"]}`

                            }
                        ]
                    }
                };
            return client.replyMessage(event.replyToken, templateMessage);
             
            })

    } else if (event.type === 'follow') {
        // 友達追加イベントの場合
        getAdminLineAccountInfo(axios)
            .then(admin_user_id => {
                getUserLineName(user_info["user_id"])
                    .then(user_data =>{
    
                        insertUserID(user_info["user_id"], admin_user_id, user_data[0], user_data[1])
                        .then(()=>{
                            const templateMessage = {
                                type: 'template',
                                altText: 'This is a buttons template',
                                template: {
                                    type: 'buttons',
                                    title: 'ご質問',
                                    text: '今までは副業の経験はありますかー？？',
                                    actions: [
                                        {
                                            type: 'uri',
                                            label: 'チャットを確認',
                                            uri: `https://line-chat.tokyo/chat/${admin_user_id}/${user_info["user_id"]}`
            
                                        }
                                    ]
                                }
                            };
                            return client.replyMessage(event.replyToken, templateMessage);
                        })
                    })
            })
    } else {
        // その他のイベントは無視
        return Promise.resolve(null);
    }
}

// テストエンドポイント
app.get('/test', (req, res) => {
    const channelAccessToken = 'SGhx03izYuFtsEaNT1UrvEYOqsxtronY1041KfyHNYtdVQMGTzrApsBLISvB74wehNfDE83Qgtg7lrkPKpAceWSBAln25bIypZ57FCemFQOro5+OnGF5/bm+11pg1z0wisbvymCvofsjcx+L53So2AdB04t89/1O/w1cDnyilFU=';
    const config = {
        headers: {
            'Authorization': `Bearer ${channelAccessToken}`,
        },
    };

    const url = 'https://api.line.me/v2/bot/info';
    axios.get(url, config)
        .then(response => {
            console.log(response.data);
        })
        .catch(error => {
          //   console.error('Error fetching bot information:', error.response ? error.response.data : error.message);
          //   reject(error);
        });
    res.send('Server is working!');
});

const port = process.env.PORT || 3001;
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


getAdminLineAccountInfo(axios)
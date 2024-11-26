const axios = require('axios');
const MessageTemplateGeneratorError = require('../error/MessageTemplateGeneratorError');
require('dotenv').config();

class MessageTemplateGeneratorService{
      constructor(){
            if(!process.env.SYSTEM_URL) throw new MessageTemplateGeneratorError("SYSTEM_URLが指定されていません")
            this.systemUrl = process.env.SYSTEM_URL
      }

      generateMessageTemplate(adminUserId, userId){

            if(!adminUserId || !userId) throw new MessageTemplateGeneratorError('adminUserIdまたはuserIdが指定されていません')
            return {
                  type: 'template',
                  altText: 'This is a buttons template',
                  template: {
                        type: 'buttons',
                        text: 'メッセージは下記リンクより送信いただけます。',
                        actions: [
                              {
                                    type: 'uri',
                                    label: 'チャットを確認',
                                    uri: `${this.systemUrl}${adminUserId}/${userId}`
                              }
                        ]
                  }
            };
      }

      generateGreetingMessageTemplate(adminUserId, userId){
            if(!adminUserId || !userId) throw new MessageTemplateGeneratorError('adminUserIdまたはuserIdが指定されていません')
            return {
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
                                    uri: `${this.systemUrl}${adminUserId}/${userId}`
                              }
                        ]
                  }
            }
      }
}


module.exports = MessageTemplateGeneratorService;
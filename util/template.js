const generateMessageTemplate = (admin_user_id, user_id) =>{
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
					uri: `https://chat-system.tokyo/chat/${admin_user_id}/${user_id}`

				}
			]
		}
	}
}

const generateGreetingMessageTemplate = (admin_user_id, user_id) =>{
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
					uri: `https://chat-system.tokyo/chat/${admin_user_id}/${user_id}`
				}
			]
		}
	}
}

// Node.jsのデフォルトのモジュールシステムはCommonJSのため、エクスポートするにはmodule.exportsまたはexportsを使用
module.exports ={
	generateGreetingMessageTemplate, 
	generateMessageTemplate
}
const axios = require('axios');
require('dotenv').config();

const getAdminLineAccountInfo = ()=>{
	return new Promise((resolve, reject) => {
		const channelAccessToken = process.env.CHANNEL_ACCESS_TOKEN
		const config = {
			headers: {
				'Authorization': `Bearer ${channelAccessToken}`,
			},
		};

		const url = 'https://api.line.me/v2/bot/info';
		axios.get(url, config)
		.then(response => {

			
			
			const admin_user_id = response.data.userId;
			console.log(admin_user_id);
			resolve(admin_user_id);
		})
		.catch(error => {
			// 非同期処理が失敗した場合、Promise の状態を「失敗（rejected）」にし、そのエラー情報を error として返す。
			reject(error);
		});
	});
}
const getUserLineName = (user_id) =>{
	return new Promise((resolve, reject)=>{
		const accessToken = process.env.CHANNEL_ACCESS_TOKEN
		const config = {
			headers: {
				'Authorization': `Bearer ${accessToken}`
			}
		}

		axios.get(`https://api.line.me/v2/bot/profile/${user_id}`, config)
		.then(response => {
			const user_name = response.data.displayName
			const user_picture = response.data.pictureUrl
			resolve([user_name, user_picture])
		})
		.catch(error => {
			// 非同期処理が失敗した場合、Promise の状態を「失敗（rejected）」にし、そのエラー情報を error として返す。
			reject(error);
		});  
	})  
}

// Node.jsのデフォルトのモジュールシステムはCommonJSのため、エクスポートするにはmodule.exportsまたはexportsを使用
module.exports ={
	getAdminLineAccountInfo, 
	getUserLineName
}
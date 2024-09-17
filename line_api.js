const { default: axios } = require("axios");

const getAdminLineAccountInfo = (axios)=>{
	return new Promise((resolve, reject) => {
		const channelAccessToken = 'SGhx03izYuFtsEaNT1UrvEYOqsxtronY1041KfyHNYtdVQMGTzrApsBLISvB74wehNfDE83Qgtg7lrkPKpAceWSBAln25bIypZ57FCemFQOro5+OnGF5/bm+11pg1z0wisbvymCvofsjcx+L53So2AdB04t89/1O/w1cDnyilFU=';
		const config = {
			headers: {
				'Authorization': `Bearer ${channelAccessToken}`,
			},
		};

		const url = 'https://api.line.me/v2/bot/info';
		axios.get(url, config)
		.then(response => {
				const admin_user_id = response.data.userId;
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
		const accessToken = 'SGhx03izYuFtsEaNT1UrvEYOqsxtronY1041KfyHNYtdVQMGTzrApsBLISvB74wehNfDE83Qgtg7lrkPKpAceWSBAln25bIypZ57FCemFQOro5+OnGF5/bm+11pg1z0wisbvymCvofsjcx+L53So2AdB04t89/1O/w1cDnyilFU=';
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


module.exports ={
	getAdminLineAccountInfo, 
	getUserLineName
}
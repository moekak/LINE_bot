const axios = require('axios');
require('dotenv').config();

const getAdminLineAccountInfo = async ()=>{
	const url = 'https://api.line.me/v2/bot/info';

	const config = {
		headers: {
			'Authorization': `Bearer ${global.currentConfig.channelAccessToken}`,
		},
	};

	try{
		const response 		= await axios.get(url, config); // 'response'オブジェクトを取得
		const admin_user_id = response.data.userId;    		  // 'response.data'から'userId'を取得
        return admin_user_id;                          		  // 'userId'を返す

	}catch(error){
		throw error
	}

}

const getUserLineName = async (user_id) =>{

	const config = {
		headers: {
			'Authorization': `Bearer ${global.currentConfig.channelAccessToken}`,
		},
	};
	try{
		const response 	= await axios.get(`https://api.line.me/v2/bot/profile/${user_id}`, config) 	// 'response'オブジェクトを取得
		const user_name 	= response.data.displayName                                               	// 'response.data'から'user_name'を取得
		const user_picture 	= response.data.pictureUrl                                             	// 'response.data'から'user_picture'を取得
		return [user_name, user_picture]											// 'user_nameとuser_pictureを返す
		
	}catch(error){
		throw error
	}
}

// Node.jsのデフォルトのモジュールシステムはCommonJSのため、エクスポートするにはmodule.exportsまたはexportsを使用
module.exports ={
	getAdminLineAccountInfo, 
	getUserLineName
}
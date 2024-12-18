const DatabaseQueryError = require("../error/DatabaseQueryError.js");
const db = require("../Database.js");

class DatabaseQuery{
	async insertUserID(user_id, account_id, user_name, user_picture){
		try{
			if (user_picture == undefined){
				user_picture = process.env.URL_PICTURE
			}
			// 1. account_idに基づいてline_accountsテーブルから管理者アカウントIDを取得
			const query = 'SELECT id FROM line_accounts WHERE account_id = ?';
			const [results] = await db.executeQuery(query, [account_id]);
	
			if (results.length > 0) {
				results[0]["id"]
				// 2. chat_users にデータを挿入
				const query = 'INSERT INTO chat_users (user_id, account_id,  line_name, user_picture, created_at, updated_at) VALUES (?, ?, ?, ?, CONVERT_TZ(NOW(), "+00:00", "+09:00"), CONVERT_TZ(NOW(), "+00:00", "+09:00"))';
				const [insertResults] = await db.executeQuery(query, [user_id, results[0]["id"], user_name, user_picture]);
	
				// 3. 挿入されたchat_usersテーブルのIDを取得
				const chatUserId = insertResults.insertId;
	
				// 4. 中間テーブルにUUIDを挿入（重複エラー時に再試行）
				await this.insertUUID(chatUserId);
			} else {
				throw new DatabaseQueryError("管理者のアカウントIDが存在しません")
			}
		}catch(error){
			if (!(error instanceof DatabaseQueryError)) {
				throw new DatabaseQueryError('トークン情報の復号化に失敗しました', error);
			}
		}
		
	}

	async insertUUID(chatUserId){
		const query = 'INSERT INTO user_entities (entity_uuid, related_id, entity_type, created_at, updated_at) VALUES (UUID(), ?, ?, CONVERT_TZ(NOW(), "+00:00", "+09:00"), CONVERT_TZ(NOW(), "+00:00", "+09:00"))';
		while(true){
			try{
				await db.executeQuery(query, [chatUserId, 'user']);
				return;// 成功したらループを抜ける
			}catch(err){
				if (err.code === 'ER_DUP_ENTRY') {
					console.log('UUIDが重複しているので再試行します');
					// ユニーク制約違反が発生した場合、再試行
					continue;
				} else {
					throw err; // その他のエラーの場合はそのままエラーをスロー
				}
			}
		}
	}
	
	async checkIfUserExists(userId){
		if(!userId){
			throw new DatabaseQueryError("userIdが空です。")
		}
		const query = 'SELECT EXISTS(SELECT 1 FROM chat_users WHERE user_id = ?) AS userExists'
		const [results] =  await db.executeQuery(query, [userId])

		return results[0].userExists === 1

	}

	async getChannelTokenAndSecretToekn(){
		console.log("databse");
		try{
			// データベース接続チェック
			
			const query = 'SELECT channel_access_token,channel_secret FROM line_accounts';
			const [results] = await db.executeQuery(query);
	
			console.log(results);
			
			return results
		}catch(error){
			throw new DatabaseQueryError('getChannelTokenAndSecretToeknに失敗しました', error);
		}
		
	
	}
}




// Node.jsのデフォルトのモジュールシステムはCommonJSのため、エクスポートするにはmodule.exportsまたはexportsを使用
module.exports = DatabaseQuery

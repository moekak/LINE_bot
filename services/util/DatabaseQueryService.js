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
				// 2. chat_users にデータを挿入
				const query = 'INSERT INTO chat_users (user_id, account_id,  line_name, user_picture, is_added, created_at, updated_at) VALUES (?, ?, ?, ?, "1", CONVERT_TZ(NOW(), "+00:00", "+09:00"), CONVERT_TZ(NOW(), "+00:00", "+09:00"))';
				const [insertResults] = await db.executeQuery(query, [user_id, results[0]["id"], user_name, user_picture]);
				// 3. 挿入されたchat_usersテーブルのIDを取得
				const chatUserId = insertResults.insertId;

				// 4. 中間テーブルにUUIDを挿入（重複エラー時に再試行）
				await this.insertUUID(chatUserId);

				// 5. chatIdentitiesテーブルにデータを挿入
				await this.insertChatIdentities(results[0]["id"], user_id)

				// 挿入されたデータを取得
				const querySelect = `SELECT * FROM chat_users WHERE user_id = ? AND account_id = ?`;
				const [userData] = await db.executeQuery(querySelect, [user_id, results[0]["id"]]);

				return userData;

				
			} else {
				throw new DatabaseQueryError("管理者のアカウントIDが存在しません")
			}
		}catch(error){
			if (!(error instanceof DatabaseQueryError)) {
				throw new DatabaseQueryError('トークン情報の復号化に失敗しました', error);
			}
		}
		
	}

	async insertChatIdentities(original_admin_id, chat_user_id){
		const query = 'INSERT INTO chat_identities (original_admin_id, chat_user_id, created_at, updated_at) VALUES (?, ?, CONVERT_TZ(NOW(), "+00:00", "+09:00"), CONVERT_TZ(NOW(), "+00:00", "+09:00"))';
		try{
			await db.executeQuery(query, [original_admin_id, chat_user_id]);
		}catch(error){
			if (!(error instanceof DatabaseQueryError)) {
				throw new DatabaseQueryError('chatIdentitiesテーブルへのデータの挿入でエラーが発生しました。', error);
			}
		}
		
	}
	
	async checkIfUserExists(userId, account_id) {
		console.log("checkIfUserExists");
		
		if (!userId) {
			throw new DatabaseQueryError("userIdが空です。");
		}
		if (!account_id) {
			throw new DatabaseQueryError("accountIdが空です。");
		}

		const selectAdminIdQuery = "SELECT id FROM line_accounts WHERE account_id = ?";
		const [adminResults] = await db.executeQuery(selectAdminIdQuery, [account_id]);
		const admin_id = adminResults[0]?.id;

		if (!admin_id) {
			throw new DatabaseQueryError("対応するadmin_idが見つかりませんでした。");
		}

		const query = 'SELECT EXISTS(SELECT 1 FROM chat_users WHERE user_id = ? AND account_id = ?) AS userExists';
		const [results] = await db.executeQuery(query, [userId, admin_id]);

		const exists = results[0].userExists === 1;

		if (exists) {
			console.log("exsist!!!");
			
			const updateQuery = 'UPDATE chat_users SET is_added = "1" WHERE user_id = ? AND account_id = ?';
			await db.executeQuery(updateQuery, [userId, admin_id]);
		}

		return exists;
	}


	async getChannelTokenAndSecretToekn(){
		try{
			// データベース接続チェック
			
			const query = 'SELECT channel_access_token,channel_secret FROM line_accounts';
			const [results] = await db.executeQuery(query);
	
	
			return results
		}catch(error){
			throw new DatabaseQueryError('getChannelTokenAndSecretToeknに失敗しました', error);
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
					// ユニーク制約違反が発生した場合、再試行
					continue;
				} else {
					throw err; // その他のエラーの場合はそのままエラーをスロー
				}
			}
		}
	}

	
	async insertLineTestSender(userId, name, image){
		const query = 'INSERT INTO line_test_senders (user_id, account_name, user_picture,  created_at, updated_at) VALUES (?, ?, ?, CONVERT_TZ(NOW(), "+00:00", "+09:00"), CONVERT_TZ(NOW(), "+00:00", "+09:00"))';
		
		try{
			await db.executeQuery(query, [userId, name, image]);
			return;
		}catch(err){
			throw err; // その他のエラーの場合はそのままエラーをスロー
		}
		
	}
	async checkIfTestSenderExists(userId){
		if(!userId){
			throw new DatabaseQueryError("userIdが空です。")
		}

		const query = 'SELECT EXISTS(SELECT 1 FROM line_test_senders WHERE user_id = ?) AS userExists';
		const [results] = await db.executeQuery(query, [userId]);

		return results[0].userExists === 1

	}
}




// Node.jsのデフォルトのモジュールシステムはCommonJSのため、エクスポートするにはmodule.exportsまたはexportsを使用
module.exports = DatabaseQuery

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
				const query = 'INSERT INTO chat_users (user_id, account_id,  line_name, user_picture, created_at, updated_at) VALUES (?, ?, ?, ?, CONVERT_TZ(NOW(), "+00:00", "+09:00"), CONVERT_TZ(NOW(), "+00:00", "+09:00"))';
				const [insertResults] = await db.executeQuery(query, [user_id, results[0]["id"], user_name, user_picture]);
				// 3. 挿入されたchat_usersテーブルのIDを取得
				const chatUserId = insertResults.insertId;

				// 4. 中間テーブルにUUIDを挿入（重複エラー時に再試行）
				await this.insertUUID(chatUserId);

				// 5. chatIdentitiesテーブルにデータを挿入
				await this.insertChatIdentities(results[0]["id"], user_id)


				// // 6. manager chat accessedテーブルにデータを挿入
				// await this.insertManagerChatAsscess(results[0]["id"]);

	
				

				// 同じユーザーかを判断する
				if(await this.checkIfUserIdentityExisted(user_id)  == false){
					const identity_id = await this.insertUserIndentities()
					await this.insertUserManagers(identity_id, chatUserId)
				}else{
					const identity_id = await this.selectUserIndentities(user_id)
					await this.insertUserManagers(identity_id, chatUserId)
				}

		
				
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
	
	async checkIfUserExists(userId, account_id){
		if(!userId){
			throw new DatabaseQueryError("userIdが空です。")
		}
		if(!account_id){
			throw new DatabaseQueryError("accountIdが空です。")
		}
		const selectAdminIdQuery = "SELECT id FROM line_accounts WHERE account_id = ? ";
		const [adminResults] = await db.executeQuery(selectAdminIdQuery, [account_id]);
		const admin_id = adminResults[0].id

		const query = 'SELECT EXISTS(SELECT 1 FROM chat_users WHERE user_id = ? AND account_id = ?) AS userExists';
		const [results] = await db.executeQuery(query, [userId, admin_id]);

		return results[0].userExists === 1

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

	async selectChatIdentities(adminId){
		try{
			const query = 'SELECT chat_identities.id FROM chat_identities WHERE original_admin_id = ?' ;
			const [results] = await db.executeQuery(query, [adminId]);
			return results[0]["id"]

			
		}catch(error){
			throw new DatabaseQueryError('insertUserIndentitiesテーブルにデータを挿入する際にエラーが発生しました', error);
		}
	}

	// async insertManagerChatAsscess(admin_id){
	// 	try{
	// 		const query = 'SELECT current_account_id FROM second_accounts WHERE second_account_id = ?';
	// 		const [results] = await db.executeQuery(query, [admin_id]);

	// 		console.log([results]);
			
	// 		if(results.length > 0){
	// 			// バンされる前のラインアカウントIDを取得する
	// 			const previous_admin_id = results[0]["current_account_id"]
	// 			// chat_identities_idを取得する
	// 			const chat_identity_id = await this.selectChatIdentities(previous_admin_id)

	// 			// manaager chat accessesテーブルにデータを挿入する
	// 			const insertingQuery = 'INSERT INTO manager_chat_accesses (chat_identity_id, assigned_admin_id, created_at, updated_at) VALUES (?, ?, CONVERT_TZ(NOW(), "+00:00", "+09:00"), CONVERT_TZ(NOW(), "+00:00", "+09:00"))';
	// 			await db.executeQuery(insertingQuery, [chat_identity_id, admin_id]);
	// 		}else{
	// 			return
	// 		}

	// 	}catch(error){
	// 		console.log(error);
			
	// 		throw new DatabaseQueryError('manager chat_accessesのテーブル挿入でエラーが発生しました。', error);
	// 	}
	// }

	async insertUserIndentities(){
		try{
			const query = 'INSERT INTO user_identities (created_at, updated_at) VALUES (CONVERT_TZ(NOW(), "+00:00", "+09:00"), CONVERT_TZ(NOW(), "+00:00", "+09:00"))';
			while(true){
				try{
					const [results] = await db.executeQuery(query);
					return results.insertId;// 成功したらループを抜ける
				}catch(err){
					if (err.code === 'ER_DUP_ENTRY') {
			
						// ユニーク制約違反が発生した場合、再試行
						continue;
					} else {
						throw err; // その他のエラーの場合はそのままエラーをスロー
					}
				}
			}
			
		}catch(error){
			throw new DatabaseQueryError('insertUserIndentitiesテーブルにデータを挿入する際にエラーが発生しました', error);
		}
	}

	async selectUserIndentities(userId){
		try{
			const query = 'SELECT user_identities.id FROM user_identities INNER JOIN user_managers ON user_identities.id = user_managers.user_identity_id INNER JOIN chat_users ON user_managers.chat_user_id = chat_users.id WHERE chat_users.user_id = ?' ;
			const [results] = await db.executeQuery(query, [userId]);
			return results[0]["id"]

			
		}catch(error){
			throw new DatabaseQueryError('insertUserIndentitiesテーブルにデータを挿入する際にエラーが発生しました', error);
		}
	}

	async insertUserManagers(user_identity_id, chat_user_id){
		try{
			const query = 'INSERT INTO user_managers (user_identity_id, chat_user_id, created_at, updated_at) VALUES (?, ?, CONVERT_TZ(NOW(), "+00:00", "+09:00"), CONVERT_TZ(NOW(), "+00:00", "+09:00"))';
			await db.executeQuery(query, [user_identity_id, chat_user_id]);
		}catch(error){
			throw new DatabaseQueryError(' user_managersテーブルにデータを挿入する際にエラーが発生しました', error);
		}
	}

	async checkIfUserIdentityExisted(userId){
		try{
			const query = 'SELECT user_id FROM chat_users WHERE user_id = ?';
			const [results] = await db.executeQuery(query, [userId]);

			return results.length > 1
		}catch(error){
			console.log(error);
			
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
}




// Node.jsのデフォルトのモジュールシステムはCommonJSのため、エクスポートするにはmodule.exportsまたはexportsを使用
module.exports = DatabaseQuery

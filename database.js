

const insertUserID = async (connection, user_id, account_id, user_name, user_picture) => {
	try{
		// もしプロファイル画像がなかったらデフォルトの画像にする
		if (user_picture == undefined){
			user_picture = process.env.URL_PICTURE
		}

		// 1. account_idに基づいてline_accountsテーブルから管理者アカウントIDを取得
		const [results] = await connection.query('SELECT id FROM line_accounts WHERE account_id = ?', [account_id]);

		if (results.length > 0) {
			
			results[0]["id"]
			// 2. chat_users にデータを挿入
			const query = 'INSERT INTO chat_users (user_id, account_id,  line_name, user_picture) VALUES (?, ?, ?, ?)';
			const [insertResults] = await connection.query(query, [user_id, results[0]["id"], user_name, user_picture]);

			// 3. 挿入されたchat_usersテーブルのIDを取得
			const chatUserId = insertResults.insertId;

			// 4. 中間テーブルにUUIDを挿入（重複エラー時に再試行）
			await insertUUID(connection, chatUserId);
		} else {
			throw new Error("管理者のアカウントIDが存在しません")
		}
	
	}catch (error) {
		// エラー内容を上位に伝達
		throw error
	}

}

const insertUUID = async (connection, chatUserId)=>{
	while(true){
		const uuidQuery = 'INSERT INTO user_entities (entity_uuid, related_id, entity_type) VALUES (UUID(), ?, ?)';
		try{
			await connection.query(uuidQuery, [chatUserId, 'user']);
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


// Node.jsのデフォルトのモジュールシステムはCommonJSのため、エクスポートするにはmodule.exportsまたはexportsを使用
module.exports = {
	insertUserID
};
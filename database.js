const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
	host: process.env.DB_HOST,    			// データベースホスト
	user: process.env.DB_USER,         	// データベースユーザー
	password: process.env.DB_PASS, 	// データベースパスワード
	database: process.env.DB_NAME      	// データベース名
});

// データベースに接続
connection.connect((err) => {
	if (err) {
		console.error('データベース接続に失敗しました:', err);
	return;
	}
	console.log('データベースに接続しました');
});


const insertUserID = (user_id, account_id, user_name, user_picture) => {
	return new Promise((resolve, reject) => {

		if (user_picture == undefined){
			user_picture = process.env.URL_PICTURE
		}

		const select_query = 'SELECT id FROM line_accounts WHERE account_id = ?';
		connection.query(select_query, [account_id], (err, results) => {
			if (err) {
				reject(err);
				return;
			}

			if (results.length > 0) {
				// 1. chat_users にデータを挿入
				const query = 'INSERT INTO chat_users (user_id, account_id,  line_name, user_picture) VALUES (?, ?, ?, ?)';
				connection.query(query, [user_id, results[0]["id"], user_name, user_picture], (err, insertResults, fields) => {
					if (err) {
						reject(err);
						return;
					}

					// 2. 挿入された `chat_users` テーブルのIDを取得
					const chatUserId = insertResults.insertId;

						// 3. 中間テーブルに UUID を挿入
					const uuidQuery = 'INSERT INTO user_entities (entity_uuid, related_id, entity_type) VALUES (UUID(), ?, ?)';
					const insertUUID = () => {
						connection.query(uuidQuery, [chatUserId, 'user'], (err, results, fields) => {
							if (err) {
								if (err.code === 'ER_DUP_ENTRY') {
									// ユニーク制約違反（重複エラー）時にUUIDを再生成して再試行
									insertUUID();  // 再試行
								} else {
									reject(err);  // その他のエラー処理
									return;
								}
							} else {
								resolve();  // 成功した場合の処理
							}
						});
					};
				
					// UUIDの挿入処理を実行
					insertUUID();
					
				});
			} else {
				console.log('No user found with the specified ID');
				resolve(null);
			}
		});
	});
}


// Node.jsのデフォルトのモジュールシステムはCommonJSのため、エクスポートするにはmodule.exportsまたはexportsを使用
module.exports = {
    insertUserID
};
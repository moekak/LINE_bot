const mysql = require('mysql2');

// データベース接続の設定
// const connection = mysql.createConnection({
//   host: 'localhost',    // データベースホスト
//   user: 'root',         // データベースユーザー
//   password: '', // データベースパスワード
//   database: 'chat_system'      // データベース名
// });
const connection = mysql.createConnection({
  host: 'localhost',    // データベースホスト
  user: 'laravel-project',         // データベースユーザー
  password: 'AhdhfnYhZp5YMn8H', // データベースパスワード
  database: 'laravel-project'      // データベース名
});

// データベースに接続
connection.connect((err) => {
  if (err) {
    console.error('データベース接続に失敗しました:', err);
    return;
  }
  console.log('データベースに接続しましたssss');
});



// // アプリケーションが終了する前に接続を終了
// process.on('SIGINT', () => {
//   connection.end((err) => {
//     if (err) {
//       console.error('データベース接続の終了に失敗しました:', err);
//     }
//     console.log('データベース接続を終了しました');
//     process.exit();
//   });
// });


const insertUserID = (user_id, account_id, user_name, user_picture) => {
  return new Promise((resolve, reject) => {
      const select_query = 'SELECT id FROM line_accounts WHERE account_id = ?';
      connection.query(select_query, [account_id], (err, results) => {
          if (err) {
              reject(err);
              return;
          }

          if (results.length > 0) {
              const query = 'INSERT INTO chat_users (user_id, account_id, message_count, line_name, user_picture) VALUES (?, ?, ?, ?, ?)';
              connection.query(query, [user_id, results[0]["id"], 0, user_name, user_picture], (err, results, fields) => {
                  if (err) {
                      reject(err);
                      return;
                  }
                  resolve();
              });
          } else {
              console.log('No user found with the specified ID');
              resolve(null);
          }
      });
  });
}



module.exports = {
      insertUserID
};
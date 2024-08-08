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
  user: 'chat_system',         // データベースユーザー
  password: 'hxPtJpBiXPeBp2Ez', // データベースパスワード
  database: 'chat_system'      // データベース名
});

// データベースに接続
connection.connect((err) => {
  if (err) {
    console.error('データベース接続に失敗しました:', err);
    return;
  }
  console.log('データベースに接続しました');
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


const insertUserID = (user_id)=>{
      const query = 'INSERT INTO users (user_id) VALUES (?)';
      connection.query(query, [user_id], (err, results, fields) => {
        if (err) {
          console.error('メッセージの挿入に失敗しました:', err);
          return;
        }
        console.log('メッセージを挿入しました:', results.insertId);
      });
}


module.exports = {
      insertUserID
};
const mysql = require('mysql2/promise');  // promise版を使用

class Database {
      constructor() {
            this.pool = mysql.createPool({
                  host: process.env.DB_HOST,      
                  user: process.env.DB_USER,      
                  password: process.env.DB_PASS, 	
                  database: process.env.DB_NAME,
                  connectionLimit: 20,
                  waitForConnections: true,
                  queueLimit: 0,
                  timezone: '+09:00'
            });
      }

      // プールから接続を取得
      async getConnection() {
            try {
                  return await this.pool.getConnection();
            } catch (error) {
                  throw new DatabaseQueryError("プールから接続に失敗しました")
            }
      }

      // クエリを実行するメソッド
      async executeQuery(sql, params = []) {
            const connection = await this.pool.getConnection();
            try {
                  return await connection.query(sql, params);  // [results, fields] を直接返す
            } catch (error) {
                  console.error('Query error:', error);
                  throw new DatabaseQueryError("クエリの実行に失敗しました。")
            } finally {
                  connection.release();
            }
      }
}   

module.exports = new Database();  // シングルトンとしてエクスポート
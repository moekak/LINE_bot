const { createClient } = require('redis');


const client = createClient();
async function main() {
      client.on('error', (err) => {
            console.error('Redis Client Error', err);
      });

      // 接続
      await client.connect();

      // データの設定
      await client.set('name', 'John Doe');

      // データの取得
      const value = await client.get('name');
      console.log(value); // 出力: John Doe

      // // 切断
      // await client.disconnect();
}

// 非同期関数の実行
main().catch(console.error);

module.exports ={
	client
}
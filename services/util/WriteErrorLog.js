const fs = require('fs').promises;  // Promise版（async/await用）
const path = require('path');      
require('dotenv').config();
const axios = require('axios');

class WriteErrorLog{
      constructor(){
            this.logDir = process.env.LOG_DIR;
      }

      async writeLog(error){
            try{
                  const date = this.#getFormattedDate();
                  const logFile = this.#getLogFilePath(date)
                  const errorMessage = this.#formatErrorMessage(error)


                  this.#sendErrorMsgToLine(encodeURIComponent(errorMessage))
                  await this.#ensureLogDirectory();
                  await this.#appendToFile(logFile, errorMessage);


            }catch(error){
                  console.error(error);
                  
            }
      }
      // プライベートメソッド
      #getFormattedDate() {
            const today = new Date();
            return today.toISOString().split('T')[0];  // YYYY-MM-DD形式
      }

      #getLogFilePath(date) {
            return path.join(this.logDir, `error_${date}.log`);
      }

      #formatErrorMessage(error) {
            const timestamp = new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString().replace('Z', '+09:00');
            const errorType = error instanceof Error ? error.constructor.name : 'Unknown Error';
            
            // エラースタックから最初の呼び出し位置を取得
            const stackLines = error.stack ? error.stack.split('\n') : [];
            const errorLocation = stackLines[1] ? stackLines[1].trim() : 'Unknown Location';
            
            // ファイル名と行数を抽出
            const locationMatch = errorLocation.match(/\((.+):(\d+):(\d+)\)$/);
            const fileName = locationMatch ? path.basename(locationMatch[1]) : 'Unknown File';
            const lineNumber = locationMatch ? locationMatch[2] : 'Unknown';
            const columnNumber = locationMatch ? locationMatch[3] : 'Unknown';


            const arr = [
                  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                  `[時間] ${timestamp}`,
                  `[種類] ${errorType}`,
                  `[ファイル] ${fileName}`,
                  `[行数] ${lineNumber}`,
                  `[列] ${columnNumber}`,
                  `[メッセージ] ${error.message || error}`,
                  '[スタックトレース]',
                  error.stack || 'スタックトレースなし',
                  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
            ]

            return arr.join('\n');
      }

      async #ensureLogDirectory() {
            await fs.mkdir(this.logDir, { recursive: true });
      }

      async #appendToFile(filePath, content) {
            await fs.appendFile(filePath, content, 'utf8');
      }


      async #sendErrorMsgToLine(message){
            try {
                  // LINE NotifyにPOSTリクエストを送信
                  const response = await axios.get(
                        `https://fast-api.info/send-to-group/?id=68976e6f-37d1-489d-8f4c-020adf7d04ff&message=${message}`
                  );
                  console.log('エラーメッセージがLINE Notifyに送信されました:', response.data);
            } catch (err) {
                  console.error('LINE Notifyへの通知に失敗しました:', err);
            }
      }
}

module.exports = WriteErrorLog
const axios = require('axios');
const DecryptError = require('../error/DecryptError');  
require('dotenv').config();

class DecryptService{
      constructor(encryptedArray){
            if(!process.env.DECRYPT_URL) throw new DecryptError('DECRYPT_URLが設定されていません')
            
            this.decryptUrl = process.env.DECRYPT_URL
            this.encryptedArray = encryptedArray
      }

      async decryptData(){
            try {
                  if (!this.encryptedArray || this.encryptedArray.length === 0) {
                        throw new DecryptError('暗号化データが空です');
                  }
      
                  const response = await axios.post(this.decryptUrl, {
                        encryptedData: this.encryptedArray,
                  });
      
                  if (!response.data) {
                        throw new DecryptError('復号化結果が空です');
                  }
      
                  return response.data;
            } catch (error) {
                  if (!(error instanceof DecryptError)) {
                        throw new DecryptError('トークン情報の復号化に失敗しました', error);
                  }
                  throw error;
            }
      }
}

module.exports = DecryptService;
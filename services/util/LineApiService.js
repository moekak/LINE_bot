const { default: axios } = require("axios");
const LineApiError = require("../error/LineApiError");

class LineApiService{
      constructor() {

            if(!global.currentConfig.channelAccessToken) throw new LineApiError("channelAccessTokenがありません")
            this.channelAccessToken = global.currentConfig.channelAccessToken;
            this.baseUrl = process.env.LINE_API_URL;
            this.profileUrl = process.env.LINE_API_PROFILE_URL;
      }

      #getHeaders() {
            if (!this.channelAccessToken) {
                  throw new LineApiError('チャンネルアクセストークンがありません');
            }
            return {
                  'Authorization': `Bearer ${this.channelAccessToken}`,
            };
      }

      #handleError(error, message){
            if (!(error instanceof LineApiError)) {
                  throw new LineApiError(`${message}: ${error.message}`)
            }
            throw error
      }

      async #makeRequest(url){
            try{
                  const config = {headers: this.#getHeaders()}
                  return await axios.get(url, config)
            }catch(error){
                  this.#handleError(error, "LINE APIへのリクエスト時にエラーが発生しました")
            }
      }

      async getAdminLineAccountInfo(){
            try{
                  const response = await this.#makeRequest(this.baseUrl)
                  return response.data.userId
            }catch(error){
                  this.#handleError(error, "管理者アカウントの情報の取得に失敗しました")
            }

      }

      async getUserLineName(user_id){
            try{
                  const response = await this.#makeRequest(`${this.profileUrl}${user_id}`)
                  return[response.data.displayName, response.data.pictureUrl]
            }catch(error){
                  this.#handleError(error, "ユーザーアカウントの名前の取得に失敗しました")    
            }
      }
}

module.exports = LineApiService
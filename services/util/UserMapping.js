const { default: axios } = require("axios");

class UserMapping {
      constructor(channelAccessToken, targetUserId) {
            this.channelAccessToken = channelAccessToken;
            this.targetUserId = targetUserId;
      }

      async generateLinkToken() {
            console.log("linkToken取得開始");
            
            try {
                  const response = await axios.post(
                  `https://api.line.me/v2/bot/user/${this.targetUserId}/linkToken`,
                  {},
                        {
                              headers: {
                                    Authorization: `Bearer ${this.channelAccessToken}`,
                              },
                        }
                  );

                  const linkToken = response.data.linkToken;
                  console.log("linkToken:", linkToken);
                  return linkToken;
                  
            } catch (error) {
                  console.error('Error fetching link token:', error.response?.data || error.message);
                  throw error;
            }
      }
}

module.exports = UserMapping;
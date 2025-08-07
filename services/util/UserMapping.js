class UserMapping{
      constructor(channelAccessToken, targetUserId){
            this.channelAccessToken = channelAccessToken
            this.targetUserId = targetUserId
      }
      generateLinkToken(){
            // linkTokenを取得するルート
            app.get('/get-link-token', async (req, res) => {
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
                        console.log(linkToken);
                        
                        res.json({ linkToken });
                  } catch (error) {
                        console.error('Error fetching link token:', error.response?.data || error.message);
                        res.status(500).json({ error: 'Failed to get linkToken' });
                  }
            });
      }
}
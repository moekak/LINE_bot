const ChannelTokenError = require("../error/ChannelTokenError");
const DatabaseQuery = require("./DatabaseQueryService");
const DecryptService = require("./DecryptService");

class ChannelTokenService{
      constructor(){
            this.databaseQueryService = new DatabaseQuery()
      }
      async generateConfig(){
            try {

                  const tokens = await this.databaseQueryService.getChannelTokenAndSecretToekn();
                  const decryptService = new DecryptService(tokens)
                  const decryptedData = await decryptService.decryptData();

                  
                  return decryptedData
            } catch (error) {
                  throw new ChannelTokenError(error)
            }
      }
}

module.exports = ChannelTokenService
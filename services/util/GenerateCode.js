const DatabaseQueryService = require('./DatabaseQueryService');

class GenerateCode{
      constructor(accountId){
            this.fixedCode = "C1"
            this.databaseQueryService = new DatabaseQueryService()
            this.accountId = accountId
      }
      async generateCode(){
            const prefix = await this.databaseQueryService.getCode(this.accountId)
            const randomNum =  Math.floor(Math.random() * 9e10 + 1e10).toString();
            return prefix + this.fixedCode + randomNum
      }
}
module.exports = GenerateCode
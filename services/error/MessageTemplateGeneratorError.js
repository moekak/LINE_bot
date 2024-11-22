class MessageTemplateGeneratorError extends Error{
      constructor(message, originalError = null) {
            super(message);
            this.name = 'MessageTemplateGeneratorError';
            this.originalError = originalError;
      }
}


module.exports = MessageTemplateGeneratorError
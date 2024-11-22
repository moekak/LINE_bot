class DecryptError extends Error {
      constructor(message, originalError = null) {
            super(message);
            this.name = 'DecryptError';
            this.originalError = originalError;
      }
}

module.exports = DecryptError
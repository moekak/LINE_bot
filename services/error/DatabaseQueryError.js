class DatabaseQueryError extends Error {
      constructor(message, originalError = null) {
            super(message);
            this.name = 'DatabaseQueryError';
            this.originalError = originalError;
      }
}

module.exports = DatabaseQueryError
class LineApiError extends Error {
      constructor(message, originalError = null) {
            super(message);
            this.name = 'LineApiError';
            this.originalError = originalError;
      }
}

module.exports = LineApiError
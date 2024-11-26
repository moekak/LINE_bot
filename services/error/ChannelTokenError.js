class ChannelTokenError extends Error {
      constructor(message, originalError = null) {
            super(message);
            this.name = 'ChannelTokenError';
            this.originalError = originalError;
      }
}

module.exports = ChannelTokenError
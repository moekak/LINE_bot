
const axios = require('axios');
const decryptLaravelData = async (encryptedArray) => {
    try {
        const response = await axios.post('https://twitter-clone.click/api/decrypt', {
            encryptedData: encryptedArray
        });
        return response.data;
    } catch (error) {
        console.error('Failed to decrypt data:', error.message);
        return null;
    }
};

module.exports = {
    decryptLaravelData,
};

const crypto = require('crypto');

class AuthManager {
  constructor(apiKey = null) {
    this.masterKeyHash = apiKey ? crypto.createHash('sha256').update(apiKey).digest() : null;
  }

  isAuthRequired() {
    return this.masterKeyHash !== null;
  }

  verifyKey(candidateKey) {
    if (!this.masterKeyHash) return true;
    if (!candidateKey) return false;

    const candidateHash = crypto.createHash('sha256').update(candidateKey).digest();
    try {
      return crypto.timingSafeEqual(candidateHash, this.masterKeyHash);
    } catch (e) {
      return false;
    }
  }
}

module.exports = {
  AuthManager,
};

const NodeCache = require("node-cache");
const cron = require('node-cron');

class CacheManager {
  static instance;

  constructor() {
    if (CacheManager.instance) {
      return CacheManager.instance;
    }

    this._cache = new NodeCache({ stdTTL: 20000, checkperiod: 120 });
    CacheManager.instance = this;
  }

  static createCache() {
    return new CacheManager();
  }

  get(key) {
    return this._cache.get(key);
  }

  set(key, value) {
    if (typeof value === 'object') {
      value.timestamp = Date.now();
    }
    return this._cache.set(key, value);
  }

  async refreshCache() {
    // This method can be called to manually refresh cache
    // Currently handled by the electionService
  }
}

module.exports = CacheManager;
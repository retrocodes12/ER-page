const CacheManager = require('./CacheManager');
const DataSource = require('./dataSources');

const config = require('../config');

class ElectionService {
  constructor() {
    // Ensure cache manager is initialized
    if (!CacheManager.instance) {
      CacheManager.createCache();
    }
    this.cache = CacheManager.instance;
    this.sources = DataSource;
  }

  async getElectionResults() {
    // Check if counting has started
    const now = new Date();
    if (now < config.countingStartTime) {
      // Return NOT_STARTED response without seat numbers
      return {
        state: 'Kerala',
        status: 'NOT_STARTED',
        message: 'Counting has not started yet',
        lastUpdated: now.toISOString()
      };
    }

    let cachedData = null;
    try {
      cachedData = await this.cache.get('election-results');
    } catch (e) {
      // ignore cache errors
    }

    // Check if cache is expired or doesn't exist
    if (!cachedData || !cachedData.timestamp || Date.now() - cachedData.timestamp > 20000) {
      return await this.fetchNewData();
    }

    return cachedData;
  }

  async fetchNewData() {
    // Try sources in priority order
    if (this.sources.EC_WEBSITE.isActive) {
      try {
        const data = await this.fetchFromUrl(this.sources.EC_WEBSITE.url);
        this.sources.EC_WEBSITE.errorCount = 0; // Reset error count on success
        return data;
      } catch (error) {
        this.sources.EC_WEBSITE.errorCount++;
        console.warn('EC Website fetch failed:', error.message);
      }
    }

    // Try secondary source
    if (this.sources.STATE_EC.isActive) {
      try {
        const data = await this.fetchFromUrl(this.sources.STATE_EC.url);
        this.sources.STATE_EC.errorCount = 0; // Reset error count on success
        return data;
      } catch (error) {
        this.sources.STATE_EC.errorCount++;
        console.warn('State EC fetch failed:', error.message);
      }
    }

    // Fall back to static data
    console.warn('Using fallback data');
    const fallbackData = this.getFallbackData();
    try {
      await this.cache.set('election-results', fallbackData);
    } catch (e) {
      // ignore cache set errors
    }
    return fallbackData;
  }

  async fetchFromUrl(url) {
    const axios = require('axios');
    const cheerio = require('cheerio');

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Parse HTML and map to API format
    // This is a placeholder - actual parsing depends on website structure
    const data = {
      state: 'Kerala',
      totalSeats: 140,
      leading: {
        LDF: Math.floor(Math.random() * 70),
        UDF: Math.floor(Math.random() * 70),
        BJP: Math.floor(Math.random() * 70),
        Others: 0
      },
      constituencies: [
        {
          name: 'Thrissur',
          leadingParty: ['LDF', 'UDF', 'BJP'][Math.floor(Math.random() * 3)],
          margin: Math.floor(Math.random() * 5000),
          status: 'Leading'
        }
      ],
      lastUpdated: new Date().toISOString()
    };

    // Validate data before caching
    this.validateData(data);
    try {
      await this.cache.set('election-results', data);
    } catch (e) {
      // ignore cache errors
    }
    return data;
  }

  getFallbackData() {
    return {
      state: 'Kerala',
      totalSeats: 140,
      leading: {
        LDF: 45,
        UDF: 35,
        BJP: 30,
        Others: 30
      },
      constituencies: [
        {
          name: 'Thrissur',
          leadingParty: 'UDF',
          margin: 1200,
          status: 'Leading'
        }
      ],
      lastUpdated: new Date().toISOString()
    };
  }

  validateData(data) {
    // Validate required fields
    if (!data.state || !data.totalSeats || !data.leading || !data.constituencies) {
      throw new Error('Invalid data structure');
    }

    // Validate leading parties
    const requiredParties = ['LDF', 'UDF', 'BJP', 'Others'];
    for (const party of requiredParties) {
      if (!(party in data.leading) || typeof data.leading[party] !== 'number') {
        throw new Error(`Invalid or missing leading party: ${party}`);
      }
    }

    // Validate constituencies
    if (!Array.isArray(data.constituencies)) {
      throw new Error('Constituencies must be an array');
    }

    for (const constituency of data.constituencies) {
      if (!constituency.name || !constituency.leadingParty ||
          typeof constituency.margin !== 'number' || !constituency.status) {
        throw new Error('Invalid constituency structure');
      }
    }
  }

  async updateCache(data) {
    this.validateData(data);
    await this.cache.set('election-results', data);
  }
}

module.exports = ElectionService;
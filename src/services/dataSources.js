// Multiple data sources with automatic fallback

const DataSource = {
  /**
   * Primary source: Real-time scraping from EC website
   */
  EC_WEBSITE: {
    url: 'https://results.eci.gov.in/',
    type: 'scrape',
    priority: 1,
    isActive: true,
    errorCount: 0
  },

  /**
   * Secondary source: State Election Commission
   */
  STATE_EC: {
    url: 'https://keralaelection.gov.in/',
    type: 'scrape',
    priority: 2,
    isActive: true,
    errorCount: 0
  },

  /**
   * Fallback source: Static template (when scraping fails)
   */
  FALLBACK: {
    type: 'static',
    priority: 3,
    isActive: true,
    errorCount: 0
  },

  /**
   * Health check endpoint (returns data source status)
   */
  getHealthStatus: function() {
    return {
      sources: {
        ec_website: this.EC_WEBSITE.isActive ? 'active' : 'inactive',
        state_ec: this.STATE_EC.isActive ? 'active' : 'inactive',
        fallback: 'standby'
      },
      totalErrors: this.EC_WEBSITE.errorCount + this.STATE_EC.errorCount,
      lastUpdate: new Date().toISOString()
    };
  }
};

module.exports = DataSource;

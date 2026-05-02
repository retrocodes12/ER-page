const express = require('express');
const router = express.Router();
const ElectionService = require('../services/electionService');

// Parse JSON bodies for this router
router.use(express.json());

const electionService = new ElectionService();

// GET /api/results - Primary endpoint with auto-fallback
router.get('/results', async (req, res) => {
  const state = req.query.state;

  if (state !== 'kerala') {
    return res.status(400).json({ error: 'Invalid state parameter' });
  }

  try {
    const result = await electionService.getElectionResults();
    res.json(result);
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /admin/update - Emergency manual cache update
router.post('/admin/update', async (req, res) => {
  const updateData = req.body;

  // Validate required fields
  if (!updateData || typeof updateData !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const requiredFields = ['state', 'totalSeats', 'leading', 'constituencies', 'lastUpdated'];
  for (const field of requiredFields) {
    if (!(field in updateData)) {
      return res.status(400).json({ error: `Missing required field: ${field}` });
    }
  }

  // State must be 'Kerala'
  if (updateData.state !== 'Kerala') {
    return res.status(400).json({ error: 'State must be "Kerala"' });
  }

  // Validate leading object structure
  const requiredLeading = ['LDF', 'UDF', 'BJP', 'Others'];
  for (const party of requiredLeading) {
    if (!(party in updateData.leading) || typeof updateData.leading[party] !== 'number') {
      return res.status(400).json({ error: `Invalid or missing leading field: ${party}` });
    }
  }

  // Validate constituencies array
  if (!Array.isArray(updateData.constituencies)) {
    return res.status(400).json({ error: 'Constituencies must be an array' });
  }

  for (const constituency of updateData.constituencies) {
    if (!constituency.name || !constituency.leadingParty || typeof constituency.margin !== 'number' || !constituency.status) {
      return res.status(400).json({ error: 'Invalid constituency structure' });
    }
  }

  try {
    await electionService.updateCache(updateData);
    res.json({
      success: true,
      message: 'Cache updated successfully',
      data: updateData
    });
  } catch (error) {
    console.error('Admin update error:', error.message);
    res.status(500).json({ error: 'Failed to update cache' });
  }
});

module.exports = router;
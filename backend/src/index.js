require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Client } = require('@elastic/elasticsearch');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Elasticsearch client
const esClient = new Client({
  node: process.env.ELASTICSEARCH_NODE
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN
}));
app.use(express.json());

// Import routes
const searchRoutes = require('./routes/searchRoutes');
const statsRoutes = require('./routes/statsRoutes');

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const health = await esClient.cluster.health();
    res.json({
      status: 'ok',
      elasticsearch: health.status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Basic info endpoint
app.get('/api/v1/info', async (req, res) => {
  try {
    const count = await esClient.count({
      index: process.env.ELASTICSEARCH_INDEX
    });
    res.json({
      service: 'Transportation Portal API',
      version: '1.0.0',
      totalRecords: count.count,
      index: process.env.ELASTICSEARCH_INDEX
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mount routes
app.use('/api/v1', searchRoutes);
app.use('/api/v1', statsRoutes);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Transportation API listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Elasticsearch: ${process.env.ELASTICSEARCH_NODE}`);
});

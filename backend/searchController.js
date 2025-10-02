const { Client } = require('@elastic/elasticsearch');
const esClient = new Client({
  node: process.env.ELASTICSEARCH_NODE
});

// Search aircraft with filters and statistics
exports.searchAircraft = async (req, res) => {
  try {
    const {
      query = '',
      manufacturer = '',
      model = '',
      year_min,
      year_max,
      state = '',
      page = 1,
      size = 20
    } = req.query;

    // Build Elasticsearch query (same as before)
    const must = [];
    
    if (query) {
      must.push({
        multi_match: {
          query: query,
          fields: ['manufacturer', 'model', 'registration_id', 'plane_data.n_number']
        }
      });
    }

    if (manufacturer) {
      must.push({ match: { manufacturer: manufacturer } });
    }

    if (model) {
      must.push({ match: { model: model } });
    }

    if (state) {
      must.push({ term: { 'location.state_province': state } });
    }

    if (year_min || year_max) {
      const range = { year: {} };
      if (year_min) range.year.gte = parseInt(year_min);
      if (year_max) range.year.lte = parseInt(year_max);
      must.push({ range });
    }

    const finalQuery = must.length > 0 ? { bool: { must } } : { match_all: {} };
    
    // Calculate from/offset for pagination
    const from = (parseInt(page) - 1) * parseInt(size);

    // Enhanced search body with aggregations
    const searchBody = {
      query: finalQuery,
      from: from,
      size: parseInt(size),
      sort: [{ year: 'desc' }],
      
      // Add aggregations for statistics
      aggs: {
        // Histogram 1: Count of aircraft by manufacturer (ALL manufacturers)
        by_manufacturer: {
          terms: {
            field: 'manufacturer.keyword',
            size: 100,  // Get all manufacturers, not just top 10
            order: { _count: 'desc' }
          },
          // Nested aggregation: models within each manufacturer
          aggs: {
            models: {
              terms: {
                field: 'model.keyword',
                size: 100  // Get all models for each manufacturer
              }
            }
          }
        },
        
        // Additional useful aggregations
        by_state: {
          terms: {
            field: 'location.state_province',
            size: 50
          }
        },
        
        by_year: {
          histogram: {
            field: 'year',
            interval: 1,
            min_doc_count: 1,
            order: { _key: 'desc' }
          }
        },
        
        by_category: {
          terms: {
            field: 'category',
            size: 20
          }
        }
      }
    };

    const result = await esClient.search({
      index: process.env.ELASTICSEARCH_INDEX,
      body: searchBody
    });

    // Transform aggregations into our statistics format
    const statistics = {
      // Histogram 1 data: { "Boeing": 150, "Cessna": 300, ... }
      byManufacturer: {},
      
      // Histogram 2 data: { "Boeing": { "737": 50, "747": 30 }, "Cessna": { "172": 200 } }
      modelsByManufacturer: {},
      
      totalCount: result.hits.total.value
    };

    // Process manufacturer aggregation
    if (result.aggregations.by_manufacturer) {
      result.aggregations.by_manufacturer.buckets.forEach(bucket => {
        const manufacturerName = bucket.key;
        const aircraftCount = bucket.doc_count;
        
        // Histogram 1: Total aircraft per manufacturer
        statistics.byManufacturer[manufacturerName] = aircraftCount;
        
        // Histogram 2: Models within this manufacturer
        statistics.modelsByManufacturer[manufacturerName] = {};
        
        if (bucket.models && bucket.models.buckets) {
          bucket.models.buckets.forEach(modelBucket => {
            statistics.modelsByManufacturer[manufacturerName][modelBucket.key] = modelBucket.doc_count;
          });
        }
      });
    }

    // Format response
    res.json({
      items: result.hits.hits.map(hit => ({
        id: hit._id,
        ...hit._source
      })),
      total: result.hits.total.value,
      page: parseInt(page),
      size: parseInt(size),
      statistics: statistics
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get single aircraft by ID
exports.getAircraftById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await esClient.get({
      index: process.env.ELASTICSEARCH_INDEX,
      id: id
    });

    res.json(result._source);
    
  } catch (error) {
    if (error.meta?.statusCode === 404) {
      return res.status(404).json({ error: 'Aircraft not found' });
    }
    res.status(500).json({ error: error.message });
  }
};
EOFcat > searchController.js << 'EOF'
const { Client } = require('@elastic/elasticsearch');
const esClient = new Client({
  node: process.env.ELASTICSEARCH_NODE
});

// Search aircraft with filters and statistics
exports.searchAircraft = async (req, res) => {
  try {
    const {
      query = '',
      manufacturer = '',
      model = '',
      year_min,
      year_max,
      state = '',
      page = 1,
      size = 20
    } = req.query;

    // Build Elasticsearch query (same as before)
    const must = [];
    
    if (query) {
      must.push({
        multi_match: {
          query: query,
          fields: ['manufacturer', 'model', 'registration_id', 'plane_data.n_number']
        }
      });
    }

    if (manufacturer) {
      must.push({ match: { manufacturer: manufacturer } });
    }

    if (model) {
      must.push({ match: { model: model } });
    }

    if (state) {
      must.push({ term: { 'location.state_province': state } });
    }

    if (year_min || year_max) {
      const range = { year: {} };
      if (year_min) range.year.gte = parseInt(year_min);
      if (year_max) range.year.lte = parseInt(year_max);
      must.push({ range });
    }

    const finalQuery = must.length > 0 ? { bool: { must } } : { match_all: {} };
    
    // Calculate from/offset for pagination
    const from = (parseInt(page) - 1) * parseInt(size);

    // Enhanced search body with aggregations
    const searchBody = {
      query: finalQuery,
      from: from,
      size: parseInt(size),
      sort: [{ year: 'desc' }],
      
      // Add aggregations for statistics
      aggs: {
        // Histogram 1: Count of aircraft by manufacturer (ALL manufacturers)
        by_manufacturer: {
          terms: {
            field: 'manufacturer.keyword',
            size: 100,  // Get all manufacturers, not just top 10
            order: { _count: 'desc' }
          },
          // Nested aggregation: models within each manufacturer
          aggs: {
            models: {
              terms: {
                field: 'model.keyword',
                size: 100  // Get all models for each manufacturer
              }
            }
          }
        },
        
        // Additional useful aggregations
        by_state: {
          terms: {
            field: 'location.state_province',
            size: 50
          }
        },
        
        by_year: {
          histogram: {
            field: 'year',
            interval: 1,
            min_doc_count: 1,
            order: { _key: 'desc' }
          }
        },
        
        by_category: {
          terms: {
            field: 'category',
            size: 20
          }
        }
      }
    };

    const result = await esClient.search({
      index: process.env.ELASTICSEARCH_INDEX,
      body: searchBody
    });

    // Transform aggregations into our statistics format
    const statistics = {
      // Histogram 1 data: { "Boeing": 150, "Cessna": 300, ... }
      byManufacturer: {},
      
      // Histogram 2 data: { "Boeing": { "737": 50, "747": 30 }, "Cessna": { "172": 200 } }
      modelsByManufacturer: {},
      
      totalCount: result.hits.total.value
    };

    // Process manufacturer aggregation
    if (result.aggregations.by_manufacturer) {
      result.aggregations.by_manufacturer.buckets.forEach(bucket => {
        const manufacturerName = bucket.key;
        const aircraftCount = bucket.doc_count;
        
        // Histogram 1: Total aircraft per manufacturer
        statistics.byManufacturer[manufacturerName] = aircraftCount;
        
        // Histogram 2: Models within this manufacturer
        statistics.modelsByManufacturer[manufacturerName] = {};
        
        if (bucket.models && bucket.models.buckets) {
          bucket.models.buckets.forEach(modelBucket => {
            statistics.modelsByManufacturer[manufacturerName][modelBucket.key] = modelBucket.doc_count;
          });
        }
      });
    }

    // Format response
    res.json({
      items: result.hits.hits.map(hit => ({
        id: hit._id,
        ...hit._source
      })),
      total: result.hits.total.value,
      page: parseInt(page),
      size: parseInt(size),
      statistics: statistics
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get single aircraft by ID
exports.getAircraftById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await esClient.get({
      index: process.env.ELASTICSEARCH_INDEX,
      id: id
    });

    res.json(result._source);
    
  } catch (error) {
    if (error.meta?.statusCode === 404) {
      return res.status(404).json({ error: 'Aircraft not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

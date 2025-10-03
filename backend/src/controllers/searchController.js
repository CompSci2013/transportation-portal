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
      size = 20,
      manufacturer_state_combos = ''
    } = req.query;

    // Build Elasticsearch query
    const must = [];
    
    if (query) {
      must.push({
        multi_match: {
          query: query,
          fields: ['manufacturer', 'model', 'registration_id', 'plane_data.n_number']
        }
      });
    }

    // Handle manufacturer-state combinations (takes precedence over individual fields)
    if (manufacturer_state_combos) {
      const combos = manufacturer_state_combos.split(',').map(combo => {
        const [mfr, st] = combo.split(':');
        return { manufacturer: mfr.trim(), state: st.trim() };
      });

      if (combos.length > 0) {
        must.push({
          bool: {
            should: combos.map(combo => ({
              bool: {
                must: [
                  { term: { 'manufacturer.keyword': combo.manufacturer } },
                  { term: { 'location.state_province': combo.state } }
                ]
              }
            })),
            minimum_should_match: 1
          }
        });
      }
    } else {
      // Fallback to individual manufacturer/state (for backward compatibility)
      if (manufacturer) {
        must.push({ term: { 'manufacturer.keyword': manufacturer } });
      }

      if (state) {
        must.push({ term: { 'location.state_province': state } });
      }
    }

    if (model) {
      must.push({ match: { model: model } });
    }

    if (year_min || year_max) {
      const range = { year: {} };
      if (year_min) range.year.gte = parseInt(year_min);
      if (year_max) range.year.lte = parseInt(year_max);
      must.push({ range });
    }

    const finalQuery = must.length > 0 ? { bool: { must } } : { match_all: {} };
    const from = (parseInt(page) - 1) * parseInt(size);

    // Enhanced search body with aggregations
    const searchBody = {
      query: finalQuery,
      from: from,
      size: parseInt(size),
      sort: [{ year: 'desc' }],
      
      aggs: {
        by_manufacturer: {
          terms: {
            field: 'manufacturer.keyword',
            size: 100,
            order: { _count: 'desc' }
          },
          aggs: {
            models: {
              terms: {
                field: 'model.keyword',
                size: 100
              }
            }
          }
        },
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

    // Transform aggregations into statistics format
    const statistics = {
      byManufacturer: {},
      modelsByManufacturer: {},
      totalCount: result.hits.total.value
    };

    if (result.aggregations.by_manufacturer) {
      result.aggregations.by_manufacturer.buckets.forEach(bucket => {
        const manufacturerName = bucket.key;
        statistics.byManufacturer[manufacturerName] = bucket.doc_count;
        statistics.modelsByManufacturer[manufacturerName] = {};
        
        if (bucket.models && bucket.models.buckets) {
          bucket.models.buckets.forEach(modelBucket => {
            statistics.modelsByManufacturer[manufacturerName][modelBucket.key] = modelBucket.doc_count;
          });
        }
      });
    }

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

/**
 * Get unique manufacturer-state combinations with counts
 * Supports pagination and search filtering
 */
exports.getManufacturerStateCombinations = async (req, res) => {
  try {
    const { page = 1, size = 20, search = '' } = req.query;
    const from = (page - 1) * size;

    // Aggregation query for unique manufacturer + state combinations
    const response = await esClient.search({
      index: process.env.ELASTICSEARCH_INDEX,
      size: 0,
      body: {
        query: search ? {
          wildcard: {
            manufacturer: {
              value: `*${search}*`,
              case_insensitive: true
            }
          }
        } : { match_all: {} },
        aggs: {
          manufacturers: {
            terms: {
              field: 'manufacturer.keyword',
              size: 1000
            },
            aggs: {
              states: {
                terms: {
                  field: 'location.state_province',
                  size: 100
                }
              }
            }
          }
        }
      }
    });

    // Flatten to manufacturer-state pairs
    const pairs = [];
    response.aggregations.manufacturers.buckets.forEach(mfrBucket => {
      mfrBucket.states.buckets.forEach(stateBucket => {
        pairs.push({
          manufacturer: mfrBucket.key,
          state: stateBucket.key,
          count: stateBucket.doc_count
        });
      });
    });

    // Apply pagination
    const total = pairs.length;
    const paginatedPairs = pairs.slice(from, from + parseInt(size));

    res.json({
      total,
      page: parseInt(page),
      size: parseInt(size),
      items: paginatedPairs
    });

  } catch (error) {
    console.error('Error fetching manufacturer-state combinations:', error);
    res.status(500).json({ error: 'Failed to fetch combinations' });
  }
};

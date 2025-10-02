const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({
  node: process.env.ELASTICSEARCH_NODE
});

// Get aggregate statistics
exports.getStatistics = async (req, res) => {
  try {
    const stats = {};

    // Total count
    const countResult = await esClient.count({
      index: process.env.ELASTICSEARCH_INDEX
    });
    stats.totalAircraft = countResult.count;

    // Top manufacturers (top 10)
    const manufacturersAgg = await esClient.search({
      index: process.env.ELASTICSEARCH_INDEX,
      body: {
        size: 0,
        aggs: {
          top_manufacturers: {
            terms: {
              field: 'manufacturer.keyword',
              size: 10
            }
          }
        }
      }
    });
    stats.topManufacturers = manufacturersAgg.aggregations.top_manufacturers.buckets.map(b => ({
      name: b.key,
      count: b.doc_count
    }));

    // Top states (top 10)
    const statesAgg = await esClient.search({
      index: process.env.ELASTICSEARCH_INDEX,
      body: {
        size: 0,
        aggs: {
          top_states: {
            terms: {
              field: 'location.state_province',
              size: 10
            }
          }
        }
      }
    });
    stats.topStates = statesAgg.aggregations.top_states.buckets.map(b => ({
      state: b.key,
      count: b.doc_count
    }));

    // Year distribution (last 10 years)
    const yearAgg = await esClient.search({
      index: process.env.ELASTICSEARCH_INDEX,
      body: {
        size: 0,
        aggs: {
          year_distribution: {
            histogram: {
              field: 'year',
              interval: 1,
              min_doc_count: 1,
              order: { _key: 'desc' }
            }
          }
        }
      }
    });
    stats.yearDistribution = yearAgg.aggregations.year_distribution.buckets
      .slice(0, 10)
      .map(b => ({
        year: b.key,
        count: b.doc_count
      }));

    // Aircraft type distribution - use category instead of plane_data.aircraft_type
    const typeAgg = await esClient.search({
      index: process.env.ELASTICSEARCH_INDEX,
      body: {
        size: 0,
        aggs: {
          aircraft_types: {
            terms: {
              field: 'category',
              size: 10
            }
          }
        }
      }
    });
    stats.aircraftTypes = typeAgg.aggregations.aircraft_types.buckets.map(b => ({
      type: b.key,
      count: b.doc_count
    }));

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

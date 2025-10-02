const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({
  node: process.env.ELASTICSEARCH_NODE
});

// Search aircraft with filters
exports.searchAircraft = async (req, res) => {
  try {
    const {
      query = '',
      manufacturer = '',
      model = '',
      year_min,
      year_max,
      state = '',
      from = 0,
      size = 20
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

    const searchBody = {
      query: must.length > 0 ? { bool: { must } } : { match_all: {} },
      from: parseInt(from),
      size: parseInt(size),
      sort: [{ year: 'desc' }]
    };

    const result = await esClient.search({
      index: process.env.ELASTICSEARCH_INDEX,
      body: searchBody
    });

    res.json({
      total: result.hits.total.value,
      aircraft: result.hits.hits.map(hit => ({
        id: hit._id,
        ...hit._source
      }))
    });
  } catch (error) {
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

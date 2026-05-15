const app = require('../backend/dist/app').default;

module.exports = (req, res) => app(req, res);

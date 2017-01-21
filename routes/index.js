var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send('available: /proxy /proxy/write/* /proxy/read/*');
});

module.exports = router;

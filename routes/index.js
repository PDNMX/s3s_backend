var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("ok");
  return res.status(200).send({msj:'ok'});
});

module.exports = router;

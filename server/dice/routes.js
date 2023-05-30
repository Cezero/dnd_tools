const controllers = require('./controllers');
const router = require('express').Router();

router.post('/roll', controllers.rollDice);

module.exports = router;
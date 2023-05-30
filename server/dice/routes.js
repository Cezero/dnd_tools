const controllers = require('./controllers')
const router = require('express').Router()

module.exports = () => {
    router.post('/roll', controllers.rollDice)
}
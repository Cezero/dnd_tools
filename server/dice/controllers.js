const { parseAndRoll } = require('./services')

module.exports = () => {
    rollDice: async (req, res) => {
        try {
            const dieDescription = req.body.dieDescription
            const result = await parseAndRoll(dieDescription)
            res.json(result)
        }
        catch (err) {
            res.status(500).send(err)
        }
    }
}
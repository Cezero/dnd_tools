const { parseAndRoll } = require('./services');

const rollDice = async (req, res) => {
    try {
        const dieDescription = req.body.dieDescription;
        console.log("in controllers.rollDice dieDescription = " + dieDescription);
        const result = await parseAndRoll(dieDescription);
        res.json(result);
    }
    catch (err) {
        res.status(500).send(err);
    };
}

module.exports = {
    rollDice
};
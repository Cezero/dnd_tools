const Owlbear = require('owlbear');
const interpreter = require('./interpretRoll')

const roller = new Owlbear();

const parseAndRoll = function(notation) {
    try {
        const parsed = roller.parse(notation);
        const rolled = interpreter.interpretRoll(parsed);
        return rolled;
    } catch (e) {
        return e;
    };
};

module.exports = {
    parseAndRoll
}
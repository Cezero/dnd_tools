const Owlbear = require('owlbear');

const roller = new Owlbear();

const parseAndRoll = function(notation) {
    try {
        const parsed = roller.parse(notation);
        console.log("in services.parseAndRoll parsed = " + JSON.stringify(parsed));
        return parsed;
    } catch (e) {
        return e;
    };
};

module.exports = {
    parseAndRoll
}
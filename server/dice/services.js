const Owlbear = require('owlbear');

const roller = new Owlbear();

export default function parseAndRoll(notation) {
    try {
        const parsed = roller.parse(notation);
        return parsed;
    } catch (e) {
        return e;
    };
};
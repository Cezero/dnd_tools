import { resolve as charactersResolve } from '../features/characters/controllers/charactersController.js';
import { resolve as referencetablesResolve } from '../features/referencetables/controllers/referencetablesController.js';
import { resolve as spellsResolve } from '../features/spells/controllers/spellsController.js';

export const entityResolvers = {
    characters: charactersResolve,
    referencetables: referencetablesResolve,
    spells: spellsResolve,
};

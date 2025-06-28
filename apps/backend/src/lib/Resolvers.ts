import { Resolve as CharactersResolve } from '../features/characters/controllers/CharacterController';
import { Resolve as ReferencetablesResolve } from '../features/referencetables/controllers/ReferenceTableController';
import { Resolve as SpellsResolve } from '../features/spells/controllers/SpellController';

export const EntityResolvers: Record<string, (names: string[]) => Promise<any>> = {
    characters: CharactersResolve,
    referencetables: ReferencetablesResolve,
    spells: SpellsResolve,
}; 
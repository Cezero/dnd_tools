import lookupService from '@/services/LookupService';
import { FEAT_BENEFIT_TYPES } from 'shared-data/src/featData';
import { SAVING_THROW_LIST } from 'shared-data/src/abilityData';
import { PROFICIENCY_TYPE_LIST } from 'shared-data/src/itemData';


let _isInitialized = false;
let _initializationPromise = null;

class FeatOptions {
    constructor() {
        this.skills = new Map();
    }

    async initialize() {
        if (_initializationPromise) {
            return _initializationPromise;
        }

        _initializationPromise = new Promise(async (resolve, reject) => {
            try {
                await lookupService.initialize();
                this.skills = lookupService.getAll('skills');
                _isInitialized = true;
                resolve();
            } catch (error) {
                console.log('[FeatOptions] failed to initialize:', error);
                _initializationPromise = null;
                reject(error);
            }
        });

        return _initializationPromise;
    }

    get(benefit_type) {
        console.log('[FeatUtil] get() called. benefit_type:', benefit_type);
        if (!_isInitialized) {
            throw new Error('FeatUtil not initialized');
        }
        switch (benefit_type) {
            case FEAT_BENEFIT_TYPES.SKILL.id:
                return this.skills.map(skill = ({ id: skill.skill_id, name: skill.skill_name }));
            case FEAT_BENEFIT_TYPES.PROFICIENCY.id:
                return PROFICIENCY_TYPE_LIST;
            case FEAT_BENEFIT_TYPES.SAVE.id:
                return SAVING_THROW_LIST;
            default:
                return [];
        }
    };
}

const featOptions = new FeatOptions();
export default featOptions;
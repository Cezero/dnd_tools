import { timedQuery } from "../queryTimer.js";

class SkillCache {
    constructor() {
        this.skills = new Map();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            console.log('[SkillCache] Initializing...');
            const { rows } = await timedQuery('SELECT * FROM skills', [], 'SkillCache');
            for (const row of rows) {
                this.skills.set(row.skill_id, {
                    skill_id: row.skill_id,
                    skill_name: row.skill_name,
                    ability_id: row.ability_id,
                    trained_only: row.trained_only,
                    skill_armor_check_penalty: row.skill_armor_check_penalty,
                    skill_check: row.skill_check,
                    skill_action: row.skill_action,
                    skill_try_again: row.skill_try_again,
                    skill_try_again_desc: row.skill_try_again_desc,
                    skill_special: row.skill_special,
                    skill_synergy_desc: row.skill_synergy_desc,
                    untrained_desc: row.untrained_desc,
                    skill_description: row.skill_description,
                });
            }
            this.initialized = true;
            console.log(`[SkillCache] Initialized with ${this.skills.size} skills`);
        } catch (error) {
            console.error('[SkillCache] Failed to initialize:', error);
        }
    }

    getID(input) {
        if (!this.initialized) {
            throw new Error('SkillCache not initialized');
        }
        if (!input) return null;

        const numericInput = Number(input);
        if (!isNaN(numericInput)) {
            return this.skills.has(numericInput) ? numericInput : null;
        }

        const skillInfo = this.getSkill(input);
        return skillInfo ? skillInfo.skill_id : null;
    }

    getSkill(skillName) {
        if (!this.initialized) {
            throw new Error('SkillCache not initialized');
        }
        if (typeof skillName !== 'string') {
            return null;
        }
        return Array.from(this.skills.values()).find(skill =>
            skill.skill_name.toLowerCase() === skillName.toLowerCase()
        );
    }

    getSkillById(skillId) {
        if (!this.initialized) {
            throw new Error('SkillCache not initialized');
        }
        return this.skills.get(skillId);
    }
}

const skillCache = new SkillCache();
await skillCache.initialize();
export default skillCache; 
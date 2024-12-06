import { StoonieSoul } from '../entities/StoonieSoul.js';

export class SoulManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.souls = new Map();
        this.availableSouls = [];
        this.soulCount = 0;
        
        // Start with 3 souls
        this.createInitialSouls(3);
    }

    createInitialSouls(count) {
        for (let i = 0; i < count; i++) {
            const soul = new StoonieSoul(this.soulCount++);
            this.souls.set(soul.id, soul);
            this.availableSouls.push(soul);
        }
    }

    getAvailableSoul() {
        return this.availableSouls.length > 0 ? this.availableSouls[0] : null;
    }

    getAvailableSouls() {
        return this.availableSouls;
    }

    connectSoulToStoonie(soul, stoonie) {
        if (!soul) {
            console.log('Invalid soul: soul is null or undefined');
            return false;
        }
        if (!stoonie) {
            console.log('Invalid stoonie: stoonie is null or undefined');
            return false;
        }
        if (!this.souls.has(soul.id)) {
            console.log('Soul not found in souls collection');
            return false;
        }

        // Check if soul is available
        const index = this.availableSouls.indexOf(soul);
        if (index === -1) {
            console.log('Soul is not available (already connected or invalid)');
            return false;
        }

        // Check if stoonie already has a soul
        if (stoonie.soul) {
            console.log('Stoonie already has a soul connected');
            return false;
        }

        // Connect soul to stoonie
        this.availableSouls.splice(index, 1);
        soul.connectedStoonie = stoonie;
        stoonie.soul = soul;
        
        console.log(`Successfully connected soul ${soul.id} to stoonie`);
        return true;
    }

    disconnectSoulFromStoonie(stoonie) {
        if (!stoonie.soul) return;
        
        const soul = stoonie.soul;
        soul.disconnectFromStoonie();
        this.availableSouls.push(soul);
    }

    addExperience(soul, amount) {
        if (this.souls.has(soul.id)) {
            soul.addExperience(amount);
        }
    }

    getSoulInfo(soul) {
        return {
            level: soul.level,
            experience: soul.experience,
            nextLevel: soul.experienceToNextLevel,
            powers: Array.from(soul.powers)
        };
    }

    update(deltaTime) {
        // Update all active souls
        this.souls.forEach(soul => {
            if (soul.connectedStoonie) {
                // Add experience based on stoonie actions
                if (soul.connectedStoonie.isPregnant) {
                    this.addExperience(soul, 0.1 * deltaTime); // XP for being pregnant
                }
                if (soul.connectedStoonie.lastMateTime > soul.connectedStoonie.age - 1) {
                    this.addExperience(soul, 10); // XP for mating
                }
            }
        });
    }
}

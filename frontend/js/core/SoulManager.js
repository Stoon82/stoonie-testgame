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

    connectSoulToStoonie(stoonie) {
        if (this.availableSouls.length === 0) {
            console.log('No souls available');
            return false;
        }

        const soul = this.availableSouls.shift();
        soul.connectToStoonie(stoonie);
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

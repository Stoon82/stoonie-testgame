export default class VicinityManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.interactionRange = 3; // Increased from 2 to 3
        this.combatRange = 4;      // Increased from 3 to 4
        this.lastUpdateTime = 0;
        this.updateInterval = 250;  // Decreased from 500 to 250ms for more frequent checks
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) return;
        console.log('Initializing VicinityManager');
        this.initialized = true;
    }

    update(deltaTime) {
        if (!this.initialized) return;

        const currentTime = this.gameEngine.age;
        if (currentTime - this.lastUpdateTime < this.updateInterval / 1000) {
            return;
        }
        this.lastUpdateTime = currentTime;

        const entities = this.gameEngine.entityManager.getEntities();
        this.checkAllInteractions(entities);
    }

    checkAllInteractions(entities) {
        const stoonies = entities.filter(e => e.constructor.name === 'Stoonie');

        // Check Stoonie-Stoonie interactions for reproduction only
        for (let i = 0; i < stoonies.length; i++) {
            const stoonie1 = stoonies[i];
            
            // Skip if dead
            if (stoonie1.isDead()) continue;

            // Check for reproduction with other Stoonies
            for (let j = i + 1; j < stoonies.length; j++) {
                const stoonie2 = stoonies[j];
                if (stoonie2.isDead()) continue;
                
                const distance = stoonie1.position.distanceTo(stoonie2.position);
                if (distance <= this.interactionRange) {
                    this.handleStoonieInteraction(stoonie1, stoonie2);
                }
            }
        }
    }

    handleStoonieInteraction(stoonie1, stoonie2) {
        // Skip if either Stoonie is already pregnant
        if (stoonie1.isPregnant || stoonie2.isPregnant) {
            return;
        }

        // Check if they can reproduce
        if (stoonie1.gender !== stoonie2.gender && 
            stoonie1.age > 20 && stoonie2.age > 20 && 
            stoonie1.health > 50 && stoonie2.health > 50) {
            
            // Increased chance of reproduction to 20%
            if (Math.random() < 0.2) {
                // Choose the female Stoonie to become pregnant
                const femaleStoonie = stoonie1.gender === 'female' ? stoonie1 : stoonie2;
                console.log(`Stoonies #${stoonie1.id} (${stoonie1.gender}) and #${stoonie2.id} (${stoonie2.gender}) are reproducing!`);
                this.gameEngine.needsManager.startPregnancy(femaleStoonie.id);
            }
        }
    }
}

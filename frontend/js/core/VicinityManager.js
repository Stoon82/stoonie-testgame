export default class VicinityManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.interactionRange = 2; // Range for Stoonie interactions
        this.combatRange = 3;      // Range for combat interactions
        this.lastUpdateTime = 0;
        this.updateInterval = 500;  // Update every 500ms to avoid too frequent checks
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
        const demons = entities.filter(e => e.constructor.name === 'DemonStoonie');

        // Check Stoonie-Stoonie interactions
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

            // Check for demon encounters
            for (const demon of demons) {
                if (demon.isDead()) continue;
                
                const distance = stoonie1.position.distanceTo(demon.position);
                if (distance <= this.combatRange) {
                    this.handleDemonInteraction(stoonie1, demon);
                }
            }
        }
    }

    handleStoonieInteraction(stoonie1, stoonie2) {
        // Skip if either Stoonie is already pregnant
        if (stoonie1.isPregnant || stoonie2.isPregnant) return;

        // Check if they can reproduce
        if (stoonie1.gender !== stoonie2.gender && 
            stoonie1.age > 20 && stoonie2.age > 20 && 
            stoonie1.health > 50 && stoonie2.health > 50) {
            
            // Randomly decide if reproduction occurs
            if (Math.random() < 0.1) { // 10% chance per interaction
                // Choose the female Stoonie to become pregnant
                const femaleStoonie = stoonie1.gender === 'female' ? stoonie1 : stoonie2;
                console.log(`Stoonies #${stoonie1.id} and #${stoonie2.id} are reproducing!`);
                this.gameEngine.needsManager.startPregnancy(femaleStoonie.id);
            }
        }
    }

    handleDemonInteraction(stoonie, demon) {
        // Skip if either entity is already engaged in combat
        if (stoonie.inCombat || demon.inCombat) return;

        console.log(`Combat between Stoonie #${stoonie.id} and Demon #${demon.id}!`);

        // Demon attacks Stoonie
        const damage = Math.random() * 20 + 10; // Random damage between 10-30
        stoonie.damage(damage);

        // If Stoonie has a soul, it can fight back
        if (stoonie.soul) {
            const soulPower = stoonie.soul.level * 5;
            const counterDamage = Math.random() * soulPower + soulPower/2;
            demon.damage(counterDamage);
            console.log(`Stoonie #${stoonie.id}'s soul dealt ${counterDamage} damage to Demon #${demon.id}!`);
        }

        // Mark both as in combat briefly
        stoonie.inCombat = true;
        demon.inCombat = true;
        setTimeout(() => {
            stoonie.inCombat = false;
            demon.inCombat = false;
        }, 2000); // Combat cooldown of 2 seconds
    }
}

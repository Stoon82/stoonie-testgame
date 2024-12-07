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
        if (stoonie1.isPregnant || stoonie2.isPregnant) {
            console.log(`Skipping reproduction - one of the Stoonies is already pregnant (${stoonie1.id}, ${stoonie2.id})`);
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
            } else {
                console.log(`Reproduction check failed for Stoonies #${stoonie1.id} and #${stoonie2.id} - random chance`);
            }
        } else {
            console.log(`Reproduction requirements not met for Stoonies #${stoonie1.id} and #${stoonie2.id}`);
            console.log(`Gender: ${stoonie1.gender}/${stoonie2.gender}, Age: ${stoonie1.age}/${stoonie2.age}, Health: ${stoonie1.health}/${stoonie2.health}`);
        }
    }

    handleDemonInteraction(stoonie, demon) {
        // Skip if either entity is already engaged in combat
        if (stoonie.inCombat || demon.inCombat) {
            console.log(`Skipping combat - entities already in combat (Stoonie #${stoonie.id}, Demon #${demon.id})`);
            return;
        }

        console.log(`Combat initiated between Stoonie #${stoonie.id} and Demon #${demon.id}!`);

        // Demon attacks Stoonie
        const damage = Math.random() * 30 + 15; // Increased damage range to 15-45
        console.log(`Demon #${demon.id} deals ${damage.toFixed(1)} damage to Stoonie #${stoonie.id}`);
        stoonie.damage(damage);

        // If Stoonie has a soul, it can fight back
        if (stoonie.soul) {
            const soulPower = stoonie.soul.level * 7; // Increased soul power multiplier
            const counterDamage = Math.random() * soulPower + soulPower/2;
            console.log(`Stoonie #${stoonie.id}'s soul (level ${stoonie.soul.level}) deals ${counterDamage.toFixed(1)} damage to Demon #${demon.id}!`);
            demon.damage(counterDamage);
        } else {
            console.log(`Stoonie #${stoonie.id} has no soul to fight back with!`);
        }

        // Mark both as in combat briefly
        stoonie.inCombat = true;
        demon.inCombat = true;
        setTimeout(() => {
            stoonie.inCombat = false;
            demon.inCombat = false;
            console.log(`Combat cooldown ended for Stoonie #${stoonie.id} and Demon #${demon.id}`);
        }, 2000); // Combat cooldown of 2 seconds
    }
}

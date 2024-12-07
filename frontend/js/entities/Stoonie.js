import * as THREE from 'three';
import BaseEntity from './BaseEntity.js';

export default class Stoonie extends BaseEntity {
    constructor(id, config = {}, gameEngine) {
        super(id, config, gameEngine);
        this.gameEngine = gameEngine;
        
        this.gender = config.gender || (Math.random() > 0.5 ? 'male' : 'female');
        this.isPregnant = false;
        this.pregnancyTime = 0;
        this.pregnancyDuration = 10; // seconds
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.wanderRadius = 2;
        this.maxSpeed = 2;
        this.lastMateTime = 0;
        this.matingCooldown = 5; // seconds
        this.soul = null;
        this.healingFactor = 1.0;
        this.shield = 0;
        this.damageNumbers = []; // Array to store damage number objects
        
        // Combat properties
        this.attackDamage = 5;
        this.attackCooldown = 1.5;
        this.lastAttackTime = 0;
        this.fleeDistance = 10;
        this.nearbyDemons = [];
        this.behaviorState = 'wander'; // wander, flee, fight
        
        // Job-related properties
        this.currentJob = null;
        this.moveTarget = null;

        this.createModel();
        this.createMesh();

        // Initialize needs
        if (this.gameEngine.needsManager) {
            this.gameEngine.needsManager.initializeNeeds(this.id);
        }
    }

    update(deltaTime) {
        super.update(deltaTime);

        // Update needs
        if (this.gameEngine.needsManager) {
            const needs = this.gameEngine.needsManager.update(this.id, deltaTime);
            this.updateVisualState(needs);
        }

        // Apply healing if has healing power
        if (this.healingFactor > 1.0) {
            this.health = Math.min(100, this.health + (deltaTime * (this.healingFactor - 1) * 10));
        }

        // Update pregnancy
        if (this.isPregnant) {
            this.pregnancyTime += deltaTime;
            if (this.pregnancyTime >= this.pregnancyDuration) {
                this.giveBirth();
            }
            this.updatePregnancyVisual();
        }

        // Execute behavior based on state
        switch (this.behaviorState) {
            case 'wander':
                this.wander(deltaTime);
                break;
            case 'flee':
                this.flee(deltaTime);
                break;
            case 'fight':
                this.fight(deltaTime);
                break;
            case 'working':
                // Job updates are handled by JobManager
                if (this.moveTarget) {
                    this.moveTowards(this.moveTarget);
                }
                break;
        }

        // Update visual indicators
        this.updateDamageNumbers(deltaTime);
        this.updateSoulIndicator();
        this.updatePregnancyVisual();
    }

    updateBehavior(deltaTime) {
        // Update nearby demons list
        this.updateNearbyDemons();

        if (this.nearbyDemons.length === 0) {
            this.behaviorState = 'wander';
            this.wander(deltaTime);
            return;
        }

        // Decide behavior based on health and powers
        if (this.health < 30 || (this.isPregnant && this.health < 50)) {
            if (this.behaviorState !== 'flee') {
                console.log(`Stoonie ${this.id} is fleeing! Health: ${this.health.toFixed(1)}${this.isPregnant ? ' (Pregnant)' : ''}`);
            }
            this.behaviorState = 'flee';
            this.flee(deltaTime);
        } else if (this.soul && (this.soul.powers.has('energyBlast') || this.soul.powers.has('shieldBubble'))) {
            if (this.behaviorState !== 'fight') {
                console.log(`Stoonie ${this.id} is fighting back with soul powers!`);
            }
            this.behaviorState = 'fight';
            this.fight(deltaTime);
        } else {
            this.behaviorState = 'flee';
            this.flee(deltaTime);
        }
    }

    updateNearbyDemons() {
        this.nearbyDemons = [];
        const entities = this.gameEngine.entityManager.getEntities();
        
        for (const entity of entities) {
            if (entity.constructor.name === 'DemonStoonie') {
                const distance = this.position.distanceTo(entity.position);
                if (distance < this.fleeDistance) {
                    this.nearbyDemons.push({ demon: entity, distance: distance });
                }
            }
        }
        
        // Sort by distance
        this.nearbyDemons.sort((a, b) => a.distance - b.distance);
    }

    flee(deltaTime) {
        if (this.nearbyDemons.length === 0) return;

        // Calculate average direction to flee from all nearby demons
        const fleeDirection = new THREE.Vector3();
        this.nearbyDemons.forEach(({ demon }) => {
            const awayFromDemon = new THREE.Vector3().subVectors(this.position, demon.position).normalize();
            fleeDirection.add(awayFromDemon);
        });
        fleeDirection.normalize();

        // Apply fleeing force
        const fleeSpeed = this.maxSpeed * (this.soul && this.soul.powers.has('speedBoost') ? 1.5 : 1);
        const force = fleeDirection.multiplyScalar(fleeSpeed * deltaTime);
        this.applyForce(force);
    }

    fight(deltaTime) {
        if (this.nearbyDemons.length === 0) return;

        const nearestDemon = this.nearbyDemons[0].demon;
        const distance = this.nearbyDemons[0].distance;

        // Move to optimal fighting distance (just within attack range)
        const optimalDistance = 2;
        const towardsDemon = new THREE.Vector3().subVectors(nearestDemon.position, this.position).normalize();
        
        if (distance > optimalDistance) {
            const force = towardsDemon.multiplyScalar(this.maxSpeed * deltaTime);
            this.applyForce(force);
        } else if (distance < optimalDistance * 0.5) {
            const force = towardsDemon.multiplyScalar(-this.maxSpeed * deltaTime);
            this.applyForce(force);
        }

        // Attack if in range and off cooldown
        if (distance < 2 && this.age - this.lastAttackTime > this.attackCooldown) {
            this.attackDemon(nearestDemon);
        }
    }

    attackDemon(demon) {
        this.lastAttackTime = this.age;
        
        // Base damage
        let damage = this.attackDamage;
        
        // Bonus damage from soul powers
        if (this.soul && this.soul.powers.has('energyBlast')) {
            damage *= 2;
            
            // Visual effect for energy blast
            const blastGeometry = new THREE.SphereGeometry(0.3, 16, 16);
            const blastMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.7
            });
            const blast = new THREE.Mesh(blastGeometry, blastMaterial);
            blast.position.copy(this.position);
            this.gameEngine.scene.add(blast);
            
            // Animate blast
            const direction = new THREE.Vector3().subVectors(demon.position, this.position).normalize();
            const animate = () => {
                blast.position.add(direction.multiplyScalar(0.2));
                blast.scale.multiplyScalar(0.95);
                blast.material.opacity *= 0.95;
                
                if (blast.material.opacity > 0.1) {
                    requestAnimationFrame(animate);
                } else {
                    this.gameEngine.scene.remove(blast);
                    blast.geometry.dispose();
                    blast.material.dispose();
                }
            };
            animate();
        }
        
        demon.takeDamage(damage);
    }

    defendAgainstAttack(incomingDamage) {
        let finalDamage = incomingDamage;
        console.log(`Stoonie ${this.id} defending against ${incomingDamage} damage. Current health: ${this.health.toFixed(1)}`);

        // Apply shield if available
        if (this.shield > 0) {
            const shieldDamage = Math.min(this.shield, finalDamage);
            this.shield -= shieldDamage;
            finalDamage -= shieldDamage;
            console.log(`Shield absorbed ${shieldDamage} damage. Shield remaining: ${this.shield.toFixed(1)}`);
        }

        // Apply remaining damage
        if (finalDamage > 0) {
            this.takeDamage(finalDamage);
            console.log(`Stoonie ${this.id} took ${finalDamage} damage. Health remaining: ${this.health.toFixed(1)}`);
        }

        return finalDamage;
    }

    createModel() {
        // Create a sphere for the Stoonie
        const geometry = new THREE.SphereGeometry(0.5, 32, 32);
        const material = new THREE.MeshPhongMaterial({ 
            color: this.gender === 'male' ? 0xff0000 : 0x0000ff,  // Red for male, Blue for female
            shininess: 30
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.position.copy(this.position);
        this.mesh.entity = this; // Store reference to entity

        // Add pregnancy indicator if female
        if (this.gender === 'female') {
            this.pregnancyIndicator = new THREE.Group();
            
            // Main pregnancy sphere
            const pregnancySphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 16, 16),
                new THREE.MeshPhongMaterial({ 
                    color: 0xffff00, 
                    visible: false,
                    transparent: true,
                    opacity: 0.7
                })
            );
            
            // Progress ring
            this.pregnancyProgress = new THREE.Mesh(
                new THREE.TorusGeometry(0.3, 0.03, 16, 32),
                new THREE.MeshPhongMaterial({
                    color: 0x00ff00,
                    visible: false,
                    transparent: true,
                    opacity: 0.8
                })
            );
            this.pregnancyProgress.rotation.x = Math.PI / 2;
            
            this.pregnancyIndicator.add(pregnancySphere);
            this.pregnancyIndicator.add(this.pregnancyProgress);
            this.pregnancyIndicator.position.y = 0.7;
            this.mesh.add(this.pregnancyIndicator);
        }

        // Add soul indicator
        this.soulIndicator = new THREE.Mesh(
            new THREE.TorusGeometry(0.7, 0.05, 16, 32),
            new THREE.MeshPhongMaterial({ color: 0xffffff, opacity: 0.5, transparent: true })
        );
        this.soulIndicator.rotation.x = Math.PI / 2;
        this.soulIndicator.visible = false;
        this.mesh.add(this.soulIndicator);

        // Add needs indicators
        this.needsIndicator = new THREE.Group();
        this.needsIndicator.position.y = -0.7;
        this.mesh.add(this.needsIndicator);
    }

    updateVisualState(needs) {
        if (!needs) return;

        // Update mesh color based on health
        const baseColor = this.gender === 'male' ? new THREE.Color(1, 0, 0) : new THREE.Color(0, 0, 1);
        const healthFactor = needs.health / 100;
        this.mesh.material.color.copy(baseColor).multiplyScalar(healthFactor);

        // Update needs indicators
        this.updateNeedsIndicators(needs);
    }

    updateNeedsIndicators(needs) {
        // Clear previous indicators
        while (this.needsIndicator.children.length) {
            this.needsIndicator.remove(this.needsIndicator.children[0]);
        }

        // Add warning indicators for critical needs
        if (needs.hunger < 20 || needs.thirst < 20 || needs.tiredness > 90) {
            const warningSign = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 8, 8),
                new THREE.MeshPhongMaterial({ color: 0xff0000 })
            );
            warningSign.position.y = -0.2;
            this.needsIndicator.add(warningSign);
        }
    }

    updatePregnancyVisual() {
        if (!this.pregnancyIndicator) {
            // Create pregnancy indicator (a small sphere above the Stoonie)
            const geometry = new THREE.SphereGeometry(0.2, 16, 16);
            const material = new THREE.MeshBasicMaterial({ color: 0xff69b4 });
            this.pregnancyIndicator = new THREE.Mesh(geometry, material);
            this.mesh.add(this.pregnancyIndicator);
            this.pregnancyIndicator.position.y = 1;
        }
        
        this.pregnancyIndicator.visible = this.isPregnant;
        if (this.isPregnant) {
            // Pulse the indicator
            const scale = 0.8 + 0.2 * Math.sin(this.age * 5);
            this.pregnancyIndicator.scale.set(scale, scale, scale);
        }
    }

    showDamageNumber(amount) {
        // Create sprite for damage number
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 64;
        context.font = 'bold 32px Arial';
        context.fillStyle = '#ff0000';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(Math.round(amount), 32, 32);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        
        // Position above the Stoonie
        sprite.position.copy(this.position);
        sprite.position.y += 1;
        
        // Add to damage numbers array with lifetime
        this.damageNumbers.push({
            sprite: sprite,
            lifetime: 1.0, // 1 second lifetime
            velocity: new THREE.Vector3(0, 2, 0) // Upward movement
        });
        
        // Add to scene
        this.gameEngine.scene.add(sprite);
    }

    updateDamageNumbers(deltaTime) {
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const damageNumber = this.damageNumbers[i];
            damageNumber.lifetime -= deltaTime;
            
            // Update position
            damageNumber.sprite.position.add(damageNumber.velocity.clone().multiplyScalar(deltaTime));
            
            // Update opacity
            damageNumber.sprite.material.opacity = Math.max(0, damageNumber.lifetime);
            
            // Remove if lifetime is over
            if (damageNumber.lifetime <= 0) {
                this.gameEngine.scene.remove(damageNumber.sprite);
                damageNumber.sprite.material.dispose();
                damageNumber.sprite.geometry.dispose();
                this.damageNumbers.splice(i, 1);
            }
        }
    }

    updateSoulIndicator() {
        if (this.soulIndicator) {
            this.soulIndicator.visible = this.soul !== null;
            if (this.soul) {
                // Change color based on soul level
                const hue = (this.soul.level - 1) / 10; // 0 to 1 based on level (max level 10)
                this.soulIndicator.material.color.setHSL(hue, 1, 0.5);
            }
        }
    }

    wander(deltaTime) {
        // Update wander angle with smoother randomness
        this.wanderAngle += (Math.random() - 0.5) * Math.PI * deltaTime;

        // Calculate movement direction
        const direction = new THREE.Vector3(
            Math.cos(this.wanderAngle),
            0,
            Math.sin(this.wanderAngle)
        ).normalize();

        // Apply force in that direction
        const wanderForce = direction.multiplyScalar(this.maxSpeed);
        this.applyForce(wanderForce);

        // Keep within bounds
        const bounds = 40;
        if (Math.abs(this.position.x) > bounds || Math.abs(this.position.z) > bounds) {
            // Calculate direction to center
            const toCenter = new THREE.Vector3().sub(this.position).normalize();
            const boundsForce = toCenter.multiplyScalar(this.maxSpeed * 2);
            this.applyForce(boundsForce);
        }
    }

    mate(otherStoonie) {
        if (this.gender === otherStoonie.gender) return false;
        if (this.energy < 50 || otherStoonie.energy < 50) return false;
        if (this.age - this.lastMateTime < this.matingCooldown) return false;
        
        const female = this.gender === 'female' ? this : otherStoonie;
        if (female.isPregnant) return false;

        // Successful mating
        this.energy -= 30;
        otherStoonie.energy -= 30;
        this.lastMateTime = this.age;
        otherStoonie.lastMateTime = otherStoonie.age;

        // Make female pregnant
        female.isPregnant = true;
        female.pregnancyTime = 0;
        if (female.pregnancyIndicator) {
            female.pregnancyIndicator.material.visible = true;
        }

        return true;
    }

    giveBirth() {
        console.log(`Stoonie ${this.id} is giving birth!`);
        this.isPregnant = false;
        this.pregnancyTime = 0;
        
        // Create new Stoonie
        const config = {
            position: new THREE.Vector3(
                this.position.x + (Math.random() - 0.5),
                this.position.y,
                this.position.z + (Math.random() - 0.5)
            ),
            gender: Math.random() > 0.5 ? 'male' : 'female'
        };
        
        const baby = this.gameEngine.entityManager.spawnEntity('Stoonie', config);
        if (baby) {
            console.log(`New baby Stoonie ${baby.id} born! Gender: ${config.gender}`);
            // Add the baby to the scene
            this.gameEngine.scene.add(baby.mesh);
        } else {
            console.error('Failed to create baby Stoonie');
        }
    }

    checkInteractions(entities) {
        for (const entity of entities) {
            if (entity === this) continue;

            const distance = this.position.distanceTo(entity.position);
            
            // Check for mating
            if (entity.constructor.name === 'Stoonie' && distance < 1.5) {
                this.mate(entity);
            }
        }
    }

    takeDamage(amount) {
        // Apply shield if available
        if (this.shield > 0) {
            const shieldDamage = Math.min(this.shield, amount);
            this.shield -= shieldDamage;
            amount -= shieldDamage;
        }

        // Show damage number
        if (amount > 0) {
            this.showDamageNumber(amount);
        }

        // Apply remaining damage to health
        if (amount > 0) {
            this.health = Math.max(0, this.health - amount);
            // Flash red when taking damage
            if (this.mesh) {
                this.mesh.material.emissive.setHex(0xff0000);
                setTimeout(() => {
                    this.mesh.material.emissive.setHex(0x000000);
                }, 100);
            }
        }

        if (this.isDead() && this.soul) {
            // Return soul to pool when dying
            this.gameEngine.soulManager.disconnectSoulFromStoonie(this);
        }
    }

    setJob(job) {
        this.currentJob = job;
        this.behaviorState = 'working';
        console.log(`Stoonie ${this.id} starting job: ${job.type}`);
    }

    clearJob() {
        this.currentJob = null;
        this.behaviorState = 'wander';
        this.moveTarget = null;
        console.log(`Stoonie ${this.id} finished job`);
    }

    moveTowards(target) {
        this.moveTarget = target;
        const direction = new THREE.Vector3()
            .subVectors(target, this.position)
            .normalize();
        
        const force = direction.multiplyScalar(this.maxSpeed);
        this.applyForce(force);
    }
}

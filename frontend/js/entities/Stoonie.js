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
        
        this.createModel();
        this.createMesh();
    }

    update(deltaTime) {
        super.update(deltaTime);

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
        }

        // Random movement
        this.wander(deltaTime);

        // Update soul indicator
        this.updateSoulIndicator();
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

        // Add pregnancy indicator if female
        if (this.gender === 'female') {
            this.pregnancyIndicator = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 16, 16),
                new THREE.MeshPhongMaterial({ color: 0xffff00, visible: false })
            );
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
        this.isPregnant = false;
        this.pregnancyTime = 0;
        if (this.pregnancyIndicator) {
            this.pregnancyIndicator.material.visible = false;
        }
        
        // Signal to EntityManager to create new Stoonie
        if (this.onBirth) {
            this.onBirth(this.position);
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
}

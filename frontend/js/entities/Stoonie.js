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

        // Update damage numbers
        this.updateDamageNumbers(deltaTime);

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
        if (!this.pregnancyIndicator || !this.pregnancyProgress) return;

        const progress = this.pregnancyTime / this.pregnancyDuration;
        this.pregnancyIndicator.children[0].material.visible = true;
        this.pregnancyProgress.material.visible = true;
        
        // Scale the progress ring based on pregnancy progress
        this.pregnancyProgress.scale.set(progress, progress, 1);
        
        // Pulse effect
        const pulseScale = 1 + Math.sin(Date.now() * 0.005) * 0.1;
        this.pregnancyIndicator.scale.set(pulseScale, pulseScale, pulseScale);
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
}

import * as THREE from 'three';
import BaseEntity from './BaseEntity.js';

export default class Stoonie extends BaseEntity {
    constructor(id, config = {}) {
        super(id, config);
        
        this.gender = config.gender || (Math.random() > 0.5 ? 'male' : 'female');
        this.isPregnant = false;
        this.pregnancyTime = 0;
        this.pregnancyDuration = 10; // seconds
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.wanderRadius = 2;
        this.maxSpeed = 2;
        this.lastMateTime = 0;
        this.matingCooldown = 5; // seconds
        
        this.createModel();
        this.createMesh();
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
    }

    update(deltaTime) {
        super.update(deltaTime);

        // Update pregnancy
        if (this.isPregnant) {
            this.pregnancyTime += deltaTime;
            if (this.pregnancyTime >= this.pregnancyDuration) {
                this.giveBirth();
            }
        }

        // Random movement
        this.wander(deltaTime);
    }

    wander(deltaTime) {
        // Update wander angle
        this.wanderAngle += (Math.random() - 0.5) * 2 * deltaTime;

        // Calculate movement direction
        const direction = new THREE.Vector3(
            Math.cos(this.wanderAngle),
            0,
            Math.sin(this.wanderAngle)
        );

        // Apply force in that direction
        const force = direction.multiplyScalar(this.maxSpeed * deltaTime);
        this.applyForce(force);

        // Keep within bounds
        const bounds = 40;
        if (Math.abs(this.position.x) > bounds || Math.abs(this.position.z) > bounds) {
            this.wanderAngle += Math.PI; // Turn around
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
        this.health -= amount;
        // Flash red when damaged
        if (this.mesh.material) {
            const originalColor = this.mesh.material.color.clone();
            this.mesh.material.color.setHex(0xff0000);
            setTimeout(() => {
                this.mesh.material.color.copy(originalColor);
            }, 100);
        }
    }
}

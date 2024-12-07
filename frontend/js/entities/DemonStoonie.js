import * as THREE from 'three';
import BaseEntity from './BaseEntity.js';

export default class DemonStoonie extends BaseEntity {
    constructor(id, config = {}, gameEngine) {
        super(id, config, gameEngine);
        this.gameEngine = gameEngine;
        
        this.damage = 20;  // Damage dealt to normal Stoonies
        this.maxSpeed = 6; // Much faster than normal Stoonies for aggressive hunting
        this.target = null;
        this.attackCooldown = 0.3; // Much faster attacks (3 times per second)
        this.lastAttackTime = 0;
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.detectionRange = 25; // Increased range to detect Stoonies
        this.attackRange = 8;    // Even larger attack range for area damage
        this.huntingSpeedMultiplier = 1.5; // Speed boost when chasing prey
        this.damagePerAttack = 15; // Base damage per attack
        
        this.createModel();
        this.createMesh();
    }

    createModel() {
        // Create a more menacing looking sphere for demon stoonies
        const geometry = new THREE.SphereGeometry(0.7, 32, 32);  // Slightly larger
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x800080,  // Purple color for demons
            emissive: 0x400040,  // Slight glow effect
            shininess: 50
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.position.copy(this.position);
        
        // Add spikes or horns
        this.addHorns();
    }

    addHorns() {
        const hornGeometry = new THREE.ConeGeometry(0.2, 0.5, 8);
        const hornMaterial = new THREE.MeshPhongMaterial({ color: 0x600060 });
        
        // Left horn
        const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        leftHorn.position.set(0.3, 0.5, 0);
        leftHorn.rotation.z = -Math.PI / 6;
        
        // Right horn
        const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        rightHorn.position.set(-0.3, 0.5, 0);
        rightHorn.rotation.z = Math.PI / 6;
        
        this.mesh.add(leftHorn, rightHorn);
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Always try to attack nearby Stoonies, even when wandering
        this.areaAttack(deltaTime);
        
        if (this.target && !this.target.isDead()) {
            this.chase(this.target, deltaTime);
        } else {
            this.wander(deltaTime);
        }
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
        const force = direction.multiplyScalar(this.maxSpeed * 0.5 * deltaTime);
        this.applyForce(force);

        // Keep within bounds
        const bounds = 40;
        if (Math.abs(this.position.x) > bounds || Math.abs(this.position.z) > bounds) {
            this.wanderAngle += Math.PI; // Turn around
        }
    }

    chase(target, deltaTime) {
        if (!target) return;

        const direction = new THREE.Vector3()
            .subVectors(target.position, this.position)
            .normalize();
        
        // Apply hunting speed multiplier when chasing
        const force = direction.multiplyScalar(this.maxSpeed * this.huntingSpeedMultiplier * deltaTime);
        this.applyForce(force);

        // Attack all Stoonies in range
        // this.areaAttack(); // Removed, now called in update()
    }

    areaAttack(deltaTime) {
        // Add deltaTime check to ensure proper timing
        if (this.age - this.lastAttackTime < this.attackCooldown) return;

        let attackedAny = false;
        let attackCount = 0;
        
        // Get entities through the EntityManager
        const entitiesMap = this.gameEngine.entityManager.entities;
        if (!entitiesMap) {
            console.warn(`Demon ${this.id}: No entities found for area attack`);
            return;
        }

        // Convert entities Map to array and filter Stoonies
        const stoonies = Array.from(entitiesMap.values())
            .filter(e => e.constructor.name === 'Stoonie' && !e.isDead());
        
        console.log(`Demon ${this.id}: Found ${stoonies.length} living Stoonies to check. My position:`, 
            this.position.x.toFixed(1), this.position.y.toFixed(1), this.position.z.toFixed(1));
        
        // Find all Stoonies within attack range
        for (const stoonie of stoonies) {
            const distance = this.position.distanceTo(stoonie.position);
            console.log(`Demon ${this.id}: Distance to Stoonie ${stoonie.id}: ${distance.toFixed(1)} units. Stoonie pos:`,
                stoonie.position.x.toFixed(1), stoonie.position.y.toFixed(1), stoonie.position.z.toFixed(1));
            
            if (distance <= this.attackRange) {
                // Calculate damage with slight random variation
                const actualDamage = this.damagePerAttack * (0.8 + Math.random() * 0.4);
                
                console.log(`Demon ${this.id}: Attacking Stoonie ${stoonie.id} at distance ${distance.toFixed(1)} with ${actualDamage.toFixed(1)} damage`);
                
                // Apply damage directly and create indicator
                stoonie.health -= actualDamage;
                stoonie.createDamageIndicator(actualDamage);
                
                console.log(`Demon ${this.id}: Stoonie ${stoonie.id} health now: ${stoonie.health.toFixed(1)}`);
                attackedAny = true;
                attackCount++;
            }
        }

        if (attackedAny) {
            console.log(`Demon ${this.id}: Area attack hit ${attackCount} Stoonies for ${this.damagePerAttack} base damage`);
            this.lastAttackTime = this.age;
            
            // Visual feedback for area attack - brighter red for more targets hit
            const intensity = Math.min(0xff0000 + (attackCount * 0x110000), 0xff0000);
            this.mesh.material.emissive.setHex(intensity);
            setTimeout(() => {
                this.mesh.material.emissive.setHex(0x400040);
            }, 200);
        } else {
            console.log(`Demon ${this.id}: No Stoonies in range ${this.attackRange}`);
        }
    }

    attack(stoonie) {
        // Single target attack is now deprecated in favor of area attack
        return this.areaAttack();
    }

    checkInteractions(entities) {
        let nearestStoonie = null;
        let nearestDistance = Infinity;

        // Prioritize healthy Stoonies over wounded ones
        let bestTargetScore = -Infinity;

        for (const entity of entities) {
            if (entity === this || entity.constructor.name !== 'Stoonie' || entity.isDead()) continue;

            const distance = this.position.distanceTo(entity.position);
            if (distance < this.detectionRange) {
                // Score based on distance and target's health
                // Prefer closer targets and healthier targets (more health to drain)
                const healthScore = entity.health / entity.maxHealth;
                const distanceScore = 1 - (distance / this.detectionRange);
                const targetScore = healthScore + distanceScore;

                if (targetScore > bestTargetScore) {
                    bestTargetScore = targetScore;
                    nearestDistance = distance;
                    nearestStoonie = entity;
                }
            }
        }

        // Update target if found a better one
        if (nearestStoonie && (!this.target || this.target.isDead() || 
            bestTargetScore > (this.target.health / this.target.maxHealth + 
            (1 - this.position.distanceTo(this.target.position) / this.detectionRange)))) {
            if (this.target !== nearestStoonie) {
                console.log(`Demon Stoonie ${this.id} found new target: Stoonie ${nearestStoonie.id} at distance ${nearestDistance.toFixed(1)}`);
            }
            this.target = nearestStoonie;
        }
    }
}

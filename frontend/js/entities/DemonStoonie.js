import * as THREE from 'three';
import BaseEntity from './BaseEntity.js';

export default class DemonStoonie extends BaseEntity {
    constructor(id, config = {}, gameEngine) {
        super(id, config, gameEngine);
        this.gameEngine = gameEngine;
        
        this.damage = 20;  // Damage dealt to normal Stoonies
        this.maxSpeed = 3; // Faster than normal Stoonies
        this.target = null;
        this.attackCooldown = 1; // seconds
        this.lastAttackTime = 0;
        this.wanderAngle = Math.random() * Math.PI * 2;
        
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
        const direction = new THREE.Vector3()
            .subVectors(target.position, this.position)
            .normalize();
        
        const force = direction.multiplyScalar(this.maxSpeed * deltaTime);
        this.applyForce(force);

        // Attack if close enough
        if (this.position.distanceTo(target.position) < 1.5) {
            this.attack(target);
        }
    }

    attack(stoonie) {
        if (this.age - this.lastAttackTime < this.attackCooldown) return false;
        
        stoonie.takeDamage(this.damage);
        this.lastAttackTime = this.age;

        // Visual feedback for attack
        this.mesh.material.emissive.setHex(0x800000);
        setTimeout(() => {
            this.mesh.material.emissive.setHex(0x400040);
        }, 100);

        return true;
    }

    checkInteractions(entities) {
        let nearestStoonie = null;
        let nearestDistance = Infinity;

        for (const entity of entities) {
            if (entity === this || entity.constructor.name !== 'Stoonie' || entity.isDead()) continue;

            const distance = this.position.distanceTo(entity.position);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestStoonie = entity;
            }
        }

        // Update target if found a closer Stoonie
        if (nearestStoonie && (!this.target || this.target.isDead() || 
            nearestDistance < this.position.distanceTo(this.target.position))) {
            this.target = nearestStoonie;
        }
    }
}

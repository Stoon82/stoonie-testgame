import * as THREE from 'three';

export default class BaseEntity {
    constructor(id, config = {}, gameEngine) {
        this.id = id;
        this.gameEngine = gameEngine;
        this.mesh = null;
        this._position = new THREE.Vector3();
        if (config.position) {
            this._position.copy(config.position);
        }
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        
        // Basic properties
        this.health = 100;
        this.energy = 100;
        this.age = 0;
    }

    get position() {
        return this._position;
    }

    set position(value) {
        if (value instanceof THREE.Vector3) {
            this._position.copy(value);
        } else {
            this._position.set(value.x || 0, value.y || 0, value.z || 0);
        }
        if (this.mesh) {
            this.mesh.position.copy(this._position);
        }
    }

    update(deltaTime) {
        // Update physics
        this.velocity.add(this.acceleration);
        this.velocity.clampLength(0, 5); // Limit max speed
        
        // Update position using the velocity
        const movement = this.velocity.clone().multiplyScalar(deltaTime);
        this._position.add(movement);
        
        if (this.mesh) {
            this.mesh.position.copy(this._position);
            this.mesh.rotation.copy(this.rotation);
        }
        
        // Apply friction
        this.velocity.multiplyScalar(0.95);
        
        // Reset acceleration
        this.acceleration.set(0, 0, 0);
        
        // Update properties
        this.energy = Math.max(0, this.energy - deltaTime * 0.1);
        this.age += deltaTime;
    }

    createMesh() {
        if (this.mesh) {
            // Store reference to the entity in the mesh for raycasting
            this.mesh.entity = this;
            // Also store in all child meshes
            this.mesh.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.entity = this;
                }
            });
        }
    }

    applyForce(force) {
        this.acceleration.add(force);
    }

    setPosition(x, y, z) {
        this._position.set(x, y, z);
        if (this.mesh) {
            this.mesh.position.copy(this._position);
        }
    }

    getMesh() {
        return this.mesh;
    }

    isDead() {
        return this.health <= 0 || this.energy <= 0;
    }
}

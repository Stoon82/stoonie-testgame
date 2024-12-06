import * as THREE from 'three';

export default class BaseEntity {
    constructor(id, config = {}) {
        this.id = id;
        this.position = config.position || new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        
        // Basic properties
        this.health = 100;
        this.energy = 100;
        this.age = 0;
        
        this.mesh = null;
    }

    update(deltaTime) {
        // Update physics
        this.velocity.add(this.acceleration.multiplyScalar(deltaTime));
        this.position.add(this.velocity.multiplyScalar(deltaTime));
        
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            this.mesh.rotation.copy(this.rotation);
        }
        
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
        this.position.set(x, y, z);
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
    }

    getMesh() {
        return this.mesh;
    }

    isDead() {
        return this.health <= 0 || this.energy <= 0;
    }
}

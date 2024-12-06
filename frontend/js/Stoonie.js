import * as THREE from 'three';

class Stoonie {
    constructor(position = new THREE.Vector3(0, 0, 0)) {
        this.position = position;
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        
        // Basic properties
        this.health = 100;
        this.energy = 100;
        this.age = 0;
        
        // Create the 3D model
        this.createModel();
    }

    createModel() {
        // Create a simple mesh for now - can be replaced with more complex model later
        const geometry = new THREE.BoxGeometry(1, 2, 1); // Basic humanoid proportion
        const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
    }

    update(deltaTime) {
        // Update physics
        this.velocity.add(this.acceleration.multiplyScalar(deltaTime));
        this.position.add(this.velocity.multiplyScalar(deltaTime));
        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(this.rotation);
        
        // Reset acceleration
        this.acceleration.set(0, 0, 0);
        
        // Update properties
        this.energy = Math.max(0, this.energy - deltaTime * 0.1); // Slowly consume energy
        this.age += deltaTime;
    }

    applyForce(force) {
        this.acceleration.add(force);
    }

    setPosition(x, y, z) {
        this.position.set(x, y, z);
        this.mesh.position.copy(this.position);
    }

    getMesh() {
        return this.mesh;
    }

    // Basic actions
    move(direction) {
        const force = direction.normalize().multiplyScalar(0.1);
        this.applyForce(force);
    }

    eat(food) {
        this.energy = Math.min(100, this.energy + food.energyValue);
    }

    isDead() {
        return this.health <= 0 || this.energy <= 0;
    }
}

export default Stoonie;

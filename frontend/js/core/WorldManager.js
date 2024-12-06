import * as THREE from 'three';
import Tree from '../environment/Tree.js';
import Building from '../environment/Building.js';

export class WorldManager {
    constructor(scene) {
        this.scene = scene;
        this.environmentObjects = new Map();
        this.lastObjectId = 0;
    }

    generateObjectId() {
        return ++this.lastObjectId;
    }

    initializeWorld() {
        // Create ground
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x3a8024,  // Green color for grass
            side: THREE.DoubleSide 
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Add some initial environment objects
        this.addRandomTrees(10);
        this.addMockBuildings(3);
    }

    addRandomTrees(count) {
        for (let i = 0; i < count; i++) {
            const position = new THREE.Vector3(
                Math.random() * 80 - 40,
                0,
                Math.random() * 80 - 40
            );
            this.addTree(position);
        }
    }

    addMockBuildings(count) {
        for (let i = 0; i < count; i++) {
            const position = new THREE.Vector3(
                Math.random() * 60 - 30,
                0,
                Math.random() * 60 - 30
            );
            this.addBuilding(position);
        }
    }

    addTree(position) {
        const id = this.generateObjectId();
        const tree = new Tree(id, { position });
        this.environmentObjects.set(id, tree);
        this.scene.add(tree.getMesh());
        return tree;
    }

    addBuilding(position) {
        const id = this.generateObjectId();
        const building = new Building(id, { position });
        this.environmentObjects.set(id, building);
        this.scene.add(building.getMesh());
        return building;
    }

    update(deltaTime) {
        // Update environment objects if needed
        this.environmentObjects.forEach(object => {
            if (object.update) {
                object.update(deltaTime);
            }
        });
    }
}

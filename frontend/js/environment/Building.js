import * as THREE from 'three';
import MapObject from '../core/MapObject.js';

export default class Building extends MapObject {
    constructor(gameEngine, { x = 0, z = 0, type = 'house' } = {}) {
        super(gameEngine, { x, y: 0, z, type });
        this.type = type;
        this.createModel();
    }

    createModel() {
        // Create a group to hold building parts
        this.mesh = new THREE.Group();
        this.mesh.entity = this; // Store reference to entity
        
        // Random building dimensions
        const width = 2 + Math.random() * 2;
        const height = 4 + Math.random() * 4;
        const depth = 2 + Math.random() * 2;
        
        // Main building structure
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const buildingMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x808080,
            flatShading: true
        });
        const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
        buildingMesh.position.y = height / 2;
        buildingMesh.castShadow = true;
        buildingMesh.receiveShadow = true;
        
        // Add roof
        const roofGeometry = new THREE.ConeGeometry(Math.max(width, depth) / 1.5, 1.5, 4);
        const roofMaterial = new THREE.MeshPhongMaterial({ color: 0x704030 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = height + 0.75;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        
        // Add windows
        this.addWindows(width, height, depth, buildingMesh);
        
        // Add all parts to the group
        this.mesh.add(buildingMesh, roof);
        
        // Position the entire building
        this.mesh.position.copy(this.position);
    }

    addWindows(width, height, depth, building) {
        const windowGeometry = new THREE.PlaneGeometry(0.5, 0.8);
        const windowMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x88ccff,
            emissive: 0x112244
        });
        
        // Add windows to each side
        const sides = [
            { rotation: [0, 0, 0], offset: [0, 0, depth/2] },
            { rotation: [0, Math.PI, 0], offset: [0, 0, -depth/2] },
            { rotation: [0, Math.PI/2, 0], offset: [width/2, 0, 0] },
            { rotation: [0, -Math.PI/2, 0], offset: [-width/2, 0, 0] }
        ];
        
        sides.forEach(side => {
            const windowsPerSide = Math.floor(Math.random() * 3) + 2;
            for (let i = 0; i < windowsPerSide; i++) {
                const window = new THREE.Mesh(windowGeometry, windowMaterial);
                window.rotation.set(...side.rotation);
                window.position.set(
                    side.offset[0],
                    1 + Math.random() * (height - 2),
                    side.offset[2]
                );
                building.add(window);
            }
        });
    }

    getMesh() {
        return this.mesh;
    }
}

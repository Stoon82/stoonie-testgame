import * as THREE from 'three';

export default class SelectionManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.selectedEntities = new Set();
        this.initialized = false;
        this.selectionRings = new Map(); // Map of entity ID to selection ring mesh
    }

    initialize() {
        if (this.initialized) return;
        console.log('Initializing SelectionManager');
        this.initialized = true;
    }

    update(deltaTime) {
        if (!this.initialized) return;

        // Check all entities and environment objects for selection state
        const allObjects = [
            ...this.gameEngine.entityManager.entities,
            ...this.gameEngine.worldManager.environmentObjects
        ];

        // First, ensure all selected objects have rings
        allObjects.forEach(object => {
            if (object.isSelected) {
                if (!this.selectionRings.has(object.id)) {
                    console.log(`Creating selection ring for object ${object.id}`);
                    this.createSelectionRing(object);
                }
            } else {
                if (this.selectionRings.has(object.id)) {
                    console.log(`Removing selection ring for object ${object.id}`);
                    this.removeSelectionRing(object.id);
                }
            }
        });

        // Update positions and rotations of existing rings
        for (const [objectId, ring] of this.selectionRings.entries()) {
            const object = allObjects.find(obj => obj.id === objectId);
            if (!object || !object.isSelected) {
                console.log(`Removing selection ring for object ${objectId} - no longer exists or not selected`);
                this.removeSelectionRing(objectId);
                continue;
            }

            const mesh = object.getMesh();
            if (ring && mesh) {
                if (ring.parent !== mesh) {
                    mesh.add(ring);
                    ring.position.set(0, 0.1, 0);
                }
                ring.rotation.y += deltaTime;
            }
        }
    }

    toggleSelection(object, multiSelect = false) {
        if (!object) return;

        // When not multi-selecting, clear all other selections first
        if (!multiSelect) {
            this.clearSelection();
        }

        // Toggle the clicked object's selection state
        object.isSelected = !object.isSelected;
        
        if (object.isSelected) {
            this.selectedEntities.add(object);
            this.createSelectionRing(object);
        } else {
            this.selectedEntities.delete(object);
            this.removeSelectionRing(object.id);
        }

        // Update the details panel
        if (this.gameEngine.uiManager.detailsPanel) {
            this.gameEngine.uiManager.detailsPanel.switchTab('selected');
        }
    }

    addToSelection(entity) {
        if (!entity) return;
        // Add to selection set
        this.selectedEntities.add(entity);
        // Create selection ring
        this.createSelectionRing(entity);
    }

    removeFromSelection(entity) {
        //if (!entity) return;
        // Remove from selection set
        this.selectedEntities.delete(entity);
        // Remove selection ring
        this.removeSelectionRing(entity.id);
    }

    clearSelection() {
        // Clear all selection states and rings
        this.selectedEntities.forEach(object => {
            console.log(`Clearing selection for object ${object.id}`);
            object.isSelected = false;
            this.removeSelectionRing(object.id);
        });
        this.selectedEntities.clear();
    }

    removeSelectionRing(objectId) {
        const ring = this.selectionRings.get(objectId);
        if (ring) {
            console.log(`Removing ring for object ${objectId}`);
            if (ring.parent) {
                ring.parent.remove(ring);
            }
            if (ring.geometry) ring.geometry.dispose();
            if (ring.material) ring.material.dispose();
            this.selectionRings.delete(objectId);
        }
    }

    createSelectionRing(object) {
        if (!object || !object.getMesh()) {
            console.warn('Cannot create selection ring: object or mesh is undefined');
            return null;
        }

        const mesh = object.getMesh();
        let radius = 1; // Default radius
        let radiusMultiplier = 1.2; // Default size multiplier
        let height = 0.1; // Default height above ground

        // Calculate the bounding sphere for the entire group
        if (mesh instanceof THREE.Group) {
            const box = new THREE.Box3().setFromObject(mesh);
            const size = box.getSize(new THREE.Vector3());
            radius = Math.max(size.x, size.z) / 2;
        } else if (mesh.geometry) {
            mesh.geometry.computeBoundingSphere();
            radius = mesh.geometry.boundingSphere?.radius || radius;
        }

        // Adjust size based on object type
        if (object.constructor.name === 'Building') {
            radiusMultiplier = 1.75; // 75% larger for buildings (was 3.5)
            height = 0.2; // Slightly higher for better visibility
        } else if (object.constructor.name === 'Tree') {
            radiusMultiplier = 1.5; // 50% larger for trees
        }

        console.log(`Creating selection ring for ${object.constructor.name} with radius ${radius} and multiplier ${radiusMultiplier}`);

        // Create the selection ring
        const geometry = new THREE.TorusGeometry(
            radius * radiusMultiplier,
            0.1,
            8,
            32
        );

        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.6
        });

        const ring = new THREE.Mesh(geometry, material);
        ring.rotation.x = Math.PI / 2; // Lay flat
        ring.position.set(0, height, 0); // Slightly above the ground
        
        mesh.add(ring);
        this.selectionRings.set(object.id, ring);
        
        return ring;
    }

    getSelectedEntities() {
        return Array.from(this.selectedEntities);
    }

    hasSelection() {
        return this.selectedEntities.size > 0;
    }

    isSelected(object) {
        return this.selectedEntities.has(object);
    }

    getSelection() {
        return this.getSelectedEntities();
    }
}

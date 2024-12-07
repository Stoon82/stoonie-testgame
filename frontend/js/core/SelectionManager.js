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

        if (mesh.geometry) {
            if (!mesh.geometry.boundingSphere) {
                mesh.geometry.computeBoundingSphere();
            }
            radius = mesh.geometry.boundingSphere?.radius || radius;

            // Adjust size based on entity type
            if (object.constructor.name === 'Building') {
                radiusMultiplier = 1.5; // 50% larger for buildings
            }
        }

        const geometry = new THREE.RingGeometry(
            radius * radiusMultiplier,      // inner radius
            radius * (radiusMultiplier + 0.1), // outer radius
            32  // segments
        );
        
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
        
        const ring = new THREE.Mesh(geometry, material);
        ring.rotation.x = -Math.PI / 2; // Lay flat
        ring.position.set(0, 0.1, 0); // Slightly above the mesh
        
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

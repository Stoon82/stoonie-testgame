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

        // Update selection ring positions
        this.selectedEntities.forEach(entity => {
            const ring = this.selectionRings.get(entity.id);
            if (ring && entity.position) {
                ring.position.copy(entity.position);
                ring.position.y = 0.1; // Slightly above ground to avoid z-fighting
                ring.rotation.y += deltaTime; // Rotate the ring for visual effect
            }
        });

        // Remove selection rings for entities that no longer exist
        for (const [entityId, ring] of this.selectionRings) {
            if (!this.selectedEntities.has(this.gameEngine.entityManager.getEntityById(entityId))) {
                this.removeSelectionRing(entityId);
            }
        }
    }

    toggleSelection(entity, multiSelect = false) {
        if (!entity) return;

        if (!multiSelect) {
            // Clear previous selection if not multi-selecting
            this.clearSelection();
        }

        if (this.selectedEntities.has(entity)) {
            this.removeFromSelection(entity);
        } else {
            this.addToSelection(entity);
        }

        // Update the details panel
        if (this.gameEngine.uiManager.detailsPanel) {
            this.gameEngine.uiManager.detailsPanel.switchTab('selected');
        }
    }

    addToSelection(entity) {
        if (!entity) return;
        this.selectedEntities.add(entity);
        this.createSelectionRing(entity);
    }

    removeFromSelection(entity) {
        if (!entity) return;
        this.selectedEntities.delete(entity);
        this.removeSelectionRing(entity.id);
    }

    clearSelection() {
        this.selectedEntities.forEach(entity => {
            this.removeSelectionRing(entity.id);
        });
        this.selectedEntities.clear();
    }

    createSelectionRing(entity) {
        const radius = entity.getMesh().geometry.boundingSphere?.radius || 1;
        const geometry = new THREE.RingGeometry(radius * 1.2, radius * 1.3, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
        
        const ring = new THREE.Mesh(geometry, material);
        ring.rotation.x = -Math.PI / 2; // Lay flat
        ring.position.copy(entity.position);
        ring.position.y += 0.1; // Slightly above ground to prevent z-fighting
        
        this.gameEngine.scene.add(ring);
        this.selectionRings.set(entity.id, ring);
        
        return ring;
    }

    removeSelectionRing(entityId) {
        const ring = this.selectionRings.get(entityId);
        if (ring) {
            this.gameEngine.scene.remove(ring);
            ring.geometry.dispose();
            ring.material.dispose();
            this.selectionRings.delete(entityId);
        }
    }

    getSelectedEntities() {
        return Array.from(this.selectedEntities);
    }

    hasSelection() {
        return this.selectedEntities.size > 0;
    }

    isSelected(entity) {
        return this.selectedEntities.has(entity);
    }
}

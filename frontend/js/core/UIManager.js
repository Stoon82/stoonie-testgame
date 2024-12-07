import * as THREE from 'three';
import UIOverlay from '../ui/UIOverlay.js';
import DetailsPanel from '../ui/details_panel.js';
import StatsOverlay from '../ui/stats_overlay.js';

export default class UIManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.canvas = null;
        this.draggedSoul = null;
        this.mousePosition = { x: 0, y: 0 };
        this.panels = {};
        this.initialized = false;
        this.overlay = null;
        this.detailsPanel = null;
        this.statsOverlay = null;
    }

    initialize() {
        if (this.initialized) return;
        console.log('Initializing UIManager');

        if (!this.gameEngine.renderer) {
            throw new Error('Renderer must be initialized before UIManager');
        }
        
        this.canvas = this.gameEngine.renderer.domElement;
        this.overlay = new UIOverlay(this.gameEngine);
        this.detailsPanel = new DetailsPanel(this.gameEngine);
        this.statsOverlay = new StatsOverlay(this.gameEngine);
        this.initializePanels();
        this.setupEventListeners();
        
        this.initialized = true;
    }

    initializePanels() {
        // Initialize selection panel
        this.panels.selection = document.getElementById('selection-panel');
        if (!this.panels.selection) {
            this.panels.selection = document.createElement('div');
            this.panels.selection.id = 'selection-panel';
            document.body.appendChild(this.panels.selection);
        }
        this.panels.selection.style.position = 'absolute';
        this.panels.selection.style.left = '10px';
        this.panels.selection.style.top = '10px';
        this.panels.selection.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.panels.selection.style.padding = '10px';
        this.panels.selection.style.borderRadius = '5px';
        this.panels.selection.style.color = 'white';
        this.panels.selection.style.display = 'none';

        // Initialize stats panel
        this.panels.stats = document.getElementById('stats-panel');
        if (!this.panels.stats) {
            this.panels.stats = document.createElement('div');
            this.panels.stats.id = 'stats-panel';
            document.body.appendChild(this.panels.stats);
        }
        this.panels.stats.style.position = 'absolute';
        this.panels.stats.style.right = '10px';
        this.panels.stats.style.top = '10px';
        this.panels.stats.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.panels.stats.style.padding = '10px';
        this.panels.stats.style.borderRadius = '5px';
        this.panels.stats.style.color = 'white';

        // Initialize souls panel
        this.panels.souls = document.getElementById('souls-panel');
        if (!this.panels.souls) {
            this.panels.souls = document.createElement('div');
            this.panels.souls.id = 'souls-panel';
            document.body.appendChild(this.panels.souls);
        }
        this.panels.souls.style.position = 'absolute';
        this.panels.souls.style.left = '10px';
        this.panels.souls.style.bottom = '10px';
        this.panels.souls.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.panels.souls.style.padding = '10px';
        this.panels.souls.style.borderRadius = '5px';
        this.panels.souls.style.color = 'white';

        // Initialize the details panel
        this.detailsPanel.initialize();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    }

    onMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Check if we're clicking on a soul in the souls panel
        if (event.target.classList.contains('soul-item')) {
            this.draggedSoul = this.gameEngine.soulManager.souls.get(event.target.dataset.soulId);
            if (this.draggedSoul) {
                this.mousePosition = { x, y };
                event.target.style.opacity = '0.5';
            }
        }
    }

    onMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePosition.x = event.clientX - rect.left;
        this.mousePosition.y = event.clientY - rect.top;

        if (this.draggedSoul) {
            // Update visual feedback for dragging
            const dragVisual = document.getElementById('drag-visual');
            if (dragVisual) {
                dragVisual.style.left = `${event.clientX}px`;
                dragVisual.style.top = `${event.clientY}px`;
            }
        }
    }

    onMouseUp(event) {
        if (!this.draggedSoul) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Convert screen coordinates to world coordinates
        const worldPosition = this.screenToWorld(x, y);
        
        // Find the closest stoonie to the drop position
        const closestStoonie = this.findClosestStoonie(worldPosition);
        
        if (closestStoonie && this.isInRange(closestStoonie.position, worldPosition, 2)) {
            // Attempt to connect the soul to the stoonie
            this.gameEngine.soulManager.connectSoulToStoonie(this.draggedSoul, closestStoonie);
        }

        // Reset drag state
        const draggedElement = document.querySelector('.soul-item[data-soul-id="' + this.draggedSoul.id + '"]');
        if (draggedElement) {
            draggedElement.style.opacity = '1';
        }
        
        this.draggedSoul = null;
        this.updateSoulsPanel();
    }

    screenToWorld(screenX, screenY) {
        const vector = new THREE.Vector3(
            (screenX / this.canvas.width) * 2 - 1,
            -(screenY / this.canvas.height) * 2 + 1,
            0.5
        );
        vector.unproject(this.gameEngine.camera);
        return vector;
    }

    findClosestStoonie(position) {
        let closestStoonie = null;
        let closestDistance = Infinity;

        this.gameEngine.entityManager.entities.forEach(entity => {
            if (entity.constructor.name === 'Stoonie' && !entity.soul) {
                const distance = position.distanceTo(entity.position);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestStoonie = entity;
                }
            }
        });

        return closestStoonie;
    }

    isInRange(position1, position2, maxDistance) {
        return position1.distanceTo(position2) <= maxDistance;
    }

    updateSoulsPanel() {
        if (!this.panels.souls) return;

        const availableSouls = Array.from(this.gameEngine.soulManager.availableSouls);
        
        this.panels.souls.innerHTML = '<h3>Available Souls</h3>';
        if (availableSouls.length === 0) {
            this.panels.souls.innerHTML += '<p>No souls available</p>';
            return;
        }

        const soulsList = document.createElement('div');
        soulsList.className = 'souls-list';
        
        availableSouls.forEach(soul => {
            const soulItem = document.createElement('div');
            soulItem.className = 'soul-item';
            soulItem.dataset.soulId = soul.id;
            soulItem.innerHTML = `
                <span class="soul-name">${soul.name}</span>
                <span class="soul-level">Level ${soul.level}</span>
            `;
            soulItem.style.cursor = 'grab';
            soulItem.style.padding = '5px';
            soulItem.style.margin = '5px';
            soulItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            soulItem.style.borderRadius = '3px';
            
            soulsList.appendChild(soulItem);
        });

        this.panels.souls.appendChild(soulsList);
    }

    update() {
        if (!this.initialized) return;
        
        this.updateSoulsPanel();
        this.detailsPanel.update();
        this.statsOverlay.update();
        
        // Update selection panel if needed
        if (this.gameEngine.selectedEntity) {
            this.updateSelectionPanel(this.gameEngine.selectedEntity);
        }
    }

    updateSelectionPanel(entity) {
        if (!this.panels.selection) return;

        if (entity.constructor.name === 'Stoonie') {
            this.panels.selection.style.display = 'block';
            this.panels.selection.innerHTML = `
                <h3>Selected Stoonie</h3>
                <p>Age: ${Math.floor(entity.age)}</p>
                <p>Health: ${Math.floor(entity.health)}</p>
                ${entity.soul ? `
                    <p>Soul: ${entity.soul.name}</p>
                    <p>Soul Level: ${entity.soul.level}</p>
                    <p>Experience: ${Math.floor(entity.soul.experience)}</p>
                ` : '<p>No soul attached</p>'}
            `;
        } else {
            this.panels.selection.style.display = 'none';
        }
    }
}

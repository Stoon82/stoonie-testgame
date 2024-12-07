import * as THREE from 'three';
import UIOverlay from '../ui/UIOverlay.js';
import DetailsPanel from '../ui/details_panel.js';
import StatsOverlay from '../ui/stats_overlay.js';

export default class UIManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.initialized = false;
        this.canvas = null;
        this.overlay = null;
        this.detailsPanel = null;
        this.statsOverlay = null;
        this.hoveredEntity = null;
        this.panels = {};
        this.draggedSoul = null;
        this.mousePosition = { x: 0, y: 0 };
    }

    initialize() {
        if (this.initialized) return;
        console.log('Initializing UIManager');

        // Create canvas for WebGL rendering
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        document.body.appendChild(this.canvas);

        // Create UI overlay container
        this.overlay = document.createElement('div');
        this.overlay.id = 'ui-overlay';
        this.overlay.style.position = 'absolute';
        this.overlay.style.top = '0';
        this.overlay.style.left = '0';
        this.overlay.style.width = '100%';
        this.overlay.style.height = '100%';
        document.body.appendChild(this.overlay);

        // Initialize UI panels
        this.initializePanels();

        // Initialize stats overlay
        this.statsOverlay = new StatsOverlay(this.overlay, this.gameEngine);

        // Initialize details panel
        this.detailsPanel = new DetailsPanel(this.overlay);

        // Handle window resize
        window.addEventListener('resize', this.resizeCanvas.bind(this));
        this.resizeCanvas();

        // Set up UI-specific event listeners
        this.setupEventListeners();

        this.initialized = true;
    }

    initializePanels() {
        // Initialize selection panel
        this.panels.selection = document.createElement('div');
        this.panels.selection.id = 'selection-panel';
        Object.assign(this.panels.selection.style, {
            position: 'absolute',
            left: '10px',
            top: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: '10px',
            borderRadius: '5px',
            color: 'white',
            display: 'none',
            pointerEvents: 'auto',
            zIndex: '100'
        });
        this.overlay.appendChild(this.panels.selection);

        // Initialize souls panel
        this.panels.souls = document.createElement('div');
        this.panels.souls.id = 'souls-panel';
        Object.assign(this.panels.souls.style, {
            position: 'absolute',
            left: '10px',
            bottom: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: '10px',
            borderRadius: '5px',
            color: 'white',
            pointerEvents: 'auto',
            zIndex: '100'
        });
        this.overlay.appendChild(this.panels.souls);
        this.updateSoulsPanel();
    }

    setupEventListeners() {
        // Soul dragging events
        this.panels.souls.addEventListener('mousedown', (event) => {
            const soulItem = event.target.closest('.soul-item');
            if (soulItem) {
                const soulId = soulItem.dataset.soulId;
                this.draggedSoul = this.gameEngine.soulManager.souls.get(soulId);
                if (this.draggedSoul) {
                    soulItem.style.opacity = '0.5';
                    this.createDragVisual(event);
                }
            }
        });

        document.addEventListener('mousemove', (event) => {
            // Update mouse position for UI interactions
            this.mousePosition = { x: event.clientX, y: event.clientY };
            
            // Update drag visual if dragging a soul
            if (this.draggedSoul) {
                const dragVisual = document.getElementById('drag-visual');
                if (dragVisual) {
                    dragVisual.style.left = `${event.clientX}px`;
                    dragVisual.style.top = `${event.clientY}px`;
                }
                
                // Check for Stoonie under mouse
                const mouse = new THREE.Vector2(
                    (event.clientX / window.innerWidth) * 2 - 1,
                    -(event.clientY / window.innerHeight) * 2 + 1
                );

                this.gameEngine.raycaster.setFromCamera(mouse, this.gameEngine.camera);
                const intersects = this.gameEngine.raycaster.intersectObjects(this.gameEngine.scene.children, true);

                let foundStoonie = false;
                for (const intersect of intersects) {
                    const entity = this.gameEngine.entityManager.getEntityByMesh(intersect.object);
                    if (entity && entity.constructor.name === 'Stoonie') {
                        entity.mesh.material.emissive.setHex(0x444444);
                        foundStoonie = true;
                        break;
                    }
                }

                if (!foundStoonie) {
                    // Reset all Stoonie materials
                    this.gameEngine.entityManager.getEntities().forEach(entity => {
                        if (entity.constructor.name === 'Stoonie') {
                            entity.mesh.material.emissive.setHex(0x000000);
                        }
                    });
                }
            }
        });

        document.addEventListener('mouseup', (event) => {
            if (this.draggedSoul) {
                // Remove drag visual
                const dragVisual = document.getElementById('drag-visual');
                if (dragVisual) {
                    dragVisual.remove();
                }

                // Reset soul item opacity
                const soulItem = document.querySelector(`.soul-item[data-soul-id="${this.draggedSoul.id}"]`);
                if (soulItem) {
                    soulItem.style.opacity = '1';
                }

                // Check if we're over a Stoonie
                const mouse = new THREE.Vector2(
                    (event.clientX / window.innerWidth) * 2 - 1,
                    -(event.clientY / window.innerHeight) * 2 + 1
                );

                this.gameEngine.raycaster.setFromCamera(mouse, this.gameEngine.camera);
                const intersects = this.gameEngine.raycaster.intersectObjects(this.gameEngine.scene.children, true);

                for (const intersect of intersects) {
                    const entity = this.gameEngine.entityManager.getEntityByMesh(intersect.object);
                    if (entity && entity.constructor.name === 'Stoonie') {
                        this.gameEngine.soulManager.connectSoulToStoonie(this.draggedSoul, entity);
                        break;
                    }
                }

                // Reset all Stoonie materials
                this.gameEngine.entityManager.getEntities().forEach(entity => {
                    if (entity.constructor.name === 'Stoonie') {
                        entity.mesh.material.emissive.setHex(0x000000);
                    }
                });

                this.draggedSoul = null;
                this.updateSoulsPanel();
            }
        });
    }

    updateHoveredEntity(event) {
        if (this.draggedSoul) return; // Don't update hover while dragging

        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );

        this.gameEngine.raycaster.setFromCamera(mouse, this.gameEngine.camera);
        const intersects = this.gameEngine.raycaster.intersectObjects(this.gameEngine.scene.children, true);

        let hoveredEntity = null;
        for (const intersect of intersects) {
            const entity = this.gameEngine.entityManager.getEntityByMesh(intersect.object);
            if (entity) {
                hoveredEntity = entity;
                break;
            }
        }

        this.setHoveredEntity(hoveredEntity);
    }

    onSoulDragStart(event) {
        if (event.target.closest('.soul-item')) {
            const soulId = event.target.closest('.soul-item').dataset.soulId;
            this.draggedSoul = this.gameEngine.soulManager.souls.get(soulId);
            if (this.draggedSoul) {
                event.target.closest('.soul-item').style.opacity = '0.5';
                this.createDragVisual(event);
            }
        }
    }

    onSoulDragMove(event) {
        if (this.draggedSoul) {
            const dragVisual = document.getElementById('drag-visual');
            if (dragVisual) {
                dragVisual.style.left = `${event.clientX - 20}px`;
                dragVisual.style.top = `${event.clientY - 20}px`;
            }
        }
    }

    onSoulDragEnd(event) {
        if (!this.draggedSoul) return;

        const dragVisual = document.getElementById('drag-visual');
        if (dragVisual) {
            dragVisual.remove();
        }

        // Convert screen coordinates to world coordinates
        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );

        this.gameEngine.raycaster.setFromCamera(mouse, this.gameEngine.camera);
        const intersects = this.gameEngine.raycaster.intersectObjects(this.gameEngine.scene.children, true);

        let targetStoonie = null;
        for (const intersect of intersects) {
            const entity = this.gameEngine.entityManager.getEntityByMesh(intersect.object);
            if (entity && entity.constructor.name === 'Stoonie' && !entity.soul) {
                targetStoonie = entity;
                break;
            }
        }

        if (targetStoonie) {
            this.gameEngine.soulManager.connectSoulToStoonie(this.draggedSoul, targetStoonie);
        }

        // Reset drag state
        const draggedElement = document.querySelector(`.soul-item[data-soul-id="${this.draggedSoul.id}"]`);
        if (draggedElement) {
            draggedElement.style.opacity = '1';
        }

        this.draggedSoul = null;
        this.updateSoulsPanel();
    }

    createDragVisual(event) {
        const dragVisual = document.createElement('div');
        dragVisual.id = 'drag-visual';
        dragVisual.style.position = 'fixed';
        dragVisual.style.pointerEvents = 'none';
        dragVisual.style.zIndex = '1000';
        dragVisual.style.width = '32px';
        dragVisual.style.height = '32px';
        dragVisual.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        dragVisual.style.borderRadius = '50%';
        dragVisual.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
        dragVisual.style.left = `${event.clientX}px`;
        dragVisual.style.top = `${event.clientY}px`;
        dragVisual.style.transform = 'translate(-50%, -50%)';
        document.body.appendChild(dragVisual);
    }

    updateSoulsPanel() {
        if (!this.panels.souls) return;

        const availableSouls = Array.from(this.gameEngine.soulManager.souls.values())
            .filter(soul => !soul.connectedStoonie);

        this.panels.souls.innerHTML = '<h3>Available Souls</h3>';
        if (availableSouls.length === 0) {
            this.panels.souls.innerHTML += '<p>No souls available</p>';
            return;
        }

        const soulsList = document.createElement('div');
        soulsList.className = 'souls-list';
        soulsList.style.marginTop = '10px';

        availableSouls.forEach(soul => {
            const soulItem = document.createElement('div');
            soulItem.className = 'soul-item';
            soulItem.dataset.soulId = soul.id;
            soulItem.innerHTML = `
                <span class="soul-name">${soul.name}</span>
                <span class="soul-level">Level ${soul.level}</span>
            `;
            Object.assign(soulItem.style, {
                cursor: 'grab',
                padding: '5px',
                margin: '5px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '3px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            });
            
            soulsList.appendChild(soulItem);
        });

        this.panels.souls.appendChild(soulsList);
    }

    update(deltaTime) {
        if (!this.initialized) return;
        
        if (this.statsOverlay) {
            this.statsOverlay.update(deltaTime);
        }
        
        if (this.detailsPanel) {
            this.detailsPanel.update(deltaTime);
        }

        // Update souls panel
        this.updateSoulsPanel();

        // Update selection panel
        const selectedEntities = this.gameEngine.selectionManager.getSelectedEntities();
        if (selectedEntities.length > 0) {
            this.updateSelectionPanel(selectedEntities);
            this.panels.selection.style.display = 'block';
        } else {
            this.panels.selection.style.display = 'none';
        }
    }

    updateSelectionPanel(selectedEntities) {
        if (!this.panels.selection) return;

        let content = '<h3>Selected Stoonies</h3>';
        selectedEntities.forEach(entity => {
            if (entity.constructor.name === 'Stoonie') {
                content += `
                    <div style="margin-top: 10px; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <div>Stoonie #${entity.id}</div>
                        <div>Health: ${Math.floor(entity.health)}%</div>
                        <div>Energy: ${Math.floor(entity.energy)}%</div>
                        ${entity.soul ? `
                            <div>Soul: ${entity.soul.name} (Level ${entity.soul.level})</div>
                        ` : '<div>No soul attached</div>'}
                    </div>
                `;
            }
        });

        this.panels.selection.innerHTML = content;
    }

    setHoveredEntity(entity) {
        if (entity !== this.hoveredEntity) {
            this.hoveredEntity = entity;
            if (this.statsOverlay) {
                if (entity) {
                    this.statsOverlay.show(entity);
                    this.statsOverlay.mousePosition = this.mousePosition;
                } else {
                    this.statsOverlay.hide();
                }
            }
        }
    }

    clearHoveredEntity() {
        this.setHoveredEntity(null);
    }

    getCanvas() {
        return this.canvas;
    }

    resizeCanvas() {
        if (this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    }
}

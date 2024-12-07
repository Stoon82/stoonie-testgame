import * as THREE from 'three';

export default class UIOverlay {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.container = null;
        this.soulPanel = null;
        this.draggedSoul = null;
        this.hoveredStoonie = null;
        this.selectedSoul = null;
        this.draggingSoul = false;
    }

    async initialize() {
        console.log('Initializing UIOverlay');
        this.setupUI();
        return Promise.resolve();
    }

    setupUI() {
        this.createSoulDragInterface();
    }

    createSoulDragInterface() {
        // Create soul panel for dragging souls
        this.soulPanel = document.createElement('div');
        this.soulPanel.id = 'soulPanel';
        this.soulPanel.style.cssText = `
            position: fixed;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            width: 200px;
            background-color: rgba(0, 0, 0, 0.7);
            padding: 10px;
            border-radius: 5px;
            color: white;
            z-index: 1000;
        `;

        const title = document.createElement('h3');
        title.textContent = 'Drag Souls';
        title.style.margin = '0 0 10px 0';
        this.soulPanel.appendChild(title);

        // Container for draggable souls
        this.soulContainer = document.createElement('div');
        this.soulContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 5px;
            max-height: 300px;
            overflow-y: auto;
        `;
        this.soulPanel.appendChild(this.soulContainer);

        document.body.appendChild(this.soulPanel);

        // Setup drag events
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (this.draggedSoul) {
                const intersects = this.gameEngine.uiManager.getIntersects(e.clientX, e.clientY);
                this.hoveredStoonie = null;

                for (const intersect of intersects) {
                    if (intersect.object.entity?.constructor.name === 'Stoonie') {
                        this.hoveredStoonie = intersect.object.entity;
                        this.hoveredStoonie.mesh.material.emissive.setHex(0x444444);
                        break;
                    }
                }

                // Remove highlight from non-targets
                this.gameEngine.entityManager.entities.forEach(entity => {
                    if (entity !== this.hoveredStoonie && entity.constructor.name === 'Stoonie') {
                        entity.mesh.material.emissive.setHex(0x000000);
                    }
                });
            }
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            if (this.draggedSoul && this.hoveredStoonie) {
                if (this.hoveredStoonie.soul) {
                    // Disconnect existing soul first
                    this.gameEngine.soulManager.disconnectSoulFromStoonie(this.hoveredStoonie);
                }
                // Connect new soul
                this.gameEngine.soulManager.connectSoulToStoonie(this.hoveredStoonie, this.draggedSoul);
            }

            // Clear highlights
            this.gameEngine.entityManager.entities.forEach(entity => {
                if (entity.constructor.name === 'Stoonie') {
                    entity.mesh.material.emissive.setHex(0x000000);
                }
            });

            this.draggedSoul = null;
            this.hoveredStoonie = null;
        });
    }

    createButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            padding: 8px 16px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        `;
        button.addEventListener('click', onClick);
        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#45a049';
        });
        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#4CAF50';
        });
        return button;
    }

    getRandomPosition() {
        const worldSize = 45;
        return {
            x: (Math.random() * 2 - 1) * worldSize,
            z: (Math.random() * 2 - 1) * worldSize
        };
    }

    adjustColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16).slice(1);
    }

    createSoulElement(soul) {
        const soulElement = document.createElement('div');
        soulElement.className = 'soul-item';
        soulElement.dataset.soulId = soul.id;
        soulElement.style.cssText = `
            padding: 10px;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 5px;
            cursor: grab;
            user-select: none;
            transition: background-color 0.3s;
        `;
        soulElement.innerHTML = `
            <div style="font-weight: bold;">Level ${soul.level} Soul</div>
            <div style="font-size: 0.9em; opacity: 0.8;">XP: ${soul.experience}/${soul.experienceToNextLevel}</div>
        `;

        soulElement.draggable = true;
        soulElement.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', soul.id);
            e.target.style.opacity = '0.5';
            this.draggedSoul = soul;
        });

        soulElement.addEventListener('dragend', (e) => {
            e.target.style.opacity = '1';
            if (!this.hoveredStoonie) {
                this.draggedSoul = null;
            }
        });

        return soulElement;
    }

    update() {
        // Update available souls list
        if (this.soulContainer) {
            // Clear existing souls
            while (this.soulContainer.firstChild) {
                this.soulContainer.removeChild(this.soulContainer.firstChild);
            }

            // Add available souls
            this.gameEngine.soulManager.getAvailableSouls().forEach(soul => {
                const soulElement = this.createSoulElement(soul);
                this.soulContainer.appendChild(soulElement);
            });
        }
    }

    init() {
        this.createMainContainer();
        this.createSpawnButtons();
        this.setupDragEvents();
    }

    createSpawnButtons() {
        // Add Stoonie button
        const addStoonieBtn = document.createElement('button');
        addStoonieBtn.textContent = '+ Add Stoonie';
        addStoonieBtn.style.cssText = `
            padding: 10px 20px;
            font-size: 16px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s;
        `;
        addStoonieBtn.addEventListener('mouseover', () => addStoonieBtn.style.background = '#45a049');
        addStoonieBtn.addEventListener('mouseout', () => addStoonieBtn.style.background = '#4CAF50');
        addStoonieBtn.addEventListener('click', () => {
            const randomPosition = new THREE.Vector3(
                (Math.random() - 0.5) * 40,
                0,
                (Math.random() - 0.5) * 40
            );
            this.gameEngine.entityManager.createStoonie({ position: randomPosition });
        });
        this.container.appendChild(addStoonieBtn);

        // Add Demon button
        const addDemonBtn = document.createElement('button');
        addDemonBtn.textContent = '+ Add Demon';
        addDemonBtn.style.cssText = `
            padding: 10px 20px;
            font-size: 16px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s;
        `;
        addDemonBtn.addEventListener('mouseover', () => addDemonBtn.style.background = '#da190b');
        addDemonBtn.addEventListener('mouseout', () => addDemonBtn.style.background = '#f44336');
        addDemonBtn.addEventListener('click', () => {
            const randomPosition = new THREE.Vector3(
                (Math.random() - 0.5) * 40,
                0,
                (Math.random() - 0.5) * 40
            );
            this.gameEngine.entityManager.createDemonStoonie({ position: randomPosition });
        });
        this.container.appendChild(addDemonBtn);
    }

    setupDragEvents() {
        // Track dragged soul and hovered stoonie
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('soul-item')) {
                this.draggedSoul = this.gameEngine.soulManager.souls.get(
                    parseInt(e.target.dataset.soulId)
                );
                e.target.style.opacity = '0.5';
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('soul-item')) {
                e.target.style.opacity = '1';
                this.draggedSoul = null;
            }
        });

        // Handle dropping soul on stoonie
        document.addEventListener('mousemove', (e) => {
            if (this.draggedSoul) {
                const intersects = this.gameEngine.uiManager.getIntersects(e.clientX, e.clientY);
                this.hoveredStoonie = null;
                
                for (const intersect of intersects) {
                    if (intersect.object.entity?.constructor.name === 'Stoonie') {
                        this.hoveredStoonie = intersect.object.entity;
                        // Highlight potential target
                        this.hoveredStoonie.mesh.material.emissive.setHex(0x444444);
                        break;
                    }
                }
                
                // Remove highlight from non-targets
                this.gameEngine.entityManager.entities.forEach(entity => {
                    if (entity !== this.hoveredStoonie && entity.constructor.name === 'Stoonie') {
                        entity.mesh.material.emissive.setHex(0x000000);
                    }
                });
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.draggedSoul && this.hoveredStoonie) {
                if (this.hoveredStoonie.soul) {
                    // Disconnect existing soul first
                    this.gameEngine.soulManager.disconnectSoulFromStoonie(this.hoveredStoonie);
                }
                // Connect new soul
                this.gameEngine.soulManager.connectSoulToStoonie(this.hoveredStoonie, this.draggedSoul);
            }
            
            // Clear highlights
            this.gameEngine.entityManager.entities.forEach(entity => {
                if (entity.constructor.name === 'Stoonie') {
                    entity.mesh.material.emissive.setHex(0x000000);
                }
            });
            
            this.draggedSoul = null;
            this.hoveredStoonie = null;
        });
    }

    startDragging(e, soul, element) {
        this.draggingSoul = true;
        this.selectedSoul = soul;
        
        // Create drag preview
        this.dragPreview = element.cloneNode(true);
        this.dragPreview.style.position = 'fixed';
        this.dragPreview.style.pointerEvents = 'none';
        this.dragPreview.style.opacity = '0.8';
        document.body.appendChild(this.dragPreview);
        
        this.updateDragPreview(e);
    }

    handleDrag(e) {
        if (this.draggingSoul) {
            this.updateDragPreview(e);
            
            // Check for hover over Stoonie
            const hoveredStoonie = this.gameEngine.entityManager.getHoveredStoonie(e);
            if (hoveredStoonie) {
                hoveredStoonie.highlight = true;
            }
        }
    }

    updateDragPreview(e) {
        if (this.dragPreview) {
            this.dragPreview.style.left = e.clientX + 10 + 'px';
            this.dragPreview.style.top = e.clientY + 10 + 'px';
        }
    }

    handleDragEnd(e) {
        if (this.draggingSoul) {
            const hoveredStoonie = this.gameEngine.entityManager.getHoveredStoonie(e);
            if (hoveredStoonie && this.selectedSoul) {
                this.gameEngine.soulManager.connectSoulToStoonie(this.selectedSoul, hoveredStoonie);
            }

            // Clean up
            if (this.dragPreview) {
                this.dragPreview.remove();
                this.dragPreview = null;
            }
            this.draggingSoul = false;
            this.selectedSoul = null;
        }
    }
}

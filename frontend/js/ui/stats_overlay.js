export default class StatsOverlay {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.overlay = null;
        this.hoveredEntity = null;
        this.mousePosition = { x: 0, y: 0 };
        this.initialize();
    }

    initialize() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'stats-overlay';
        Object.assign(this.overlay.style, {
            position: 'absolute',
            display: 'none',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '14px',
            pointerEvents: 'none',
            zIndex: '1000',
            minWidth: '200px',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
        });
        document.body.appendChild(this.overlay);

        // Add event listeners
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    }

    handleMouseMove(event) {
        this.mousePosition.x = event.clientX;
        this.mousePosition.y = event.clientY;
        
        // Get hovered entity
        const hoveredEntity = this.gameEngine.entityManager.getHoveredStoonie(event);
        if (hoveredEntity !== this.hoveredEntity) {
            this.hoveredEntity = hoveredEntity;
            this.updateOverlay();
        }
    }

    updateOverlay() {
        if (!this.hoveredEntity) {
            this.overlay.style.display = 'none';
            return;
        }

        const entity = this.hoveredEntity;
        let content = '';

        if (entity.constructor.name === 'Stoonie') {
            const genderSymbol = entity.gender === 'male' ? '♂' : '♀';
            const genderColor = entity.gender === 'male' ? '#ff6b6b' : '#4ecdc4';
            const needs = this.gameEngine.needsManager.getStatus(entity.id);
            
            content = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span>Stoonie #${entity.id}</span>
                    <span style="color: ${genderColor}; font-size: 18px;">${genderSymbol}</span>
                </div>
                <div style="margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span style="color: #ff7675;">Health:</span>
                        <div style="width: 100px; background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; margin-left: 10px; position: relative;">
                            <div style="width: ${entity.health}%; background: #ff7675; height: 100%; border-radius: 4px;"></div>
                            <span style="position: absolute; right: -30px; font-size: 12px;">${Math.floor(entity.health)}%</span>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span style="color: #74b9ff;">Energy:</span>
                        <div style="width: 100px; background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; margin-left: 10px; position: relative;">
                            <div style="width: ${entity.energy}%; background: #74b9ff; height: 100%; border-radius: 4px;"></div>
                            <span style="position: absolute; right: -30px; font-size: 12px;">${Math.floor(entity.energy)}%</span>
                        </div>
                    </div>
                </div>
                ${needs ? `
                    <div style="margin-bottom: 10px; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                            <span style="color: #ffeaa7;">Hunger:</span>
                            <div style="width: 100px; background: rgba(255,255,255,0.1); height: 6px; border-radius: 3px; margin-left: 10px; position: relative;">
                                <div style="width: ${needs.hunger}%; background: #ffeaa7; height: 100%; border-radius: 3px;"></div>
                                <span style="position: absolute; right: -30px; font-size: 12px;">${Math.floor(needs.hunger)}%</span>
                            </div>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                            <span style="color: #81ecec;">Thirst:</span>
                            <div style="width: 100px; background: rgba(255,255,255,0.1); height: 6px; border-radius: 3px; margin-left: 10px; position: relative;">
                                <div style="width: ${needs.thirst}%; background: #81ecec; height: 100%; border-radius: 3px;"></div>
                                <span style="position: absolute; right: -30px; font-size: 12px;">${Math.floor(needs.thirst)}%</span>
                            </div>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                            <span style="color: #a8e6cf;">Rest:</span>
                            <div style="width: 100px; background: rgba(255,255,255,0.1); height: 6px; border-radius: 3px; margin-left: 10px; position: relative;">
                                <div style="width: ${100 - needs.tiredness}%; background: #a8e6cf; height: 100%; border-radius: 3px;"></div>
                                <span style="position: absolute; right: -30px; font-size: 12px;">${Math.floor(100 - needs.tiredness)}%</span>
                            </div>
                        </div>
                    </div>
                ` : ''}
                <div style="margin-bottom: 10px; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span>Age:</span>
                        <span>${Math.floor(entity.age)} sec</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span>State:</span>
                        <span style="color: ${
                            entity.behaviorState === 'wander' ? '#a8e6cf' :
                            entity.behaviorState === 'flee' ? '#ff7675' :
                            entity.behaviorState === 'fight' ? '#ffd93d' :
                            entity.behaviorState === 'working' ? '#74b9ff' : '#ffffff'
                        };">${entity.behaviorState}</span>
                    </div>
                    ${entity.shield > 0 ? `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                            <span style="color: #a8e6cf;">Shield:</span>
                            <span>${Math.floor(entity.shield)}</span>
                        </div>
                    ` : ''}
                </div>
                ${entity.soul ? `
                    <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 5px;">
                        <div style="color: #a8e6cf; margin-bottom: 3px;">Soul: ${entity.soul.name}</div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                            <span>Level ${entity.soul.level}</span>
                            <div style="width: 100px; background: rgba(255,255,255,0.1); height: 6px; border-radius: 3px; margin-left: 10px; position: relative;">
                                <div style="width: ${(entity.soul.experience % 100)}%; background: #ffd93d; height: 100%; border-radius: 3px;"></div>
                                <span style="position: absolute; right: -45px; font-size: 12px;">XP: ${Math.floor(entity.soul.experience)}</span>
                            </div>
                        </div>
                        ${entity.soul.powers.size > 0 ? `
                            <div style="font-size: 12px; color: #dfe6e9; margin-top: 3px;">
                                Powers: ${Array.from(entity.soul.powers).join(', ')}
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                ${entity.isPregnant ? `
                    <div style="margin-top: 5px; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <div style="color: #ffd3b6; display: flex; justify-content: space-between; align-items: center;">
                            <span>🤰 Pregnant</span>
                            <span style="font-size: 12px;">${Math.floor(entity.pregnancyTime)}/${entity.pregnancyDuration} sec</span>
                        </div>
                        <div style="width: 100%; background: rgba(255,255,255,0.1); height: 4px; border-radius: 2px; margin-top: 3px;">
                            <div style="width: ${(entity.pregnancyTime / entity.pregnancyDuration) * 100}%; background: #ffd3b6; height: 100%; border-radius: 2px;"></div>
                        </div>
                    </div>
                ` : ''}
            `;
        }

        this.overlay.innerHTML = content;
        this.overlay.style.display = 'block';

        // Position the overlay near the mouse but ensure it stays within viewport
        const rect = this.overlay.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left = this.mousePosition.x + 15;
        let top = this.mousePosition.y + 15;

        // Adjust position if overlay would go outside viewport
        if (left + rect.width > viewportWidth) {
            left = this.mousePosition.x - rect.width - 15;
        }
        if (top + rect.height > viewportHeight) {
            top = this.mousePosition.y - rect.height - 15;
        }

        this.overlay.style.left = `${left}px`;
        this.overlay.style.top = `${top}px`;
    }

    update() {
        if (this.hoveredEntity) {
            this.updateOverlay();
        }
    }
}

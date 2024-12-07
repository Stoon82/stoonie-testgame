import * as THREE from 'three';

export default class InputManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.initialized = false;
        
        // Mouse state
        this.mousePosition = { x: 0, y: 0 };
        this.normalizedMousePosition = { x: 0, y: 0 };
        this.lastClientX = window.innerWidth / 2;  
        this.lastClientY = window.innerHeight / 2;
        this.isMouseDown = false;
        this.mouseButton = null;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragDelta = { x: 0, y: 0 };
        this.lastDragPosition = { x: 0, y: 0 };
        
        // Camera control
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
        this.cameraDistance = 15;
        this.minCameraDistance = 5;
        this.maxCameraDistance = 30;
        this.panSpeed = 0.01;
        
        // Keyboard state
        this.keysPressed = new Set();
        this.modifierKeys = {
            shift: false,
            ctrl: false,
            alt: false
        };

        // Bind methods to maintain context
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onWheel = this.onWheel.bind(this);
        this.onContextMenu = this.onContextMenu.bind(this);
    }

    initialize() {
        if (this.initialized) return;

        // Wait for renderer to be available
        if (!this.gameEngine.renderer) {
            return;
        }

        // Initialize mouse position to center of window
        this.lastClientX = window.innerWidth / 2;
        this.lastClientY = window.innerHeight / 2;

        // Add event listeners to window for better event capture
        window.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('click', this.onClick);
        window.addEventListener('wheel', this.onWheel);
        window.addEventListener('contextmenu', this.onContextMenu);
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);

        this.initialized = true;
        this.updateMousePosition(); // Initial position update
    }

    cleanup() {
        if (!this.initialized) return;
        
        // Remove window event listeners
        window.removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('mouseup', this.onMouseUp);
        window.removeEventListener('click', this.onClick);
        window.removeEventListener('wheel', this.onWheel);
        window.removeEventListener('contextmenu', this.onContextMenu);
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);

        this.initialized = false;
    }

    update(deltaTime) {
        if (!this.initialized) return;

        this.updateMousePosition();

        // Do one raycast per frame to check what's under the mouse
        const entity = this.getEntityUnderMouse();
        if (entity) {
            // Update UI hover state
            this.gameEngine.uiManager.setHoveredEntity(entity);
        } else {
            this.gameEngine.uiManager.clearHoveredEntity();
        }

        // Update drag state if mouse is down
        if (this.isMouseDown && this.mouseButton === 2) {
            const deltaX = this.lastClientX - this.lastDragPosition.x;
            const deltaY = this.lastClientY - this.lastDragPosition.y;

            if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
                this.isDragging = true;
            }

            if (this.isDragging) {
                const camera = this.gameEngine.camera;
                if (camera) {
                    const panX = -deltaX * this.panSpeed * camera.position.y;
                    const panZ = deltaY * this.panSpeed * camera.position.y;

                    camera.position.x += panX;
                    camera.position.z += panZ;
                    this.cameraTarget.x += panX;
                    this.cameraTarget.z += panZ;
                    camera.lookAt(this.cameraTarget);
                }
            }

            this.lastDragPosition = { 
                x: this.lastClientX, 
                y: this.lastClientY 
            };
        }
    }

    updateMousePosition() {
        if (!this.gameEngine.renderer) return;
        
        const canvas = this.gameEngine.renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        
        // Update screen coordinates relative to canvas
        this.mousePosition = {
            x: this.lastClientX - rect.left,
            y: this.lastClientY - rect.top
        };

        // Clamp mouse position to canvas bounds
        this.mousePosition.x = Math.max(0, Math.min(this.mousePosition.x, rect.width));
        this.mousePosition.y = Math.max(0, Math.min(this.mousePosition.y, rect.height));

        // Update normalized coordinates (-1 to +1)
        this.normalizedMousePosition = {
            x: (this.mousePosition.x / rect.width) * 2 - 1,
            y: -(this.mousePosition.y / rect.height) * 2 + 1
        };
    }

    onMouseDown(event) {
        // Skip if clicking on UI elements
        if (event.target.closest('#ui-overlay') || 
            event.target.closest('#stats-overlay') || 
            event.target.closest('#souls-panel')) {
            return;
        }

        this.isMouseDown = true;
        this.mouseButton = event.button;
        this.dragStart = { x: event.clientX, y: event.clientY };
        this.lastDragPosition = { ...this.dragStart };
        
        this.updateModifierKeys(event);
        this.updateMousePosition();

        // Handle entity selection only on left click
        if (event.button === 0) {
            const entity = this.getEntityUnderMouse(event);
            if (entity) {
                this.gameEngine.selectionManager.toggleSelection(entity, this.modifierKeys.shift);
            } else if (!this.modifierKeys.shift) {
                this.gameEngine.selectionManager.clearSelection();
            }
        }
    }

    onMouseMove(event) {
        // Always update mouse coordinates
        this.lastClientX = event.clientX;
        this.lastClientY = event.clientY;
        this.updateMousePosition();

        // Skip further processing if over UI elements
        if (event.target.closest('#ui-overlay') || 
            event.target.closest('#stats-overlay') || 
            event.target.closest('#souls-panel') ||
            event.target.closest('#debug-overlay')) {
            return;
        }

        // Handle map dragging with right mouse button
        if (this.isMouseDown && this.mouseButton === 2) {
            const deltaX = event.clientX - this.lastDragPosition.x;
            const deltaY = event.clientY - this.lastDragPosition.y;

            if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
                this.isDragging = true;
            }

            this.lastDragPosition = { x: event.clientX, y: event.clientY };
        }
    }

    onMouseUp(event) {
        this.isMouseDown = false;
        this.mouseButton = null;
        this.isDragging = false;
        this.dragDelta = { x: 0, y: 0 };
        this.updateModifierKeys(event);
    }

    onClick(event) {
        // Handle click events that aren't part of a drag
        if (!this.isDragging) {
            // Click handling is done in mousedown for immediate response
        }
    }

    onKeyDown(event) {
        this.keysPressed.add(event.code);
        this.updateModifierKeys(event);

        // Start debug mode when shift is pressed
        if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
            this.gameEngine.debugManager.activate();
        }
    }

    onKeyUp(event) {
        this.keysPressed.delete(event.code);
        this.updateModifierKeys(event);

        // End debug mode when shift is released
        if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
            this.gameEngine.debugManager.endDebugMode();
        }
    }

    onWheel(event) {
        // Skip if hovering over UI elements
        if (event.target.closest('#ui-overlay') || 
            event.target.closest('#stats-overlay') || 
            event.target.closest('#souls-panel')) {
            return;
        }

        // Prevent default zoom behavior
        event.preventDefault();

        // Handle camera zoom
        if (this.gameEngine.camera) {
            const camera = this.gameEngine.camera;
            const zoomSpeed = 0.1;
            const delta = -Math.sign(event.deltaY) * zoomSpeed;
            
            // Calculate new camera distance
            this.cameraDistance = Math.max(
                this.minCameraDistance,
                Math.min(this.maxCameraDistance, this.cameraDistance - delta * 5)
            );

            // Update camera position while maintaining look target
            const direction = camera.position.clone().sub(this.cameraTarget).normalize();
            camera.position.copy(this.cameraTarget).add(direction.multiplyScalar(this.cameraDistance));
            camera.lookAt(this.cameraTarget);
        }
    }

    onContextMenu(event) {
        event.preventDefault();
    }

    getEntityUnderMouse() {
        if (!this.gameEngine.camera) return null;

        // Update raycaster with current mouse position
        const raycaster = this.gameEngine.raycaster;
        raycaster.setFromCamera(this.normalizedMousePosition, this.gameEngine.camera);

        // Get all meshes to check
        const meshes = [];
        
        // Add entity meshes
        if (this.gameEngine.entityManager) {
            this.gameEngine.entityManager.entities.forEach(entity => {
                if (entity.mesh) {
                    entity.mesh.entity = entity; // Store reference to entity on mesh
                    meshes.push(entity.mesh);
                }
            });
        }

        // Add environment object meshes
        if (this.gameEngine.worldManager) {
            this.gameEngine.worldManager.environmentObjects.forEach(object => {
                if (object.mesh) {
                    object.mesh.entity = object; // Store reference to environment object on mesh
                    meshes.push(object.mesh);
                }
            });
        }

        // Perform raycast
        const intersects = raycaster.intersectObjects(meshes, true);

        // Find the first intersected object
        for (const intersect of intersects) {
            let object = intersect.object;
            
            // Traverse up to find the root mesh with entity reference
            while (object && !object.entity) {
                object = object.parent;
            }
            
            if (object && object.entity) {
                return object.entity;
            }
        }

        return null;
    }

    updateModifierKeys(event) {
        this.modifierKeys = {
            shift: event.shiftKey,
            ctrl: event.ctrlKey,
            alt: event.altKey
        };
    }

    isKeyPressed(keyCode) {
        return this.keysPressed.has(keyCode);
    }

    isModifierKeyPressed(key) {
        return this.modifierKeys[key];
    }

    getMousePosition() {
        return { ...this.mousePosition };
    }

    getNormalizedMousePosition() {
        return { ...this.normalizedMousePosition };
    }

    getDragDelta() {
        return { ...this.dragDelta };
    }
}

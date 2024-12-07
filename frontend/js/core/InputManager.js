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
        this.panSpeed = 1.0;
        this.rotateSpeed = 0.1;
        
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
        // Skip if over UI elements
        if (event.target instanceof HTMLElement && 
            (event.target.id === 'ui-overlay' || 
             event.target.id === 'stats-overlay' || 
             event.target.id === 'souls-panel' ||
             event.target.id === 'debug-overlay')) {
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

        // Let right-click events pass through to OrbitControls
        if (event.button === 2) {
            return;
        }
    }

    onMouseMove(event) {
        // Always update mouse coordinates
        this.lastClientX = event.clientX;
        this.lastClientY = event.clientY;
        this.updateMousePosition();

        // Skip further processing if over UI elements
        if (event.target instanceof HTMLElement && 
            (event.target.id === 'ui-overlay' || 
             event.target.id === 'stats-overlay' || 
             event.target.id === 'souls-panel' ||
             event.target.id === 'debug-overlay')) {
            return;
        }

        // Let right-click drag events pass through to OrbitControls
        if (this.isMouseDown && this.mouseButton === 2) {
            return;
        }
    }

    onMouseUp(event) {
        // Let right-click events pass through to OrbitControls
        if (event.button === 2) {
            this.isMouseDown = false;
            this.mouseButton = null;
            return;
        }

        this.isMouseDown = false;
        this.mouseButton = null;
        this.isDragging = false;
        this.dragDelta = { x: 0, y: 0 };
        this.updateModifierKeys(event);
    }

    onClick(event) {
        // Skip if clicking on UI elements
        if (event.target.closest('#ui-overlay') || 
            event.target.closest('#stats-overlay') || 
            event.target.closest('#souls-panel')) {
            return;
        }
    }

    onKeyDown(event) {
        this.keysPressed.add(event.key);
        this.modifierKeys.ctrl = event.ctrlKey;
        this.modifierKeys.shift = event.shiftKey;
        this.modifierKeys.alt = event.altKey;

        // Only handle camera controls if we have access to controls
        if (!this.gameEngine.controls) return;

        const camera = this.gameEngine.camera;
        if (!camera) return;

        // Calculate movement vectors
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        const moveAmount = this.panSpeed;

        // Pan with arrow keys (no modifier)
        if (!event.ctrlKey) {
            switch(event.key) {
                case 'ArrowLeft':
                    camera.position.addScaledVector(right, -moveAmount);
                    this.gameEngine.controls.target.addScaledVector(right, -moveAmount);
                    console.log('Camera panning left');
                    break;
                case 'ArrowRight':
                    camera.position.addScaledVector(right, moveAmount);
                    this.gameEngine.controls.target.addScaledVector(right, moveAmount);
                    console.log('Camera panning right');
                    break;
                case 'ArrowUp':
                    camera.position.addScaledVector(forward, moveAmount);
                    this.gameEngine.controls.target.addScaledVector(forward, moveAmount);
                    console.log('Camera panning forward');
                    break;
                case 'ArrowDown':
                    camera.position.addScaledVector(forward, -moveAmount);
                    this.gameEngine.controls.target.addScaledVector(forward, -moveAmount);
                    console.log('Camera panning backward');
                    break;
            }
        }
        // Rotate with Ctrl + arrow keys
        else {
            const rotateAmount = this.rotateSpeed;
            const controls = this.gameEngine.controls;
            
            switch(event.key) {
                case 'ArrowLeft':
                    // Rotate camera position around target point
                    const targetLeft = controls.target;
                    const radiusLeft = camera.position.distanceTo(targetLeft);
                    const currentAngleLeft = Math.atan2(
                        camera.position.x - targetLeft.x,
                        camera.position.z - targetLeft.z
                    );
                    const newAngleLeft = currentAngleLeft + rotateAmount;
                    
                    camera.position.x = targetLeft.x + radiusLeft * Math.sin(newAngleLeft);
                    camera.position.z = targetLeft.z + radiusLeft * Math.cos(newAngleLeft);
                    camera.lookAt(targetLeft);
                    console.log('Camera rotating left');
                    break;
                    
                case 'ArrowRight':
                    // Rotate camera position around target point
                    const targetRight = controls.target;
                    const radiusRight = camera.position.distanceTo(targetRight);
                    const currentAngleRight = Math.atan2(
                        camera.position.x - targetRight.x,
                        camera.position.z - targetRight.z
                    );
                    const newAngleRight = currentAngleRight - rotateAmount;
                    
                    camera.position.x = targetRight.x + radiusRight * Math.sin(newAngleRight);
                    camera.position.z = targetRight.z + radiusRight * Math.cos(newAngleRight);
                    camera.lookAt(targetRight);
                    console.log('Camera rotating right');
                    break;
                    
                case 'ArrowUp':
                    // Rotate camera up around target point
                    const targetUp = controls.target;
                    const radiusUp = camera.position.distanceTo(targetUp);
                    const heightUp = camera.position.y - targetUp.y;
                    const groundDistanceUp = Math.sqrt(
                        Math.pow(camera.position.x - targetUp.x, 2) +
                        Math.pow(camera.position.z - targetUp.z, 2)
                    );
                    
                    // Calculate new height and ground distance
                    const angle = Math.atan2(heightUp, groundDistanceUp);
                    const newAngleUp = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, angle + rotateAmount));
                    const newHeightUp = radiusUp * Math.sin(newAngleUp);
                    const newGroundDistanceUp = radiusUp * Math.cos(newAngleUp);
                    
                    // Update camera position
                    const directionUp = new THREE.Vector3(
                        camera.position.x - targetUp.x,
                        0,
                        camera.position.z - targetUp.z
                    ).normalize();
                    
                    camera.position.x = targetUp.x + directionUp.x * newGroundDistanceUp;
                    camera.position.y = targetUp.y + newHeightUp;
                    camera.position.z = targetUp.z + directionUp.z * newGroundDistanceUp;
                    camera.lookAt(targetUp);
                    console.log('Camera rotating up');
                    break;
                    
                case 'ArrowDown':
                    // Rotate camera down around target point
                    const targetDown = controls.target;
                    const radiusDown = camera.position.distanceTo(targetDown);
                    const heightDown = camera.position.y - targetDown.y;
                    const groundDistanceDown = Math.sqrt(
                        Math.pow(camera.position.x - targetDown.x, 2) +
                        Math.pow(camera.position.z - targetDown.z, 2)
                    );
                    
                    // Calculate new height and ground distance
                    const angleDown = Math.atan2(heightDown, groundDistanceDown);
                    const newAngleDown = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, angleDown - rotateAmount));
                    const newHeightDown = radiusDown * Math.sin(newAngleDown);
                    const newGroundDistanceDown = radiusDown * Math.cos(newAngleDown);
                    
                    // Update camera position
                    const directionDown = new THREE.Vector3(
                        camera.position.x - targetDown.x,
                        0,
                        camera.position.z - targetDown.z
                    ).normalize();
                    
                    camera.position.x = targetDown.x + directionDown.x * newGroundDistanceDown;
                    camera.position.y = targetDown.y + newHeightDown;
                    camera.position.z = targetDown.z + directionDown.z * newGroundDistanceDown;
                    camera.lookAt(targetDown);
                    console.log('Camera rotating down');
                    break;
            }
        }

        // Update controls
        this.gameEngine.controls.update();
    }

    onKeyUp(event) {
        this.keysPressed.delete(event.key);
        this.modifierKeys.ctrl = event.ctrlKey;
        this.modifierKeys.shift = event.shiftKey;
        this.modifierKeys.alt = event.altKey;
    }

    onWheel(event) {
        // Skip if hovering over UI elements
        if (event.target.closest('#ui-overlay') || 
            event.target.closest('#stats-overlay') || 
            event.target.closest('#souls-panel')) {
            return;
        }

        // Let OrbitControls handle the zoom
        // We don't prevent default here to allow OrbitControls to work
    }

    onContextMenu(event) {
        // Only prevent context menu if not using OrbitControls
        if (!this.gameEngine.controls) {
            event.preventDefault();
        }
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

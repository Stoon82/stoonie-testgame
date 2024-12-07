import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import InitManager from './InitManager.js';
import WorldManager from './WorldManager.js';
import EntityManager from './EntityManager.js';
import SoulManager from './SoulManager.js';
import UIManager from './UIManager.js';
import DebugManager from './DebugManager.js';
import NeedsManager from './NeedsManager.js';
import VicinityManager from './VicinityManager.js';
import SelectionManager from './SelectionManager.js';
import InputManager from './InputManager.js';
import JobManager from './JobManager.js';
import MapEditManager from './MapEditManager.js';

/**
 * The main GameEngine class that manages the game's core functionality.
 */
export default class GameEngine {
    /**
     * Creates a new instance of the GameEngine class.
     */
    constructor(canvas) {
        if (!canvas) {
            throw new Error('Canvas is required for GameEngine initialization');
        }
        
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        
        this.clock = new THREE.Clock();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.age = 0;
        
        // Initialize all managers
        this.initManager = new InitManager(this);
        this.worldManager = new WorldManager(this);
        this.entityManager = new EntityManager(this);
        this.needsManager = new NeedsManager(this);
        this.soulManager = new SoulManager(this);
        this.jobManager = new JobManager(this);
        this.vicinityManager = new VicinityManager(this);
        this.debugManager = new DebugManager(this);
        this.uiManager = new UIManager(this);
        this.inputManager = new InputManager(this);
        this.selectionManager = new SelectionManager(this);
        this.mapEditManager = new MapEditManager(this);
        
        this.selectedEntity = null;
        this.isInitialized = false;
        this.isMapEditMode = false;
        this.isMouseDown = false;

        // Register managers with InitManager
        this.initManager.registerManager('worldManager', this.worldManager);
        this.initManager.registerManager('entityManager', this.entityManager);
        this.initManager.registerManager('needsManager', this.needsManager);
        this.initManager.registerManager('soulManager', this.soulManager);
        this.initManager.registerManager('jobManager', this.jobManager);
        this.initManager.registerManager('vicinityManager', this.vicinityManager);
        this.initManager.registerManager('debugManager', this.debugManager);
        this.initManager.registerManager('uiManager', this.uiManager);
        this.initManager.registerManager('inputManager', this.inputManager);
        this.initManager.registerManager('selectionManager', this.selectionManager);
        this.initManager.registerManager('mapEditManager', this.mapEditManager);

        // Bind methods
        this.update = this.update.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);

        // Add window resize listener
        window.addEventListener('resize', this.handleResize);

        // Add mouse event listeners
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.canvas.addEventListener('mouseup', this.handleMouseUp);
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
    }

    cleanup() {
        // Remove window resize listener
        window.removeEventListener('resize', this.handleResize);
        
        // Clean up managers
        if (this.inputManager) this.inputManager.cleanup();
        if (this.entityManager) this.entityManager.cleanup();
        if (this.uiManager) this.uiManager.cleanup();
        
        // Clean up Three.js resources
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.domElement.remove();
        }
        if (this.scene) {
            this.scene.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }
    }

    /**
     * Sets up the renderer for the game.
     */
    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        // Set canvas style
        const canvas = this.renderer.domElement;
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '0';
    }

    /**
     * Sets up the camera for the game.
     */
    setupCamera() {
        // Initialize camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 15, 20);
        this.camera.lookAt(0, 0, 0);

        console.log('Camera initialized:', {
            position: this.camera.position,
            rotation: this.camera.rotation,
            fov: this.camera.fov,
            aspect: this.camera.aspect
        });

        // Add OrbitControls after renderer is set up
        if (this.renderer) {
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.minDistance = 5;
            this.controls.maxDistance = 50;
            this.controls.maxPolarAngle = Math.PI / 2;
            this.controls.minPolarAngle = 0;
            this.controls.enablePan = true;
            this.controls.panSpeed = 1.0;
            this.controls.rotateSpeed = 0.8;
            
            // Configure controls to work with our input system
            this.controls.mouseButtons = {
                LEFT: null,  // Disable left click for OrbitControls
                MIDDLE: THREE.MOUSE.DOLLY,  // Middle mouse for zoom
                RIGHT: THREE.MOUSE.ROTATE   // Right mouse for rotation
            };

            console.log('OrbitControls initialized with configuration:', {
                enableDamping: this.controls.enableDamping,
                dampingFactor: this.controls.dampingFactor,
                minDistance: this.controls.minDistance,
                maxDistance: this.controls.maxDistance,
                maxPolarAngle: this.controls.maxPolarAngle,
                minPolarAngle: this.controls.minPolarAngle,
                enablePan: this.controls.enablePan,
                panSpeed: this.controls.panSpeed,
                rotateSpeed: this.controls.rotateSpeed,
                mouseButtons: this.controls.mouseButtons
            });
        } else {
            console.error('Renderer not available when setting up camera');
        }
    }

    initializeThreeJS() {
        this.setupRenderer();
        this.setupCamera();
    }

    handleResize() {
        if (!this.camera || !this.renderer) return;

        // Update camera
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        // Update renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
    }

    /**
     * Initializes the game engine.
     */
    async initialize() {
        try {
            console.log('Initializing game engine...');
            
            // Initialize Three.js components
            this.initializeThreeJS();
            
            // Initialize all managers in the correct order
            await this.initManager.initializeGame();
            
            // Start the game loop
            this.isInitialized = true;
            this.update();
            
            console.log('Game engine initialized successfully');
        } catch (error) {
            console.error('Failed to initialize game engine:', error);
            throw error;
        }
    }

    /**
     * Handles window resize events.
     */
    onWindowResize() {
        // this.handleResize();
    }

    /**
     * Updates the game engine.
     */
    update() {
        if (!this.isInitialized) return;

        const deltaTime = this.clock.getDelta();

        // Update all managers
        this.worldManager.update(deltaTime);
        this.entityManager.update(deltaTime);
        this.needsManager.update(deltaTime);
        this.jobManager.update(deltaTime);
        this.soulManager.update(deltaTime);
        this.vicinityManager.update(deltaTime);
        this.selectionManager.update(deltaTime);
        this.uiManager.update(deltaTime);
        this.debugManager.update(deltaTime);

        // Update map edit range indicator if in edit mode
        if (this.mapEditManager.isActive) {
            this.mapEditManager.updateRangeIndicator(this.inputManager.getNormalizedMousePosition());
        }

        // Render the scene
        if (this.renderer && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }

        // Request next frame
        requestAnimationFrame(this.update);
    }

    /**
     * Selects an entity in the game.
     * @param {Object} entity The entity to select.
     */
    selectEntity(entity) {
        this.selectedEntity = entity;
    }

    setMapEditMode(enabled) {
        this.isMapEditMode = enabled;
    }

    handleMouseDown(event) {
        event.preventDefault();
        this.isMouseDown = true;
        if (this.isMapEditMode) {
            this.editTerrainAtMouse(event);
        }
    }

    handleMouseUp(event) {
        event.preventDefault();
        this.isMouseDown = false;
    }

    handleMouseMove(event) {
        event.preventDefault();
        if (this.isMapEditMode && this.isMouseDown) {
            this.editTerrainAtMouse(event);
        }
    }

    editTerrainAtMouse(event) {
        // Calculate mouse position
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Check for intersection with the terrain
        const terrain = this.worldManager.terrain;
        if (!terrain) return;

        const intersects = this.raycaster.intersectObject(terrain);
        
        if (intersects.length > 0) {
            const point = intersects[0].point;
            const isReducing = event.ctrlKey;
            const radius = 5; // Radius of effect in world units
            const strength = isReducing ? -0.2 : 0.2; // Height adjustment per frame
            
            this.worldManager.modifyHeight(point, radius, strength);
        }
    }
}
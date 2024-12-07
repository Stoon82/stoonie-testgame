import * as THREE from 'three';
import WorldManager from './WorldManager.js';
import EntityManager from './EntityManager.js';
import SoulManager from './SoulManager.js';
import UIManager from './UIManager.js';
import DebugManager from './DebugManager.js';
import UIOverlay from '../ui/UIOverlay.js';
import NeedsManager from './NeedsManager.js';
import VicinityManager from './VicinityManager.js';
import InitManager from './InitManager.js';
import SelectionManager from './SelectionManager.js';
import InputManager from './InputManager.js';

export default class GameEngine {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        this.raycaster = new THREE.Raycaster();
        this.age = 0; // Add game age tracking
        
        // Initialize all managers
        this.initManager = new InitManager(this);
        this.worldManager = new WorldManager(this);
        this.entityManager = new EntityManager(this);
        this.soulManager = new SoulManager(this);
        this.uiManager = new UIManager(this);
        this.debugManager = new DebugManager(this);
        this.uiOverlay = new UIOverlay(this);
        this.needsManager = new NeedsManager(this);
        this.vicinityManager = new VicinityManager(this);
        this.selectionManager = new SelectionManager(this);
        this.inputManager = new InputManager(this);
        
        this.selectedEntity = null;
        this.initialized = false;

        // Register managers with InitManager
        this.initManager.registerManager('worldManager', this.worldManager);
        this.initManager.registerManager('entityManager', this.entityManager);
        this.initManager.registerManager('soulManager', this.soulManager);
        this.initManager.registerManager('uiManager', this.uiManager);
        this.initManager.registerManager('debugManager', this.debugManager);
        this.initManager.registerManager('uiOverlay', this.uiOverlay);
        this.initManager.registerManager('needsManager', this.needsManager);
        this.initManager.registerManager('vicinityManager', this.vicinityManager);
        this.initManager.registerManager('selectionManager', this.selectionManager);
        this.initManager.registerManager('inputManager', this.inputManager);
    }

    async initialize() {
        try {
            if (this.initialized) return;
            console.log('Initializing GameEngine');

            // Initialize core components first
            this.setupRenderer();
            this.setupCamera();

            // Initialize managers through InitManager
            await this.initManager.initializeGame();

            // Setup window resize handler
            window.addEventListener('resize', this.onWindowResize.bind(this));

            this.initialized = true;
            this.update();
        } catch (error) {
            console.error('Failed to initialize game:', error);
            throw error;
        }
    }

    setupRenderer() {
        // Initialize renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true // Enable transparency
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        // Set renderer DOM element properties
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '0';
    }

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
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update() {
        if (!this.initialized) return;

        const deltaTime = this.clock.getDelta();
        this.age += deltaTime;

        // Update all managers
        this.inputManager.update(deltaTime);
        this.worldManager.update(deltaTime);
        this.entityManager.update(deltaTime);
        this.needsManager.update(deltaTime);
        this.vicinityManager.update(deltaTime);
        this.uiManager.update(deltaTime);
        this.debugManager.update(deltaTime);

        // Render the scene
        if (this.renderer && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }

        // Request next frame
        requestAnimationFrame(this.update.bind(this));
    }

    selectEntity(entity) {
        this.selectedEntity = entity;
    }

    deselectEntity() {
        this.selectedEntity = null;
    }
}

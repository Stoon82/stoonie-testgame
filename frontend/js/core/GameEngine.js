import * as THREE from 'three';
import WorldManager from './WorldManager.js';
import EntityManager from './EntityManager.js';
import SoulManager from './SoulManager.js';
import UIManager from './UIManager.js';
import DebugManager from './DebugManager.js';
import UIOverlay from '../ui/UIOverlay.js';
import InitManager from './InitManager.js';
import NeedsManager from './NeedsManager.js';
import VicinityManager from './VicinityManager.js';

export default class GameEngine {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        this.raycaster = new THREE.Raycaster();
        
        // Initialize all managers
        this.initManager = new InitManager(this);
        this.worldManager = new WorldManager(this);
        this.entityManager = new EntityManager(this);
        this.soulManager = new SoulManager(this);
        this.uiManager = new UIManager(this);
        this.debugManager = new DebugManager(this);
        this.uiOverlay = new UIOverlay(this);
        this.needsManager = new NeedsManager();
        this.vicinityManager = new VicinityManager(this);
        
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
            this.animate();
        } catch (error) {
            console.error('Failed to initialize game:', error);
            throw error;
        }
    }

    setupRenderer() {
        // Initialize renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);
    }

    setupCamera() {
        // Initialize camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 10, 20);
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

        // Update all managers
        if (this.worldManager && typeof this.worldManager.update === 'function') {
            this.worldManager.update(deltaTime);
        }
        if (this.entityManager && typeof this.entityManager.update === 'function') {
            this.entityManager.update(deltaTime);
        }
        if (this.soulManager && typeof this.soulManager.update === 'function') {
            this.soulManager.update(deltaTime);
        }
        if (this.needsManager && typeof this.needsManager.update === 'function') {
            this.needsManager.update(deltaTime);
        }
        if (this.vicinityManager && typeof this.vicinityManager.update === 'function') {
            this.vicinityManager.update(deltaTime);
        }
        if (this.uiManager && typeof this.uiManager.update === 'function') {
            this.uiManager.update(deltaTime);
        }
        if (this.debugManager && typeof this.debugManager.update === 'function') {
            this.debugManager.update(deltaTime);
        }
        if (this.uiOverlay && typeof this.uiOverlay.update === 'function') {
            this.uiOverlay.update(deltaTime);
        }
    }

    animate() {
        if (!this.initialized) return;

        requestAnimationFrame(this.animate.bind(this));
        this.update();
        this.renderer.render(this.scene, this.camera);
    }

    selectEntity(entity) {
        this.selectedEntity = entity;
    }

    deselectEntity() {
        this.selectedEntity = null;
    }
}

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { WorldManager } from './WorldManager.js';
import { EntityManager } from './EntityManager.js';
import { UIManager } from './UIManager.js';
import { DebugManager } from './DebugManager.js';
import { UIOverlay } from './UIOverlay.js';

class GameEngine {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();
        this.clock = new THREE.Clock();
        
        // Managers
        this.worldManager = new WorldManager(this.scene);
        this.entityManager = new EntityManager(this.scene);
        this.uiManager = null; // Will be initialized after camera setup
        this.debugManager = new DebugManager(this);
        this.uiOverlay = null;
        
        this.init();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        // Setup camera
        this.camera.position.set(0, 15, 25);
        this.camera.lookAt(0, 0, 0);

        // Setup controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        
        // Initialize UI manager (after camera is set up)
        this.uiManager = new UIManager(this.scene, this.camera);
        
        // Initialize UI overlay
        this.uiOverlay = new UIOverlay(this);
        
        // Setup lighting
        this.setupLighting();
        
        // Initialize world
        this.worldManager.initializeWorld();
        
        // Create some initial entities
        this.entityManager.createStoonie({ gender: 'male', position: new THREE.Vector3(-5, 1, 0) });
        this.entityManager.createStoonie({ gender: 'female', position: new THREE.Vector3(5, 1, 0) });
        this.entityManager.createDemonStoonie({ position: new THREE.Vector3(0, 1, -10) });
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0x404040);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(ambientLight, directionalLight);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update() {
        const deltaTime = this.clock.getDelta();
        this.worldManager.update(deltaTime);
        this.entityManager.update(deltaTime);
        this.uiManager.update(deltaTime);
        this.debugManager.update();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    gameLoop() {
        requestAnimationFrame(() => this.gameLoop());
        this.update();
        this.render();
    }

    start() {
        this.gameLoop();
    }
}

export default GameEngine;

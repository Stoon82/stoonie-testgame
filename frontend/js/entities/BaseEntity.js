import * as THREE from 'three';

export default class BaseEntity {
    constructor(id, config = {}, gameEngine) {
        this.id = id;
        this.gameEngine = gameEngine;
        this.mesh = null;
        this._position = new THREE.Vector3();
        if (config.position) {
            this._position.copy(config.position);
        }
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        
        // Basic properties
        this.health = 100;
        this.energy = 100;
        this.age = 0;

        // Damage properties
        this.lastDamageTime = 0;
        this.damageCooldown = 0.5; // Half second between damage instances
        this._isDead = false;

        // Damage indicator properties
        this.damageIndicators = [];
        this.damageIndicatorLifetime = 5.0; // Increased to 5 seconds
    }

    get position() {
        return this._position;
    }

    set position(value) {
        if (value instanceof THREE.Vector3) {
            this._position.copy(value);
        } else {
            this._position.set(value.x || 0, value.y || 0, value.z || 0);
        }
        if (this.mesh) {
            this.mesh.position.copy(this._position);
        }
    }

    getMesh() {
        return this.mesh;
    }

    update(deltaTime) {
        // Update physics
        this.velocity.add(this.acceleration);
        this.velocity.clampLength(0, 5); // Limit max speed
        
        // Update position using the velocity
        const movement = this.velocity.clone().multiplyScalar(deltaTime);
        this._position.add(movement);
        
        if (this.mesh) {
            this.mesh.position.copy(this._position);
        }

        // Apply friction
        this.velocity.multiplyScalar(0.95);
        this.acceleration.multiplyScalar(0);

        this.age += deltaTime;
        
        // Update damage indicators
        this.updateDamageIndicators(deltaTime);

        // Check for death
        if (this.isDead() && !this._isDead) {
            this._isDead = true;
            console.log(`${this.constructor.name} #${this.id} has died`);
            // Remove from scene after a short delay to show death effects
            setTimeout(() => {
                if (this.gameEngine && this.gameEngine.entityManager) {
                    this.gameEngine.entityManager.removeEntity(this);
                }
            }, 1000);
        }
    }

    createMesh() {
        if (this.mesh) {
            // Store reference to the entity in the mesh for raycasting
            this.mesh.entity = this;
            // Also store in all child meshes
            this.mesh.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.entity = this;
                }
            });
        }
    }

    createDamageIndicator(amount) {
        console.log(`Creating damage indicator for ${this.constructor.name} #${this.id} - Amount: ${amount}`);
        const scene = this.gameEngine.scene;
        const camera = this.gameEngine.camera;
        if (!scene || !camera) {
            console.warn('No scene or camera found for damage indicator');
            return;
        }

        // Create text geometry for damage number
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512; // Increased for better visibility
        canvas.height = 256;
        
        // Clear canvas with semi-transparent background for better visibility
        context.fillStyle = 'rgba(0, 0, 0, 0.3)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set up text style
        const text = `-${Math.round(amount)}`;
        context.font = 'bold 128px Arial'; // Larger font
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Draw outline (thicker)
        context.strokeStyle = '#000000';
        context.lineWidth = 16;
        context.strokeText(text, canvas.width/2, canvas.height/2);
        
        // Draw text (brighter colors)
        context.fillStyle = amount > 20 ? '#ff0000' : '#ff3333';
        context.fillText(text, canvas.width/2, canvas.height/2);
        
        // Add glow effect
        context.shadowColor = '#ff0000';
        context.shadowBlur = 20;
        context.fillText(text, canvas.width/2, canvas.height/2);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        
        // Create sprite material
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 1.0,
            depthTest: false,
            depthWrite: false,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending // Add glow effect
        });
        
        // Create sprite
        const sprite = new THREE.Sprite(material);
        
        // Set initial position (higher above entity)
        const spritePos = this.position.clone();
        spritePos.y += 3; // Increased height
        spritePos.x += (Math.random() - 0.5) * 0.5;
        spritePos.z += (Math.random() - 0.5) * 0.5;
        sprite.position.copy(spritePos);
        
        // Set larger scale
        const distance = camera.position.distanceTo(spritePos);
        const scale = Math.max(1.0, distance * 0.15); // Increased base scale
        sprite.scale.set(scale, scale * 0.5, 1);
        
        // Make sprite face camera
        sprite.lookAt(camera.position);
        
        // Add to scene
        scene.add(sprite);
        console.log(`Added damage indicator sprite to scene for ${this.constructor.name} #${this.id}`);
        
        // Store indicator data
        this.damageIndicators.push({
            mesh: sprite,
            lifetime: this.damageIndicatorLifetime,
            initialY: spritePos.y,
            initialScale: scale
        });
    }

    updateDamageIndicators(deltaTime) {
        const camera = this.gameEngine.camera;
        if (!camera) {
            console.warn('No camera found for damage indicators');
            return;
        }

        for (let i = this.damageIndicators.length - 1; i >= 0; i--) {
            const indicator = this.damageIndicators[i];
            
            // Update lifetime
            indicator.lifetime -= deltaTime;
            
            // Remove expired indicators
            if (indicator.lifetime <= 0) {
                console.log(`Removing expired damage indicator for ${this.constructor.name} #${this.id}`);
                if (indicator.mesh) {
                    this.gameEngine.scene.remove(indicator.mesh);
                    if (indicator.mesh.material.map) {
                        indicator.mesh.material.map.dispose();
                    }
                    indicator.mesh.material.dispose();
                }
                this.damageIndicators.splice(i, 1);
                continue;
            }
            
            // Update indicator
            if (indicator.mesh) {
                // Slower upward movement
                const progress = 1 - (indicator.lifetime / this.damageIndicatorLifetime);
                const newY = indicator.initialY + progress * 3; // Slower rise
                indicator.mesh.position.y = newY;
                
                // Update scale with pulsing effect
                const pulseScale = 1 + Math.sin(progress * Math.PI * 4) * 0.1;
                const baseScale = indicator.initialScale * pulseScale;
                indicator.mesh.scale.set(baseScale, baseScale * 0.5, 1);
                
                // Make sprite face camera
                indicator.mesh.lookAt(camera.position);
                
                // Update opacity (stay visible longer)
                const opacity = indicator.lifetime > 1.0 ? 1.0 : indicator.lifetime;
                indicator.mesh.material.opacity = opacity;
            }
        }
    }

    applyForce(force) {
        this.acceleration.add(force);
    }

    setPosition(x, y, z) {
        this._position.set(x, y, z);
        if (this.mesh) {
            this.mesh.position.copy(this._position);
        }
    }

    damage(amount) {
        // Check if entity is already dead
        if (this._isDead) return;

        // Check damage cooldown
        if (this.age - this.lastDamageTime < this.damageCooldown) {
            return;
        }

        if (typeof amount !== 'number' || amount < 0) {
            console.warn(`Invalid damage amount: ${amount}`);
            return;
        }

        this.lastDamageTime = this.age;
        this.health = Math.max(0, this.health - amount);
        console.log(`${this.constructor.name} #${this.id} took ${amount.toFixed(1)} damage. Health: ${this.health.toFixed(1)}`);
        
        // Create damage indicator
        this.createDamageIndicator(amount);
    }

    takeDamage(amount) {
        this.damage(amount);
    }

    isDead() {
        return this.health <= 0 || this.energy <= 0;
    }
}

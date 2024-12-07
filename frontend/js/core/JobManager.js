export default class JobManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.jobs = new Map(); // stoonieId -> job
        this.resources = new Map(); // resourceId -> amount
        this.initialized = false;
        
        // Job definitions with their requirements and rewards
        this.jobTypes = {
            'woodcutting': {
                targetType: 'tree',
                range: 1.5,
                workDuration: 3, // seconds
                resourceGain: { 'wood': 1 },
                findTarget: (stoonie) => this.findNearestTree(stoonie)
            }
            // Add more job types here
        };
    }

    async initialize() {
        if (this.initialized) return;
        
        console.log('Initializing JobManager');
        this.initialized = true;
    }

    assignJob(stoonie, jobType, target) {
        if (!this.jobTypes[jobType]) {
            console.error(`Invalid job type: ${jobType}`);
            return false;
        }

        const job = {
            type: jobType,
            target: target,
            progress: 0,
            lastWorkTime: 0
        };

        console.log(`Assigning ${jobType} job to Stoonie ${stoonie.id}`);
        this.jobs.set(stoonie.id, job);
        stoonie.setJob(job);
        return true;
    }

    update(deltaTime) {
        this.jobs.forEach((job, stoonieId) => {
            const stoonie = this.gameEngine.entityManager.entities.get(stoonieId);
            if (!stoonie || stoonie.isDead()) {
                this.jobs.delete(stoonieId);
                return;
            }

            this.updateJob(stoonie, job, deltaTime);
        });
    }

    updateJob(stoonie, job, deltaTime) {
        const jobType = this.jobTypes[job.type];
        if (!jobType) return;

        // Check if we're in range of the target
        const distance = stoonie.position.distanceTo(job.target.position);
        if (distance > jobType.range) {
            // Move towards target
            stoonie.moveTowards(job.target.position);
            return;
        }

        // Perform work
        const currentTime = this.gameEngine.age;
        if (currentTime - job.lastWorkTime >= 1) { // Work tick every second
            job.progress += 1;
            job.lastWorkTime = currentTime;

            // Visual feedback
            this.showWorkEffect(stoonie, job);

            // Check if work is complete
            if (job.progress >= jobType.workDuration) {
                this.completeJob(stoonie, job);
            }
        }
    }

    completeJob(stoonie, job) {
        const jobType = this.jobTypes[job.type];
        
        // Add resources
        Object.entries(jobType.resourceGain).forEach(([resource, amount]) => {
            const current = this.resources.get(resource) || 0;
            this.resources.set(resource, current + amount);
            console.log(`Gained ${amount} ${resource} (Total: ${current + amount})`);
        });

        // Find next target
        const newTarget = jobType.findTarget(stoonie);
        if (newTarget) {
            // Continue with new target
            job.target = newTarget;
            job.progress = 0;
            console.log(`Found new ${job.type} target for Stoonie ${stoonie.id}`);
        } else {
            // No more targets, end job
            this.jobs.delete(stoonie.id);
            stoonie.clearJob();
            console.log(`No more targets for ${job.type}, ending job for Stoonie ${stoonie.id}`);
        }
    }

    findNearestTree(stoonie) {
        // This should be implemented to work with your world/resource system
        // For now, return null to indicate no trees found
        return null;
    }

    showWorkEffect(stoonie, job) {
        // Create a temporary effect mesh
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: job.type === 'woodcutting' ? 0x8B4513 : 0xFFFFFF,
            transparent: true,
            opacity: 0.8
        });
        const effect = new THREE.Mesh(geometry, material);
        
        // Position slightly above the stoonie
        effect.position.copy(stoonie.position);
        effect.position.y += 1;
        
        this.gameEngine.scene.add(effect);
        
        // Animate and remove
        const animate = () => {
            effect.position.y += 0.05;
            effect.material.opacity -= 0.05;
            
            if (effect.material.opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                this.gameEngine.scene.remove(effect);
                effect.geometry.dispose();
                effect.material.dispose();
            }
        };
        animate();
    }
}

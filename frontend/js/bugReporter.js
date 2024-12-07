class BugReporter {
    constructor() {
        this.createUI();
        this.attachEventListeners();
    }

    createUI() {
        // Create overlay container
        this.overlay = document.createElement('div');
        this.overlay.className = 'bug-report-overlay';
        this.overlay.style.display = 'none';
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'bug-report-modal';
        
        // Create content
        modal.innerHTML = `
            <h2>Report a Bug</h2>
            <textarea id="bugDescription" placeholder="Please describe the bug..." rows="5"></textarea>
            <div class="button-container">
                <button id="submitBugReport">Submit</button>
                <button id="cancelBugReport">Cancel</button>
            </div>
        `;
        
        this.overlay.appendChild(modal);
        document.body.appendChild(this.overlay);
        
        // Create the bug report button
        this.reportButton = document.createElement('button');
        this.reportButton.id = 'reportBugButton';
        this.reportButton.textContent = '🐛 Report Bug';
        document.body.appendChild(this.reportButton);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .bug-report-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            
            .bug-report-modal {
                background: white;
                padding: 20px;
                border-radius: 8px;
                width: 80%;
                max-width: 500px;
            }
            
            .bug-report-modal h2 {
                margin-top: 0;
                color: #333;
            }
            
            .bug-report-modal textarea {
                width: 100%;
                padding: 10px;
                margin: 10px 0;
                border: 1px solid #ccc;
                border-radius: 4px;
                resize: vertical;
            }
            
            .button-container {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            
            .button-container button {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            
            #submitBugReport {
                background: #4CAF50;
                color: white;
            }
            
            #cancelBugReport {
                background: #f44336;
                color: white;
            }
            
            #reportBugButton {
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 10px 20px;
                background: #ff9800;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                z-index: 999;
            }
            
            #reportBugButton:hover {
                background: #f57c00;
            }
        `;
        document.head.appendChild(style);
    }

    attachEventListeners() {
        this.reportButton.addEventListener('click', () => this.showOverlay());
        
        document.getElementById('cancelBugReport').addEventListener('click', () => {
            this.hideOverlay();
        });
        
        document.getElementById('submitBugReport').addEventListener('click', () => {
            this.submitBugReport();
        });
    }

    showOverlay() {
        this.overlay.style.display = 'flex';
    }

    hideOverlay() {
        this.overlay.style.display = 'none';
        document.getElementById('bugDescription').value = '';
    }

    async submitBugReport() {
        const description = document.getElementById('bugDescription').value;
        if (!description.trim()) {
            alert('Please provide a bug description');
            return;
        }

        const systemInfo = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            windowSize: `${window.innerWidth}x${window.innerHeight}`
        };

        try {
            const response = await fetch('/api/bug-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description,
                    systemInfo,
                    errorLogs: window.gameErrorLogs || [] // Assuming we're collecting error logs somewhere
                })
            });

            const result = await response.json();
            
            if (result.success) {
                alert('Bug report submitted successfully!');
                this.hideOverlay();
            } else {
                throw new Error('Failed to submit bug report');
            }
        } catch (error) {
            console.error('Error submitting bug report:', error);
            alert('Failed to submit bug report. Please try again later.');
        }
    }
}

// Initialize the bug reporter when the page loads
window.addEventListener('load', () => {
    window.bugReporter = new BugReporter();
});

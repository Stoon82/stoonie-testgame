export default class MapEditOverlay {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.container = null;
        this.visible = false;
    }

    initialize() {
        this.container = document.createElement('div');
        this.container.className = 'map-edit-overlay';
        this.container.style.cssText = `
            position: absolute;
            top: 50px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 8px;
            color: white;
            display: none;
        `;

        // Create controls
        const controls = [
            {
                type: 'radio',
                name: 'editMode',
                options: [
                    { value: 'raise', label: 'Raise Terrain', checked: true },
                    { value: 'lower', label: 'Lower Terrain' },
                    { value: 'smooth', label: 'Smooth Terrain' }
                ]
            },
            {
                type: 'range',
                label: 'Brush Size',
                min: 1,
                max: 20,
                value: 5,
                onChange: (value) => {
                    this.gameEngine.mapEditManager.setEditRadius(Number(value));
                }
            },
            {
                type: 'range',
                label: 'Brush Strength',
                min: 0.1,
                max: 1.0,
                step: 0.1,
                value: 0.5,
                onChange: (value) => {
                    this.gameEngine.mapEditManager.editStrength = Number(value);
                }
            }
        ];

        // Add controls to container
        controls.forEach(control => {
            const wrapper = document.createElement('div');
            wrapper.style.marginBottom = '10px';

            if (control.type === 'radio') {
                const title = document.createElement('div');
                title.textContent = 'Edit Mode:';
                title.style.marginBottom = '5px';
                wrapper.appendChild(title);

                control.options.forEach(option => {
                    const label = document.createElement('label');
                    label.style.display = 'block';
                    label.style.marginLeft = '10px';

                    const input = document.createElement('input');
                    input.type = 'radio';
                    input.name = control.name;
                    input.value = option.value;
                    input.checked = option.checked || false;
                    input.addEventListener('change', () => {
                        this.gameEngine.mapEditManager.setEditMode(option.value);
                    });

                    label.appendChild(input);
                    label.appendChild(document.createTextNode(' ' + option.label));
                    wrapper.appendChild(label);
                });
            } else if (control.type === 'range') {
                const label = document.createElement('label');
                label.textContent = control.label;
                label.style.display = 'block';
                
                const input = document.createElement('input');
                input.type = 'range';
                input.min = control.min;
                input.max = control.max;
                input.step = control.step || 1;
                input.value = control.value;
                input.style.width = '100%';
                
                const value = document.createElement('span');
                value.textContent = control.value;
                value.style.marginLeft = '10px';
                
                input.addEventListener('input', (e) => {
                    value.textContent = e.target.value;
                    control.onChange(e.target.value);
                });
                
                wrapper.appendChild(label);
                wrapper.appendChild(input);
                wrapper.appendChild(value);
            }

            this.container.appendChild(wrapper);
        });

        document.body.appendChild(this.container);
    }

    show() {
        this.visible = true;
        this.container.style.display = 'block';
    }

    hide() {
        this.visible = false;
        this.container.style.display = 'none';
    }

    cleanup() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

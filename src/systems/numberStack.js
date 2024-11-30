import { GameObjects } from "phaser";

// Configuration class to store all adjustable parameters
export class GameConfig {
    static default = {
        numbers: {
            min: 0,
            max: 6,
            spawnInterval: 500,  // ms
            maxStack: 10
        },
        display: {
            fontSize: '32px',  // Bigger font
            normalColor: '#ffff00', // Yellow color for better visibility
            highlightColor: '#ff0000',
            spacing: 40,  // More space between numbers
            position: { x: 100, y: 50 }  // Position from top-left of screen
        },
        audio: {
            enabled: true,
            successSound: 'success',
            failSound: 'fail'
        },
        difficulty: {
            speedIncrease: 1.1,  // multiplier for spawn interval decrease
            minInterval: 200,    // minimum spawn interval (ms)
            scorePerHit: 100
        }
    };
}

export class NumberStack extends GameObjects.Container {
    constructor(scene, config = {}) {
        const mergedConfig = {
            numbers: { ...GameConfig.default.numbers, ...config.numbers },
            display: { ...GameConfig.default.display, ...config.display },
            audio: { ...GameConfig.default.audio, ...config.audio },
            difficulty: { ...GameConfig.default.difficulty, ...config.difficulty }
        };
        
        super(scene, mergedConfig.display.position.x, mergedConfig.display.position.y);
        
        this.active = false;
        this.config = mergedConfig;
        this.numbers = [];
        this.score = 0;
        this.combo = 0;
        this.lastSpawnTime = 0;
        this.currentInterval = this.config.numbers.spawnInterval;
        
        scene.add.existing(this);
        this.createNumberDisplay();

        // Add a label for the number stack
        this.label = scene.add.bitmapText(
            0, 
            -25,  // Position above the numbers
            "pixelfont",
            "STACK:",
            24
        );
        this.add(this.label);
    }

    createNumberDisplay() {
        this.numberTexts = [];
        for (let i = 0; i < this.config.numbers.maxStack; i++) {
            const text = this.scene.add.bitmapText(
                i * this.config.display.spacing, 
                0, 
                "pixelfont",
                '',
                this.config.display.fontSize
            );
            this.numberTexts.push(text);
            this.add(text);
        }
    }

    generateRandomNumber() {
        return Phaser.Math.Between(
            this.config.numbers.min, 
            this.config.numbers.max
        );
    }

    update(time) {
        if (!this.active) return;
        
        if (time > this.lastSpawnTime + this.currentInterval) {
            this.addNumber();
            this.lastSpawnTime = time;
        }
        this.updateDisplay();
    }

    addNumber() {
        if (this.numbers.length >= this.config.numbers.maxStack) {
            return;
        }

        const newNumber = this.generateRandomNumber();
        this.numbers.unshift(newNumber);
    }

    updateDisplay() {
        this.numberTexts.forEach((text, i) => {
            let displayText = this.numbers[i]?.toString() || '';
            // Optional: add brackets around the last (active) number
            if (i === this.numbers.length - 1 && displayText) {
                displayText = `[${displayText}]`;
            }
            text.setText(displayText);
        });
    }

    checkNumber(pressedNumber) {
        if (!this.active || this.numbers.length === 0) return false;

        // Check the last number (rightmost) in the stack
        if (this.numbers[this.numbers.length - 1] === pressedNumber) {
            this.numbers.pop(); // Remove the last number
            this.combo++;
            this.updateDisplay();
            return true;
        }
        
        this.combo = 0;
        return false;
    }

    getScore() {
        return this.score;
    }

    getCombo() {
        return this.combo;
    }

    start() {
        this.active = true;
        this.numbers = [];
        this.score = 0;
        this.combo = 0;
        this.lastSpawnTime = 0;
        this.currentInterval = this.config.numbers.spawnInterval;
    }

    // Method to change config at runtime
    updateConfig(newConfig) {
        this.config = Phaser.Utils.Objects.DeepMerge({}, this.config, newConfig);
        // Refresh display properties
        this.numberTexts.forEach((text, i) => {
            text.setFontSize(this.config.display.fontSize);
            text.setPosition(i * this.config.display.spacing, 0);
        });
    }
}
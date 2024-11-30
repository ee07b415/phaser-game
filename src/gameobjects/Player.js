import { GameObjects, Physics,  } from "phaser";
import { Bullet } from "./Bullet";

export class Player extends Physics.Arcade.Image {
    scene = null;
    state = "waiting";
    propulsion_fire = null;
    bullets = null;
    
    // Circular movement properties
    centerX = 0;
    centerY = 0;
    radius = 200;  // Fixed radius
    angle = 0;
    moveSpeed = 0.02;
    keys = null;   // For A/D controls
    
    constructor({scene}) {
        super(scene, -190, 100, "player");
        this.scene = scene;
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);

        // Set center point to middle of screen
        this.centerX = this.scene.scale.width / 2;
        this.centerY = this.scene.scale.height / 2;

        // Initialize A and D keys
        this.keys = this.scene.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D
        });

        this.propulsion_fire = this.scene.add.sprite(this.x - 32, this.y, "propulsion-fire");
        this.propulsion_fire.play("fire");

        this.bullets = this.scene.physics.add.group({
            classType: Bullet,
            maxSize: 100,
            runChildUpdate: true
        });
    }

    start() {
        this.state = "start";
    
        // Initial position on the circle
        this.angle = Math.PI;
        this.updatePosition();

        // Simplified start animation
        this.scene.tweens.add({
            targets: this,
            duration: 800,
            ease: "Power2",
            onComplete: () => {
                this.state = "can_move";  // Make sure this is being set
                this.updatePropulsionFire();
            }
        });
    }

    updatePosition() {
        // Calculate new position on the circle
        this.x = this.centerX + Math.cos(this.angle) * this.radius;
        this.y = this.centerY + Math.sin(this.angle) * this.radius;
        
        // Update rotation to face center
        const angleToCenter = Phaser.Math.Angle.Between(
            this.x,
            this.y,
            this.centerX,
            this.centerY
        );
        this.setRotation(angleToCenter + Math.PI/2);

        this.updatePropulsionFire();
    }

    move() {
        if (this.state !== "can_move") return;

        // D key for clockwise movement
        if (this.keys.d.isDown) {
            this.angle += this.moveSpeed;
        }
        // A key for counter-clockwise movement
        if (this.keys.a.isDown) {
            this.angle -= this.moveSpeed;
        }

        this.updatePosition();
    }

    fire(x, y) {
        if (this.state === "can_move") {
            const bullet = this.bullets.get();
            if (bullet) {
                const spawnOffsetX = Math.cos(this.rotation - Math.PI/2) * 16;
                const spawnOffsetY = Math.sin(this.rotation - Math.PI/2) * 16;
                bullet.fire(this.x + spawnOffsetX, this.y + spawnOffsetY, x, y);
            }
        }
    }

    updatePropulsionFire() {
        const offsetX = Math.cos(this.rotation - Math.PI/2) * 32;
        const offsetY = Math.sin(this.rotation - Math.PI/2) * 32;
        this.propulsion_fire.setPosition(this.x + offsetX, this.y + offsetY);
        this.propulsion_fire.setRotation(this.rotation);
    }

    update() {
        this.move();
    }

    fireAtEnemy(targetX, targetY) {
        if (this.state === "can_move") {
            const bullet = this.bullets.get();
            if (bullet) {
                bullet.fire(this.x + 16, this.y + 5, targetX, targetY);
            }
        }
    }
}
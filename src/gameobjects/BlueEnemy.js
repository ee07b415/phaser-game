import { Physics } from "phaser";
import { Bullet } from "./Bullet";

export class BlueEnemy extends Physics.Arcade.Sprite {
    scene = null;
    animation_is_playing = false;
    damage_life_point = 3;
    scale_damage = 4;
    bullets = null;
    lastRockAttackTime = 0;
    rockAttackInterval = 5000; // 5 seconds
    currentPattern = 0;
    isGameActive = false;

    constructor(scene) {
        // Place enemy in center instead of off-screen
        super(scene, scene.scale.width / 2, scene.scale.height / 2, "enemy-blue");
        this.scene = scene;
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        this.setScale(4);
        this.body.setSize(15, 15);
        
        // Set the rotation origin to center for smooth rotation
        this.setOrigin(0.5, 0.5);

        // Make the enemy static since it won't move from center
        this.body.setImmovable(true);

        // Bullets group
        this.bullets = this.scene.physics.add.group({
            classType: Bullet,
            maxSize: 200,
            runChildUpdate: true
        });
    }

    fireCirclePattern(bulletCount = 36) {
        const angleStep = 360 / bulletCount; // Use degrees for clearer math
        
        for (let i = 0; i < bulletCount; i++) {
            const angleDeg = i * angleStep;
            const angleRad = Phaser.Math.DegToRad(angleDeg);
            
            // Create a point 100 pixels away from enemy at the current angle
            const targetPoint = new Phaser.Math.Vector2(this.x, this.y);
            Phaser.Math.RotateAroundDistance(
                targetPoint,
                this.x,
                this.y,
                angleRad,
                100
            );
            
            const bullet = this.bullets.get();
            if (bullet) {
                bullet.fire(this.x, this.y, targetPoint.x, targetPoint.y, "enemy-rock");
            }
        }
    }

    fireSpiralPattern(bulletCount = 20) {
        const angleStep = 360 / bulletCount;
        
        for (let i = 0; i < bulletCount; i++) {
            this.scene.time.delayedCall(i * 50, () => {
                const angleDeg = i * angleStep;
                const angleRad = Phaser.Math.DegToRad(angleDeg);
                
                const targetPoint = new Phaser.Math.Vector2(this.x, this.y);
                Phaser.Math.RotateAroundDistance(
                    targetPoint,
                    this.x,
                    this.y,
                    angleRad,
                    100
                );
                
                const bullet = this.bullets.get();
                if (bullet) {
                    bullet.fire(this.x, this.y, targetPoint.x, targetPoint.y, "enemy-rock");
                }
            });
        }
    }

    fireHeartPattern(bulletCount = 24) {
        const scale = 100;  // Size
        const a = 1;

        // Start from -pi/2 to ensure we start from the top position
        for (let i = 1; i < bulletCount; i++) {
            const t = ((i / bulletCount) * Math.PI * 2) - (Math.PI / 2);
            
            // Heart shape calculation
            const originalX = scale * a * (Math.sin(t) * Math.sqrt(Math.abs(Math.cos(t)))) / (Math.sin(t) + 1.4);
            const originalY = -scale * a * Math.cos(t) * Math.sqrt(Math.abs(Math.cos(t))) / (Math.sin(t) + 1.4);
            
            // Rotate 90 degrees counter-clockwise: (x,y) -> (-y,x)
            const x = -originalY;
            const y = originalX;

            const startPoint = new Phaser.Math.Vector2(
                this.x + x,
                this.y + y
            );

            // Calculate outward direction
            const outwardX = x * 2;
            const outwardY = y * 2;

            const targetPoint = new Phaser.Math.Vector2(
                this.x + outwardX,
                this.y + outwardY
            );

            const bullet = this.bullets.get();
            if (bullet) {
                bullet.fire(startPoint.x, startPoint.y, targetPoint.x, targetPoint.y, "enemy-rock");
                // Ensure all bullets have exactly the same speed
                bullet.speed = Phaser.Math.GetSpeed(200, 1);
            }
        }
    }
    
    start() {
        this.isGameActive = true;
        this.lastRockAttackTime = this.scene.time.now;
        // No need for entrance animation since enemy starts in center
        // You could add a spawn animation here if desired
        this.scene.tweens.add({
            targets: this,
            scale: this.scale_damage,
            duration: 1000,
            ease: "Power2",
        });
    }

    update(player) {
        if (!player || !this.isGameActive) return;

        // Check if it's time for a rock attack
        const currentTime = this.scene.time.now;
        if (currentTime - this.lastRockAttackTime >= this.rockAttackInterval) {
            // Alternate between patterns
            if (this.currentPattern === 0) {
                this.fireHeartPattern();
                this.currentPattern = 1;
            } else {
                this.fireSpiralPattern();
                this.currentPattern = 0;
            }
            this.lastRockAttackTime = currentTime;
        }
    }

    damage(player_x, player_y) {
        if (!this.isGameActive) return;
        const bullet = this.bullets.get();
        if (bullet) {
            bullet.fire(this.x, this.y, player_x, player_y, "enemy-bullet");
        }

        this.anims.play("hit");
        if (!this.animation_is_playing && this.scale_damage > 1) {
            if (this.damage_life_point === 0) {
                this.animation_is_playing = true;
                this.scene.tweens.add({
                    targets: this,
                    scale: --this.scale_damage,
                    duration: 500,
                    ease: "Elastic.In",
                    onComplete: () => {
                        this.damage_life_point = 10;
                        this.animation_is_playing = false;
                    }
                });
            } else {
                this.damage_life_point--;
            }
        }

        // Modified difficulty progression
        // Instead of changing movement speed, could increase bullet speed or fire rate
        if (this.scale_damage === 1) {
            // Implement final phase behavior here
            // For example, increase bullet speed or change bullet patterns
        }
    }

    stop() {
        this.isGameActive = false;
        // Clear all bullets when game ends
        this.bullets.clear(true, true);
    }
}
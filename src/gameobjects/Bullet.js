import { GameObjects, Math } from "phaser";

export class Bullet extends GameObjects.Image
{
    speed;
    flame;
    end_direction = new Math.Vector2(0, 0);

    constructor(scene, x, y) {
        super(scene, x, y, "bullet");
        this.speed = Phaser.Math.GetSpeed(450, 1);
        this.postFX.addBloom(0xffffff, 1, 1, 2, 1.2);
        // Default bullet (player bullet)
        this.name = "bullet";
    }

    fire (x, y, targetX = 1, targetY = 0, bullet_texture = "bullet")
    {
        // Change bullet change texture
        this.setTexture(bullet_texture);

        // Set if it's an enemy bullet based on texture
        this.isEnemyBullet = bullet_texture === "enemy-bullet";

        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);

        // Calculate direction towards target
        if (targetX === 1 && targetY === 0) {
            this.end_direction.setTo(1, 0);
        } else {
            this.end_direction.setTo(targetX - x, targetY - y).normalize();            
        }
    }

    destroyBullet ()
    {
        if (this.flame === undefined) {
            // Create particles for flame
            this.flame = this.scene.add.particles(this.x, this.y, 'flares',
                {
                    lifespan: 250,
                    scale: { start: 1.5, end: 0, ease: 'sine.out' },
                    speed: 200,
                    advance: 500,
                    frequency: 20,
                    blendMode: 'ADD',
                    duration: 100,
                });
                this.flame.setDepth(1);
            // When particles are complete, destroy them
            this.flame.once("complete", () => {
                this.flame.destroy();
            })
        }

        // Destroy bullets
        this.setActive(false);
        this.setVisible(false);
        this.destroy();

    }

    // Update bullet position and destroy if it goes off screen
    update (time, delta)
    {
        this.x += this.end_direction.x * this.speed * delta;
        this.y += this.end_direction.y * this.speed * delta;

        // Verifica si la bala ha salido de la pantalla
        // if (this.x > this.scene.sys.canvas.width || this.x < 0 || this.y > this.scene.sys.canvas.height || this.y < 0) {
        //     this.setActive(false);
        //     this.setVisible(false);
        //     this.destroy();
        // }

        // Check if bullet is out of bounds
        const hitLeft = this.x < 0;
        const hitRight = this.x > this.scene.sys.canvas.width;
        const hitTop = this.y < 0;
        const hitBottom = this.y > this.scene.sys.canvas.height;

        if (hitLeft || hitRight || hitTop || hitBottom) {
            if (this.isEnemyBullet) {
                // Reflect enemy bullets
                if (hitLeft || hitRight) {
                    this.end_direction.x *= -1;
                    this.x = hitLeft ? 0 : this.scene.sys.canvas.width;
                }
                if (hitTop || hitBottom) {
                    this.end_direction.y *= -1;
                    this.y = hitTop ? 0 : this.scene.sys.canvas.height;
                }
                // Create bounce effect
                this.createBounceEffect();
            } else {
                // Destroy player bullets
                this.destroyBullet();
            }
        }
    }

    createBounceEffect() {
        if (!this.bounceEffect) {
            this.bounceEffect = this.scene.add.particles(this.x, this.y, 'flares', {
                lifespan: 150,
                scale: { start: 1.0, end: 0, ease: 'sine.out' },
                speed: 100,
                advance: 250,
                frequency: 15,
                blendMode: 'ADD',
                duration: 50,
            });
            this.bounceEffect.setDepth(1);
            
            this.bounceEffect.once("complete", () => {
                this.bounceEffect.destroy();
                this.bounceEffect = null;
            });
        }
    }
}
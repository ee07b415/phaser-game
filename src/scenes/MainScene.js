import { Scene } from "phaser";
import { Player } from "../gameobjects/Player";
import { BlueEnemy } from "../gameobjects/BlueEnemy";
import { NumberStack } from "../systems/numberStack";  // Import the new system

export class MainScene extends Scene {
    player = null;
    enemy_blue = null;
    cursors = null;

    points = 0;
    game_over_timeout = 20;

    constructor() {
        super("MainScene");
    }

    init() {
        this.cameras.main.fadeIn(1000, 0, 0, 0);
        this.scene.launch("MenuScene");

        // Reset points
        this.points = 0;
        this.game_over_timeout = 20;
    }

    create() {
        this.add.image(0, 0, "background")
            .setOrigin(0, 0);
        this.add.image(0, this.scale.height, "floor").setOrigin(0, 1);

        const gameConfig = {
            numbers: {
                min: 0,
                max: 6,
                spawnInterval: 500,
                maxStack: 10
            },
            display: {
                fontSize: 24,  // Match HUD font size
                spacing: 30,   // Spacing between numbers
                position: { x: 10, y: 40 }  // 10px from left (like points), 40px from top (below points)
            }
        };
    
        // Create number stack as an independent system
        this.numberStack = new NumberStack(this, gameConfig);
        this.numberStack.setVisible(false);

        this.numberKeys = {};
        this.numberKeys[0] = this.input.keyboard.addKey('NUMPAD_ZERO');
        this.numberKeys[1] = this.input.keyboard.addKey('NUMPAD_ONE');
        this.numberKeys[2] = this.input.keyboard.addKey('NUMPAD_TWO');
        this.numberKeys[3] = this.input.keyboard.addKey('NUMPAD_THREE');
        this.numberKeys[4] = this.input.keyboard.addKey('NUMPAD_FOUR');
        this.numberKeys[5] = this.input.keyboard.addKey('NUMPAD_FIVE');
        this.numberKeys[6] = this.input.keyboard.addKey('NUMPAD_SIX');
        

        // Player
        this.player = new Player({ scene: this });

        // Enemy
        this.enemy_blue = new BlueEnemy(this);

        // Cursor keys 
        this.cursors = this.input.keyboard.createCursorKeys();
        this.cursors.space.on("down", () => {
            this.player.fire();
        });
        this.input.on("pointerdown", (pointer) => {
            this.player.fire(pointer.x, pointer.y);
        });

        // Overlap enemy with bullets
        this.physics.add.overlap(this.player.bullets, this.enemy_blue, (enemy, bullet) => {
            bullet.destroyBullet();
            this.enemy_blue.damage(this.player.x, this.player.y);
            this.points += 10;
            this.scene.get("HudScene")
                .update_points(this.points);
        });

        // Overlap player with enemy bullets
        this.physics.add.overlap(this.enemy_blue.bullets, this.player, (player, bullet) => {
            bullet.destroyBullet();
            this.cameras.main.shake(100, 0.01);
            // Flash the color white for 300ms
            this.cameras.main.flash(300, 255, 10, 10, false,);
            this.points -= 10;
            this.scene.get("HudScene")
                .update_points(this.points);
        });

        // This event comes from MenuScene
        this.game.events.on("start-game", () => {
            this.scene.stop("MenuScene");
            this.scene.launch("HudScene", { remaining_time: this.game_over_timeout });
            this.player.start();
            this.enemy_blue.start();

            this.numberStack.setVisible(true);
            this.numberStack.start();

            // Game Over timeout
            this.time.addEvent({
                delay: 1000,
                loop: true,
                callback: () => {
                    if (this.game_over_timeout === 0) {
                        this.enemy_blue.stop();
                        // You need remove the event listener to avoid duplicate events.
                        this.game.events.removeListener("start-game");
                        // It is necessary to stop the scenes launched in parallel.
                        this.scene.stop("HudScene");
                        this.scene.start("GameOverScene", { points: this.points });
                        this.numberStack.active = false;
                        this.numberStack.setVisible(false);
                    } else {
                        this.game_over_timeout--;
                        this.scene.get("HudScene").update_timeout(this.game_over_timeout);
                    }
                }
            });
        });
    }

    update(time) {
        this.player.update();
        this.enemy_blue.update(this.player);

        // Player movement entries
        if (this.cursors.up.isDown) {
            this.player.move("up");
        }
        if (this.cursors.down.isDown) {
            this.player.move("down");
        }

        // Update number stack
        if (this.numberStack && this.numberStack.visible) {
            this.numberStack.update(time);
        }

        // Check number keys
        if (this.player.state === "can_move" && this.numberStack.visible) {
            for (let i = 0; i <= 6; i++) {
                if (Phaser.Input.Keyboard.JustDown(this.numberKeys[i])) {
                    if (this.numberStack.checkNumber(i)) {
                        this.player.fireAtEnemy(this.enemy_blue.x, this.enemy_blue.y);
                    }
                    break;
                }
            }
        }
    }
}
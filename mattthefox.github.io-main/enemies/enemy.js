import { Sprite, Tickable } from '../Undertale.js';

class Enemy extends Tickable {
    constructor(sprite = new Sprite("enemy/dummy")) {
        super()
        this.sprite = sprite;
        this.priority = 5;
        this.name = "Enemy"
        this.attackPattern = [
            {atk: this.testAttack}
        ]
        this.maxhp = 50;
        this.hp = this.maxhp;
    }

    onDamage(damage) {
        console.log("Damaged")
        this.hp = this.hp - damage;
    }

    render() {
        this.sprite.draw(64,64)
    }

    testAttack() {
        console.log("yep")
    }
}

export {Enemy}
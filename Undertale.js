var undertale;
var player;
var canvas;
var canvasElement;
var battlebox;
var textbox;
var bullets;
var masterTick;
var tSounds = {}
var debugCollision = false;
var joystick;
var confirmButton;
var sprites = {};
var sounds = {}
var loadIndicator;
var backButton;
var playerDamageMultiplier;
var globalTime = 0;
var timeDilation = 1;

var battles = [
    {

    }
]

var vertKey = 0;
var horzKey = 0;
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

function SPR(file) {
    let path = "./img/"+file+".png"
    return sprites[path]
}

function SND(file) {
    let path = "./snd/"+file
    return sounds[path]
}

function audioLoop(paths, index, callback) {
    let file = "./snd/"+paths[index];
    let sound = new Howl({
        src: [file]
    });
    //sound.onload = function() {
        sounds[file] = sound;
        console.log(sounds[file])
        if (index < paths.length - 1) {
            audioLoop(paths, index + 1, callback)
        } else {
            callback();
        }
    //}
}

Number.prototype.inRange = function(min, max, inclusive = true) {
    console.log(this)
    if (inclusive) {
        return (this >= min && this <= max)
    } else {
        return (this > min && this < max)
    }
}

function spriteLoop(paths, index, callback) {
    let file = "./img/"+paths[index]+".png";
    console.log(file)
    let image = new Image();
    image.src = file;
    image.onload = function() {
        loadIndicator.innerHTML = "Loaded "+(index + 1)+" of "+paths.length+" sprites"
        sprites[file] = image;
        if (index < paths.length - 1) {
            spriteLoop(paths, index + 1, callback)
        } else {
            callback();
        }
    }
}

function loadAudio(paths, callback) {
    audioLoop(paths,0,callback)
}

function loadSprites(paths, callback) {
    spriteLoop(paths,0,callback)
}

function lerp(min,max,t) {
    return (min*t)+max*(1-t)
}

function playSound(path, loop = false) {
    let file = "./snd/"+path
    var sound = new Howl({
        src: [file],
        loop: loop
    })
    sound.play()
    sounds[file] = sound;
    /*
    sounds[file].currentTime = 0;
    sounds[file].play()
    sounds[file].loop = loop;*/
}

function chooseFlavorText() {
    let aliveEnemies = [];
    for (let x in undertale.battle.enemies) {
        if (undertale.battle.enemies[x].hp > 0 || undertale.battle.enemies[x].mercy < 100) {
            aliveEnemies.push(undertale.battle.enemies[x]);
        }
    }
    console.log(aliveEnemies)

    let randomEnemy = aliveEnemies[(Math.round(Math.random() * (aliveEnemies.length-1)))]
    let randomFlavor = randomEnemy.flavorTexts[Math.round(Math.random() * (randomEnemy.flavorTexts.length-1))]
    textbox.show()
    textbox.setMessage(randomFlavor)
}

function enemyAttackDone() {
    console.log(undertale.tickables)
    if (!player.death) {
        player.chooseSelSprite()
        battlebox.interpTo(32,250,607,385,8);
        player.collides = false;
        player.death = false;
        player.selectMenu = true;
        player.targetSelect = false;
        player.actTargetSelect = false;
        player.actMenu = false;
        player.fightMenu = false;
        player.selectedListItem = 0;
        player.attackMenu = false;
        player.listLength = 0;
        player.attackProg = 1;
        textbox.show()
    }
    let kill = [];
    for (let x = 0; x < undertale.tickables.length; x++) {
        if (undertale.tickables[x].isBullet) {
            //Have to append to another one because itd result in an array that changes while being iterated.
            kill.push(undertale.tickables[x])
        }
    }
    for (let x in kill) {
        kill[x].destroy()
    }
    chooseFlavorText();

}

function playerActDone() {
    textbox.hide()
    for (let x in undertale.battle.enemies) {
        undertale.battle.enemies[x].attack()
    }
    player.drawSoul = true;
    player.collides = true;
    player.x = 312
    player.y = 307
    battlebox.interpTo(235,220,405,395)
}


function printAt(context, text, x, y, lineHeight = 32)
{
    let splits = text.split("\n");
    for (let g in splits) {
        let text = splits[g]
        if (splits[g].startsWith("*")) {
            text = text.slice(1)
            context.fillText("*", x - 32, y+ (g * lineHeight))
        }
        context.fillText(text, x, y + (g * lineHeight));
    }
}

var fontLoaded = false;

canvas = document.querySelector('canvas');
var utFont = new FontFace('utFont', 'url(./DeterminationMono.ttf)');
var menuFont = new FontFace('menuFont','url(./MenuFont.otf)')
var damageFont = new FontFace('damageFont','url(./DamageFont.ttf)')
var bubbleFont = new FontFace("bubbleFont","url(./dotumche-pixel.ttf")

utFont.load().then(function(font){
  document.fonts.add(font);
  menuFont.load().then(function(font){
    document.fonts.add(font);
    damageFont.load().then(function(font){
        document.fonts.add(font);
        bubbleFont.load().then(function(font){
            document.fonts.add(font);
            console.log("Fonts Loaded")
            fontLoaded = true;
        })
      });
  });
});

document.onkeydown = checkKey;
document.onkeyup = checkKeyUp;

function checkKey(e) {
    console.log("asdasd")
    e = e || window.event;
    if (e.keyCode == '38') { // up
        vertKey = -1;
    }
    else if (e.keyCode == '40') { // down
        vertKey = 1
    }
    else if (e.keyCode == '37') { // left
       horzKey = -1
    }
    else if (e.keyCode == '39') { // right
       horzKey = 1
    }
    for (let i in undertale.tickables) {
        undertale.tickables[i].keyPressed(e)
    }
}

function checkKeyUp(e) {
    e = e || window.event;
    if (e.keyCode == '38') {
        vertKey = vertKey > 0 ? 1 : 0
    }
    else if (e.keyCode == '40') {
        vertKey = vertKey < 0 ? -1 : 0
    }
    else if (e.keyCode == '37') {
        horzKey = horzKey > 0 ? 1 : 0
    }
    else if (e.keyCode == '39') {
        horzKey = horzKey < 0 ? -1 : 0
    }
    for (let i in undertale.tickables) {
        undertale.tickables[i].keyReleased(e)
    }
}

class Tickable {
    x = 0;
    y = 0;
    prevX = 0;
    prevY = 0;
    priority = 0;
    sprite;
    collides = true;
    constructor(sprite = new Sprite("soul")) {
        this.sprite = sprite;
        this.collision = new Collision()
    }

    init() {}
    beginTick() {}
    tick() {}
    endTick() {
        this.prevX = this.x;
        this.prevY = this.y;
    }
    changePriority(priority) {
        this.priority = priority;
        undertale.tickables.sort((a, b) => (a.priority - b.priority))
    }
    render() {
        if (this.sprite.loaded) {
            canvas.drawImage(this.sprite.image,0,0);
        }
    }
    destroy() {
        undertale.tickables.splice(undertale.tickables.indexOf(this),1);
    }
    keyPressed(e) {}
    keyReleased(e) {}
    checkCollision() {
        if (this.collides) {
            for (let x in undertale.collision) {
                let c = undertale.collision[x]
                if (true) {
                if (c.inner) {
                        if ((this.x > c.x - (c.x1 - c.x) && this.x < c.x1) && (this.y > c.y - (c.y1 - c.y) && this.y < c.y1)) {
                            if (this.collision.blocking && c.blocking) {
                                if (this.x == this.prevX) { // moving y or 
                                    this.y += (this.prevY-this.y);
                                } else if (this.y == this.prevY) { // moving x
                                    this.x += (this.prevX-this.x);
                                } else {
                                    this.y += (this.prevY-this.y);
                                    this.x += (this.prevX-this.x);
                                }
                            }
                            c.onHit(this);
                            //this.collision.onHit(c)
                        }
                } else {
                        if ((this.x < c.x || this.x > c.x1) || (this.y < c.y || this.y > c.y1)) {
                            if (this.collision.blocking && c.blocking) {
                                if (this.x == this.prevX) { // moving y or 
                                    this.y += (this.prevY-this.y);
                                } else if (this.y == this.prevY) { // moving x
                                    this.x += (this.prevX-this.x);
                                } else {
                                    this.y += (this.prevY-this.y);
                                    this.x += (this.prevX-this.x);
                                }
                            }
                            //c.onHit(this);
                            this.collision.onHit(c)
                        }
                    
                }
            }
            }
        }
    }
}

class Item {
    constructor(name, seriousModeName, func) {
        this.name = name;
        this.seriousModeName = this.name;
        this.func = func;
    }

    onUse() {}

    showMessage(message) {
        textbox.show();
        textbox.setMessage(message);
        textbox.confirmed = function() {
            textbox.hide();
            playerActDone();
        }
    }
}

class BasicHealingItem extends Item {
    constructor(name, seriousModeName, hp, message) {
        super();
        this.name = name;
        this.seriousModeName = seriousModeName;
        this.hp = hp;
        this.message = message;
        this.pMessage = this.message;
    }

    onUse() {
        console.log(this.hp);
        player.hp = Math.min(player.hp + this.hp,player.maxHp)
        if (player.hp >= player.maxHp) {
            if (undertale.battle.seriousMode) {
                this.message = "\n*Your HP were maxed out."
            } else {
                this.message += "\n*Your HP were maxed out!"
            }
        } else {
            if (undertale.battle.seriousMode) {
                this.message = "\n*You restored "+(this.hp)+" HP."
            } else {
                this.message += "\n*You restored "+(this.hp)+" HP!"
            }
        }
        this.showMessage(this.message);
        this.message = this.pMessage;
    }
}

const CinnaBun = new BasicHealingItem("CinnaBun","C. Bun.", 10, "Spicy.")
const Glamburger = new BasicHealingItem("Glamburg", "Burger", 28, "Fabulous!")

class Collision {
    constructor(x,y,x1,y1,blocking = true, inner = true) {
        this.x = x;
        this.y = y;
        this.x1 = x1;
        this.y1 = y1;
        this.blocking = blocking;
        this.inner = inner;
    }

    onHit(other) {
        
    }
}

class MasterTick extends Tickable {

    beginTick() {
    }
    render() {
        canvas.fillStyle = "rgba(0,0,0,1)"
        canvas.fillRect(0,0,640,480)
    }
}

class Color {
    constructor(r, g, b, a = 100) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}

class Vector2 {
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }
}

class Sprite {
    file;
    tint;
    image;
    loaded = false;
    prevLoaded = false;
    scale = new Vector2(1,1);
    x;
    y;
    rot;

    constructor(file, num = 1) {
        this.num = num;
        this.image = SPR(file)
        this.disintegrateTime = 0;
        this.disintegrate = []
        for (let x = 0; x < this.image.naturalHeight; x++) {
            this.disintegrate.push({y: (x * .1) + 32})
        }
        this.disintegrating = false;
        this.tint = new Color(0,0,0,0);
    }

    draw(x = 0,y = 0,frame = 0,rotation = 0, origin = new Vector2(0.5,0.5)) {
        this.x = x;
        this.y = y;
        this.rot = rotation;
        let localOrigin = new Vector2(origin.x * this.image.naturalWidth, origin.y * this.image.naturalHeight)
        canvas.translate(localOrigin.x, localOrigin.y);
        canvas.rotate((Math.PI / 180) * rotation);
        canvas.translate(-localOrigin.x, -localOrigin.y);

        if (this.image.complete) {
            
            let w = this.image.naturalWidth / this.num
            if (this.disintegrating) {
                //this.disintegrateTime += .1
                canvas.drawImage(this.image,frame * w,0,w,this.image.naturalHeight,x,y,w,this.image.naturalHeight);
                // Fade out while it disintegrates +Math.max(30 / this.disintegrateTime,0)+
                canvas.fillStyle = "rgba(0,0,0,"+Math.max(this.disintegrateTime/10,0)+")"
                canvas.fillRect(x,y,this.image.naturalWidth / this.num, this.image.naturalHeight)
                this.disintegrateTime += 1.5
                for (let d in this.disintegrate) {
                    this.disintegrate[d].y -= Math.random() * 4
                    canvas.drawImage(this.image, x + ((Math.random() * 256)) * (this.disintegrateTime/ 64), y + (this.disintegrate[d].y * 2) + d,(Math.max(100 - (this.disintegrateTime * 4), 0)),2)
                }
                /*
                for (let a = 0; a < this.image.naturalHeight; a++) {
                    let b = (this.disintegrateTime+1) * a - this.disintegrateTime * 80
                    canvas.drawImage(this.image,frame * w,a,w,1,x,y + b,w * Math.abs(this.scale.x),Math.abs(this.scale.y));
                }*/
                
            } else {
                canvas.save()
                if (this.scale.x < 0) {
                    canvas.scale(-1,1)
                    canvas.translate(-640,0)
                }
                canvas.drawImage(this.image,frame * w,0,w,this.image.naturalHeight,x,y,w * Math.abs(this.scale.x),this.image.naturalHeight * Math.abs(this.scale.y));
                canvas.restore()
            }
        }
        
        canvas.globalCompositeOperation = "multiply"
        canvas.fillStyle = "rgba("+this.tint.r+","+this.tint.g+","+this.tint.b+","+(this.tint.a / 100)+")"
        canvas.fillRect(x,y,this.image.naturalWidth / this.num,this.image.naturalHeight)
        canvas.rotate((Math.PI / 180) * -rotation);
        canvas.globalCompositeOperation = "source-over"
        canvas.fillStyle = "white"
    }

    img(file) {
        this.image = SPR(file)
    }
}

class AttackFactory {
    // An attack factory can be called for easy creation of attacks
    // that have similar properties.
    // Best fit for fights such as Undyne's spears with the green soul
    // (Input a sequence of arrow characters and it will create the attack
    // as such, therefore removing the need for a big array of objects)
    // Asgore's various circles of fire or Mettaton's disco ball attack.
    constructor(attack, timer = 3) {
        this.timer = timer;
        attack();
        setTimeout(() => {
            if (!player.death) {
                enemyAttackDone()
            }
        },timer * 1000)
    }
}

function basicTextAct(enemy, message, mercyCounter = 0) {
    textbox.show();
    textbox.setMessage(message);
    textbox.confirmed = function() {
        if (mercyCounter != 0) {
            enemy.addMercy(mercyCounter);
        }
        setTimeout(function(self = this) {
            playerActDone();
            textbox.hide();
        }.bind(this),500)
    }
}

// ========================================================================== //
// Enemies

class Enemy extends Tickable {
    mercy = 0;
    maxHp = 1;
    name = "Enemy"
    acts = [
        {"name": "Check", "func": this.actCheck}
    ]
    flavorTexts = [
        "Flavor Text"
    ]
    description = "It's an enemy. Wow."
    sprite = new Sprite("enemy/dummy");
    x = 128;
    y = 64;
    frameNorm = 0;
    frameSpareDeath = 0;
    fearful = true; // Able to be spared instantly when attacked?

    constructor() {
        super()
        this.priority = 5;
        this.visualMercy = this.mercy;
        this.visualHp = this.maxhp;
        this.drawHealthBar = false;
        this.drawMercyBar = false;
        this.xOffset = 0;
        this.spared = false;
        this.textY = 0;
        this.mercyGain = 0;
        this.damageGain = 0;
        this.frame = this.frameNorm;
        this.collides = false;
        this.forcedMercy = false;
        this.enemyNumber = 0;
    }

    init() {
        this.hp = this.maxHp;
        this.x = this.x + (this.enemyNumber * 160)
    }

    get spriteTime() {
        return this.spared ? 0 : globalTime;
    }

    actCheck(self) {
        textbox.show();
        textbox.setMessage(self.description);
        textbox.confirmed = function() {
            playerActDone();
            textbox.hide();
        }
    }

    addMercy(amount) {
        // @todo MERCY: draw amount of damage, play sound after adding an amount of mercy.
        this.textY = 0;
        this.mercyAnimation();
        playSound("snd_spellcast.wav")
        this.mercyGain = amount;
        this.drawMercyBar = true;
        let initMercy = this.mercy;
        this.mercy += amount;
        let time = 0;
        let interval = setInterval(function(self = this) {
            self.visualMercy = lerp(self.mercy, initMercy, time / 20)
            time += 1;
            this.textY += 1;
            if (time > 20) {
                clearInterval(interval)
            }
        }.bind(this),30)
        setTimeout(function(self = this) {
            self.drawMercyBar = false;
        }.bind(this), 2000)
    }

    hurtAnimation(undo) {
        if (!undo) {
            this.frame = this.frameSpareDeath;
        } else {
            this.frame = this.frameNorm;
        }
    }

    mercyAnimation() {
        this.face.tint = new Color(255,255,0,100)
        this.body.tint = new Color(255,255,0,100)
        setTimeout(function(self = this) {
            this.face.tint = new Color(0,0,0,0)
            this.body.tint = new Color(0,0,0,0)
        }.bind(this),200)
    }

    onDamage(damage) {
        // @todo FIGHT: draw amount of damage after being struck.
        //undertale.battle.enemies.splice(undertale.battle.enemies.indexOf(this),1)
        this.textY = 0;
        this.hurtAnimation(false)
        this.damageGain = damage;
        this.drawHealthBar = true;
        if (this.mercy >= 100 && !this.forcedMercy) {
            playSound("snd_damage.wav")
            playSound("snd_damage.wav")
        } else {
            playSound("snd_damage.wav")
        }
        if (this.fearful) {
            this.mercy = 100;
            this.forcedMercy = true;
        }
        let initHp = this.hp;
        this.hp = this.hp - damage;
        let time = 0;
        let curDir = false;
        setTimeout(function(self = this) {
            this.drawHealthBar = false;
        }.bind(this), 1000)
        let interval = setInterval(function(self = this) {
            time += 1;
            this.xOffset = (Math.pow(Math.sin(time),16)) * 16

            this.visualHp = lerp(this.hp, initHp, time / 20)
            if (time > 20) {
                clearInterval(interval)
                this.hurtAnimation(true)
                if (this.hp <= 0) {
                    undertale.battle.enemies.splice(undertale.battle.enemies.indexOf(this),1)
                    this.deathAnimation();
                }
                if (!undertale.battle.winCheck()) {
                    playerActDone()
                }
            }
        }.bind(this),30)
    }

    deathAnimation() {
        playSound("monsterdust.wav")
        this.face.disintegrating = true;
        this.body.disintegrating = true;
    }

    spareAnimation() {
        this.frame = this.frameSpareDeath;
        this.sprite = 50;

        let dust = new SpareDust(this.x + ((this.sprite.image.naturalWidth / this.sprite.num)/2),this.y + (this.sprite.image.naturalHeight / 2));
        undertale.spawn(dust);
    }

    spare() {
        playSound("snd_spare.wav")
        this.spared = true;
        this.spareAnimation();
    }

    deferredRender() {
        this.sprite.draw(this.x + this.xOffset,this.y,this.frame)
    }

    render() {
        this.deferredRender();
        if (this.drawHealthBar) {
            console.log(this.visualHp)
            canvas.fillStyle = 'gray';
            // base
            canvas.fillRect(this.x - 16, 90, 128, 16);
            // actual health
            canvas.fillStyle = 'lime';
            canvas.fillRect(this.x - 16, 90, Math.max((128 * (this.visualHp / this.maxHp)),0), 16);
            canvas.fillStyle = "red"
            canvas.font = "36px damageFont"
            this.textY += .5
            canvas.fillText(Math.ceil(this.damageGain), this.x-24, 80 - this.textY)
        }
        if (this.drawMercyBar) {
            canvas.fillStyle = 'gray';
            // base
            canvas.fillRect(this.x - 16, 90, 128, 16);
            // actual health
            canvas.fillStyle = 'yellow';
            canvas.fillRect(this.x - 16, 90, Math.max((128 * (this.visualMercy / 100)),0), 16);
            canvas.font = "36px damageFont"
            canvas.fillText("+"+this.mercyGain+"%", this.x-24, 80 - this.textY)
        }
    }

    attack() {
        this.testAttack()
    }

    testAttack() {
        new AttackFactory(() => {
            for (let x = 0;x < 5; x++) {
                new Bullet("soul",320+(x*16),240,5,function(){this.y += 2})
            }
        },3)
    }
}

class Froggit extends Enemy {
    mercy = 0;
    maxHp = 15;
    name = "Froggit"
    acts = [
        {"name": "Check", "func": this.actCheck},
        {"name": "Beg", "func": this.actBeg}
    ]
    flavorTexts = [
        "The enemy is malfunctioning.",
        "The enemy wants to attack\nyou... I think?",
        "The enemy is wondering why\nit's a placeholder.",
        "The enemy wishes it could be\nin Deltarune instead.",
        "The enemy is unimpressed with\nthe developer.",
        "The enemy wishes it had a\nremotely challenging attack."
    ]
    description = "It's an enemy. Wow."
    face = new Sprite("enemy/froggit_face",2);
    body = new Sprite('enemy/froggit_body',2)
    x = 64;
    y = 64;
    frameNorm = 0;
    frameSpareDeath = 1;

    actBeg(self) {
        if (self.mercy.inRange(0,24)) {
            basicTextAct(self,"You begged the enemy to make a\nbetter attack.\n*It's listening...", 25);
            self.acts.push({"name":"Assist", "func": self.actAssist})
        } else {
            basicTextAct(self, "For some reason, you keep begging\nthe enemy.\n*It think you're a real a nutcase!")
        }
    }

    actAssist(self) {
        this.flavorTexts = ["The enemy is waiting for your next idea."]
        if (self.mercy.inRange(25, 49, true)) {
            basicTextAct(self,"You gave the enemy some ideas for\nan attack.", 25);
        } else if (self.mercy < 100) {
            basicTextAct(self,"You keep giving it ideas. You're\nspeaking so fast it can't even\nunderstand!",50);
        } else {
            basicTextAct(self,"The enemy gets your point by now...")
        }
    }

    deathAnimation() {
        playSound("monsterdust.wav")
        this.face.disintegrating = true;
        this.body.disintegrating = true;
    }

    spareAnimation() {
        this.frame = this.frameSpareDeath;
        this.body.tint = new Color(0,0,0,50);
        this.face.tint = new Color(0,0,0,50);

        let dust = new SpareDust(this.x + ((this.sprite.image.naturalWidth / this.sprite.num)/2),this.y + (this.sprite.image.naturalHeight / 2));
        undertale.spawn(dust);
    }

    deferredRender() {
        let f = Math.round((globalTime) * 2 % 2)
        this.face.draw(this.x + this.xOffset + Math.sin(this.spriteTime * .1) * 5,this.y + Math.sin(this.spriteTime * .2) * 2,f)
        this.body.draw(this.x + this.xOffset * 2,this.y + 62,f)
    }

    attack() {
        let m = new TextBubble("Ribbit, ribbit.", this.face);
        m.confirmed = this.testAttack;
    }

    testAttack() {
        var q = Math.round(Math.random()*16 + 1)
        console.log(q)
        new AttackFactory(() => {
            for (let x = 0;x < q; x++) {
                let p = x % 2 == 0 ? 1 : -1
                new Bullet("soul",240+(x*(256/q)),200,5,function(){
                    this.y += 2 + Math.sin(x)
                    this.x = 240 + (x*(256/q)) + Math.sin(globalTime * .03) * p * 64
                })
            }
        },3)
    }
}

class MettatonEX extends Enemy {
    mercy = 0;
    maxHp = 120;
    name = "Mettaton EX"
    acts = [
        {"name": "Check", "func": this.actCheck}
    ]
    flavorTexts = [
        "Smells like Mettaton."
    ]
    description = "It's an enemy. Wow."
    body = new Sprite("enemy/mex_body",6);
    face = new Sprite('enemy/mex_face',13)
    armL = new Sprite("enemy/mex_arms",6)
    armR = new Sprite("enemy/mex_arms",6)
    x = 270;
    y = 32;
    frameNorm = 0;
    frameSpareDeath = 1;
    pose = 1;

    init() {
        this.body.scale = new Vector2(2,2);
        this.face.scale = new Vector2(2,2)
        this.armL.scale = new Vector2(2,2)
        this.armR.scale = new Vector2(-2,2)
    }

    actBeg(self) {
        if (self.mercy.inRange(0,24)) {
            basicTextAct(self,"You begged the enemy to make a\nbetter attack.\n*It's listening...", 25);
            self.acts.push({"name":"Assist", "func": self.actAssist})
        } else {
            basicTextAct(self, "For some reason, you keep begging\nthe enemy.\n*It think you're a real a nutcase!")
        }
    }

    actAssist(self) {
        this.flavorTexts = ["The enemy is waiting for your next idea."]
        if (self.mercy.inRange(25, 49, true)) {
            basicTextAct(self,"You gave the enemy some ideas for\nan attack.", 25);
        } else if (self.mercy < 100) {
            basicTextAct(self,"You keep giving it ideas. You're\nspeaking so fast it can't even\nunderstand!",50);
        } else {
            basicTextAct(self,"The enemy gets your point by now...")
        }
    }

    deathAnimation() {
        playSound("monsterdust.wav")
        this.face.disintegrating = true;
        this.body.disintegrating = true;
    }

    spareAnimation() {
        this.frame = this.frameSpareDeath;
        this.body.tint = new Color(0,0,0,50);
        this.face.tint = new Color(0,0,0,50);

        let dust = new SpareDust(this.x + ((this.sprite.image.naturalWidth / this.sprite.num)/2),this.y + (this.sprite.image.naturalHeight / 2));
        undertale.spawn(dust);
    }

    deferredRender() {
        let b;
        switch (this.pose) {
            case 0: // crouch
                b = new Vector2(this.x - 32 + this.xOffset + (Math.sin(this.spriteTime * .25) * 1),this.y + 62 + (Math.cos(this.spriteTime * .25) * 1))
                this.armL.draw(b.x - 28,b.y,this.frame)
                this.armR.draw(-b.x + 460,b.y,this.frame)
                this.body.draw(b.x,b.y,this.frame)
                this.face.draw(this.x + this.xOffset,this.y + Math.sin(this.spriteTime * .25) * 1.5,this.frame)
            break;

            case 1: // to the sky
                b = new Vector2(this.x - 32 + this.xOffset + (Math.sin(this.spriteTime * .25) * 1),this.y + 62 + (Math.cos(this.spriteTime * .25) * 1))
                this.armL.draw(b.x + 30,b.y - 100,5)
                this.armR.draw(-b.x + 490,b.y - 56,2)
                this.body.draw(b.x,b.y,0)
                this.face.draw(this.x + this.xOffset,this.y + Math.sin(this.spriteTime * .25) * 1.5,12)
            break;
        }
    }

    attack() {
        this.testAttack()
    }

    testAttack() {
        new AttackFactory(() => {
            for (let x = 0;x < 5; x++) {
                new Bullet("soul",320+(x*16),240,5,function(){this.y += 2})
            }
        },3)
    }
}

class SpareDust extends Tickable {
    x;
    y;
    constructor(x,y) {
        super()
        // @todo import smoke sprites, finish this
        this.smoke = new Sprite("ui/ut_smoke")
        this.move = 0; 
        this.priority = 19;
        this.x = x;
        this.y = y;
        this.collides = false;
    }

    tick() {
        this.move += 1;
        if (this.move > 8) {
            this.destroy();
        }
    }

    render() {
        let m = Math.min(this.move * 6,40)
        this.smoke.draw(this.x - m,this.y - m)
        this.smoke.draw(this.x - m,this.y + m)
        this.smoke.draw(this.x + m,this.y - m)
        this.smoke.draw(this.x + m,this.y + m)
    }
}

class Bullet extends Tickable {
    time;
    isBullet = true;
    constructor(sprite, x, y, damage = 5, movement, collisionWidth = 16, collisionHeight = 16) {
        super()
        this.sprite = new Sprite(sprite);
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.time = 0
        this.collides = true;
        this.collisionWidth = collisionWidth;
        this.collisionHeight = collisionHeight;
        this.collision = new Collision(x,y,x+collisionWidth,y+collisionHeight)
        this.collision.blocking = false;
        this.movement = movement;
        this.collision.onHit = function(other) {
            if (other == player) {
                if (player.invincibility == 0) {
                    player.invincibility = 35;
                    player.onDamage(damage)
                }

            }
        }
        undertale.collision.push(this.collision)
        undertale.spawn(this)
    }

    movement() {}

    destroy() {
        undertale.tickables.splice(undertale.tickables.indexOf(this),1);
        undertale.collision.splice(undertale.collision.indexOf(this.collision),1);
    }

    tick() {
        this.time += 1;
        this.movement()
        this.collision.x = this.x;
        this.collision.y = this.y
        this.collision.x1 = this.x + this.collisionWidth;
        this.collision.y1 = this.y + this.collisionHeight;
    }

    render() {
        this.sprite.draw(this.x,this.y);
    }
}

class SoulMode {
    color = new Color(255,0,0)
    sprite;
    shards = false;
    shard1 = new Vector2(0,0)
    shard2 = new Vector2(0,0)
    shard3 = new Vector2(0,0)
    shard4 = new Vector2(0,0)
    shard5 = new Vector2(0,0)
    constructor(owner) {
        this.sprite = new Sprite("soul");
        this.owner = owner;
    }

    keyPressed(e) {

    }

    hurtCondition() {
        return false;
    }

    tick() {
        if (!this.owner.death) {
            this.owner.x += horzKey * 3;
            this.owner.y += vertKey * 3;
        }
    }

    render() {
        let trueColor = this.color;
        if (this.owner.invincibility > 0) {
            let s = Math.sin(this.owner.invincibility * 1) + 1.5
            trueColor = new Color(this.color.r * s,this.color.g * s,this.color.b * s)
        }
        this.sprite.tint = trueColor;
        if (!this.shards) {
            this.sprite.draw(this.owner.x,this.owner.y)
        } else {
            this.sprite.draw(this.shard1.x,this.shard1.y)
            this.sprite.draw(this.shard2.x,this.shard2.y)
            this.sprite.draw(this.shard3.x,this.shard3.y)
            this.sprite.draw(this.shard4.x,this.shard4.y)
            this.sprite.draw(this.shard5.x,this.shard5.y)

        }
    }
}

class SoulModeBlue extends SoulMode {
    color = new Color(0,0,255)
    velocity = 0;
    jumpTimer = 0;
    touchingGround;
}

class SoulModeYellowBullet extends Tickable {
    constructor() {
        super()
        this.sprite = new Sprite("soul_shard")
    }

    tick() {
        this.y -= 1
    }

    render() {
        this.sprite.draw(this.x,this.y)
    }
}

class SoulModeYellow extends SoulMode {
    color = new Color(255,255,0)

    tick() {
        super.tick();
    }

    keyPressed(e) {
        if (e.keyCode == 90 || e.keyCode == 13) { // Z
            playSound("snd_heartshot.wav")
            let bullet = new SoulModeYellowBullet()
            bullet.x = this.x
            bullet.y = this.y
            undertale.spawn(bullet)
        }
    }

    render() {
        super.render();
    }
}

class SoulModePurple extends SoulMode {
    color = new Color(225,0,255)
    velocity = 0;
    jumpTimer = 0;
    touchingGround;
    line = 0;
    moveCooldown = false

    tick() {
        if (!this.owner.death) {
            this.owner.x += horzKey * 2;
        }
        if (!this.moveCooldown) {
                this.owner.y += vertKey * 64
                this.moveCooldown = true
        }
        if (vertKey == 0) {
            this.moveCooldown = false;
        }
    }

    render() {
        super.render()
    }
}

class Soul extends Tickable {
    fightButton;
    death = false;
    selectMenu = true;
    targetSelect = false;
    actTargetSelect = false;
    fightMenu = false;
    actMenu = false;
    selectedListItem = 0;
    attackMenu = false;
    itemSelect = false;
    listLength = 0;
    attackProg = 1;
    invincibility = 0;
    drawUi = true;
    drawSoul = true;
    selectedActTarget = 0;
    

    constructor() {
        super();
        this.mode = new SoulMode(this);
        this.maxHp = ((undertale.love-1) * 3.78) + 20
        this.hp = this.maxHp
        this.selectedAct = 0;
        this.fightButton = new Sprite("ui/_fight")
        this.actButton = new Sprite("ui/act")
        this.itemButton = new Sprite("ui/item")
        this.mercyButton = new Sprite("ui/mercy")
        this.battleSlash = new Sprite("battle_slash")
        this.attackBar = new Sprite("ui/attackbar")
        this.list = []
        this.collides = false;
    }

    tick() {
        if (this.invincibility > 0) {
            this.invincibility -= 1;
        }
        this.mode.tick()
        if (this.mode.hurtCondition) {
            // death
        }
        if (this.selectMenu) {
            // 40, 195
            this.x = 40 + (this.selectedAct * 156)
            this.y = 445
        }
        if (this.targetSelect || this.actTargetSelect || this.actMenu || this.itemSelect) {
            this.x = 55 + (Math.floor((this.selectedListItem % 2) * 215))
            this.y = 278 + (Math.floor(this.selectedListItem/2)) * 32
        }
    }

    onDamage(hp) {
        this.hp -= hp;
        if (this.hp <= 0 && !this.death) {
            this.hp = 0;
            console.log(sounds[undertale.battle.music])
            SND(undertale.battle.music).pause()
            SND(undertale.battle.music).currentTime = 0
            this.collides = false;
            this.death = true;
            this.invincibility = -5
            masterTick.changePriority(10)
            this.changePriority(11)
            this.drawUi = false;
            setTimeout(function(self = this) {
            
            playSound("snd_dbreak.wav")
            this.mode.sprite.img("soul_dead")
            this.x -= 1;
            console.log('dead')
            setTimeout(function(self = this) {
                playSound("snd_dbreak2.wav")
                self.mode.sprite.img("soul_shard")
                self.mode.shards = true;
                self.collides = false;
                self.mode.shard1.y = self.y
                self.mode.shard1.x = self.x
                self.mode.shard2.y = self.y
                self.mode.shard2.x = self.x
                self.mode.shard3.y = self.y
                self.mode.shard3.x = self.x
                self.mode.shard4.y = self.y
                self.mode.shard4.x = self.x
                self.mode.shard5.y = self.y
                self.mode.shard5.x = self.x
                var boost = 16;
                self.tick = function() {
                    boost -= 1;
                    self.mode.shard1.y += (self.mode.shard1.y * 0.02)-(boost/2)
                    self.mode.shard1.x += 5
                    self.mode.shard2.y += (self.mode.shard2.y * 0.01)-boost
                    self.mode.shard2.x += 2
                    self.mode.shard3.y += (self.mode.shard3.y * 0.02)-(boost/3)
                    self.mode.shard3.x -= 4
                    self.mode.shard4.y += (self.mode.shard4.y * 0.03)-boost
                    self.mode.shard4.x -= 4
                    self.mode.shard5.y += (self.mode.shard5.y * 0.03)-boost
                    self.mode.shard5.x += 2
                }
            }.bind(this),1000)
        }.bind(this),650)
        } else if (!this.death) {
            playSound("hurt.wav")
        }
    }

    chooseSelSprite() {
        this.fightButton.img("ui/fight")
                this.actButton.img("ui/act")
                this.itemButton.img("ui/item")
                this.mercyButton.img("ui/mercy")
                switch (this.selectedAct) {
                    case 0:
                        this.fightButton.img("ui/_fight")
                    break;

                    case 1:
                        this.actButton.img("ui/_act")
                    break;

                    case 2:
                        this.itemButton.img("ui/_item")
                    break;

                    case 3:
                        this.mercyButton.img("ui/_mercy")
                    break;
                }
    }

    keyPressed(e) {
        let clearSelection = false;
        if (!this.death) {
            this.mode.keyPressed(e)
        let h = 0;
        let v = 0;
        if (e.keyCode == 90 || e.keyCode == 13) { // Z
            clearSelection = true;
            if (this.targetSelect) {
                this.targetSelect = false;
                this.attackMenu = true;
                this.drawSoul = false;
                undertale.spawn(new AttackBar(5 + ((undertale.love-1) * 56)))
            } else if (this.actTargetSelect) {
                this.selectedActTarget = this.selectedListItem;
                this.selectedListItem = 0;
                this.actTargetSelect = false;
                this.actMenu = true;
                this.list = []
                for (let o in undertale.battle.enemies[this.selectedActTarget].acts) {
                    let e = undertale.battle.enemies[this.selectedActTarget].acts;
                    this.list.push(e[o].name);
                }
            } else if (this.actMenu) {
                this.targetSelect = false;
                this.actMenu = false;
                this.drawSoul = false;
                let e = undertale.battle.enemies[this.selectedActTarget]
                e.acts[this.selectedListItem].func(e);
            } else if (this.itemSelect) {
                this.itemSelect = false;
                this.drawSoul = false;
                undertale.battle.items[this.selectedListItem].onUse();
                undertale.battle.items.splice(this.selectedListItem,1)
            }

            if (this.selectMenu || this.fightMenu || this.actTargetSelect || this.actMenu) {
                playSound("snd_select.wav");
            }
            if (this.selectMenu) {
                this.selectMenu = false;
                switch (this.selectedAct) {
                    case 0: // fight
                        this.selectedListItem = 0;
                        this.targetSelect = true;
                        this.list = []
                        for (let x in undertale.battle.enemies) {
                            this.list.push(undertale.battle.enemies[x].name)
                        }
                        this.listLength = undertale.battle.enemies.length
                        textbox.hide();
                    break;

                    case 1: // act
                        this.selectedListItem = 0;
                        this.actTargetSelect = true;
                        this.list = []
                        textbox.hide();
                        for (let x in undertale.battle.enemies) {
                            this.list.push(undertale.battle.enemies[x].name)
                        }
                    break;

                    case 2: // item
                        if (undertale.battle.items.length != 0) {
                            this.selectedListItem = 0;
                            this.itemSelect = true;
                            this.list = []
                            textbox.hide();
                            for (let x in undertale.battle.items) {
                                this.list.push(undertale.battle.items[x].name)
                            }
                        } else {
                            clearSelection = false;
                        }
                    break;

                    case 3: // Spare
                        let foundOne = false;
                        let THEDEADONES = []
                        for (let x in undertale.battle.enemies) {
                            if (undertale.battle.enemies[x].mercy >= 100) {
                                foundOne = true;
                                undertale.battle.enemies[x].spare();
                                THEDEADONES.push(undertale.battle.enemies[x])
                            }
                        }
                        if (!foundOne) {
                            textbox.show();
                            textbox.setMessage("But nobody's names were yellow...")
                            textbox.confirmed = function() {
                                console.log("efdffjkwfjn")
                                playerActDone();
                                textbox.hide();
                            }
                        } else {
                            setTimeout(function() {
                                // If we didn't win,
                                // Retire all spared enemies
                                for (let x in THEDEADONES) {
                                    undertale.battle.enemies.splice(undertale.battle.enemies.indexOf(THEDEADONES[x]),1)
                                }
                                if (!undertale.battle.winCheck()) {
                                    playerActDone();
                                }
                            },1)
                        }
                    break;
                }
            }
        }

        if (e.keyCode == 88 || e.keyCode == 16) {
            if (this.targetSelect || this.actTargetSelect || this.itemSelect) {
                this.targetSelect = false;
                this.actTargetSelect = false;
                this.selectMenu = true;
                this.itemSelect = false;
                this.actMenu = false;
                textbox.show()
                chooseFlavorText();
            }
            if (this.actMenu) {
                this.actMenu = false;
                this.actTargetSelect = true;
                this.selectedListItem = 0;
                this.actTargetSelect = true;
                this.list = []
                textbox.hide();
                for (let x in undertale.battle.enemies) {
                    this.list.push(undertale.battle.enemies[x].name)
                }
            }
        }

        if (e.keyCode == '38') { // up
            v = -1;
        }
        else if (e.keyCode == '40') { // down
            v = 1
        }
        else if (e.keyCode == '37') { // left
           h = -1
        }
        else if (e.keyCode == '39') { // right
           h = 1
        }

        if (this.targetSelect || this.actTargetSelect || this.actMenu || this.itemSelect) {
            if (v != 0) {
                playSound("snd_squeak.wav")
                this.selectedListItem = clamp(this.selectedListItem + (v * 2),0,this.list.length - 1)
            }
            if (h != 0) {
                playSound("snd_squeak.wav")
                this.selectedListItem = clamp(this.selectedListItem + h,0,this.list.length - 1)
                console.log(this.selectedListItem)
            }
        }

        if (this.selectMenu) {
            this.selectedAct = clamp(this.selectedAct + h, 0, 3);

            //if (h != 0) {
                playSound("snd_squeak.wav")
                this.chooseSelSprite();
                
            //}
        }
        if (clearSelection) {
            this.fightButton.img("ui/fight")
            this.actButton.img("ui/act")
            this.itemButton.img("ui/item")
            this.mercyButton.img("ui/mercy")
        }
    }
    }

    changeSoulMode(mode) {
        this.mode = new mode;
    }

    render() {

        if (this.drawUi) {
        //canvas.globalCompositeOperation = "lighter"
        this.fightButton.draw(32,432)
        this.actButton.draw(185,432)
        this.itemButton.draw(345,432)
        this.mercyButton.draw(500,432)
        //canvas.globalCompositeOperation = "source-over"
        
        // health
        canvas.fillStyle = "maroon";
        canvas.fillRect(275,400,28,19)
        canvas.fillStyle = "yellow";
        canvas.fillRect(275,400,(this.hp / this.maxHp) * 28,19)
        canvas.fillStyle = "white"
        canvas.font = "14px menuFont";
        canvas.fillText("you",30,418)
        canvas.fillText("LV "+undertale.love,132,418)
        canvas.font = "10px menuFont";
        canvas.fillText("HP",248,415)
        canvas.font = "14px menuFont";
        canvas.fillText(this.hp,320,418)
        canvas.fillText(this.maxHp,385,418)
        this.battleSlash.draw(358,406)
        canvas.font = "32px utFont";

        if (this.targetSelect || this.actMenu || this.actTargetSelect || this.itemSelect) {
            for (let x = 0; x < this.list.length; x += 2) {
                // Render first column
                if (this.actTargetSelect || this.targetSelect) {
                    if (undertale.battle.enemies[x].mercy >= 100) {
                        canvas.fillStyle = "yellow"
                    }
                }
                canvas.fillText("*  "+this.list[x],84,294 + (Math.floor(x/2)) * 32)
                canvas.fillStyle = "white"
                // Render second column
                if (this.list[x + 1]) {
                    if (this.actTargetSelect || this.targetSelect) {
                        if (undertale.battle.enemies[x + 1].mercy >= 100) {
                            canvas.fillStyle = "yellow"
                        }
                    }
                    canvas.fillText("*  "+this.list[x + 1],300,294 + (Math.floor(x/2)) * 32)
                    canvas.fillStyle = "white"
                }
            }
        }
    }
        if (this.drawSoul) {
            this.mode.render()
        }
    }
}

class AttackBar extends Tickable {
    constructor(damage) {
        super()
        this.damage = damage;
        this.sprite = new Sprite("ui/attackbar");
        this.indicator = new Sprite("ui/attackbar_indi1")
        this.progress = 1;
        this.canPress = false;
        this.flicker = false;
        this.curFlicker = false;
        setTimeout(function(self = this) {
            self.canPress = true;
        }.bind(this),20)
        this.moving = true;
    }

    keyPressed(e) {
        if (this.canPress) {
            if (e.keyCode == 90 || e.keyCode == 13) { // Z
                console.log(this.damage)
                this.canPress = false;
                let playerDamageMultiplier = -Math.abs((2 * this.progress) - 1) + 1;
                let u = undertale.battle.enemies[player.selectedListItem];
                if (u.mercy >= 100 && !u.forcedMercy) {
                    playerDamageMultiplier = 99999;
                }
                this.moving = false;
                this.flicker = true;
                undertale.battle.enemies[player.selectedListItem].onDamage(this.damage * playerDamageMultiplier)
                setTimeout(function(self = this) {
                    this.destroy()
                    if (!undertale.battle.winCheck) {
                        playerActDone();
                    }
                }.bind(this), 500)
            }
        }
    }

    tick() {
        this.curFlicker = !this.curFlicker;
        if (this.moving) {
            if (this.progress > 0) {
                this.progress -= .02;
            } else {
                this.destroy()
                playerActDone();
            }
        }
    }

    render() {
        if (this.flicker) {
            this.indicator.img(this.curFlicker ? "ui/attackbar_indi1" : "ui/attackbar_indi2")
        }
        this.sprite.draw(48,260)
        this.indicator.draw(lerp(600,32,this.progress),253)
    }
}

class BattleBox extends Tickable {
    constructor() {
        super()
        this.x1 = 32;
        this.x2 = 607;
        this.y1 = 250;
        this.y2 = 385;
    
        this.interpTimer = 0;
        this.interpTime = 0;
        this.x1p = this.x1;
        this.x2p = this.x2;
        this.y1p = this.y1;
        this.y2p = this.y2;
    
        this.x1f = this.x1;
        this.x2f = this.x2;
        this.y1f = this.y1;
        this.y2f = this.y2;
        this.interpStage = 0; // 0 is moving horz, then 1 for vert

        this.collision = new Collision(this.x1,this.y1,this.x2+3,this.y2+3,true)
        this.collision.inner = false;
        undertale.collision.push(this.collision)

        this.text = "Hey test test"
    }

    interpTo(x1f = 32,y1f = 250,x2f = 607,y2f = 385,time = 15) {
        this.interpStage = 0;
        this.x1p = this.x1;
        this.y1p = this.y1;
        this.x2p = this.x2;
        this.y2p = this.y2;
        this.x1f = x1f;
        this.y1f = y1f;
        this.x2f = x2f;
        this.y2f = y2f;
        this.interpTimer = time;
        this.interpTime = time;
    }

    tick() {
        if (this.interpTimer > 0) {
            if (this.interpStage == 0) {
                this.x1 = lerp(this.x1p,this.x1f,this.interpTimer/this.interpTime)
                this.x2 = lerp(this.x2p,this.x2f,this.interpTimer/this.interpTime)
                this.interpTimer -= 1;
                if (this.interpTimer == 0) {
                    this.interpStage = 1
                    this.interpTime /= 2
                    this.interpTimer = this.interpTime;
                }
            } else {
                this.x1 = this.x1f;
                this.x2 = this.x2f;
                this.y1 = lerp(this.y1p,this.y1f,this.interpTimer/this.interpTime)
                this.y2 = lerp(this.y2p,this.y2f,this.interpTimer/this.interpTime)
                this.interpTimer -= 1;
            }
        } else {
            this.y1 = this.y1f;
            this.y2 = this.y2f;
        }
        this.collision.x = this.x1;
        this.collision.y = this.y1;
        this.collision.x1 = this.x2 - 12;
        this.collision.y1 = this.y2 - 12;
    }

    render() {
        canvas.beginPath();
        canvas.lineWidth = "5";
        canvas.strokeStyle = "white";
        canvas.rect(this.x1,this.y1,(this.x2-this.x1),(this.y2-this.y1))
        canvas.stroke()
    }
}

class TypingText extends Tickable {
    constructor(message) {
        super()
        this.message = message;
        this.curLetter = 0;
        this.curMessage = ""
        this.prevMessage = message;
        this.pressedo = false;
    }

    init() {
        setInterval(function(self = this) {
            if (self.curLetter < self.message.length) {
                self.curMessage = self.curMessage + self.message.charAt(self.curLetter);
                playSound("SND_TXT2.wav")
                self.curLetter += 1;
            }
        }.bind(this),50)
    }

    end() {
        this.confirmed = function() {}
    }

    keyPressed(e) {
        if (!this.pressedo) {
            if (e.keyCode == 90 || e.keyCode == 13) { // Z
                if (this.curLetter >= this.message.length) {
                    this.confirmed();
                    this.pressedo = true;
                }
            } else
            if (e.keyCode == 88 || e.keyCode == 16) {
                this.curLetter = this.message.length
                this.curMessage = this.message;
            }
        }
    }

    confirmed() {}

    hide() {
        this.pressedo = false;
        this.prevMessage = this.message;
        this.message = ""
        this.curMessage = ""
        this.curLetter = 0;
        this.end();
    }

    show() {
        this.pressedo = false;
        this.message = this.prevMessage;
    }

    setMessage(message) {
        this.pressedo = false;
        this.prevMessage = message;
        this.message = message;
        this.curMessage = ""
        this.curLetter = 0;
    }

    render() {
        canvas.fillStyle = "white"
        canvas.font = "32px utFont";
        if (this.message != "") {
            canvas.fillText("*",52,294)
        }
        var ctext = this.curMessage.replace(/ /g,"   ")
        printAt(canvas,ctext,84,294,32,484)
    }
}

class TextBubble extends Tickable {
    constructor(message, speaker, confirmable = false, offset = new Vector2(0,-32)) {
        super()
        this.message = message;
        this.speaker = speaker;
        this.curLetter = 0;
        this.curMessage = "";
        this.offset = offset;
        this.prevMessage = message;
        let i = setInterval(function(self = this) {
            if (self.curLetter < self.message.length) {
                self.curMessage = self.curMessage + self.message.charAt(self.curLetter);
                self.curLetter += 1;
            } else {
                clearInterval(i)
                setTimeout(function(self=this){
                    this.destroy();
                    this.confirmed();
                }.bind(this),600)
            }
        }.bind(this),50)
        this.corner = new Sprite("ui/textBubble",8)
        undertale.spawn(this);
    }

    confirmed() {}

    keyPressed(e) {
        if (this.confirmable) {
            if (e.keyCode == 90 || e.keyCode == 13) { // Z
                // check if every textbox that exists is OK to clear, then trigger them all at once.
                if (this.curLetter >= this.message.length) {
                    this.destroy();
                    this.confirmed();
                }
            } else if (e.keyCode == 88 || e.keyCode == 16) {
                this.curLetter = this.message.length
                this.curMessage = this.message;
            }
        }
    }

    render() {
        let x = this.speaker.x + (this.speaker.image.naturalWidth/this.speaker.num) + 8
        let y = this.speaker.y - 32;
        let w = 128;
        let h = 64;
        let offset = this.offset;
        canvas.fillStyle = "white"
        canvas.fillRect(x+offset.x+1,y+offset.y+1,w+15,h+15)
        //Triangle
        if (offset.x < 0) {
            this.corner.draw(x+offset.x+w+15,y + 16+offset.y,6)
        } else {
            this.corner.draw(x-15+offset.x,y + 16+offset.y,5)
        }
        this.corner.draw(x+offset.x,y+offset.y)
        this.corner.draw(x+w+offset.x,y+offset.y, 1)
        this.corner.draw(x+offset.x,y+h+offset.y,2)
        this.corner.draw(x + w+offset.x,y + h+offset.y, 3)
        canvas.fillStyle = "black"
        canvas.font = "12px bubbleFont";
        var ctext = this.curMessage
        printAt(canvas,ctext,x+16+offset.x,y+24+offset.y,20)

    }
}

class BattleGimmick {
    constructor() {
        
    }
}

class Battle {
    items = [
        Glamburger,
        CinnaBun,
        Glamburger,
        CinnaBun,
        Glamburger,
        CinnaBun
    ]
    seriousMode = false;
    data;
    constructor(data) {
        this.data = data;
        this.BattleDatatoVars(data)
    }

    BattleDatatoVars(data) {
        this.initialSoulMode = data.soulMode ? data.soulMode : new SoulMode()
        this.enemies = data.enemies
        this.gimmick = data.gimmick ? data.gimmick : new BattleGimmick()
        this.love = data.love ? data.love : 1;
        this.music = data.music ? data.music : "enemy.mp3"
        for (let x = 0; x < this.enemies.length; x++) {
            this.enemies[x].enemyNumber = x;
        }
    }

    winCheck() {
        let allDead = true;
        for (let x in this.enemies) {
            if (this.enemies[x].hp > 0 || this.enemies[x].spared) {
                allDead = false;
            }
        }
        if (undertale.battle.enemies.length == 0) {
            allDead = true;
        }
        if (allDead) {
            console.log("Win")
            SND(this.music).pause()
            textbox.show()
            textbox.setMessage("YOU WON! You earned... nothing?")
            return true;
        } else {
            return false;
        }
    } 
}

class Undertale {
    tickables = []
    collision = []
    love = 1;
    constructor() {
    }

    startBattle(data) {
        if (this.battle) { // if a previous battle has existed
            let kill = []
            for (let x in this.battle.data.enemies) {
                kill.push(this.battle.data.enemies[x])
            }
            for (let x in kill) {
                kill[x].destroy()
            }
        }
        this.battle = new Battle(data);
        playSound(this.battle.music, true)
        for (let x in this.battle.enemies) {
            this.spawn(this.battle.enemies[x]);
        }
        masterTick = new MasterTick()
        masterTick.priority = 0
        this.spawn(masterTick)
        player = new Soul();
        this.spawn(player)
        battlebox = new BattleBox()
        this.spawn(battlebox)
        textbox = new TypingText("")
        chooseFlavorText();
        this.spawn(textbox)
    }

    spawn(actor) {
        this.tickables.push(actor);
        actor.init();
        this.tickables.sort((a, b) => (a.priority - b.priority))
        return actor;
    }
}
    
window.addEventListener('load', function() {
    loadIndicator = document.getElementById("loadIndicator");

    loadSprites([
        "enemy/dummy",
        "ui/textBubble",
        "ui/ut_smoke",
        "ui/_act",
        "ui/act",
        "ui/_fight",
        "ui/fight",
        "ui/_item",
        "ui/item",
        "ui/_mercy",
        "ui/mercy",
        "ui/attackbar",
        "battle_slash",
        "soul_dead",
        "soul_shard",
        "soul",
        "enemy/froggit_body",
        "enemy/froggit_face",
        "ui/attackbar_indi1",
        "ui/attackbar_indi2",
        "enemy/mex_body",
        "enemy/mex_face",
        "enemy/mex_arms"
    ], spritesLoaded)

    function spritesLoaded() {
        loadAudio([
            "enemy.mp3",
            "hurt.wav",
            "snd_dbreak.wav",
            "snd_dbreak2.wav",
            "snd_heartshot.wav",
            "snd_select.wav",
            "snd_squeak.wav",
            "SND_TXT2.wav",
            "snd_damage.wav",
            "monsterdust.wav"
        ], audioLoaded)
    }

    function lol() {

    }

    function audioLoaded() {
        let throbber = document.getElementById("throbber")
    throbber.style.display = "none"
    loadIndicator.style.display = "none"
    canvasElement = document.getElementById("undertale")
    canvas = document.getElementById("undertale").getContext('2d')
    joystick = document.getElementById("joystickBack")
    confirmButton = document.getElementById("confirmButton")
    backButton = document.getElementById("backButton")
    let initialMousePosX;
    let initialMousePosY;
    let mouseX;
    let mouseY;
    let joystickDown = false;

    confirmButton.onclick = function() {
        document.dispatchEvent(
            new KeyboardEvent("keydown", {
              key: "z",
              keyCode: 90, // example values.
              code: "KeyZ", // put everything you need in this object.
              which: 90,
              shiftKey: false, // you don't need to include values
              ctrlKey: false,  // if you aren't going to use them.
              metaKey: false   // these are here for example's sake.
            })
          );
    }

    backButton.onclick = function() {
        document.dispatchEvent(
            new KeyboardEvent("keydown", {
              key: "X",
              keyCode: 88, // example values.
              code: "KeyX", // put everything you need in this object.
              which: 88,
              shiftKey: false, // you don't need to include values
              ctrlKey: false,  // if you aren't going to use them.
              metaKey: false   // these are here for example's sake.
            })
          );
    }

    joystick.ontouchstart = function(event) {
        console.log("as")
        joystickDown = true;
        initialMousePosX = event.targetTouches[0].pageX;
        initialMousePosY = event.targetTouches[0].pageY;
        for (let i in undertale.tickables) {
            undertale.tickables[i].keyPressed(event)
        }
    }

    joystick.ontouchend = function(event) {
        joystickDown = false;
        let keys = [
            {name: "ArrowDown", code: 40},
            {name: "ArrowUp", code: 38},
            {name: "ArrowRight", code: 39},
            {name: "ArrowLeft", code: 37},
        ]
        let which = -1;

        if (horzKey < 0) {
            console.log("left")
            which = 3;
        } else if (horzKey > 0) {
            which = 2;
        } else {
            which = -1
        }
        if (which != -1) {
            document.dispatchEvent(
                new KeyboardEvent("keydown", {
                key: keys[which].name,
                keyCode: keys[which].code, // example values.
                code: keys[which].name, // put everything you need in this object.
                which: keys[which].code,
                shiftKey: false, // you don't need to include values
                ctrlKey: false,  // if you aren't going to use them.
                metaKey: false   // these are here for example's sake.
                })
            );
        }

        if (vertKey < 0) {
            which = 1;
        } else if (vertKey > 0) {
            which = 0;
        } else {
            which = -1
        }
        if (which != -1) {
            document.dispatchEvent(
                new KeyboardEvent("keydown", {
                key: keys[which].name,
                keyCode: keys[which].code, // example values.
                code: keys[which].name, // put everything you need in this object.
                which: keys[which].code,
                shiftKey: false, // you don't need to include values
                ctrlKey: false,  // if you aren't going to use them.
                metaKey: false   // these are here for example's sake.
                })
            );
        }

        horzKey = 0;
        vertKey = 0;


        for (let i in undertale.tickables) {
            undertale.tickables[i].keyReleased(event)
        }
    }

    document.ontouchmove = function(event) {
        mouseX = event.targetTouches[0].pageX
        mouseY = event.targetTouches[0].pageY
        let sensitivity = 25;
        if (joystickDown) {
            if (mouseX - initialMousePosX > -sensitivity && mouseX - initialMousePosX < sensitivity) {
                horzKey = 0;
            } else {
                horzKey = Math.sign(mouseX - initialMousePosX)
            }
            if (mouseY - initialMousePosY > -sensitivity && mouseY - initialMousePosY < sensitivity) {
                vertKey = 0;
            } else {
                vertKey = Math.sign(mouseY - initialMousePosY)
            }
        }
    }

    canvas.imageSmoothingEnabled = false;
    canvas.mozImageSmoothingEnabled = false
    canvas.webkitImageSmoothingEnabled = false
    canvas.imageSmoothingQuality = "low"

    //To start the game
    /*
    canvasElement.style.display = "block"
    undertale = new Undertale();
    undertale.startBattle({
        "soulMode": new SoulMode(),
        "enemies": [new Froggit(), new Froggit()],
        "gimmick": new BattleGimmick(),
        "music": "enemy.mp3"
    })
    setInterval(function() {
        globalTime += timeDilation;
        for (let m in undertale.tickables) {
            undertale.tickables[m].beginTick();
            undertale.tickables[m].tick();
            undertale.tickables[m].checkCollision();
            undertale.tickables[m].endTick();
            undertale.tickables[m].render();
        }
        if (debugCollision) {
            for (let m in undertale.collision) {
                let c = undertale.collision[m]
                canvas.fillStyle = "rgba(255,0,0,0.5)";
                if (c.inner) {
                    canvas.fillRect(c.x,c.y,(c.x1-c.x),(c.y1-c.y))
                } else {
                    canvas.fillRect(0,0,640,c.y)
                    canvas.fillRect(0,c.y,c.x,480)
                    canvas.fillRect(c.x,c.y1,c.x1,c.y1-c.y)
                    canvas.fillRect(c.x1,c.y,640,480)
                }
            }
        }
    },33 * (1/timeDilation))
    */
}
})

export {Sprite, Tickable, undertale, player}
var undertale;
var player;
var canvas;
var battlebox;
var textbox;
var bullets;
var masterTick;
var tSounds = {}
var debugCollision = false;
var joystick;
var confirmButton;

var vertKey = 0;
var horzKey = 0;
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
function lerp(min,max,t) {
    return (min*t)+max*(1-t)
}

function playSound(path, loop = false) {
    let audio = new Audio('./snd/'+path);
    audio.loop = loop;
    audio.play();
    tSounds[path] = audio;
}

function enemyAttackDone() {
    if (!player.death) {
        battlebox.interpTo(32,250,607,385,8);
        player.collides = false;
        player.death = false;
        player.selectMenu = true;
        player.targetSelect = false;
        player.fightMenu = false;
        player.selectedListItem = 0;
        player.attackMenu = false;
        player.listLength = 0;
        player.attackProg = 1;
        textbox.show()
    }
}


function printAt(context, text, x, y, lineHeight, fitWidth)
{
    fitWidth = fitWidth || 0;
    
    if (fitWidth <= 0)
    {
         context.fillText( text, x, y );
        return;
    }
    
    for (var idx = 1; idx <= text.length; idx++)
    {
        var str = text.substr(0, idx);
        if (context.measureText(str).width > fitWidth)
        {
            context.fillText( text.substr(0, idx-1), x, y );
            printAt(context, text.substr(idx-1), x, y + lineHeight, lineHeight,  fitWidth);
            return;
        }
    }
    context.fillText( text, x, y );
}

var fontLoaded = false;

canvas = document.querySelector('canvas');
var utFont = new FontFace('utFont', 'url(./DeterminationMono.ttf)');
var menuFont = new FontFace('menuFont','url(./MenuFont.otf)')

utFont.load().then(function(font){
  document.fonts.add(font);
  menuFont.load().then(function(font){
    console.log("Fonts Loaded")
    document.fonts.add(font);
    fontLoaded = true;
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
    x = 0
    y = 0
    prevX = 0;
    prevY = 0;
    priority = 0;
    sprite;
    collides = true;
    constructor(x, y, sprite = new Sprite("soul")) {
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
        undertale.tickables.splice(indexOf(this),1);
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
                /*
                if (this.y > c.y && this.y < c.y1) {
                    if (c.blocking) {
                        this.y += (this.prevY-this.y);
                    }
                    c.onTouch(this);
                }*/
            }
            }
        }
    }
}

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
    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
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
    animation = {
    "scaleInH": [
        {"time":0, data: [
            {"property": "scale", "value": new Vector2(0,1)}
        ]},
        {"time":1, data: [
            {"property": "scale", "value": new Vector2(1,1)}
        ]},
    ],
    "scaleInV": [
        {"time":0, data: [
            {"property": "scale", "value": new Vector2(1,0)}
        ]},
        {"time":1, data: [
            {"property": "scale", "value": new Vector2(1,1)}
        ]},
    ],
    "scaleInHV": [
        {"time":0, data: [
            {"property": "scale", "value": new Vector2(0,0)}
        ]},
        {"time":1, data: [
            {"property": "scale", "value": new Vector2(1,1)}
        ]},
    ],
    "fade": [
        {"time":0, data: [
            {"property": "scale", "value": new Vector2(0,0)}
        ]},
        {"time":1, data: [
            {"property": "scale", "value": new Vector2(1,1)}
        ]},
    ],
        
    }
    properties = {
        "scale": new Vector2(1,1),
        "color": new Color(1,1,1),
        "opacity": 1
    }
    constructor(file) {
        this.file = "./img/"+file+".png";
        this.image = new Image();
        this.image.src = this.file;
        this.image.addEventListener('load', () => {
            console.log("loaded")
            this.loaded = true;
        }, false);
    }

    addAnimation(name, animation) {
        /* Animation Format
        [
            {"time":0, data: [
                {"property": "scale", "value": new Vector2(0,1)}
            ]},
            {"time":1, data: [
                {"property": "scale", "value": new Vector2(1,1)}
            ]},
        ]
        */

        animation[name] = animation;
    }

    playAnimation(name, speed = 1, reverse = false) {
        let time = 33
        setInterval(function() {
            if (time > 0) {
                time -= 1
            }
        },33)
    }

    draw(x,y) {
        if (this.loaded) {
            canvas.drawImage(this.image,x,y);
        }
    }

    img(file) {
        this.loaded = false;
        this.image.src = "./img/"+file+".png";
        this.image.onload = function() {
            this.loaded = true;
        }
    }
}

class AttackFactory {
    // An attack factory can be called for easy creation of attacks
    // that have similar properties.
    // Best fit for fights such as Undyne's spears with the green soul,
    // Asgore's various circles of fire or Mettaton's disco ball attack.
    constructor(attack, timer = 3) {
        this.timer = timer;
        attack();
        setTimeout(() => {
            enemyAttackDone()
        },timer * 1000)
    }

    tick() {

    }
}

class Enemy extends Tickable {
    constructor(sprite = new Sprite("enemy/dummy")) {
        super()
        this.sprite = sprite;
        this.priority = 5;
        this.name = "Enemy"
        this.maxhp = 50;
        this.hp = this.maxhp;
    }

    onDamage(damage) {
        this.hp = this.hp - damage;
    }

    render() {
        this.sprite.draw(64,64)
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

}

class Bullet extends Tickable {
    time;
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
        console.log(this.collision)
        this.movement = movement;
        this.collision.onHit = function(other) {
            if (other == player) {
                if (player.invincibility == 0) {
                    player.invincibility = 50;
                    player.onDamage(damage)
                }

            }
        }
        undertale.collision.push(this.collision)
        undertale.spawn(this)
    }

    movement() {}

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
        if (!this.shards) {
        this.sprite.draw(this.owner.x,this.owner.y)
        } else {
            this.sprite.draw(this.shard1.x,this.shard1.y)
            this.sprite.draw(this.shard2.x,this.shard2.y)
            this.sprite.draw(this.shard3.x,this.shard3.y)
            this.sprite.draw(this.shard4.x,this.shard4.y)
            this.sprite.draw(this.shard5.x,this.shard5.y)

        }
        canvas.globalCompositeOperation = "multiply"
        canvas.fillStyle ="rgb("+trueColor.r+","+trueColor.g+","+trueColor.b
        canvas.fillRect(0,0,640,480)
        canvas.globalCompositeOperation = "source-over"
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
    fightMenu = false;
    selectedListItem = 0;
    attackMenu = false;
    listLength = 0;
    attackProg = 1;
    invincibility = 0;
    drawUi = true;

    constructor() {
        super();
        this.mode = new SoulMode(this);
        this.hp = undertale.battle.maxHp;
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
        if (this.targetSelect) {
            this.x = 55
            this.y = 278 + this.selectedListItem * 32
        }
    }

    onDamage(hp) {
        this.hp -= hp;
        if (this.hp <= 0 && !this.death) {
            this.hp = 0;
            tSounds[undertale.battle.music].pause()
            tSounds[undertale.battle.music].currentTime = 0
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

    keyPressed(e) {
        if (!this.death) {
            this.mode.keyPressed(e)
        let h = 0;
        let v = 0;
        if (e.keyCode == 90 || e.keyCode == 13) { // Z
            if (this.targetSelect) {
                //undertale.battle.enemies[this.selectedListItem].damage(30)
                //this.targetSelect = false;
                //this.attackMenu = true;
                
                for (let x in undertale.battle.enemies) {
                    undertale.battle.enemies[x].attack()
                }
                this.collides = true;
                this.x = 312
                this.y = 307
                battlebox.interpTo(235,220,405,395)
                this.targetSelect = false;
            }

            if (this.selectMenu || this.fightMenu) {
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
                }
            }
        }

        if (e.keyCode == 88 || e.keyCode == 16) {
            if (this.targetSelect) {
                this.targetSelect = false;
                this.selectMenu = true;
                textbox.show()
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

        if (this.targetSelect) {
            if (v != 0) {
                playSound("snd_squeak.wav")
                this.selectedListItem = clamp(this.selectedListItem + v,0,this.listLength - 1)
            }
        }

        if (this.selectMenu) {
            this.selectedAct = clamp(this.selectedAct + h, 0, 3);

            if (h != 0) {
                playSound("snd_squeak.wav")
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
        }
    }
    }

    changeSoulMode(mode) {
        this.mode = new mode;
    }

    render() {
        this.mode.render()
        if (this.drawUi) {
        canvas.globalCompositeOperation = "lighter"
        this.fightButton.draw(32,432)
        this.actButton.draw(185,432)
        this.itemButton.draw(345,432)
        this.mercyButton.draw(500,432)
        canvas.globalCompositeOperation = "source-over"
        
        // health
        canvas.fillStyle = "maroon";
        canvas.fillRect(275,400,28,19)
        canvas.fillStyle = "yellow";
        canvas.fillRect(275,400,(this.hp / undertale.battle.maxHp) * 28,19)
        canvas.fillStyle = "white"
        canvas.font = "14px menuFont";
        canvas.fillText("you",30,418)
        canvas.fillText("LV "+undertale.battle.love,132,418)
        canvas.font = "10px menuFont";
        canvas.fillText("HP",248,415)
        canvas.font = "14px menuFont";
        canvas.fillText(this.hp,320,418)
        canvas.fillText(undertale.battle.maxHp,385,418)
        this.battleSlash.draw(358,406)
        canvas.font = "32px utFont";

        if (this.targetSelect) {
            for (let x in this.list) {
                canvas.fillText("*  "+this.list[x],84,294 + x * 32)
            }
        }
    }

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
    }

    init() {
        setInterval(function(self = this) {
            if (self.curLetter < this.message.length) {
                self.curMessage = self.curMessage + self.message.charAt(self.curLetter);
                playSound("SND_TXT2.wav")
                self.curLetter += 1;
            }
        }.bind(this),50)
    }

    hide() {
        this.prevMessage = this.message;
        this.message = ""
        this.curMessage = ""
        this.curLetter = 0;
    }

    show() {
        this.message = this.prevMessage;
    }

    setMessage(message) {
        this.curMessage = ""
        this.curLetter = 0;
        this.message = message;
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

class BattleGimmick {
    constructor() {
        
    }
}

class Battle {
    constructor(initialSoulMode = new SoulMode(), enemies, maxHp = 20, gimmick, love = 1, music = "enemy.mp3") {
        this.initialSoulMode = initialSoulMode
        this.enemies = enemies;
        this.maxHp = maxHp;
        this.gimmick = gimmick;
        this.love = love;
        this.music = music;
    }
}

class Undertale {
    tickables = []
    collision = []
    constructor() {
        this.battle = new Battle(new SoulMode(), [new Enemy(), new Enemy()]);
        playSound(this.battle.music, true)
        for (let x in this.battle.enemies) {
            this.spawn(this.battle.enemies[x]);
        }
    }

    spawn(actor) {
        this.tickables.push(actor);
        actor.init();
        this.tickables.sort((a, b) => (a.priority - b.priority))
    }
}
    
window.addEventListener('load', function() {
    canvas = document.getElementById("undertale").getContext('2d')
    joystick = document.getElementById("joystickBack")
    confirmButton = document.getElementById("confirmButton")
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
    undertale = new Undertale();
    setInterval(function() {
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
    },33)
    masterTick = new MasterTick()
    masterTick.priority = 0
    undertale.spawn(masterTick)
    player = new Soul();
    undertale.spawn(player)
    battlebox = new BattleBox()
    undertale.spawn(battlebox)
    textbox = new TypingText("I am test mr test. For real!!!!")
    undertale.spawn(textbox)
    //battlebox.interpTo(250,220,400,395)

})

export {Sprite, Tickable, undertale, player}
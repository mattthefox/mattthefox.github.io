// === //
// TOP
// Welcome to the massive main file of the game.
// I really attempted to split things into modular scripts.
// But I couldn't find out how.
// Anyway, I've left Better Outline (VSCode extension) headers
// for you to use if you would like to extend any functionality, implement
// custom SOUL modes, whatever, so have fun!
// 
// == Useful video ==
// https://www.youtube.com/watch?v=N9St_7Po__8
// == ------ ==

var undertale;
var player;
var canvas;
var canvasElement;
var battlebox;
var textbox;
var bullets;
var masterTick;
var tSounds = {}
var joystick;
var confirmButton;
var sprites = {};
var sounds = {}
var loadIndicator;
var backButton;
var globalTime = 0;
var timeDilation = 1;
var enemiesSlot;
var gamepad_toggle = document.getElementById("gamepadToggle")
var MAIN_MENU;
var gameLoopActive = false;
var playerActDoneBefore = false;
var enemyFade = 0;
var activeAttackFactories = [];

var vertKey = 0;
var horzKey = 0;
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

class DummyClass {
    static pause() {}
}
function choose(choices) {
    return choices[Math.round(Math.random() * (choices.length - 1))]
}
function wrapChoice(choices,val) {
    return choices[Math.round(val % (choices.length))]
}
const sleep = ms => new Promise(r => setTimeout(r, ms));


// === //
// UTILITY FUNCS.
function SPR(file) {
    let path = "./img/"+file+".png"
    return sprites[path]
}
function SND(file) {
    if (!typeof Howl === undefined) {
        let path = "./snd/"+file
        return sounds[path]
    } else {
        return DummyClass;
    }
}
function audioLoop(paths, index, callback) {
    let file = "./snd/"+paths[index];
    let sound;
    if (!typeof Howl === undefined) {
        sound = new Howl({
            src: [file]
        });
    }
    //sound.onload = function() {
        sounds[file] = sound;
        if (index < paths.length - 1) {
            audioLoop(paths, index + 1, callback)
        } else {
            callback();
        }
    //}
}
function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}

function defaultBattleBox() {
    battlebox.interpTo(235,220,405,395)
    player.collides = true;
    player.x = 312
    player.y = 307
}

const TWEEN_TYPES = [
    {LINEAR: (x) => x},
    {SQUARED: (x) => x^2},
    {CUBIC: (x) => x^3}
]
// obtained via TWEEN_TYPES.LINEAR

class Tween {
    onComplete = () => {}
    completed = false;
    constructor(inTime = 30,func) {
        let time = 0;
        let t = setInterval(function(self = this) {
            func(1-(time / inTime))
            time += 1
            if (time > inTime) {
                self.onComplete()
                self.completed = true;
                clearInterval(t)
            }
        }.bind(this),33)
    }

    setCompleted(func) {
        this.onComplete = func;
    }
}

/* Examples of some tweening operations:

    let px = this.x;
    let py = this.y
    new Tween(30, (t) => {
        this.x = lerp(px, this.x, t)
        this.y = lerp(py, this.y, t)
    })

    let pcolor = this.sprite.tint;
    new Tween(30, (t) => {
        this.sprite.tint = pcolor.lerp(new Color(1,0,0,0),t)
    })

*/

function setCookie(cname, cvalue) {
    document.cookie = cname + "=" + cvalue + ";path=/";
}
Number.prototype.inRange = function(min, max, inclusive = true) {
    if (inclusive) {
        return (this >= min && this <= max)
    } else {
        return (this > min && this < max)
    }
}

function spriteLoop(paths, index, callback) {
    let file = "./img/"+paths[index]+".png";
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
    if (!typeof Howl === undefined) {
        let file = "./snd/"+path
        var sound = new Howl({
            src: [file],
            loop: loop
        })
        sound.play()
        sounds[file] = sound;
    }
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

    let randomEnemy = aliveEnemies[(Math.round(Math.random() * (aliveEnemies.length-1)))]
    let randomFlavor = randomEnemy.flavorTexts[Math.round(Math.random() * (randomEnemy.flavorTexts.length-1))]
    textbox.show()
    textbox.setMessage(randomFlavor)
}
function enemyAttackDone() {
    if (player.dodgeMode) {
        player.dodgeMode = false;
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
}
function playerActDone() {
    if (!player.dodgeMode && !playerActDoneBefore) {
        console.log("player act done")
        player.dodgeMode = true;
        playerActDoneBefore = true;
        textbox.hide()
        for (let x in undertale.battle.enemies) {
            undertale.battle.enemies[x].attack()
            undertale.battle.enemies[x].turns += 1;
        }
        player.drawSoul = true;
        //player.collides = true;
        //player.x = 312
        //player.y = 307
        setTimeout(function() { // fairly bad programming :P
            playerActDoneBefore = false;
        },500)
    }
}
function dialogLoop(messages,index,func) {
    textbox.setMessage(messages[index]);
    if (index < messages.length - 1) {
        textbox.confirmed = function() {
            dialogLoop(messages,index+1,func)
        }
    } else {
        textbox.confirmed = function() {
            textbox.hide();
            func();
        }
    }
}
function dialogList(messages,func) {
    textbox.show()
    dialogLoop(messages,0,func)
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
document.onkeydown = checkKey;
document.onkeyup = checkKeyUp;
function checkKey(e) {
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
// === //
// FONTS
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

// === //
// ITEM OBJECTS
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

// === //
// UTILITY CLASSES
class Tickable {
    x = 0;
    y = 0;
    prevX = 0;
    prevY = 0;
    priority = 0;
    sprite;
    collides = true;
    tween = 0;
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
class MasterTick extends Tickable {
    priority = -5
    beginTick() {
    }
    render() {
        canvas.fillStyle = "rgba(0,0,0,1)"
        canvas.fillRect(0,0,640,480)
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
class Color {
    constructor(r, g, b, a = 100) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    lerp3(color, t) {
        this.r = lerp(this.r,color.r,t)
        this.g = lerp(this.g,color.g,t)
        this.b = lerp(this.r,color.b,t)
    }

    lerp(color, t) {
        this.r = lerp(this.r,color.r,t)
        this.g = lerp(this.g,color.g,t)
        this.b = lerp(this.r,color.b,t)
        this.a = lerp(this.r,color.a,t)
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
    visible = true;
    loaded = false;
    prevLoaded = false;
    scale = new Vector2(1,1);
    x;
    y;
    rot;
    frame = 0;
    autoDraw;

    constructor(file, num = 1,autoDraw = false) {
        this.num = num;
        this.image = SPR(file)
        this.disintegrateTime = 0;
        this.disintegrate = []
        this.autoDraw = autoDraw
        for (let x = 0; x < this.image.naturalHeight; x++) {
            this.disintegrate.push({y: (x * .1) + 32})
        }
        this.disintegrating = false;
        this.tint = new Color(0,0,0,0);
    }

    draw(x = 0,y = 0,frame = this.frame,rotation = 0, origin = new Vector2(0.5,0.5)) {
        if (this.visible) {
            this.x = x;
            this.y = y;
            this.rot = rotation;
            let localOrigin = new Vector2(origin.x * this.image.naturalWidth, origin.y * this.image.naturalHeight)
            canvas.save();
            canvas.translate(localOrigin.x + x, localOrigin.y + y);
            canvas.rotate((Math.PI / 180) * rotation);
            canvas.translate(-localOrigin.x - x, -localOrigin.y - y);

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
            canvas.fillRect(x,y,(this.image.naturalWidth / this.num) * this.scale.x,(this.image.naturalHeight) * this.scale.y)
            canvas.rotate((Math.PI / 180) * -rotation);
            canvas.globalCompositeOperation = "source-over"
            canvas.fillStyle = "white"
            canvas.restore();
        }
    }


    img(file) {
        this.image = SPR(file)
    }
}
// === //
// ATTACK FACTORIES
class AttackFactory {
    // An attack factory can be called for easy creation of attacks
    // that have similar properties.
    // Best fit for fights such as Undyne's spears with the green soul
    // (Input a sequence of arrow characters and it will create the attack
    // as such, therefore removing the need for a big array of objects)
    // Asgore's various circles of fire or Mettaton's disco ball attack.
    constructor(attack, timer = 3) {
        activeAttackFactories.push(this)
        player.collides = true;
        this.loops = []
        this.timer = timer;
        attack(this);
        this.timeOut = setTimeout(() => {
            this.completed();
                for (let x in activeAttackFactories) {
                    let i = activeAttackFactories[x]
                    for (let y in i.loops) {
                        clearInterval(i.loops[y])
                    }
                }
                activeAttackFactories = [];
                if (player.dodgeMode) {
                    if (!player.death) {
                        enemyAttackDone()
                    }
                }
        },timer * 1000)
        
        /*
        let thisLongestAttack = true;
        for (let x = 0; x < activeAttackFactories.length; x++) {
            if (activeAttackFactories[x].timer > this.timer) {
                thisLongestAttack = false;
            }
        }
        if (thisLongestAttack) { // If we're the longest attack, other ones no longer have their timer.
            for (let x in activeAttackFactories) {
                clearTimeout(activeAttackFactories[x].timeOut)
            }
        }
        activeAttackFactories.push(this);*/

    }

    completed() {

    }

    loop(func,time) {
        let e = setInterval(func,time)
        this.loops.push(e)
    }
}
class SpearsAttackFactory {
    spears = []
    actualSpears = []
    curSpear = 0;
    constructor(pattern,restLengthSeconds = .6) {
        // * Pattern follows this format:
        //   udlr for the direction that the player must face
        //    to dodge it, or the direction the spear is
        //    coming from.
        //    * is a rest
        //    ^ before to have it be a reversed spear
        // * place a number 1-9 before to change speed (5 is default)
        //   example:
        //     1u**2l**2d**3r**3u*4d*4d*^5r*
        let reverse = false;
        let speed = 3;
        let index = 0;
        let lastBeat = 0;
        while (index < pattern.length) {
            if (pattern[index] == "*") {
                lastBeat += 2;
                index += 1;
                continue;
            }
            if (pattern[index] == "^") {
                reverse = true;
                index += 1;
                continue;
            }
            if (/0|1|2|3|4|5|6|7|8|9/.test(pattern[index])) {
                speed = +pattern[index];
                index += 1;
                continue;
            }

            // if its an actual direction we've got.
            if (/u|d|l|r/.test(pattern[index])) {
                let dirMap = {
                    "u": 0,
                    "r": 1,
                    "d": 2,
                    "l": 3
                }
                this.spears.push({
                    "dir":dirMap[pattern[index]],
                    "reverse":reverse,
                    "speed":speed,
                    "beat":lastBeat
                })
                reverse = false;
                speed = 3;
            }
            lastBeat += 1;
            index += 1;
        }
        this.restLength = restLengthSeconds * 1000
        battlebox.interpTo(280,215,360,295,10)
        player.x = 312;
        player.y = 250;
        player.collides = true;
        new Tween(15, (t) => {
            enemyFade = .5-(t * .5);
        })
        this.spearsLoop();
    }

    spearsLoop() {
        setTimeout(function(self=this) {
            if (this.curSpear < this.spears.length) {
                let s = this.spears[this.curSpear];
                var spear = new Spear(s.dir,s.speed)
                if (this.curSpear == 0) {
                    spear.closest = true;
                }
                spear.index = this.curSpear;
                spear.owner = this;
                this.actualSpears.push(spear)
                this.curSpear += 1;
                this.spearsLoop();
            }
        }.bind(this),this.curSpear > 0 && this.curSpear < this.spears.length ? (this.spears[this.curSpear].beat-this.spears[this.curSpear-1].beat) * this.restLength : 1)
    }
}
class Spear extends Tickable {
    owner;
    index;
    closest = false;
    priority = 2;
    constructor(direction,speed = 3) {
        super();
        this.direction = direction;
        this.speed = speed;
        this.sprite = new Sprite("enemy/spear")
        this.collision = new Collision(0,0,0,0,false)
        this.collides = true;
        // 640, 480
        switch (this.direction) {
            case 0:
                this.x = player.x;
                this.y = -90;
            break;

            case 1:
                this.x = 640;
                this.y = player.y;
            break;

            case 2:
                this.x = player.x;
                this.y = 570;
            break;

            case 3:
                this.x = 0;
                this.y = player.y;
            break;
        }
        undertale.spawn(this)
    }

    tick() {
        this.collision.x = this.x
        this.collision.y = this.y;
        this.collision.x1 = this.x + 16
        this.collision.y1 = this.y + 16

        switch (this.direction) {
            case 0:
                this.y += this.speed;
            break;

            case 1:
                this.x -= this.speed;
            break;

            case 2:
                this.y -= this.speed;
            break;

            case 3:
                this.x += this.speed;
            break;
        }
        //280,215,360,295
        if ((this.x + 24 > 280 && this.x < 360) && (this.y + 24 > 215 && this.y < 295)) {
            this.destroy();
            if (this.direction != player.mode.dir) {
                player.onDamage(5)
            }
            if (this.index < this.owner.actualSpears.length - 1) {
                this.owner.actualSpears[this.index + 1].closest = true;
            } else {
                new Tween(15, (t) => {
                    enemyFade = t * 0.5;
                })
                enemyAttackDone();
            }
        }
    }

    render() {
        this.sprite.draw(this.x-4,this.y-4, 0, (this.direction * 90) + 180)
        this.sprite.tint = this.closest ? new Color(255,128,128,100) : new Color(0,255,255,100)
        //this.sprite.tint = new Color(0,0,0,1.0)
    }
}

class TimedSequence {
    constructor(data) {
        this.data = data;
        this.current = 0;
        // data format is
        /* 
        [
            {
                "function": *callback*,
                "delta": *seconds*,
                "arg": 0
            }
        ]
        */
       // "Function" will be called with a 'current index' parameter as well as the "arg" parameter,
       //   since the best use case of these is an attack like Loox's. 
    }

    loopAction() {
        this.data[this.current].function(this.current, this.data[this.current].arg ? arg : 0);
        this.current += 1;
        if (this.current < this.data.length) {
            setTimeout(this.loopAction,this.data[this.current-1].delta * 1000)
        }
    }
}

class LoopedAction {
    constructor(func,count,delay,instant=true) {
        this.current = 0;
        this.func = func;
        this.delay = delay;
        this.count = count;
        if (instant) {
            this.loop(this);
        }
        this.myInterval = setInterval(() => this.loop(this),this.delay*1000)
    }

    loop(self) {
        if (this.current < this.count) {
            self.func(self.current)
            self.current += 1;
        } else {
            self.completed();
            clearInterval(self.myInterval)
        }
    }

    stop() {
        this.current = 99999;
        clearTimeout(this.myInterval)
    }

    completed() {}
}

function basicTextAct(enemy, message, mercyCounter = 0, func) {
    textbox.show();
    textbox.setMessage(message);
    textbox.confirmed = function() {
        if (mercyCounter != 0) {
            enemy.addMercy(mercyCounter);
        }
        setTimeout(function(self = this) {
            playerActDone();
            textbox.hide();
            func();
        }.bind(this),500)
    }
}

// === //
// ⭐ ENEMY CLASSES
class Enemy extends Tickable {
    mercy = 0;
    maxHp = 1;
    name = "Enemy"
    acts = []
    battleBackground = 1;
    bbgWave = 0;
    flavorTexts = [
        "Flavor Text"
    ]
    description = "It's an enemy. Wow."
    sprite = new Sprite("enemy/dummy");
    x = 128;
    y = 64;
    frameNorm = 0;
    frameSpareDeath = 0;
    turns = 0;
    dead = false;
    priority = 1;
    fearful = true; // Able to be spared instantly when attacked?

    constructor() {
        super()
        this.priority = 2;
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
        this.sprites = [this.sprite]
    }

    init() {
        this.acts.splice(0,0,{"name": "Check", "func": this.actCheck})
        this.hp = this.maxHp;
        this.x = this.x + (this.enemyNumber * 160)
    }

    get spriteTime() {
        return this.spared ? 0 : globalTime + (0.5 * this.enemyNumber);
    }

    manualSpare(player = true) {
        this.mercy = 100;
        this.spare()
        undertale.battle.enemies.splice(undertale.battle.enemies.indexOf(this),1)
        if (!undertale.battle.winCheck()) {
            if (player) {
                playerActDone();
            } else {
                enemyAttackDone();
            }
        }
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
        }.bind(this), 600)
    }

    hurtAnimation(undo) {
        if (!undo) {
            this.frame = this.frameSpareDeath;
        } else {
            this.frame = this.frameNorm;
        }
    }

    mercyAnimation() {
        this.sprite.tint = new Color(255,255,0,100)
        setTimeout(function(self = this) {
            this.sprite.tint = new Color(0,0,0,0)
        }.bind(this),200)
    }

    onDamage(damage, success = false) {
        if (success) {
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
    }

    deathAnimation() {
        playSound("monsterdust.wav")
        this.sprite.disintegrating = true;
        setTimeout(() => {
            this.dead = true;
        },500)
    }

    spareAnimation() {
        this.frame = this.frameSpareDeath;
        this.sprite.tint = new Color(0,0,0,50);

        let dust = new SpareDust(this.x + ((this.sprite.image.naturalWidth / this.sprite.num)/2),this.y + (this.sprite.image.naturalHeight / 2));
        undertale.spawn(dust);
    }

    spare() {
        this.changePriority(this.priority - 1)
        playSound("snd_spare.wav")
        this.spared = true;
        this.spareAnimation();
        //undertale.battle.enemies.splice(undertale.battle.enemies.indexOf(this),1)
    }

    spareAttempt() {
        playerActDone();
        textbox.hide();
    }

    deferredRender() {
        this.sprite.draw(this.x + this.xOffset,this.y,this.frame)
    }

    render() {
        if (!this.dead) {
            this.deferredRender();
            if (this.drawHealthBar) {
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
    }

    attack() {
        this.testAttack()
    }

    testAttack() {
        new AttackFactory(() => {
            for (let x = 0;x < 5; x++) {
                new Bullet(new Sprite("soul"),320+(x*16),240,5,function(){this.y += 2})
            }
        },3)
    }
}

class Dummy extends Enemy {
    maxHp = 1;
    name = "Dummy";
    acts = [{name: "Talk", "func": this.actTalk}]
    flavorTexts = [
        "Dummy stands around\nabsentmindedly.",
        "Dummy looks like it's about\nto fall over."
    ]
    description = "A cotton heart and a button eye\nYou are the apple of my eye"
    fearful = false;
    battleBackground = 0;
    bored = 0;

    actCheck(self) {
        textbox.show();
        textbox.setMessage(self.description);
        textbox.confirmed = function() {
            textbox.hide();
            self.bored += 1;
            self.boredCheck();
        }
    }

    onDamage(damage, success = false) {
        super.onDamage(damage, success)
        if (!success) {
            this.bored += 1;
            this.boredCheck()
        }
    }

    attack() {
        defaultBattleBox()
        setTimeout(function() {
            enemyAttackDone()
        },1000)
    }

    actTalk(self) {
        dialogList(["You talk to the DUMMY.\n*...","It doesn't seem much for\nconversation...","TORIEL seems happy with you."], function() {
            self.manualSpare();
        })
    }

    spareAttempt() {
        this.bored += 1;
        this.boredCheck(true);
    }

    boredCheck(e = true) {
        if (this.bored > 3) {
            textbox.show();
            textbox.setMessage("Dummy tires of your\naimless shenanigans.")
            textbox.confirmed = function(self = this) {
                this.mercy = 100;
                this.spare();
                undertale.battle.winCheck();
            }.bind(this)
        } else {
            if (e) {
                playerActDone();
            }
        }
    }
}

class Froggit extends Enemy {
    mercy = 0;
    maxHp = 30;
    name = "Froggit"
    acts = [
        {"name": "Compliment", "func": this.actCompliment},
        {"name": "Threat", "func": this.actThreat},
    ]
    flavorTexts = [ // @TODO: Flavor Texts
        "It smells like mustard seed.",
        "Froggit Text"
    ]
    description = "Life is difficult for this enemy."
    face = new Sprite("enemy/froggit_face",2);
    body = new Sprite('enemy/froggit_body',2);
    x = 64;
    y = 128;
    frameNorm = 0;
    frameSpareDeath = 1;
    dialog = "Ribbit,\nribbit."

    constructor() {
        super()
        this.sprites = [this.face,this.body]
    }

    actCompliment(self) {
        if (self.mercy < 100) {
            self.dialog = "(Blushes\ndeeply)\nRibbit..."
            basicTextAct(self,"Froggit didn't understand\nwhat you said, but was\nflattered anyway.",100)
            self.flavorTexts = ["Froggit seems reluctant to fight\nyou."]
        } else {
            self.dialog = "Ribbit..."
            basicTextAct(self,"Froggit still doesn't\nunderstand.")
            self.flavorTexts = ["Froggit writes down your\ncompliments."]
        }
    }

    actThreat(self) {
        self.dialog = "Shiver,\nshiver."
        basicTextAct(self,"Froggit didn't understand what you\nsaid, but was scared anyway.")
    }

    deathAnimation() {
        playSound("monsterdust.wav")
        this.face.disintegrating = true;
        this.body.disintegrating = true;
    }

    mercyAnimation() {
        this.face.tint = new Color(255,255,0,100)
        this.body.tint = new Color(255,255,0,100)
        setTimeout(function(self = this) {
            this.face.tint = new Color(0,0,0,0)
            this.body.tint = new Color(0,0,0,0)
        }.bind(this),200)
    }

    spareAnimation() {
        this.frame = this.frameSpareDeath;
        this.body.tint = new Color(0,0,0,50);
        this.face.tint = new Color(0,0,0,50);

        let dust = new SpareDust(this.x + ((this.sprite.image.naturalWidth / this.sprite.num)/2),this.y + (this.sprite.image.naturalHeight / 2));
        undertale.spawn(dust);
    }

    deferredRender() {
        let f = Math.round((this.spriteTime * .02) % 1)
        let b = Math.round((this.spriteTime * .07) % 1)
        this.face.draw(this.x + this.xOffset + Math.sin(this.spriteTime * .1) * 5,this.y + Math.sin(this.spriteTime * .2) * 2,f)
        this.body.draw(this.x + this.xOffset * 2,this.y + 62,b)
    }

    attack() {
        defaultBattleBox()
        let m = new TextBubble(this.dialog, this.face);
        m.confirmed = choose([this.frogAttack,this.fliesAttack])
    }

    frogAttack() {
        var fx = 365;
        var fy = 355;
        new AttackFactory(() => {},2)
        let px = fx
        let py = fy

        let frog = new Bullet(new Sprite("enemy/froggit_frog"),0,0,5,function() {
            this.sprite.num = 2;
            this.x = fx;
            this.y = fy;
        },24,24,2,new Vector2(8,8))
        setTimeout(() => {
            frog.frame = 1 
            new Tween(40, (t) => {
                fx = lerp(px, 230, t)
                fy = lerp(py, 290, Math.pow(t,3))
            })
        },1000) 
    }

    fliesAttack() {
        new AttackFactory(() => {
            for (let x = 0; x < 5; x++) {
                let e = x * 4;
                let trackX = player.x
                let trackY = player.y
                let px = 380;
                let py = 320;
                let traveling = false;
                new Bullet(new Sprite("soul_shard"),px,py,4, function() {
                    if ((this.time + e) % 15 == 0)  {
                        trackX = player.x;
                        trackY = player.y;
                        px = this.x;
                        py = this.y
                        traveling = !traveling;
                    }
                    if (traveling) {
                        //if (this.x != px && this.y != py) {
                            this.x += (trackX - this.x) * .1
                            this.y += (trackY - this.y) * .1
                        //}
                    }
                },4,4)
            }

        },5)
    }
}

class Whimsun extends Enemy {
    mercy = 0;
    maxHp = 10;
    name = "Whimsun"
    acts = [
        {"name": "Console", "func": this.actConsole},
        {"name": "Terrorize", "func": this.actTerrorize},
    ]
    flavorTexts = [ 
        "Whimsun continues to mutter\napologies.",
        "Whimsun avoids eye contact.",
        "Whimsun is fluttering.",
        "It's starting to smell like lavender\nand mothballs."
    ]
    description = "This monster is too sensitive to fight..."
    sprite = new Sprite("enemy/froggit_face",2);
    x = 128;
    y = 64;
    dialog = "I'm sorry..."

    actConsole(self) {
        dialogList(["Halfway through your first\nword, Whimsun bursts into\ntears and runs away."], function() {
            self.manualSpare();
        })
    }

    actTerrorize(self) {
        basicTextAct(self,"You raise your arms and\nwiggle your fingers.\n*Whimsun freaks out!")
        self.flavorTexts = ["Whimsun is hyperventilating."]
    }

    attack() {
        defaultBattleBox()
        let m = new TextBubble(this.dialog, this.sprite);
        m.confirmed = wrapChoice([this.mothsCircleAttack,this.mothsLineAttack],this.turns)
    }

    mothsCircleAttack() {
        new AttackFactory(function(self) {
            var centerX = 312
            var centerY = 307
            var radius = 70
            for (let x=0;x<24;x++) {
                new Bullet(new Sprite("soul"),0,0,3,function() {
                    this.x = (centerX + Math.cos((globalTime/32) + (x*32)) * radius)
                    this.y = (centerY + Math.sin((globalTime/32) + (x*32)) * radius)
                    this.rot = Math.sin(globalTime * .1) * 30
                })
            }
        },4)
    }

    mothsLineAttack() {
        new AttackFactory(function(self) {
            self.loop(function() {
                new Bullet(new Sprite("soul"),265,380,3,function() {
                    this.x = 265 - Math.abs(Math.sin(globalTime * 0.05) * 24)
                    this.y -= Math.random() * 6
                    this.rot = Math.sin(globalTime * .1) * -15
                })
                new Bullet(new Sprite("soul"),355,380,3,function() {
                    this.x = 355 + Math.abs(Math.sin(globalTime * 0.05) * 24)
                    this.y -= Math.random() * 6
                    this.rot = Math.sin(globalTime * .1) * 15
                })
            },300)
        },4)
    }

    deferredRender() {
        this.sprite.draw(this.x + this.xOffset,this.y + (Math.sin(this.spriteTime * .2) * 8),this.frame)
    }
}

class Loox extends Enemy {
    maxHp = 50;
    name = "Loox"
    difficulty = 0;
    acts = [
        {"name": "Pick On", "func": this.actPickOn},
        {"name": "Don't Pick On", "func": this.actDontPickOn},
    ]
    flavorTexts = [ 
        "Loox is staring right through\nyou.",
        "Loox is gazing at you.",
        "Loox gnashes its teeth.",
        "Smells like eyedrops."
    ]
    description = "Don't pick on him. Family name:\nEyewalker. "
    sprite = new Sprite("enemy/loox",5);
    x = 128;
    y = 64;
    dialog = "Please\ndon't pick\non me."
    dialogOffset = new Vector2(24,-16)

    actPickOn(self) {
        self.dialog = "You rude\nlittle snipe!"
        basicTextAct(self,"You picked on Loox.")
        self.difficulty = Math.min(self.difficulty + 1,3)
    }

    actDontPickOn(self) {
        if (self.mercy < 100) {
            self.dialog = "Finally\nsomeone\ngets it."
            basicTextAct(self,"You decide not to pick on Loox.",100)
        } else {
            self.dialog = "It's a real\npleasure!"
            basicTextAct(self,"You continue to refrain from\npicking on Loox.")
        }
    }

    attack() {
        defaultBattleBox()
        let m = new TextBubble(this.dialog, this.sprite,true,this.dialogOffset);
        m.confirmed = this.wormsAttack;
    }

    circlesAttack() {

    }

    wormsAttack() {
            var sign = 1;
            new AttackFactory(()=>{
                new LoopedAction((n) => {
                    sign = n % 2 == 0 ? -1 : 1; // alternate sign per bullet.
                    var centerX = 300
                    var centerY = 250 + (n * 32)
                    
                    new Bullet(new Sprite("enemy/looxattacks",2),centerX,0,3,function() {
                        this.s = sign;
                        this.cy = centerY;
                        this.x += this.s * (3);
                        this.y = this.cy + Math.sin((globalTime*2) * .2) * 8;
                    }).centerX = centerX;centerY = centerY; // send the main variable to these guys.
                    let small1 = new Sprite("enemy/looxattacks",2)
                    new Bullet(small1,centerX-(sign*16),0,3,function() {
                        this.frame = 1;
                        this.s = sign;
                        this.cx = centerX;
                        this.cy = centerY;
                        this.x += this.s * (3);
                        this.y = this.cy + Math.sin(((globalTime-3)*2) * .2) * 4;
                    }).centerX = centerX;centerY = centerY;
                    new Bullet(small1,centerX-(sign*32),0,3,function() {
                        this.frame = 1;
                        this.s = sign;
                        this.cx = centerX;
                        this.cy = centerY;
                        this.x += this.s * (3);
                        this.y = this.cy + Math.sin(((globalTime-6)*2) * .2) * 4;
                    }).centerX = centerX;centerY = centerY;
                },500,1)
            },4)
    }

    deferredRender() {
        this.sprite.scale = new Vector2(2,2)
        var l = Math.round(Math.max(Math.sin(this.spriteTime * .3),0) * 3)
        this.sprite.draw(this.x + this.xOffset,this.y,l)
    }
}

class Napstablook extends Enemy {
    maxHp = 88;
    name = "Napstablook"
    priotity = 1;
    acts = [
        {"name": "Threat", "func": this.actThreat},
        {"name": "Cheer", "func": this.actCheer},
        {"name": "Flirt", "func": this.actFlirt},
    ]
    textboxOffset = new Vector2(64,18)
    flavorTexts = [ 
        "Loox is staring right through\nyou.",
        "Loox is gazing at you.",
        "Loox gnashes its teeth.",
        "Smells like eyedrops."
    ]
    battleBackground = 2;
    difficulty = 0;
    description = "This monster doesn't seem to have a\nsense of humor..."
    sprite = new Sprite("enemy/napstablook",2);
    hat = new Sprite("enemy/dapperblook",5)
    hatFrame = -1
    mercy = 0;
    x = 256;
    y = 80;
    dialog = "nnnnnnggghhh."
    state = 0;
    fearful = false;
    deferDialog = false;
    // 0 - 3: Cheered or flirted. Threatening 
    constructor() {
        super()
        this.hat.scale = new Vector2(2,2)
    }
    //  once will lower by 1,
    //  threatening after dapper blook sets it to -6.

    actCheck(self) {
        super.actCheck(self);
        self.dialog = "oh, i'm\nREAL funny."
    }

    actThreat(self) {
        if (self.state > 3) {
            self.difficulty = 1;
            self.state = -3;
            self.dialog = "now i see\nhow it\nis..."
        } else {
            self.dialog = "go ahead,\ndo it."
        }
        playerActDone();
    }

    actCheer(self) {
        let f;
        if (self.state == 0) { f = "You gave Napstablook a patient smile.";self.flavorTexts = ["Napstablook looks just a little bit\nbetter."]} else
        if (self.state == 1) { f = "You told Napstablook a little joke.";self.flavorTexts = ["Cheering seems to have improved\nNapstablook's mood again."]} else 
        if (self.state == 2) { f = "Napstablook wants to show you\nsomething.";self.flavorTexts = ["Napstablook eagerly awaits your\nresponse."]} else
        if (self.state > 3) {
            undertale.battle.background.fadeOut();
            dialogList(["oh no...","i usually come to the RUINS\nbecause there's nobody around...","but today i met somebody nice...", "...", "oh, i'm rambling again", "i'll get out of your way"], () => {
                self.mercy = 100;
                self.spare();
                undertale.battle.winCheck();
            })
        } else
        {f = "You try to console Napstablook..."}
        if (f) {
            textbox.show();
            textbox.setMessage(f)
            textbox.confirmed = (n = self) => {
                self.deferDialog = true;
                var e;
                if (n.state == 0) { e = "heh..."} else 
                if (n.state == 1) { e = "heh heh..."} else
                if (n.state == 2) { // activates dapperblook.
                    n.state = 3;
                    playerActDone();
                }
                if (e) {
                    let m = new TextBubble(e, n.sprite, true, self.textboxOffset);
                    m.confirmed = () => {playerActDone()}
                }
                n.state += 1;
            }
        }
    }

    actFlirt(self) {
        self.state += 1;
        new TextBubble("i'd just weigh you\ndown.",self.sprite, true, self.textboxOffset).confirmed = () => {
            playerActDone();
        }
    }

    attack() {
        //
        if (this.state == 3) {
            defaultBattleBox();
            let m = new TextBubble("let me try...", this.sprite, true, this.textboxOffset);
            m.confirmed = () => {
                new LoopedAction((n) => {this.hatFrame = n},5,0.4).completed = () => {
                    m = new TextBubble("i call it\n'dapper\nblook...'", this.sprite, true, this.textboxOffset);
                    m.confirmed = () => {
                        m = new TextBubble("do you like\nit...", this.sprite, true, this.textboxOffset);
                        m.confirmed = () => {
                            enemyAttackDone();
                        }
                    }
                }
            }
        } else {
            if (this.turns == 1) {
                player.collides = true;
                player.x = 312
                player.y = 307
                battlebox.interpTo(195,220,435,395)
            } else {
                defaultBattleBox()
            }
            let m = new TextBubble(this.dialog, this.sprite, true, this.textboxOffset);
            this.dialog = choose(["nnnnnng\ngghhh.", "just pluggin\nalong...", "i'm fine,\nthanks."])
            m.confirmed = () => {
                if (this.turns == 2) {
                    this.notFeelinIt();
                } else {
                    wrapChoice([this.wallTearsAttack,this.EyeTearsAttack,this.EyeTearsAttack],this.turns-1)(this);
                }
            }
        }
    }

    spareAnimation() {
        this.tick = () => {this.x += 7}
    }

    circlesAttack() {

    }

    notFeelinIt() {
        new AttackFactory(() => {
            let s = new Sprite("enemy/really_blook");
            s.scale = new Vector2(2,2)
            let e = new Bullet(s,5,5,-1)
            let t = undertale.spawn(new Tickable());
            t.tick = () => {
                e.x = 215 + (Math.random())
                e.y = 250 + (Math.random())
            }
        },3).completed(() =>  {
            t.destroy();
            e.destroy();
        })
    }

    wormsAttack() {
        new AttackFactory(function(self) {
            var side = choose([0,1])
            var centerX = [240,480]
            centerX = centerX[side]
            var centerY = 250

            new Bullet(new Sprite("enemy/looxattacks",2),0,0,3,function() {
                this.x = centerX + globalTime;
                this.y = centerY + Math.sin(globalTime * .2) * 8;
            })
            new Bullet(new Sprite("enemy/looxattacks",2),0,0,3,function() {
                this.x = centerX + globalTime;
                this.y = centerY + Math.sin((globalTime - .5) * .2) * 8;
            })
        },4)
    }

    wallTearsAttack(self) {
        //x.interpTo(235,220,405,395)
        var L;
        var A = new AttackFactory(() => {
            L = new LoopedAction(() => {
                let b = new Bullet(new Sprite("enemy/napstablook_bullets",2),((390-245)*Math.random()) + 245,220,6,function(){
                    this.y += this.yspd;
                    this.x += this.xspd;
                    if (this.y > 385 && (this.yspd != 0)) {
                        this.yspd = 0;
                        this.xspd = choose([-4-(self.difficulty*2),4+(self.difficulty*2)])
                        this.rember = this.xspd;
                    }
                    if ((this.x < 240 || this.x > 388) && this.xspd != 0) {
                        this.xspd = 0;
                        this.yspd = -4-(self.difficulty*2);
                    }
                    if (this.yspd < 0 && this.y < 230 && this.yspd != 0) {
                        this.xspd = -this.rember;
                        this.yspd = 0;
                        setTimeout(() => {
                            this.xspd = 0;
                            this.yspd = 4+(self.difficulty*2)
                        },(Math.random() * 500)+500)
                    }
                    if (this.xspd != 0) {
                        this.rot = 90;
                    } else {
                        this.rot = 0;
                    }
                },6,16,new Vector2(8,0))
                b.yspd = 4+(self.difficulty*2);
                b.xspd = 0;
                b.rember = 0;
            },20+(self.difficulty*10),0.5-(self.difficulty*0.3))
        },6)
        A.completed = () => {L.stop();console.log(L)}

    }

    EyeTearsAttack(self) {
        let L;
        console.log(self)
        new AttackFactory(() => {
            L = new LoopedAction(() => {
                let s = new Sprite("enemy/napstablook_bullets",2)
                let b = new Bullet(s,320,100,6,function() {
                    this.timer += 1;
                    this.y += Math.min(Math.pow((-.08 * this.timer),2),8)
                    this.x += this.direction * this.speed
                    this.frame = 1
                })
                b.speed = Math.random() * 3
                b.direction = choose([-1,1])
                b.timer = 0;
            },40+(self.difficulty * 10),0.1-(self.difficulty * 0.06))
        },4).completed = () => {L.stop()}
    }

    deferredRender() {
        this.sprite.scale = new Vector2(2,2)
        var l = Math.round(this.spriteTime * .1 % 1)
        this.sprite.draw(this.x + this.xOffset,this.y,l)
        this.hat.draw(285,44,this.hatFrame)
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
        player.changeSoulMode(SoulModeGreen)
        new SpearsAttackFactory("9u*9d*9l*9r*6uu*6dd*6ll*6rr")
    }

    testAttack() {
        new AttackFactory(() => {
            for (let x = 0;x < 5; x++) {
                new Bullet(new Sprite("soul"),320+(x*16),240,5,function(){this.y += 2})
            }
        },3)
    }
}

// === //
// GIMMICK CLASSES

class BattleGimmick {
    constructor() {
        
    }
}

class KarmaGimmick {
    constructor() {
        
    }
}

class SpareDust extends Tickable {
    x;
    y;
    constructor(x,y) {
        super()
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
    frame = 0;
    homeAmount = 0; 
    time = 0;
    rot = 0;
    timer = 0;
    constructor(sprite, x, y, damage = 5, movement = () => {}, collisionWidth = 16, collisionHeight = 16,collisionOffset = new Vector2(0,0)) {
        super()
        this.priority = 2.1;
        //this.sprite = new Sprite(sprite);
        this.sprite = sprite;
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.collides = true;
        this.collisionWidth = collisionWidth;
        this.collisionHeight = collisionHeight;
        this.collision = new Collision(x,y,x+collisionWidth,y+collisionHeight)
        this.collision.blocking = false;
        this.movement = movement;
        this.offset = collisionOffset;
        this.collision.onHit = function(other) {
            if (damage >= 0) {
                if (other == player) {
                    if (player.invincibility == 0) {
                        player.invincibility = 35;
                        player.onDamage(damage)
                    }

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
        let dx = player.x - this.x
        let dy = player.y - this.y
        this.x += (player.x - this.x) * (this.homeAmount)
        this.y += (player.y - this.y) * (this.homeAmount)
        this.collision.x = this.x + this.offset.x
        this.collision.y = this.y + this.offset.y
        this.collision.x1 = this.x + this.collisionWidth + this.offset.x
        this.collision.y1 = this.y + this.collisionHeight + this.offset.y
    }

    render() {
        this.sprite.draw(this.x,this.y,this.frame,this.rot);
    }
}

// === //
// ⭐ SOUL CLASSES
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

class SoulModeGreen extends SoulMode {
    color = new Color(0,255,0)
    tween = {completed:true};
    rotation = 0;
    dir = 0;

    constructor(owner) {
        super();
        this.owner = owner;
        this.shield = new Sprite("ui/shield");
    }

    helpfulTween(self,rotation) {
        let pr = this.rotation;
        self.tween = new Tween(4, (t) => {
            this.rotation = lerp(pr,rotation,t)
        })
    }

    tick() {
        if (horzKey > 0) {
            this.dir = 1;
        } else if (horzKey < 0) {
            this.dir = 3;
        }
        if (vertKey < 0) {
            this.dir = 0;
        } else if (vertKey > 0){
            this.dir = 2;
        }
        if (this.tween.completed) {
            if (horzKey > 0) {
                this.helpfulTween(this,90)
            } else if (horzKey < 0) {
                this.helpfulTween(this,270)
            }
            if (vertKey < 0) {
                this.helpfulTween(this,0)
            } else if (vertKey > 0){
                this.helpfulTween(this,180)
            }
        }
    }

    render() {
        if (this.owner.dodgeMode) {
            this.shield.draw(this.owner.x-28,this.owner.y-24,0,this.rotation, new Vector2(.5,1))
        }
        super.render();
    }
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
    moveCooldown = 0
    dir = 0;

    tick() {
        if (!this.owner.death) {
            this.owner.x += horzKey * 3;
        }
        if (vertKey != 0 && this.moveCooldown == 0) {
            this.dir = Math.sign(vertKey);
            this.moveCooldown = 5
        }
        if (this.moveCooldown != 0) {
                this.owner.y += 12.8 * this.dir
                this.moveCooldown -= 1;
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
    dodgeMode = false;
    priority = 2;
    

    constructor() {
        super();
        this.priority = 2.1
        this.mode = undertale.battle.initialSoulMode
        this.mode.owner = this;
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
            this.dodgeMode = false;
            this.hp = 0;
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
            setTimeout(function(self = this) {
                undertale.battle.returnToMenu();
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
                this.dodgeMode = false;
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
                        
                        for (let x = 0; x < undertale.battle.enemies.length; x++) {
                            if (undertale.battle.enemies[x].mercy >= 100) {
                                foundOne = true;
                                THEDEADONES.push(undertale.battle.enemies[x])
                                undertale.battle.enemies[x].spare();
                            }
                        }
                        if (!foundOne) {
                            textbox.show();
                            textbox.setMessage("But nobody's names were yellow...")
                            textbox.confirmed = function() {
                                for (let x in undertale.battle.enemies) {
                                    if (undertale.battle.enemies[x].mercy < 100) {
                                        undertale.battle.enemies[x].spareAttempt();
                                    }
                                }
                            }
                        } else {
                            setTimeout(function() {
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
                this.chooseSelSprite()
                this.targetSelect = false;
                this.actTargetSelect = false;
                this.selectMenu = true;
                this.itemSelect = false;
                this.actMenu = false;
                textbox.show()
                //chooseFlavorText();
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
            }
        }

        if (this.selectMenu) {
            this.selectedAct = clamp(this.selectedAct + h, 0, 3);

            if (h != 0) {
                playSound("snd_squeak.wav")
                this.chooseSelSprite();
                
            }
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
        this.mode.owner = this;
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
    canvas.fillStyle = "rgba(0,0,0,"+(enemyFade)+")"
    canvas.fillRect(0,0,640,480)
        if (this.drawSoul) {
            this.mode.render()
        }
    }
}

class BattleBackground extends Tickable {
    constructor(waves = 0,type=0) {
        super()
        this.priority = 0.01;
        this.type = type;
        if (this.type == 0) {
            this.bg = new Sprite("ui/bbg");
            this.waves = waves;
        } else {
            this.bg = new Sprite("ui/bbg2")
            this.bg2 = new Sprite("ui/bbg2")
            this.bg2.scale = new Vector2(1,1)
        }

    }

    render() {
        if (this.type == 0) {
            for (let x = 0; x < 6;x++) {
                this.bg.draw((x * 100)+20,8 + Math.sin((globalTime*5)+x) * this.waves)
            }
        } else {
            this.bg.draw(32)
            this.bg2.draw(420,0,0,-180)
        }
    }

    fadeOut() {
        if (this.type == 0) {
            new Tween(50,(t) => {
                console.log("iuhlsfc")
                this.bg.tint = new Color(0,0,0,(1-t*t)*100)
            })
        } else {
            new Tween(50,(t) => {
                this.bg.tint = new Color(0,0,0,(1-t*t)*100)
                this.bg2.tint = new Color(0,0,0,(1-t*t)*100)
            })
        }
    }
}

// === //
// ⭐ PRESETS DATA
var storyModeBattles = [
    // Ruins
    {
        "enemies": [Dummy],
        "encounter": "You encountered the Dummy.",
        "music": "dummybattle.mp3"
    },
    {
        "enemies": [Froggit], // Froggit
        "encounter": "Froggit hopped in close!"
    },
    {
        "enemies": [Froggit,Whimsun], // Froggit, Whimsun
        "encounter": "Froggit and Whimsun drew near!"
    },
    {
        "enemies": [Froggit, Froggit, Froggit] // Moldsmal (x3)
    },
    {
        "enemies": [Napstablook],
        "encounter":"Here comes Napstablook."
    },
    {
        "enemies": [Loox, Loox] // Loox (x2)
    },
    {
        "enemies": [Froggit, Froggit] // Moldsmal, Migosp
    },
    {
        "enemies": [Froggit] // Napstablook
    },
    {
        "enemies": [Froggit, Froggit] // Vegetoid (x2)
    },
    {
        "enemies": [Froggit] // Toriel
    },
    // Snowdin
    {
        "enemies": [Froggit] // Snowdrake
    },
    {
        "enemies": [Froggit] // Icecap
    },
    {
        "enemies": [Froggit] // Icecap, Snowdrake
    },
    {
        "enemies": [Froggit] // Gyftrot
    },
    {
        "enemies": [Froggit] // Snowdrake, Icecap, jerry
    },
    {
        "enemies": [Froggit] // Papyrus
    },
    // Waterfall
    {
        "enemies": [Froggit] // Aaron
    },
    {
        "enemies": [Froggit] // Aaron, Woshua
    },
    {
        "enemies": [Froggit] // Shyren
    },
    {
        "enemies": [Froggit] // Temmie
    },
    {
        "enemies": [Froggit] // Mad Dummy
    },
    {
        "enemies": [Froggit] // Undyne (or Undying)
    },
    // Hotland
    {
        "enemies": [Froggit] // Vulkin
    },
    {
        "enemies": [Froggit] // Tsundereplane
    },
    {
        "enemies": [Froggit] // Pyrope
    },
    {
        "enemies": [Froggit] // Mettaton Quiz
    },
    {
        "enemies": [Froggit] // RG 01 and RG 02
    },
    // Core
    {
        "enemies": [Froggit] // Madjick, Knight Knight
    },
    {
        "enemies": [Froggit] // Final Froggit, Whimsalot
    },
    {
        "enemies": [Froggit] // Astigmatism
    },
    {
        "enemies": [Froggit] // Final Froggit, Whimsalot, Astigmatism (What a nightmare!)
    },
    {
        "enemies": [Froggit] // Mettaton EX
    },
    // New Home
    {
        "enemies": [Froggit], // Sans
        "gimmick": BattleGimmick, // @todo Karma mechanic
        "genocide": true
    },
    {
        "enemies": [Froggit], // Asgore
        "gimmick": BattleGimmick // @todo no mercy
    },
    {
        "enemies": [Froggit], // Photoshop Flowey (Has his own gimmick)
        "gimmick": BattleGimmick // @todo photoshop flowey gimmick
    },
    // True Lab
    {
        "enemies": [Froggit], // Memoryhead (x3)
        "pacifist": true
    },
    {
        "enemies": [Froggit], // Endogeny
        "pacifist": true
    },
    {
        "enemies": [Froggit], // Reaper Bird
        "pacifist": true
    },
    {
        "enemies": [Froggit], // Lemon Bread
        "pacifist": true
    },
    {
        "enemies": [Froggit], // Snowdrake's Mother
        "pacifist": true
    },
    // True Pacifist
    {
        "enemies": [Froggit], // Asriel Dreemur
        "pacifist": true
    },
]

var enemiesList = [
    Dummy,
    Froggit,
    Whimsun,
    Enemy,
    Loox,
    Napstablook
]

// === //
// UI ELEMENTS

class AttackBar extends Tickable {
    constructor(damage) {
        super()
        this.priority = 2.1
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
            let didDamage = false;
            if (e.keyCode == 90 || e.keyCode == 13) { // Z
                this.canPress = false;
                didDamage = true;
                let playerDamageMultiplier = -Math.abs((2 * this.progress) - 1) + 4;
                let u = undertale.battle.enemies[player.selectedListItem];
                u.onDamage(this.damage * playerDamageMultiplier,true)
                if (u.mercy >= 100 && !u.forcedMercy) {
                    playerDamageMultiplier = 99999;
                }
                this.moving = false;
                this.flicker = true;
                
                setTimeout(function(self = this) {
                    if (!didDamage) {
                        undertale.battle.enemies[player.selectedListItem].onDamage(0,false)
                    }
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
        this.priority = 2
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
        this.collision.y = this.y1 + 2;
        this.collision.x1 = this.x2 - 16;
        this.collision.y1 = this.y2 - 18;
    }

    render() {
        canvas.beginPath();
        canvas.fillStyle = "black";
        canvas.fillRect(this.x1,this.y1,(this.x2-this.x1),(this.y2-this.y1))
        canvas.stroke()


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
        this.priority = 2.1
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
                    this.pressedo = true;
                    console.log("textbox confirmed")
                    this.confirmed();
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
        var ctext = ""
        for (let x in this.curMessage) {
            ctext += (this.message[x])+" "
        }
        ctext = this.curMessage.replace(/ /g,"  ")
        printAt(canvas,ctext,84,294,32,484)
    }
}

class TextBubble extends Tickable {
    constructor(message, speaker, confirmable = false, offset = new Vector2(0,-32), extraSize = new Vector2(0,0)) {
        super()
        this.message = message;
        this.speaker = speaker;
        this.curLetter = 0;
        this.priority = 0.6
        this.curMessage = "";
        this.offset = offset;
        this.prevMessage = message;
        this.extraSize = extraSize;
        let i = setInterval(function(self = this) {
            if (self.curLetter < self.message.length) {
                self.curMessage = self.curMessage + self.message.charAt(self.curLetter);
                self.curLetter += 1;
            } else {
                this.confirmable = false;
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
        let w = 128 + this.extraSize.x;
        let h = 64 + this.extraSize.y;
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
        canvas.font = "16px bubbleFont";
        var ctext = this.curMessage
        printAt(canvas,ctext,x+16+offset.x,y+24+offset.y,20)

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
    enemies = []
    background;
    constructor(data) {
        this.data = data;
        this.BattleDatatoVars(data)
    }

    BattleDatatoVars(data) {
        this.initialSoulMode = data.soulMode ? new data.soulMode : new SoulMode()
        for (let x in data.enemies) {
            this.enemies.push(new data.enemies[x])
        }
        this.gimmick = data.gimmick ? data.gimmick : new BattleGimmick()
        this.love = data.love ? data.love : 1;
        this.music = data.music ? data.music : "enemy.mp3"
        for (let x = 0; x < this.enemies.length; x++) {
            this.enemies[x].enemyNumber = x;
        }
        if (this.enemies[0].battleBackground != 0) {
            this.background = undertale.spawn(new BattleBackground(this.enemies[0].bbgWave,this.enemies[0].battleBackground));
        }
        this.encounter = data.encounter ? data.encounter : "Encounter Message\n*Change this"
    }

    winCheck() {
        let allDead = true;
        for (let x in this.enemies) {
            if (this.enemies[x].hp > 0 && !this.enemies[x].spared) {
                allDead = false;
            }
        }
        if (undertale.battle.enemies.length == 0) {
            allDead = true;
        }
        if (allDead) {
            SND(this.music).pause()
            textbox.show()
            textbox.setMessage("YOU WON! You earned... nothing?")
            this.returnToMenu();
            return true;
        } else {
            return false;
        }
    }

    returnToMenu() {
        setTimeout(function() {
            MAIN_MENU.style.display = "block"
            canvasElement.style.display = "none"
        },3000)
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
        textbox.show();
        textbox.setMessage(this.battle.encounter);
        this.spawn(textbox)
    }

    spawn(actor) {
        this.tickables.push(actor);
        actor.init();
        this.tickables.sort((a, b) => (a.priority - b.priority))
        return actor;
    }
}
    
function addEnemySelect(defaultEnemy) {
    let newEnemy = document.createElement("select");
        let removeButton;
        newEnemy.style.display = "block"
        for (let x in enemiesList) {
            let option = document.createElement("option");
            option.style.display = "inline-block"
            removeButton = document.createElement("a");
            removeButton.innerHTML = "[-]"
            removeButton.className += " button"
            removeButton.style.display = "inline-block"
            option.innerHTML = enemiesList[x].name;
            option.selected = (x == defaultEnemy)
            newEnemy.appendChild(option)
        }
        //newEnemy.value = defaultEnemy;
        enemiesSlot.appendChild(newEnemy)
        //enemiesSlot.appendChild(removeButton)
}

function startGame(battleData) {
    confirmButton.style.display="block"
    joystick.style.display="block"
    backButton.style.display="block"
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

    /*
    document.onmousemove = function(event) {
        var rect = canvasElement.getBoundingClientRect();
        console.log((event.clientX - rect.left)+", "+(event.clientY - rect.top))
    }*/

    canvas.imageSmoothingEnabled = false;
    canvas.mozImageSmoothingEnabled = false
    canvas.webkitImageSmoothingEnabled = false
    canvas.imageSmoothingQuality = "low"

    //To start the game
    
    canvasElement.style.display = "block"
    undertale = new Undertale();
    undertale.startBattle(battleData)
    if (!gameLoopActive) {
        gameLoopActive = true;
        setInterval(function() {
            globalTime += timeDilation;
            for (let m in undertale.tickables) {
                //if (typeof undertale.tickables[m] !== undefined) {
                    undertale.tickables[m].beginTick();
                    undertale.tickables[m].tick();
                    undertale.tickables[m].checkCollision();
                    undertale.tickables[m].endTick();
                    undertale.tickables[m].render();
                //}
            }
            if (DEBUG_COLLISION) {
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
    }
    
}

// === //
// ⭐ DEBUGGING
const debugStartBattle = 4; // default: undefined
const DEBUG_COLLISION = false;

// === //
// MAIN MENU
window.addEventListener('load', function() {
    const GIMMICKS = [
        BattleGimmick,
        KarmaGimmick,
        BattleGimmick,
        BattleGimmick,
        BattleGimmick,
    ]
    const SOULMODES = [
        SoulMode,
        SoulModeBlue,
        SoulModeGreen, // green
        SoulModePurple,
        SoulModeYellow,
        SoulMode, // cyan
        SoulMode // orange
    ]
    enemiesSlot = document.getElementById("enemiesList")
    const PRESET_SELECT = document.getElementById("presetSelect");
    const GIMMICK_SELECT = document.getElementById("gimmickSelect");
    const SOULMODE_SELECT = document.getElementById("soulModeSelect");
    const ENEMY_SELECT = document.getElementById("enemySelect");
    const ENEMY_ADDER = document.getElementById("addEnemy")
    const CUSTOM_BEGIN = document.getElementById("customBegin")
    MAIN_MENU = document.getElementById("mainMenu")
    gamepad_toggle = document.getElementById("gamepadToggle")
    loadIndicator = document.getElementById("loadIndicator");
    canvasElement = document.getElementById("undertale")
    canvas = document.getElementById("undertale").getContext('2d')
    joystick = document.getElementById("joystickBack")
    confirmButton = document.getElementById("confirmButton")
    backButton = document.getElementById("backButton")

    for (let x in storyModeBattles) {
        let name = "";
        for (let y in storyModeBattles[x].enemies) {
            if (y < storyModeBattles[x].enemies.length-1) {
                name += storyModeBattles[x].enemies[y].name+", "
            } else {
                name += storyModeBattles[x].enemies[y].name
            }
        }
        var option = document.createElement("option")
        option.innerHTML = name;
        PRESET_SELECT.appendChild(option);
    }

    let gameLoop;
    let throbber = document.getElementById("throbber")
    loadIndicator.style.display = "block";
    throbber.style.display = "block";
    gamepad_toggle.style.display = "block"

    loadSprites([
        "enemy/dummy",
        "enemy/dapperblook",
        "enemy/really_blook",
        "enemy/napstablook_bullets",
        "ui/bbg",
        "ui/bbg2",
        "enemy/loox",
        "enemy/looxattacks",
        "enemy/napstablook",
        "ui/textBubble",
        "ui/ut_smoke",
        "ui/_act",
        "enemy/spear",
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
        "ui/shield",
        "enemy/froggit_body",
        "enemy/froggit_face",
        "enemy/froggit_frog",
        "ui/attackbar_indi1",
        "ui/attackbar_indi2",
        "enemy/mex_body",
        "enemy/mex_face",
        "enemy/mex_arms"
    ], spritesLoaded)

    function spritesLoaded() {
        loadAudio([
            "enemy.mp3",
            "dummybattle.mp3",
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
        
    throbber.style.display = "none"
    loadIndicator.style.display = "none"
    PRESET_SELECT.onchange = function(e) {
        let c = enemiesSlot.children
        for(let i = c.length - 1;i >= 0;i--) {
            c[i].remove();
        }
        
        for (let x in storyModeBattles[PRESET_SELECT.selectedIndex].enemies)
        {
            let i = storyModeBattles[PRESET_SELECT.selectedIndex].enemies[x]
            let g = enemiesList.indexOf(i)
            addEnemySelect(g == -1 ? 0 : g);
        }
        let gimmick = GIMMICKS.indexOf(storyModeBattles[PRESET_SELECT.selectedIndex].gimmick)
        let soulmode = SOULMODES.indexOf(storyModeBattles[PRESET_SELECT.selectedIndex].initialSoulMode)
        GIMMICK_SELECT.children[gimmick == -1 ? 0 : gimmick].selected = true;
        SOULMODE_SELECT.children[soulmode == -1 ? 0 : soulmode].selected = true;
    }

    gamepad_toggle.onclick = function(e) {
        // Why is this hard for me lol
        let g = getCookie("showGamepad");
        if (g) {
            setCookie("showGamepad",g)
        } else {
            setCookie("showGamepad",false)
        }
        confirmButton.style.display = !g ? "block" : "none"
    }

    addEnemySelect(0)
    ENEMY_ADDER.onclick = function(e) {
        addEnemySelect(0)
    }

    CUSTOM_BEGIN.onclick = function(e) {
        let enemiesResult = [];
        for (const child of enemiesSlot.children) {
            enemiesResult.push(enemiesList[child.selectedIndex])
        }
        MAIN_MENU.style.display = "none"
        startGame({
            "enemies": enemiesResult,
            "soulMode": SOULMODES[SOULMODE_SELECT.selectedIndex],
            "gimmick": GIMMICKS[GIMMICK_SELECT.selectedIndex]
        })
    }

    if (debugStartBattle != -1) {
        MAIN_MENU.style.display = "none"
        startGame(storyModeBattles[debugStartBattle])
    }
    }
})

export {Sprite, Tickable, undertale, player}
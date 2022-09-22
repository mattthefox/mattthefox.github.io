{
    mercy: 0;
    maxHp: 50;
    name: "Enemy"
    acts: [
        {"name": "Test", "func": function() {
            basicTextAct(this,"testy")
        }.bind(this)},
        {"name": "Test2", "func": function() {
            basicTextAct(this,"testy2")
        }.bind(this)}
    ]
    flavorTexts: [
        "Test1"
    ]
    description: "It's an enemy. Wow."
    face: new Sprite("enemy/froggit_face",2);
    body: new Sprite('enemy/froggit_body',2)
    x: 128;
    y: 64;
    frameNorm: 0;
    frameSpareDeath: 1;
}
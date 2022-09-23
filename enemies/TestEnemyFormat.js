{
    mercy: 0;
    maxHp: 50;
    name: "Enemy"
    acts: [
        {"name": "Test", "func": {"function":{"arguments":"","body":"basicTextAct(this,'hey guys')"}}},
        {"name": "Test2", "func": {"function":{"arguments":"","body":"basicTextAct(this,'hey 2')"}}}
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
    hurtAnimation: (undo) => {
        if (!undo) {
            this.frame = this.frameSpareDeath;
        } else {
            this.frame = this.frameNorm;
        }
    }
}
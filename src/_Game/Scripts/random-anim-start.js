var RandomAnimStart = pc.createScript('randomAnimStart');

// initialize code called once per entity
RandomAnimStart.prototype.initialize = function() {
    this._started = false;
};

// update code called every frame
RandomAnimStart.prototype.update = function(dt) {
    var baseLayer = this.entity.anim.baseLayer; 
    if (!this._started && baseLayer.activeState !== pc.ANIM_STATE_START) {
        var randomTime = pc.math.random(0, baseLayer.activeStateDuration);
        baseLayer.activeStateCurrentTime = randomTime;
         
        this._started = true;
    }
};

// swap method called for script hot-reloading
// inherit your script state here
// RandomAnimStart.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// http://developer.playcanvas.com/en/user-manual/scripting/
var Spinner = pc.createScript('spinner');
Spinner.attributes.add('speed', {type: 'vec3', description: 'Euler angle speed'});

// initialize code called once per entity
Spinner.prototype.initialize = function() {
    this.angle = 0;
    this._eulerAngles = new pc.Vec3();
};


// update code called every frame
Spinner.__changeThisFrame = new pc.Vec3();
Spinner.prototype.update = function(dt) {
    var changeThisFrame = Spinner.__changeThisFrame;
    changeThisFrame.copy(this.speed);
    changeThisFrame.scale(dt);
    
    this._eulerAngles.add(changeThisFrame);

    this._eulerAngles.x = utils.wrapAngle360(this._eulerAngles.x);
    this._eulerAngles.y = utils.wrapAngle360(this._eulerAngles.y);
    this._eulerAngles.z = utils.wrapAngle360(this._eulerAngles.z);

    this.entity.setLocalEulerAngles(this._eulerAngles);
};
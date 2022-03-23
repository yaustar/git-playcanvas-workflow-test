var PlayAnimTriggerButton = pc.createScript('playAnimTriggerButton');
PlayAnimTriggerButton.attributes.add('animEntities', { type: 'entity', array: true });
PlayAnimTriggerButton.attributes.add('requiredAnimStates', { type: 'string', description: 'Comma separated states that this can be triggered in'});
PlayAnimTriggerButton.attributes.add('animTrigger', { type: 'string'});


// initialize code called once per entity
PlayAnimTriggerButton.prototype.initialize = function() {
    this._requiredAnimStates = this.requiredAnimStates.split(',');
    this.entity.button.on('click', function (e) {
        for (var i = 0; i < this.animEntities.length; ++i) {
            var animEntity = this.animEntities[i];
            if (this._requiredAnimStates.includes(animEntity.anim.baseLayer.activeState)) {
                animEntity.anim.setTrigger(this.animTrigger);
            }
        }
    }, this);    
};


PlayAnimTriggerButton.prototype.update = function (dt) {
    // Cheat and use the first entity in the list to check state 
    if (this.animEntities.length > 0) {
        var animEntity = this.animEntities[0];
        if (this._requiredAnimStates.includes(animEntity.anim.baseLayer.activeState)) {
            this.entity.button.active = true;
        } else {
            this.entity.button.active = false;
        }
    }
};
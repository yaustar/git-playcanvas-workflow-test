var NpcUicontroller = pc.createScript('npcUicontroller');
NpcUicontroller.attributes.add('sceneRootEntity', {type: 'entity'});
NpcUicontroller.attributes.add('lod3NpcTemplate', {type: 'asset', assetType: 'template'});
NpcUicontroller.attributes.add('lod0NpcTemplate', {type: 'asset', assetType: 'template'});
NpcUicontroller.attributes.add('lod3AddButtonEntity', {type: 'entity'});
NpcUicontroller.attributes.add('lod0AddButtonEntity', {type: 'entity'});
NpcUicontroller.attributes.add('removeButtonEntity', {type: 'entity'});


// initialize code called once per entity
NpcUicontroller.prototype.initialize = function() {
    this._npcEntities = [];
    
    var addNpc = function(template) {
        var npcEntity = template.resource.instantiate();
        this.sceneRootEntity.addChild(npcEntity);
        npcEntity.setPosition(pc.math.random(-2, 2), -0.885, pc.math.random(0, -4));
        npcEntity.script.create('randomAnimStart');

        this._npcEntities.push(npcEntity);
    }.bind(this);
    
    this.lod0AddButtonEntity.element.on('click', function (e) {
        addNpc(this.lod0NpcTemplate);
    }, this);
    
    this.lod3AddButtonEntity.element.on('click', function (e) {
        addNpc(this.lod3NpcTemplate);
    }, this);
    
    this.removeButtonEntity.element.on('click', function (e) {
        if (this._npcEntities.length > 0) {
            var npcEntity = this._npcEntities.pop();
            npcEntity.destroy();
        }    
    }, this);
};


// swap method called for script hot-reloading
// inherit your script state here
// NpcUicontroller.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// http://developer.playcanvas.com/en/user-manual/scripting/
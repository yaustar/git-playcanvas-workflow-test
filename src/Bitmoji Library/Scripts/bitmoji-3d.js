/**
 * @event
 * @name pc.Entity#bitmoji:bodyloading
 * @description Fired when loading a Bitmoji to be used by this pc.Entity (e.g from Snap Kit API).
 */

/**
 * @event
 * @name pc.Entity#bitmoji:bodyloaded
 * @param {pc.Asset} containerAsset The asset of type container which has the Bitmoji, materials, etc inside.
 * @description Fired when a Bitmoji has finished loading.
 */

/**
 * @event
 * @name pc.Entity#bitmoji:facesloaded
 * @param {pc.Asset[]} textureAssets An array of texture assets that have all the faces.
 * @description Fired when all the texture assets for the faces have been loaded.
 */

var Bitmoji3d = pc.createScript('bitmoji3d');
Bitmoji3d.attributes.add('showDefaultBitmoji', {type: 'boolean', default: true});
Bitmoji3d.attributes.add('loadingIconEntity', {type: 'entity'});
Bitmoji3d.attributes.add('defaultBitmoji3dModelAsset', {type: 'asset'});
Bitmoji3d.attributes.add('defaultBitmoji3dMaterialAsset', {type: 'asset'});
Bitmoji3d.attributes.add('unlit', {type: 'boolean', default: false});
Bitmoji3d.attributes.add('emissiveColor', {type: 'rgb', default: [0, 0, 0], description: 'Only applied when unlit'});
Bitmoji3d.attributes.add('emissiveIntensity', {type: 'number', default: 1, min: 0, max: 10, description: 'Only applied when unlit'});
Bitmoji3d.attributes.add('applyTonemapping', {type: 'boolean', default: true});
Bitmoji3d.attributes.add('layerName', { type: 'string'});
Bitmoji3d.attributes.add('stateAnimMappings', {
    type: 'json',
    schema: [{
        name: 'stateName',
        type: 'string',
        default: ''
    }, {
        name: 'animAsset',
        type: 'asset'
    }],
    array: true
});


// Face animation ids
Bitmoji3d.faces = {
    win: "win",
    cheerful: "cheerful",
    determined: "determined",
    shocked: "shocked",
    scared: "scared",
    thinking: "thinking",
    compression: "compression",
    blink: "idle-blink",
    cheeky: 'cheeky',
    angry: 'angry',
    lose: 'lose',
    idle: 'idle'
};


// initialize code called once per entity
Bitmoji3d.prototype.initialize = function() {
    console.log('hello')
    var self = this;

    this._log = new Log('[Bitmoji3d]');

    // Only enable the model component when animations are ready
    this.entity.model.enabled = false;

    this._faceTextureAssets = {};

    this._faceMaterial = null;
    this._currentFace = Bitmoji3d.faces.idle;

    this._lastFrameAnimState = '';
    this._currentAnimTrack = null;

    this._faceTexturesLoaded = false;
    this._animationsLoaded = false;

    // Listen for the event if a bitmoji is being loaded and finished
    this.entity.on('bitmoji:bodyloading', function () {
        this.loadingIconEntity.enabled = true;
    }, this);

    this.entity.on('bitmoji:bodyloaded', function (containerAsset) {
        // Find the material for the face
        this._faceMaterial = null;
        if (containerAsset) {
            var resource = containerAsset.resource;
            var i;
            for (i = 0; i < resource.materials.length; ++i) {
                /** @type {pc.StandardMaterial} */
                var material = resource.materials[i].resource;
                if (material.name == 'face_group_MAT') {
                    this._faceMaterial = material;
                }

                if (this.unlit) {
                    var texture = material.diffuseMap;
                    if (texture) {
                        material.diffuse = pc.Color.BLACK;
                        material.ambient = pc.Color.BLACK;
                        material.emissiveMap = texture;
                        material.emissive = this.emissiveColor;
                        material.emissiveIntensity = this.emissiveIntensity;
                        material.useLighting = false;
                        material.useSkybox = false;
                        material.update();
                    }
                }

                material.useGammaTonemap = this.applyTonemapping;
            }

            this.entity.model.asset = resource.model;
            this._addAnimations();
        }
        this.loadingIconEntity.enabled = false;
    }, this);

    this.entity.on('bitmoji:facesloaded', function (textureAssets) {
        this._faceTextureAssets = {};
        var textureAsset;
        // Map the texture assets to texture name
        for (var i = 0; i < textureAssets.length; ++i) {
            textureAsset = textureAssets[i];
            this._faceTextureAssets[textureAsset.name] = textureAsset;
        }

        this._faceTexturesLoaded = true;

        this._changeFace(this._currentFace);
    }, this);

    // Load the default Bitmoji
    if (this.showDefaultBitmoji) {
        this.app.glbConvertedAssets.load(this.defaultBitmoji3dModelAsset, function (err, asset) {
            if (err) {
                self._log.error('Cannot load default Bitmoji asset: ' + err);
            } else {
                self._onDefaultBitmojiLoaded(asset);
            }
        });
    }

    // Load the animations
    var numAnimationsLoaded = 0;

    for (var i = 0; i < this.stateAnimMappings.length; ++i) {
        var mapping = this.stateAnimMappings[i];
        if (mapping.animAsset) {
            this.app.glbConvertedAssets.loadBitmoji(mapping.animAsset, function (err, asset) {
                if (err) {
                    self._log.error('Cannot load animation asset: ' + err);
                }

                numAnimationsLoaded += 1;
                if (numAnimationsLoaded == self.stateAnimMappings.length) {
                    self._animationsLoaded = true;
                    self._addAnimations();

                    // Re-add the animations whenever the state graph is loaded by the Editor
                    self.entity.anim.on('stategraphloaded', function() {
                        self._addAnimations();
                    }, self);
                }
            });
        }
    }

    this.loadingIconEntity.enabled = false;
};


Bitmoji3d.prototype.update = function(dt) {
    if (this._faceTexturesLoaded) {
        this._updateFaces(dt);
    }
};


Bitmoji3d.prototype._addAnimations = function () {
    // We have to add the animations after the assets are ready
    if (this._animationsLoaded) {
        // Add all animations to the states in the graph
        var locomotionLayer = this.entity.anim.findAnimationLayer(this.layerName);
        for (var i = 0; i < this.stateAnimMappings.length; ++i) {
            var mapping = this.stateAnimMappings[i];
            if (mapping.animAsset) {
                var containerAsset = this.app.glbConvertedAssets.get(mapping.animAsset.id);
                if (containerAsset == null) {
                    this._log.error('Animation ' + mapping.animAsset.name + ' not ready');
                } else {
                    // Assume that there is only one animation per GLB container asset
                    locomotionLayer.assignAnimation(mapping.stateName, containerAsset.resource.animations[0].resource);
                }
            }
        }

        this.entity.model.enabled = true;
    }
};


Bitmoji3d.prototype._onDefaultBitmojiLoaded = function (bitmojiAsset) {
    var i;

    // Check that a user/NPC Bitmoji model hasn't been loaded yet
    if (this.entity.model.asset == null) {
        if (bitmojiAsset == null) {
            this._log.error('Default Bitmoji3d model not ready');
        } else {
            this.entity.model.asset = bitmojiAsset.resource.model;
            if (this.defaultBitmoji3dMaterialAsset !== null) {
                var mi = this.entity.model.meshInstances;
                for (i = 0; i < mi.length; ++i) {
                    mi[i].material = this.defaultBitmoji3dMaterialAsset.resource;
                }
            }
        }
    }

    this._addAnimations();
};


Bitmoji3d.prototype._changeFace = function (faceName) {
    if (this._faceMaterial) {
        var faceTextureAsset = this._faceTextureAssets[faceName];
        if (faceTextureAsset) {
            this._faceMaterial.diffuseMap = faceTextureAsset.resource;
            this._faceMaterial.update();
        } else {
            this._log.error('Missing face texture: ' + faceName);
        }
    }

    this._currentFace = faceName;
};


Bitmoji3d.prototype._updateFaces = function (dt) {
    // Get the current animation asset being used
    var facialSwaps, i;

    var currentState = this.entity.anim.baseLayer.activeState;
    if (this._lastFrameState != currentState) {
        for (i = 0; i < this.stateAnimMappings.length; ++i) {
            var mapping = this.stateAnimMappings[i];
            if (mapping.stateName == currentState) {
                var containerAsset = this.app.glbConvertedAssets.get(mapping.animAsset.id);
                this._currentAnimTrack = containerAsset.resource.animations[0].resource;
                break;
            }
        }
    }

    var animTrack = this._currentAnimTrack;
    if (animTrack) {
        facialSwaps = animTrack.facialSwaps;
    }

    // Got through all the key times to work out which face expression to use
    // and swap to
    if (facialSwaps) {
        var currentTime = this.entity.anim.baseLayer.activeStateCurrentTime;
        currentTime = currentTime % this.entity.anim.baseLayer.activeStateDuration;
        var times = facialSwaps.times;
        var faceIndex = 0;
        for (i = 0; i < times.length; ++i) {
            if (currentTime >= times[i]) {
                faceIndex = i;
            }
        }

        var faceName = facialSwaps.expressions[faceIndex];
        if (this._currentFace != faceName) {
            this._changeFace(faceName);
        }
    }

    this._lastFrameState = currentState;
};

// swap method called for script hot-reloading
// inherit your script state here
// Bitmoji3d.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// http://developer.playcanvas.com/en/user-manual/scripting/
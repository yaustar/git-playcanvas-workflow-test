var ProxyBitmoji3dLoader = pc.createScript('proxyBitmoji3dLoader');
ProxyBitmoji3dLoader.BITMOJI_AVATAR_IDS = [
    { 'Random NPC': 'random'},
    { 'NPC 1' : '1ead45b2-7e38-48a8-b121-6c998bf1becf' },
    { 'NPC 2': '4ab75fc9-fdae-4431-8976-c6571c06fbaf' },
    { 'NPC 3': '35e5af98-7e43-4057-a01c-2a80ac85e614' },
    { 'NPC 4': '8673bd37-3d91-4f46-a560-6a0931c74f7a' },
    { 'NPC 5': '6e21e203-f10d-4d69-ba04-1129671a298a' },
    { 'NPC 6': '05a2f2cc-7768-439c-914f-13e0c0527669' },
    { 'NPC 7': 'c3e2ca7e-6023-42eb-9928-1de03e4874ac' },
    { 'NPC 8': 'd8145ed9-70aa-4466-814a-04598494ded2' },
    { 'NPC 9': '0f2e4758-5d90-4623-9f3c-ee6c3d93aa5c' },
    { 'NPC 10': '920770b0-880f-4845-8db5-7160f3c84e9a' },
    { 'NPC 11': 'e6661449-09a7-4009-81e7-4462f5388228' },
    { 'NPC 12': '36f8f3e6-6744-463e-985b-c9e1ccbd1fb1' },
    { 'NPC 13': 'ef40e498-5324-4eb2-af39-c09587451a85' },
    { 'NPC 14': '5c88c5d1-2359-4ea7-83af-fc2743c3fa24' },
    { 'NPC 15': '6aa12757-bab8-456f-a125-b6b98742d4a3' },
    { 'NPC 16': '4835715c-dbf1-4570-9890-ee6ccc097727' },
    { 'NPC 17': 'ecce82bd-cd96-498b-a1b5-c0df8a7a527f' },
    { 'NPC 18': '7fe0988a-6a73-4416-8e2e-fdbddbae5242' },
    { 'NPC 19': '251286c3-4bab-47b7-9641-0ae36c740e70' },
    { 'NPC 20': 'dca38ce6-6b9c-4859-ac51-c8d8e7f486ee' },
    { 'NPC 21': 'c44a71d1-7585-4d32-90c6-00076e092afe' },
    { 'NPC 22': 'a2fd5b4f-9e60-41db-acf9-8e36c45a23ec' },
    { 'NPC 23': '9af0dad8-2c45-4972-a1ad-55a7cadbee3b' },
    { 'NPC 24': '983c116b-2d63-42d5-b472-3ec7bacdef70' },
    { 'NPC 25': '91248c5f-7a25-47e3-b969-36bc8768e8ca' }
];

ProxyBitmoji3dLoader.attributes.add('bitmojiType', {
    type: 'string',
    default: 'random',
    enum: ProxyBitmoji3dLoader.BITMOJI_AVATAR_IDS
});

ProxyBitmoji3dLoader.attributes.add('lod', {
    type: 'string',
    default: 'lod=3',
    enum: [
        { 'LOD 0': 'lod=0' },
        { 'LOD 3': 'lod=3' }
    ]
});

// initialize code called once per entity
ProxyBitmoji3dLoader.prototype.postInitialize = function() {
    var self = this;
    this._log = new Log('ProxyBitmoji3dLoader');
    this._bitmojiAsset = null;
    this._faceTextureAssets = null;
    this._destroyed = false;

    self.entity.fire('bitmoji:bodyloading');

    var avatarId = this.bitmojiType;
    if (this.bitmojiType == 'user' || this.bitmojiType == 'random') {
        var bitmojiIds = ProxyBitmoji3dLoader.BITMOJI_AVATAR_IDS;
        var bitmojiNpc = bitmojiIds[Math.floor(pc.math.random(1, bitmojiIds.length))];
        avatarId = bitmojiNpc[Object.keys(bitmojiNpc)[0]];
    }

    this._getBitmojiData(avatarId, function (err, url) {
        if (err !== null) {
            self._log.warn(err);
            self.entity.fire('bitmoji:bodyloaded');
        } else {
            loadBitmoji3d(url,
                function (err, asset) {
                    if (err) {
                        self._log.error('Error loading model');
                        self._log.error(err);
                    } else {
                        self._bitmojiAsset = asset;
                    }
                
                    // If the bitmoji asset gets loaded after the entity
                    // is destroyed, make sure we free up the assets
                    if (self._destroyed) {
                        self._unloadBitmojiAsset();
                    } else {
                        self.entity.fire('bitmoji:bodyloaded', asset);
                    }
                },
                function (err, faceTextures) {
                    if (err) {
                        self._log.error('Error loading face textures');
                        self._log.error(err);
                    }
                    self._faceTextureAssets = faceTextures;

                    // If the faces gets loaded after the entity
                    // is destroyed, make sure we free up the assets
                    if (self._destroyed) {
                        self._unloadFaceTextures();
                    } else {
                        self.entity.fire('bitmoji:facesloaded', faceTextures);
                    }
                }
            );
        }
    });

    this.entity.on('destroy', function() {
        this._unloadBitmojiAsset();
        this._unloadFaceTextures();

        this._destroyed = true;
    }, this);
};


ProxyBitmoji3dLoader.prototype._unloadBitmojiAsset = function () {
    // Free the assets when the entity is destroyed
    if (this._bitmojiAsset) {
        this._bitmojiAsset.unload();
        this.app.assets.remove(this._bitmojiAsset);
    }

    this._bitmojiAsset = null;
};


ProxyBitmoji3dLoader.prototype._unloadFaceTextures = function () {
    if (this._faceTextureAssets) {
        for (var i = 0; i < this._faceTextureAssets.length; ++i) {
            this._faceTextureAssets[i].unload();
            this.app.assets.remove(this._faceTextureAssets[i]);
        }
    }

    this._faceTextureAssets = null;
};


ProxyBitmoji3dLoader.prototype._getBitmojiData = function(avatarId, callback) {
    if (avatarId) {
        var Http = new XMLHttpRequest();
        var url = 'https://bitmoji.api.snapchat.com/bitmoji-for-games/test_avatar?avatar_id=' + avatarId + '&' + this.lod + '&pbr=true';
        Http.open('GET', url, true);
        Http.responseType = 'arraybuffer';

        Http.onload = function(e) {
            if (this.status == 200) {
                callback(null, this.response);
            } else {
                callback(this.status + this.statusText);
            }
        };

        Http.onerror = function(e) {
            callback(this.statusText);
        };

        Http.send();
    } else {
        // Use a NPC bitmoji instead or keep the blank one?
        callback('Account has no Bitmoji, doing nothing');
    }
};
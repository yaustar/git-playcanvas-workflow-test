(function() {
    // Create a map of GLB container assets have been loaded from
    // binary GLB assets in the project
    var app = pc.Application.getApplication();

    var glbConvertedAssets = {};
    var assets = {};
    var callbacks = {};

    glbConvertedAssets._assets = assets;


    // Get asset by source asset id
    glbConvertedAssets.get = function (sourceId) {
        return assets[sourceId];
    };


    glbConvertedAssets.add = function (sourceId, asset) {
        if (!assets[sourceId]) {
            assets[sourceId] = asset;
        }
    };


    glbConvertedAssets._load = function (sourceAsset, bitmojiType, callback) {
        // If we already have converted this asset, then return that asset
        var sourceId = sourceAsset.id;
        var convertedAsset = assets[sourceId];
        if (convertedAsset) {
            if (convertedAsset.loaded) {
                callback(null, convertedAsset); 
            } else {
                convertedAsset.ready(function (asset) {
                    callback(null, convertedAsset); 
                });   
            }
        } else {
            var loadGlbFromSourceAsset = function (sourceAsset, bitmojiType, callback) {
                var asset;
                if (bitmojiType) {
                    asset = loadBitmojiAnimation3d(sourceAsset.resource, sourceAsset.name, function (err, asset) {
                        callback(err, asset);
                    });

                } else {
                    asset = utils.loadGlbContainerFromAsset(sourceAsset, null, sourceAsset.name, function (err, asset) {
                        callback(err, asset);
                    });
                }

                this.add(sourceAsset.id, asset);
            }.bind(this);
            
            var onGlbConverted = function (err, asset) {
                var cbs = callbacks[sourceId];
                if (cbs) {
                    for (var i = 0; i < cbs.length; ++i) {
                        cbs[i](err, asset);
                    }

                    callbacks[sourceId] = null;
                }
            };

            // If the source asset is loaded (e.g been preloaded)
            if (sourceAsset.loaded) {
                loadGlbFromSourceAsset(sourceAsset, bitmojiType, callback);
            } else {
                if (!sourceAsset.loading) {
                    // Start the initial load process. This should only be executed once per source asset
                    sourceAsset.ready(function () {
                        loadGlbFromSourceAsset(sourceAsset, bitmojiType, onGlbConverted);
                    });
                    
                    app.assets.load(sourceAsset);
                    callbacks[sourceId] = [];
                }     
                
                callbacks[sourceId].push(callback);
            }
        }
    };

    /**
     * @name glbConvertedAssets#load
     * @function
     * @description Load a GLB container from a binary asset that is a GLB.
     * @param {pc.Asset} sourceAsset The binary asset that is the GLB.
     * @param {Function} callback The callback function for loading the asset. Signature is `function(string:error, asset:containerAsset)`.
     * If `error` is null, then the load is successful.
     */
    glbConvertedAssets.load = function (sourceAsset, callback) {
        this._load(sourceAsset, false, callback);
    };


    /**
     * @name glbConvertedAssets#loadBitmoji
     * @function
     * @description Load a Bitmoji GLB container from a binary asset that is a GLB.
     * @param {pc.Asset} sourceAsset The binary asset that is the GLB.
     * @param {Function} callback The callback function for loading the asset. Signature is `function(string:error, asset:containerAsset)`.
     * If `error` is null, then the load is successful.
     */
    glbConvertedAssets.loadBitmoji = function (sourceAsset, callback) {
        this._load(sourceAsset, true, callback);
    };


    app.glbConvertedAssets = glbConvertedAssets;
})();
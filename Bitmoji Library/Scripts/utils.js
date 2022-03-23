(function(){
    var utils = {};
    var app = pc.Application.getApplication();

    /**
     * @name utils#loadGlbContainerFromAsset
     * @function
     * @description Load a GLB container from a binary asset that is a GLB.
     * @param {pc.Asset} glbBinAsset The binary asset that is the GLB.
     * @param {Object} options Optional. Extra options to do extra processing on the GLB.
     * @param {String} assetName. Name of the asset.
     * @param {Function} callback The callback function for loading the asset. Signature is `function(string:error, asset:containerAsset)`.
     * If `error` is null, then the load is successful.
     * @returns {pc.Asset} The asset that is created for the container resource.
     */
    utils.loadGlbContainerFromAsset = function (glbBinAsset, options, assetName, callback) {
        var blob = new Blob([glbBinAsset.resource]);
        var data = URL.createObjectURL(blob);
        return this.loadGlbContainerFromUrl(data, options, assetName, function(error, asset) {
            callback(error, asset);
            URL.revokeObjectURL(data);
        });
    };

    /**
     * @name utils#loadGlbContainerFromUrl
     * @function
     * @description Load a GLB container from a URL that returns a `model/gltf-binary` as a GLB.
     * @param {String} url The URL for the GLB
     * @param {Object} options Optional. Extra options to do extra processing on the GLB.
     * @param {String} assetName. Name of the asset.
     * @param {Function} callback The callback function for loading the asset. Signature is `function(string:error, asset:containerAsset)`.
     * If `error` is null, then the load is successful.
     * @returns {pc.Asset} The asset that is created for the container resource.
     */
    utils.loadGlbContainerFromUrl = function (url, options, assetName, callback) {
        var filename = assetName + '.glb';
        var file = {
            url: url,
            filename: filename
        };

        var asset = new pc.Asset(filename, 'container', file, null, options);
        asset.once('load', function (containerAsset) {
            if (callback) {
                // As we play animations by name, if we have only one animation, keep it the same name as
                // the original container otherwise, postfix it with a number
                var animations = containerAsset.resource.animations;
                if (animations.length == 1) {
                    animations[0].name = assetName;
                } else if (animations.length > 1) {
                    for (var i = 0; i < animations.length; ++i) {
                        animations[i].name = assetName + ' ' + i.toString();
                    }
                }

                callback(null, containerAsset);
            }
        });

        app.assets.add(asset);
        app.assets.load(asset);

        return asset;
    };


    utils.wrapAngle360 = function (value) {
        return value % 360;
    };


    utils.cloneTexture = function (texture) {
        var shallowCopyLevels = function (texture) {
            var result = [];
            for (var mip = 0; mip < texture._levels.length; ++mip) {
                var level = [];
                if (texture.cubemap) {
                    for (var face = 0; face < 6; ++face) {
                        level.push(texture._levels[mip][face]);
                    }
                } else {
                    level = texture._levels[mip];
                }
                result.push(level);
            }
            return result;
        };

        var result = new pc.Texture(texture.device, texture);  
        result._levels = shallowCopyLevels(texture); 
        return result;
    };

    
    utils.cloneTextureAsset = function (src) {
        var result = new pc.Asset(src.name,
                                  src.type,
                                  src.file,
                                  src.data,
                                  src.options);
        result.loaded = true;
        result.resource = utils.cloneTexture(src.resource);
        src.registry.add(result);
        return result;
    };


    window.utils = utils;
})();
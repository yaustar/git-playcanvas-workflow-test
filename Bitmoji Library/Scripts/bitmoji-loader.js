(function () {
    var app = pc.Application.getApplication();

    // TODO Create a cache of avatarIds to assets to save on reloading the bitmojis on
    // round restarts etc.

    /**
     * @name loadBitmoji3d
     * @function
     * @description Load a GLB asset that is specifically a Bitmoji model.
     * @param {String|Binary} base64Data Base64 string or the binary data of the Bitmoji model as a GLB.
     * @param {Function} bodyLoadedCallback Callback for when the container asset of the body model is loaded.
     * Signature `function(string:error, asset:containerAsset)`. `error` is null if the asset is loaded correctly.
     * @param {Function} facesLoadedCallback Callback for when the texture assets for the faces are loaded.
     * Signature `function(string:error, asset[]:faceTextureAssets)`. `error` is null if the asset is loaded correctly.
     * @returns {pc.Asset} The asset that is created for the container resource.
     */
    function loadBitmoji3d(base64Data, bodyLoadedCallback, facesLoadedCallback) {
        var options = {
            global: {
                postprocess: function (gltf) {
                    var extras = gltf.extras;
                    if (!extras) {
                        return;
                    }

                    // Create texture assets for the faces
                    var i, textureData;
                    var textureDatas = extras.facialExpressionTextures;
                    var numFaceTexturesLoaded = 0;
                    var faceTextures = [];
                    var errorMessage = '';
                    
                    var onFaceTextureLoaded = function(asset) {
                        if (asset) {
                            faceTextures.push(asset);
                        }

                        numFaceTexturesLoaded += 1;
                        if (numFaceTexturesLoaded == textureDatas.length) {
                            facesLoadedCallback(errorMessage, faceTextures);
                        }
                    };
                    
                    var cloneAsset = function (asset) {
                        var clonedAsset = utils.cloneTextureAsset(asset);
                        onFaceTextureLoaded(clonedAsset);
                    };

                    if (textureDatas) {
                        for (i = 0; i < textureDatas.length; ++i) {
                            textureData = textureDatas[i];

                            // Check if the asset already exists and if it does, clone if
                            var asset = app.assets.getByUrl(textureData.uri);
                            if (asset) {
                                // Make sure that the asset is ready before we clone
                                asset.ready(cloneAsset);
                            } else {
                                app.assets.loadFromUrlAndFilename(textureData.uri, textureData.name, 'texture', function (err, asset) {
                                    if (err) {
                                        errorMessage += err + '\n';
                                    }

                                    onFaceTextureLoaded(asset);
                                });
                            }
                        }
                    }
                }
            }
        };

        var data = base64Data;
        var createdObjectUrl = false;
        // If it's not a string, it's most likely be binary data
        if (typeof data != 'string') {
            var blob = new Blob([base64Data]);
            data = URL.createObjectURL(blob);
            createdObjectUrl = true; 
        }
        
        var asset = utils.loadGlbContainerFromUrl(data, options, 'bitmoji-container', function (err, asset) {
            if (err) {
                callback(err);
            } else {
                if (err) {
                    bodyLoadedCallback(err);
                } else {
                    bodyLoadedCallback(null, asset);
                }
            }
        });
        
        if (createdObjectUrl) {
            URL.revokeObjectURL(data);
        }
        
        return asset;
    }

    /**
     * @name loadBitmojiAnimation3d
     * @function
     * @description Load a GLB asset that is specifically a Bitmoji model.
     * @param {String|Binary} base64Data Base64 string or the binary data of the Bitmoji model as a GLB.
     * @param {String} assetName Name of the asset which is important to be unique as it will be used to play animations on the animation component.
     * @param {Function} callback Callback for when the animation asset is loaded.
     * Signature `function(string:error, asset:asset)`. `error` is null if the asset is loaded correctly.
     * @returns {pc.Asset} The asset that is created for the container resource.
     */
    function loadBitmojiAnimation3d(base64Data, assetName, callback) {
        var asset;

        var options = {
            global: {
                postprocess: function (gltf, result) {
                    // We always assume that we are loading one animation per glb file
                    // and that there is at least one animation
                    var extras = gltf.animations[0].extras;
                    if (!extras || !extras.facial_swaps) {
                        return;
                    }

                    // Store the face texture swaps data on the animation track
                    result.animations[0].facialSwaps = extras.facial_swaps;
                }
            }
        };

        var data = base64Data;
        var createdObjectUrl = false;

        // If it's not a string, it's most likely be binary data
        if (typeof data != 'string') {
            var blob = new Blob([base64Data]);
            data = URL.createObjectURL(blob);
            createdObjectUrl = true;
        }

        asset = utils.loadGlbContainerFromUrl(data, options, assetName, function (err, asset) {
            callback(err, asset);
        });
        
        if (createdObjectUrl) {
            URL.revokeObjectURL(data);
        }
        
        return asset;
    }


    window.loadBitmoji3d = loadBitmoji3d;
    window.loadBitmojiAnimation3d = loadBitmojiAnimation3d;
})();

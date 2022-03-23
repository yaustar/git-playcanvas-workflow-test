/**
 * @event
 * @name pc.Application#defaultglbs:loaded
 * @description Fired when the GLBs in DefaultGlbAssetLoader#assets have finished loaded and process to containerAssets.
 */

var DefaultGlbAssetLoader = pc.createScript('defaultGlbAssetLoader');
DefaultGlbAssetLoader.attributes.add('assets', {type: 'asset', array: true});
DefaultGlbAssetLoader.attributes.add('bitmojiAnimationAssets', {type: 'asset', array: true});

DefaultGlbAssetLoader.initialized = false;
DefaultGlbAssetLoader.ready = false;


// initialize code called once per entity
DefaultGlbAssetLoader.prototype.initialize = function() {
    // Only do this once
    if (DefaultGlbAssetLoader.initialized) {
        console.log('Default GLB assets already loaded');
        return;
    }

    this._assetsLoaded = 0;
    this._glbConvertedAssets = this.app.glbConvertedAssets;

    var self = this;

    var fireEventIfFinished = function() {
        if ((self.assets.length + self.bitmojiAnimationAssets.length) == self._assetsLoaded) {
            DefaultGlbAssetLoader.ready = true;
            self.app.fire('defaultglbs:loaded');
        }
    };

    var loadGlbAsset = function (asset) {
        self._glbConvertedAssets.load(asset, function (err, asset) {
            if (err) {
                console.error(err);
            }

            self._assetsLoaded += 1;
            fireEventIfFinished();
        });
    };

    var loadBitmojiGlbAsset = function (asset) {
        self._glbConvertedAssets.loadBitmoji(asset, function (err, asset) {
            if (err) {
                console.error(err);
            }

            self._assetsLoaded += 1;
            fireEventIfFinished();
        });
    };

    var assetListLooper = function (assets, processFunc) {
        var i, asset;

        for (i = 0; i < assets.length; ++i) {
            asset = assets[i];
            processFunc(asset);
        }
    };

    assetListLooper(this.assets, loadGlbAsset);
    assetListLooper(this.bitmojiAnimationAssets, loadBitmojiGlbAsset);

    DefaultGlbAssetLoader.initialized = true;
    fireEventIfFinished();
};
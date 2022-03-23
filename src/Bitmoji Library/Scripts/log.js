var Log = function (prefix, enabled) {
    this.prefix = prefix + ": ";
    this.enabled = enabled !== undefined ? enabled : true;
};


Log.prototype.info = function (msg) {
    if (this.enabled) {
        console.log(this.prefix + msg);
    }
};


Log.prototype.error = function (msg) {
    if (this.enabled) {
        console.error(this.prefix + msg);
    }
};


Log.prototype.warn = function (msg) {
    if (this.enabled) {
        console.warn(this.prefix + msg);
    }
};
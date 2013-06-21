
/*
 * Extends L.Map to synchronize two maps
 */

L.Map.Sync = L.Map.extend({

    sync: function (map) {
        this._syncMap = map;

        this.dragging._draggable._updatePosition = function () {
            L.Draggable.prototype._updatePosition.call(this);
            L.DomUtil.setPosition(map.dragging._draggable._element, this._newPos);
            map.invalidateSize();
        };

        return this;
    },

    setView: function (center, zoom, forceReset, sync) {
        if (this._syncMap && !sync) {
            this._syncMap.setView(center, zoom, forceReset, true);
        }
        return L.Map.prototype.setView.call(this, center, zoom, forceReset);
    },

    panBy: function (offset, duration, easeLinearity, sync) {
        if (this._syncMap && !sync) {
            this._syncMap.panBy(offset, duration, easeLinearity, true);
        }        
        return L.Map.prototype.panBy.call(this, offset, duration, easeLinearity);
    },

    _onResize: function (evt, sync) {
        if (this._syncMap && !sync) {
            this._syncMap._onResize(evt, true);
        }        
        return L.Map.prototype._onResize.call(this, evt);
    }

});

L.map.sync = function (id, options) {
    return new L.Map.Sync(id, options);
}; 


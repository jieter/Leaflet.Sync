
/*
 * Extends L.Map to synchronize two maps
 */

L.Map = L.Map.extend({
    sync: function (map) {

        // injector function
        var inject = function (map) {
            if ('_hasSync' in map) {
                return map;
            }

            var syncMixin = {
                _hasSync: true,
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
            };

            return L.extend(map, syncMixin);
        };

        this._syncMap = inject(map);

        this.dragging._draggable._updatePosition = function () {
            L.Draggable.prototype._updatePosition.call(this);
            L.DomUtil.setPosition(map.dragging._draggable._element, this._newPos);
            map.invalidateSize();
        };

        return this;
    }
});


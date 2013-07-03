/*
 * Extends L.Map to synchronize two maps
 */

L.Map = L.Map.extend({
    sync: function (map) {

        this._syncMap = L.extend(map, {
            setView: function (center, zoom, options, sync) {
                if (!sync) {
                    this._syncMap.setView(center, zoom, options, true);
                }
                return L.Map.prototype.setView.call(this, center, zoom, options);
            },

            panBy: function (offset, options, sync) {
                if (!sync) {
                    this._syncMap.panBy(offset, options, true);
                }
                return L.Map.prototype.panBy.call(this, offset, options);
            },

            _onResize: function (evt, sync) {
                if (!sync) {
                    this._syncMap._onResize(evt, true);
                }
                return L.Map.prototype._onResize.call(this, evt);
            }
        });

        this.on('zoomend', function() {
            this._syncMap.setView(this.getCenter(), this.getZoom(), {reset: false}, true);
        }, this);

        this.dragging._draggable._updatePosition = function () {
            L.Draggable.prototype._updatePosition.call(this);
            L.DomUtil.setPosition(map.dragging._draggable._element, this._newPos);
            map.fire('move');
        };

        return this;
    }
});


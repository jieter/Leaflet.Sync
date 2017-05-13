/*
 * Extends L.Map to synchronize the interaction on one map to one or more other maps.
 */

(function () {
    var NO_ANIMATION = {
        animate: false,
        reset: true
    };

    // Helper function to compute the offset easily
    // The arguments are relative positions with respect to reference and
    // target maps of the point to sync.
    // If you provide ratioRef=[0,1], ratioTgt=[1,0] will sync
    // the bottom left corner of the reference map
    // with the top right corner of the target map.
    // The values can be less than 0 or greater than 1. It will sync
    // points out of the map.
    L.Util.offsetHelper = function (ratioRef, ratioTgt) {
        var or = L.Util.isArray(ratioRef) ? ratioRef : [0.5, 0.5]
        var ot = L.Util.isArray(ratioTgt) ? ratioTgt : [0.5, 0.5]
        return function (center, zoom, refMap, tgtMap) {
            var rs = refMap.getSize();
            var ts = tgtMap.getSize();
            var pt = refMap.project(center, zoom)
                           .subtract([(0.5 - or[0]) * rs.x, (0.5 - or[1]) * rs.y])
                           .add([(0.5 - ot[0]) * ts.x, (0.5 - ot[1]) * ts.y]);
            return refMap.unproject(pt, zoom);
        };
    };


    L.Map = L.Map.extend({
        sync: function (map, options) {
            this._initSync();
            options = L.extend({
                noInitialSync: false,
                syncCursor: false,
                syncCursorMarkerOptions: {
                    radius: 10,
                    fillOpacity: 0.3,
                    color: '#da291c',
                    fillColor: '#fff'
                },
                offsetFn: function (center, zoom, refMap, tgtMap) {
                    // no transformation at all
                    return center;
                }
            }, options);

            // prevent double-syncing the map:
            if (this._syncMaps.indexOf(map) === -1) {
                this._syncMaps.push(map);
                this._syncOffsetFns[L.Util.stamp(map)] = options.offsetFn;
            }

            if (!options.noInitialSync) {
                map.setView(
                    options.offsetFn(this.getCenter(), this.getZoom(), this, map),
                    this.getZoom(), NO_ANIMATION);
            }
            if (options.syncCursor) {
                map.cursor = L.circleMarker([0, 0], options.syncCursorMarkerOptions).addTo(map);

                this._cursors.push(map.cursor);

                this.on('mousemove', this._cursorSyncMove, this);
                this.on('mouseout', this._cursorSyncOut, this);
            }
            return this;
        },

        _cursorSyncMove: function (e) {
            this._cursors.forEach(function (cursor) {
                cursor.setLatLng(e.latlng);
            });
        },

        _cursorSyncOut: function (e) {
            this._cursors.forEach(function (cursor) {
                // TODO: hide cursor in stead of moving to 0, 0
                cursor.setLatLng([0, 0]);
            });
        },


        // unsync maps from each other
        unsync: function (map) {
            var self = this;

            if (this._syncMaps) {
                this._syncMaps.forEach(function (synced, id) {
                    if (map === synced) {
                        delete self._syncOffsetFns[L.Util.stamp(map)];
                        self._syncMaps.splice(id, 1);
                        if (map.cursor) {
                            map.cursor.removeFrom(map);
                        }
                    }
                });
            }
            this.off('mousemove', this._cursorSyncMove, this);
            this.off('mouseout', this._cursorSyncOut, this);

            return this;
        },

        // Checks if the maps is synced with anything
        isSynced: function () {
            return (this.hasOwnProperty('_syncMaps') && Object.keys(this._syncMaps).length > 0);
        },

        // overload methods on originalMap to replay interactions on _syncMaps;
        _initSync: function () {
            if (this._syncMaps) {
                return;
            }
            var originalMap = this;

            this._syncMaps = [];
            this._cursors = [];
            this._syncOffsetFns = {};

            L.extend(originalMap, {
                setView: function (center, zoom, options, sync) {
                    if (!sync) {
                        originalMap._syncMaps.forEach(function (toSync) {
                            toSync.setView(
                                originalMap._syncOffsetFns[L.Util.stamp(toSync)](center, zoom, originalMap, toSync),
                                zoom, options, true);
                        });
                    }
                    return L.Map.prototype.setView.call(this, center, zoom, options);
                },

                panBy: function (offset, options, sync) {
                    if (!sync) {
                        originalMap._syncMaps.forEach(function (toSync) {
                            toSync.panBy(offset, options, true);
                        });
                    }
                    return L.Map.prototype.panBy.call(this, offset, options);
                },

                _onResize: function (event, sync) {
                    if (!sync) {
                        originalMap._syncMaps.forEach(function (toSync) {
                            toSync._onResize(event, true);
                        });
                    }
                    return L.Map.prototype._onResize.call(this, event);
                }
            });

            originalMap.on('zoomend', function () {
                // reset the map, and let setView synchronize the others.
                originalMap.setView(originalMap.getCenter(), originalMap.getZoom(), NO_ANIMATION);
            }, this);

            originalMap.on('dragend', function () {
                originalMap._syncMaps.forEach(function (toSync) {
                    toSync.fire('moveend');
                });
            });

            originalMap.on('resize', function (e) {
                // reset the map, and let setView synchronize the others.
                originalMap.setView(originalMap.getCenter(), originalMap.getZoom(), NO_ANIMATION);
            });

            originalMap.dragging._draggable._updatePosition = function () {
                L.Draggable.prototype._updatePosition.call(this);
                var self = this;
                originalMap._syncMaps.forEach(function (toSync) {
                    L.DomUtil.setPosition(toSync.dragging._draggable._element, self._newPos);
                    toSync.eachLayer(function (layer) {
                        if (layer._google !== undefined) {
                            layer._google.setCenter(
                                originalMap._syncOffsetFns[L.Util.stamp(toSync)](originalMap.getCenter(),
                                             originalMap.getZoom(), originalMap, toSync));
                        }
                    });
                    toSync.fire('move');
                });
            };
        }
    });
})();

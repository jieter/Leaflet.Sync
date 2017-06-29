/*
 * Extends L.Map to synchronize the interaction on one map to one or more other maps.
 */

(function () {
    var NO_ANIMATION = {
        animate: false,
        reset: true,
        disableViewprereset: true
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

            // on these events, we should reset the view on every synced map
            // dragstart and click are due to inertia
            this.on('resize zoomend dragstart click', this._selfSetView);
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

        _selfSetView: function () {
            // reset the map, and let setView synchronize the others.
            this.setView(this.getCenter(), this.getZoom(), NO_ANIMATION);
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

            if (!this._syncMaps || this._syncMaps.length == 0) {
                // no more synced maps, so these events are not needed.
                this.off('resize zoomend dragstart click', this._selfSetView);
            }

            return this;
        },

        // Checks if the map is synced with anything or a specifyc map
        isSynced: function (otherMap) {
            var has = (this.hasOwnProperty('_syncMaps') && Object.keys(this._syncMaps).length > 0);
            if (has && otherMap) {
                // Look for this specifyc map
                has = false;
                this._syncMaps.forEach(function (synced) {
                    if (otherMap == synced) has = true;
                });
            }
            return has;
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
                    // Use this sandwich to disable and enable viewprereset
                    // around setView call
                    function sandwich (obj, fn) {
                        var viewpreresets = [];
                        if (options && options.disableViewprereset) {
                            // The event viewpreresets does an invalidateAll,
                            // that reloads all the tiles.
                            // That causes an annoying flicker.
                            viewpreresets = obj._events.viewprereset;
                            obj._events.viewprereset = [];
                        }
                        var ret = fn(obj);
                        if (options && options.disableViewprereset) {
                            // restore viewpreresets event to its previous values
                            obj._events.viewprereset = viewpreresets;
                        }
                        return ret;
                    }

                    if (!sync) {
                        originalMap._syncMaps.forEach(function (toSync) {
                            sandwich(toSync, function (obj) {
                                return toSync.setView(
                                    originalMap._syncOffsetFns[L.Util.stamp(toSync)](center, zoom, originalMap, toSync),
                                    zoom, options, true);
                            });
                        });
                    }

                    return sandwich(this, function (obj) {
                        return L.Map.prototype.setView.call(obj, center, zoom, options);
                    });
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
                },

                // overload _stop. It is not mandatory, but it is better
                // stopping the inertia soon, and adjust later just a few pixels
                _stop: function (sync) {
                    if (!sync) {
                        originalMap._syncMaps.forEach(function (toSync) {
                            toSync._stop(true);
                        });
                    }
                    L.Map.prototype._stop.call(this);
                }
            });


            originalMap.on('dragend', function () {
                originalMap._syncMaps.forEach(function (toSync) {
                    toSync.fire('moveend');
                });
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

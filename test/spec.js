'use strict';

var NO_ANIMATE = {animate: false};

// Generate coords for a square-wave pattern (m=2) or
// a saw tooth with (m - 1) steps
var pattern = function (n, m) {
    var ticks = [];

    n = n || 160;
    m = m || 7;

    for (var i = -n; i < n; i++) {
        ticks.push([i % m, i]);
        ticks.push([(i + 1) % m, i]);
    }
    return ticks;
};

var crossedRect = function (a, b) {
    return [
        [a, -b], [-a, b], [a, b], [-a, b],
        [-a, -b], [a, -b], [a, b], [-a, -b],
        [0, 0], [0, b], [-a, 0],
        [0, 0], [0, -b], [-a, 0],
        [0, 0], [a, 0], [0, -b],
        [0, b], [a, 0]
    ];
};

// make a map, while destroying it if it exists
function makeMap (map, id, option) {
    if (map) {
        map.remove();
    }

    if (!option) {
        map = L.map(id, {
            attributionControl: false
        });
    }
    else {
        map = L.map(id, option);
    }

    map.setView([0, 0], 5);

    L.polyline(pattern(), {
        weight: 1
    }).addTo(map);
    L.polyline(crossedRect(70, 110), {
        weight: 1,
        color: 'red'
    }).addTo(map);

    return map;
}

var triggerDragAndDrop = function (selectorDrag, selectorDrop) {

    // function for triggering mouse events
    var fireMouseEvent = function (type, elem, centerX, centerY) {
        var evt = document.createEvent('MouseEvents');
        evt.initMouseEvent(type, true, true, window, 1, 1, 1, centerX, centerY, false, false, false, false, 0, elem);
        elem.dispatchEvent(evt);
    };

    // fetch target elements
    var elemDrag = document.querySelector(selectorDrag);
    var elemDrop = document.querySelector(selectorDrop);
    if (!elemDrag || !elemDrop) {
        return false;
    }

    // calculate positions
    var pos = elemDrag.getBoundingClientRect();
    var center1X = Math.floor((pos.left + pos.right) / 2);
    var center1Y = Math.floor((pos.top + pos.bottom) / 2);
    pos = elemDrop.getBoundingClientRect();
    var center2X = Math.floor((pos.left + pos.right) / 2);
    var center2Y = Math.floor((pos.top + pos.bottom) / 2);

    // mouse over dragged element and mousedown
    fireMouseEvent('mousemove', elemDrag, center1X, center1Y);
    fireMouseEvent('mouseenter', elemDrag, center1X, center1Y);
    fireMouseEvent('mouseover', elemDrag, center1X, center1Y);
    fireMouseEvent('mousedown', elemDrag, center1X, center1Y);

    // start dragging process over to drop target
    fireMouseEvent('dragstart', elemDrag, center1X, center1Y);
    fireMouseEvent('drag', elemDrag, center1X, center1Y);
    fireMouseEvent('mousemove', elemDrag, center1X, center1Y);
    fireMouseEvent('drag', elemDrag, center2X, center2Y);
    fireMouseEvent('mousemove', elemDrop, center2X, center2Y);

    // trigger dragging process on top of drop target
    fireMouseEvent('mouseenter', elemDrop, center2X, center2Y);
    fireMouseEvent('dragenter', elemDrop, center2X, center2Y);
    fireMouseEvent('mouseover', elemDrop, center2X, center2Y);
    fireMouseEvent('dragover', elemDrop, center2X, center2Y);

    // release dragged element on top of drop target
    fireMouseEvent('drop', elemDrop, center2X, center2Y);
    fireMouseEvent('dragend', elemDrag, center2X, center2Y);
    fireMouseEvent('mouseup', elemDrag, center2X, center2Y);

    return true;
};

describe('L.Sync', function () {
    this.timeout(5000);

    chai.should();

    var a, b, c;

    describe('sync two maps', function () {
        beforeEach(function () {
            a = makeMap(a, 'mapA');
            b = makeMap(b, 'mapB');

            a.sync(b);
        });

        it('has correct inital view', function () {
            a.should.have.view([0, 0], 5);
            b.should.have.view([0, 0], 5);
        });

        it('returns correct map instance', function () {
            a.sync(b).should.equal(a);
        });

        it('it is only added once', function () {
            a.sync(b);
            a.sync(b);

            a._syncMaps.should.have.length(1);
        });

        describe('setView', function () {
            it('syncs', function () {
                a.setView([1, 2], 3, NO_ANIMATE);
                b.should.have.view([1, 2], 3);
            });

            it('still returns map instance', function () {
                a.setView([1, 1], 3, NO_ANIMATE).should.equal(a);
            });
        });

        describe('panBy', function () {

            it('syncs', function () {
                a.panBy([200, 0], NO_ANIMATE);

                b.should.have.view([0, 8.789]);

                a.panBy([-200, 5], NO_ANIMATE);
                b.should.have.view([-0.2197, 0]);

                a.panBy([0, -5], NO_ANIMATE);
                b.should.have.view([0, 0]);
            });

            it('still returns map instance', function () {
                a.panBy([0, 2], NO_ANIMATE).should.equal(a);
            });

        });

        describe('_onResize', function () {
            afterEach(function () {
                a.getContainer().style.height = '200px';
            });

            it('syncs onResize', function () {
                a.getContainer().style.height = '400px';
                a.setView([3, 2], 5);
                a.invalidateSize(false);
            });
        });
    });

    describe('initial Sync', function () {
        beforeEach(function () {
            a = makeMap(a, 'mapA');
            b = makeMap(b, 'mapB');
            a.setView([1, 2], 3, NO_ANIMATE);
            b.setView([0, 0], 5, NO_ANIMATE);
        });

        it('sync initial view by default', function () {
            a.should.have.view([1, 2], 3);
            b.should.have.view([0, 0], 5);

            a.sync(b);

            a.should.have.view([1, 2], 3);
            b.should.have.view([1, 2], 3);
        });

        it('does not sync initially when disabled', function () {
            a.should.have.view([1, 2], 3);
            b.should.have.view([0, 0], 5);

            a.sync(b, {
                noInitialSync: true
            });

            a.should.have.view([1, 2], 3);
            b.should.have.view([0, 0], 5);
        });
    });

    describe('sync three maps, simple (C <- A -> B)', function () {
        beforeEach(function () {
            a = makeMap(a, 'mapA');
            b = makeMap(b, 'mapB');
            c = makeMap(c, 'mapC');

            a.sync(b);
            a.sync(c);
        });

        it('syncs to B and C', function () {
            a.setView([22, 21], 10);

            a.should.have.view([22, 21], 10);
            b.should.have.view([22, 21], 10);
            c.should.have.view([22, 21], 10);
        });

        it('pans B and C', function () {
            a.panTo([-20, 20], NO_ANIMATE);

            b.should.have.view(a.getCenter(), a.getZoom());
            c.should.have.view(a.getCenter(), a.getZoom());
        });
    });

    /**
     * Stuff to look at later, skipped for now.
     */
    describe('more complicated syncs', function () {
        beforeEach(function () {
            a = makeMap(a, 'mapA');
            b = makeMap(b, 'mapB');
            c = makeMap(c, 'mapC');
        });

        /**
         * Check if isSynced works
         */
        it('isSynced', function () {
            a.sync(b);
            b.sync(a);

            a.isSynced().should.be.true;
            b.isSynced().should.be.true;
            c.isSynced().should.be.false;
        });

        /**
         * two-way syncing seems to have problems
         */
        it('syncs two ways (A <-> B)', function () {
            a.sync(b);
            b.sync(a);

            a.setView([5, 6], 7, NO_ANIMATE);
            a.should.have.view([5, 6], 7);
            b.should.have.view([5, 6], 7);

            b.setView([3, 4], 5, NO_ANIMATE);
            b.should.have.view([3, 4], 5);
            a.should.have.view([3, 4], 5);
        });

        /**
         * Dragging is not propagated further than the next map in chain
         */
        it('sync a chain (A -> B -> C)', function () {
            a.sync(b);
            b.sync(c);

            a.setView([1, 2], 3, NO_ANIMATE);

            a.should.have.view([1, 2], 3);
            b.should.have.view([1, 2], 3);
            c.should.have.view([1, 2], 3);
        });

        /**
         * Rings do not work reliably yet
         */
        it('sync a ring (A -> B -> C -> A)', function () {
            a.sync(b);
            b.sync(c);
            c.sync(a);

            a.setView([4, 5], 6, NO_ANIMATE);
            [a, b, c].forEach(function (map) {
                map.should.have.view([4, 5], 6);
            });

            b.setView([5, 6], 7, NO_ANIMATE);
            [a, b, c].forEach(function (map) {
                map.should.have.view([5, 6], 7);
            });
        });
    });

    describe('unsyncing', function () {
        beforeEach(function () {
            a = makeMap(a, 'mapA');
            b = makeMap(b, 'mapB');

            a.sync(b);
        });

        it('does not fail on maps without any synced map', function () {
            (function () {
                b.unsync(b);
            }).should.not.throw();
        });

        it('returns correct map instance', function () {
            b.unsync(b).should.eql(b);
            a.unsync(b).should.eql(a);
        });

        it('removes the correct map', function () {
            a.sync(b);
            a.unsync(b);

            a._syncMaps.should.eql([]);
        });
    });

    describe('sync with syncCursor', function () {
        beforeEach(function () {
            b = makeMap(b, 'mapB', {syncCursor: true});
            a.setView([1, 2], 3, NO_ANIMATE);
            b.setView([0, 0], 5, NO_ANIMATE);
        });

        it('sync should still work with syncCursor ', function () {
            a.should.have.view([1, 2], 3);
            b.should.have.view([0, 0], 5);

            a.sync(b);

            a.should.have.view([1, 2], 3);
            b.should.have.view([1, 2], 3);
        });

    });

    describe('moveevents', function () {
        beforeEach(function () {
            beforeEach(function () {
                a = makeMap(a, 'mapA');
                b = makeMap(b, 'mapB');

                a.sync(b);
            });
        });

        it('moveend fired twice on dragNdrop', function () {
            // fired on dragstart (due to setView)
            // and on dragend
            var numberOfMoveend = 0;
            b.on('moveend', function () {
                numberOfMoveend++;
            });

            //simulate dragAndDrop
            triggerDragAndDrop('#mapA', '#mapB');
            numberOfMoveend.should.equal(2);
        });

        it('move fired twice on _updatePosition', function () {
            // fired on dragstart (due to setView)
            // and on dragend
            var numberOfMove = 0;
            b.on('move', function () {
                numberOfMove++;
            });

            triggerDragAndDrop('#mapA', '#mapB');
            a.dragging._draggable._updatePosition();

            numberOfMove.should.equal(2);
        });
    });

    describe('offset', function () {
        describe('horizonal', function () {
            beforeEach(function () {
                a = makeMap(a, 'mapA');
                b = makeMap(b, 'mapB');

                a.sync(b, {offsetFn: L.Sync.offsetHelper([1, 0], [0, 0])});
            });

            it('has correct inital view', function () {
                a.should.have.view([0, 0], 5);
                b.should.have.view([0, 8.78906], 5); // width/(256*2^zoom)*360
            });

            it('returns correct map instance', function () {
                a.sync(b).should.equal(a);
            });

            it('it is only added once', function () {
                a.sync(b);
                a.sync(b);

                a._syncMaps.should.have.length(1);
            });

            describe('setView', function () {
                it('syncs', function () {
                    a.setView([1, 2], 3, NO_ANIMATE);
                    b.should.have.view([1, 37.15625], 3); // 2 + width/(256*2^zoom)*360
                });

                it('still returns map instance', function () {
                    a.setView([1, 1], 3, NO_ANIMATE).should.equal(a);
                });
            });

            describe('panBy', function () {

                it('syncs', function () {
                    a.panBy([200, 0], NO_ANIMATE);

                    b.should.have.view([0, 17.57813]);

                    a.panBy([-200, 5], NO_ANIMATE);
                    b.should.have.view([-0.2197, 8.78906]);

                    a.panBy([0, -5], NO_ANIMATE);
                    b.should.have.view([0, 8.78906]);
                });

                it('still returns map instance', function () {
                    a.panBy([0, 2], NO_ANIMATE).should.equal(a);
                });

            });
        });
        describe('vertical', function () {
            beforeEach(function () {
                a = makeMap(a, 'mapA');
                b = makeMap(b, 'mapB');

                a.sync(b, {offsetFn: L.Sync.offsetHelper([0, 0], [0, 1])});
            });

            it('has correct inital view', function () {
                var lat = a.unproject([0, (256*(1 << 5)/2)-200], 5).lat;
                a.should.have.view([0, 0], 5);
                b.should.have.view([lat, 0], 5);
            });

            describe('setView', function () {
                it('syncs', function () {
                    var p = a.project([1, 2], 3);
                    p.y -= 200;
                    var lat = a.unproject(p, 3).lat;
                    a.setView([1, 2], 3, NO_ANIMATE);
                    b.should.have.view([lat, 2], 3);
                });
            });

            describe('panBy', function () {

                it('syncs', function () {
                    a.panBy([200, 0], NO_ANIMATE);

                    b.should.have.view([8.75479, 8.78906]);

                    a.panBy([-200, 5], NO_ANIMATE);
                    b.should.have.view([8.53757, 0]);

                    a.panBy([0, -5], NO_ANIMATE);
                    b.should.have.view([8.75479, 0]);
                });
            });
        });
        describe('reSync', function () {
            beforeEach(function () {
                a = makeMap(a, 'mapA');
                b = makeMap(b, 'mapB');
                a.setView([1, 2], 3, NO_ANIMATE);
                b.setView([0, 0], 5, NO_ANIMATE);
            });

            it('sync, unsync and resync', function () {
                a.should.have.view([1, 2], 3);
                b.should.have.view([0, 0], 5);

                a.sync(b);
                a._syncMaps.should.have.length(1);
                Object.keys(a._syncOffsetFns).should.have.length(1);

                a.should.have.view([1, 2], 3);
                b.should.have.view([1, 2], 3);

                a.unsync(b);
                a._syncMaps.should.have.length(0);
                Object.keys(a._syncOffsetFns).should.have.length(0);

                a.should.have.view([1, 2], 3);
                b.should.have.view([1, 2], 3);

                b.setView([3, 4], 5, NO_ANIMATE);
                a.should.have.view([1, 2], 3);
                b.should.have.view([3, 4], 5);

                a.sync(b, {offsetFn: L.Sync.offsetHelper([1, 0], [0, 1])});
                a.should.have.view([1, 2], 3);
                b.should.have.view([33.97094, 37.15625], 3);
            });
        });
        describe('A<->B', function () {
            beforeEach(function () {
                a = makeMap(a, 'mapA');
                b = makeMap(b, 'mapB');
                a.setView([1, 2], 3, NO_ANIMATE);
                b.setView([0, 0], 5, NO_ANIMATE);
            });

            it('sync', function () {
                a.should.have.view([1, 2], 3);
                b.should.have.view([0, 0], 5);

                a.sync(b, {offsetFn: L.Sync.offsetHelper([1, 0], [0, 1])});
                b.sync(a, {offsetFn: L.Sync.offsetHelper([0, 1], [1, 0])});
                a._syncMaps.should.have.length(1);
                Object.keys(a._syncOffsetFns).should.have.length(1);
                b._syncMaps.should.have.length(1);
                Object.keys(b._syncOffsetFns).should.have.length(1);

                a.should.have.view([1, 2], 3);
                b.should.have.view([33.97094, 37.15625], 3);
            });
        });

        describe('A <-> B, A <-> C', function () {
            beforeEach(function () {
                a = makeMap(a, 'mapA');
                b = makeMap(b, 'mapB');
                c = makeMap(c, 'mapC');
                a.sync(b, {offsetFn: L.Sync.offsetHelper([1, 0], [0, 0])});
                b.sync(a, {offsetFn: L.Sync.offsetHelper([0, 0], [1, 0])});
                a.sync(c, {offsetFn: L.Sync.offsetHelper([1, 1], [0, 0])});
                c.sync(a, {offsetFn: L.Sync.offsetHelper([0, 0], [1, 1])});
            });

            /**
             * Check if isSynced works
             */
            it('isSynced', function () {
                a.isSynced().should.be.true;
                b.isSynced().should.be.true;
                c.isSynced().should.be.true;

                a._syncMaps.should.have.length(2);
                Object.keys(a._syncOffsetFns).should.have.length(2);
                b._syncMaps.should.have.length(1);
                Object.keys(b._syncOffsetFns).should.have.length(1);
                c._syncMaps.should.have.length(1);
                Object.keys(c._syncOffsetFns).should.have.length(1);
            });

            it('syncs', function () {
                a.setView([5, 6], 7, NO_ANIMATE);
                a.should.have.view([5, 6], 7);
                b.should.have.view([5, 8.19727], 7);
                c.should.have.view([2.80797, 8.19727], 7);

                b.setView([3, 4], 5, NO_ANIMATE);
                b.should.have.view([3, 4], 5);
                a.should.have.view([3, -4.78906], 5);
                c.should.have.view([-5.77787, 4], 5);
            });
        });
        describe('A -> B, A -> C', function () {
            /* parameter greater than 1 */
            beforeEach(function () {
                a = makeMap(a, 'mapA');
                b = makeMap(b, 'mapB');
                c = makeMap(c, 'mapC');
                a.sync(b, {offsetFn: L.Sync.offsetHelper([1, 0], [0, 0])});
                a.sync(c, {offsetFn: L.Sync.offsetHelper([2, 0], [0, 0])});
            });

            it('syncs', function () {
                a.setView([5, 6], 7, NO_ANIMATE);
                a.should.have.view([5, 6], 7);
                b.should.have.view([5, 8.19727], 7);
                c.should.have.view([5, 10.39453], 7);
            });
        });
    });
});

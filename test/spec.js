/* jshint node:true */
/* globals
L:true,
chai:true, describe:true, beforeEach:true, afterEach:true, it:true
*/
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
function makeMap(map, id) {
	if (map) {
		map.remove();
	}

	map = L.map(id, {
		attributionControl: false
	});

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

describe('L.Sync', function () {
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
});

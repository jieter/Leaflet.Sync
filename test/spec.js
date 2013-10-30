'use strict';

chai.Assertion.addMethod('haveView', function (center, zoom) {
	var delta = 0.1;

	var map = this._obj;
	var actualCenter = map.getCenter();

	new chai.Assertion(actualCenter.lat).to.be.closeTo(center[0], delta);
	new chai.Assertion(actualCenter.lng).to.be.closeTo(center[1], delta);

	if (zoom !== undefined) {
		new chai.Assertion(map.getZoom()).to.equal(zoom);
	}
});

var NO_ANIMATE = {animate: false};

// Generate coords for a square-wave pattern (m2) or
// a saw tooth with (m - 1) steps
var pattern = function (n, m) {
	var ticks = [];

	n = n || 42;
	m = m || 7;

	for (var i = -n; i < n; i++) {
		ticks.push([i % m, i]);
		ticks.push([(i + 1) % m, i]);
	}
	return ticks;
}

// make make a map, while destroying it if it exists
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

	return map;
}

describe('L.Sync', function () {
	chai.should();

	var a, b;

	beforeEach(function () {
		a = makeMap(a, 'mapA');
		b = makeMap(b, 'mapB');

		a.sync(b);
	});
	describe('syncing two maps', function () {

		it('has correct inital view', function () {
			a.should.haveView([0, 0], 5);
		});

		it('returns map instance', function () {
			a.sync(b).should.equal(a);
		});

		it('it is only added once', function () {
			a.sync(b);
			a.sync(b);

			a._syncMaps.should.have.length(1);
		});

		it('syncs setView', function () {
			a.setView([1, 2], 3, NO_ANIMATE);
			b.should.haveView([1, 2], 3);
		});

		it.skip('two-way sync', function () {
			b.sync(a);

			a.setView([5, 6], 7, NO_ANIMATE);
			a.should.haveView([5, 6], 6);
			b.should.haveView([5, 6], 7);

			b.setView([3, 4], 5, NO_ANIMATE);
			b.should.haveView([3, 4], 5);
			a.should.haveView([3, 4], 5);
		});

		// fix frozen map dragging after this test.
		// it('syncs panBy', function () {
		// 	a.panBy([200, 0], NO_ANIMATE);
		// 	b.should.haveView([0, 8.789]);

		// 	a.panBy([-200, 5], NO_ANIMATE);
		// 	b.should.haveView([-0.219, 0]);

		// 	a.panBy([0, -5], NO_ANIMATE);
		// 	b.should.haveView([0, 0]);
		// });

		// it('syncs onResize', function () {
		// 	a.getContainer().style.height = '400px';
		// 	a.setView([3, 2], 5);
		// 	a.invalidateSize(false);

		// 	console.log(a.getCenter(), b.getCenter());
		// });
		// it('is tested manually', function () {

		// });
	});

	describe('unsyncing', function () {
		it('does not fail on maps without any synced map', function () {
			(function () {
				b.unsync(b);
			}).should.not.throw();
		});

		it('returns current instance', function () {
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

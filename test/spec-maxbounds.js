
describe.only('maxBounds defined on map', function () {
    chai.should();

    var a, b;
    // afterEach(function () {
    //     a.remove();
    //     b.remove();
    // });

    it('should not exceed call stack', function (done) {
        // Original error:
        // Uncaught RangeError: Maximum call stack size exceeded
        // Github issue: https://github.com/turban/Leaflet.Sync/issues/21

        var center = [60, 6];
        var zoom = 5;
        var bounds = L.latLngBounds([[50, 0], [60, 10]]);

        a = L.map(disposableDiv(), {maxBounds: bounds}).setView(center, zoom);
        b = L.map(disposableDiv(), {maxBounds: bounds});

        if (!L.Browser.phantomjs) {
            // do not show the tile layers in phantomjs to reduce the tile
            // requests from CI
            tileLayer().addTo(a);
            tileLayer('toner').addTo(b);
        }

        a.sync(b);
        b.sync(a);

        // Visualize the bounds
        L.rectangle(bounds).addTo(a);

        // move with a hand
        var h = new Hand();
        var mouse = h.growFinger('mouse');

        mouse.wait(20).moveTo(3, 550, 100)
            .down().moveBy(390, 50, 100).up();

        a.on('mousedown', function () {
            console.log('mousedown');
        });
        a.on('mouseup', function () {
            console.log('mouseup');
            done();
        });
    });
});

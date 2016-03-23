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
function makeMap (map, id, options) {
	if (map) {
		map.remove();
	}

	map = L.map(id, L.extend({attributionControl: false}, options));

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

function disposableDiv () {
    var div = document.createElement('div');
    div.style.width = '400px';
    div.style.height = '400px';
    document.body.appendChild(div);
	return div;
}

function tileLayer (variant) {
    variant = variant || 'toner-lite';
    return L.tileLayer('http://{s}.tile.stamen.com/{variant}/{z}/{x}/{y}.png', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd',
        maxZoom: 20,
		variant: variant
    });
}

L.Browser.phantomjs = navigator.userAgent.toLowerCase().indexOf('phantom') !== -1;

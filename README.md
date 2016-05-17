Leaflet.Sync
============

Synchronized view of two maps. Tested with Leaflet 0.7.7 and 1.0.0-rc.1.

[More information in original blog post by @turban](http://blog.thematicmapping.org/2013/06/creating-synchronized-view-of-two-maps.html)

Installation
------------

Using npm for browserify `npm install leaflet.sync` (and `require('leaflet.sync')`), or just download `L.Map.Sync.js` and add a script tag for it in you html.

What's new ?
-----
Add synchronized cursors between synced maps to compare more accurately.

Usage
-----

## Two maps.
With two map objects, `mapA` and `mapB`, call `mapA.sync(mapB)` to sync interactions on `mapA` with `mapB`.

In order to make the other direction work, you should make another call: `mapB.sync(mapA)`

When in need to unsync maps simply call `mapA.unsync(mapB)` to release sync interactions on `mapB` and `mapB.unsync(mapA)` to release `mapA`.

## More than two maps
Just make more calls to `map.sync()`, with different map objects. Interaction will be synced to all of them. If you want the actions to be synced vice-versa, you should synchronize all directions.

```JavaScript
// synchronize three maps
mapA.sync(mapB);
mapA.sync(mapC);
mapB.sync(mapA);
mapB.sync(mapC);
mapC.sync(mapA);
mapC.sync(mapB);
```

API
---

### `mapA.sync(mapB, [options])`
Replays all interaction on `mapA` on `mapB` to keep their views synchronized. Initially synchronizes the view of `mapA` to `mapB`.

Optional `options`:
```JavaScript
{
  noInitialSync: true, // disables initial synchronization of the maps.
  addCricleMarker: true // add a circle marker on the synced map
}
```

### `mapA.unsync(mapB)`

Removes synchronization.

### `mapA.isSynced()`

Returns true if the map is synchronized with any other map.


Known issues
------------

 - Dragging is not propagated more than one level (In a `a.sync(b.sync(c))` situation, dragging on `a` will not result in change on `c`).

Running tests
-------------

Install dependencies and run tests:
```
npm install && npm test
```
or load `test/index.html` in your browser after installing the dependencies by running `npm install`.

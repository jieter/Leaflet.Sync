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
## Offset
You can synchronize not only the centers, but other points, using the option `offsetFn`.
The parameters send to the function are `(center, zoom, referenceMap, targetMap)`, and it must return the equivalent center to produce your offset. That means, the center to pass to setView.

In most cases, you can use the factory `offsetHelper`, that accepts two arrays of two elements each `(ratioRef, ratioTgt)`. The meaning of this array is the relative position -relative to the top left corner and the whole size- in the map container of the point to synchronize. (1 is for the whole width or height). Values greater than 1 or less than 0 work fine.

For instance `mapB.sync(mapC, {offsetFn: L.Map.prototype.offsetHelper([0, 1], [1, 1])});` will sync the bottom left corner `[0, 1]` in the reference map (mapB) with the bottom right corner `[1, 1]` in the target map (mapC).

As well `mapB.sync(mapA, {offsetFn: mapB.offsetHelper([0, 0], [1, 0.5])});` will sync the top left corner `[0 ,0]` in mapB with the center of the right side `[1, 0.5]` in mapA.

If you want the actions to be synced vice-versa, you should use simetric values (as reference and target are swapped).

The default behaviour uses `[0.5, 0.5], [0.5, 0.5]`, that synchronizes the centers.

Have a look at the file [examples/multiple_offset.html](examples/multiple_offset.html) to see how to sync multiple maps with offsets.

API
---

### `mapA.sync(mapB, [options])`
Replays all interaction on `mapA` on `mapB` to keep their views synchronized. Initially synchronizes the view of `mapA` to `mapB`.

Optional `options`:
```JavaScript
{
    noInitialSync: true, // disables initial synchronization of the maps.
    syncCursor: true, // add a circle marker on the synced map
    offsetFn: function (center, zoom, refMap, tgtMap) { return center; } // function to compute an offset for the center
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

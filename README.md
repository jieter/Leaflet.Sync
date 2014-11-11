Leaflet.Sync
============

Synchronized view of two maps. Tested with Leaflet 0.7.x and Leaflet 0.8-dev (48677f2).

[More information in original blog post by @turban](http://blog.thematicmapping.org/2013/06/creating-synchronized-view-of-two-maps.html)

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
Replays all interaction on `mapA` on `mapB` to keep their views synchronised. Initially applies the view of `mapA` to `mapB`.

Optional `options` map:
```JavaScript
{
	noInitialSync: true // disables initial synchronisation of the maps.
}
```

### `mapA.unsync(mapB)`

Removes synchronisation.

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




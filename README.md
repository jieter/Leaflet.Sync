Leaflet.Sync
============

Synchronized view of two maps.

<a href="http://blog.thematicmapping.org/2013/06/creating-synchronized-view-of-two-maps.html">More information</a>

Usage
-----

## Two maps.
With two map objects, `mapA` and `mapB`, call `mapA.sync(mapB)` to sync interactions on `mapA` with `mapB`.

In order to make the other direction work, you should make another call: `mapB.sync(mapA)`


## More than two maps
Just make more calls to `map.sync()`, with different map objects. Interaction will be synced to all of them. If you want the actions to be synced vice-versa, you should synchronise all directions.

```JavaScript
// synchronize three maps
mapA.sync(mapB);
mapA.sync(mapC);
mapB.sync(mapA);
mapB.sync(mapC);
mapC.sync(mapA);
mapC.sync(mapB);
```
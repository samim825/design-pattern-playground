import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Java: the flyweight is a record (immutable, shareable); the factory caches models with
// computeIfAbsent, so the "create on first request" logic is one line.

const main = `
// {{flyweight}}
record VehicleModel(Image sprite, Image hoodArt, Sound bell) { // {{sharedSprite}} // @step:split
    void draw(MapCanvas map, int x, int y, int heading) { // {{extrinsicIn}}
        map.blit(sprite, x, y, heading); // @step:draw
    }
}

// {{factory}}
final class ModelFactory {
    private final Map<String, VehicleModel> cache = new HashMap<>();
    private final Map<String, Supplier<VehicleModel>> loaders = new HashMap<>();

    void register(String type, Supplier<VehicleModel> load) {
        loaders.put(type, load);
    }

    VehicleModel get(String type) { // {{lookFirst}} // @step:request
        return cache.computeIfAbsent(type, t -> loaders.get(t).get()); // {{missCreate}} // @step:miss,hit
    }
}

// {{context}}
final class Vehicle { // @step:split
    private final int x, y, heading; // {{extrinsic}} // @step:place
    private boolean isFree;
    private final VehicleModel model; // {{sharedRef}} // @step:place

    Vehicle(int x, int y, int heading, boolean isFree, VehicleModel model) {
        this.x = x; this.y = y; this.heading = heading;
        this.isFree = isFree; this.model = model;
    }

    void draw(MapCanvas map) { model.draw(map, x, y, heading); } // @step:draw
}

// {{usage}}
var factory = new ModelFactory();
factory.register("rickshaw", () ->
    new VehicleModel(loadImage("rickshaw.png"), loadImage("hood-art.png"), loadSound("bell.mp3"))); // @step:miss
// {{manyObjects}}
List<Vehicle> rickshaws = farmgate.spots().stream() // @step:fill
    .map(s -> new Vehicle(s.x(), s.y(), s.heading(), true, factory.get("rickshaw"))) // @step:request,place
    .toList();
rickshaws.forEach(r -> r.draw(map)); // @step:draw
`

const without = `
// {{withoutIntro}}
class Rickshaw {
    private final Image sprite; // {{ownCopy}}
    private final Image hoodArt;
    private final int x, y, heading;

    Rickshaw(int x, int y, int heading) { // @step:l1-new
        this.sprite = loadImage("rickshaw.png"); // {{loadsAgain}} // @step:l1-new,l1-copy
        this.hoodArt = loadImage("hood-art.png"); // @step:l1-new,l1-copy
        this.x = x; this.y = y; this.heading = heading;
    }

    void draw(MapCanvas map) { map.blit(sprite, x, y, heading); }
}

class MapScreen {
    private final List<Rickshaw> rickshaws = new ArrayList<>();

    void showArea(Area area, int limit) { // {{pickLimit}} // @step:l1-start
        for (Spot s : area.spots().subList(0, limit)) { // @step:l1-fill
            rickshaws.add(new Rickshaw(s.x(), s.y(), s.heading())); // {{perObject}} // @step:l1-new,l1-copy,l1-fill
        }
        rickshaws.forEach(r -> r.draw(map)); // {{outOfMemory}} // @step:l1-result
    }
}
// {{withoutMath}} // @step:l1-math
`

const withPattern = `
// {{withAdd}}
factory.register("cng", () -> // {{newModel}} // @step:build-model,l3-miss
    new VehicleModel(loadImage("cng.png"), loadImage("green-cage.png"), loadSound("horn.mp3"))); // {{cngShared}} // @step:build-model,l3-miss

// {{withSame}}
// {{unchanged}}
var rickshaws = gulshan.rickshawSpots().stream()
    .map(s -> new Vehicle(s.x(), s.y(), s.heading(), true, factory.get("rickshaw"))).toList(); // @step:l3-rickshaws
var cngs = gulshan.cngSpots().stream() // @step:l3-fill
    .map(s -> new Vehicle(s.x(), s.y(), s.heading(), true, factory.get("cng"))).toList(); // {{sameFactory}} // @step:build-use,l3-request,l3-hit,l3-place
Stream.concat(rickshaws.stream(), cngs.stream()).forEach(v -> v.draw(map)); // {{sameDraw}} // @step:l3-draw
// {{withZero}}
`

export const java: CodeSet = {
  main: { filename: 'RickshawMap.java', source: main },
  without: { filename: 'RickshawMapWithoutFlyweight.java', source: without },
  with: { filename: 'RickshawMapWithFlyweight.java', source: withPattern },
}

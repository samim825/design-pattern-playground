import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Swift: the flyweight is a final class (a reference type), so every Vehicle struct holds a
// reference to the one cached model; a struct model would be copied into each vehicle instead.

const main = `
// {{flyweight}}
final class VehicleModel { // @step:split
    let sprite: Image // {{sharedSprite}}
    let hoodArt: Image
    let bell: Sound

    init(sprite: Image, hoodArt: Image, bell: Sound) {
        self.sprite = sprite; self.hoodArt = hoodArt; self.bell = bell
    }

    func draw(on map: MapCanvas, x: Int, y: Int, heading: Int) { // {{extrinsicIn}}
        map.blit(sprite, x: x, y: y, heading: heading) // @step:draw
    }
}

// {{factory}}
final class ModelFactory {
    private var cache: [String: VehicleModel] = [:]
    private var loaders: [String: () -> VehicleModel] = [:]

    func register(_ type: String, load: @escaping () -> VehicleModel) { loaders[type] = load }

    func get(_ type: String) -> VehicleModel { // @step:request
        if let model = cache[type] { return model } // {{hitReuse}} // @step:request,hit
        let model = loaders[type]!() // {{missCreate}} // @step:miss
        cache[type] = model // @step:miss
        return model
    }
}

// {{context}}
struct Vehicle { // @step:split
    var x: Int, y: Int, heading: Int // {{extrinsic}} // @step:place
    var isFree: Bool
    let model: VehicleModel // {{sharedRef}} // @step:place

    func draw(on map: MapCanvas) { model.draw(on: map, x: x, y: y, heading: heading) } // @step:draw
}

// {{usage}}
let factory = ModelFactory()
factory.register("rickshaw") {
    VehicleModel(sprite: loadImage("rickshaw.png"), hoodArt: loadImage("hood-art.png"), bell: loadSound("bell.mp3")) // @step:miss
}
let rickshaws = farmgate.spots.map { s in // {{manyObjects}} // @step:fill
    Vehicle(x: s.x, y: s.y, heading: s.heading, isFree: true, model: factory.get("rickshaw")) // @step:request,place
}
rickshaws.forEach { $0.draw(on: map) } // @step:draw
`

const without = `
// {{withoutIntro}}
struct Rickshaw {
    let sprite: Image // {{ownCopy}}
    let hoodArt: Image
    var x: Int, y: Int, heading: Int

    init(x: Int, y: Int, heading: Int) { // @step:l1-new
        sprite = loadImage("rickshaw.png") // {{loadsAgain}} // @step:l1-new,l1-copy
        hoodArt = loadImage("hood-art.png") // @step:l1-new,l1-copy
        self.x = x; self.y = y; self.heading = heading
    }

    func draw(on map: MapCanvas) { map.blit(sprite, x: x, y: y, heading: heading) }
}

extension MapScreen {
    func showArea(_ area: Area, limit: Int) { // {{pickLimit}} // @step:l1-start
        for s in area.spots.prefix(limit) { // @step:l1-fill
            rickshaws.append(Rickshaw(x: s.x, y: s.y, heading: s.heading)) // {{perObject}} // @step:l1-new,l1-copy,l1-fill
        }
        rickshaws.forEach { $0.draw(on: map) } // {{outOfMemory}} // @step:l1-result
    }
}
// {{withoutMath}} // @step:l1-math
`

const withPattern = `
// {{withAdd}}
factory.register("cng") { // {{newModel}} // @step:build-model,l3-miss
    VehicleModel(sprite: loadImage("cng.png"), hoodArt: loadImage("green-cage.png"), bell: loadSound("horn.mp3")) // {{cngShared}} // @step:build-model,l3-miss
}

// {{withSame}}
// {{unchanged}}
let rickshaws = gulshan.rickshawSpots.map { s in
    Vehicle(x: s.x, y: s.y, heading: s.heading, isFree: true, model: factory.get("rickshaw")) // @step:l3-rickshaws
}
let cngs = gulshan.cngSpots.map { s in // @step:l3-fill
    Vehicle(x: s.x, y: s.y, heading: s.heading, isFree: true, model: factory.get("cng")) // {{sameFactory}} // @step:build-use,l3-request,l3-hit,l3-place
}
(rickshaws + cngs).forEach { $0.draw(on: map) } // {{sameDraw}} // @step:l3-draw
// {{withZero}}
`

export const swift: CodeSet = {
  main: { filename: 'RickshawMap.swift', source: main },
  without: { filename: 'RickshawMapWithoutFlyweight.swift', source: without },
  with: { filename: 'RickshawMapWithFlyweight.swift', source: withPattern },
}

import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Rust: sharing one value between many owners means a reference-counted pointer. The factory
// keeps HashMap<String, Rc<VehicleModel>> and hands out Rc clones (a pointer copy, not an image copy).

const main = `
use std::collections::HashMap;
use std::rc::Rc;

// {{flyweight}}
pub struct VehicleModel { // @step:split
    pub sprite: Image, // {{sharedSprite}}
    pub hood_art: Image,
    pub bell: Sound,
}

impl VehicleModel {
    pub fn draw(&self, canvas: &mut MapCanvas, x: i32, y: i32, heading: i32) { // {{extrinsicIn}}
        canvas.blit(&self.sprite, x, y, heading); // @step:draw
    }
}

// {{factory}}
#[derive(Default)]
pub struct ModelFactory {
    cache: HashMap<String, Rc<VehicleModel>>,
    loaders: HashMap<String, Box<dyn Fn() -> VehicleModel>>,
}

impl ModelFactory {
    pub fn register(&mut self, kind: &str, load: impl Fn() -> VehicleModel + 'static) {
        self.loaders.insert(kind.to_string(), Box::new(load));
    }

    pub fn get(&mut self, kind: &str) -> Rc<VehicleModel> { // {{lookFirst}} // @step:request
        let loaders = &self.loaders;
        let model = self.cache.entry(kind.to_string()) // @step:request,hit
            .or_insert_with(|| Rc::new(loaders[kind]())); // {{missCreate}} // @step:miss
        Rc::clone(model) // {{hitReuse}} // @step:hit
    }
}

// {{context}}
pub struct Vehicle { // @step:split
    x: i32, y: i32, heading: i32, // {{extrinsic}} // @step:place
    is_free: bool,
    model: Rc<VehicleModel>, // {{sharedRef}} // @step:place
}

impl Vehicle {
    pub fn draw(&self, canvas: &mut MapCanvas) { self.model.draw(canvas, self.x, self.y, self.heading); } // @step:draw
}

// {{usage}}
let mut factory = ModelFactory::default();
factory.register("rickshaw", || VehicleModel {
    sprite: load_image("rickshaw.png"), hood_art: load_image("hood-art.png"), bell: load_sound("bell.mp3"), // @step:miss
});
let rickshaws: Vec<Vehicle> = farmgate.spots.iter() // {{manyObjects}} // @step:fill
    .map(|s| Vehicle { x: s.x, y: s.y, heading: s.heading, is_free: true, model: factory.get("rickshaw") }) // @step:request,place
    .collect();
rickshaws.iter().for_each(|r| r.draw(&mut canvas)); // @step:draw
`

const without = `
// {{withoutIntro}}
pub struct Rickshaw {
    sprite: Image, // {{ownCopy}}
    hood_art: Image,
    x: i32, y: i32, heading: i32,
}

impl Rickshaw {
    pub fn new(x: i32, y: i32, heading: i32) -> Self { // @step:l1-new
        Rickshaw {
            sprite: load_image("rickshaw.png"), // {{loadsAgain}} // @step:l1-new,l1-copy
            hood_art: load_image("hood-art.png"), // @step:l1-new,l1-copy
            x, y, heading,
        }
    }

    pub fn draw(&self, canvas: &mut MapCanvas) { canvas.blit(&self.sprite, self.x, self.y, self.heading); }
}

impl MapScreen {
    pub fn show_area(&mut self, area: &Area, limit: usize) { // {{pickLimit}} // @step:l1-start
        for s in area.spots.iter().take(limit) { // @step:l1-fill
            self.rickshaws.push(Rickshaw::new(s.x, s.y, s.heading)); // {{perObject}} // @step:l1-new,l1-copy,l1-fill
        }
        self.rickshaws.iter().for_each(|r| r.draw(&mut self.canvas)); // {{outOfMemory}} // @step:l1-result
    }
}
// {{withoutMath}} // @step:l1-math
`

const withPattern = `
// {{withAdd}}
factory.register("cng", || VehicleModel { // {{newModel}} // @step:build-model,l3-miss
    sprite: load_image("cng.png"), hood_art: load_image("green-cage.png"), bell: load_sound("horn.mp3"), // {{cngShared}} // @step:build-model,l3-miss
});

// {{withSame}}
for s in &gulshan.rickshaw_spots { // {{unchanged}}
    vehicles.push(Vehicle { x: s.x, y: s.y, heading: s.heading, is_free: true, model: factory.get("rickshaw") }); // @step:l3-rickshaws
}
for s in &gulshan.cng_spots { // @step:l3-fill
    vehicles.push(Vehicle { x: s.x, y: s.y, heading: s.heading, is_free: true, model: factory.get("cng") }); // {{sameFactory}} // @step:build-use,l3-request,l3-hit,l3-place
}
vehicles.iter().for_each(|v| v.draw(&mut canvas)); // {{sameDraw}} // @step:l3-draw
// {{withZero}}
`

export const rust: CodeSet = {
  main: { filename: 'rickshaw_map.rs', source: main },
  without: { filename: 'rickshaw_map_without_flyweight.rs', source: without },
  with: { filename: 'rickshaw_map_with_flyweight.rs', source: withPattern },
}

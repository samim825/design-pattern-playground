import type { CodeSet } from '@/types/pattern'

/*
 * Conventions (see CLAUDE.md):
 *   // {{key}}        → translated comment from content.<lang>.ts → codeComments[key]
 *   // @step:a,b      → this line lights up while visual step a or b runs (stripped on display)
 * Image, Sound, MapCanvas, Area and the load* helpers are left undeclared to keep it short.
 */

const main = `
// {{flyweight}}
class VehicleModel { // @step:split
  constructor(
    readonly sprite: Image, // {{sharedSprite}}
    readonly hoodArt: Image,
    readonly bell: Sound,
  ) {}

  draw(map: MapCanvas, x: number, y: number, heading: number): void { // {{extrinsicIn}}
    map.blit(this.sprite, x, y, heading); // @step:draw
  }
}

// {{factory}}
class ModelFactory {
  private readonly cache = new Map<string, VehicleModel>();
  private readonly loaders = new Map<string, () => VehicleModel>();

  register(type: string, load: () => VehicleModel): void {
    this.loaders.set(type, load);
  }

  get(type: string): VehicleModel { // @step:request
    let model = this.cache.get(type); // {{lookFirst}} // @step:request,hit
    if (!model) {
      model = this.loaders.get(type)!(); // {{missCreate}} // @step:miss
      this.cache.set(type, model); // @step:miss
    }
    return model; // {{hitReuse}} // @step:hit
  }
}

// {{context}}
class Vehicle { // @step:split
  constructor(
    private x: number, // {{extrinsic}} // @step:place
    private y: number,
    private heading: number,
    private isFree: boolean,
    private readonly model: VehicleModel, // {{sharedRef}} // @step:place
  ) {}

  draw(map: MapCanvas): void { this.model.draw(map, this.x, this.y, this.heading); } // @step:draw
}

// {{usage}}
const factory = new ModelFactory();
factory.register('rickshaw', () =>
  new VehicleModel(loadImage('rickshaw.png'), loadImage('hood-art.png'), loadSound('bell.mp3'))); // @step:miss
const rickshaws = farmgate.spots.map((s) => // {{manyObjects}} // @step:fill
  new Vehicle(s.x, s.y, s.heading, true, factory.get('rickshaw'))); // @step:request,place
rickshaws.forEach((r) => r.draw(map)); // @step:draw
`

const without = `
// {{withoutIntro}}
class Rickshaw {
  readonly sprite: Image; // {{ownCopy}}
  readonly hoodArt: Image;

  constructor(private x: number, private y: number, private heading: number) { // @step:l1-new
    this.sprite = loadImage('rickshaw.png'); // {{loadsAgain}} // @step:l1-new,l1-copy
    this.hoodArt = loadImage('hood-art.png'); // @step:l1-new,l1-copy
  }

  draw(map: MapCanvas): void { map.blit(this.sprite, this.x, this.y, this.heading); }
}

class MapScreen {
  private readonly rickshaws: Rickshaw[] = [];

  showArea(area: Area, limit: number): void { // {{pickLimit}} // @step:l1-start
    for (const s of area.spots.slice(0, limit)) { // @step:l1-fill
      this.rickshaws.push(new Rickshaw(s.x, s.y, s.heading)); // {{perObject}} // @step:l1-new,l1-copy,l1-fill
    }
    this.rickshaws.forEach((r) => r.draw(this.map)); // {{outOfMemory}} // @step:l1-result
  }
}
// {{withoutMath}} // @step:l1-math
`

const withPattern = `
// {{withAdd}}
factory.register('cng', () => // {{newModel}} // @step:build-model,l3-miss
  new VehicleModel(loadImage('cng.png'), loadImage('green-cage.png'), loadSound('horn.mp3'))); // {{cngShared}} // @step:build-model,l3-miss

// {{withSame}}
const rickshaws = gulshan.rickshawSpots.map((s) => // {{unchanged}}
  new Vehicle(s.x, s.y, s.heading, true, factory.get('rickshaw'))); // @step:l3-rickshaws
const cngs = gulshan.cngSpots.map((s) => // @step:l3-fill
  new Vehicle(s.x, s.y, s.heading, true, factory.get('cng'))); // {{sameFactory}} // @step:build-use,l3-request,l3-hit,l3-place
[...rickshaws, ...cngs].forEach((v) => v.draw(map)); // {{sameDraw}} // @step:l3-draw
// {{withZero}}
`

export const ts: CodeSet = {
  main: { filename: 'rickshaw-map.ts', source: main },
  without: { filename: 'rickshaw-map-without-flyweight.ts', source: without },
  with: { filename: 'rickshaw-map-with-flyweight.ts', source: withPattern },
}

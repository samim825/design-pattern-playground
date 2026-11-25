import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Python: the flyweight is a frozen dataclass; Vehicle is a slots=True dataclass so each of the
// thousands of objects stays small.

const main = `
from dataclasses import dataclass
from typing import Callable


# {{flyweight}}
@dataclass(frozen=True)
class VehicleModel:  # @step:split
    sprite: Image  # {{sharedSprite}}
    hood_art: Image
    bell: Sound

    def draw(self, canvas: MapCanvas, x: int, y: int, heading: int) -> None:  # {{extrinsicIn}}
        canvas.blit(self.sprite, x, y, heading)  # @step:draw


# {{factory}}
class ModelFactory:
    def __init__(self) -> None:
        self._cache: dict[str, VehicleModel] = {}
        self._loaders: dict[str, Callable[[], VehicleModel]] = {}

    def register(self, kind: str, load: Callable[[], VehicleModel]) -> None:
        self._loaders[kind] = load

    def get(self, kind: str) -> VehicleModel:  # @step:request
        if kind not in self._cache:  # {{lookFirst}} # @step:request,hit
            self._cache[kind] = self._loaders[kind]()  # {{missCreate}} # @step:miss
        return self._cache[kind]  # {{hitReuse}} # @step:hit


# {{context}}
@dataclass(slots=True)
class Vehicle:  # @step:split
    x: int  # {{extrinsic}} # @step:place
    y: int
    heading: int
    is_free: bool
    model: VehicleModel  # {{sharedRef}} # @step:place

    def draw(self, canvas: MapCanvas) -> None:
        self.model.draw(canvas, self.x, self.y, self.heading)  # @step:draw


# {{usage}}
factory = ModelFactory()
factory.register("rickshaw", lambda: VehicleModel(
    load_image("rickshaw.png"), load_image("hood-art.png"), load_sound("bell.mp3")))  # @step:miss
rickshaws = [  # {{manyObjects}} # @step:fill
    Vehicle(s.x, s.y, s.heading, True, factory.get("rickshaw")) for s in farmgate.spots  # @step:request,place
]
for r in rickshaws:
    r.draw(canvas)  # @step:draw
`

const without = `
# {{withoutIntro}}
class Rickshaw:
    def __init__(self, x: int, y: int, heading: int) -> None:  # @step:l1-new
        self.sprite = load_image("rickshaw.png")  # {{loadsAgain}} # @step:l1-new,l1-copy
        self.hood_art = load_image("hood-art.png")  # {{ownCopy}} # @step:l1-new,l1-copy
        self.x, self.y, self.heading = x, y, heading

    def draw(self, canvas: MapCanvas) -> None:
        canvas.blit(self.sprite, self.x, self.y, self.heading)


class MapScreen:
    def __init__(self) -> None:
        self.rickshaws: list[Rickshaw] = []

    def show_area(self, area: Area, limit: int) -> None:  # {{pickLimit}} # @step:l1-start
        for s in area.spots[:limit]:  # @step:l1-fill
            self.rickshaws.append(Rickshaw(s.x, s.y, s.heading))  # {{perObject}} # @step:l1-new,l1-copy,l1-fill
        for r in self.rickshaws:
            r.draw(self.canvas)  # {{outOfMemory}} # @step:l1-result

# {{withoutMath}} # @step:l1-math
`

const withPattern = `
# {{withAdd}}
factory.register("cng", lambda: VehicleModel(  # {{newModel}} # @step:build-model,l3-miss
    load_image("cng.png"), load_image("green-cage.png"), load_sound("horn.mp3")))  # {{cngShared}} # @step:build-model,l3-miss

# {{withSame}}
# {{unchanged}}
rickshaws = [Vehicle(s.x, s.y, s.heading, True, factory.get("rickshaw"))
             for s in gulshan.rickshaw_spots]  # @step:l3-rickshaws
cngs = [  # @step:l3-fill
    Vehicle(s.x, s.y, s.heading, True, factory.get("cng")) for s in gulshan.cng_spots  # {{sameFactory}} # @step:build-use,l3-request,l3-hit,l3-place
]
for v in rickshaws + cngs:
    v.draw(canvas)  # {{sameDraw}} # @step:l3-draw
# {{withZero}}
`

export const python: CodeSet = {
  main: { filename: 'rickshaw_map.py', source: main },
  without: { filename: 'rickshaw_map_without_flyweight.py', source: without },
  with: { filename: 'rickshaw_map_with_flyweight.py', source: withPattern },
}

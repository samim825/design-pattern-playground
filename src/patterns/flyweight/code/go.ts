import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Go: the factory caches *VehicleModel pointers in a map, so every Vehicle holds a pointer to
// the one shared model instead of its own copy of the images.

const main = `
// {{flyweight}}
type VehicleModel struct { // @step:split
    Sprite  Image // {{sharedSprite}}
    HoodArt Image
    Bell    Sound
}

// {{extrinsicIn}}
func (m *VehicleModel) Draw(canvas *MapCanvas, x, y, heading int) {
    canvas.Blit(m.Sprite, x, y, heading) // @step:draw
}

// {{factory}}
type ModelFactory struct {
    cache   map[string]*VehicleModel
    loaders map[string]func() *VehicleModel
}

func NewModelFactory() *ModelFactory {
    return &ModelFactory{
        cache:   map[string]*VehicleModel{},
        loaders: map[string]func() *VehicleModel{},
    }
}

func (f *ModelFactory) Register(kind string, load func() *VehicleModel) { f.loaders[kind] = load }

func (f *ModelFactory) Get(kind string) *VehicleModel { // @step:request
    model, ok := f.cache[kind] // {{lookFirst}} // @step:request,hit
    if !ok {
        model = f.loaders[kind]() // {{missCreate}} // @step:miss
        f.cache[kind] = model // @step:miss
    }
    return model // {{hitReuse}} // @step:hit
}

// {{context}}
type Vehicle struct { // @step:split
    X, Y, Heading int // {{extrinsic}} // @step:place
    IsFree        bool
    Model         *VehicleModel // {{sharedRef}} // @step:place
}

func (v *Vehicle) Draw(canvas *MapCanvas) { v.Model.Draw(canvas, v.X, v.Y, v.Heading) } // @step:draw

// {{usage}}
factory := NewModelFactory()
factory.Register("rickshaw", func() *VehicleModel {
    return &VehicleModel{loadImage("rickshaw.png"), loadImage("hood-art.png"), loadSound("bell.mp3")} // @step:miss
})
var rickshaws []*Vehicle
for _, s := range farmgate.Spots { // {{manyObjects}} // @step:fill
    rickshaws = append(rickshaws, &Vehicle{s.X, s.Y, s.Heading, true, factory.Get("rickshaw")}) // @step:request,place
}
for _, r := range rickshaws {
    r.Draw(canvas) // @step:draw
}
`

const without = `
// {{withoutIntro}}
type Rickshaw struct {
    Sprite, HoodArt Image // {{ownCopy}}
    X, Y, Heading   int
}

func NewRickshaw(x, y, heading int) *Rickshaw { // @step:l1-new
    return &Rickshaw{
        Sprite:  loadImage("rickshaw.png"), // {{loadsAgain}} // @step:l1-new,l1-copy
        HoodArt: loadImage("hood-art.png"), // @step:l1-new,l1-copy
        X: x, Y: y, Heading: heading,
    }
}

func (r *Rickshaw) Draw(canvas *MapCanvas) { canvas.Blit(r.Sprite, r.X, r.Y, r.Heading) }

type MapScreen struct {
    canvas    *MapCanvas
    rickshaws []*Rickshaw
}

func (m *MapScreen) ShowArea(area Area, limit int) { // {{pickLimit}} // @step:l1-start
    for _, s := range area.Spots[:limit] { // @step:l1-fill
        m.rickshaws = append(m.rickshaws, NewRickshaw(s.X, s.Y, s.Heading)) // {{perObject}} // @step:l1-new,l1-copy,l1-fill
    }
    for _, r := range m.rickshaws {
        r.Draw(m.canvas) // {{outOfMemory}} // @step:l1-result
    }
}
// {{withoutMath}} // @step:l1-math
`

const withPattern = `
// {{withAdd}}
factory.Register("cng", func() *VehicleModel { // {{newModel}} // @step:build-model,l3-miss
    return &VehicleModel{loadImage("cng.png"), loadImage("green-cage.png"), loadSound("horn.mp3")} // {{cngShared}} // @step:build-model,l3-miss
})

// {{withSame}}
for _, s := range gulshan.RickshawSpots { // {{unchanged}}
    vehicles = append(vehicles, &Vehicle{s.X, s.Y, s.Heading, true, factory.Get("rickshaw")}) // @step:l3-rickshaws
}
for _, s := range gulshan.CngSpots { // @step:l3-fill
    vehicles = append(vehicles, &Vehicle{s.X, s.Y, s.Heading, true, factory.Get("cng")}) // {{sameFactory}} // @step:build-use,l3-request,l3-hit,l3-place
}
for _, v := range vehicles {
    v.Draw(canvas) // {{sameDraw}} // @step:l3-draw
}
// {{withZero}}
`

export const go: CodeSet = {
  main: { filename: 'rickshaw_map.go', source: main },
  without: { filename: 'rickshaw_map_without_flyweight.go', source: without },
  with: { filename: 'rickshaw_map_with_flyweight.go', source: withPattern },
}

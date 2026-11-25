import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// C#: the flyweight is a record; the factory caches models in a Dictionary and creates one
// with TryGetValue on the first request.

const main = `
// {{flyweight}}
public sealed record VehicleModel(Image Sprite, Image HoodArt, Sound Bell) // {{sharedSprite}} // @step:split
{
    // {{extrinsicIn}}
    public void Draw(MapCanvas map, int x, int y, int heading) =>
        map.Blit(Sprite, x, y, heading); // @step:draw
}

// {{factory}}
public sealed class ModelFactory
{
    private readonly Dictionary<string, VehicleModel> _cache = new();
    private readonly Dictionary<string, Func<VehicleModel>> _loaders = new();

    public void Register(string type, Func<VehicleModel> load) => _loaders[type] = load;

    public VehicleModel Get(string type) // @step:request
    {
        if (_cache.TryGetValue(type, out var model)) return model; // {{hitReuse}} // @step:request,hit
        model = _loaders[type](); // {{missCreate}} // @step:miss
        _cache[type] = model; // @step:miss
        return model;
    }
}

// {{context}}
public sealed class Vehicle(int x, int y, int heading, bool isFree, VehicleModel model) // {{extrinsic}} // @step:split,place
{
    private bool _isFree = isFree;
    private readonly VehicleModel _model = model; // {{sharedRef}} // @step:place

    public void Draw(MapCanvas map) => _model.Draw(map, x, y, heading); // @step:draw
}

// {{usage}}
var factory = new ModelFactory();
factory.Register("rickshaw", () =>
    new VehicleModel(LoadImage("rickshaw.png"), LoadImage("hood-art.png"), LoadSound("bell.mp3"))); // @step:miss
// {{manyObjects}}
var rickshaws = farmgate.Spots // @step:fill
    .Select(s => new Vehicle(s.X, s.Y, s.Heading, true, factory.Get("rickshaw"))) // @step:request,place
    .ToList();
rickshaws.ForEach(r => r.Draw(map)); // @step:draw
`

const without = `
// {{withoutIntro}}
public class Rickshaw(int x, int y, int heading) // @step:l1-new
{
    private readonly Image _sprite = LoadImage("rickshaw.png"); // {{ownCopy}} // @step:l1-new,l1-copy
    private readonly Image _hoodArt = LoadImage("hood-art.png"); // {{loadsAgain}} // @step:l1-new,l1-copy

    public void Draw(MapCanvas map) => map.Blit(_sprite, x, y, heading);
}

public class MapScreen
{
    private readonly List<Rickshaw> _rickshaws = new();

    public void ShowArea(Area area, int limit) // {{pickLimit}} // @step:l1-start
    {
        foreach (var s in area.Spots.Take(limit)) // @step:l1-fill
        {
            _rickshaws.Add(new Rickshaw(s.X, s.Y, s.Heading)); // {{perObject}} // @step:l1-new,l1-copy,l1-fill
        }
        _rickshaws.ForEach(r => r.Draw(map)); // {{outOfMemory}} // @step:l1-result
    }
}
// {{withoutMath}} // @step:l1-math
`

const withPattern = `
// {{withAdd}}
factory.Register("cng", () => // {{newModel}} // @step:build-model,l3-miss
    new VehicleModel(LoadImage("cng.png"), LoadImage("green-cage.png"), LoadSound("horn.mp3"))); // {{cngShared}} // @step:build-model,l3-miss

// {{withSame}}
// {{unchanged}}
var rickshaws = gulshan.RickshawSpots
    .Select(s => new Vehicle(s.X, s.Y, s.Heading, true, factory.Get("rickshaw"))); // @step:l3-rickshaws
var cngs = gulshan.CngSpots // @step:l3-fill
    .Select(s => new Vehicle(s.X, s.Y, s.Heading, true, factory.Get("cng"))); // {{sameFactory}} // @step:build-use,l3-request,l3-hit,l3-place
foreach (var v in rickshaws.Concat(cngs)) v.Draw(map); // {{sameDraw}} // @step:l3-draw
// {{withZero}}
`

export const csharp: CodeSet = {
  main: { filename: 'RickshawMap.cs', source: main },
  without: { filename: 'RickshawMapWithoutFlyweight.cs', source: without },
  with: { filename: 'RickshawMapWithFlyweight.cs', source: withPattern },
}

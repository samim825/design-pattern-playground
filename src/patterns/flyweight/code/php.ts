import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// PHP: objects are passed by handle, so every Vehicle that gets the cached VehicleModel points
// at the same instance; the factory caches it in an array keyed by type.

const main = `
<?php
// {{flyweight}}
final readonly class VehicleModel // @step:split
{
    public function __construct(
        public Image $sprite, // {{sharedSprite}}
        public Image $hoodArt,
        public Sound $bell,
    ) {}

    public function draw(MapCanvas $map, int $x, int $y, int $heading): void // {{extrinsicIn}}
    {
        $map->blit($this->sprite, $x, $y, $heading); // @step:draw
    }
}

// {{factory}}
final class ModelFactory
{
    private array $cache = [];
    private array $loaders = [];

    public function register(string $type, Closure $load): void
    {
        $this->loaders[$type] = $load;
    }

    public function get(string $type): VehicleModel // {{lookFirst}} // @step:request
    {
        $this->cache[$type] ??= ($this->loaders[$type])(); // {{missCreate}} // @step:request,miss,hit
        return $this->cache[$type]; // {{hitReuse}} // @step:hit
    }
}

// {{context}}
final class Vehicle // @step:split
{
    public function __construct(
        private int $x, // {{extrinsic}} // @step:place
        private int $y,
        private int $heading,
        private bool $isFree,
        private readonly VehicleModel $model, // {{sharedRef}} // @step:place
    ) {}

    public function draw(MapCanvas $map): void
    {
        $this->model->draw($map, $this->x, $this->y, $this->heading); // @step:draw
    }
}

// {{usage}}
$factory = new ModelFactory();
$factory->register('rickshaw', fn() =>
    new VehicleModel(loadImage('rickshaw.png'), loadImage('hood-art.png'), loadSound('bell.mp3'))); // @step:miss
$rickshaws = array_map( // {{manyObjects}} // @step:fill
    fn(Spot $s) => new Vehicle($s->x, $s->y, $s->heading, true, $factory->get('rickshaw')), // @step:request,place
    $farmgate->spots,
);
foreach ($rickshaws as $r) $r->draw($map); // @step:draw
`

const without = `
<?php
// {{withoutIntro}}
class Rickshaw
{
    private Image $sprite; // {{ownCopy}}
    private Image $hoodArt;

    public function __construct(private int $x, private int $y, private int $heading) // @step:l1-new
    {
        $this->sprite = loadImage('rickshaw.png'); // {{loadsAgain}} // @step:l1-new,l1-copy
        $this->hoodArt = loadImage('hood-art.png'); // @step:l1-new,l1-copy
    }

    public function draw(MapCanvas $map): void { $map->blit($this->sprite, $this->x, $this->y, $this->heading); }
}

class MapScreen
{
    private array $rickshaws = [];

    public function showArea(Area $area, int $limit): void // {{pickLimit}} // @step:l1-start
    {
        foreach (array_slice($area->spots, 0, $limit) as $s) { // @step:l1-fill
            $this->rickshaws[] = new Rickshaw($s->x, $s->y, $s->heading); // {{perObject}} // @step:l1-new,l1-copy,l1-fill
        }
        foreach ($this->rickshaws as $r) $r->draw($this->map); // {{outOfMemory}} // @step:l1-result
    }
}
// {{withoutMath}} // @step:l1-math
`

const withPattern = `
<?php
// {{withAdd}}
$factory->register('cng', fn() => // {{newModel}} // @step:build-model,l3-miss
    new VehicleModel(loadImage('cng.png'), loadImage('green-cage.png'), loadSound('horn.mp3'))); // {{cngShared}} // @step:build-model,l3-miss

// {{withSame}}
foreach ($gulshan->rickshawSpots as $s) { // {{unchanged}}
    $vehicles[] = new Vehicle($s->x, $s->y, $s->heading, true, $factory->get('rickshaw')); // @step:l3-rickshaws
}
foreach ($gulshan->cngSpots as $s) { // @step:l3-fill
    $vehicles[] = new Vehicle($s->x, $s->y, $s->heading, true, $factory->get('cng')); // {{sameFactory}} // @step:build-use,l3-request,l3-hit,l3-place
}
foreach ($vehicles as $v) $v->draw($map); // {{sameDraw}} // @step:l3-draw
// {{withZero}}
`

export const php: CodeSet = {
  main: { filename: 'RickshawMap.php', source: main },
  without: { filename: 'RickshawMapWithoutFlyweight.php', source: without },
  with: { filename: 'RickshawMapWithFlyweight.php', source: withPattern },
}

import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// PHP snippets start with <?php so the highlighter reads them as PHP, not HTML.

const main = `
<?php

// {{abstractProducts}}
abstract class Dish { public string $name; public int $price; }
abstract class MainDish extends Dish {}
abstract class Side extends Dish {}
abstract class Dessert extends Dish {}

// {{concreteProducts}}
class Kacchi extends MainDish { public string $name = 'Kacchi biryani'; public int $price = 320; }
class Borhani extends Side { public string $name = 'Borhani'; public int $price = 60; }
class Firni extends Dessert { public string $name = 'Firni'; public int $price = 70; }
class FriedRice extends MainDish { public string $name = 'Chicken fried rice'; public int $price = 300; }
class CornSoup extends Side { public string $name = 'Corn soup'; public int $price = 140; }
class Pudding extends Dessert { public string $name = 'Custard pudding'; public int $price = 80; }

// {{abstractFactory}}
interface Kitchen
{
    public function createMain(): MainDish;
    public function createSide(): Side;
    public function createDessert(): Dessert;
}

// {{concreteFactories}}
class DeshiKitchen implements Kitchen
{
    public function createMain(): MainDish { return new Kacchi(); } // @step:deshi-main
    public function createSide(): Side { return new Borhani(); } // @step:deshi-side
    public function createDessert(): Dessert { return new Firni(); } // @step:deshi-dessert
}

class ChineseKitchen implements Kitchen
{
    public function createMain(): MainDish { return new FriedRice(); } // @step:chinese-main
    public function createSide(): Side { return new CornSoup(); } // @step:chinese-side
    public function createDessert(): Dessert { return new Pudding(); } // @step:chinese-dessert
}

// {{client}}
function serveCombo(Kitchen $kitchen): array
{
    $main = $kitchen->createMain(); // {{noNames}} // @step:deshi-main,chinese-main
    $side = $kitchen->createSide(); // @step:deshi-side,chinese-side
    $dessert = $kitchen->createDessert(); // @step:deshi-dessert,chinese-dessert
    return [$main, $side, $dessert]; // @step:serve
}

// {{usage}}
$kitchen = $kitchens[$selectedCuisine]; // @step:pick-kitchen
$tray = serveCombo($kitchen); // @step:order,done
`

const without = `
<?php

// {{withoutIntro}}
function serveCombo(string $main, string $side, string $dessert): array // @step:l1-start
{
    $mainDish = createDish($main); // @step:l1-main
    $sideDish = createDish($side); // @step:l1-side
    $dessertDish = createDish($dessert); // @step:l1-dessert
    return [$mainDish, $sideDish, $dessertDish]; // @step:l1-result
}

function createDish(string $name): Dish
{
    return match ($name) {
        'kacchi' => new Kacchi(),
        'borhani' => new Borhani(),
        'firni' => new Firni(),
        'fried-rice' => new FriedRice(),
        'corn-soup' => new CornSoup(),
        'pudding' => new Pudding(),
        default => throw new InvalidArgumentException('Unknown dish: ' . $name),
    };
}

// {{withoutMix}}
serveCombo('kacchi', 'corn-soup', 'firni'); // @step:l1-order
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
<?php

// {{withAdd}}
class PadThai extends MainDish { public string $name = 'Pad thai'; public int $price = 380; } // @step:build-kitchen
class TomYum extends Side { public string $name = 'Tom yum soup'; public int $price = 180; } // @step:build-kitchen
class MangoStickyRice extends Dessert { public string $name = 'Mango sticky rice'; public int $price = 90; } // @step:build-kitchen

class ThaiKitchen implements Kitchen // @step:build-kitchen
{
    public function createMain(): MainDish { return new PadThai(); } // @step:thai-main
    public function createSide(): Side { return new TomYum(); } // @step:thai-side
    public function createDessert(): Dessert { return new MangoStickyRice(); } // @step:thai-dessert
}

// {{withSame}}
$tray = serveCombo(new ThaiKitchen()); // @step:thai-order,thai-done
`

export const php: CodeSet = {
  main: { filename: 'Restaurant.php', source: main },
  without: { filename: 'RestaurantWithoutAbstractFactory.php', source: without },
  with: { filename: 'RestaurantWithAbstractFactory.php', source: withPattern },
}

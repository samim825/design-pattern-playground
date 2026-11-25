import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
<?php
// {{component}}
interface Snack
{
    public function cost(): int;
    public function describe(): string;
}

// {{concrete}}
final readonly class Fuchka implements Snack
{
    public function cost(): int { return 60; } // {{basePrice}} // @step:core
    public function describe(): string { return 'Fuchka'; } // @step:describe
}

// {{decorator}}
abstract readonly class Topping implements Snack
{
    public function __construct(protected Snack $inner) {} // {{wrapsAny}} // @step:wrap-egg,wrap-chanachur,wrap-spicy
}

// {{concreteDecorators}}
final readonly class Egg extends Topping
{
    public function cost(): int { return $this->inner->cost() + 20; } // {{passIn}} // @step:in-egg,out-egg
    public function describe(): string { return $this->inner->describe() . ' + egg'; } // @step:describe
}

final readonly class Chanachur extends Topping
{
    public function cost(): int { return $this->inner->cost() + 10; } // @step:in-chanachur,out-chanachur
    public function describe(): string { return $this->inner->describe() . ' + chanachur'; } // @step:describe
}

final readonly class ExtraSpicy extends Topping
{
    public function cost(): int { return $this->inner->cost() + 5; } // @step:in-spicy,out-spicy
    public function describe(): string { return $this->inner->describe() . ' + extra spicy'; } // @step:describe
}

// {{usage}}
$plate = new Fuchka(); // @step:base
$plate = new Egg($plate); // {{wrapLayer}} // @step:wrap-egg
$plate = new Chanachur($plate); // @step:wrap-chanachur
$plate = new ExtraSpicy($plate); // @step:wrap-spicy

$total = $plate->cost(); // {{oneCall}} // @step:call,done
$receipt = $plate->describe(); // {{sameTrip}} // @step:describe
`

const without = `
<?php
// {{withoutIntro}}
class Fuchka
{
    public function cost(): int { return 60; }
    public function describe(): string { return 'Fuchka'; }
}

class FuchkaWithEgg extends Fuchka
{
    public function cost(): int { return 80; } // {{hardcoded}} // @step:l1-cost
    public function describe(): string { return 'Fuchka + egg'; } // @step:l1-describe
}

class FuchkaWithSpicy extends Fuchka
{
    public function cost(): int { return 65; } // @step:l1-cost
    public function describe(): string { return 'Fuchka + extra spicy'; } // @step:l1-describe
}

// {{withoutCopy}}
class FuchkaWithEggAndSpicy extends Fuchka // @step:l1-write
{
    public function cost(): int { return 85; } // {{copyPrice}} // @step:l1-cost
    public function describe(): string { return 'Fuchka + egg + extra spicy'; } // @step:l1-describe
}

// {{withoutPick}}
$plate = new FuchkaWithEggAndSpicy(); // @step:l1-pick
serve($karim, $plate->describe(), $plate->cost()); // @step:l1-serve,l1-result
// {{withoutTodo}} // @step:l1-count
`

const withPattern = `
<?php
// {{withAdd}}
final readonly class TokDoi extends Topping // @step:build-class
{
    public function cost(): int { return $this->inner->cost() + 30; } // {{onlyNew}} // @step:build-cost,in-tokdoi,out-tokdoi
    public function describe(): string { return $this->inner->describe() . ' + tok-doi'; } // @step:build-cost,describe-new
}

// {{withSame}}
$plate = new Fuchka(); // @step:base-new
$plate = new TokDoi($plate); // {{justWrap}} // @step:wrap-tokdoi
$plate = new Chanachur($plate); // {{oldStillWork}} // @step:wrap-old

$total = $plate->cost(); // {{costUnchanged}} // @step:call-new,inner-old,done-new
$receipt = $plate->describe(); // @step:describe-new

// {{withZero}}
`

export const php: CodeSet = {
  main: { filename: 'Fuchka.php', source: main },
  without: { filename: 'FuchkaWithoutDecorator.php', source: without },
  with: { filename: 'FuchkaWithDecorator.php', source: withPattern },
}

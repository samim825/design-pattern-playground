import type { CodeSet } from '@/types/pattern'

/*
 * Conventions (see CLAUDE.md):
 *   // {{key}}        → translated comment from content.<lang>.ts → codeComments[key]
 *   // @step:a,b      → this line lights up while visual step a or b runs (stripped on display)
 */

const main = `
// {{component}}
interface Snack {
  cost(): number;
  describe(): string;
}

// {{concrete}}
class Fuchka implements Snack {
  cost() { return 60; } // {{basePrice}} // @step:core
  describe() { return 'Fuchka'; } // @step:describe
}

// {{decorator}}
abstract class Topping implements Snack {
  constructor(protected readonly inner: Snack) {} // {{wrapsAny}} // @step:wrap-egg,wrap-chanachur,wrap-spicy
  abstract cost(): number;
  abstract describe(): string;
}

// {{concreteDecorators}}
class Egg extends Topping {
  cost() { return this.inner.cost() + 20; } // {{passIn}} // @step:in-egg,out-egg
  describe() { return this.inner.describe() + ' + egg'; } // @step:describe
}

class Chanachur extends Topping {
  cost() { return this.inner.cost() + 10; } // @step:in-chanachur,out-chanachur
  describe() { return this.inner.describe() + ' + chanachur'; } // @step:describe
}

class ExtraSpicy extends Topping {
  cost() { return this.inner.cost() + 5; } // @step:in-spicy,out-spicy
  describe() { return this.inner.describe() + ' + extra spicy'; } // @step:describe
}

// {{usage}}
let plate: Snack = new Fuchka(); // @step:base
plate = new Egg(plate); // {{wrapLayer}} // @step:wrap-egg
plate = new Chanachur(plate); // @step:wrap-chanachur
plate = new ExtraSpicy(plate); // @step:wrap-spicy

const total = plate.cost(); // {{oneCall}} // @step:call,done
const receipt = plate.describe(); // {{sameTrip}} // @step:describe
`

const without = `
// {{withoutIntro}}
class Fuchka {
  cost() { return 60; }
  describe() { return 'Fuchka'; }
}

class FuchkaWithEgg extends Fuchka {
  cost() { return 80; } // {{hardcoded}} // @step:l1-cost
  describe() { return 'Fuchka + egg'; } // @step:l1-describe
}

class FuchkaWithSpicy extends Fuchka {
  cost() { return 65; } // @step:l1-cost
  describe() { return 'Fuchka + extra spicy'; } // @step:l1-describe
}

// {{withoutCopy}}
class FuchkaWithEggAndSpicy extends Fuchka { // @step:l1-write
  cost() { return 85; } // {{copyPrice}} // @step:l1-cost
  describe() { return 'Fuchka + egg + extra spicy'; } // @step:l1-describe
}

// {{withoutPick}}
const plate = new FuchkaWithEggAndSpicy(); // @step:l1-pick
serve(karim, plate.describe(), plate.cost()); // @step:l1-serve,l1-result
// {{withoutTodo}} // @step:l1-count
`

const withPattern = `
// {{withAdd}}
class TokDoi extends Topping { // @step:build-class
  cost() { return this.inner.cost() + 30; } // {{onlyNew}} // @step:build-cost,in-tokdoi,out-tokdoi
  describe() { return this.inner.describe() + ' + tok-doi'; } // @step:build-cost,describe-new
}

// {{withSame}}
let plate: Snack = new Fuchka(); // @step:base-new
plate = new TokDoi(plate); // {{justWrap}} // @step:wrap-tokdoi
plate = new Chanachur(plate); // {{oldStillWork}} // @step:wrap-old

const total = plate.cost(); // {{costUnchanged}} // @step:call-new,inner-old,done-new
const receipt = plate.describe(); // @step:describe-new

// {{withZero}}
`

export const ts: CodeSet = {
  main: { filename: 'fuchka.ts', source: main },
  without: { filename: 'fuchka-without-decorator.ts', source: without },
  with: { filename: 'fuchka-with-decorator.ts', source: withPattern },
}

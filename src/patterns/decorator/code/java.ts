import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{component}}
interface Snack {
    int cost();
    String describe();
}

// {{concrete}}
final class Fuchka implements Snack {
    @Override public int cost() { return 60; } // {{basePrice}} // @step:core
    @Override public String describe() { return "Fuchka"; } // @step:describe
}

// {{decorator}}
abstract class Topping implements Snack {
    protected final Snack inner;
    Topping(Snack inner) { this.inner = inner; } // {{wrapsAny}} // @step:wrap-egg,wrap-chanachur,wrap-spicy
}

// {{concreteDecorators}}
final class Egg extends Topping {
    Egg(Snack inner) { super(inner); }
    @Override public int cost() { return inner.cost() + 20; } // {{passIn}} // @step:in-egg,out-egg
    @Override public String describe() { return inner.describe() + " + egg"; } // @step:describe
}

final class Chanachur extends Topping {
    Chanachur(Snack inner) { super(inner); }
    @Override public int cost() { return inner.cost() + 10; } // @step:in-chanachur,out-chanachur
    @Override public String describe() { return inner.describe() + " + chanachur"; } // @step:describe
}

final class ExtraSpicy extends Topping {
    ExtraSpicy(Snack inner) { super(inner); }
    @Override public int cost() { return inner.cost() + 5; } // @step:in-spicy,out-spicy
    @Override public String describe() { return inner.describe() + " + extra spicy"; } // @step:describe
}

// {{usage}}
Snack plate = new Fuchka(); // @step:base
plate = new Egg(plate); // {{wrapLayer}} // @step:wrap-egg
plate = new Chanachur(plate); // @step:wrap-chanachur
plate = new ExtraSpicy(plate); // @step:wrap-spicy

int total = plate.cost(); // {{oneCall}} // @step:call,done
String receipt = plate.describe(); // {{sameTrip}} // @step:describe
`

const without = `
// {{withoutIntro}}
class Fuchka {
    int cost() { return 60; }
    String describe() { return "Fuchka"; }
}

class FuchkaWithEgg extends Fuchka {
    @Override int cost() { return 80; } // {{hardcoded}} // @step:l1-cost
    @Override String describe() { return "Fuchka + egg"; } // @step:l1-describe
}

class FuchkaWithSpicy extends Fuchka {
    @Override int cost() { return 65; } // @step:l1-cost
    @Override String describe() { return "Fuchka + extra spicy"; } // @step:l1-describe
}

// {{withoutCopy}}
class FuchkaWithEggAndSpicy extends Fuchka { // @step:l1-write
    @Override int cost() { return 85; } // {{copyPrice}} // @step:l1-cost
    @Override String describe() { return "Fuchka + egg + extra spicy"; } // @step:l1-describe
}

// {{withoutPick}}
Fuchka plate = new FuchkaWithEggAndSpicy(); // @step:l1-pick
serve(karim, plate.describe(), plate.cost()); // @step:l1-serve,l1-result
// {{withoutTodo}} // @step:l1-count
`

const withPattern = `
// {{withAdd}}
final class TokDoi extends Topping { // @step:build-class
    TokDoi(Snack inner) { super(inner); }
    @Override public int cost() { return inner.cost() + 30; } // {{onlyNew}} // @step:build-cost,in-tokdoi,out-tokdoi
    @Override public String describe() { return inner.describe() + " + tok-doi"; } // @step:build-cost,describe-new
}

// {{withSame}}
Snack plate = new Fuchka(); // @step:base-new
plate = new TokDoi(plate); // {{justWrap}} // @step:wrap-tokdoi
plate = new Chanachur(plate); // {{oldStillWork}} // @step:wrap-old

int total = plate.cost(); // {{costUnchanged}} // @step:call-new,inner-old,done-new
String receipt = plate.describe(); // @step:describe-new

// {{withZero}}
`

export const java: CodeSet = {
  main: { filename: 'Fuchka.java', source: main },
  without: { filename: 'FuchkaWithoutDecorator.java', source: without },
  with: { filename: 'FuchkaWithDecorator.java', source: withPattern },
}

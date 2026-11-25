import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Rust has no inheritance or abstract base class: each topping is a struct that owns the wrapped
// snack as a Box<dyn Snack> and implements the same Snack trait itself.

const main = `
// {{component}}
pub trait Snack {
    fn cost(&self) -> u32;
    fn describe(&self) -> String;
}

// {{concrete}}
pub struct Fuchka;
impl Snack for Fuchka {
    fn cost(&self) -> u32 { 60 } // {{basePrice}} // @step:core
    fn describe(&self) -> String { "Fuchka".to_string() } // @step:describe
}

// {{decorator}}
pub struct Egg { pub inner: Box<dyn Snack> } // {{wrapsAny}} // @step:wrap-egg
pub struct Chanachur { pub inner: Box<dyn Snack> } // @step:wrap-chanachur
pub struct ExtraSpicy { pub inner: Box<dyn Snack> } // @step:wrap-spicy

// {{concreteDecorators}}
impl Snack for Egg {
    fn cost(&self) -> u32 { self.inner.cost() + 20 } // {{passIn}} // @step:in-egg,out-egg
    fn describe(&self) -> String { self.inner.describe() + " + egg" } // @step:describe
}
impl Snack for Chanachur {
    fn cost(&self) -> u32 { self.inner.cost() + 10 } // @step:in-chanachur,out-chanachur
    fn describe(&self) -> String { self.inner.describe() + " + chanachur" } // @step:describe
}
impl Snack for ExtraSpicy {
    fn cost(&self) -> u32 { self.inner.cost() + 5 } // @step:in-spicy,out-spicy
    fn describe(&self) -> String { self.inner.describe() + " + extra spicy" } // @step:describe
}

// {{usage}}
let mut plate: Box<dyn Snack> = Box::new(Fuchka); // @step:base
plate = Box::new(Egg { inner: plate }); // {{wrapLayer}} // @step:wrap-egg
plate = Box::new(Chanachur { inner: plate }); // @step:wrap-chanachur
plate = Box::new(ExtraSpicy { inner: plate }); // @step:wrap-spicy

let total = plate.cost(); // {{oneCall}} // @step:call,done
let receipt = plate.describe(); // {{sameTrip}} // @step:describe
`

const without = `
// {{withoutIntro}}
pub struct Fuchka;
impl Fuchka {
    pub fn cost(&self) -> u32 { 60 }
    pub fn describe(&self) -> &str { "Fuchka" }
}

pub struct FuchkaWithEgg;
impl FuchkaWithEgg {
    pub fn cost(&self) -> u32 { 80 } // {{hardcoded}} // @step:l1-cost
    pub fn describe(&self) -> &str { "Fuchka + egg" } // @step:l1-describe
}

pub struct FuchkaWithSpicy;
impl FuchkaWithSpicy {
    pub fn cost(&self) -> u32 { 65 } // @step:l1-cost
    pub fn describe(&self) -> &str { "Fuchka + extra spicy" } // @step:l1-describe
}

// {{withoutCopy}}
pub struct FuchkaWithEggAndSpicy; // @step:l1-write
impl FuchkaWithEggAndSpicy {
    pub fn cost(&self) -> u32 { 85 } // {{copyPrice}} // @step:l1-cost
    pub fn describe(&self) -> &str { "Fuchka + egg + extra spicy" } // @step:l1-describe
}

// {{withoutPick}}
let plate = FuchkaWithEggAndSpicy; // @step:l1-pick
serve(&karim, plate.describe(), plate.cost()); // @step:l1-serve,l1-result
// {{withoutTodo}} // @step:l1-count
`

const withPattern = `
// {{withAdd}}
pub struct TokDoi { pub inner: Box<dyn Snack> } // @step:build-class
impl Snack for TokDoi {
    fn cost(&self) -> u32 { self.inner.cost() + 30 } // {{onlyNew}} // @step:build-cost,in-tokdoi,out-tokdoi
    fn describe(&self) -> String { self.inner.describe() + " + tok-doi" } // @step:build-cost,describe-new
}

// {{withSame}}
let mut plate: Box<dyn Snack> = Box::new(Fuchka); // @step:base-new
plate = Box::new(TokDoi { inner: plate }); // {{justWrap}} // @step:wrap-tokdoi
plate = Box::new(Chanachur { inner: plate }); // {{oldStillWork}} // @step:wrap-old

let total = plate.cost(); // {{costUnchanged}} // @step:call-new,inner-old,done-new
let receipt = plate.describe(); // @step:describe-new

// {{withZero}}
`

export const rust: CodeSet = {
  main: { filename: 'fuchka.rs', source: main },
  without: { filename: 'fuchka_without_decorator.rs', source: without },
  with: { filename: 'fuchka_with_decorator.rs', source: withPattern },
}

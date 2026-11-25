import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Swift prefers protocols over base classes: Topping is a protocol that refines Snack and
// requires an inner snack, and every topping is a small struct that conforms to it.

const main = `
// {{component}}
protocol Snack {
    func cost() -> Int
    func describe() -> String
}

// {{concrete}}
struct Fuchka: Snack {
    func cost() -> Int { 60 } // {{basePrice}} // @step:core
    func describe() -> String { "Fuchka" } // @step:describe
}

// {{decorator}}
protocol Topping: Snack {
    var inner: any Snack { get } // {{wrapsAny}} // @step:wrap-egg,wrap-chanachur,wrap-spicy
}

// {{concreteDecorators}}
struct Egg: Topping {
    let inner: any Snack
    func cost() -> Int { inner.cost() + 20 } // {{passIn}} // @step:in-egg,out-egg
    func describe() -> String { inner.describe() + " + egg" } // @step:describe
}

struct Chanachur: Topping {
    let inner: any Snack
    func cost() -> Int { inner.cost() + 10 } // @step:in-chanachur,out-chanachur
    func describe() -> String { inner.describe() + " + chanachur" } // @step:describe
}

struct ExtraSpicy: Topping {
    let inner: any Snack
    func cost() -> Int { inner.cost() + 5 } // @step:in-spicy,out-spicy
    func describe() -> String { inner.describe() + " + extra spicy" } // @step:describe
}

// {{usage}}
var plate: any Snack = Fuchka() // @step:base
plate = Egg(inner: plate) // {{wrapLayer}} // @step:wrap-egg
plate = Chanachur(inner: plate) // @step:wrap-chanachur
plate = ExtraSpicy(inner: plate) // @step:wrap-spicy

let total = plate.cost() // {{oneCall}} // @step:call,done
let receipt = plate.describe() // {{sameTrip}} // @step:describe
`

const without = `
// {{withoutIntro}}
class Fuchka {
    func cost() -> Int { 60 }
    func describe() -> String { "Fuchka" }
}

class FuchkaWithEgg: Fuchka {
    override func cost() -> Int { 80 } // {{hardcoded}} // @step:l1-cost
    override func describe() -> String { "Fuchka + egg" } // @step:l1-describe
}

class FuchkaWithSpicy: Fuchka {
    override func cost() -> Int { 65 } // @step:l1-cost
    override func describe() -> String { "Fuchka + extra spicy" } // @step:l1-describe
}

// {{withoutCopy}}
class FuchkaWithEggAndSpicy: Fuchka { // @step:l1-write
    override func cost() -> Int { 85 } // {{copyPrice}} // @step:l1-cost
    override func describe() -> String { "Fuchka + egg + extra spicy" } // @step:l1-describe
}

// {{withoutPick}}
let plate = FuchkaWithEggAndSpicy() // @step:l1-pick
serve(karim, plate.describe(), plate.cost()) // @step:l1-serve,l1-result
// {{withoutTodo}} // @step:l1-count
`

const withPattern = `
// {{withAdd}}
struct TokDoi: Topping { // @step:build-class
    let inner: any Snack
    func cost() -> Int { inner.cost() + 30 } // {{onlyNew}} // @step:build-cost,in-tokdoi,out-tokdoi
    func describe() -> String { inner.describe() + " + tok-doi" } // @step:build-cost,describe-new
}

// {{withSame}}
var plate: any Snack = Fuchka() // @step:base-new
plate = TokDoi(inner: plate) // {{justWrap}} // @step:wrap-tokdoi
plate = Chanachur(inner: plate) // {{oldStillWork}} // @step:wrap-old

let total = plate.cost() // {{costUnchanged}} // @step:call-new,inner-old,done-new
let receipt = plate.describe() // @step:describe-new

// {{withZero}}
`

export const swift: CodeSet = {
  main: { filename: 'Fuchka.swift', source: main },
  without: { filename: 'FuchkaWithoutDecorator.swift', source: without },
  with: { filename: 'FuchkaWithDecorator.swift', source: withPattern },
}

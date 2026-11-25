import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Go has no inheritance: Topping is a struct holding the wrapped Snack, each topping embeds it
// (composition), and any type with Cost and Describe satisfies Snack implicitly.

const main = `
// {{component}}
type Snack interface {
    Cost() int
    Describe() string
}

// {{concrete}}
type Fuchka struct{}

func (Fuchka) Cost() int        { return 60 } // {{basePrice}} // @step:core
func (Fuchka) Describe() string { return "Fuchka" } // @step:describe

// {{decorator}}
type Topping struct {
    inner Snack // {{wrapsAny}} // @step:wrap-egg,wrap-chanachur,wrap-spicy
}

// {{concreteDecorators}}
type Egg struct{ Topping }
type Chanachur struct{ Topping }
type ExtraSpicy struct{ Topping }

func (t Egg) Cost() int        { return t.inner.Cost() + 20 } // {{passIn}} // @step:in-egg,out-egg
func (t Egg) Describe() string { return t.inner.Describe() + " + egg" } // @step:describe

func (t Chanachur) Cost() int        { return t.inner.Cost() + 10 } // @step:in-chanachur,out-chanachur
func (t Chanachur) Describe() string { return t.inner.Describe() + " + chanachur" } // @step:describe

func (t ExtraSpicy) Cost() int        { return t.inner.Cost() + 5 } // @step:in-spicy,out-spicy
func (t ExtraSpicy) Describe() string { return t.inner.Describe() + " + extra spicy" } // @step:describe

// {{usage}}
var plate Snack = Fuchka{} // @step:base
plate = Egg{Topping{plate}} // {{wrapLayer}} // @step:wrap-egg
plate = Chanachur{Topping{plate}} // @step:wrap-chanachur
plate = ExtraSpicy{Topping{plate}} // @step:wrap-spicy

total := plate.Cost() // {{oneCall}} // @step:call,done
receipt := plate.Describe() // {{sameTrip}} // @step:describe
`

const without = `
// {{withoutIntro}}
type Fuchka struct{}

func (Fuchka) Cost() int        { return 60 }
func (Fuchka) Describe() string { return "Fuchka" }

type FuchkaWithEgg struct{}

func (FuchkaWithEgg) Cost() int        { return 80 } // {{hardcoded}} // @step:l1-cost
func (FuchkaWithEgg) Describe() string { return "Fuchka + egg" } // @step:l1-describe

type FuchkaWithSpicy struct{}

func (FuchkaWithSpicy) Cost() int        { return 65 } // @step:l1-cost
func (FuchkaWithSpicy) Describe() string { return "Fuchka + extra spicy" } // @step:l1-describe

// {{withoutCopy}}
type FuchkaWithEggAndSpicy struct{} // @step:l1-write

func (FuchkaWithEggAndSpicy) Cost() int        { return 85 } // {{copyPrice}} // @step:l1-cost
func (FuchkaWithEggAndSpicy) Describe() string { return "Fuchka + egg + extra spicy" } // @step:l1-describe

// {{withoutPick}}
plate := FuchkaWithEggAndSpicy{} // @step:l1-pick
serve(karim, plate.Describe(), plate.Cost()) // @step:l1-serve,l1-result
// {{withoutTodo}} // @step:l1-count
`

const withPattern = `
// {{withAdd}}
type TokDoi struct{ Topping } // @step:build-class

func (t TokDoi) Cost() int        { return t.inner.Cost() + 30 } // {{onlyNew}} // @step:build-cost,in-tokdoi,out-tokdoi
func (t TokDoi) Describe() string { return t.inner.Describe() + " + tok-doi" } // @step:build-cost,describe-new

// {{withSame}}
var plate Snack = Fuchka{} // @step:base-new
plate = TokDoi{Topping{plate}} // {{justWrap}} // @step:wrap-tokdoi
plate = Chanachur{Topping{plate}} // {{oldStillWork}} // @step:wrap-old

total := plate.Cost() // {{costUnchanged}} // @step:call-new,inner-old,done-new
receipt := plate.Describe() // @step:describe-new

// {{withZero}}
`

export const go: CodeSet = {
  main: { filename: 'fuchka.go', source: main },
  without: { filename: 'fuchka_without_decorator.go', source: without },
  with: { filename: 'fuchka_with_decorator.go', source: withPattern },
}

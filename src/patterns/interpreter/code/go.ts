import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Go: there is no "implements"; any struct with an Interpret(Cart) bool method is a Rule automatically.

const main = `
// {{context}}
type Cart struct {
    Total    int
    Category string
}

// {{abstract}}
type Rule interface {
    Interpret(cart Cart) bool
}

// {{terminal}}
type TotalAbove struct{ Amount int }

func (t TotalAbove) Interpret(cart Cart) bool {
    return cart.Total > t.Amount // {{readsTotal}} // @step:total
}

type CategoryIs struct{ Name string }

func (c CategoryIs) Interpret(cart Cart) bool {
    return cart.Category == c.Name // {{readsCategory}} // @step:category
}

// {{nonterminal}}
type And struct{ Left, Right Rule } // {{holdsRules}}

func (a And) Interpret(cart Cart) bool {
    return a.Left.Interpret(cart) && // {{asksLeft}} // @step:and-left
        a.Right.Interpret(cart) // {{shortCircuit}} // @step:and-combine
}

// {{client}}
func Checkout(cart Cart, rule Rule, percent int) int {
    ok := rule.Interpret(cart) // {{oneCall}} // @step:interpret
    if !ok {
        return cart.Total // @step:result
    }
    return cart.Total * (100 - percent) / 100 // {{payOrNot}} // @step:result
}

func main() {
    rule := And{CategoryIs{"saree"}, TotalAbove{3000}} // {{buildTree}} // @step:build
    Checkout(Cart{3450, "saree"}, rule, 10)
}
`

const without = `
// {{withoutIntro}}
func Checkout(cart Cart) int { // {{everyRuleHere}} // @step:l1-rule,l1-cart
    percent := 0 // @step:l1-none
    switch {
    case cart.Total > 5000: // {{orderMatters}} // @step:l1-big
        percent = 15
    case cart.Category == "saree" && cart.Total > 3000: // @step:l1-saree
        percent = 10
    case cart.Category == "panjabi" && cart.Total > 2000: // @step:l1-panjabi
        percent = 5
    }
    return cart.Total * (100 - percent) / 100 // @step:l1-pay
}

// {{redeploy}}
deploy(billingApp) // @step:l1-deploy
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
type Or struct{ Left, Right Rule } // {{sameInterface}} // @step:build-class

func (o Or) Interpret(cart Cart) bool {
    return o.Left.Interpret(cart) || // {{recursive}} // @step:build-recursive,or-left
        o.Right.Interpret(cart) // {{orShort}} // @step:or-combine
}

// {{othersSame}}
type And struct{ Left, Right Rule } /* … */ // @step:and-left,and-combine
type TotalAbove struct{ Amount int } /* … */ // @step:total
type CategoryIs struct{ Name string } /* … */ // @step:category

// {{withUse}}
eid := Or{ // {{nested}} // @step:l3-build
    And{CategoryIs{"saree"}, TotalAbove{3000}},
    TotalAbove{5000},
}
ok := eid.Interpret(cart) // {{sameCall}} // @step:interpret
price := cart.Total // @step:result
if ok {
    price = cart.Total * 90 / 100
}
// {{withZero}}
`

export const go: CodeSet = {
  main: { filename: 'discount_rules.go', source: main },
  without: { filename: 'checkout_without_interpreter.go', source: without },
  with: { filename: 'discount_with_or.go', source: withPattern },
}

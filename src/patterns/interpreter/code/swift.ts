import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{context}}
struct Cart {
    let total: Int
    let category: String
}

// {{abstract}}
protocol Rule {
    func interpret(_ cart: Cart) -> Bool
}

// {{terminal}}
struct TotalAbove: Rule {
    let amount: Int
    func interpret(_ cart: Cart) -> Bool {
        cart.total > amount // {{readsTotal}} // @step:total
    }
}

struct CategoryIs: Rule {
    let name: String
    func interpret(_ cart: Cart) -> Bool {
        cart.category == name // {{readsCategory}} // @step:category
    }
}

// {{nonterminal}}
struct And: Rule {
    let left: any Rule // {{holdsRules}}
    let right: any Rule
    func interpret(_ cart: Cart) -> Bool {
        left.interpret(cart) // {{asksLeft}} // @step:and-left
            && right.interpret(cart) // {{shortCircuit}} // @step:and-combine
    }
}

// {{client}}
func checkout(_ cart: Cart, rule: any Rule, percent: Int) -> Int {
    let ok = rule.interpret(cart) // {{oneCall}} // @step:interpret
    return ok ? cart.total * (100 - percent) / 100 : cart.total // {{payOrNot}} // @step:result
}

let rule = And(left: CategoryIs(name: "saree"), right: TotalAbove(amount: 3000)) // {{buildTree}} // @step:build
_ = checkout(Cart(total: 3450, category: "saree"), rule: rule, percent: 10)
`

const without = `
// {{withoutIntro}}
func checkout(_ cart: Cart) -> Int { // {{everyRuleHere}} // @step:l1-rule,l1-cart
    var percent = 0 // @step:l1-none
    if cart.total > 5000 { percent = 15 } // {{orderMatters}} // @step:l1-big
    else if cart.category == "saree" && cart.total > 3000 { percent = 10 } // @step:l1-saree
    else if cart.category == "panjabi" && cart.total > 2000 { percent = 5 } // @step:l1-panjabi
    return cart.total * (100 - percent) / 100 // @step:l1-pay
}

// {{redeploy}}
deploy(billingApp) // @step:l1-deploy
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
struct Or: Rule { // {{sameInterface}} // @step:build-class
    let left: any Rule
    let right: any Rule
    func interpret(_ cart: Cart) -> Bool {
        left.interpret(cart) // {{recursive}} // @step:build-recursive,or-left
            || right.interpret(cart) // {{orShort}} // @step:or-combine
    }
}

// {{othersSame}}
struct And: Rule { /* … */ } // @step:and-left,and-combine
struct TotalAbove: Rule { /* … */ } // @step:total
struct CategoryIs: Rule { /* … */ } // @step:category

// {{withUse}}
let eid = Or( // {{nested}} // @step:l3-build
    left: And(left: CategoryIs(name: "saree"), right: TotalAbove(amount: 3000)),
    right: TotalAbove(amount: 5000))
let ok = eid.interpret(cart) // {{sameCall}} // @step:interpret
let price = ok ? cart.total * 90 / 100 : cart.total // @step:result
// {{withZero}}
`

export const swift: CodeSet = {
  main: { filename: 'DiscountRules.swift', source: main },
  without: { filename: 'CheckoutWithoutInterpreter.swift', source: without },
  with: { filename: 'DiscountWithOr.swift', source: withPattern },
}

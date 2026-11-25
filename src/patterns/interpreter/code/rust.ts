import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Rust: a struct can't hold "some Rule" directly, so And / Or own their children as Box<dyn Rule>.

const main = `
// {{context}}
pub struct Cart {
    pub total: u32,
    pub category: &'static str,
}

// {{abstract}}
pub trait Rule {
    fn interpret(&self, cart: &Cart) -> bool;
}

// {{terminal}}
pub struct TotalAbove(pub u32);
impl Rule for TotalAbove {
    fn interpret(&self, cart: &Cart) -> bool {
        cart.total > self.0 // {{readsTotal}} // @step:total
    }
}

pub struct CategoryIs(pub &'static str);
impl Rule for CategoryIs {
    fn interpret(&self, cart: &Cart) -> bool {
        cart.category == self.0 // {{readsCategory}} // @step:category
    }
}

// {{nonterminal}}
pub struct And {
    pub left: Box<dyn Rule>, // {{holdsRules}}
    pub right: Box<dyn Rule>,
}
impl Rule for And {
    fn interpret(&self, cart: &Cart) -> bool {
        self.left.interpret(cart) // {{asksLeft}} // @step:and-left
            && self.right.interpret(cart) // {{shortCircuit}} // @step:and-combine
    }
}

// {{client}}
fn checkout(cart: &Cart, rule: &dyn Rule, percent: u32) -> u32 {
    let ok = rule.interpret(cart); // {{oneCall}} // @step:interpret
    if ok { cart.total * (100 - percent) / 100 } else { cart.total } // {{payOrNot}} // @step:result
}

fn main() {
    let rule = And { left: Box::new(CategoryIs("saree")), right: Box::new(TotalAbove(3000)) }; // {{buildTree}} // @step:build
    checkout(&Cart { total: 3450, category: "saree" }, &rule, 10);
}
`

const without = `
// {{withoutIntro}}
fn checkout(cart: &Cart) -> u32 { // {{everyRuleHere}} // @step:l1-rule,l1-cart
    let mut percent = 0; // @step:l1-none
    if cart.total > 5000 { percent = 15; } // {{orderMatters}} // @step:l1-big
    else if cart.category == "saree" && cart.total > 3000 { percent = 10; } // @step:l1-saree
    else if cart.category == "panjabi" && cart.total > 2000 { percent = 5; } // @step:l1-panjabi
    cart.total * (100 - percent) / 100 // @step:l1-pay
}

// {{redeploy}}
deploy(&billing_app); // @step:l1-deploy
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
pub struct Or { // {{sameInterface}} // @step:build-class
    pub left: Box<dyn Rule>,
    pub right: Box<dyn Rule>,
}
impl Rule for Or {
    fn interpret(&self, cart: &Cart) -> bool {
        self.left.interpret(cart) // {{recursive}} // @step:build-recursive,or-left
            || self.right.interpret(cart) // {{orShort}} // @step:or-combine
    }
}

// {{othersSame}}
impl Rule for And { /* … */ } // @step:and-left,and-combine
impl Rule for TotalAbove { /* … */ } // @step:total
impl Rule for CategoryIs { /* … */ } // @step:category

// {{withUse}}
let eid = Or { // {{nested}} // @step:l3-build
    left: Box::new(And { left: Box::new(CategoryIs("saree")), right: Box::new(TotalAbove(3000)) }),
    right: Box::new(TotalAbove(5000)),
};
let ok = eid.interpret(&cart); // {{sameCall}} // @step:interpret
let price = if ok { cart.total * 90 / 100 } else { cart.total }; // @step:result
// {{withZero}}
`

export const rust: CodeSet = {
  main: { filename: 'discount_rules.rs', source: main },
  without: { filename: 'checkout_without_interpreter.rs', source: without },
  with: { filename: 'discount_with_or.rs', source: withPattern },
}

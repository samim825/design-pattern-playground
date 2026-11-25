import type { CodeSet } from '@/types/pattern'

/*
 * Conventions (see CLAUDE.md):
 *   // {{key}}        → translated comment from content.<lang>.ts → codeComments[key]
 *   // @step:a,b      → this line lights up while visual step a or b runs (stripped on display)
 * The billing app's own code (deploy, the cart's items) is left out to keep the snippets small.
 */

const main = `
// {{context}}
interface Cart {
  readonly total: number;
  readonly category: string;
}

// {{abstract}}
interface Rule {
  interpret(cart: Cart): boolean;
}

// {{terminal}}
class TotalAbove implements Rule {
  constructor(private readonly amount: number) {}
  interpret(cart: Cart): boolean {
    return cart.total > this.amount; // {{readsTotal}} // @step:total
  }
}

class CategoryIs implements Rule {
  constructor(private readonly name: string) {}
  interpret(cart: Cart): boolean {
    return cart.category === this.name; // {{readsCategory}} // @step:category
  }
}

// {{nonterminal}}
class And implements Rule {
  constructor(private readonly left: Rule, private readonly right: Rule) {} // {{holdsRules}}
  interpret(cart: Cart): boolean {
    return this.left.interpret(cart) // {{asksLeft}} // @step:and-left
      && this.right.interpret(cart); // {{shortCircuit}} // @step:and-combine
  }
}

// {{client}}
function checkout(cart: Cart, rule: Rule, percent: number): number {
  const ok = rule.interpret(cart); // {{oneCall}} // @step:interpret
  return ok ? cart.total * (100 - percent) / 100 : cart.total; // {{payOrNot}} // @step:result
}

const rule: Rule = new And(new CategoryIs('saree'), new TotalAbove(3000)); // {{buildTree}} // @step:build
checkout({ total: 3450, category: 'saree' }, rule, 10);
`

const without = `
// {{withoutIntro}}
function checkout(cart: Cart): number { // {{everyRuleHere}} // @step:l1-rule,l1-cart
  let percent = 0; // @step:l1-none
  if (cart.total > 5000) percent = 15; // {{orderMatters}} // @step:l1-big
  else if (cart.category === 'saree' && cart.total > 3000) percent = 10; // @step:l1-saree
  else if (cart.category === 'panjabi' && cart.total > 2000) percent = 5; // @step:l1-panjabi
  return cart.total * (100 - percent) / 100; // @step:l1-pay
}

// {{redeploy}}
deploy(billingApp); // @step:l1-deploy
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
class Or implements Rule { // {{sameInterface}} // @step:build-class
  constructor(private readonly left: Rule, private readonly right: Rule) {}
  interpret(cart: Cart): boolean {
    return this.left.interpret(cart) // {{recursive}} // @step:build-recursive,or-left
      || this.right.interpret(cart); // {{orShort}} // @step:or-combine
  }
}

// {{othersSame}}
class And implements Rule { /* … */ } // @step:and-left,and-combine
class TotalAbove implements Rule { /* … */ } // @step:total
class CategoryIs implements Rule { /* … */ } // @step:category

// {{withUse}}
const eid: Rule = new Or( // {{nested}} // @step:l3-build
  new And(new CategoryIs('saree'), new TotalAbove(3000)),
  new TotalAbove(5000),
);
const ok = eid.interpret(cart); // {{sameCall}} // @step:interpret
const price = ok ? cart.total * 0.9 : cart.total; // @step:result
// {{withZero}}
`

export const ts: CodeSet = {
  main: { filename: 'discount-rules.ts', source: main },
  without: { filename: 'checkout-without-interpreter.ts', source: without },
  with: { filename: 'discount-with-or.ts', source: withPattern },
}

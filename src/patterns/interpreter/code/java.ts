import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{context}}
record Cart(int total, String category) {}

// {{abstract}}
interface Rule {
    boolean interpret(Cart cart);
}

// {{terminal}}
record TotalAbove(int amount) implements Rule {
    @Override public boolean interpret(Cart cart) {
        return cart.total() > amount; // {{readsTotal}} // @step:total
    }
}

record CategoryIs(String name) implements Rule {
    @Override public boolean interpret(Cart cart) {
        return cart.category().equals(name); // {{readsCategory}} // @step:category
    }
}

// {{nonterminal}}
record And(Rule left, Rule right) implements Rule { // {{holdsRules}}
    @Override public boolean interpret(Cart cart) {
        return left.interpret(cart) // {{asksLeft}} // @step:and-left
            && right.interpret(cart); // {{shortCircuit}} // @step:and-combine
    }
}

// {{client}}
class BillingCounter {
    static int checkout(Cart cart, Rule rule, int percent) {
        boolean ok = rule.interpret(cart); // {{oneCall}} // @step:interpret
        return ok ? cart.total() * (100 - percent) / 100 : cart.total(); // {{payOrNot}} // @step:result
    }

    public static void main(String[] args) {
        Rule rule = new And(new CategoryIs("saree"), new TotalAbove(3000)); // {{buildTree}} // @step:build
        checkout(new Cart(3450, "saree"), rule, 10);
    }
}
`

const without = `
// {{withoutIntro}}
class BillingCounter {
    int checkout(Cart cart) { // {{everyRuleHere}} // @step:l1-rule,l1-cart
        int percent = 0; // @step:l1-none
        if (cart.total() > 5000) percent = 15; // {{orderMatters}} // @step:l1-big
        else if (cart.category().equals("saree") && cart.total() > 3000) percent = 10; // @step:l1-saree
        else if (cart.category().equals("panjabi") && cart.total() > 2000) percent = 5; // @step:l1-panjabi
        return cart.total() * (100 - percent) / 100; // @step:l1-pay
    }
}

// {{redeploy}}
deploy(billingApp); // @step:l1-deploy
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
record Or(Rule left, Rule right) implements Rule { // {{sameInterface}} // @step:build-class
    @Override public boolean interpret(Cart cart) {
        return left.interpret(cart) // {{recursive}} // @step:build-recursive,or-left
            || right.interpret(cart); // {{orShort}} // @step:or-combine
    }
}

// {{othersSame}}
record And(Rule left, Rule right) implements Rule { /* … */ } // @step:and-left,and-combine
record TotalAbove(int amount) implements Rule { /* … */ } // @step:total
record CategoryIs(String name) implements Rule { /* … */ } // @step:category

// {{withUse}}
Rule eid = new Or( // {{nested}} // @step:l3-build
    new And(new CategoryIs("saree"), new TotalAbove(3000)),
    new TotalAbove(5000));
boolean ok = eid.interpret(cart); // {{sameCall}} // @step:interpret
int price = ok ? cart.total() * 90 / 100 : cart.total(); // @step:result
// {{withZero}}
`

export const java: CodeSet = {
  main: { filename: 'DiscountRules.java', source: main },
  without: { filename: 'CheckoutWithoutInterpreter.java', source: without },
  with: { filename: 'DiscountWithOr.java', source: withPattern },
}

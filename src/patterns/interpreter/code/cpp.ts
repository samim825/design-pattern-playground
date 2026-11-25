import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{context}}
struct Cart {
    int total;
    std::string category;
};

// {{abstract}}
class Rule {
public:
    virtual ~Rule() = default;
    virtual bool interpret(const Cart& cart) const = 0;
};

// {{terminal}}
class TotalAbove : public Rule {
    int amount;
public:
    explicit TotalAbove(int amount) : amount(amount) {}
    bool interpret(const Cart& cart) const override {
        return cart.total > amount; // {{readsTotal}} // @step:total
    }
};

class CategoryIs : public Rule {
    std::string name;
public:
    explicit CategoryIs(std::string name) : name(std::move(name)) {}
    bool interpret(const Cart& cart) const override {
        return cart.category == name; // {{readsCategory}} // @step:category
    }
};

// {{nonterminal}}
class And : public Rule {
    std::unique_ptr<Rule> left, right; // {{holdsRules}}
public:
    And(std::unique_ptr<Rule> l, std::unique_ptr<Rule> r) : left(std::move(l)), right(std::move(r)) {}
    bool interpret(const Cart& cart) const override {
        return left->interpret(cart) // {{asksLeft}} // @step:and-left
            && right->interpret(cart); // {{shortCircuit}} // @step:and-combine
    }
};

// {{client}}
int checkout(const Cart& cart, const Rule& rule, int percent) {
    bool ok = rule.interpret(cart); // {{oneCall}} // @step:interpret
    return ok ? cart.total * (100 - percent) / 100 : cart.total; // {{payOrNot}} // @step:result
}

int main() {
    auto rule = std::make_unique<And>(std::make_unique<CategoryIs>("saree"), std::make_unique<TotalAbove>(3000)); // {{buildTree}} // @step:build
    checkout(Cart{3450, "saree"}, *rule, 10);
}
`

const without = `
// {{withoutIntro}}
int checkout(const Cart& cart) { // {{everyRuleHere}} // @step:l1-rule,l1-cart
    int percent = 0; // @step:l1-none
    if (cart.total > 5000) percent = 15; // {{orderMatters}} // @step:l1-big
    else if (cart.category == "saree" && cart.total > 3000) percent = 10; // @step:l1-saree
    else if (cart.category == "panjabi" && cart.total > 2000) percent = 5; // @step:l1-panjabi
    return cart.total * (100 - percent) / 100; // @step:l1-pay
}

// {{redeploy}}
deploy(billingApp); // @step:l1-deploy
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
class Or : public Rule { // {{sameInterface}} // @step:build-class
    std::unique_ptr<Rule> left, right;
public:
    Or(std::unique_ptr<Rule> l, std::unique_ptr<Rule> r) : left(std::move(l)), right(std::move(r)) {}
    bool interpret(const Cart& cart) const override {
        return left->interpret(cart) // {{recursive}} // @step:build-recursive,or-left
            || right->interpret(cart); // {{orShort}} // @step:or-combine
    }
};

// {{othersSame}}
class And : public Rule { /* … */ }; // @step:and-left,and-combine
class TotalAbove : public Rule { /* … */ }; // @step:total
class CategoryIs : public Rule { /* … */ }; // @step:category

// {{withUse}}
auto eid = std::make_unique<Or>( // {{nested}} // @step:l3-build
    std::make_unique<And>(std::make_unique<CategoryIs>("saree"), std::make_unique<TotalAbove>(3000)),
    std::make_unique<TotalAbove>(5000));
bool ok = eid->interpret(cart); // {{sameCall}} // @step:interpret
int price = ok ? cart.total * 90 / 100 : cart.total; // @step:result
// {{withZero}}
`

export const cpp: CodeSet = {
  main: { filename: 'discount_rules.cpp', source: main },
  without: { filename: 'checkout_without_interpreter.cpp', source: without },
  with: { filename: 'discount_with_or.cpp', source: withPattern },
}

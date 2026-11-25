import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// PHP: "and" / "or" are reserved words and can't be class names, so the classes are AndRule / OrRule.

const main = `
<?php
// {{context}}
final readonly class Cart
{
    public function __construct(public int $total, public string $category) {}
}

// {{abstract}}
interface Rule
{
    public function interpret(Cart $cart): bool;
}

// {{terminal}}
final readonly class TotalAbove implements Rule
{
    public function __construct(private int $amount) {}

    public function interpret(Cart $cart): bool
    {
        return $cart->total > $this->amount; // {{readsTotal}} // @step:total
    }
}

final readonly class CategoryIs implements Rule
{
    public function __construct(private string $name) {}

    public function interpret(Cart $cart): bool
    {
        return $cart->category === $this->name; // {{readsCategory}} // @step:category
    }
}

// {{nonterminal}}
final readonly class AndRule implements Rule
{
    public function __construct(private Rule $left, private Rule $right) {} // {{holdsRules}}

    public function interpret(Cart $cart): bool
    {
        return $this->left->interpret($cart) // {{asksLeft}} // @step:and-left
            && $this->right->interpret($cart); // {{shortCircuit}} // @step:and-combine
    }
}

// {{client}}
function checkout(Cart $cart, Rule $rule, int $percent): int
{
    $ok = $rule->interpret($cart); // {{oneCall}} // @step:interpret
    return $ok ? intdiv($cart->total * (100 - $percent), 100) : $cart->total; // {{payOrNot}} // @step:result
}

$rule = new AndRule(new CategoryIs('saree'), new TotalAbove(3000)); // {{buildTree}} // @step:build
checkout(new Cart(3450, 'saree'), $rule, 10);
`

const without = `
<?php
// {{withoutIntro}}
function checkout(Cart $cart): int // {{everyRuleHere}} // @step:l1-rule,l1-cart
{
    $percent = match (true) { // @step:l1-none
        $cart->total > 5000 => 15, // {{orderMatters}} // @step:l1-big
        $cart->category === 'saree' && $cart->total > 3000 => 10, // @step:l1-saree
        $cart->category === 'panjabi' && $cart->total > 2000 => 5, // @step:l1-panjabi
        default => 0,
    };
    return intdiv($cart->total * (100 - $percent), 100); // @step:l1-pay
}

// {{redeploy}}
deploy($billingApp); // @step:l1-deploy
// {{withoutNext}}
`

const withPattern = `
<?php
// {{withAdd}}
final readonly class OrRule implements Rule // {{sameInterface}} // @step:build-class
{
    public function __construct(private Rule $left, private Rule $right) {}

    public function interpret(Cart $cart): bool
    {
        return $this->left->interpret($cart) // {{recursive}} // @step:build-recursive,or-left
            || $this->right->interpret($cart); // {{orShort}} // @step:or-combine
    }
}

// {{othersSame}}
final readonly class AndRule implements Rule { /* … */ } // @step:and-left,and-combine
final readonly class TotalAbove implements Rule { /* … */ } // @step:total
final readonly class CategoryIs implements Rule { /* … */ } // @step:category

// {{withUse}}
$eid = new OrRule( // {{nested}} // @step:l3-build
    new AndRule(new CategoryIs('saree'), new TotalAbove(3000)),
    new TotalAbove(5000),
);
$ok = $eid->interpret($cart); // {{sameCall}} // @step:interpret
$price = $ok ? intdiv($cart->total * 90, 100) : $cart->total; // @step:result
// {{withZero}}
`

export const php: CodeSet = {
  main: { filename: 'DiscountRules.php', source: main },
  without: { filename: 'CheckoutWithoutInterpreter.php', source: without },
  with: { filename: 'DiscountWithOr.php', source: withPattern },
}

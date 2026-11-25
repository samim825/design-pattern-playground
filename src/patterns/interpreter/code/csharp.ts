import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{context}}
public record Cart(decimal Total, string Category);

// {{abstract}}
public interface IRule
{
    bool Interpret(Cart cart);
}

// {{terminal}}
public record TotalAbove(decimal Amount) : IRule
{
    public bool Interpret(Cart cart) => cart.Total > Amount; // {{readsTotal}} // @step:total
}

public record CategoryIs(string Name) : IRule
{
    public bool Interpret(Cart cart) => cart.Category == Name; // {{readsCategory}} // @step:category
}

// {{nonterminal}}
public record And(IRule Left, IRule Right) : IRule // {{holdsRules}}
{
    public bool Interpret(Cart cart) =>
        Left.Interpret(cart) // {{asksLeft}} // @step:and-left
        && Right.Interpret(cart); // {{shortCircuit}} // @step:and-combine
}

// {{client}}
public static class BillingCounter
{
    public static decimal Checkout(Cart cart, IRule rule, decimal percent)
    {
        bool ok = rule.Interpret(cart); // {{oneCall}} // @step:interpret
        return ok ? cart.Total * (100 - percent) / 100 : cart.Total; // {{payOrNot}} // @step:result
    }

    public static void Main()
    {
        IRule rule = new And(new CategoryIs("saree"), new TotalAbove(3000)); // {{buildTree}} // @step:build
        Checkout(new Cart(3450, "saree"), rule, 10);
    }
}
`

const without = `
// {{withoutIntro}}
public static decimal Checkout(Cart cart) // {{everyRuleHere}} // @step:l1-rule,l1-cart
{
    decimal percent = 0; // @step:l1-none
    if (cart.Total > 5000) percent = 15; // {{orderMatters}} // @step:l1-big
    else if (cart.Category == "saree" && cart.Total > 3000) percent = 10; // @step:l1-saree
    else if (cart.Category == "panjabi" && cart.Total > 2000) percent = 5; // @step:l1-panjabi
    return cart.Total * (100 - percent) / 100; // @step:l1-pay
}

// {{redeploy}}
Deploy(billingApp); // @step:l1-deploy
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
public record Or(IRule Left, IRule Right) : IRule // {{sameInterface}} // @step:build-class
{
    public bool Interpret(Cart cart) =>
        Left.Interpret(cart) // {{recursive}} // @step:build-recursive,or-left
        || Right.Interpret(cart); // {{orShort}} // @step:or-combine
}

// {{othersSame}}
public record And(IRule Left, IRule Right) : IRule { /* … */ } // @step:and-left,and-combine
public record TotalAbove(decimal Amount) : IRule { /* … */ } // @step:total
public record CategoryIs(string Name) : IRule { /* … */ } // @step:category

// {{withUse}}
IRule eid = new Or( // {{nested}} // @step:l3-build
    new And(new CategoryIs("saree"), new TotalAbove(3000)),
    new TotalAbove(5000));
bool ok = eid.Interpret(cart); // {{sameCall}} // @step:interpret
decimal price = ok ? cart.Total * 0.9m : cart.Total; // @step:result
// {{withZero}}
`

export const csharp: CodeSet = {
  main: { filename: 'DiscountRules.cs', source: main },
  without: { filename: 'CheckoutWithoutInterpreter.cs', source: without },
  with: { filename: 'DiscountWithOr.cs', source: withPattern },
}

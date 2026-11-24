import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
record Receipt(string Method, decimal Amount, decimal Fee, decimal Total);

// {{interface}}
interface IPaymentStrategy
{
    Receipt Pay(decimal amount);
}

class BkashPayment : IPaymentStrategy
{
    public Receipt Pay(decimal amount)
    {
        var fee = amount * 0.0185m; // {{bkashFee}} // @step:bkash-fee
        VerifyOtp(customer.Phone); // @step:bkash-otp
        ConfirmPin(customer.Phone); // @step:bkash-pin
        return new Receipt("bKash", amount, fee, amount + fee); // @step:bkash-receipt
    }
}

class NagadPayment : IPaymentStrategy
{
    public Receipt Pay(decimal amount)
    {
        var fee = amount * 0.01m; // {{nagadFee}} // @step:nagad-fee
        VerifyOtp(customer.Phone); // @step:nagad-otp
        return new Receipt("Nagad", amount, fee, amount + fee); // @step:nagad-receipt
    }
}

class CardPayment : IPaymentStrategy
{
    public Receipt Pay(decimal amount)
    {
        var fee = amount * 0.025m; // {{cardFee}} // @step:card-fee
        Run3DSecure(customer.Card); // @step:card-3ds
        AuthorizeWithBank(customer.Card, amount + fee); // @step:card-bank
        return new Receipt("Card", amount, fee, amount + fee); // @step:card-receipt
    }
}

// {{context}}
class Checkout(IPaymentStrategy strategy)
{
    // {{swap}}
    public void SetStrategy(IPaymentStrategy next) =>
        strategy = next; // @step:set-strategy

    // {{delegate}}
    public Receipt Pay(decimal amount) =>
        strategy.Pay(amount); // @step:delegate
}

// {{usage}}
var checkout = new Checkout(new BkashPayment());
checkout.SetStrategy(selectedMethod); // @step:set-strategy
var receipt = checkout.Pay(1250m); // @step:client-pay,done
`

const without = `
// {{withoutIntro}}
Receipt Checkout(decimal amount, string method) // @step:l1-start
{
    decimal fee;

    switch (method)
    {
        case "bkash": // @step:l1-bkash
            fee = amount * 0.0185m;
            VerifyOtp(customer.Phone); // @step:l1-bkash-otp
            ConfirmPin(customer.Phone); // @step:l1-bkash-pin
            break;
        case "nagad": // @step:l1-nagad
            fee = amount * 0.01m;
            VerifyOtp(customer.Phone); // @step:l1-nagad-otp
            break;
        case "card": // @step:l1-card
            fee = amount * 0.025m;
            Run3DSecure(customer.Card); // @step:l1-card-3ds
            AuthorizeWithBank(customer.Card, amount + fee); // @step:l1-card-bank
            break;
        default:
            throw new ArgumentException("Unknown payment method: " + method);
    }
    // {{withoutTodo}} // @step:l1-todo

    return new Receipt(method, amount, fee, amount + fee); // @step:l1-result
}
`

const withPattern = `
// {{withAdd}}
class RocketPayment : IPaymentStrategy // @step:build-strategy
{
    public Receipt Pay(decimal amount)
    {
        var fee = amount * 0.018m; // @step:rocket-fee
        VerifyOtp(customer.Phone); // @step:rocket-otp
        return new Receipt("Rocket", amount, fee, amount + fee); // @step:rocket-receipt
    }
}

var checkout = new Checkout(new BkashPayment());
checkout.Pay(1250m);

checkout.SetStrategy(new RocketPayment()); // {{withSwap}} // @step:build-plug,rocket-set
checkout.Pay(1250m); // @step:rocket-pay,rocket-done
`

export const csharp: CodeSet = {
  main: { filename: 'Checkout.cs', source: main },
  without: { filename: 'CheckoutWithoutStrategy.cs', source: without },
  with: { filename: 'CheckoutWithStrategy.cs', source: withPattern },
}

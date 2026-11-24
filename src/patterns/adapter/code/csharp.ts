import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{target}}
interface IPaymentProcessor
{
    Receipt Pay(decimal amount);
}

// {{existing}}
class BkashProcessor : IPaymentProcessor
{
    public Receipt Pay(decimal amount) => bkash.Charge(amount); // @step:bkash-pay
}

// {{adaptee}}
interface IPadmaBankSdk
{
    TransferResult MakeTransfer(TransferRequest request);
}
record TransferRequest(long AmountInPaisa, string Currency, string Ref);
record TransferResult(string Status, string TxnId);

// {{adapter}}
class PadmaBankAdapter(IPadmaBankSdk sdk) : IPaymentProcessor
{
    public Receipt Pay(decimal amount) // @step:adapter-pay
    {
        var res = sdk.MakeTransfer(new TransferRequest( // {{translateCall}} // @step:translate
            (long)Math.Round(amount * 100), // {{toPaisa}} // @step:to-paisa
            "BDT", NewRef()));
        if (res.Status != "OK") throw new PaymentException(); // @step:check-status
        return new Receipt("Padma Bank", amount, res.TxnId); // {{toReceipt}} // @step:to-receipt
    }
}

// {{client}}
class Checkout(IPaymentProcessor processor)
{
    public Receipt Pay(decimal amount) =>
        processor.Pay(amount); // {{onlyTarget}} // @step:client-pay
}

// {{usage}}
var checkout = new Checkout(ProcessorFor(order)); // @step:wire
var receipt = checkout.Pay(order.Total); // @step:order,done
`

const without = `
// {{withoutIntro}}
Receipt Checkout(Order order) // @step:l1-call
{
    var res = padma.MakeTransfer(new TransferRequest( // {{withoutShape}} // @step:l1-method
        (long)Math.Round(order.Total * 100), // {{withoutPaisa}} // @step:l1-amount
        "BDT", order.Id));
    if (res.Status != "OK") throw new PaymentException(); // @step:l1-result
    return new Receipt("Padma Bank", order.Total, res.TxnId); // @step:l1-check
}
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
class JamunaWalletAdapter(IJamunaWalletSdk wallet) : IPaymentProcessor // @step:build-adapter
{
    public Receipt Pay(decimal amount) // @step:j-pay
    {
        bool ok = wallet.Debit(amount.ToString("F2"), "BDT"); // {{toText}} // @step:build-adapter,j-translate
        if (!ok) throw new PaymentException(); // @step:j-check
        return new Receipt("Jamuna Wallet", amount, NewRef()); // @step:j-receipt
    }
}

// {{withSame}}
var checkout = new Checkout(new JamunaWalletAdapter(new JamunaWalletSdk())); // @step:j-wire
checkout.Pay(780m); // @step:j-order,j-done
`

export const csharp: CodeSet = {
  main: { filename: 'Payments.cs', source: main },
  without: { filename: 'PaymentsWithoutAdapter.cs', source: without },
  with: { filename: 'PaymentsWithAdapter.cs', source: withPattern },
}

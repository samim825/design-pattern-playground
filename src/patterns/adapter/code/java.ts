import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{target}}
interface PaymentProcessor {
    Receipt pay(double amount);
}

// {{existing}}
class BkashProcessor implements PaymentProcessor {
    public Receipt pay(double amount) { return bkash.charge(amount); } // @step:bkash-pay
}

// {{adaptee}}
interface PadmaBankSdk {
    TransferResult makeTransfer(TransferRequest request);
}
record TransferRequest(long amountInPaisa, String currency, String ref) {}
record TransferResult(String status, String txnId) {}

// {{adapter}}
class PadmaBankAdapter implements PaymentProcessor {
    private final PadmaBankSdk sdk;
    PadmaBankAdapter(PadmaBankSdk sdk) { this.sdk = sdk; }

    public Receipt pay(double amount) { // @step:adapter-pay
        TransferResult res = sdk.makeTransfer(new TransferRequest( // {{translateCall}} // @step:translate
            Math.round(amount * 100), // {{toPaisa}} // @step:to-paisa
            "BDT", newRef()));
        if (!res.status().equals("OK")) throw new PaymentException(); // @step:check-status
        return new Receipt("Padma Bank", amount, res.txnId()); // {{toReceipt}} // @step:to-receipt
    }
}

// {{client}}
class Checkout {
    private final PaymentProcessor processor;
    Checkout(PaymentProcessor processor) { this.processor = processor; }

    Receipt pay(double amount) {
        return processor.pay(amount); // {{onlyTarget}} // @step:client-pay
    }
}

// {{usage}}
Checkout checkout = new Checkout(processorFor(order)); // @step:wire
Receipt receipt = checkout.pay(order.total()); // @step:order,done
`

const without = `
// {{withoutIntro}}
Receipt checkout(Order order) { // @step:l1-call
    TransferResult res = padma.makeTransfer(new TransferRequest( // {{withoutShape}} // @step:l1-method
        Math.round(order.total() * 100), // {{withoutPaisa}} // @step:l1-amount
        "BDT", order.id()));
    if (!res.status().equals("OK")) throw new PaymentException(); // @step:l1-result
    return new Receipt("Padma Bank", order.total(), res.txnId()); // @step:l1-check
}
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
class JamunaWalletAdapter implements PaymentProcessor { // @step:build-adapter
    private final JamunaWalletSdk wallet;
    JamunaWalletAdapter(JamunaWalletSdk wallet) { this.wallet = wallet; }

    public Receipt pay(double amount) { // @step:j-pay
        boolean ok = wallet.debit(String.format("%.2f", amount), "BDT"); // {{toText}} // @step:build-adapter,j-translate
        if (!ok) throw new PaymentException(); // @step:j-check
        return new Receipt("Jamuna Wallet", amount, newRef()); // @step:j-receipt
    }
}

// {{withSame}}
Checkout checkout = new Checkout(new JamunaWalletAdapter(new JamunaWalletSdk())); // @step:j-wire
checkout.pay(780); // @step:j-order,j-done
`

export const java: CodeSet = {
  main: { filename: 'Payments.java', source: main },
  without: { filename: 'PaymentsWithoutAdapter.java', source: without },
  with: { filename: 'PaymentsWithAdapter.java', source: withPattern },
}

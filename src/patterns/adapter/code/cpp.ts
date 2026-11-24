import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{target}}
class PaymentProcessor {
public:
    virtual ~PaymentProcessor() = default;
    virtual Receipt pay(double amount) = 0;
};

// {{existing}}
class BkashProcessor : public PaymentProcessor {
public:
    Receipt pay(double amount) override { return bkash.charge(amount); } // @step:bkash-pay
};

// {{adaptee}}
#include <padma/bank_sdk.hpp>

// {{adapter}}
class PadmaBankAdapter : public PaymentProcessor {
    padma::BankSdk& sdk;
public:
    explicit PadmaBankAdapter(padma::BankSdk& s) : sdk(s) {}

    Receipt pay(double amount) override { // @step:adapter-pay
        auto res = sdk.makeTransfer({ // {{translateCall}} // @step:translate
            .amountInPaisa = std::llround(amount * 100), // {{toPaisa}} // @step:to-paisa
            .currency = "BDT",
            .ref = newRef(),
        });
        if (res.status != "OK") throw PaymentError("declined"); // @step:check-status
        return {"Padma Bank", amount, res.txnId}; // {{toReceipt}} // @step:to-receipt
    }
};

// {{client}}
class Checkout {
    PaymentProcessor& processor;
public:
    explicit Checkout(PaymentProcessor& p) : processor(p) {}
    Receipt pay(double amount) {
        return processor.pay(amount); // {{onlyTarget}} // @step:client-pay
    }
};

// {{usage}}
Checkout checkout(processorFor(order)); // @step:wire
Receipt receipt = checkout.pay(order.total); // @step:order,done
`

const without = `
// {{withoutIntro}}
Receipt checkout(const Order& order) { // @step:l1-call
    auto res = padma.makeTransfer({ // {{withoutShape}} // @step:l1-method
        .amountInPaisa = std::llround(order.total * 100), // {{withoutPaisa}} // @step:l1-amount
        .currency = "BDT",
        .ref = order.id,
    });
    if (res.status != "OK") throw PaymentError("declined"); // @step:l1-result
    return {"Padma Bank", order.total, res.txnId}; // @step:l1-check
}
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
class JamunaWalletAdapter : public PaymentProcessor { // @step:build-adapter
    jamuna::WalletSdk& wallet;
public:
    explicit JamunaWalletAdapter(jamuna::WalletSdk& w) : wallet(w) {}

    Receipt pay(double amount) override { // @step:j-pay
        bool ok = wallet.debit(std::format("{:.2f}", amount), "BDT"); // {{toText}} // @step:build-adapter,j-translate
        if (!ok) throw PaymentError("declined"); // @step:j-check
        return {"Jamuna Wallet", amount, newRef()}; // @step:j-receipt
    }
};

// {{withSame}}
JamunaWalletAdapter jamunaAdapter(jamunaWallet);
Checkout checkout(jamunaAdapter); // @step:j-wire
checkout.pay(780); // @step:j-order,j-done
`

export const cpp: CodeSet = {
  main: { filename: 'payments.cpp', source: main },
  without: { filename: 'payments_without_adapter.cpp', source: without },
  with: { filename: 'payments_with_adapter.cpp', source: withPattern },
}

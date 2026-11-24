import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
record Receipt(String method, double amount, double fee, double total) {}

// {{interface}}
interface PaymentStrategy {
    Receipt pay(double amount);
}

class BkashPayment implements PaymentStrategy {
    public Receipt pay(double amount) {
        double fee = amount * 0.0185; // {{bkashFee}} // @step:bkash-fee
        verifyOtp(customer.phone()); // @step:bkash-otp
        confirmPin(customer.phone()); // @step:bkash-pin
        return new Receipt("bKash", amount, fee, amount + fee); // @step:bkash-receipt
    }
}

class NagadPayment implements PaymentStrategy {
    public Receipt pay(double amount) {
        double fee = amount * 0.01; // {{nagadFee}} // @step:nagad-fee
        verifyOtp(customer.phone()); // @step:nagad-otp
        return new Receipt("Nagad", amount, fee, amount + fee); // @step:nagad-receipt
    }
}

class CardPayment implements PaymentStrategy {
    public Receipt pay(double amount) {
        double fee = amount * 0.025; // {{cardFee}} // @step:card-fee
        run3DSecure(customer.card()); // @step:card-3ds
        authorizeWithBank(customer.card(), amount + fee); // @step:card-bank
        return new Receipt("Card", amount, fee, amount + fee); // @step:card-receipt
    }
}

// {{context}}
class Checkout {
    private PaymentStrategy strategy;

    Checkout(PaymentStrategy strategy) { this.strategy = strategy; }

    // {{swap}}
    void setStrategy(PaymentStrategy strategy) {
        this.strategy = strategy; // @step:set-strategy
    }

    Receipt pay(double amount) {
        // {{delegate}}
        return strategy.pay(amount); // @step:delegate
    }
}

// {{usage}}
Checkout checkout = new Checkout(new BkashPayment());
checkout.setStrategy(selectedMethod); // @step:set-strategy
Receipt receipt = checkout.pay(1250); // @step:client-pay,done
`

const without = `
// {{withoutIntro}}
Receipt checkout(double amount, String method) { // @step:l1-start
    double fee;

    switch (method) {
        case "bkash" -> { // @step:l1-bkash
            fee = amount * 0.0185;
            verifyOtp(customer.phone()); // @step:l1-bkash-otp
            confirmPin(customer.phone()); // @step:l1-bkash-pin
        }
        case "nagad" -> { // @step:l1-nagad
            fee = amount * 0.01;
            verifyOtp(customer.phone()); // @step:l1-nagad-otp
        }
        case "card" -> { // @step:l1-card
            fee = amount * 0.025;
            run3DSecure(customer.card()); // @step:l1-card-3ds
            authorizeWithBank(customer.card(), amount + fee); // @step:l1-card-bank
        }
        default -> throw new IllegalArgumentException("Unknown payment method: " + method);
    }
    // {{withoutTodo}} // @step:l1-todo

    return new Receipt(method, amount, fee, amount + fee); // @step:l1-result
}

checkout(1250, "bkash");
`

const withPattern = `
// {{withAdd}}
class RocketPayment implements PaymentStrategy { // @step:build-strategy
    public Receipt pay(double amount) {
        double fee = amount * 0.018; // @step:rocket-fee
        verifyOtp(customer.phone()); // @step:rocket-otp
        return new Receipt("Rocket", amount, fee, amount + fee); // @step:rocket-receipt
    }
}

Checkout checkout = new Checkout(new BkashPayment());
checkout.pay(1250);

checkout.setStrategy(new RocketPayment()); // {{withSwap}} // @step:build-plug,rocket-set
checkout.pay(1250); // @step:rocket-pay,rocket-done
`

export const java: CodeSet = {
  main: { filename: 'Checkout.java', source: main },
  without: { filename: 'CheckoutWithoutStrategy.java', source: without },
  with: { filename: 'CheckoutWithStrategy.java', source: withPattern },
}

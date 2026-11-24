import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
struct Receipt { std::string method; double amount, fee, total; };

// {{interface}}
class PaymentStrategy {
public:
    virtual ~PaymentStrategy() = default;
    virtual Receipt pay(double amount) = 0;
};

class BkashPayment : public PaymentStrategy {
public:
    Receipt pay(double amount) override {
        double fee = amount * 0.0185; // {{bkashFee}} // @step:bkash-fee
        verifyOtp(customer.phone); // @step:bkash-otp
        confirmPin(customer.phone); // @step:bkash-pin
        return {"bKash", amount, fee, amount + fee}; // @step:bkash-receipt
    }
};

class NagadPayment : public PaymentStrategy {
public:
    Receipt pay(double amount) override {
        double fee = amount * 0.01; // {{nagadFee}} // @step:nagad-fee
        verifyOtp(customer.phone); // @step:nagad-otp
        return {"Nagad", amount, fee, amount + fee}; // @step:nagad-receipt
    }
};

class CardPayment : public PaymentStrategy {
public:
    Receipt pay(double amount) override {
        double fee = amount * 0.025; // {{cardFee}} // @step:card-fee
        run3DSecure(customer.card); // @step:card-3ds
        authorizeWithBank(customer.card, amount + fee); // @step:card-bank
        return {"Card", amount, fee, amount + fee}; // @step:card-receipt
    }
};

// {{context}}
class Checkout {
    std::unique_ptr<PaymentStrategy> strategy;
public:
    explicit Checkout(std::unique_ptr<PaymentStrategy> s) : strategy(std::move(s)) {}

    // {{swap}}
    void setStrategy(std::unique_ptr<PaymentStrategy> s) {
        strategy = std::move(s); // @step:set-strategy
    }

    Receipt pay(double amount) {
        // {{delegate}}
        return strategy->pay(amount); // @step:delegate
    }
};

// {{usage}}
Checkout checkout(std::make_unique<BkashPayment>());
checkout.setStrategy(selectedMethod()); // @step:set-strategy
Receipt receipt = checkout.pay(1250); // @step:client-pay,done
`

const without = `
// {{withoutIntro}}
Receipt checkout(double amount, const std::string& method) {
    double fee = 0;

    if (method == "bkash") {
        fee = amount * 0.0185;
        verifyOtp(customer.phone);
        confirmPin(customer.phone);
    } else if (method == "nagad") {
        fee = amount * 0.01;
        verifyOtp(customer.phone);
    } else if (method == "card") {
        fee = amount * 0.025;
        run3DSecure(customer.card);
        authorizeWithBank(customer.card, amount + fee);
    } else {
        throw std::invalid_argument("Unknown payment method: " + method);
    }
    // {{withoutTodo}}

    return {method, amount, fee, amount + fee};
}
`

const withPattern = `
// {{withAdd}}
class RocketPayment : public PaymentStrategy {
public:
    Receipt pay(double amount) override {
        double fee = amount * 0.018;
        verifyOtp(customer.phone);
        return {"Rocket", amount, fee, amount + fee};
    }
};

Checkout checkout(std::make_unique<BkashPayment>());
checkout.pay(1250);

checkout.setStrategy(std::make_unique<RocketPayment>()); // {{withSwap}}
checkout.pay(1250);
`

export const cpp: CodeSet = {
  main: { filename: 'checkout.cpp', source: main },
  without: { filename: 'checkout_without_strategy.cpp', source: without },
  with: { filename: 'checkout_with_strategy.cpp', source: withPattern },
}

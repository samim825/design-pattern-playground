import type { CodeSet } from '@/types/pattern'

/*
 * Conventions (see CLAUDE.md):
 *   // {{key}}        → translated comment from content.<lang>.ts → codeComments[key]
 *   // @step:a,b      → this line lights up while visual step a or b runs (stripped on display)
 */

const main = `
type Receipt = { method: string; amount: number; fee: number; total: number };

// {{interface}}
interface PaymentStrategy {
  pay(amount: number): Receipt;
}

class BkashPayment implements PaymentStrategy {
  pay(amount: number): Receipt {
    const fee = amount * 0.0185; // {{bkashFee}} // @step:bkash-fee
    verifyOtp(customer.phone); // @step:bkash-otp
    confirmPin(customer.phone); // @step:bkash-pin
    return { method: 'bKash', amount, fee, total: amount + fee }; // @step:bkash-receipt
  }
}

class NagadPayment implements PaymentStrategy {
  pay(amount: number): Receipt {
    const fee = amount * 0.01; // {{nagadFee}} // @step:nagad-fee
    verifyOtp(customer.phone); // @step:nagad-otp
    return { method: 'Nagad', amount, fee, total: amount + fee }; // @step:nagad-receipt
  }
}

class CardPayment implements PaymentStrategy {
  pay(amount: number): Receipt {
    const fee = amount * 0.025; // {{cardFee}} // @step:card-fee
    run3DSecure(customer.card); // @step:card-3ds
    authorizeWithBank(customer.card, amount + fee); // @step:card-bank
    return { method: 'Card', amount, fee, total: amount + fee }; // @step:card-receipt
  }
}

// {{context}}
class Checkout {
  constructor(private strategy: PaymentStrategy) {}

  // {{swap}}
  setStrategy(strategy: PaymentStrategy): void {
    this.strategy = strategy; // @step:set-strategy
  }

  pay(amount: number): Receipt {
    // {{delegate}}
    return this.strategy.pay(amount); // @step:delegate
  }
}

// {{usage}}
const checkout = new Checkout(new BkashPayment());
checkout.setStrategy(selectedMethod); // @step:set-strategy
const receipt = checkout.pay(1250); // @step:client-pay,done
`

const without = `
// {{withoutIntro}}
function checkout(amount: number, method: string): Receipt { // @step:l1-start
  let fee = 0;

  if (method === 'bkash') { // @step:l1-bkash
    fee = amount * 0.0185;
    verifyOtp(customer.phone); // @step:l1-bkash-otp
    confirmPin(customer.phone); // @step:l1-bkash-pin
  } else if (method === 'nagad') { // @step:l1-nagad
    fee = amount * 0.01;
    verifyOtp(customer.phone); // @step:l1-nagad-otp
  } else if (method === 'card') { // @step:l1-card
    fee = amount * 0.025;
    run3DSecure(customer.card); // @step:l1-card-3ds
    authorizeWithBank(customer.card, amount + fee); // @step:l1-card-bank
  } else {
    throw new Error('Unknown payment method: ' + method);
  }
  // {{withoutTodo}} // @step:l1-todo

  return { method, amount, fee, total: amount + fee }; // @step:l1-result
}

checkout(1250, 'bkash');
`

const withPattern = `
// {{withAdd}}
class RocketPayment implements PaymentStrategy { // @step:build-strategy
  pay(amount: number): Receipt {
    const fee = amount * 0.018; // @step:rocket-fee
    verifyOtp(customer.phone); // @step:rocket-otp
    return { method: 'Rocket', amount, fee, total: amount + fee }; // @step:rocket-receipt
  }
}

const checkout = new Checkout(new BkashPayment());
checkout.pay(1250);

checkout.setStrategy(new RocketPayment()); // {{withSwap}} // @step:build-plug,rocket-set
checkout.pay(1250); // @step:rocket-pay,rocket-done
`

export const ts: CodeSet = {
  main: { filename: 'checkout.ts', source: main },
  without: { filename: 'checkout-without-strategy.ts', source: without },
  with: { filename: 'checkout-with-strategy.ts', source: withPattern },
}

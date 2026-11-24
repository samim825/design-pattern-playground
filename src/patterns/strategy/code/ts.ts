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
function checkout(amount: number, method: string): Receipt {
  let fee = 0;

  if (method === 'bkash') {
    fee = amount * 0.0185;
    verifyOtp(customer.phone);
    confirmPin(customer.phone);
  } else if (method === 'nagad') {
    fee = amount * 0.01;
    verifyOtp(customer.phone);
  } else if (method === 'card') {
    fee = amount * 0.025;
    run3DSecure(customer.card);
    authorizeWithBank(customer.card, amount + fee);
  } else {
    throw new Error('Unknown payment method: ' + method);
  }
  // {{withoutTodo}}

  return { method, amount, fee, total: amount + fee };
}

checkout(1250, 'bkash');
`

const withPattern = `
// {{withAdd}}
class RocketPayment implements PaymentStrategy {
  pay(amount: number): Receipt {
    const fee = amount * 0.018;
    verifyOtp(customer.phone);
    return { method: 'Rocket', amount, fee, total: amount + fee };
  }
}

const checkout = new Checkout(new BkashPayment());
checkout.pay(1250);

checkout.setStrategy(new RocketPayment()); // {{withSwap}}
checkout.pay(1250);
`

export const ts: CodeSet = {
  main: { filename: 'checkout.ts', source: main },
  without: { filename: 'checkout-without-strategy.ts', source: without },
  with: { filename: 'checkout-with-strategy.ts', source: withPattern },
}

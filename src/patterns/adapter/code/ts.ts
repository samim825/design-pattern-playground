import type { CodeSet } from '@/types/pattern'

/*
 * Conventions (see CLAUDE.md):
 *   // {{key}}        → translated comment from content.<lang>.ts → codeComments[key]
 *   // @step:a,b      → this line lights up while visual step a or b runs (stripped on display)
 */

const main = `
// {{target}}
interface PaymentProcessor {
  pay(amount: number): Receipt;
}

// {{existing}}
class BkashProcessor implements PaymentProcessor {
  pay(amount: number): Receipt { return bkash.charge(amount); } // @step:bkash-pay
}

// {{adaptee}}
declare class PadmaBankSdk {
  makeTransfer(req: { amountInPaisa: number; currency: string; ref: string }): { status: string; txnId: string };
}

// {{adapter}}
class PadmaBankAdapter implements PaymentProcessor {
  constructor(private sdk: PadmaBankSdk) {}

  pay(amount: number): Receipt { // @step:adapter-pay
    const res = this.sdk.makeTransfer({ // {{translateCall}} // @step:translate
      amountInPaisa: Math.round(amount * 100), // {{toPaisa}} // @step:to-paisa
      currency: 'BDT',
      ref: newRef(),
    });
    if (res.status !== 'OK') throw new Error('Payment failed'); // @step:check-status
    return { method: 'Padma Bank', total: amount, txn: res.txnId }; // {{toReceipt}} // @step:to-receipt
  }
}

// {{client}}
class Checkout {
  constructor(private processor: PaymentProcessor) {}

  pay(amount: number): Receipt {
    return this.processor.pay(amount); // {{onlyTarget}} // @step:client-pay
  }
}

// {{usage}}
const checkout = new Checkout(processorFor(order)); // @step:wire
const receipt = checkout.pay(order.total); // @step:order,done
`

const without = `
// {{withoutIntro}}
function checkout(order: Order): Receipt { // @step:l1-call
  const res = padma.makeTransfer({ // {{withoutShape}} // @step:l1-method
    amountInPaisa: Math.round(order.total * 100), // {{withoutPaisa}} // @step:l1-amount
    currency: 'BDT',
    ref: order.id,
  });
  if (res.status !== 'OK') throw new Error('Payment failed'); // @step:l1-result
  return { method: 'Padma Bank', total: order.total, txn: res.txnId }; // @step:l1-check
}
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
class JamunaWalletAdapter implements PaymentProcessor { // @step:build-adapter
  constructor(private wallet: JamunaWalletSdk) {}

  pay(amount: number): Receipt { // @step:j-pay
    const ok = this.wallet.debit(amount.toFixed(2), 'BDT'); // {{toText}} // @step:build-adapter,j-translate
    if (!ok) throw new Error('Payment failed'); // @step:j-check
    return { method: 'Jamuna Wallet', total: amount, txn: newRef() }; // @step:j-receipt
  }
}

// {{withSame}}
const checkout = new Checkout(new JamunaWalletAdapter(new JamunaWalletSdk())); // @step:j-wire
checkout.pay(780); // @step:j-order,j-done
`

export const ts: CodeSet = {
  main: { filename: 'payments.ts', source: main },
  without: { filename: 'payments-without-adapter.ts', source: without },
  with: { filename: 'payments-with-adapter.ts', source: withPattern },
}

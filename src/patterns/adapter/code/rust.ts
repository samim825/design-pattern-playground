import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{target}}
pub trait PaymentProcessor {
    fn pay(&self, amount: f64) -> Result<Receipt, PaymentError>;
}

// {{existing}}
pub struct BkashProcessor;
impl PaymentProcessor for BkashProcessor {
    fn pay(&self, amount: f64) -> Result<Receipt, PaymentError> { bkash::charge(amount) } // @step:bkash-pay
}

// {{adaptee}}
use padma_bank::{PadmaBankSdk, TransferRequest};

// {{adapter}}
pub struct PadmaBankAdapter { sdk: PadmaBankSdk }

impl PaymentProcessor for PadmaBankAdapter {
    fn pay(&self, amount: f64) -> Result<Receipt, PaymentError> { // @step:adapter-pay
        let res = self.sdk.make_transfer(TransferRequest { // {{translateCall}} // @step:translate
            amount_in_paisa: (amount * 100.0).round() as i64, // {{toPaisa}} // @step:to-paisa
            currency: "BDT".into(),
            reference: new_ref(),
        });
        if res.status != "OK" { return Err(PaymentError::Declined); } // @step:check-status
        Ok(Receipt { method: "Padma Bank", total: amount, txn: res.txn_id }) // {{toReceipt}} // @step:to-receipt
    }
}

// {{client}}
pub struct Checkout { processor: Box<dyn PaymentProcessor> }

impl Checkout {
    pub fn pay(&self, amount: f64) -> Result<Receipt, PaymentError> {
        self.processor.pay(amount) // {{onlyTarget}} // @step:client-pay
    }
}

// {{usage}}
let checkout = Checkout { processor: processor_for(&order) }; // @step:wire
let receipt = checkout.pay(order.total)?; // @step:order,done
`

const without = `
// {{withoutIntro}}
fn checkout(order: &Order) -> Result<Receipt, PaymentError> { // @step:l1-call
    let res = padma.make_transfer(TransferRequest { // {{withoutShape}} // @step:l1-method
        amount_in_paisa: (order.total * 100.0).round() as i64, // {{withoutPaisa}} // @step:l1-amount
        currency: "BDT".into(),
        reference: order.id.clone(),
    });
    if res.status != "OK" { return Err(PaymentError::Declined); } // @step:l1-result
    Ok(Receipt { method: "Padma Bank", total: order.total, txn: res.txn_id }) // @step:l1-check
}
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
pub struct JamunaWalletAdapter { wallet: JamunaWalletSdk } // @step:build-adapter

impl PaymentProcessor for JamunaWalletAdapter {
    fn pay(&self, amount: f64) -> Result<Receipt, PaymentError> { // @step:j-pay
        let ok = self.wallet.debit(&format!("{amount:.2}"), "BDT"); // {{toText}} // @step:build-adapter,j-translate
        if !ok { return Err(PaymentError::Declined); } // @step:j-check
        Ok(Receipt { method: "Jamuna Wallet", total: amount, txn: new_ref() }) // @step:j-receipt
    }
}

// {{withSame}}
let checkout = Checkout { processor: Box::new(JamunaWalletAdapter { wallet: JamunaWalletSdk::new() }) }; // @step:j-wire
checkout.pay(780.0)?; // @step:j-order,j-done
`

export const rust: CodeSet = {
  main: { filename: 'payments.rs', source: main },
  without: { filename: 'payments_without_adapter.rs', source: without },
  with: { filename: 'payments_with_adapter.rs', source: withPattern },
}

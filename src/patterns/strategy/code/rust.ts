import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
pub struct Receipt { pub method: &'static str, pub amount: f64, pub fee: f64, pub total: f64 }

// {{interface}}
pub trait PaymentStrategy {
    fn pay(&self, amount: f64) -> Receipt;
}

pub struct BkashPayment;
impl PaymentStrategy for BkashPayment {
    fn pay(&self, amount: f64) -> Receipt {
        let fee = amount * 0.0185; // {{bkashFee}} // @step:bkash-fee
        verify_otp(&customer.phone); // @step:bkash-otp
        confirm_pin(&customer.phone); // @step:bkash-pin
        Receipt { method: "bKash", amount, fee, total: amount + fee } // @step:bkash-receipt
    }
}

pub struct NagadPayment;
impl PaymentStrategy for NagadPayment {
    fn pay(&self, amount: f64) -> Receipt {
        let fee = amount * 0.01; // {{nagadFee}} // @step:nagad-fee
        verify_otp(&customer.phone); // @step:nagad-otp
        Receipt { method: "Nagad", amount, fee, total: amount + fee } // @step:nagad-receipt
    }
}

pub struct CardPayment;
impl PaymentStrategy for CardPayment {
    fn pay(&self, amount: f64) -> Receipt {
        let fee = amount * 0.025; // {{cardFee}} // @step:card-fee
        run_3d_secure(&customer.card); // @step:card-3ds
        authorize_with_bank(&customer.card, amount + fee); // @step:card-bank
        Receipt { method: "Card", amount, fee, total: amount + fee } // @step:card-receipt
    }
}

// {{context}}
pub struct Checkout {
    strategy: Box<dyn PaymentStrategy>,
}

impl Checkout {
    // {{swap}}
    pub fn set_strategy(&mut self, strategy: Box<dyn PaymentStrategy>) {
        self.strategy = strategy; // @step:set-strategy
    }

    pub fn pay(&self, amount: f64) -> Receipt {
        // {{delegate}}
        self.strategy.pay(amount) // @step:delegate
    }
}

// {{usage}}
let mut checkout = Checkout { strategy: Box::new(BkashPayment) };
checkout.set_strategy(selected_method); // @step:set-strategy
let receipt = checkout.pay(1250.0); // @step:client-pay,done
`

const without = `
// {{withoutIntro}}
fn checkout(amount: f64, method: &'static str) -> Result<Receipt, String> {
    let fee = match method {
        "bkash" => {
            verify_otp(&customer.phone);
            confirm_pin(&customer.phone);
            amount * 0.0185
        }
        "nagad" => {
            verify_otp(&customer.phone);
            amount * 0.01
        }
        "card" => {
            let fee = amount * 0.025;
            run_3d_secure(&customer.card);
            authorize_with_bank(&customer.card, amount + fee);
            fee
        }
        other => return Err(format!("Unknown payment method: {other}")),
    };
    // {{withoutTodo}}

    Ok(Receipt { method, amount, fee, total: amount + fee })
}
`

const withPattern = `
// {{withAdd}}
pub struct RocketPayment;
impl PaymentStrategy for RocketPayment {
    fn pay(&self, amount: f64) -> Receipt {
        let fee = amount * 0.018;
        verify_otp(&customer.phone);
        Receipt { method: "Rocket", amount, fee, total: amount + fee }
    }
}

let mut checkout = Checkout { strategy: Box::new(BkashPayment) };
checkout.pay(1250.0);

checkout.set_strategy(Box::new(RocketPayment)); // {{withSwap}}
checkout.pay(1250.0);
`

export const rust: CodeSet = {
  main: { filename: 'checkout.rs', source: main },
  without: { filename: 'checkout_without_strategy.rs', source: without },
  with: { filename: 'checkout_with_strategy.rs', source: withPattern },
}

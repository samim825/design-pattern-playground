import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
struct Receipt { let method: String; let amount, fee, total: Double }

// {{interface}}
protocol PaymentStrategy {
    func pay(_ amount: Double) -> Receipt
}

struct BkashPayment: PaymentStrategy {
    func pay(_ amount: Double) -> Receipt {
        let fee = amount * 0.0185 // {{bkashFee}} // @step:bkash-fee
        verifyOTP(customer.phone) // @step:bkash-otp
        confirmPIN(customer.phone) // @step:bkash-pin
        return Receipt(method: "bKash", amount: amount, fee: fee, total: amount + fee) // @step:bkash-receipt
    }
}

struct NagadPayment: PaymentStrategy {
    func pay(_ amount: Double) -> Receipt {
        let fee = amount * 0.01 // {{nagadFee}} // @step:nagad-fee
        verifyOTP(customer.phone) // @step:nagad-otp
        return Receipt(method: "Nagad", amount: amount, fee: fee, total: amount + fee) // @step:nagad-receipt
    }
}

struct CardPayment: PaymentStrategy {
    func pay(_ amount: Double) -> Receipt {
        let fee = amount * 0.025 // {{cardFee}} // @step:card-fee
        run3DSecure(customer.card) // @step:card-3ds
        authorizeWithBank(customer.card, amount + fee) // @step:card-bank
        return Receipt(method: "Card", amount: amount, fee: fee, total: amount + fee) // @step:card-receipt
    }
}

// {{context}}
final class Checkout {
    private var strategy: any PaymentStrategy

    init(strategy: any PaymentStrategy) { self.strategy = strategy }

    // {{swap}}
    func setStrategy(_ strategy: any PaymentStrategy) {
        self.strategy = strategy // @step:set-strategy
    }

    func pay(_ amount: Double) -> Receipt {
        // {{delegate}}
        strategy.pay(amount) // @step:delegate
    }
}

// {{usage}}
let checkout = Checkout(strategy: BkashPayment())
checkout.setStrategy(selectedMethod) // @step:set-strategy
let receipt = checkout.pay(1250) // @step:client-pay,done
`

const without = `
// {{withoutIntro}}
func checkout(amount: Double, method: String) throws -> Receipt { // @step:l1-start
    let fee: Double

    switch method {
    case "bkash": // @step:l1-bkash
        fee = amount * 0.0185
        verifyOTP(customer.phone) // @step:l1-bkash-otp
        confirmPIN(customer.phone) // @step:l1-bkash-pin
    case "nagad": // @step:l1-nagad
        fee = amount * 0.01
        verifyOTP(customer.phone) // @step:l1-nagad-otp
    case "card": // @step:l1-card
        fee = amount * 0.025
        run3DSecure(customer.card) // @step:l1-card-3ds
        authorizeWithBank(customer.card, amount + fee) // @step:l1-card-bank
    default:
        throw PaymentError.unknownMethod(method)
    }
    // {{withoutTodo}} // @step:l1-todo

    return Receipt(method: method, amount: amount, fee: fee, total: amount + fee) // @step:l1-result
}
`

const withPattern = `
// {{withAdd}}
struct RocketPayment: PaymentStrategy { // @step:build-strategy
    func pay(_ amount: Double) -> Receipt {
        let fee = amount * 0.018 // @step:rocket-fee
        verifyOTP(customer.phone) // @step:rocket-otp
        return Receipt(method: "Rocket", amount: amount, fee: fee, total: amount + fee) // @step:rocket-receipt
    }
}

let checkout = Checkout(strategy: BkashPayment())
checkout.pay(1250)

checkout.setStrategy(RocketPayment()) // {{withSwap}} // @step:build-plug,rocket-set
checkout.pay(1250) // @step:rocket-pay,rocket-done
`

export const swift: CodeSet = {
  main: { filename: 'Checkout.swift', source: main },
  without: { filename: 'CheckoutWithoutStrategy.swift', source: without },
  with: { filename: 'CheckoutWithStrategy.swift', source: withPattern },
}

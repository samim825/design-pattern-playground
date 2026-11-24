import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
type Receipt struct {
    Method             string
    Amount, Fee, Total float64
}

// {{interface}}
type PaymentStrategy interface {
    Pay(amount float64) Receipt
}

type BkashPayment struct{}

func (BkashPayment) Pay(amount float64) Receipt {
    fee := amount * 0.0185 // {{bkashFee}} // @step:bkash-fee
    verifyOTP(customer.Phone) // @step:bkash-otp
    confirmPIN(customer.Phone) // @step:bkash-pin
    return Receipt{"bKash", amount, fee, amount + fee} // @step:bkash-receipt
}

type NagadPayment struct{}

func (NagadPayment) Pay(amount float64) Receipt {
    fee := amount * 0.01 // {{nagadFee}} // @step:nagad-fee
    verifyOTP(customer.Phone) // @step:nagad-otp
    return Receipt{"Nagad", amount, fee, amount + fee} // @step:nagad-receipt
}

type CardPayment struct{}

func (CardPayment) Pay(amount float64) Receipt {
    fee := amount * 0.025 // {{cardFee}} // @step:card-fee
    run3DSecure(customer.Card) // @step:card-3ds
    authorizeWithBank(customer.Card, amount+fee) // @step:card-bank
    return Receipt{"Card", amount, fee, amount + fee} // @step:card-receipt
}

// {{context}}
type Checkout struct {
    strategy PaymentStrategy
}

// {{swap}}
func (c *Checkout) SetStrategy(s PaymentStrategy) {
    c.strategy = s // @step:set-strategy
}

func (c *Checkout) Pay(amount float64) Receipt {
    // {{delegate}}
    return c.strategy.Pay(amount) // @step:delegate
}

// {{usage}}
checkout := &Checkout{strategy: BkashPayment{}}
checkout.SetStrategy(selectedMethod) // @step:set-strategy
receipt := checkout.Pay(1250) // @step:client-pay,done
`

const without = `
// {{withoutIntro}}
func checkout(amount float64, method string) (Receipt, error) { // @step:l1-start
    var fee float64

    switch method {
    case "bkash": // @step:l1-bkash
        fee = amount * 0.0185
        verifyOTP(customer.Phone) // @step:l1-bkash-otp
        confirmPIN(customer.Phone) // @step:l1-bkash-pin
    case "nagad": // @step:l1-nagad
        fee = amount * 0.01
        verifyOTP(customer.Phone) // @step:l1-nagad-otp
    case "card": // @step:l1-card
        fee = amount * 0.025
        run3DSecure(customer.Card) // @step:l1-card-3ds
        authorizeWithBank(customer.Card, amount+fee) // @step:l1-card-bank
    default:
        return Receipt{}, errors.New("unknown payment method: " + method)
    }
    // {{withoutTodo}} // @step:l1-todo

    return Receipt{method, amount, fee, amount + fee}, nil // @step:l1-result
}
`

const withPattern = `
// {{withAdd}}
type RocketPayment struct{} // @step:build-strategy

func (RocketPayment) Pay(amount float64) Receipt {
    fee := amount * 0.018 // @step:rocket-fee
    verifyOTP(customer.Phone) // @step:rocket-otp
    return Receipt{"Rocket", amount, fee, amount + fee} // @step:rocket-receipt
}

checkout := &Checkout{strategy: BkashPayment{}}
checkout.Pay(1250)

checkout.SetStrategy(RocketPayment{}) // {{withSwap}} // @step:build-plug,rocket-set
checkout.Pay(1250) // @step:rocket-pay,rocket-done
`

export const go: CodeSet = {
  main: { filename: 'checkout.go', source: main },
  without: { filename: 'checkout_without_strategy.go', source: without },
  with: { filename: 'checkout_with_strategy.go', source: withPattern },
}

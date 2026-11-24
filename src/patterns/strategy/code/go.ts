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
func checkout(amount float64, method string) (Receipt, error) {
    var fee float64

    switch method {
    case "bkash":
        fee = amount * 0.0185
        verifyOTP(customer.Phone)
        confirmPIN(customer.Phone)
    case "nagad":
        fee = amount * 0.01
        verifyOTP(customer.Phone)
    case "card":
        fee = amount * 0.025
        run3DSecure(customer.Card)
        authorizeWithBank(customer.Card, amount+fee)
    default:
        return Receipt{}, errors.New("unknown payment method: " + method)
    }
    // {{withoutTodo}}

    return Receipt{method, amount, fee, amount + fee}, nil
}
`

const withPattern = `
// {{withAdd}}
type RocketPayment struct{}

func (RocketPayment) Pay(amount float64) Receipt {
    fee := amount * 0.018
    verifyOTP(customer.Phone)
    return Receipt{"Rocket", amount, fee, amount + fee}
}

checkout := &Checkout{strategy: BkashPayment{}}
checkout.Pay(1250)

checkout.SetStrategy(RocketPayment{}) // {{withSwap}}
checkout.Pay(1250)
`

export const go: CodeSet = {
  main: { filename: 'checkout.go', source: main },
  without: { filename: 'checkout_without_strategy.go', source: without },
  with: { filename: 'checkout_with_strategy.go', source: withPattern },
}

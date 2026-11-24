import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{target}}
type PaymentProcessor interface {
    Pay(amount float64) (Receipt, error)
}

// {{existing}}
type BkashProcessor struct{}

func (BkashProcessor) Pay(amount float64) (Receipt, error) { return bkash.Charge(amount) } // @step:bkash-pay

// {{adaptee}}
type PadmaBankSdk interface {
    MakeTransfer(req padma.TransferRequest) padma.TransferResult
}

// {{adapter}}
type PadmaBankAdapter struct{ sdk PadmaBankSdk }

func (a PadmaBankAdapter) Pay(amount float64) (Receipt, error) { // @step:adapter-pay
    res := a.sdk.MakeTransfer(padma.TransferRequest{ // {{translateCall}} // @step:translate
        AmountInPaisa: int64(math.Round(amount * 100)), // {{toPaisa}} // @step:to-paisa
        Currency:      "BDT",
        Ref:           newRef(),
    })
    if res.Status != "OK" { // @step:check-status
        return Receipt{}, ErrPaymentFailed
    }
    return Receipt{"Padma Bank", amount, res.TxnID}, nil // {{toReceipt}} // @step:to-receipt
}

// {{client}}
type Checkout struct{ processor PaymentProcessor }

func (c Checkout) Pay(amount float64) (Receipt, error) {
    return c.processor.Pay(amount) // {{onlyTarget}} // @step:client-pay
}

// {{usage}}
checkout := Checkout{processor: processorFor(order)} // @step:wire
receipt, err := checkout.Pay(order.Total) // @step:order,done
`

const without = `
// {{withoutIntro}}
func checkout(order Order) (Receipt, error) { // @step:l1-call
    res := padmaClient.MakeTransfer(padma.TransferRequest{ // {{withoutShape}} // @step:l1-method
        AmountInPaisa: int64(math.Round(order.Total * 100)), // {{withoutPaisa}} // @step:l1-amount
        Currency:      "BDT",
        Ref:           order.ID,
    })
    if res.Status != "OK" { // @step:l1-result
        return Receipt{}, ErrPaymentFailed
    }
    return Receipt{"Padma Bank", order.Total, res.TxnID}, nil // @step:l1-check
}
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
type JamunaWalletAdapter struct{ wallet JamunaWalletSdk } // @step:build-adapter

func (a JamunaWalletAdapter) Pay(amount float64) (Receipt, error) { // @step:j-pay
    ok := a.wallet.Debit(strconv.FormatFloat(amount, 'f', 2, 64), "BDT") // {{toText}} // @step:build-adapter,j-translate
    if !ok { // @step:j-check
        return Receipt{}, ErrPaymentFailed
    }
    return Receipt{"Jamuna Wallet", amount, newRef()}, nil // @step:j-receipt
}

// {{withSame}}
checkout := Checkout{processor: JamunaWalletAdapter{wallet: jamuna.NewClient()}} // @step:j-wire
checkout.Pay(780) // @step:j-order,j-done
`

export const go: CodeSet = {
  main: { filename: 'payments.go', source: main },
  without: { filename: 'payments_without_adapter.go', source: without },
  with: { filename: 'payments_with_adapter.go', source: withPattern },
}

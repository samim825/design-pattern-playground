import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{target}}
protocol PaymentProcessor {
    func pay(_ amount: Double) throws -> Receipt
}

// {{existing}}
struct BkashProcessor: PaymentProcessor {
    func pay(_ amount: Double) throws -> Receipt { try bkash.charge(amount) } // @step:bkash-pay
}

// {{adaptee}}
import PadmaBankSDK

// {{adapter}}
struct PadmaBankAdapter: PaymentProcessor {
    let sdk: PadmaBankSdk

    func pay(_ amount: Double) throws -> Receipt { // @step:adapter-pay
        let res = sdk.makeTransfer(TransferRequest( // {{translateCall}} // @step:translate
            amountInPaisa: Int((amount * 100).rounded()), // {{toPaisa}} // @step:to-paisa
            currency: "BDT",
            ref: newRef()))
        guard res.status == "OK" else { throw PaymentError.declined } // @step:check-status
        return Receipt(method: "Padma Bank", total: amount, txn: res.txnId) // {{toReceipt}} // @step:to-receipt
    }
}

// {{client}}
struct Checkout {
    let processor: any PaymentProcessor

    func pay(_ amount: Double) throws -> Receipt {
        try processor.pay(amount) // {{onlyTarget}} // @step:client-pay
    }
}

// {{usage}}
let checkout = Checkout(processor: processorFor(order)) // @step:wire
let receipt = try checkout.pay(order.total) // @step:order,done
`

const without = `
// {{withoutIntro}}
func checkout(_ order: Order) throws -> Receipt { // @step:l1-call
    let res = padma.makeTransfer(TransferRequest( // {{withoutShape}} // @step:l1-method
        amountInPaisa: Int((order.total * 100).rounded()), // {{withoutPaisa}} // @step:l1-amount
        currency: "BDT",
        ref: order.id))
    guard res.status == "OK" else { throw PaymentError.declined } // @step:l1-result
    return Receipt(method: "Padma Bank", total: order.total, txn: res.txnId) // @step:l1-check
}
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
struct JamunaWalletAdapter: PaymentProcessor { // @step:build-adapter
    let wallet: JamunaWalletSdk

    func pay(_ amount: Double) throws -> Receipt { // @step:j-pay
        let ok = wallet.debit(String(format: "%.2f", amount), currency: "BDT") // {{toText}} // @step:build-adapter,j-translate
        guard ok else { throw PaymentError.declined } // @step:j-check
        return Receipt(method: "Jamuna Wallet", total: amount, txn: newRef()) // @step:j-receipt
    }
}

// {{withSame}}
let checkout = Checkout(processor: JamunaWalletAdapter(wallet: JamunaWalletSdk())) // @step:j-wire
try checkout.pay(780) // @step:j-order,j-done
`

export const swift: CodeSet = {
  main: { filename: 'Payments.swift', source: main },
  without: { filename: 'PaymentsWithoutAdapter.swift', source: without },
  with: { filename: 'PaymentsWithAdapter.swift', source: withPattern },
}

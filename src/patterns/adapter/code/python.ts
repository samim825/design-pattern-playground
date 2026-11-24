import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
from typing import Protocol

# {{target}}
class PaymentProcessor(Protocol):
    def pay(self, amount: float) -> Receipt: ...

# {{existing}}
class BkashProcessor:
    def pay(self, amount: float) -> Receipt:
        return bkash.charge(amount)  # @step:bkash-pay

# {{adaptee}}
from padma_bank import PadmaBankSdk

# {{adapter}}
class PadmaBankAdapter:
    def __init__(self, sdk: PadmaBankSdk) -> None:
        self._sdk = sdk

    def pay(self, amount: float) -> Receipt:  # @step:adapter-pay
        res = self._sdk.make_transfer(  # {{translateCall}}  # @step:translate
            amount_in_paisa=round(amount * 100),  # {{toPaisa}}  # @step:to-paisa
            currency="BDT",
            ref=new_ref(),
        )
        if res["status"] != "OK":  # @step:check-status
            raise PaymentError()
        return Receipt("Padma Bank", amount, res["txn_id"])  # {{toReceipt}}  # @step:to-receipt

# {{client}}
class Checkout:
    def __init__(self, processor: PaymentProcessor) -> None:
        self._processor = processor

    def pay(self, amount: float) -> Receipt:
        return self._processor.pay(amount)  # {{onlyTarget}}  # @step:client-pay

# {{usage}}
checkout = Checkout(processor_for(order))  # @step:wire
receipt = checkout.pay(order.total)  # @step:order,done
`

const without = `
# {{withoutIntro}}
def checkout(order: Order) -> Receipt:  # @step:l1-call
    res = padma.make_transfer(  # {{withoutShape}}  # @step:l1-method
        amount_in_paisa=round(order.total * 100),  # {{withoutPaisa}}  # @step:l1-amount
        currency="BDT",
        ref=order.id,
    )
    if res["status"] != "OK":  # @step:l1-result
        raise PaymentError()
    return Receipt("Padma Bank", order.total, res["txn_id"])  # @step:l1-check
# {{withoutTodo}}  # @step:l1-todo
`

const withPattern = `
# {{withAdd}}
class JamunaWalletAdapter:  # @step:build-adapter
    def __init__(self, wallet: JamunaWalletSdk) -> None:
        self._wallet = wallet

    def pay(self, amount: float) -> Receipt:  # @step:j-pay
        ok = self._wallet.debit(f"{amount:.2f}", "BDT")  # {{toText}}  # @step:build-adapter,j-translate
        if not ok:  # @step:j-check
            raise PaymentError()
        return Receipt("Jamuna Wallet", amount, new_ref())  # @step:j-receipt

# {{withSame}}
checkout = Checkout(JamunaWalletAdapter(JamunaWalletSdk()))  # @step:j-wire
checkout.pay(780)  # @step:j-order,j-done
`

export const python: CodeSet = {
  main: { filename: 'payments.py', source: main },
  without: { filename: 'payments_without_adapter.py', source: without },
  with: { filename: 'payments_with_adapter.py', source: withPattern },
}

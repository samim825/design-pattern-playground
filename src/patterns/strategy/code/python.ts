import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
from dataclasses import dataclass
from typing import Protocol

@dataclass
class Receipt:
    method: str
    amount: float
    fee: float
    total: float

# {{interface}}
class PaymentStrategy(Protocol):
    def pay(self, amount: float) -> Receipt: ...

class BkashPayment:
    def pay(self, amount: float) -> Receipt:
        fee = amount * 0.0185  # {{bkashFee}} # @step:bkash-fee
        verify_otp(customer.phone)  # @step:bkash-otp
        confirm_pin(customer.phone)  # @step:bkash-pin
        return Receipt("bKash", amount, fee, amount + fee)  # @step:bkash-receipt

class NagadPayment:
    def pay(self, amount: float) -> Receipt:
        fee = amount * 0.01  # {{nagadFee}} # @step:nagad-fee
        verify_otp(customer.phone)  # @step:nagad-otp
        return Receipt("Nagad", amount, fee, amount + fee)  # @step:nagad-receipt

class CardPayment:
    def pay(self, amount: float) -> Receipt:
        fee = amount * 0.025  # {{cardFee}} # @step:card-fee
        run_3d_secure(customer.card)  # @step:card-3ds
        authorize_with_bank(customer.card, amount + fee)  # @step:card-bank
        return Receipt("Card", amount, fee, amount + fee)  # @step:card-receipt

# {{context}}
class Checkout:
    def __init__(self, strategy: PaymentStrategy):
        self._strategy = strategy

    # {{swap}}
    def set_strategy(self, strategy: PaymentStrategy) -> None:
        self._strategy = strategy  # @step:set-strategy

    def pay(self, amount: float) -> Receipt:
        # {{delegate}}
        return self._strategy.pay(amount)  # @step:delegate

# {{usage}}
checkout = Checkout(BkashPayment())
checkout.set_strategy(selected_method)  # @step:set-strategy
receipt = checkout.pay(1250)  # @step:client-pay,done
`

const without = `
# {{withoutIntro}}
def checkout(amount: float, method: str) -> Receipt:  # @step:l1-start
    if method == "bkash":  # @step:l1-bkash
        fee = amount * 0.0185
        verify_otp(customer.phone)  # @step:l1-bkash-otp
        confirm_pin(customer.phone)  # @step:l1-bkash-pin
    elif method == "nagad":  # @step:l1-nagad
        fee = amount * 0.01
        verify_otp(customer.phone)  # @step:l1-nagad-otp
    elif method == "card":  # @step:l1-card
        fee = amount * 0.025
        run_3d_secure(customer.card)  # @step:l1-card-3ds
        authorize_with_bank(customer.card, amount + fee)  # @step:l1-card-bank
    else:
        raise ValueError("Unknown payment method: " + method)
    # {{withoutTodo}}  # @step:l1-todo

    return Receipt(method, amount, fee, amount + fee)  # @step:l1-result

checkout(1250, "bkash")
`

const withPattern = `
# {{withAdd}}
class RocketPayment:  # @step:build-strategy
    def pay(self, amount: float) -> Receipt:
        fee = amount * 0.018  # @step:rocket-fee
        verify_otp(customer.phone)  # @step:rocket-otp
        return Receipt("Rocket", amount, fee, amount + fee)  # @step:rocket-receipt

checkout = Checkout(BkashPayment())
checkout.pay(1250)

checkout.set_strategy(RocketPayment())  # {{withSwap}}  # @step:build-plug,rocket-set
checkout.pay(1250)  # @step:rocket-pay,rocket-done
`

export const python: CodeSet = {
  main: { filename: 'checkout.py', source: main },
  without: { filename: 'checkout_without_strategy.py', source: without },
  with: { filename: 'checkout_with_strategy.py', source: withPattern },
}

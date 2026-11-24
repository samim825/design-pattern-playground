import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
Receipt = Data.define(:payment_method, :amount, :fee, :total)

# {{interface}}
module PaymentStrategy
  def pay(amount) = raise(NotImplementedError)
end

class BkashPayment
  include PaymentStrategy

  def pay(amount)
    fee = amount * 0.0185 # {{bkashFee}} # @step:bkash-fee
    verify_otp(customer.phone) # @step:bkash-otp
    confirm_pin(customer.phone) # @step:bkash-pin
    Receipt.new("bKash", amount, fee, amount + fee) # @step:bkash-receipt
  end
end

class NagadPayment
  include PaymentStrategy

  def pay(amount)
    fee = amount * 0.01 # {{nagadFee}} # @step:nagad-fee
    verify_otp(customer.phone) # @step:nagad-otp
    Receipt.new("Nagad", amount, fee, amount + fee) # @step:nagad-receipt
  end
end

class CardPayment
  include PaymentStrategy

  def pay(amount)
    fee = amount * 0.025 # {{cardFee}} # @step:card-fee
    run_3d_secure(customer.card) # @step:card-3ds
    authorize_with_bank(customer.card, amount + fee) # @step:card-bank
    Receipt.new("Card", amount, fee, amount + fee) # @step:card-receipt
  end
end

# {{context}}
class Checkout
  def initialize(strategy)
    @strategy = strategy
  end

  # {{swap}}
  def strategy=(strategy)
    @strategy = strategy # @step:set-strategy
  end

  def pay(amount)
    # {{delegate}}
    @strategy.pay(amount) # @step:delegate
  end
end

# {{usage}}
checkout = Checkout.new(BkashPayment.new)
checkout.strategy = selected_method # @step:set-strategy
receipt = checkout.pay(1250) # @step:client-pay,done
`

const without = `
# {{withoutIntro}}
def checkout(amount, method) # @step:l1-start
  case method
  when "bkash" # @step:l1-bkash
    fee = amount * 0.0185
    verify_otp(customer.phone) # @step:l1-bkash-otp
    confirm_pin(customer.phone) # @step:l1-bkash-pin
  when "nagad" # @step:l1-nagad
    fee = amount * 0.01
    verify_otp(customer.phone) # @step:l1-nagad-otp
  when "card" # @step:l1-card
    fee = amount * 0.025
    run_3d_secure(customer.card) # @step:l1-card-3ds
    authorize_with_bank(customer.card, amount + fee) # @step:l1-card-bank
  else
    raise ArgumentError, "Unknown payment method: " + method
  end
  # {{withoutTodo}} # @step:l1-todo

  Receipt.new(method, amount, fee, amount + fee) # @step:l1-result
end
`

const withPattern = `
# {{withAdd}}
class RocketPayment # @step:build-strategy
  include PaymentStrategy

  def pay(amount)
    fee = amount * 0.018 # @step:rocket-fee
    verify_otp(customer.phone) # @step:rocket-otp
    Receipt.new("Rocket", amount, fee, amount + fee) # @step:rocket-receipt
  end
end

checkout = Checkout.new(BkashPayment.new)
checkout.pay(1250)

checkout.strategy = RocketPayment.new # {{withSwap}} # @step:build-plug,rocket-set
checkout.pay(1250) # @step:rocket-pay,rocket-done
`

export const ruby: CodeSet = {
  main: { filename: 'checkout.rb', source: main },
  without: { filename: 'checkout_without_strategy.rb', source: without },
  with: { filename: 'checkout_with_strategy.rb', source: withPattern },
}

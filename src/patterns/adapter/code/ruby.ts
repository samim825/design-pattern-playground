import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
# {{target}}
module PaymentProcessor
  def pay(amount) = raise(NotImplementedError)
end

# {{existing}}
class BkashProcessor
  include PaymentProcessor
  def pay(amount) = Bkash.charge(amount) # @step:bkash-pay
end

# {{adaptee}}
require "padma_bank"

# {{adapter}}
class PadmaBankAdapter
  include PaymentProcessor

  def initialize(sdk)
    @sdk = sdk
  end

  def pay(amount) # @step:adapter-pay
    res = @sdk.make_transfer( # {{translateCall}} # @step:translate
      amount_in_paisa: (amount * 100).round, # {{toPaisa}} # @step:to-paisa
      currency: "BDT",
      ref: new_ref
    )
    raise PaymentError unless res[:status] == "OK" # @step:check-status
    Receipt.new("Padma Bank", amount, res[:txn_id]) # {{toReceipt}} # @step:to-receipt
  end
end

# {{client}}
class Checkout
  def initialize(processor)
    @processor = processor
  end

  def pay(amount)
    @processor.pay(amount) # {{onlyTarget}} # @step:client-pay
  end
end

# {{usage}}
checkout = Checkout.new(processor_for(order)) # @step:wire
receipt = checkout.pay(order.total) # @step:order,done
`

const without = `
# {{withoutIntro}}
def checkout(order) # @step:l1-call
  res = padma.make_transfer( # {{withoutShape}} # @step:l1-method
    amount_in_paisa: (order.total * 100).round, # {{withoutPaisa}} # @step:l1-amount
    currency: "BDT",
    ref: order.id
  )
  raise PaymentError unless res[:status] == "OK" # @step:l1-result
  Receipt.new("Padma Bank", order.total, res[:txn_id]) # @step:l1-check
end
# {{withoutTodo}} # @step:l1-todo
`

const withPattern = `
# {{withAdd}}
class JamunaWalletAdapter # @step:build-adapter
  include PaymentProcessor

  def initialize(wallet)
    @wallet = wallet
  end

  def pay(amount) # @step:j-pay
    ok = @wallet.debit(format("%.2f", amount), "BDT") # {{toText}} # @step:build-adapter,j-translate
    raise PaymentError unless ok # @step:j-check
    Receipt.new("Jamuna Wallet", amount, new_ref) # @step:j-receipt
  end
end

# {{withSame}}
checkout = Checkout.new(JamunaWalletAdapter.new(JamunaWallet::Sdk.new)) # @step:j-wire
checkout.pay(780) # @step:j-order,j-done
`

export const ruby: CodeSet = {
  main: { filename: 'payments.rb', source: main },
  without: { filename: 'payments_without_adapter.rb', source: without },
  with: { filename: 'payments_with_adapter.rb', source: withPattern },
}

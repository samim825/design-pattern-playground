import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Ruby: duck typing, so "the same interface" is an OrderCommand module whose methods raise
// NotImplementedError; each slip is a Data class that includes it.

const main = `
# {{command}}
module OrderCommand
  def price = raise(NotImplementedError) # {{slipPrice}}
  def execute = raise(NotImplementedError) # {{doIt}}
  def undo = raise(NotImplementedError) # {{undoIt}}
end

# {{receiver}}
class Kitchen
  def cook(dish, table); end # {{realWork}} # @step:cook
  def take_back(dish, table); end # @step:uncook
  def add_chili(dish, table); end
  def remove_chili(dish, table); end
end

# {{concrete}}
CookDishCommand = Data.define(:kitchen, :dish, :table, :price) do # {{holdsReceiver}}
  include OrderCommand
  def execute = kitchen.cook(dish, table) # {{delegates}} # @step:exec
  def undo = kitchen.take_back(dish, table) # {{reverses}} # @step:undo-exec
end

# {{invoker}}
class OrderRail
  def initialize
    @queue = [] # {{queueField}}
    @history = [] # {{historyField}} # @step:tear
  end

  def pin(slip) = @queue.push(slip) # {{waits}} # @step:pin

  def run_next
    slip = @queue.shift or return # {{inOrder}} # @step:run
    slip.execute # {{blind}} # @step:run
    @history.push(slip) # {{remember}} # @step:cook
  end

  def undo_last = @history.pop&.undo # {{lastFirst}} # @step:undo
  def bill = @history.sum(&:price) # {{billFromHistory}} # @step:bill
end

# {{client}}
kitchen = Kitchen.new
rail = OrderRail.new
rail.pin(CookDishCommand.new(kitchen, "kacchi", 4, 350)) # {{writeSlip}} # @step:write
rail.run_next # {{railRuns}} # @step:run
rail.undo_last # {{cancelIsUndo}} # @step:cancel
`

const without = `
# {{withoutIntro}}
class Waiter
  def initialize(kitchen)
    @kitchen = kitchen # {{knowsKitchen}}
    @bill = 0 # {{billInHead}}
  end

  def take_order(dish, table, price) # @step:l1-order
    case dish
    when "kacchi" then @kitchen.cook_kacchi(table) # {{shoutNow}} # @step:l1-kacchi
    when "roast" then @kitchen.cook_roast(table) # @step:l1-roast
    else @kitchen.serve_cold(dish, table) # {{busyLost}} # @step:l1-cold
    end
    @bill += price # @step:l1-bill
  end

  def cancel(dish, table, price) # {{noRecord}} # @step:l1-cancel
    @kitchen.throw_away(dish, table) # {{hopeRight}} # @step:l1-undo
    @bill -= price # {{fixByHand}} # @step:l1-bill
  end
end
# {{withoutCopy}} # @step:l1-copy
`

const withPattern = `
# {{withAdd}}
MakeSpicyCommand = Data.define(:kitchen, :dish, :table) do # {{askReceiver}} # @step:build-receiver
  include OrderCommand # {{sameInterface}} # @step:build-class
  def price = 20 # {{chiliPrice}}
  def execute = kitchen.add_chili(dish, table) # {{chiliOn}} # @step:spicy-exec
  def undo = kitchen.remove_chili(dish, table) # {{chiliOff}} # @step:spicy-undo
end

# {{othersSame}}
class OrderRail; end # @step:rail-same
CookDishCommand = Data.define(:kitchen, :dish, :table, :price) # @step:cook-same

# {{withUse}}
rail.pin(CookDishCommand.new(kitchen, "kacchi", 4, 350)) # @step:l3-order
rail.pin(MakeSpicyCommand.new(kitchen, "kacchi", 4)) # {{newSlip}} # @step:l3-spicy
rail.run_next # {{sameRail}} # @step:l3-run
rail.undo_last # {{tooHot}} # @step:l3-undo
# {{withZero}}
`

export const ruby: CodeSet = {
  main: { filename: 'order_rail.rb', source: main },
  without: { filename: 'orders_without_command.rb', source: without },
  with: { filename: 'orders_with_command.rb', source: withPattern },
}

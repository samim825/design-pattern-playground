import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Ruby uses duck typing: anything that answers #cost and #describe is a Snack (the module only
// documents the contract), and Topping just keeps the wrapped snack in @inner.

const main = `
# {{component}}
module Snack
  def cost = raise(NotImplementedError)
  def describe = raise(NotImplementedError)
end

# {{concrete}}
class Fuchka
  include Snack
  def cost = 60 # {{basePrice}} # @step:core
  def describe = "Fuchka" # @step:describe
end

# {{decorator}}
class Topping
  include Snack
  def initialize(inner)
    @inner = inner # {{wrapsAny}} # @step:wrap-egg,wrap-chanachur,wrap-spicy
  end
end

# {{concreteDecorators}}
class Egg < Topping
  def cost = @inner.cost + 20 # {{passIn}} # @step:in-egg,out-egg
  def describe = @inner.describe + " + egg" # @step:describe
end

class Chanachur < Topping
  def cost = @inner.cost + 10 # @step:in-chanachur,out-chanachur
  def describe = @inner.describe + " + chanachur" # @step:describe
end

class ExtraSpicy < Topping
  def cost = @inner.cost + 5 # @step:in-spicy,out-spicy
  def describe = @inner.describe + " + extra spicy" # @step:describe
end

# {{usage}}
plate = Fuchka.new # @step:base
plate = Egg.new(plate) # {{wrapLayer}} # @step:wrap-egg
plate = Chanachur.new(plate) # @step:wrap-chanachur
plate = ExtraSpicy.new(plate) # @step:wrap-spicy

total = plate.cost # {{oneCall}} # @step:call,done
receipt = plate.describe # {{sameTrip}} # @step:describe
`

const without = `
# {{withoutIntro}}
class Fuchka
  def cost = 60
  def describe = "Fuchka"
end

class FuchkaWithEgg < Fuchka
  def cost = 80 # {{hardcoded}} # @step:l1-cost
  def describe = "Fuchka + egg" # @step:l1-describe
end

class FuchkaWithSpicy < Fuchka
  def cost = 65 # @step:l1-cost
  def describe = "Fuchka + extra spicy" # @step:l1-describe
end

# {{withoutCopy}}
class FuchkaWithEggAndSpicy < Fuchka # @step:l1-write
  def cost = 85 # {{copyPrice}} # @step:l1-cost
  def describe = "Fuchka + egg + extra spicy" # @step:l1-describe
end

# {{withoutPick}}
plate = FuchkaWithEggAndSpicy.new # @step:l1-pick
serve(karim, plate.describe, plate.cost) # @step:l1-serve,l1-result
# {{withoutTodo}} # @step:l1-count
`

const withPattern = `
# {{withAdd}}
class TokDoi < Topping # @step:build-class
  def cost = @inner.cost + 30 # {{onlyNew}} # @step:build-cost,in-tokdoi,out-tokdoi
  def describe = @inner.describe + " + tok-doi" # @step:build-cost,describe-new
end

# {{withSame}}
plate = Fuchka.new # @step:base-new
plate = TokDoi.new(plate) # {{justWrap}} # @step:wrap-tokdoi
plate = Chanachur.new(plate) # {{oldStillWork}} # @step:wrap-old

total = plate.cost # {{costUnchanged}} # @step:call-new,inner-old,done-new
receipt = plate.describe # @step:describe-new

# {{withZero}}
`

export const ruby: CodeSet = {
  main: { filename: 'fuchka.rb', source: main },
  without: { filename: 'fuchka_without_decorator.rb', source: without },
  with: { filename: 'fuchka_with_decorator.rb', source: withPattern },
}

import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
# {{context}}
Cart = Data.define(:total, :category)

# {{abstract}}
module Rule
  def interpret(cart) = raise(NotImplementedError)
end

# {{terminal}}
TotalAbove = Data.define(:amount) do
  include Rule
  def interpret(cart) = cart.total > amount # {{readsTotal}} # @step:total
end

CategoryIs = Data.define(:name) do
  include Rule
  def interpret(cart) = cart.category == name # {{readsCategory}} # @step:category
end

# {{nonterminal}}
And = Data.define(:left, :right) do # {{holdsRules}}
  include Rule

  def interpret(cart)
    left.interpret(cart) && # {{asksLeft}} # @step:and-left
      right.interpret(cart) # {{shortCircuit}} # @step:and-combine
  end
end

# {{client}}
def checkout(cart, rule, percent)
  ok = rule.interpret(cart) # {{oneCall}} # @step:interpret
  ok ? cart.total * (100 - percent) / 100 : cart.total # {{payOrNot}} # @step:result
end

rule = And.new(CategoryIs.new("saree"), TotalAbove.new(3000)) # {{buildTree}} # @step:build
checkout(Cart.new(3450, "saree"), rule, 10)
`

const without = `
# {{withoutIntro}}
def checkout(cart) # {{everyRuleHere}} # @step:l1-rule,l1-cart
  percent =
    if cart.total > 5000 then 15 # {{orderMatters}} # @step:l1-big
    elsif cart.category == "saree" && cart.total > 3000 then 10 # @step:l1-saree
    elsif cart.category == "panjabi" && cart.total > 2000 then 5 # @step:l1-panjabi
    else 0 # @step:l1-none
    end
  cart.total * (100 - percent) / 100 # @step:l1-pay
end

# {{redeploy}}
deploy(billing_app) # @step:l1-deploy
# {{withoutNext}}
`

const withPattern = `
# {{withAdd}}
Or = Data.define(:left, :right) do # {{sameInterface}} # @step:build-class
  include Rule

  def interpret(cart)
    left.interpret(cart) || # {{recursive}} # @step:build-recursive,or-left
      right.interpret(cart) # {{orShort}} # @step:or-combine
  end
end

# {{othersSame}}
And = Data.define(:left, :right) # @step:and-left,and-combine
TotalAbove = Data.define(:amount) # @step:total
CategoryIs = Data.define(:name) # @step:category

# {{withUse}}
eid = Or.new( # {{nested}} # @step:l3-build
  And.new(CategoryIs.new("saree"), TotalAbove.new(3000)),
  TotalAbove.new(5000)
)
ok = eid.interpret(cart) # {{sameCall}} # @step:interpret
price = ok ? cart.total * 90 / 100 : cart.total # @step:result
# {{withZero}}
`

export const ruby: CodeSet = {
  main: { filename: 'discount_rules.rb', source: main },
  without: { filename: 'checkout_without_interpreter.rb', source: without },
  with: { filename: 'discount_with_or.rb', source: withPattern },
}

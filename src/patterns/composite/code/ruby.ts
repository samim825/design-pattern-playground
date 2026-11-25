import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Ruby uses duck typing: anything that answers #price is a BazarItem (the module only documents
// the contract). Ruby drops the "get_" prefix on readers, so the method is just price.

const main = `
# {{component}}
module BazarItem
  def price = raise(NotImplementedError)
end

# {{leaf}}
class Item
  include BazarItem
  attr_reader :name

  def initialize(name, price)
    @name = name
    @price = price
  end

  def price = @price # {{leafPrice}} # @step:leaf
end

# {{composite}}
class Bag
  include BazarItem
  attr_reader :name

  def initialize(name)
    @name = name
    @children = []
  end

  def add(*items) # {{anyChild}}
    @children.concat(items)
    self
  end

  def price
    sum = 0 # @step:open
    @children.each do |child|
      sum += child.price # {{recurse}} # @step:recurse
    end
    sum # {{bagTotal}} # @step:bag-total
  end
end

# {{usage}}
fish_bag = Bag.new("Fish bag").add(Item.new("Ilish", 1200), Item.new("Rui", 450))
chili_bag = Bag.new("Chili bag").add(Item.new("Green chili", 40))
veg_bag = Bag.new("Vegetable bag").add(Item.new("Potato", 60), chili_bag) # {{bagInBag}}
order = Bag.new("Jute bag").add(fish_bag, veg_bag, Item.new("Eggs", 150))

picked = veg_bag # {{anyNode}} # @step:pick
bill = picked.price # {{sameCall}} # @step:call,done
`

const without = `
# {{withoutIntro}}
Item = Data.define(:name, :price)
Bag = Data.define(:items, :bags)

def bill_total(order)
  sum = 0
  order.items.each { |item| sum += item.price } # {{loopLoose}} # @step:l1-loop-1
  order.bags.each do |bag|
    bag.items.each { |item| sum += item.price } # {{loopBags}} # @step:l1-loop-2
    bag.bags.each do |inner| # {{withoutCopy}} # @step:l1-write-3
      inner.items.each { |item| sum += item.price } # @step:l1-loop-3
      inner.bags.each do |deeper| # {{copyAgain}} # @step:l1-write-4
        deeper.items.each { |item| sum += item.price } # @step:l1-loop-4
        # {{withoutTodo}} # @step:l1-skip
      end
    end
  end
  sum # @step:l1-total
end

# {{withoutUse}}
bill = bill_total(mitus_order) # @step:l1-call
charge(mitu, bill) # {{shortBill}} # @step:l1-result
`

const withPattern = `
# {{withAdd}}
class GiftBox # @step:build-class
  include BazarItem
  WRAP_FEE = 50 # {{wrapFee}}
  attr_reader :name

  def initialize(name)
    @name = name
    @children = []
  end

  def add(*items) = tap { @children.concat(items) }

  def price # @step:build-sum
    sum = WRAP_FEE # @step:build-sum,gift-open
    @children.each do |child|
      sum += child.price # {{sameRecursion}} # @step:build-sum,gift-child
    end
    sum # @step:build-sum,gift-total
  end
end

# {{withSame}}
eid_box = GiftBox.new("Eid gift box").add(Item.new("Semai", 120), Item.new("Sugar", 140)) # @step:gift-make
order = Bag.new("Jute bag").add(eid_box, Item.new("Milk", 90)) # {{justAChild}} # @step:gift-make
bill = order.price # {{billUnchanged}} # @step:gift-call,gift-outer,gift-done

# {{withZero}}
`

export const ruby: CodeSet = {
  main: { filename: 'bazar.rb', source: main },
  without: { filename: 'bazar_without_composite.rb', source: without },
  with: { filename: 'bazar_with_composite.rb', source: withPattern },
}

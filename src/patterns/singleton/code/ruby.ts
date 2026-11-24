import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Ruby's standard library also offers "include Singleton", which does the same as the code below.

const main = `
# {{singleton}}
class CashBox
  attr_reader :total

  @instance = nil # {{theOne}}

  private_class_method :new # {{noNew}} # @step:blocked

  def self.instance # @step:call
    @instance ||= new # {{firstTime}} # @step:check,create,return
  end

  def initialize
    @total = 0
  end

  def add(amount) = (@total += amount) # @step:add
end

# {{client}}
Salesperson = Struct.new(:name) do
  def ring_up(amount)
    box = CashBox.instance # {{sameBox}} # @step:call
    box.add(amount) # @step:add
  end
end

# {{usage}}
Salesperson.new("Rahim").ring_up(1500) # @step:sell
Salesperson.new("Mitu").ring_up(1200)
karim.count(CashBox.instance.total) # @step:count,done
`

const without = `
# {{withoutIntro}}
class CashBox
  attr_reader :total

  def initialize
    @total = 0
  end

  def add(amount) = (@total += amount) # @step:l1-add
end

shop_box = CashBox.new # {{withoutGlobal}} # @step:l1-open

rahim.box = shop_box # @step:l1-shared
mitu.box = CashBox.new # {{withoutAnyone}} # @step:l1-new
seller.box.add(sale.amount) # @step:l1-add

# {{withoutTodo}} # @step:l1-todo
karim.count(shop_box.total) # @step:l1-count
`

const withPattern = `
# {{withAdd}}
class BkashCounter # @step:build-counter
  def receive(amount) # @step:b-receive
    box = CashBox.instance # {{sameBox}} # @step:build-counter,b-call
    box.add(amount) # @step:b-add
  end
end

# {{withSame}}
BkashCounter.new.receive(2000) # @step:b-start
karim.count(CashBox.instance.total) # @step:b-count,b-done
`

export const ruby: CodeSet = {
  main: { filename: 'cash_box.rb', source: main },
  without: { filename: 'cash_box_without_singleton.rb', source: without },
  with: { filename: 'cash_box_with_singleton.rb', source: withPattern },
}

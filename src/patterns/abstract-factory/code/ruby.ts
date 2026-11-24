import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Ruby: each dish is a value of its product class; the kitchens (the factories) are what differ.

const main = `
# {{abstractProducts}}
class Dish
  attr_reader :name, :price

  def initialize(name, price)
    @name, @price = name, price
  end
end

class MainDish < Dish; end
class Side < Dish; end
class Dessert < Dish; end

# {{abstractFactory}}
class Kitchen
  def create_main = raise(NotImplementedError)
  def create_side = raise(NotImplementedError)
  def create_dessert = raise(NotImplementedError)
end

# {{concreteFactories}}
class DeshiKitchen < Kitchen
  def create_main = MainDish.new("Kacchi biryani", 320) # @step:deshi-main
  def create_side = Side.new("Borhani", 60) # @step:deshi-side
  def create_dessert = Dessert.new("Firni", 70) # @step:deshi-dessert
end

class ChineseKitchen < Kitchen
  def create_main = MainDish.new("Chicken fried rice", 300) # @step:chinese-main
  def create_side = Side.new("Corn soup", 140) # @step:chinese-side
  def create_dessert = Dessert.new("Custard pudding", 80) # @step:chinese-dessert
end

# {{client}}
def serve_combo(kitchen)
  main = kitchen.create_main # {{noNames}} # @step:deshi-main,chinese-main
  side = kitchen.create_side # @step:deshi-side,chinese-side
  dessert = kitchen.create_dessert # @step:deshi-dessert,chinese-dessert
  [main, side, dessert] # @step:serve
end

# {{usage}}
kitchen = KITCHENS.fetch(selected_cuisine) # @step:pick-kitchen
tray = serve_combo(kitchen) # @step:order,done
`

const without = `
# {{withoutIntro}}
def serve_combo(main, side, dessert) # @step:l1-start
  main_dish = create_dish(main) # @step:l1-main
  side_dish = create_dish(side) # @step:l1-side
  dessert_dish = create_dish(dessert) # @step:l1-dessert
  [main_dish, side_dish, dessert_dish] # @step:l1-result
end

def create_dish(name)
  case name
  when "kacchi" then MainDish.new("Kacchi biryani", 320)
  when "borhani" then Side.new("Borhani", 60)
  when "firni" then Dessert.new("Firni", 70)
  when "fried-rice" then MainDish.new("Chicken fried rice", 300)
  when "corn-soup" then Side.new("Corn soup", 140)
  when "pudding" then Dessert.new("Custard pudding", 80)
  else raise ArgumentError, "Unknown dish: #{name}"
  end
end

# {{withoutMix}}
serve_combo("kacchi", "corn-soup", "firni") # @step:l1-order
# {{withoutTodo}} # @step:l1-todo
`

const withPattern = `
# {{withAdd}}
class ThaiKitchen < Kitchen # @step:build-kitchen
  def create_main = MainDish.new("Pad thai", 380) # @step:thai-main
  def create_side = Side.new("Tom yum soup", 180) # @step:thai-side
  def create_dessert = Dessert.new("Mango sticky rice", 90) # @step:thai-dessert
end

# {{withSame}}
tray = serve_combo(ThaiKitchen.new) # @step:thai-order,thai-done
`

export const ruby: CodeSet = {
  main: { filename: 'restaurant.rb', source: main },
  without: { filename: 'restaurant_without_abstract_factory.rb', source: without },
  with: { filename: 'restaurant_with_abstract_factory.rb', source: withPattern },
}

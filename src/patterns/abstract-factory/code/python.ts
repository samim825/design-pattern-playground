import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
from abc import ABC, abstractmethod

# {{abstractProducts}}
class Dish(ABC):
    name: str
    price: int

class MainDish(Dish): ...
class Side(Dish): ...
class Dessert(Dish): ...

# {{concreteProducts}}
class Kacchi(MainDish): name, price = "Kacchi biryani", 320
class Borhani(Side): name, price = "Borhani", 60
class Firni(Dessert): name, price = "Firni", 70
class FriedRice(MainDish): name, price = "Chicken fried rice", 300
class CornSoup(Side): name, price = "Corn soup", 140
class Pudding(Dessert): name, price = "Custard pudding", 80

# {{abstractFactory}}
class Kitchen(ABC):
    @abstractmethod
    def create_main(self) -> MainDish: ...
    @abstractmethod
    def create_side(self) -> Side: ...
    @abstractmethod
    def create_dessert(self) -> Dessert: ...

# {{concreteFactories}}
class DeshiKitchen(Kitchen):
    def create_main(self) -> MainDish: return Kacchi()  # @step:deshi-main
    def create_side(self) -> Side: return Borhani()  # @step:deshi-side
    def create_dessert(self) -> Dessert: return Firni()  # @step:deshi-dessert

class ChineseKitchen(Kitchen):
    def create_main(self) -> MainDish: return FriedRice()  # @step:chinese-main
    def create_side(self) -> Side: return CornSoup()  # @step:chinese-side
    def create_dessert(self) -> Dessert: return Pudding()  # @step:chinese-dessert

# {{client}}
def serve_combo(kitchen: Kitchen) -> list[Dish]:
    main = kitchen.create_main()  # {{noNames}}  # @step:deshi-main,chinese-main
    side = kitchen.create_side()  # @step:deshi-side,chinese-side
    dessert = kitchen.create_dessert()  # @step:deshi-dessert,chinese-dessert
    return [main, side, dessert]  # @step:serve

# {{usage}}
kitchen: Kitchen = kitchens[selected_cuisine]  # @step:pick-kitchen
tray = serve_combo(kitchen)  # @step:order,done
`

const without = `
# {{withoutIntro}}
def serve_combo(main: str, side: str, dessert: str) -> list[Dish]:  # @step:l1-start
    main_dish = create_dish(main)  # @step:l1-main
    side_dish = create_dish(side)  # @step:l1-side
    dessert_dish = create_dish(dessert)  # @step:l1-dessert
    return [main_dish, side_dish, dessert_dish]  # @step:l1-result

def create_dish(name: str) -> Dish:
    match name:
        case "kacchi": return Kacchi()
        case "borhani": return Borhani()
        case "firni": return Firni()
        case "fried-rice": return FriedRice()
        case "corn-soup": return CornSoup()
        case "pudding": return Pudding()
    raise ValueError("Unknown dish: " + name)

# {{withoutMix}}
serve_combo("kacchi", "corn-soup", "firni")  # @step:l1-order
# {{withoutTodo}}  # @step:l1-todo
`

const withPattern = `
# {{withAdd}}
class PadThai(MainDish): name, price = "Pad thai", 380  # @step:build-kitchen
class TomYum(Side): name, price = "Tom yum soup", 180  # @step:build-kitchen
class MangoStickyRice(Dessert): name, price = "Mango sticky rice", 90  # @step:build-kitchen

class ThaiKitchen(Kitchen):  # @step:build-kitchen
    def create_main(self) -> MainDish: return PadThai()  # @step:thai-main
    def create_side(self) -> Side: return TomYum()  # @step:thai-side
    def create_dessert(self) -> Dessert: return MangoStickyRice()  # @step:thai-dessert

# {{withSame}}
tray = serve_combo(ThaiKitchen())  # @step:thai-order,thai-done
`

export const python: CodeSet = {
  main: { filename: 'restaurant.py', source: main },
  without: { filename: 'restaurant_without_abstract_factory.py', source: without },
  with: { filename: 'restaurant_with_abstract_factory.py', source: withPattern },
}

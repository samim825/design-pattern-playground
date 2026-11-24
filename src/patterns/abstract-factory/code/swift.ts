import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{abstractProducts}}
protocol Dish { var name: String { get }; var price: Int { get } }
protocol MainDish: Dish {}
protocol Side: Dish {}
protocol Dessert: Dish {}

// {{concreteProducts}}
struct Kacchi: MainDish { let name = "Kacchi biryani", price = 320 }
struct Borhani: Side { let name = "Borhani", price = 60 }
struct Firni: Dessert { let name = "Firni", price = 70 }
struct FriedRice: MainDish { let name = "Chicken fried rice", price = 300 }
struct CornSoup: Side { let name = "Corn soup", price = 140 }
struct Pudding: Dessert { let name = "Custard pudding", price = 80 }

// {{abstractFactory}}
protocol Kitchen {
    func createMain() -> any MainDish
    func createSide() -> any Side
    func createDessert() -> any Dessert
}

// {{concreteFactories}}
struct DeshiKitchen: Kitchen {
    func createMain() -> any MainDish { Kacchi() } // @step:deshi-main
    func createSide() -> any Side { Borhani() } // @step:deshi-side
    func createDessert() -> any Dessert { Firni() } // @step:deshi-dessert
}

struct ChineseKitchen: Kitchen {
    func createMain() -> any MainDish { FriedRice() } // @step:chinese-main
    func createSide() -> any Side { CornSoup() } // @step:chinese-side
    func createDessert() -> any Dessert { Pudding() } // @step:chinese-dessert
}

// {{client}}
func serveCombo(_ kitchen: any Kitchen) -> [any Dish] {
    let main = kitchen.createMain() // {{noNames}} // @step:deshi-main,chinese-main
    let side = kitchen.createSide() // @step:deshi-side,chinese-side
    let dessert = kitchen.createDessert() // @step:deshi-dessert,chinese-dessert
    return [main, side, dessert] // @step:serve
}

// {{usage}}
let kitchen: any Kitchen = kitchens[selectedCuisine]! // @step:pick-kitchen
let tray = serveCombo(kitchen) // @step:order,done
`

const without = `
// {{withoutIntro}}
func serveCombo(_ main: String, _ side: String, _ dessert: String) throws -> [any Dish] { // @step:l1-start
    let mainDish = try createDish(main) // @step:l1-main
    let sideDish = try createDish(side) // @step:l1-side
    let dessertDish = try createDish(dessert) // @step:l1-dessert
    return [mainDish, sideDish, dessertDish] // @step:l1-result
}

func createDish(_ name: String) throws -> any Dish {
    switch name {
    case "kacchi": return Kacchi()
    case "borhani": return Borhani()
    case "firni": return Firni()
    case "fried-rice": return FriedRice()
    case "corn-soup": return CornSoup()
    case "pudding": return Pudding()
    default: throw MenuError.unknownDish(name)
    }
}

// {{withoutMix}}
try serveCombo("kacchi", "corn-soup", "firni") // @step:l1-order
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
struct PadThai: MainDish { let name = "Pad thai", price = 380 } // @step:build-kitchen
struct TomYum: Side { let name = "Tom yum soup", price = 180 } // @step:build-kitchen
struct MangoStickyRice: Dessert { let name = "Mango sticky rice", price = 90 } // @step:build-kitchen

struct ThaiKitchen: Kitchen { // @step:build-kitchen
    func createMain() -> any MainDish { PadThai() } // @step:thai-main
    func createSide() -> any Side { TomYum() } // @step:thai-side
    func createDessert() -> any Dessert { MangoStickyRice() } // @step:thai-dessert
}

// {{withSame}}
let tray = serveCombo(ThaiKitchen()) // @step:thai-order,thai-done
`

export const swift: CodeSet = {
  main: { filename: 'Restaurant.swift', source: main },
  without: { filename: 'RestaurantWithoutAbstractFactory.swift', source: without },
  with: { filename: 'RestaurantWithAbstractFactory.swift', source: withPattern },
}

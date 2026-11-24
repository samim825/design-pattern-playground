import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Go has no classes: each product family member is a plain value of its product type,
// and the kitchens (the factories) are what differ.

const main = `
// {{abstractProducts}}
type Dish struct {
    Name  string
    Price int
}
type MainDish Dish
type Side Dish
type Dessert Dish

// {{abstractFactory}}
type Kitchen interface {
    CreateMain() MainDish
    CreateSide() Side
    CreateDessert() Dessert
}

// {{concreteFactories}}
type DeshiKitchen struct{}

func (DeshiKitchen) CreateMain() MainDish   { return MainDish{"Kacchi biryani", 320} } // @step:deshi-main
func (DeshiKitchen) CreateSide() Side       { return Side{"Borhani", 60} } // @step:deshi-side
func (DeshiKitchen) CreateDessert() Dessert { return Dessert{"Firni", 70} } // @step:deshi-dessert

type ChineseKitchen struct{}

func (ChineseKitchen) CreateMain() MainDish   { return MainDish{"Chicken fried rice", 300} } // @step:chinese-main
func (ChineseKitchen) CreateSide() Side       { return Side{"Corn soup", 140} } // @step:chinese-side
func (ChineseKitchen) CreateDessert() Dessert { return Dessert{"Custard pudding", 80} } // @step:chinese-dessert

// {{client}}
func ServeCombo(kitchen Kitchen) []Dish {
    main := kitchen.CreateMain() // {{noNames}} // @step:deshi-main,chinese-main
    side := kitchen.CreateSide() // @step:deshi-side,chinese-side
    dessert := kitchen.CreateDessert() // @step:deshi-dessert,chinese-dessert
    return []Dish{Dish(main), Dish(side), Dish(dessert)} // @step:serve
}

// {{usage}}
kitchen := kitchens[selectedCuisine] // @step:pick-kitchen
tray := ServeCombo(kitchen) // @step:order,done
`

const without = `
// {{withoutIntro}}
func ServeCombo(main, side, dessert string) []Dish { // @step:l1-start
    mainDish := createDish(main) // @step:l1-main
    sideDish := createDish(side) // @step:l1-side
    dessertDish := createDish(dessert) // @step:l1-dessert
    return []Dish{mainDish, sideDish, dessertDish} // @step:l1-result
}

var dishes = map[string]Dish{
    "kacchi":     {"Kacchi biryani", 320},
    "borhani":    {"Borhani", 60},
    "firni":      {"Firni", 70},
    "fried-rice": {"Chicken fried rice", 300},
    "corn-soup":  {"Corn soup", 140},
    "pudding":    {"Custard pudding", 80},
}

func createDish(name string) Dish { return dishes[name] }

// {{withoutMix}}
ServeCombo("kacchi", "corn-soup", "firni") // @step:l1-order
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
type ThaiKitchen struct{} // @step:build-kitchen

func (ThaiKitchen) CreateMain() MainDish   { return MainDish{"Pad thai", 380} } // @step:thai-main
func (ThaiKitchen) CreateSide() Side       { return Side{"Tom yum soup", 180} } // @step:thai-side
func (ThaiKitchen) CreateDessert() Dessert { return Dessert{"Mango sticky rice", 90} } // @step:thai-dessert

// {{withSame}}
tray := ServeCombo(ThaiKitchen{}) // @step:thai-order,thai-done
`

export const go: CodeSet = {
  main: { filename: 'restaurant.go', source: main },
  without: { filename: 'restaurant_without_abstract_factory.go', source: without },
  with: { filename: 'restaurant_with_abstract_factory.go', source: withPattern },
}

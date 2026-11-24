import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Rust: each product family member is a value of its product struct; the kitchens are trait objects.

const main = `
// {{abstractProducts}}
pub struct MainDish { pub name: &'static str, pub price: u32 }
pub struct Side { pub name: &'static str, pub price: u32 }
pub struct Dessert { pub name: &'static str, pub price: u32 }

// {{abstractFactory}}
pub trait Kitchen {
    fn create_main(&self) -> MainDish;
    fn create_side(&self) -> Side;
    fn create_dessert(&self) -> Dessert;
}

// {{concreteFactories}}
pub struct DeshiKitchen;
impl Kitchen for DeshiKitchen {
    fn create_main(&self) -> MainDish { MainDish { name: "Kacchi biryani", price: 320 } } // @step:deshi-main
    fn create_side(&self) -> Side { Side { name: "Borhani", price: 60 } } // @step:deshi-side
    fn create_dessert(&self) -> Dessert { Dessert { name: "Firni", price: 70 } } // @step:deshi-dessert
}

pub struct ChineseKitchen;
impl Kitchen for ChineseKitchen {
    fn create_main(&self) -> MainDish { MainDish { name: "Chicken fried rice", price: 300 } } // @step:chinese-main
    fn create_side(&self) -> Side { Side { name: "Corn soup", price: 140 } } // @step:chinese-side
    fn create_dessert(&self) -> Dessert { Dessert { name: "Custard pudding", price: 80 } } // @step:chinese-dessert
}

// {{client}}
pub fn serve_combo(kitchen: &dyn Kitchen) -> (MainDish, Side, Dessert) {
    let main = kitchen.create_main(); // {{noNames}} // @step:deshi-main,chinese-main
    let side = kitchen.create_side(); // @step:deshi-side,chinese-side
    let dessert = kitchen.create_dessert(); // @step:deshi-dessert,chinese-dessert
    (main, side, dessert) // @step:serve
}

// {{usage}}
let kitchen: &dyn Kitchen = kitchen_for(selected_cuisine); // @step:pick-kitchen
let tray = serve_combo(kitchen); // @step:order,done
`

const without = `
// {{withoutIntro}}
pub fn serve_combo(main: &str, side: &str, dessert: &str) -> Vec<Dish> { // @step:l1-start
    let main_dish = create_dish(main); // @step:l1-main
    let side_dish = create_dish(side); // @step:l1-side
    let dessert_dish = create_dish(dessert); // @step:l1-dessert
    vec![main_dish, side_dish, dessert_dish] // @step:l1-result
}

fn create_dish(name: &str) -> Dish {
    match name {
        "kacchi" => Dish { name: "Kacchi biryani", price: 320 },
        "borhani" => Dish { name: "Borhani", price: 60 },
        "firni" => Dish { name: "Firni", price: 70 },
        "fried-rice" => Dish { name: "Chicken fried rice", price: 300 },
        "corn-soup" => Dish { name: "Corn soup", price: 140 },
        "pudding" => Dish { name: "Custard pudding", price: 80 },
        other => panic!("Unknown dish: {other}"),
    }
}

// {{withoutMix}}
serve_combo("kacchi", "corn-soup", "firni"); // @step:l1-order
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
pub struct ThaiKitchen; // @step:build-kitchen
impl Kitchen for ThaiKitchen {
    fn create_main(&self) -> MainDish { MainDish { name: "Pad thai", price: 380 } } // @step:thai-main
    fn create_side(&self) -> Side { Side { name: "Tom yum soup", price: 180 } } // @step:thai-side
    fn create_dessert(&self) -> Dessert { Dessert { name: "Mango sticky rice", price: 90 } } // @step:thai-dessert
}

// {{withSame}}
let tray = serve_combo(&ThaiKitchen); // @step:thai-order,thai-done
`

export const rust: CodeSet = {
  main: { filename: 'restaurant.rs', source: main },
  without: { filename: 'restaurant_without_abstract_factory.rs', source: without },
  with: { filename: 'restaurant_with_abstract_factory.rs', source: withPattern },
}

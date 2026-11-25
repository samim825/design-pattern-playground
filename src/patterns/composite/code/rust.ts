import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Rust has no classes or inheritance: the Component is a trait, and a Bag owns its children
// as Box<dyn BazarItem>, so leaves and bags can sit in the same Vec. Rust getters drop "get_".

const main = `
// {{component}}
pub trait BazarItem {
    fn name(&self) -> &str;
    fn price(&self) -> u32;
}

// {{leaf}}
pub struct Item { pub name: String, pub price: u32 }

impl BazarItem for Item {
    fn name(&self) -> &str { &self.name }
    fn price(&self) -> u32 {
        self.price // {{leafPrice}} // @step:leaf
    }
}

// {{composite}}
pub struct Bag { name: String, children: Vec<Box<dyn BazarItem>> }

impl Bag {
    pub fn new(name: &str, children: Vec<Box<dyn BazarItem>>) -> Self { // {{anyChild}}
        Bag { name: name.into(), children }
    }
}

impl BazarItem for Bag {
    fn name(&self) -> &str { &self.name }
    fn price(&self) -> u32 {
        let mut sum = 0; // @step:open
        for child in &self.children {
            sum += child.price(); // {{recurse}} // @step:recurse
        }
        sum // {{bagTotal}} // @step:bag-total
    }
}

// {{usage}}
let fish_bag = Bag::new("Fish bag", vec![item("Ilish", 1200), item("Rui", 450)]);
let chili_bag = Bag::new("Chili bag", vec![item("Green chili", 40)]);
let veg_bag = Bag::new("Vegetable bag", vec![item("Potato", 60), Box::new(chili_bag)]); // {{bagInBag}}
let order = Bag::new("Jute bag", vec![Box::new(fish_bag), Box::new(veg_bag), item("Eggs", 150)]);

let picked: &dyn BazarItem = &order; // {{anyNode}} // @step:pick
let bill = picked.price(); // {{sameCall}} // @step:call,done
`

const without = `
// {{withoutIntro}}
pub struct Item { pub name: String, pub price: u32 }
pub struct Bag { pub items: Vec<Item>, pub bags: Vec<Bag> }

pub fn bill_total(order: &Bag) -> u32 {
    let mut sum = 0;
    for item in &order.items { sum += item.price; } // {{loopLoose}} // @step:l1-loop-1
    for bag in &order.bags {
        for item in &bag.items { sum += item.price; } // {{loopBags}} // @step:l1-loop-2
        for inner in &bag.bags { // {{withoutCopy}} // @step:l1-write-3
            for item in &inner.items { sum += item.price; } // @step:l1-loop-3
            for deeper in &inner.bags { // {{copyAgain}} // @step:l1-write-4
                for item in &deeper.items { sum += item.price; } // @step:l1-loop-4
                // {{withoutTodo}} // @step:l1-skip
            }
        }
    }
    sum // @step:l1-total
}

// {{withoutUse}}
let bill = bill_total(&mitus_order); // @step:l1-call
charge(&mitu, bill); // {{shortBill}} // @step:l1-result
`

const withPattern = `
// {{withAdd}}
pub struct GiftBox { name: String, children: Vec<Box<dyn BazarItem>> } // @step:build-class

const WRAP_FEE: u32 = 50; // {{wrapFee}}

impl BazarItem for GiftBox {
    fn name(&self) -> &str { &self.name }
    fn price(&self) -> u32 { // @step:build-sum
        let mut sum = WRAP_FEE; // @step:build-sum,gift-open
        for child in &self.children {
            sum += child.price(); // {{sameRecursion}} // @step:build-sum,gift-child
        }
        sum // @step:build-sum,gift-total
    }
}

// {{withSame}}
let eid_box = GiftBox { name: "Eid gift box".into(), children: vec![item("Semai", 120), item("Sugar", 140)] }; // @step:gift-make
let order = Bag::new("Jute bag", vec![Box::new(eid_box), item("Milk", 90)]); // {{justAChild}} // @step:gift-make
let bill = order.price(); // {{billUnchanged}} // @step:gift-call,gift-outer,gift-done

// {{withZero}}
`

export const rust: CodeSet = {
  main: { filename: 'bazar.rs', source: main },
  without: { filename: 'bazar_without_composite.rs', source: without },
  with: { filename: 'bazar_with_composite.rs', source: withPattern },
}

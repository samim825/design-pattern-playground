import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Rust: slips share one kitchen through Rc<Kitchen>, and the rail owns them as
// Box<dyn OrderCommand> (the kitchen's bodies would use interior mutability, left out here).

const main = `
// {{command}}
pub trait OrderCommand {
    fn price(&self) -> u32; // {{slipPrice}}
    fn execute(&self); // {{doIt}}
    fn undo(&self); // {{undoIt}}
}

// {{receiver}}
pub struct Kitchen;
impl Kitchen {
    pub fn cook(&self, dish: &str, table: u8) { /* … */ } // {{realWork}} // @step:cook
    pub fn take_back(&self, dish: &str, table: u8) { /* … */ } // @step:uncook
    pub fn add_chili(&self, dish: &str, table: u8) { /* … */ }
    pub fn remove_chili(&self, dish: &str, table: u8) { /* … */ }
}

// {{concrete}}
pub struct CookDishCommand {
    pub kitchen: Rc<Kitchen>, // {{holdsReceiver}}
    pub dish: &'static str,
    pub table: u8,
    pub price: u32,
}
impl OrderCommand for CookDishCommand {
    fn price(&self) -> u32 { self.price }
    fn execute(&self) {
        self.kitchen.cook(self.dish, self.table); // {{delegates}} // @step:exec
    }
    fn undo(&self) {
        self.kitchen.take_back(self.dish, self.table); // {{reverses}} // @step:undo-exec
    }
}

// {{invoker}}
#[derive(Default)]
pub struct OrderRail {
    queue: VecDeque<Box<dyn OrderCommand>>, // {{queueField}}
    history: Vec<Box<dyn OrderCommand>>, // {{historyField}} // @step:tear
}
impl OrderRail {
    pub fn pin(&mut self, slip: Box<dyn OrderCommand>) {
        self.queue.push_back(slip); // {{waits}} // @step:pin
    }
    pub fn run_next(&mut self) {
        if let Some(slip) = self.queue.pop_front() { // {{inOrder}} // @step:run
            slip.execute(); // {{blind}} // @step:run
            self.history.push(slip); // {{remember}} // @step:cook
        }
    }
    pub fn undo_last(&mut self) {
        if let Some(slip) = self.history.pop() { slip.undo() } // {{lastFirst}} // @step:undo
    }
    pub fn bill(&self) -> u32 {
        self.history.iter().map(|s| s.price()).sum() // {{billFromHistory}} // @step:bill
    }
}

// {{client}}
let kitchen = Rc::new(Kitchen);
let mut rail = OrderRail::default();
let slip = CookDishCommand { kitchen: Rc::clone(&kitchen), dish: "kacchi", table: 4, price: 350 }; // @step:write
rail.pin(Box::new(slip)); // {{writeSlip}} // @step:write
rail.run_next(); // {{railRuns}} // @step:run
rail.undo_last(); // {{cancelIsUndo}} // @step:cancel
`

const without = `
// {{withoutIntro}}
pub struct Waiter {
    kitchen: Kitchen, // {{knowsKitchen}}
    bill: u32, // {{billInHead}}
}

impl Waiter {
    pub fn take_order(&mut self, dish: &str, table: u8, price: u32) { // @step:l1-order
        match dish {
            "kacchi" => self.kitchen.cook_kacchi(table), // {{shoutNow}} // @step:l1-kacchi
            "roast" => self.kitchen.cook_roast(table), // @step:l1-roast
            _ => self.kitchen.serve_cold(dish, table), // {{busyLost}} // @step:l1-cold
        }
        self.bill += price; // @step:l1-bill
    }

    pub fn cancel(&mut self, dish: &str, table: u8, price: u32) { // {{noRecord}} // @step:l1-cancel
        self.kitchen.throw_away(dish, table); // {{hopeRight}} // @step:l1-undo
        self.bill -= price; // {{fixByHand}} // @step:l1-bill
    }
}
// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
pub struct MakeSpicyCommand {
    pub kitchen: Rc<Kitchen>, // {{askReceiver}} // @step:build-receiver
    pub dish: &'static str,
    pub table: u8,
}

impl OrderCommand for MakeSpicyCommand { // {{sameInterface}} // @step:build-class
    fn price(&self) -> u32 { 20 } // {{chiliPrice}}
    fn execute(&self) {
        self.kitchen.add_chili(self.dish, self.table); // {{chiliOn}} // @step:spicy-exec
    }
    fn undo(&self) {
        self.kitchen.remove_chili(self.dish, self.table); // {{chiliOff}} // @step:spicy-undo
    }
}

// {{othersSame}}
pub struct OrderRail { /* … */ } // @step:rail-same
impl OrderCommand for CookDishCommand { /* … */ } // @step:cook-same

// {{withUse}}
let k = || Rc::clone(&kitchen);
rail.pin(Box::new(CookDishCommand { kitchen: k(), dish: "kacchi", table: 4, price: 350 })); // @step:l3-order
rail.pin(Box::new(MakeSpicyCommand { kitchen: k(), dish: "kacchi", table: 4 })); // {{newSlip}} // @step:l3-spicy
rail.run_next(); // {{sameRail}} // @step:l3-run
rail.undo_last(); // {{tooHot}} // @step:l3-undo
// {{withZero}}
`

export const rust: CodeSet = {
  main: { filename: 'order_rail.rs', source: main },
  without: { filename: 'orders_without_command.rs', source: without },
  with: { filename: 'orders_with_command.rs', source: withPattern },
}

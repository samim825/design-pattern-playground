import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Rust: a static OnceLock holds the one box (behind a Mutex), and new() stays private to the module.

const main = `
// {{singleton}}
pub struct CashBox { total: u32 }

static INSTANCE: OnceLock<Mutex<CashBox>> = OnceLock::new(); // {{theOne}}

impl CashBox {
    fn new() -> Self { CashBox { total: 0 } } // {{noNew}} // @step:blocked

    pub fn get_instance() -> &'static Mutex<CashBox> { // @step:call
        INSTANCE.get_or_init(|| { // @step:check
            Mutex::new(CashBox::new()) // {{firstTime}} // @step:create
        }) // @step:return
    }

    pub fn add(&mut self, amount: u32) { self.total += amount; } // @step:add
    pub fn total(&self) -> u32 { self.total }
}

// {{client}}
pub struct Salesperson { pub name: String }

impl Salesperson {
    pub fn ring_up(&self, amount: u32) {
        let cash_box = CashBox::get_instance(); // {{sameBox}} // @step:call
        cash_box.lock().unwrap().add(amount); // @step:add
    }
}

// {{usage}}
Salesperson { name: "Rahim".into() }.ring_up(1500); // @step:sell
Salesperson { name: "Mitu".into() }.ring_up(1200);
karim.count(CashBox::get_instance().lock().unwrap().total()); // @step:count,done
`

const without = `
// {{withoutIntro}}
#[derive(Default)]
pub struct CashBox { pub total: u32 }

impl CashBox {
    pub fn add(&mut self, amount: u32) { self.total += amount; } // @step:l1-add
}

let shop_box = Rc::new(RefCell::new(CashBox::default())); // {{withoutGlobal}} // @step:l1-open

rahim.cash_box = Rc::clone(&shop_box); // @step:l1-shared
mitu.cash_box = Rc::new(RefCell::new(CashBox::default())); // {{withoutAnyone}} // @step:l1-new
seller.cash_box.borrow_mut().add(sale.amount); // @step:l1-add

// {{withoutTodo}} // @step:l1-todo
karim.count(shop_box.borrow().total); // @step:l1-count
`

const withPattern = `
// {{withAdd}}
pub struct BkashCounter; // @step:build-counter

impl BkashCounter {
    pub fn receive(&self, amount: u32) { // @step:b-receive
        let cash_box = CashBox::get_instance(); // {{sameBox}} // @step:build-counter,b-call
        cash_box.lock().unwrap().add(amount); // @step:b-add
    }
}

// {{withSame}}
BkashCounter.receive(2000); // @step:b-start
karim.count(CashBox::get_instance().lock().unwrap().total()); // @step:b-count,b-done
`

export const rust: CodeSet = {
  main: { filename: 'cash_box.rs', source: main },
  without: { filename: 'cash_box_without_singleton.rs', source: without },
  with: { filename: 'cash_box_with_singleton.rs', source: withPattern },
}

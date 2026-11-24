import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// C++: the "Meyers singleton" — a function-local static is created once, on the first call, thread-safely.

const main = `
// {{singleton}}
class CashBox {
public:
    static CashBox& getInstance() { // @step:call
        // {{theOne}}
        static CashBox instance; // {{firstTime}} // @step:check,create
        return instance; // @step:return
    }
    CashBox(const CashBox&) = delete;
    CashBox& operator=(const CashBox&) = delete;

    void add(int amount) { total += amount; } // @step:add
    int getTotal() const { return total; }

private:
    CashBox() = default; // {{noNew}} // @step:blocked
    int total = 0;
};

// {{client}}
struct Salesperson {
    std::string name;
    void ringUp(int amount) const {
        CashBox& box = CashBox::getInstance(); // {{sameBox}} // @step:call
        box.add(amount); // @step:add
    }
};

// {{usage}}
Salesperson{"Rahim"}.ringUp(1500); // @step:sell
Salesperson{"Mitu"}.ringUp(1200);
karim.count(CashBox::getInstance().getTotal()); // @step:count,done
`

const without = `
// {{withoutIntro}}
struct CashBox {
    int total = 0;
    void add(int amount) { total += amount; } // @step:l1-add
};

auto shopBox = std::make_shared<CashBox>(); // {{withoutGlobal}} // @step:l1-open

rahim.box = shopBox; // @step:l1-shared
mitu.box = std::make_shared<CashBox>(); // {{withoutAnyone}} // @step:l1-new
seller.box->add(sale.amount); // @step:l1-add

// {{withoutTodo}} // @step:l1-todo
karim.count(shopBox->total); // @step:l1-count
`

const withPattern = `
// {{withAdd}}
struct BkashCounter { // @step:build-counter
    void receive(int amount) const { // @step:b-receive
        CashBox& box = CashBox::getInstance(); // {{sameBox}} // @step:build-counter,b-call
        box.add(amount); // @step:b-add
    }
};

// {{withSame}}
BkashCounter{}.receive(2000); // @step:b-start
karim.count(CashBox::getInstance().getTotal()); // @step:b-count,b-done
`

export const cpp: CodeSet = {
  main: { filename: 'cash_box.cpp', source: main },
  without: { filename: 'cash_box_without_singleton.cpp', source: without },
  with: { filename: 'cash_box_with_singleton.cpp', source: withPattern },
}

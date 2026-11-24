import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{singleton}}
final class CashBox {
    private static CashBox instance; // {{theOne}}
    private int total;

    private CashBox() {} // {{noNew}} // @step:blocked

    static synchronized CashBox getInstance() { // @step:call
        if (instance == null) { // @step:check
            instance = new CashBox(); // {{firstTime}} // @step:create
        }
        return instance; // @step:return
    }

    void add(int amount) { total += amount; } // @step:add
    int total() { return total; }
}

// {{client}}
record Salesperson(String name) {
    void ringUp(int amount) {
        CashBox box = CashBox.getInstance(); // {{sameBox}} // @step:call
        box.add(amount); // @step:add
    }
}

// {{usage}}
new Salesperson("Rahim").ringUp(1500); // @step:sell
new Salesperson("Mitu").ringUp(1200);
karim.count(CashBox.getInstance().total()); // @step:count,done
`

const without = `
// {{withoutIntro}}
class CashBox {
    int total;
    void add(int amount) { total += amount; } // @step:l1-add
}

CashBox shopBox = new CashBox(); // {{withoutGlobal}} // @step:l1-open

rahim.box = shopBox; // @step:l1-shared
mitu.box = new CashBox(); // {{withoutAnyone}} // @step:l1-new
seller.box.add(sale.amount()); // @step:l1-add

// {{withoutTodo}} // @step:l1-todo
karim.count(shopBox.total); // @step:l1-count
`

const withPattern = `
// {{withAdd}}
class BkashCounter { // @step:build-counter
    void receive(int amount) { // @step:b-receive
        CashBox box = CashBox.getInstance(); // {{sameBox}} // @step:build-counter,b-call
        box.add(amount); // @step:b-add
    }
}

// {{withSame}}
new BkashCounter().receive(2000); // @step:b-start
karim.count(CashBox.getInstance().total()); // @step:b-count,b-done
`

export const java: CodeSet = {
  main: { filename: 'CashBox.java', source: main },
  without: { filename: 'CashBoxWithoutSingleton.java', source: without },
  with: { filename: 'CashBoxWithSingleton.java', source: withPattern },
}

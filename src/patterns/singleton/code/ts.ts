import type { CodeSet } from '@/types/pattern'

/*
 * Conventions (see CLAUDE.md):
 *   // {{key}}        → translated comment from content.<lang>.ts → codeComments[key]
 *   // @step:a,b      → this line lights up while visual step a or b runs (stripped on display)
 */

const main = `
// {{singleton}}
class CashBox {
  private static instance?: CashBox; // {{theOne}}
  total = 0;

  private constructor() {} // {{noNew}} // @step:blocked

  static getInstance(): CashBox { // @step:call
    if (!CashBox.instance) { // @step:check
      CashBox.instance = new CashBox(); // {{firstTime}} // @step:create
    }
    return CashBox.instance; // @step:return
  }

  add(amount: number) { this.total += amount; } // @step:add
}

// {{client}}
class Salesperson {
  constructor(public name: string) {}

  ringUp(amount: number) {
    const box = CashBox.getInstance(); // {{sameBox}} // @step:call
    box.add(amount); // @step:add
  }
}

// {{usage}}
new Salesperson('Rahim').ringUp(1500); // @step:sell
new Salesperson('Mitu').ringUp(1200);
karim.count(CashBox.getInstance().total); // @step:count,done
`

const without = `
// {{withoutIntro}}
class CashBox {
  total = 0;
  add(amount: number) { this.total += amount; } // @step:l1-add
}

const shopBox = new CashBox(); // {{withoutGlobal}} // @step:l1-open

rahim.box = shopBox; // @step:l1-shared
mitu.box = new CashBox(); // {{withoutAnyone}} // @step:l1-new
seller.box.add(sale.amount); // @step:l1-add

// {{withoutTodo}} // @step:l1-todo
karim.count(shopBox.total); // @step:l1-count
`

const withPattern = `
// {{withAdd}}
class BkashCounter { // @step:build-counter
  receive(amount: number) { // @step:b-receive
    const box = CashBox.getInstance(); // {{sameBox}} // @step:build-counter,b-call
    box.add(amount); // @step:b-add
  }
}

// {{withSame}}
new BkashCounter().receive(2000); // @step:b-start
karim.count(CashBox.getInstance().total); // @step:b-count,b-done
`

export const ts: CodeSet = {
  main: { filename: 'cash-box.ts', source: main },
  without: { filename: 'cash-box-without-singleton.ts', source: without },
  with: { filename: 'cash-box-with-singleton.ts', source: withPattern },
}

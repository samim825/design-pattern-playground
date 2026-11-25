import type { CodeSet } from '@/types/pattern'

/*
 * Conventions (see CLAUDE.md):
 *   // {{key}}        → translated comment from content.<lang>.ts → codeComments[key]
 *   // @step:a,b      → this line lights up while visual step a or b runs (stripped on display)
 * The kitchen's method bodies are left out to keep the snippets small.
 */

const main = `
// {{command}}
interface OrderCommand {
  readonly price: number; // {{slipPrice}}
  execute(): void; // {{doIt}}
  undo(): void; // {{undoIt}}
}

// {{receiver}}
class Kitchen {
  cook(dish: string, table: number): void { /* … */ } // {{realWork}} // @step:cook
  takeBack(dish: string, table: number): void { /* … */ } // @step:uncook
  addChili(dish: string, table: number): void { /* … */ }
  removeChili(dish: string, table: number): void { /* … */ }
}

// {{concrete}}
class CookDishCommand implements OrderCommand {
  constructor(
    private readonly kitchen: Kitchen, // {{holdsReceiver}}
    private readonly dish: string,
    private readonly table: number,
    readonly price: number,
  ) {}

  execute(): void {
    this.kitchen.cook(this.dish, this.table); // {{delegates}} // @step:exec
  }
  undo(): void {
    this.kitchen.takeBack(this.dish, this.table); // {{reverses}} // @step:undo-exec
  }
}

// {{invoker}}
class OrderRail {
  private readonly queue: OrderCommand[] = []; // {{queueField}}
  private readonly history: OrderCommand[] = []; // {{historyField}} // @step:tear

  pin(slip: OrderCommand): void {
    this.queue.push(slip); // {{waits}} // @step:pin
  }
  runNext(): void {
    const slip = this.queue.shift(); // {{inOrder}} // @step:run
    if (!slip) return;
    slip.execute(); // {{blind}} // @step:run
    this.history.push(slip); // {{remember}} // @step:cook
  }
  undoLast(): void {
    this.history.pop()?.undo(); // {{lastFirst}} // @step:undo
  }
  bill(): number {
    return this.history.reduce((sum, s) => sum + s.price, 0); // {{billFromHistory}} // @step:bill
  }
}

// {{client}}
const kitchen = new Kitchen();
const rail = new OrderRail();
rail.pin(new CookDishCommand(kitchen, 'kacchi', 4, 350)); // {{writeSlip}} // @step:write
rail.runNext(); // {{railRuns}} // @step:run
rail.undoLast(); // {{cancelIsUndo}} // @step:cancel
`

const without = `
// {{withoutIntro}}
class Waiter {
  private bill = 0; // {{billInHead}}
  constructor(private readonly kitchen: Kitchen) {} // {{knowsKitchen}}

  takeOrder(dish: string, table: number, price: number): void { // @step:l1-order
    if (dish === 'kacchi') this.kitchen.cookKacchi(table); // {{shoutNow}} // @step:l1-kacchi
    else if (dish === 'roast') this.kitchen.cookRoast(table); // @step:l1-roast
    else this.kitchen.serveCold(dish, table); // {{busyLost}} // @step:l1-cold
    this.bill += price; // @step:l1-bill
  }

  cancel(dish: string, table: number, price: number): void { // {{noRecord}} // @step:l1-cancel
    this.kitchen.throwAway(dish, table); // {{hopeRight}} // @step:l1-undo
    this.bill -= price; // {{fixByHand}} // @step:l1-bill
  }
}
// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
class MakeSpicyCommand implements OrderCommand { // {{sameInterface}} // @step:build-class
  readonly price = 20; // {{chiliPrice}}
  constructor(
    private readonly kitchen: Kitchen, // {{askReceiver}} // @step:build-receiver
    private readonly dish: string,
    private readonly table: number,
  ) {}

  execute(): void {
    this.kitchen.addChili(this.dish, this.table); // {{chiliOn}} // @step:spicy-exec
  }
  undo(): void {
    this.kitchen.removeChili(this.dish, this.table); // {{chiliOff}} // @step:spicy-undo
  }
}

// {{othersSame}}
class OrderRail { /* … */ } // @step:rail-same
class CookDishCommand implements OrderCommand { /* … */ } // @step:cook-same

// {{withUse}}
rail.pin(new CookDishCommand(kitchen, 'kacchi', 4, 350)); // @step:l3-order
rail.pin(new MakeSpicyCommand(kitchen, 'kacchi', 4)); // {{newSlip}} // @step:l3-spicy
rail.runNext(); // {{sameRail}} // @step:l3-run
rail.undoLast(); // {{tooHot}} // @step:l3-undo
// {{withZero}}
`

export const ts: CodeSet = {
  main: { filename: 'order-rail.ts', source: main },
  without: { filename: 'orders-without-command.ts', source: without },
  with: { filename: 'orders-with-command.ts', source: withPattern },
}

import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{command}}
interface OrderCommand {
    int price(); // {{slipPrice}}
    void execute(); // {{doIt}}
    void undo(); // {{undoIt}}
}

// {{receiver}}
class Kitchen {
    void cook(String dish, int table) { /* … */ } // {{realWork}} // @step:cook
    void takeBack(String dish, int table) { /* … */ } // @step:uncook
    void addChili(String dish, int table) { /* … */ }
    void removeChili(String dish, int table) { /* … */ }
}

// {{concrete}}
record CookDishCommand(Kitchen kitchen, String dish, int table, int price) // {{holdsReceiver}}
        implements OrderCommand {
    @Override public void execute() {
        kitchen.cook(dish, table); // {{delegates}} // @step:exec
    }
    @Override public void undo() {
        kitchen.takeBack(dish, table); // {{reverses}} // @step:undo-exec
    }
}

// {{invoker}}
class OrderRail {
    private final Deque<OrderCommand> queue = new ArrayDeque<>(); // {{queueField}}
    private final Deque<OrderCommand> history = new ArrayDeque<>(); // {{historyField}} // @step:tear

    void pin(OrderCommand slip) {
        queue.addLast(slip); // {{waits}} // @step:pin
    }
    void runNext() {
        OrderCommand slip = queue.pollFirst(); // {{inOrder}} // @step:run
        if (slip == null) return;
        slip.execute(); // {{blind}} // @step:run
        history.push(slip); // {{remember}} // @step:cook
    }
    void undoLast() {
        if (!history.isEmpty()) history.pop().undo(); // {{lastFirst}} // @step:undo
    }
    int bill() {
        return history.stream().mapToInt(OrderCommand::price).sum(); // {{billFromHistory}} // @step:bill
    }
}

// {{client}}
var kitchen = new Kitchen();
var rail = new OrderRail();
rail.pin(new CookDishCommand(kitchen, "kacchi", 4, 350)); // {{writeSlip}} // @step:write
rail.runNext(); // {{railRuns}} // @step:run
rail.undoLast(); // {{cancelIsUndo}} // @step:cancel
`

const without = `
// {{withoutIntro}}
class Waiter {
    private final Kitchen kitchen; // {{knowsKitchen}}
    private int bill = 0; // {{billInHead}}

    Waiter(Kitchen kitchen) { this.kitchen = kitchen; }

    void takeOrder(String dish, int table, int price) { // @step:l1-order
        switch (dish) {
            case "kacchi" -> kitchen.cookKacchi(table); // {{shoutNow}} // @step:l1-kacchi
            case "roast" -> kitchen.cookRoast(table); // @step:l1-roast
            default -> kitchen.serveCold(dish, table); // {{busyLost}} // @step:l1-cold
        }
        bill += price; // @step:l1-bill
    }

    void cancel(String dish, int table, int price) { // {{noRecord}} // @step:l1-cancel
        kitchen.throwAway(dish, table); // {{hopeRight}} // @step:l1-undo
        bill -= price; // {{fixByHand}} // @step:l1-bill
    }
}
// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
record MakeSpicyCommand(Kitchen kitchen, String dish, int table) // {{askReceiver}} // @step:build-receiver
        implements OrderCommand { // {{sameInterface}} // @step:build-class
    @Override public int price() { return 20; } // {{chiliPrice}}
    @Override public void execute() {
        kitchen.addChili(dish, table); // {{chiliOn}} // @step:spicy-exec
    }
    @Override public void undo() {
        kitchen.removeChili(dish, table); // {{chiliOff}} // @step:spicy-undo
    }
}

// {{othersSame}}
class OrderRail { /* … */ } // @step:rail-same
record CookDishCommand(/* … */) implements OrderCommand { /* … */ } // @step:cook-same

// {{withUse}}
rail.pin(new CookDishCommand(kitchen, "kacchi", 4, 350)); // @step:l3-order
rail.pin(new MakeSpicyCommand(kitchen, "kacchi", 4)); // {{newSlip}} // @step:l3-spicy
rail.runNext(); // {{sameRail}} // @step:l3-run
rail.undoLast(); // {{tooHot}} // @step:l3-undo
// {{withZero}}
`

export const java: CodeSet = {
  main: { filename: 'OrderRail.java', source: main },
  without: { filename: 'OrdersWithoutCommand.java', source: without },
  with: { filename: 'OrdersWithCommand.java', source: withPattern },
}

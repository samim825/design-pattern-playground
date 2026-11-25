import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{command}}
protocol OrderCommand {
    var price: Int { get } // {{slipPrice}}
    func execute() // {{doIt}}
    func undo() // {{undoIt}}
}

// {{receiver}}
final class Kitchen {
    func cook(_ dish: String, table: Int) { /* … */ } // {{realWork}} // @step:cook
    func takeBack(_ dish: String, table: Int) { /* … */ } // @step:uncook
    func addChili(_ dish: String, table: Int) { /* … */ }
    func removeChili(_ dish: String, table: Int) { /* … */ }
}

// {{concrete}}
struct CookDishCommand: OrderCommand {
    let kitchen: Kitchen // {{holdsReceiver}}
    let dish: String
    let table: Int
    let price: Int

    func execute() {
        kitchen.cook(dish, table: table) // {{delegates}} // @step:exec
    }
    func undo() {
        kitchen.takeBack(dish, table: table) // {{reverses}} // @step:undo-exec
    }
}

// {{invoker}}
final class OrderRail {
    private var queue: [any OrderCommand] = [] // {{queueField}}
    private var history: [any OrderCommand] = [] // {{historyField}} // @step:tear

    func pin(_ slip: any OrderCommand) {
        queue.append(slip) // {{waits}} // @step:pin
    }
    func runNext() {
        guard !queue.isEmpty else { return }
        let slip = queue.removeFirst() // {{inOrder}} // @step:run
        slip.execute() // {{blind}} // @step:run
        history.append(slip) // {{remember}} // @step:cook
    }
    func undoLast() {
        history.popLast()?.undo() // {{lastFirst}} // @step:undo
    }
    var bill: Int {
        history.reduce(0) { sum, slip in sum + slip.price } // {{billFromHistory}} // @step:bill
    }
}

// {{client}}
let kitchen = Kitchen()
let rail = OrderRail()
rail.pin(CookDishCommand(kitchen: kitchen, dish: "kacchi", table: 4, price: 350)) // {{writeSlip}} // @step:write
rail.runNext() // {{railRuns}} // @step:run
rail.undoLast() // {{cancelIsUndo}} // @step:cancel
`

const without = `
// {{withoutIntro}}
final class Waiter {
    private let kitchen: Kitchen // {{knowsKitchen}}
    private var bill = 0 // {{billInHead}}

    init(kitchen: Kitchen) { self.kitchen = kitchen }

    func takeOrder(_ dish: String, table: Int, price: Int) { // @step:l1-order
        switch dish {
        case "kacchi": kitchen.cookKacchi(table: table) // {{shoutNow}} // @step:l1-kacchi
        case "roast": kitchen.cookRoast(table: table) // @step:l1-roast
        default: kitchen.serveCold(dish, table: table) // {{busyLost}} // @step:l1-cold
        }
        bill += price // @step:l1-bill
    }

    func cancel(_ dish: String, table: Int, price: Int) { // {{noRecord}} // @step:l1-cancel
        kitchen.throwAway(dish, table: table) // {{hopeRight}} // @step:l1-undo
        bill -= price // {{fixByHand}} // @step:l1-bill
    }
}
// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
struct MakeSpicyCommand: OrderCommand { // {{sameInterface}} // @step:build-class
    let kitchen: Kitchen // {{askReceiver}} // @step:build-receiver
    let dish: String
    let table: Int
    let price = 20 // {{chiliPrice}}

    func execute() {
        kitchen.addChili(dish, table: table) // {{chiliOn}} // @step:spicy-exec
    }
    func undo() {
        kitchen.removeChili(dish, table: table) // {{chiliOff}} // @step:spicy-undo
    }
}

// {{othersSame}}
final class OrderRail { /* … */ } // @step:rail-same
struct CookDishCommand: OrderCommand { /* … */ } // @step:cook-same

// {{withUse}}
rail.pin(CookDishCommand(kitchen: kitchen, dish: "kacchi", table: 4, price: 350)) // @step:l3-order
rail.pin(MakeSpicyCommand(kitchen: kitchen, dish: "kacchi", table: 4)) // {{newSlip}} // @step:l3-spicy
rail.runNext() // {{sameRail}} // @step:l3-run
rail.undoLast() // {{tooHot}} // @step:l3-undo
// {{withZero}}
`

export const swift: CodeSet = {
  main: { filename: 'OrderRail.swift', source: main },
  without: { filename: 'OrdersWithoutCommand.swift', source: without },
  with: { filename: 'OrdersWithCommand.swift', source: withPattern },
}

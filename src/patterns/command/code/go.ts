import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Go: there is no "implements" keyword; any struct with Price, Execute and Undo methods is an
// OrderCommand automatically. The rail keeps its queue and history as slices.

const main = `
// {{command}}
type OrderCommand interface {
    Price() int // {{slipPrice}}
    Execute()   // {{doIt}}
    Undo()      // {{undoIt}}
}

// {{receiver}}
type Kitchen struct{}

func (k *Kitchen) Cook(dish string, table int)        { /* … */ } // {{realWork}} // @step:cook
func (k *Kitchen) TakeBack(dish string, table int)    { /* … */ } // @step:uncook
func (k *Kitchen) AddChili(dish string, table int)    { /* … */ }
func (k *Kitchen) RemoveChili(dish string, table int) { /* … */ }

// {{concrete}}
type CookDishCommand struct {
    Kitchen *Kitchen // {{holdsReceiver}}
    Dish    string
    Table   int
    Cost    int
}

func (c CookDishCommand) Price() int { return c.Cost }
func (c CookDishCommand) Execute()   { c.Kitchen.Cook(c.Dish, c.Table) } // {{delegates}} // @step:exec
func (c CookDishCommand) Undo()      { c.Kitchen.TakeBack(c.Dish, c.Table) } // {{reverses}} // @step:undo-exec

// {{invoker}}
type OrderRail struct {
    queue   []OrderCommand // {{queueField}}
    history []OrderCommand // {{historyField}} // @step:tear
}

func (r *OrderRail) Pin(slip OrderCommand) {
    r.queue = append(r.queue, slip) // {{waits}} // @step:pin
}

func (r *OrderRail) RunNext() {
    if len(r.queue) == 0 {
        return
    }
    slip := r.queue[0] // {{inOrder}} // @step:run
    r.queue = r.queue[1:]
    slip.Execute() // {{blind}} // @step:run
    r.history = append(r.history, slip) // {{remember}} // @step:cook
}

func (r *OrderRail) UndoLast() {
    if n := len(r.history); n > 0 {
        r.history[n-1].Undo() // {{lastFirst}} // @step:undo
        r.history = r.history[:n-1]
    }
}

func (r *OrderRail) Bill() (sum int) {
    for _, s := range r.history {
        sum += s.Price() // {{billFromHistory}} // @step:bill
    }
    return sum
}

// {{client}}
kitchen, rail := &Kitchen{}, &OrderRail{}
rail.Pin(CookDishCommand{kitchen, "kacchi", 4, 350}) // {{writeSlip}} // @step:write
rail.RunNext() // {{railRuns}} // @step:run
rail.UndoLast() // {{cancelIsUndo}} // @step:cancel
`

const without = `
// {{withoutIntro}}
type Waiter struct {
    kitchen *Kitchen // {{knowsKitchen}}
    bill    int      // {{billInHead}}
}

func (w *Waiter) TakeOrder(dish string, table, price int) { // @step:l1-order
    switch dish {
    case "kacchi":
        w.kitchen.CookKacchi(table) // {{shoutNow}} // @step:l1-kacchi
    case "roast":
        w.kitchen.CookRoast(table) // @step:l1-roast
    default:
        w.kitchen.ServeCold(dish, table) // {{busyLost}} // @step:l1-cold
    }
    w.bill += price // @step:l1-bill
}

func (w *Waiter) Cancel(dish string, table, price int) { // {{noRecord}} // @step:l1-cancel
    w.kitchen.ThrowAway(dish, table) // {{hopeRight}} // @step:l1-undo
    w.bill -= price // {{fixByHand}} // @step:l1-bill
}
// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
type MakeSpicyCommand struct { // {{sameInterface}} // @step:build-class
    Kitchen *Kitchen // {{askReceiver}} // @step:build-receiver
    Dish    string
    Table   int
}

func (MakeSpicyCommand) Price() int { return 20 } // {{chiliPrice}}
func (c MakeSpicyCommand) Execute() {
    c.Kitchen.AddChili(c.Dish, c.Table) // {{chiliOn}} // @step:spicy-exec
}
func (c MakeSpicyCommand) Undo() {
    c.Kitchen.RemoveChili(c.Dish, c.Table) // {{chiliOff}} // @step:spicy-undo
}

// {{othersSame}}
type OrderRail struct{ /* … */ } // @step:rail-same
type CookDishCommand struct{ /* … */ } // @step:cook-same

// {{withUse}}
rail.Pin(CookDishCommand{kitchen, "kacchi", 4, 350}) // @step:l3-order
rail.Pin(MakeSpicyCommand{kitchen, "kacchi", 4}) // {{newSlip}} // @step:l3-spicy
rail.RunNext() // {{sameRail}} // @step:l3-run
rail.UndoLast() // {{tooHot}} // @step:l3-undo
// {{withZero}}
`

export const go: CodeSet = {
  main: { filename: 'order_rail.go', source: main },
  without: { filename: 'orders_without_command.go', source: without },
  with: { filename: 'orders_with_command.go', source: withPattern },
}

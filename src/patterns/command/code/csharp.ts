import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{command}}
public interface IOrderCommand
{
    decimal Price { get; } // {{slipPrice}}
    void Execute(); // {{doIt}}
    void Undo(); // {{undoIt}}
}

// {{receiver}}
public class Kitchen
{
    public void Cook(string dish, int table) { /* … */ } // {{realWork}} // @step:cook
    public void TakeBack(string dish, int table) { /* … */ } // @step:uncook
    public void AddChili(string dish, int table) { /* … */ }
    public void RemoveChili(string dish, int table) { /* … */ }
}

// {{concrete}}
public sealed record CookDishCommand(Kitchen Kitchen, string Dish, int Table, decimal Price) // {{holdsReceiver}}
    : IOrderCommand
{
    public void Execute() => Kitchen.Cook(Dish, Table); // {{delegates}} // @step:exec
    public void Undo() => Kitchen.TakeBack(Dish, Table); // {{reverses}} // @step:undo-exec
}

// {{invoker}}
public sealed class OrderRail
{
    private readonly Queue<IOrderCommand> _queue = new(); // {{queueField}}
    private readonly Stack<IOrderCommand> _history = new(); // {{historyField}} // @step:tear

    public void Pin(IOrderCommand slip) => _queue.Enqueue(slip); // {{waits}} // @step:pin

    public void RunNext()
    {
        if (!_queue.TryDequeue(out var slip)) return; // {{inOrder}} // @step:run
        slip.Execute(); // {{blind}} // @step:run
        _history.Push(slip); // {{remember}} // @step:cook
    }

    public void UndoLast()
    {
        if (_history.TryPop(out var slip)) slip.Undo(); // {{lastFirst}} // @step:undo
    }

    public decimal Bill() => _history.Sum(s => s.Price); // {{billFromHistory}} // @step:bill
}

// {{client}}
var kitchen = new Kitchen();
var rail = new OrderRail();
rail.Pin(new CookDishCommand(kitchen, "kacchi", 4, 350m)); // {{writeSlip}} // @step:write
rail.RunNext(); // {{railRuns}} // @step:run
rail.UndoLast(); // {{cancelIsUndo}} // @step:cancel
`

const without = `
// {{withoutIntro}}
public class Waiter(Kitchen kitchen) // {{knowsKitchen}}
{
    private decimal _bill; // {{billInHead}}

    public void TakeOrder(string dish, int table, decimal price) // @step:l1-order
    {
        if (dish == "kacchi") kitchen.CookKacchi(table); // {{shoutNow}} // @step:l1-kacchi
        else if (dish == "roast") kitchen.CookRoast(table); // @step:l1-roast
        else kitchen.ServeCold(dish, table); // {{busyLost}} // @step:l1-cold
        _bill += price; // @step:l1-bill
    }

    public void Cancel(string dish, int table, decimal price) // {{noRecord}} // @step:l1-cancel
    {
        kitchen.ThrowAway(dish, table); // {{hopeRight}} // @step:l1-undo
        _bill -= price; // {{fixByHand}} // @step:l1-bill
    }
}
// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
public sealed record MakeSpicyCommand(Kitchen Kitchen, string Dish, int Table) // {{askReceiver}} // @step:build-receiver
    : IOrderCommand // {{sameInterface}} // @step:build-class
{
    public decimal Price => 20m; // {{chiliPrice}}
    public void Execute() => Kitchen.AddChili(Dish, Table); // {{chiliOn}} // @step:spicy-exec
    public void Undo() => Kitchen.RemoveChili(Dish, Table); // {{chiliOff}} // @step:spicy-undo
}

// {{othersSame}}
public sealed class OrderRail { /* … */ } // @step:rail-same
public sealed record CookDishCommand(/* … */) : IOrderCommand { /* … */ } // @step:cook-same

// {{withUse}}
rail.Pin(new CookDishCommand(kitchen, "kacchi", 4, 350m)); // @step:l3-order
rail.Pin(new MakeSpicyCommand(kitchen, "kacchi", 4)); // {{newSlip}} // @step:l3-spicy
rail.RunNext(); // {{sameRail}} // @step:l3-run
rail.UndoLast(); // {{tooHot}} // @step:l3-undo
// {{withZero}}
`

export const csharp: CodeSet = {
  main: { filename: 'OrderRail.cs', source: main },
  without: { filename: 'OrdersWithoutCommand.cs', source: without },
  with: { filename: 'OrdersWithCommand.cs', source: withPattern },
}

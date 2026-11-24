import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// (Production C# often uses Lazy<CashBox> for thread safety; the steps are spelled out here.)

const main = `
// {{singleton}}
sealed class CashBox
{
    private static CashBox? instance; // {{theOne}}
    public int Total { get; private set; }

    private CashBox() { } // {{noNew}} // @step:blocked

    public static CashBox GetInstance() // @step:call
    {
        if (instance is null) // @step:check
            instance = new CashBox(); // {{firstTime}} // @step:create
        return instance; // @step:return
    }

    public void Add(int amount) => Total += amount; // @step:add
}

// {{client}}
record Salesperson(string Name)
{
    public void RingUp(int amount)
    {
        var box = CashBox.GetInstance(); // {{sameBox}} // @step:call
        box.Add(amount); // @step:add
    }
}

// {{usage}}
new Salesperson("Rahim").RingUp(1500); // @step:sell
new Salesperson("Mitu").RingUp(1200);
karim.Count(CashBox.GetInstance().Total); // @step:count,done
`

const without = `
// {{withoutIntro}}
class CashBox
{
    public int Total { get; private set; }
    public void Add(int amount) => Total += amount; // @step:l1-add
}

var shopBox = new CashBox(); // {{withoutGlobal}} // @step:l1-open

rahim.Box = shopBox; // @step:l1-shared
mitu.Box = new CashBox(); // {{withoutAnyone}} // @step:l1-new
seller.Box.Add(sale.Amount); // @step:l1-add

// {{withoutTodo}} // @step:l1-todo
karim.Count(shopBox.Total); // @step:l1-count
`

const withPattern = `
// {{withAdd}}
class BkashCounter // @step:build-counter
{
    public void Receive(int amount) // @step:b-receive
    {
        var box = CashBox.GetInstance(); // {{sameBox}} // @step:build-counter,b-call
        box.Add(amount); // @step:b-add
    }
}

// {{withSame}}
new BkashCounter().Receive(2000); // @step:b-start
karim.Count(CashBox.GetInstance().Total); // @step:b-count,b-done
`

export const csharp: CodeSet = {
  main: { filename: 'CashBox.cs', source: main },
  without: { filename: 'CashBoxWithoutSingleton.cs', source: without },
  with: { filename: 'CashBoxWithSingleton.cs', source: withPattern },
}

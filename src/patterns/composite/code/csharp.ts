import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{component}}
public interface IBazarItem
{
    string Name { get; }
    decimal GetPrice();
}

// {{leaf}}
public record Item(string Name, decimal Price) : IBazarItem
{
    public decimal GetPrice() => Price; // {{leafPrice}} // @step:leaf
}

// {{composite}}
public class Bag(string name) : IBazarItem
{
    private readonly List<IBazarItem> _children = [];
    public string Name => name;

    public Bag Add(params IBazarItem[] items) // {{anyChild}}
    {
        _children.AddRange(items);
        return this;
    }

    public decimal GetPrice()
    {
        decimal sum = 0; // @step:open
        foreach (var child in _children)
        {
            sum += child.GetPrice(); // {{recurse}} // @step:recurse
        }
        return sum; // {{bagTotal}} // @step:bag-total
    }
}

// {{usage}}
var fishBag = new Bag("Fish bag").Add(new Item("Ilish", 1200), new Item("Rui", 450));
var chiliBag = new Bag("Chili bag").Add(new Item("Green chili", 40));
var vegBag = new Bag("Vegetable bag").Add(new Item("Potato", 60), chiliBag); // {{bagInBag}}
var order = new Bag("Jute bag").Add(fishBag, vegBag, new Item("Eggs", 150));

IBazarItem picked = vegBag; // {{anyNode}} // @step:pick
decimal bill = picked.GetPrice(); // {{sameCall}} // @step:call,done
`

const without = `
// {{withoutIntro}}
public record Item(string Name, decimal Price);
public record Bag(List<Item> Items, List<Bag> Bags);

static decimal BillTotal(Bag order)
{
    decimal sum = 0;
    foreach (var item in order.Items) sum += item.Price; // {{loopLoose}} // @step:l1-loop-1
    foreach (var bag in order.Bags)
    {
        foreach (var item in bag.Items) sum += item.Price; // {{loopBags}} // @step:l1-loop-2
        foreach (var inner in bag.Bags) // {{withoutCopy}} // @step:l1-write-3
        {
            foreach (var item in inner.Items) sum += item.Price; // @step:l1-loop-3
            foreach (var deeper in inner.Bags) // {{copyAgain}} // @step:l1-write-4
            {
                foreach (var item in deeper.Items) sum += item.Price; // @step:l1-loop-4
                // {{withoutTodo}} // @step:l1-skip
            }
        }
    }
    return sum; // @step:l1-total
}

// {{withoutUse}}
var bill = BillTotal(mitusOrder); // @step:l1-call
Charge(mitu, bill); // {{shortBill}} // @step:l1-result
`

const withPattern = `
// {{withAdd}}
public class GiftBox(string name) : IBazarItem // @step:build-class
{
    private const decimal WrapFee = 50; // {{wrapFee}}
    private readonly List<IBazarItem> _children = [];
    public string Name => name;

    public GiftBox Add(params IBazarItem[] items) { _children.AddRange(items); return this; }

    public decimal GetPrice() // @step:build-sum
    {
        decimal sum = WrapFee; // @step:build-sum,gift-open
        foreach (var child in _children)
        {
            sum += child.GetPrice(); // {{sameRecursion}} // @step:build-sum,gift-child
        }
        return sum; // @step:build-sum,gift-total
    }
}

// {{withSame}}
var eidBox = new GiftBox("Eid gift box").Add(new Item("Semai", 120), new Item("Sugar", 140)); // @step:gift-make
var order = new Bag("Jute bag").Add(eidBox, new Item("Milk", 90)); // {{justAChild}} // @step:gift-make
decimal bill = order.GetPrice(); // {{billUnchanged}} // @step:gift-call,gift-outer,gift-done

// {{withZero}}
`

export const csharp: CodeSet = {
  main: { filename: 'Bazar.cs', source: main },
  without: { filename: 'BazarWithoutComposite.cs', source: without },
  with: { filename: 'BazarWithComposite.cs', source: withPattern },
}

import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{abstractProducts}}
interface IDish { string Name { get; } int Price { get; } }
interface IMainDish : IDish { }
interface ISide : IDish { }
interface IDessert : IDish { }

// {{concreteProducts}}
record Kacchi(string Name, int Price) : IMainDish;
record Borhani(string Name, int Price) : ISide;
record Firni(string Name, int Price) : IDessert;
record FriedRice(string Name, int Price) : IMainDish;
record CornSoup(string Name, int Price) : ISide;
record Pudding(string Name, int Price) : IDessert;

// {{abstractFactory}}
interface IKitchen
{
    IMainDish CreateMain();
    ISide CreateSide();
    IDessert CreateDessert();
}

// {{concreteFactories}}
class DeshiKitchen : IKitchen
{
    public IMainDish CreateMain() => new Kacchi("Kacchi biryani", 320); // @step:deshi-main
    public ISide CreateSide() => new Borhani("Borhani", 60); // @step:deshi-side
    public IDessert CreateDessert() => new Firni("Firni", 70); // @step:deshi-dessert
}

class ChineseKitchen : IKitchen
{
    public IMainDish CreateMain() => new FriedRice("Chicken fried rice", 300); // @step:chinese-main
    public ISide CreateSide() => new CornSoup("Corn soup", 140); // @step:chinese-side
    public IDessert CreateDessert() => new Pudding("Custard pudding", 80); // @step:chinese-dessert
}

// {{client}}
List<IDish> ServeCombo(IKitchen kitchen)
{
    var main = kitchen.CreateMain(); // {{noNames}} // @step:deshi-main,chinese-main
    var side = kitchen.CreateSide(); // @step:deshi-side,chinese-side
    var dessert = kitchen.CreateDessert(); // @step:deshi-dessert,chinese-dessert
    return [main, side, dessert]; // @step:serve
}

// {{usage}}
IKitchen kitchen = kitchens[selectedCuisine]; // @step:pick-kitchen
var tray = ServeCombo(kitchen); // @step:order,done
`

const without = `
// {{withoutIntro}}
List<IDish> ServeCombo(string main, string side, string dessert) // @step:l1-start
{
    var mainDish = CreateDish(main); // @step:l1-main
    var sideDish = CreateDish(side); // @step:l1-side
    var dessertDish = CreateDish(dessert); // @step:l1-dessert
    return [mainDish, sideDish, dessertDish]; // @step:l1-result
}

IDish CreateDish(string name) => name switch
{
    "kacchi" => new Kacchi("Kacchi biryani", 320),
    "borhani" => new Borhani("Borhani", 60),
    "firni" => new Firni("Firni", 70),
    "fried-rice" => new FriedRice("Chicken fried rice", 300),
    "corn-soup" => new CornSoup("Corn soup", 140),
    "pudding" => new Pudding("Custard pudding", 80),
    _ => throw new ArgumentException("Unknown dish: " + name),
};

// {{withoutMix}}
ServeCombo("kacchi", "corn-soup", "firni"); // @step:l1-order
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
record PadThai(string Name, int Price) : IMainDish; // @step:build-kitchen
record TomYum(string Name, int Price) : ISide; // @step:build-kitchen
record MangoStickyRice(string Name, int Price) : IDessert; // @step:build-kitchen

class ThaiKitchen : IKitchen // @step:build-kitchen
{
    public IMainDish CreateMain() => new PadThai("Pad thai", 380); // @step:thai-main
    public ISide CreateSide() => new TomYum("Tom yum soup", 180); // @step:thai-side
    public IDessert CreateDessert() => new MangoStickyRice("Mango sticky rice", 90); // @step:thai-dessert
}

// {{withSame}}
var tray = ServeCombo(new ThaiKitchen()); // @step:thai-order,thai-done
`

export const csharp: CodeSet = {
  main: { filename: 'Restaurant.cs', source: main },
  without: { filename: 'RestaurantWithoutAbstractFactory.cs', source: without },
  with: { filename: 'RestaurantWithAbstractFactory.cs', source: withPattern },
}

import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{component}}
public interface ISnack
{
    decimal Cost();
    string Describe();
}

// {{concrete}}
public sealed class Fuchka : ISnack
{
    public decimal Cost() => 60; // {{basePrice}} // @step:core
    public string Describe() => "Fuchka"; // @step:describe
}

// {{decorator}}
public abstract class Topping(ISnack inner) : ISnack
{
    protected ISnack Inner { get; } = inner; // {{wrapsAny}} // @step:wrap-egg,wrap-chanachur,wrap-spicy
    public abstract decimal Cost();
    public abstract string Describe();
}

// {{concreteDecorators}}
public sealed class Egg(ISnack inner) : Topping(inner)
{
    public override decimal Cost() => Inner.Cost() + 20; // {{passIn}} // @step:in-egg,out-egg
    public override string Describe() => Inner.Describe() + " + egg"; // @step:describe
}

public sealed class Chanachur(ISnack inner) : Topping(inner)
{
    public override decimal Cost() => Inner.Cost() + 10; // @step:in-chanachur,out-chanachur
    public override string Describe() => Inner.Describe() + " + chanachur"; // @step:describe
}

public sealed class ExtraSpicy(ISnack inner) : Topping(inner)
{
    public override decimal Cost() => Inner.Cost() + 5; // @step:in-spicy,out-spicy
    public override string Describe() => Inner.Describe() + " + extra spicy"; // @step:describe
}

// {{usage}}
ISnack plate = new Fuchka(); // @step:base
plate = new Egg(plate); // {{wrapLayer}} // @step:wrap-egg
plate = new Chanachur(plate); // @step:wrap-chanachur
plate = new ExtraSpicy(plate); // @step:wrap-spicy

decimal total = plate.Cost(); // {{oneCall}} // @step:call,done
string receipt = plate.Describe(); // {{sameTrip}} // @step:describe
`

const without = `
// {{withoutIntro}}
public class Fuchka
{
    public virtual decimal Cost() => 60;
    public virtual string Describe() => "Fuchka";
}

public class FuchkaWithEgg : Fuchka
{
    public override decimal Cost() => 80; // {{hardcoded}} // @step:l1-cost
    public override string Describe() => "Fuchka + egg"; // @step:l1-describe
}

public class FuchkaWithSpicy : Fuchka
{
    public override decimal Cost() => 65; // @step:l1-cost
    public override string Describe() => "Fuchka + extra spicy"; // @step:l1-describe
}

// {{withoutCopy}}
public class FuchkaWithEggAndSpicy : Fuchka // @step:l1-write
{
    public override decimal Cost() => 85; // {{copyPrice}} // @step:l1-cost
    public override string Describe() => "Fuchka + egg + extra spicy"; // @step:l1-describe
}

// {{withoutPick}}
Fuchka plate = new FuchkaWithEggAndSpicy(); // @step:l1-pick
Serve(karim, plate.Describe(), plate.Cost()); // @step:l1-serve,l1-result
// {{withoutTodo}} // @step:l1-count
`

const withPattern = `
// {{withAdd}}
public sealed class TokDoi(ISnack inner) : Topping(inner) // @step:build-class
{
    public override decimal Cost() => Inner.Cost() + 30; // {{onlyNew}} // @step:build-cost,in-tokdoi,out-tokdoi
    public override string Describe() => Inner.Describe() + " + tok-doi"; // @step:build-cost,describe-new
}

// {{withSame}}
ISnack plate = new Fuchka(); // @step:base-new
plate = new TokDoi(plate); // {{justWrap}} // @step:wrap-tokdoi
plate = new Chanachur(plate); // {{oldStillWork}} // @step:wrap-old

decimal total = plate.Cost(); // {{costUnchanged}} // @step:call-new,inner-old,done-new
string receipt = plate.Describe(); // @step:describe-new

// {{withZero}}
`

export const csharp: CodeSet = {
  main: { filename: 'Fuchka.cs', source: main },
  without: { filename: 'FuchkaWithoutDecorator.cs', source: without },
  with: { filename: 'FuchkaWithDecorator.cs', source: withPattern },
}

import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
record Parcel(string Item, string To);
record Booking(string Tracking, int Fee, string Eta);

// {{product}}
interface ITransport
{
    int Fee { get; }
    string Deliver(string to);
}

class RickshawVan : ITransport
{
    public int Fee => 60;
    public string Deliver(string to) => "Through the lanes to " + to + ", today"; // @step:dhaka-deliver
}

class Truck : ITransport
{
    public int Fee => 150;
    public string Deliver(string to) => "On the highway to " + to + ", tomorrow"; // @step:chattogram-deliver
}

class Launch : ITransport
{
    public int Fee => 120;
    public string Deliver(string to) => "Down the river to " + to + ", overnight"; // @step:barishal-deliver
}

// {{creator}}
abstract class CourierBranch
{
    // {{factoryMethod}}
    protected abstract ITransport CreateTransport();

    // {{shared}}
    public Booking SendParcel(Parcel parcel)
    {
        var transport = CreateTransport(); // {{noNew}} // @step:call-factory
        var tracking = NewTrackingId(); // @step:book
        var eta = transport.Deliver(parcel.To); // @step:deliver
        return new Booking(tracking, transport.Fee, eta); // @step:done
    }
}

// {{concreteCreators}}
class DhakaBranch : CourierBranch
{
    protected override ITransport CreateTransport() => new RickshawVan(); // @step:dhaka-create
}

class ChattogramBranch : CourierBranch
{
    protected override ITransport CreateTransport() => new Truck(); // @step:chattogram-create
}

class BarishalBranch : CourierBranch
{
    protected override ITransport CreateTransport() => new Launch(); // @step:barishal-create
}

// {{usage}}
CourierBranch branch = branches[selectedCity]; // @step:pick-branch
var booking = branch.SendParcel(new Parcel("Saree", destination)); // @step:client-send,done
`

const without = `
// {{withoutIntro}}
Booking SendParcel(Parcel parcel, string city) // @step:l1-start
{
    ITransport transport = city switch // @step:l1-switch
    {
        "dhaka" => new RickshawVan(), // @step:l1-new-van
        "chattogram" => new Truck(), // @step:l1-new-truck
        "barishal" => new Launch(), // @step:l1-new-launch
        _ => throw new ArgumentException("No transport for " + city),
    };
    // {{withoutTodo}} // @step:l1-todo

    var tracking = NewTrackingId();
    var eta = transport.Deliver(parcel.To); // @step:l1-deliver
    return new Booking(tracking, transport.Fee, eta); // @step:l1-result
}
`

const withPattern = `
// {{withAdd}}
class Drone : ITransport // @step:build-product
{
    public int Fee => 200;
    public string Deliver(string to) => "Flying over the hills to " + to; // @step:sylhet-deliver
}

class SylhetBranch : CourierBranch // @step:build-creator
{
    protected override ITransport CreateTransport() => new Drone(); // @step:build-creator,sylhet-create
}

// {{withSame}}
new SylhetBranch().SendParcel(new Parcel("Tea", "Srimangal")); // @step:sylhet-send,sylhet-done
`

export const csharp: CodeSet = {
  main: { filename: 'CourierBranch.cs', source: main },
  without: { filename: 'CourierWithoutFactoryMethod.cs', source: without },
  with: { filename: 'CourierWithFactoryMethod.cs', source: withPattern },
}

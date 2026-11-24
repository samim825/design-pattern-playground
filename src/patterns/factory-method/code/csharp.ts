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
Booking SendParcel(Parcel parcel, string city)
{
    ITransport transport = city switch
    {
        "dhaka" => new RickshawVan(),
        "chattogram" => new Truck(),
        "barishal" => new Launch(),
        _ => throw new ArgumentException("No transport for " + city),
    };
    // {{withoutTodo}}

    var tracking = NewTrackingId();
    var eta = transport.Deliver(parcel.To);
    return new Booking(tracking, transport.Fee, eta);
}
`

const withPattern = `
// {{withAdd}}
class Drone : ITransport
{
    public int Fee => 200;
    public string Deliver(string to) => "Flying over the hills to " + to;
}

class SylhetBranch : CourierBranch
{
    protected override ITransport CreateTransport() => new Drone();
}

// {{withSame}}
new SylhetBranch().SendParcel(new Parcel("Tea", "Srimangal"));
`

export const csharp: CodeSet = {
  main: { filename: 'CourierBranch.cs', source: main },
  without: { filename: 'CourierWithoutFactoryMethod.cs', source: without },
  with: { filename: 'CourierWithFactoryMethod.cs', source: withPattern },
}

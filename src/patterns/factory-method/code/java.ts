import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
record Parcel(String item, String to) {}
record Booking(String tracking, int fee, String eta) {}

// {{product}}
interface Transport {
    int fee();
    String deliver(String to);
}

class RickshawVan implements Transport {
    public int fee() { return 60; }
    public String deliver(String to) { return "Through the lanes to " + to + ", today"; } // @step:dhaka-deliver
}

class Truck implements Transport {
    public int fee() { return 150; }
    public String deliver(String to) { return "On the highway to " + to + ", tomorrow"; } // @step:chattogram-deliver
}

class Launch implements Transport {
    public int fee() { return 120; }
    public String deliver(String to) { return "Down the river to " + to + ", overnight"; } // @step:barishal-deliver
}

// {{creator}}
abstract class CourierBranch {
    // {{factoryMethod}}
    protected abstract Transport createTransport();

    // {{shared}}
    public Booking sendParcel(Parcel parcel) {
        Transport transport = createTransport(); // {{noNew}} // @step:call-factory
        String tracking = newTrackingId(); // @step:book
        String eta = transport.deliver(parcel.to()); // @step:deliver
        return new Booking(tracking, transport.fee(), eta); // @step:done
    }
}

// {{concreteCreators}}
class DhakaBranch extends CourierBranch {
    @Override protected Transport createTransport() { return new RickshawVan(); } // @step:dhaka-create
}

class ChattogramBranch extends CourierBranch {
    @Override protected Transport createTransport() { return new Truck(); } // @step:chattogram-create
}

class BarishalBranch extends CourierBranch {
    @Override protected Transport createTransport() { return new Launch(); } // @step:barishal-create
}

// {{usage}}
CourierBranch branch = branches.get(selectedCity); // @step:pick-branch
Booking booking = branch.sendParcel(new Parcel("Saree", destination)); // @step:client-send,done
`

const without = `
// {{withoutIntro}}
Booking sendParcel(Parcel parcel, String city) { // @step:l1-start
    Transport transport = switch (city) { // @step:l1-switch
        case "dhaka" -> new RickshawVan(); // @step:l1-new-van
        case "chattogram" -> new Truck(); // @step:l1-new-truck
        case "barishal" -> new Launch(); // @step:l1-new-launch
        default -> throw new IllegalArgumentException("No transport for " + city);
    };
    // {{withoutTodo}} // @step:l1-todo

    String tracking = newTrackingId();
    String eta = transport.deliver(parcel.to()); // @step:l1-deliver
    return new Booking(tracking, transport.fee(), eta); // @step:l1-result
}
`

const withPattern = `
// {{withAdd}}
class Drone implements Transport { // @step:build-product
    public int fee() { return 200; }
    public String deliver(String to) { return "Flying over the hills to " + to; } // @step:sylhet-deliver
}

class SylhetBranch extends CourierBranch { // @step:build-creator
    @Override protected Transport createTransport() { return new Drone(); } // @step:build-creator,sylhet-create
}

// {{withSame}}
new SylhetBranch().sendParcel(new Parcel("Tea", "Srimangal")); // @step:sylhet-send,sylhet-done
`

export const java: CodeSet = {
  main: { filename: 'CourierBranch.java', source: main },
  without: { filename: 'CourierWithoutFactoryMethod.java', source: without },
  with: { filename: 'CourierWithFactoryMethod.java', source: withPattern },
}

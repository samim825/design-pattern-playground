import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Swift style: the Creator is a protocol, and a protocol extension holds the shared workflow.

const main = `
struct Parcel { let item: String; let to: String }
struct Booking { let tracking: String; let fee: Int; let eta: String }

// {{product}}
protocol Transport {
    var fee: Int { get }
    func deliver(to: String) -> String
}

struct RickshawVan: Transport {
    let fee = 60
    func deliver(to: String) -> String { "Through the lanes to " + to + ", today" } // @step:dhaka-deliver
}

struct Truck: Transport {
    let fee = 150
    func deliver(to: String) -> String { "On the highway to " + to + ", tomorrow" } // @step:chattogram-deliver
}

struct Launch: Transport {
    let fee = 120
    func deliver(to: String) -> String { "Down the river to " + to + ", overnight" } // @step:barishal-deliver
}

// {{creator}}
protocol CourierBranch {
    // {{factoryMethod}}
    func createTransport() -> any Transport
}

extension CourierBranch {
    // {{shared}}
    func sendParcel(_ parcel: Parcel) -> Booking {
        let transport = createTransport() // {{noConcrete}} // @step:call-factory
        let tracking = newTrackingID() // @step:book
        let eta = transport.deliver(to: parcel.to) // @step:deliver
        return Booking(tracking: tracking, fee: transport.fee, eta: eta) // @step:done
    }
}

// {{concreteCreators}}
struct DhakaBranch: CourierBranch {
    func createTransport() -> any Transport { RickshawVan() } // @step:dhaka-create
}

struct ChattogramBranch: CourierBranch {
    func createTransport() -> any Transport { Truck() } // @step:chattogram-create
}

struct BarishalBranch: CourierBranch {
    func createTransport() -> any Transport { Launch() } // @step:barishal-create
}

// {{usage}}
let branch: any CourierBranch = branches[selectedCity]! // @step:pick-branch
let booking = branch.sendParcel(Parcel(item: "Saree", to: destination)) // @step:client-send,done
`

const without = `
// {{withoutIntro}}
func sendParcel(_ parcel: Parcel, city: String) throws -> Booking { // @step:l1-start
    let transport: any Transport

    switch city { // @step:l1-switch
    case "dhaka": transport = RickshawVan() // @step:l1-new-van
    case "chattogram": transport = Truck() // @step:l1-new-truck
    case "barishal": transport = Launch() // @step:l1-new-launch
    default: throw CourierError.noTransport(city)
    }
    // {{withoutTodo}} // @step:l1-todo

    let tracking = newTrackingID()
    let eta = transport.deliver(to: parcel.to) // @step:l1-deliver
    return Booking(tracking: tracking, fee: transport.fee, eta: eta) // @step:l1-result
}
`

const withPattern = `
// {{withAdd}}
struct Drone: Transport { // @step:build-product
    let fee = 200
    func deliver(to: String) -> String { "Flying over the hills to " + to } // @step:sylhet-deliver
}

struct SylhetBranch: CourierBranch { // @step:build-creator
    func createTransport() -> any Transport { Drone() } // @step:build-creator,sylhet-create
}

// {{withSame}}
SylhetBranch().sendParcel(Parcel(item: "Tea", to: "Srimangal")) // @step:sylhet-send,sylhet-done
`

export const swift: CodeSet = {
  main: { filename: 'CourierBranch.swift', source: main },
  without: { filename: 'CourierWithoutFactoryMethod.swift', source: without },
  with: { filename: 'CourierWithFactoryMethod.swift', source: withPattern },
}

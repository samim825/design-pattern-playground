import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Go has no inheritance, so the "subclass" supplies the factory method as a function field.

const main = `
type Parcel struct{ Item, To string }
type Booking struct {
    Tracking string
    Fee      int
    Eta      string
}

// {{product}}
type Transport interface {
    Fee() int
    Deliver(to string) string
}

type RickshawVan struct{}

func (RickshawVan) Fee() int { return 60 }
func (RickshawVan) Deliver(to string) string { return "Through the lanes to " + to + ", today" } // @step:dhaka-deliver

type Truck struct{}

func (Truck) Fee() int { return 150 }
func (Truck) Deliver(to string) string { return "On the highway to " + to + ", tomorrow" } // @step:chattogram-deliver

type Launch struct{}

func (Launch) Fee() int { return 120 }
func (Launch) Deliver(to string) string { return "Down the river to " + to + ", overnight" } // @step:barishal-deliver

// {{creator}}
type CourierBranch struct {
    // {{factoryMethod}}
    createTransport func() Transport
}

// {{shared}}
func (b CourierBranch) SendParcel(p Parcel) Booking {
    transport := b.createTransport() // {{noConcrete}} // @step:call-factory
    tracking := newTrackingID() // @step:book
    eta := transport.Deliver(p.To) // @step:deliver
    return Booking{tracking, transport.Fee(), eta} // @step:done
}

// {{concreteCreators}}
var DhakaBranch = CourierBranch{
    createTransport: func() Transport { return RickshawVan{} }, // @step:dhaka-create
}

var ChattogramBranch = CourierBranch{
    createTransport: func() Transport { return Truck{} }, // @step:chattogram-create
}

var BarishalBranch = CourierBranch{
    createTransport: func() Transport { return Launch{} }, // @step:barishal-create
}

// {{usage}}
branch := branches[selectedCity] // @step:pick-branch
booking := branch.SendParcel(Parcel{"Saree", destination}) // @step:client-send,done
`

const without = `
// {{withoutIntro}}
func SendParcel(p Parcel, city string) (Booking, error) { // @step:l1-start
    var transport Transport

    switch city { // @step:l1-switch
    case "dhaka":
        transport = RickshawVan{} // @step:l1-new-van
    case "chattogram":
        transport = Truck{} // @step:l1-new-truck
    case "barishal":
        transport = Launch{} // @step:l1-new-launch
    default:
        return Booking{}, errors.New("no transport for " + city)
    }
    // {{withoutTodo}} // @step:l1-todo

    tracking := newTrackingID()
    eta := transport.Deliver(p.To) // @step:l1-deliver
    return Booking{tracking, transport.Fee(), eta}, nil // @step:l1-result
}
`

const withPattern = `
// {{withAdd}}
type Drone struct{} // @step:build-product

func (Drone) Fee() int { return 200 }
func (Drone) Deliver(to string) string { return "Flying over the hills to " + to } // @step:sylhet-deliver

var SylhetBranch = CourierBranch{ // @step:build-creator
    createTransport: func() Transport { return Drone{} }, // @step:build-creator,sylhet-create
}

// {{withSame}}
SylhetBranch.SendParcel(Parcel{"Tea", "Srimangal"}) // @step:sylhet-send,sylhet-done
`

export const go: CodeSet = {
  main: { filename: 'courier.go', source: main },
  without: { filename: 'courier_without_factory_method.go', source: without },
  with: { filename: 'courier_with_factory_method.go', source: withPattern },
}

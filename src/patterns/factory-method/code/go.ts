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
func SendParcel(p Parcel, city string) (Booking, error) {
    var transport Transport

    switch city {
    case "dhaka":
        transport = RickshawVan{}
    case "chattogram":
        transport = Truck{}
    case "barishal":
        transport = Launch{}
    default:
        return Booking{}, errors.New("no transport for " + city)
    }
    // {{withoutTodo}}

    tracking := newTrackingID()
    eta := transport.Deliver(p.To)
    return Booking{tracking, transport.Fee(), eta}, nil
}
`

const withPattern = `
// {{withAdd}}
type Drone struct{}

func (Drone) Fee() int { return 200 }
func (Drone) Deliver(to string) string { return "Flying over the hills to " + to }

var SylhetBranch = CourierBranch{
    createTransport: func() Transport { return Drone{} },
}

// {{withSame}}
SylhetBranch.SendParcel(Parcel{"Tea", "Srimangal"})
`

export const go: CodeSet = {
  main: { filename: 'courier.go', source: main },
  without: { filename: 'courier_without_factory_method.go', source: without },
  with: { filename: 'courier_with_factory_method.go', source: withPattern },
}

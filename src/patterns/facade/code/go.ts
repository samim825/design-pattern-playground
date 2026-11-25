import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Go: the facade is a plain struct that holds the subsystem structs; an optional guide is a
// nil *Guide, so the guide call sits inside an if.

const main = `
// {{subsystems}}
type BusService struct{}
type HotelService struct{}
type GuideService struct{}
type SmsService struct{}

func (BusService) Reserve(date string, people int) Seat   { return busAPI.Book(date, people) }
func (HotelService) Book(checkIn string, nights int) Room { return hotelAPI.Reserve(checkIn, nights) }
func (GuideService) Assign(pickup string) *Guide          { return guideDesk.NextFree(pickup) }
func (SmsService) SendTicket(phone, text string)          { smsGateway.Push(phone, text) }

// {{packageType}}
type TripPackage struct {
    Nights    int
    WithGuide bool
}

var (
    Budget  = TripPackage{Nights: 2, WithGuide: false}
    Classic = TripPackage{Nights: 2, WithGuide: true}
    Family  = TripPackage{Nights: 3, WithGuide: true}
)

// {{facade}}
type TripFacade struct {
    bus   BusService // {{hidden}}
    hotel HotelService
    guide GuideService
    sms   SmsService
}

func (f *TripFacade) BookTrip(pkg TripPackage, people int, phone string) Booking { // {{oneDoor}} // @step:call
    seat := f.bus.Reserve("12 Dec", people) // {{busFirst}} // @step:bus
    room := f.hotel.Book(seat.Arrival, pkg.Nights) // {{hotelNeeds}} // @step:hotel
    var tourGuide *Guide
    if pkg.WithGuide {
        tourGuide = f.guide.Assign(room.Address) // {{guideNeeds}} // @step:guide
    }
    f.sms.SendTicket(phone, ticket(seat, room, tourGuide)) // {{smsLast}} // @step:sms
    return Booking{seat, room, tourGuide} // @step:done
}

// {{usage}}
agency := &TripFacade{}
booking := agency.BookTrip(Family, 4, "01711-000000") // {{oneCall}} // @step:pick,call,done
`

const without = `
// {{withoutIntro}}
// {{knowsAll}}
type TripScreen struct {
    bus   BusService
    hotel HotelService
    guide GuideService
    sms   SmsService
}

// {{orderYours}}
func (s *TripScreen) Book(trip TripRequest) Booking { // @step:l1-start
    seat := s.bus.Reserve("12 Dec", trip.People) // {{busFirst}} // @step:l1-bus
    room := s.hotel.Book(seat.Arrival, trip.Nights) // {{hotelNeeds}} // @step:l1-hotel
    var tourGuide *Guide
    if trip.WithGuide {
        tourGuide = s.guide.Assign(room.Address) // {{guideNeeds}} // @step:l1-guide
    }
    s.sms.SendTicket(trip.Phone, ticket(seat, room, tourGuide)) // {{smsLast}} // @step:l1-sms
    return Booking{seat, room, tourGuide} // @step:l1-result
}

// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
type InsuranceService struct{} // @step:build-class

func (InsuranceService) Cover(seat Seat, people int) Policy { return insurer.Issue(seat, people) } // {{newSub}} // @step:build-class

// {{withInside}}
type TripFacade struct {
    insurance InsuranceService // {{onlyHere}} // @step:build-call
    // {{restSame}}
}

func (f *TripFacade) BookTrip(pkg TripPackage, people int, phone string) Booking { // @step:call-new
    seat := f.bus.Reserve("12 Dec", people) // @step:sub-old
    policy := f.insurance.Cover(seat, people) // {{newLine}} // @step:build-call,insure
    room := f.hotel.Book(seat.Arrival, pkg.Nights) // @step:sub-old
    var tourGuide *Guide
    if pkg.WithGuide {
        tourGuide = f.guide.Assign(room.Address) // @step:sub-old
    }
    f.sms.SendTicket(phone, ticket(seat, room, tourGuide, policy)) // {{smsPolicy}} // @step:sms-new
    return Booking{seat, room, tourGuide, policy} // @step:done-new
}

// {{withSame}}
booking := agency.BookTrip(Family, 4, "01711-000000") // {{clientSame}} // @step:client-same,call-new,done-new
// {{withZero}}
`

export const go: CodeSet = {
  main: { filename: 'trip.go', source: main },
  without: { filename: 'trip_without_facade.go', source: without },
  with: { filename: 'trip_with_facade.go', source: withPattern },
}

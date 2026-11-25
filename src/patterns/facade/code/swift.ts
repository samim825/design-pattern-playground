import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Swift: subsystems and the facade are small structs; packages are static members, so the
// client can write .family.

const main = `
// {{subsystems}}
struct BusService {
    func reserve(date: String, people: Int) -> Seat { busAPI.book(date, people) }
}
struct HotelService {
    func book(checkIn: String, nights: Int) -> Room { hotelAPI.reserve(checkIn, nights) }
}
struct GuideService {
    func assign(pickup: String) -> Guide { guideDesk.nextFree(pickup) }
}
struct SmsService {
    func sendTicket(to phone: String, text: String) { smsGateway.push(phone, text) }
}

// {{packageType}}
struct TripPackage {
    let nights: Int
    let withGuide: Bool
    static let budget = TripPackage(nights: 2, withGuide: false)
    static let classic = TripPackage(nights: 2, withGuide: true)
    static let family = TripPackage(nights: 3, withGuide: true)
}

// {{facade}}
struct TripFacade {
    private let bus = BusService() // {{hidden}}
    private let hotel = HotelService()
    private let guide = GuideService()
    private let sms = SmsService()

    func bookTrip(_ pkg: TripPackage, people: Int, phone: String) -> Booking { // {{oneDoor}} // @step:call
        let seat = bus.reserve(date: "12 Dec", people: people) // {{busFirst}} // @step:bus
        let room = hotel.book(checkIn: seat.arrival, nights: pkg.nights) // {{hotelNeeds}} // @step:hotel
        let tourGuide = pkg.withGuide ? guide.assign(pickup: room.address) : nil // {{guideNeeds}} // @step:guide
        sms.sendTicket(to: phone, text: ticket(seat, room, tourGuide)) // {{smsLast}} // @step:sms
        return Booking(seat: seat, room: room, tourGuide: tourGuide) // @step:done
    }
}

// {{usage}}
let agency = TripFacade()
let booking = agency.bookTrip(.family, people: 4, phone: "01711-000000") // {{oneCall}} // @step:pick,call,done
`

const without = `
// {{withoutIntro}}
struct TripScreen {
    // {{knowsAll}}
    let bus: BusService
    let hotel: HotelService
    let guide: GuideService
    let sms: SmsService

    // {{orderYours}}
    func book(_ trip: TripRequest) -> Booking { // @step:l1-start
        let seat = bus.reserve(date: "12 Dec", people: trip.people) // {{busFirst}} // @step:l1-bus
        let room = hotel.book(checkIn: seat.arrival, nights: trip.nights) // {{hotelNeeds}} // @step:l1-hotel
        let tourGuide = trip.withGuide ? guide.assign(pickup: room.address) : nil // {{guideNeeds}} // @step:l1-guide
        sms.sendTicket(to: trip.phone, text: ticket(seat, room, tourGuide)) // {{smsLast}} // @step:l1-sms
        return Booking(seat: seat, room: room, tourGuide: tourGuide) // @step:l1-result
    }
}

// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
struct InsuranceService { // @step:build-class
    func cover(_ seat: Seat, people: Int) -> Policy { insurer.issue(seat, people) } // {{newSub}} // @step:build-class
}

// {{withInside}}
struct TripFacade {
    private let insurance = InsuranceService() // {{onlyHere}} // @step:build-call
    // {{restSame}}

    func bookTrip(_ pkg: TripPackage, people: Int, phone: String) -> Booking { // @step:call-new
        let seat = bus.reserve(date: "12 Dec", people: people) // @step:sub-old
        let policy = insurance.cover(seat, people: people) // {{newLine}} // @step:build-call,insure
        let room = hotel.book(checkIn: seat.arrival, nights: pkg.nights) // @step:sub-old
        let tourGuide = pkg.withGuide ? guide.assign(pickup: room.address) : nil // @step:sub-old
        sms.sendTicket(to: phone, text: ticket(seat, room, tourGuide, policy)) // {{smsPolicy}} // @step:sms-new
        return Booking(seat: seat, room: room, tourGuide: tourGuide, policy: policy) // @step:done-new
    }
}

// {{withSame}}
let booking = agency.bookTrip(.family, people: 4, phone: "01711-000000") // {{clientSame}} // @step:client-same,call-new,done-new
// {{withZero}}
`

export const swift: CodeSet = {
  main: { filename: 'TripFacade.swift', source: main },
  without: { filename: 'TripScreen.swift', source: without },
  with: { filename: 'TripFacadeWithInsurance.swift', source: withPattern },
}

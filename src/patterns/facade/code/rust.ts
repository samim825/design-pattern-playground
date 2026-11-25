import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Rust: the facade is a struct that owns the subsystems (all Default, so TripFacade::default()
// builds them); an optional guide is an Option<Guide> made with bool::then.

const main = `
// {{subsystems}}
#[derive(Default)] pub struct BusService;
#[derive(Default)] pub struct HotelService;
#[derive(Default)] pub struct GuideService;
#[derive(Default)] pub struct SmsService;

impl BusService { pub fn reserve(&self, date: &str, people: u32) -> Seat { bus_api::book(date, people) } }
impl HotelService { pub fn book(&self, check_in: &str, nights: u32) -> Room { hotel_api::reserve(check_in, nights) } }
impl GuideService { pub fn assign(&self, pickup: &str) -> Guide { guide_desk::next_free(pickup) } }
impl SmsService { pub fn send_ticket(&self, phone: &str, text: &str) { sms_gateway::push(phone, text) } }

// {{packageType}}
pub struct TripPackage { pub nights: u32, pub with_guide: bool }
pub const BUDGET: TripPackage = TripPackage { nights: 2, with_guide: false };
pub const CLASSIC: TripPackage = TripPackage { nights: 2, with_guide: true };
pub const FAMILY: TripPackage = TripPackage { nights: 3, with_guide: true };

// {{facade}}
#[derive(Default)]
pub struct TripFacade {
    bus: BusService, // {{hidden}}
    hotel: HotelService,
    guide: GuideService,
    sms: SmsService,
}

impl TripFacade {
    pub fn book_trip(&self, pkg: &TripPackage, people: u32, phone: &str) -> Booking { // {{oneDoor}} // @step:call
        let seat = self.bus.reserve("12 Dec", people); // {{busFirst}} // @step:bus
        let room = self.hotel.book(&seat.arrival, pkg.nights); // {{hotelNeeds}} // @step:hotel
        let tour_guide = pkg.with_guide.then(|| self.guide.assign(&room.address)); // {{guideNeeds}} // @step:guide
        self.sms.send_ticket(phone, &ticket(&seat, &room, tour_guide.as_ref())); // {{smsLast}} // @step:sms
        Booking { seat, room, tour_guide } // @step:done
    }
}

// {{usage}}
let agency = TripFacade::default();
let booking = agency.book_trip(&FAMILY, 4, "01711-000000"); // {{oneCall}} // @step:pick,call,done
`

const without = `
// {{withoutIntro}}
// {{knowsAll}}
pub struct TripScreen {
    bus: BusService,
    hotel: HotelService,
    guide: GuideService,
    sms: SmsService,
}

impl TripScreen {
    // {{orderYours}}
    pub fn book(&self, trip: &TripRequest) -> Booking { // @step:l1-start
        let seat = self.bus.reserve("12 Dec", trip.people); // {{busFirst}} // @step:l1-bus
        let room = self.hotel.book(&seat.arrival, trip.nights); // {{hotelNeeds}} // @step:l1-hotel
        let tour_guide = trip.with_guide.then(|| self.guide.assign(&room.address)); // {{guideNeeds}} // @step:l1-guide
        self.sms.send_ticket(&trip.phone, &ticket(&seat, &room, tour_guide.as_ref())); // {{smsLast}} // @step:l1-sms
        Booking { seat, room, tour_guide } // @step:l1-result
    }
}

// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
#[derive(Default)]
pub struct InsuranceService; // @step:build-class
impl InsuranceService {
    pub fn cover(&self, seat: &Seat, people: u32) -> Policy { insurer::issue(seat, people) } // {{newSub}} // @step:build-class
}

// {{withInside}}
#[derive(Default)]
pub struct TripFacade {
    insurance: InsuranceService, // {{onlyHere}} // @step:build-call
    // {{restSame}}
}

impl TripFacade {
    pub fn book_trip(&self, pkg: &TripPackage, people: u32, phone: &str) -> Booking { // @step:call-new
        let seat = self.bus.reserve("12 Dec", people); // @step:sub-old
        let policy = self.insurance.cover(&seat, people); // {{newLine}} // @step:build-call,insure
        let room = self.hotel.book(&seat.arrival, pkg.nights); // @step:sub-old
        let tour_guide = pkg.with_guide.then(|| self.guide.assign(&room.address)); // @step:sub-old
        self.sms.send_ticket(phone, &ticket(&seat, &room, tour_guide.as_ref(), &policy)); // {{smsPolicy}} // @step:sms-new
        Booking { seat, room, tour_guide, policy } // @step:done-new
    }
}

// {{withSame}}
let booking = agency.book_trip(&FAMILY, 4, "01711-000000"); // {{clientSame}} // @step:client-same,call-new,done-new
// {{withZero}}
`

export const rust: CodeSet = {
  main: { filename: 'trip.rs', source: main },
  without: { filename: 'trip_without_facade.rs', source: without },
  with: { filename: 'trip_with_facade.rs', source: withPattern },
}

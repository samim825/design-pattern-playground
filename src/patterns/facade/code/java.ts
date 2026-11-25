import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{subsystems}}
class BusService {
    Seat reserve(String date, int people) { return BusApi.book(date, people); }
}
class HotelService {
    Room book(String checkIn, int nights) { return HotelApi.reserve(checkIn, nights); }
}
class GuideService {
    Guide assign(String pickup) { return GuideDesk.nextFree(pickup); }
}
class SmsService {
    void sendTicket(String phone, String text) { SmsGateway.push(phone, text); }
}

// {{packageType}}
record TripPackage(int nights, boolean withGuide) {
    static final TripPackage BUDGET = new TripPackage(2, false);
    static final TripPackage CLASSIC = new TripPackage(2, true);
    static final TripPackage FAMILY = new TripPackage(3, true);
}

// {{facade}}
final class TripFacade {
    private final BusService bus = new BusService(); // {{hidden}}
    private final HotelService hotel = new HotelService();
    private final GuideService guide = new GuideService();
    private final SmsService sms = new SmsService();

    Booking bookTrip(TripPackage pkg, int people, String phone) { // {{oneDoor}} // @step:call
        Seat seat = bus.reserve("12 Dec", people); // {{busFirst}} // @step:bus
        Room room = hotel.book(seat.arrival(), pkg.nights()); // {{hotelNeeds}} // @step:hotel
        Guide tourGuide = pkg.withGuide() ? guide.assign(room.address()) : null; // {{guideNeeds}} // @step:guide
        sms.sendTicket(phone, Ticket.of(seat, room, tourGuide)); // {{smsLast}} // @step:sms
        return new Booking(seat, room, tourGuide); // @step:done
    }
}

// {{usage}}
var agency = new TripFacade();
var booking = agency.bookTrip(TripPackage.FAMILY, 4, "01711-000000"); // {{oneCall}} // @step:pick,call,done
`

const without = `
// {{withoutIntro}}
// {{knowsAll}}
record TripScreen(BusService bus, HotelService hotel, GuideService guide, SmsService sms) {

    // {{orderYours}}
    Booking book(TripRequest trip) { // @step:l1-start
        Seat seat = bus.reserve("12 Dec", trip.people()); // {{busFirst}} // @step:l1-bus
        Room room = hotel.book(seat.arrival(), trip.nights()); // {{hotelNeeds}} // @step:l1-hotel
        Guide tourGuide = trip.withGuide() ? guide.assign(room.address()) : null; // {{guideNeeds}} // @step:l1-guide
        sms.sendTicket(trip.phone(), Ticket.of(seat, room, tourGuide)); // {{smsLast}} // @step:l1-sms
        return new Booking(seat, room, tourGuide); // @step:l1-result
    }
}

// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
class InsuranceService { // @step:build-class
    Policy cover(Seat seat, int people) { return Insurer.issue(seat, people); } // {{newSub}} // @step:build-class
}

// {{withInside}}
final class TripFacade {
    private final InsuranceService insurance = new InsuranceService(); // {{onlyHere}} // @step:build-call
    // {{restSame}}

    Booking bookTrip(TripPackage pkg, int people, String phone) { // @step:call-new
        Seat seat = bus.reserve("12 Dec", people); // @step:sub-old
        Policy policy = insurance.cover(seat, people); // {{newLine}} // @step:build-call,insure
        Room room = hotel.book(seat.arrival(), pkg.nights()); // @step:sub-old
        Guide tourGuide = pkg.withGuide() ? guide.assign(room.address()) : null; // @step:sub-old
        sms.sendTicket(phone, Ticket.of(seat, room, tourGuide, policy)); // {{smsPolicy}} // @step:sms-new
        return new Booking(seat, room, tourGuide, policy); // @step:done-new
    }
}

// {{withSame}}
var booking = agency.bookTrip(TripPackage.FAMILY, 4, "01711-000000"); // {{clientSame}} // @step:client-same,call-new,done-new
// {{withZero}}
`

export const java: CodeSet = {
  main: { filename: 'TripFacade.java', source: main },
  without: { filename: 'TripScreen.java', source: without },
  with: { filename: 'TripFacadeWithInsurance.java', source: withPattern },
}

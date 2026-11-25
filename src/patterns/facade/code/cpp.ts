import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// C++: the facade owns its subsystems by value (no heap needed); an optional guide is a
// std::optional<Guide>.

const main = `
// {{subsystems}}
class BusService {
public:
    Seat reserve(const std::string& date, int people) { return busApi.book(date, people); }
};
class HotelService {
public:
    Room book(const std::string& checkIn, int nights) { return hotelApi.reserve(checkIn, nights); }
};
class GuideService {
public:
    Guide assign(const std::string& pickup) { return guideDesk.nextFree(pickup); }
};
class SmsService {
public:
    void sendTicket(const std::string& phone, const std::string& text) { smsGateway.push(phone, text); }
};

// {{packageType}}
struct TripPackage { int nights; bool withGuide; };
constexpr TripPackage Budget{2, false}, Classic{2, true}, Family{3, true};

// {{facade}}
class TripFacade {
    BusService bus; // {{hidden}}
    HotelService hotel;
    GuideService guide;
    SmsService sms;
public:
    Booking bookTrip(const TripPackage& pkg, int people, const std::string& phone) { // {{oneDoor}} // @step:call
        Seat seat = bus.reserve("12 Dec", people); // {{busFirst}} // @step:bus
        Room room = hotel.book(seat.arrival, pkg.nights); // {{hotelNeeds}} // @step:hotel
        std::optional<Guide> tourGuide;
        if (pkg.withGuide) tourGuide = guide.assign(room.address); // {{guideNeeds}} // @step:guide
        sms.sendTicket(phone, ticket(seat, room, tourGuide)); // {{smsLast}} // @step:sms
        return {seat, room, tourGuide}; // @step:done
    }
};

// {{usage}}
TripFacade agency;
Booking booking = agency.bookTrip(Family, 4, "01711-000000"); // {{oneCall}} // @step:pick,call,done
`

const without = `
// {{withoutIntro}}
class TripScreen {
    // {{knowsAll}}
    BusService& bus;
    HotelService& hotel;
    GuideService& guide;
    SmsService& sms;
public:
    TripScreen(BusService& b, HotelService& h, GuideService& g, SmsService& s)
        : bus(b), hotel(h), guide(g), sms(s) {}

    // {{orderYours}}
    Booking book(const TripRequest& trip) { // @step:l1-start
        Seat seat = bus.reserve("12 Dec", trip.people); // {{busFirst}} // @step:l1-bus
        Room room = hotel.book(seat.arrival, trip.nights); // {{hotelNeeds}} // @step:l1-hotel
        std::optional<Guide> tourGuide;
        if (trip.withGuide) tourGuide = guide.assign(room.address); // {{guideNeeds}} // @step:l1-guide
        sms.sendTicket(trip.phone, ticket(seat, room, tourGuide)); // {{smsLast}} // @step:l1-sms
        return {seat, room, tourGuide}; // @step:l1-result
    }
};

// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
class InsuranceService { // @step:build-class
public:
    Policy cover(const Seat& seat, int people) { return insurer.issue(seat, people); } // {{newSub}} // @step:build-class
};

// {{withInside}}
class TripFacade {
    InsuranceService insurance; // {{onlyHere}} // @step:build-call
    // {{restSame}}
public:
    Booking bookTrip(const TripPackage& pkg, int people, const std::string& phone) { // @step:call-new
        Seat seat = bus.reserve("12 Dec", people); // @step:sub-old
        Policy policy = insurance.cover(seat, people); // {{newLine}} // @step:build-call,insure
        Room room = hotel.book(seat.arrival, pkg.nights); // @step:sub-old
        std::optional<Guide> tourGuide;
        if (pkg.withGuide) tourGuide = guide.assign(room.address); // @step:sub-old
        sms.sendTicket(phone, ticket(seat, room, tourGuide, policy)); // {{smsPolicy}} // @step:sms-new
        return {seat, room, tourGuide, policy}; // @step:done-new
    }
};

// {{withSame}}
Booking booking = agency.bookTrip(Family, 4, "01711-000000"); // {{clientSame}} // @step:client-same,call-new,done-new
// {{withZero}}
`

export const cpp: CodeSet = {
  main: { filename: 'trip.cpp', source: main },
  without: { filename: 'trip_without_facade.cpp', source: without },
  with: { filename: 'trip_with_facade.cpp', source: withPattern },
}

import type { CodeSet } from '@/types/pattern'

/*
 * Conventions (see CLAUDE.md):
 *   // {{key}}        → translated comment from content.<lang>.ts → codeComments[key]
 *   // @step:a,b      → this line lights up while visual step a or b runs (stripped on display)
 * Seat, Room, Guide, Policy, Booking and the *Api helpers are left undeclared to keep it short.
 */

const main = `
// {{subsystems}}
class BusService {
  reserve(date: string, people: number): Seat { return busApi.book(date, people); }
}
class HotelService {
  book(checkIn: string, nights: number): Room { return hotelApi.reserve(checkIn, nights); }
}
class GuideService {
  assign(pickup: string): Guide { return guideDesk.nextFree(pickup); }
}
class SmsService {
  sendTicket(phone: string, text: string): void { smsGateway.push(phone, text); }
}

// {{packageType}}
interface TripPackage {
  readonly nights: number;
  readonly withGuide: boolean;
}
const PACKAGES = {
  budget: { nights: 2, withGuide: false },
  classic: { nights: 2, withGuide: true },
  family: { nights: 3, withGuide: true },
} satisfies Record<string, TripPackage>;

// {{facade}}
class TripFacade {
  private readonly bus = new BusService(); // {{hidden}}
  private readonly hotel = new HotelService();
  private readonly guide = new GuideService();
  private readonly sms = new SmsService();

  bookTrip(pkg: TripPackage, people: number, phone: string): Booking { // {{oneDoor}} // @step:call
    const seat = this.bus.reserve('12 Dec', people); // {{busFirst}} // @step:bus
    const room = this.hotel.book(seat.arrival, pkg.nights); // {{hotelNeeds}} // @step:hotel
    const tourGuide = pkg.withGuide ? this.guide.assign(room.address) : null; // {{guideNeeds}} // @step:guide
    this.sms.sendTicket(phone, ticket(seat, room, tourGuide)); // {{smsLast}} // @step:sms
    return { seat, room, tourGuide }; // @step:done
  }
}

// {{usage}}
const agency = new TripFacade();
const booking = agency.bookTrip(PACKAGES.family, 4, '01711-000000'); // {{oneCall}} // @step:pick,call,done
`

const without = `
// {{withoutIntro}}
class TripScreen {
  // {{knowsAll}}
  constructor(
    private readonly bus: BusService,
    private readonly hotel: HotelService,
    private readonly guide: GuideService,
    private readonly sms: SmsService,
  ) {}

  // {{orderYours}}
  book(trip: TripRequest): Booking { // @step:l1-start
    const seat = this.bus.reserve('12 Dec', trip.people); // {{busFirst}} // @step:l1-bus
    const room = this.hotel.book(seat.arrival, trip.nights); // {{hotelNeeds}} // @step:l1-hotel
    const tourGuide = trip.withGuide ? this.guide.assign(room.address) : null; // {{guideNeeds}} // @step:l1-guide
    this.sms.sendTicket(trip.phone, ticket(seat, room, tourGuide)); // {{smsLast}} // @step:l1-sms
    return { seat, room, tourGuide }; // @step:l1-result
  }
}

// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
class InsuranceService { // @step:build-class
  cover(seat: Seat, people: number): Policy { return insurer.issue(seat, people); } // {{newSub}} // @step:build-class
}

// {{withInside}}
class TripFacade {
  private readonly insurance = new InsuranceService(); // {{onlyHere}} // @step:build-call
  // {{restSame}}

  bookTrip(pkg: TripPackage, people: number, phone: string): Booking { // @step:call-new
    const seat = this.bus.reserve('12 Dec', people); // @step:sub-old
    const policy = this.insurance.cover(seat, people); // {{newLine}} // @step:build-call,insure
    const room = this.hotel.book(seat.arrival, pkg.nights); // @step:sub-old
    const tourGuide = pkg.withGuide ? this.guide.assign(room.address) : null; // @step:sub-old
    this.sms.sendTicket(phone, ticket(seat, room, tourGuide, policy)); // {{smsPolicy}} // @step:sms-new
    return { seat, room, tourGuide, policy }; // @step:done-new
  }
}

// {{withSame}}
const booking = agency.bookTrip(PACKAGES.family, 4, '01711-000000'); // {{clientSame}} // @step:client-same,call-new,done-new
// {{withZero}}
`

export const ts: CodeSet = {
  main: { filename: 'trip.ts', source: main },
  without: { filename: 'trip-without-facade.ts', source: without },
  with: { filename: 'trip-with-facade.ts', source: withPattern },
}

import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
from dataclasses import dataclass

# {{subsystems}}
class BusService:
    def reserve(self, date: str, people: int) -> Seat: return bus_api.book(date, people)

class HotelService:
    def book(self, check_in: str, nights: int) -> Room: return hotel_api.reserve(check_in, nights)

class GuideService:
    def assign(self, pickup: str) -> Guide: return guide_desk.next_free(pickup)

class SmsService:
    def send_ticket(self, phone: str, text: str) -> None: sms_gateway.push(phone, text)

# {{packageType}}
@dataclass(frozen=True)
class TripPackage:
    nights: int
    with_guide: bool

PACKAGES = {
    "budget": TripPackage(nights=2, with_guide=False),
    "classic": TripPackage(nights=2, with_guide=True),
    "family": TripPackage(nights=3, with_guide=True),
}

# {{facade}}
class TripFacade:
    def __init__(self) -> None:
        self._bus = BusService()  # {{hidden}}
        self._hotel = HotelService()
        self._guide = GuideService()
        self._sms = SmsService()

    def book_trip(self, pkg: TripPackage, people: int, phone: str) -> Booking:  # {{oneDoor}}  # @step:call
        seat = self._bus.reserve("12 Dec", people)  # {{busFirst}}  # @step:bus
        room = self._hotel.book(seat.arrival, pkg.nights)  # {{hotelNeeds}}  # @step:hotel
        tour_guide = self._guide.assign(room.address) if pkg.with_guide else None  # {{guideNeeds}}  # @step:guide
        self._sms.send_ticket(phone, ticket(seat, room, tour_guide))  # {{smsLast}}  # @step:sms
        return Booking(seat, room, tour_guide)  # @step:done

# {{usage}}
agency = TripFacade()
booking = agency.book_trip(PACKAGES["family"], 4, "01711-000000")  # {{oneCall}}  # @step:pick,call,done
`

const without = `
# {{withoutIntro}}
@dataclass
class TripScreen:
    # {{knowsAll}}
    bus: BusService
    hotel: HotelService
    guide: GuideService
    sms: SmsService

    # {{orderYours}}
    def book(self, trip: TripRequest) -> Booking:  # @step:l1-start
        seat = self.bus.reserve("12 Dec", trip.people)  # {{busFirst}}  # @step:l1-bus
        room = self.hotel.book(seat.arrival, trip.nights)  # {{hotelNeeds}}  # @step:l1-hotel
        tour_guide = self.guide.assign(room.address) if trip.with_guide else None  # {{guideNeeds}}  # @step:l1-guide
        self.sms.send_ticket(trip.phone, ticket(seat, room, tour_guide))  # {{smsLast}}  # @step:l1-sms
        return Booking(seat, room, tour_guide)  # @step:l1-result

# {{withoutCopy}}  # @step:l1-copy
`

const withPattern = `
# {{withAdd}}
class InsuranceService:  # @step:build-class
    def cover(self, seat: Seat, people: int) -> Policy: return insurer.issue(seat, people)  # {{newSub}}  # @step:build-class

# {{withInside}}
class TripFacade:
    def __init__(self) -> None:
        self._insurance = InsuranceService()  # {{onlyHere}}  # @step:build-call
        # {{restSame}}

    def book_trip(self, pkg: TripPackage, people: int, phone: str) -> Booking:  # @step:call-new
        seat = self._bus.reserve("12 Dec", people)  # @step:sub-old
        policy = self._insurance.cover(seat, people)  # {{newLine}}  # @step:build-call,insure
        room = self._hotel.book(seat.arrival, pkg.nights)  # @step:sub-old
        tour_guide = self._guide.assign(room.address) if pkg.with_guide else None  # @step:sub-old
        self._sms.send_ticket(phone, ticket(seat, room, tour_guide, policy))  # {{smsPolicy}}  # @step:sms-new
        return Booking(seat, room, tour_guide, policy)  # @step:done-new

# {{withSame}}
booking = agency.book_trip(PACKAGES["family"], 4, "01711-000000")  # {{clientSame}}  # @step:client-same,call-new,done-new
# {{withZero}}
`

export const python: CodeSet = {
  main: { filename: 'trip.py', source: main },
  without: { filename: 'trip_without_facade.py', source: without },
  with: { filename: 'trip_with_facade.py', source: withPattern },
}

import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Ruby: the SMS method is send_ticket (a plain "send" would override Object#send).

const main = `
# {{subsystems}}
class BusService
  def reserve(date, people) = BusApi.book(date, people)
end

class HotelService
  def book(check_in, nights) = HotelApi.reserve(check_in, nights)
end

class GuideService
  def assign(pickup) = GuideDesk.next_free(pickup)
end

class SmsService
  def send_ticket(phone, text) = SmsGateway.push(phone, text)
end

# {{packageType}}
TripPackage = Data.define(:nights, :with_guide)
PACKAGES = {
  budget: TripPackage.new(nights: 2, with_guide: false),
  classic: TripPackage.new(nights: 2, with_guide: true),
  family: TripPackage.new(nights: 3, with_guide: true)
}.freeze

# {{facade}}
class TripFacade
  def initialize
    @bus = BusService.new # {{hidden}}
    @hotel = HotelService.new
    @guide = GuideService.new
    @sms = SmsService.new
  end

  def book_trip(pkg, people, phone) # {{oneDoor}} # @step:call
    seat = @bus.reserve("12 Dec", people) # {{busFirst}} # @step:bus
    room = @hotel.book(seat.arrival, pkg.nights) # {{hotelNeeds}} # @step:hotel
    tour_guide = pkg.with_guide ? @guide.assign(room.address) : nil # {{guideNeeds}} # @step:guide
    @sms.send_ticket(phone, ticket(seat, room, tour_guide)) # {{smsLast}} # @step:sms
    Booking.new(seat:, room:, tour_guide:) # @step:done
  end
end

# {{usage}}
agency = TripFacade.new
booking = agency.book_trip(PACKAGES[:family], 4, "01711-000000") # {{oneCall}} # @step:pick,call,done
`

const without = `
# {{withoutIntro}}
class TripScreen
  # {{knowsAll}}
  def initialize(bus, hotel, guide, sms)
    @bus, @hotel, @guide, @sms = bus, hotel, guide, sms
  end

  # {{orderYours}}
  def book(trip) # @step:l1-start
    seat = @bus.reserve("12 Dec", trip.people) # {{busFirst}} # @step:l1-bus
    room = @hotel.book(seat.arrival, trip.nights) # {{hotelNeeds}} # @step:l1-hotel
    tour_guide = trip.with_guide ? @guide.assign(room.address) : nil # {{guideNeeds}} # @step:l1-guide
    @sms.send_ticket(trip.phone, ticket(seat, room, tour_guide)) # {{smsLast}} # @step:l1-sms
    Booking.new(seat:, room:, tour_guide:) # @step:l1-result
  end
end

# {{withoutCopy}} # @step:l1-copy
`

const withPattern = `
# {{withAdd}}
class InsuranceService # @step:build-class
  def cover(seat, people) = Insurer.issue(seat, people) # {{newSub}} # @step:build-class
end

# {{withInside}}
class TripFacade
  def initialize
    @insurance = InsuranceService.new # {{onlyHere}} # @step:build-call
    # {{restSame}}
  end

  def book_trip(pkg, people, phone) # @step:call-new
    seat = @bus.reserve("12 Dec", people) # @step:sub-old
    policy = @insurance.cover(seat, people) # {{newLine}} # @step:build-call,insure
    room = @hotel.book(seat.arrival, pkg.nights) # @step:sub-old
    tour_guide = pkg.with_guide ? @guide.assign(room.address) : nil # @step:sub-old
    @sms.send_ticket(phone, ticket(seat, room, tour_guide, policy)) # {{smsPolicy}} # @step:sms-new
    Booking.new(seat:, room:, tour_guide:, policy:) # @step:done-new
  end
end

# {{withSame}}
booking = agency.book_trip(PACKAGES[:family], 4, "01711-000000") # {{clientSame}} # @step:client-same,call-new,done-new
# {{withZero}}
`

export const ruby: CodeSet = {
  main: { filename: 'trip.rb', source: main },
  without: { filename: 'trip_without_facade.rb', source: without },
  with: { filename: 'trip_with_facade.rb', source: withPattern },
}

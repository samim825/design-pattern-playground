import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// PHP: the facade creates its subsystems as default values of promoted constructor parameters.

const main = `
<?php
// {{subsystems}}
final class BusService
{
    public function reserve(string $date, int $people): Seat { return BusApi::book($date, $people); }
}
final class HotelService
{
    public function book(string $checkIn, int $nights): Room { return HotelApi::reserve($checkIn, $nights); }
}
final class GuideService
{
    public function assign(string $pickup): Guide { return GuideDesk::nextFree($pickup); }
}
final class SmsService
{
    public function sendTicket(string $phone, string $text): void { SmsGateway::push($phone, $text); }
}

// {{packageType}}
final readonly class TripPackage
{
    public function __construct(public int $nights, public bool $withGuide) {}
}
$packages = [
    'budget' => new TripPackage(nights: 2, withGuide: false),
    'classic' => new TripPackage(nights: 2, withGuide: true),
    'family' => new TripPackage(nights: 3, withGuide: true),
];

// {{facade}}
final class TripFacade
{
    public function __construct(
        private readonly BusService $bus = new BusService(), // {{hidden}}
        private readonly HotelService $hotel = new HotelService(),
        private readonly GuideService $guide = new GuideService(),
        private readonly SmsService $sms = new SmsService(),
    ) {}

    public function bookTrip(TripPackage $pkg, int $people, string $phone): Booking // {{oneDoor}} // @step:call
    {
        $seat = $this->bus->reserve('12 Dec', $people); // {{busFirst}} // @step:bus
        $room = $this->hotel->book($seat->arrival, $pkg->nights); // {{hotelNeeds}} // @step:hotel
        $tourGuide = $pkg->withGuide ? $this->guide->assign($room->address) : null; // {{guideNeeds}} // @step:guide
        $this->sms->sendTicket($phone, ticket($seat, $room, $tourGuide)); // {{smsLast}} // @step:sms
        return new Booking($seat, $room, $tourGuide); // @step:done
    }
}

// {{usage}}
$agency = new TripFacade();
$booking = $agency->bookTrip($packages['family'], 4, '01711-000000'); // {{oneCall}} // @step:pick,call,done
`

const without = `
<?php
// {{withoutIntro}}
final class TripScreen
{
    // {{knowsAll}}
    public function __construct(
        private BusService $bus,
        private HotelService $hotel,
        private GuideService $guide,
        private SmsService $sms,
    ) {}

    // {{orderYours}}
    public function book(TripRequest $trip): Booking // @step:l1-start
    {
        $seat = $this->bus->reserve('12 Dec', $trip->people); // {{busFirst}} // @step:l1-bus
        $room = $this->hotel->book($seat->arrival, $trip->nights); // {{hotelNeeds}} // @step:l1-hotel
        $tourGuide = $trip->withGuide ? $this->guide->assign($room->address) : null; // {{guideNeeds}} // @step:l1-guide
        $this->sms->sendTicket($trip->phone, ticket($seat, $room, $tourGuide)); // {{smsLast}} // @step:l1-sms
        return new Booking($seat, $room, $tourGuide); // @step:l1-result
    }
}

// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
<?php
// {{withAdd}}
final class InsuranceService // @step:build-class
{
    public function cover(Seat $seat, int $people): Policy { return Insurer::issue($seat, $people); } // {{newSub}} // @step:build-class
}

// {{withInside}}
final class TripFacade
{
    public function __construct(
        private readonly InsuranceService $insurance = new InsuranceService(), // {{onlyHere}} // @step:build-call
        // {{restSame}}
    ) {}

    public function bookTrip(TripPackage $pkg, int $people, string $phone): Booking // @step:call-new
    {
        $seat = $this->bus->reserve('12 Dec', $people); // @step:sub-old
        $policy = $this->insurance->cover($seat, $people); // {{newLine}} // @step:build-call,insure
        $room = $this->hotel->book($seat->arrival, $pkg->nights); // @step:sub-old
        $tourGuide = $pkg->withGuide ? $this->guide->assign($room->address) : null; // @step:sub-old
        $this->sms->sendTicket($phone, ticket($seat, $room, $tourGuide, $policy)); // {{smsPolicy}} // @step:sms-new
        return new Booking($seat, $room, $tourGuide, $policy); // @step:done-new
    }
}

// {{withSame}}
$booking = $agency->bookTrip($packages['family'], 4, '01711-000000'); // {{clientSame}} // @step:client-same,call-new,done-new
// {{withZero}}
`

export const php: CodeSet = {
  main: { filename: 'TripFacade.php', source: main },
  without: { filename: 'TripScreen.php', source: without },
  with: { filename: 'TripFacadeWithInsurance.php', source: withPattern },
}

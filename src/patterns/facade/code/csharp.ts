import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{subsystems}}
public class BusService
{
    public Seat Reserve(string date, int people) => BusApi.Book(date, people);
}
public class HotelService
{
    public Room Book(string checkIn, int nights) => HotelApi.Reserve(checkIn, nights);
}
public class GuideService
{
    public Guide Assign(string pickup) => GuideDesk.NextFree(pickup);
}
public class SmsService
{
    public void SendTicket(string phone, string text) => SmsGateway.Push(phone, text);
}

// {{packageType}}
public record TripPackage(int Nights, bool WithGuide)
{
    public static readonly TripPackage Budget = new(2, false);
    public static readonly TripPackage Classic = new(2, true);
    public static readonly TripPackage Family = new(3, true);
}

// {{facade}}
public sealed class TripFacade
{
    private readonly BusService _bus = new(); // {{hidden}}
    private readonly HotelService _hotel = new();
    private readonly GuideService _guide = new();
    private readonly SmsService _sms = new();

    public Booking BookTrip(TripPackage pkg, int people, string phone) // {{oneDoor}} // @step:call
    {
        var seat = _bus.Reserve("12 Dec", people); // {{busFirst}} // @step:bus
        var room = _hotel.Book(seat.Arrival, pkg.Nights); // {{hotelNeeds}} // @step:hotel
        var tourGuide = pkg.WithGuide ? _guide.Assign(room.Address) : null; // {{guideNeeds}} // @step:guide
        _sms.SendTicket(phone, Ticket.Of(seat, room, tourGuide)); // {{smsLast}} // @step:sms
        return new Booking(seat, room, tourGuide); // @step:done
    }
}

// {{usage}}
var agency = new TripFacade();
var booking = agency.BookTrip(TripPackage.Family, 4, "01711-000000"); // {{oneCall}} // @step:pick,call,done
`

const without = `
// {{withoutIntro}}
// {{knowsAll}}
public class TripScreen(BusService bus, HotelService hotel, GuideService guide, SmsService sms)
{
    // {{orderYours}}
    public Booking Book(TripRequest trip) // @step:l1-start
    {
        var seat = bus.Reserve("12 Dec", trip.People); // {{busFirst}} // @step:l1-bus
        var room = hotel.Book(seat.Arrival, trip.Nights); // {{hotelNeeds}} // @step:l1-hotel
        var tourGuide = trip.WithGuide ? guide.Assign(room.Address) : null; // {{guideNeeds}} // @step:l1-guide
        sms.SendTicket(trip.Phone, Ticket.Of(seat, room, tourGuide)); // {{smsLast}} // @step:l1-sms
        return new Booking(seat, room, tourGuide); // @step:l1-result
    }
}

// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
public class InsuranceService // @step:build-class
{
    public Policy Cover(Seat seat, int people) => Insurer.Issue(seat, people); // {{newSub}} // @step:build-class
}

// {{withInside}}
public sealed class TripFacade
{
    private readonly InsuranceService _insurance = new(); // {{onlyHere}} // @step:build-call
    // {{restSame}}

    public Booking BookTrip(TripPackage pkg, int people, string phone) // @step:call-new
    {
        var seat = _bus.Reserve("12 Dec", people); // @step:sub-old
        var policy = _insurance.Cover(seat, people); // {{newLine}} // @step:build-call,insure
        var room = _hotel.Book(seat.Arrival, pkg.Nights); // @step:sub-old
        var tourGuide = pkg.WithGuide ? _guide.Assign(room.Address) : null; // @step:sub-old
        _sms.SendTicket(phone, Ticket.Of(seat, room, tourGuide, policy)); // {{smsPolicy}} // @step:sms-new
        return new Booking(seat, room, tourGuide, policy); // @step:done-new
    }
}

// {{withSame}}
var booking = agency.BookTrip(TripPackage.Family, 4, "01711-000000"); // {{clientSame}} // @step:client-same,call-new,done-new
// {{withZero}}
`

export const csharp: CodeSet = {
  main: { filename: 'TripFacade.cs', source: main },
  without: { filename: 'TripScreen.cs', source: without },
  with: { filename: 'TripFacadeWithInsurance.cs', source: withPattern },
}

import type { PatternContent } from '@/types/pattern'

export const en = {
  title: 'Facade',
  tagline: 'One call to the travel agent, and the bus, the hotel, the guide and the SMS ticket are all sorted.',
  intent:
    'Give a complicated set of classes one simple front door. The facade knows which subsystems to call and in what order, so a client makes one call instead of coordinating every service itself.',

  scenario: {
    title: "Sagar Travels books a Cox's Bazar trip",
    paragraphs: [
      "Sagar Travels in Motijheel sells Cox's Bazar trips. One booking means four separate services: a night-coach seat (৳1,500 per person), a room at Hotel Jhinuk (৳3,000 per night), Jamal bhai the tour guide (৳2,000) and an SMS ticket to the customer's phone.",
      'The counter app books each service itself, and the order matters: the hotel needs the bus arrival date, the guide needs the hotel address, and the SMS must go last so it lists everything. The website and the call-centre screen copy the same steps.',
      'Then a new rule arrives: every trip must include travel insurance…',
    ],
    problem:
      'Every client has to know every service, what each one needs and the exact order. One wrong order books the hotel for the wrong night or sends the guide to an empty bus stop, and every new service means editing every client screen.',
  },

  visual: {
    // Game HUD
    levelsLabel: 'Game levels',
    levelLabel: 'Level {{n}}',
    level1Title: 'Book everything yourself',
    level2Title: 'One call: bookTrip()',
    level3Title: 'Travel insurance joins',
    level1Goal:
      'No pattern yet: the counter screen calls every service itself. For each customer, tap the calls in the right order, and only the ones the trip needs.',
    level2Goal:
      'Now there is a TripFacade. Pick the package the customer wants and make one call; watch the facade call every service in the right order.',
    level3Goal: 'Every trip now needs travel insurance. Add the new service without editing a single line of client code.',
    locked: 'Locked',
    earned: 'Earned',
    restart: 'Restart game',
    tripOf: 'Trip {{n}}/{{total}}',

    // Client
    clientRole: 'Client',
    counterTitle: 'Sagar Travels counter',
    wants: 'wants',
    peopleCount: '{{n}} people',
    nightsCount: '{{n}} nights',
    withGuide: 'with guide',
    noGuide: 'no guide',
    callsLabel: 'Tap the calls, first to last',
    callsHint: 'Tap a call again to take it out.',
    knowsL1: 'Services this screen must know: 4, plus their order',
    packageLabel: 'Which package?',
    pkgBudget: 'Budget',
    pkgClassic: 'Classic',
    pkgFamily: 'Family',
    pkgDetail: '{{nights}} · {{guide}}',
    knowsL2: 'The client knows 1 class: TripFacade',
    clientsSame: 'App · website · call centre: unchanged',

    // Middle node
    noPatternRole: 'No pattern',
    yourOrder: 'Your order',
    emptyOrder: 'No calls yet: tap them above.',
    knowsAllTag: 'knows every service',
    facadeRole: 'Facade',
    facadeOrder: 'Calls inside, always in this order',
    skipped: 'skipped',
    newTag: 'New',
    notBuilt: 'not built yet',

    // Subsystems
    subsystemsRole: 'Subsystems',
    subsystemsTitle: "Cox's Bazar services",
    subsystemRole: 'Subsystem',
    notCalled: 'not called',
    busOk: '{{n}} seats · arrives {{arrive}}',
    hotelOk: '{{nights}} from {{arrive}}',
    hotelBad: 'booked from {{depart}}!',
    guideOk: 'meets you at the hotel',
    guideBad: 'waiting at an empty bus stop',
    guideExtra: 'nobody asked: +{{fee}}',
    smsOk: 'full ticket sent',
    smsEarly: 'half-empty ticket sent',
    insureOk: '{{n}} people covered',
    arrive: '13 Dec, 7am',
    depart: '12 Dec',
    tripOk: 'Trip booked · {{amount}}',
    tripBad: 'Trip broken!',

    // Builder (level 3)
    builderTitle: 'Add InsuranceService',
    builderStep1: 'Step 1 · Where does the new call go?',
    builderStep2: 'Step 2 · What changes for the clients?',
    q1: 'Every trip needs insurance now. Where does insurance.cover() go?',
    q1Facade: 'In TripFacade.bookTrip()',
    q1Clients: 'In every client screen',
    q1Bus: 'In BusService.reserve()',
    q2: 'The app, the website and the call centre all book trips. What must they change?',
    q2Nothing: 'Nothing: still bookTrip()',
    q2Call: 'Also call insurance.cover()',
    q2Param: 'Pass an InsuranceService',
    useInsurance: 'Use InsuranceService',
    zeroEdits: 'Client code edited: 0 lines',

    // Turn
    bookButton: 'Book trip',
    nextTrip: 'Next trip',
    finishLevel: 'Finish level',
    tryAgain: 'Try again',

    // Level end
    levelDone: 'Level {{n}} complete!',
    nextLevel: 'Next level',
    replayLevel: 'Play this level again',
    playAgain: 'Play again from level 1',
    l1Teaser:
      'And next month every trip must include travel insurance: the app, the website and the call centre each need a new call, in exactly the right place… There must be a better way…',
    l2Summary:
      'One bookTrip() call per trip, and not a single order mistake. TripFacade knows the services, what each needs and their order, so no client has to.',
    recapTitle: 'What you learned',
    recap1: 'Without a facade, every client calls every subsystem itself and must know the exact order: one slip and the trip breaks.',
    recap2:
      'A Facade gives clients one simple method. It owns the subsystems and calls them in the right order, so clients stay small and simple.',
    recap3: 'A new subsystem (InsuranceService) joins inside the facade. Client code: 0 lines edited.',

    // Names
    rahim: 'Rahim',
    karim: 'Karim',
    mitu: 'Mitu',
    nusrat: 'Nusrat',
    tania: 'Tania',

    whatsHappening: "What's happening",
    note: 'Prices and dates are made up for this example.',
  },

  steps: {
    // Level 1: no pattern
    tutorial:
      '{{name}} wants a trip for {{want}} ({{amount}}). There is no facade yet, so this counter screen calls every service itself. The right order is set for you: bus → hotel → guide → SMS. Press Book trip and watch.',
    idle1:
      '{{name}} wants a trip for {{want}} ({{amount}}). Tap the service calls in the order the screen should make them: at least 3, and only what this trip needs.',
    'picked1-more': 'Your order so far: {{order}}. Keep tapping: a trip needs at least 3 calls.',
    picked1: 'Your order: {{order}}. Press Book trip, or tap a call again to take it out.',
    'l1-start':
      'TripScreen.book() starts. Nobody stands in between: the client itself must know the bus, hotel, guide and SMS services, and call them in the right order.',
    'l1-bus': 'bus.reserve() books {{people}} seats on the night coach. It arrives {{arrive}}: the hotel will need that date.',
    'l1-hotel':
      'hotel.book() checks in on the bus arrival date ({{arrive}}) for {{nights}}. It needs the seat first, and that is why the order matters.',
    'l1-hotel-bad':
      'hotel.book() runs before any bus seat exists, so it has no arrival date and books from {{depart}}. The family reaches Cox’s Bazar a day later: one night paid for an empty room.',
    'l1-guide': 'guide.assign() needs the hotel address to meet the family there. It has one, because the hotel was booked first.',
    'l1-guide-bad':
      'guide.assign() runs before the hotel is booked, so there is no address. Jamal bhai waits at the Kolatoli bus stop… and nobody comes.',
    'l1-guide-extra': 'This trip has no guide, but the client called guide.assign() anyway: {{fee}} for a guide nobody asked for.',
    'l1-sms': 'sms.sendTicket() goes last, so the ticket lists every booking. Knowing that was, once again, the client’s job.',
    'l1-sms-early':
      'sms.sendTicket() runs before everything is booked, so the SMS ticket is half empty. Whatever gets booked after it never reaches the phone.',
    'l1-ok':
      'Trip booked! {{name}} pays {{amount}}. It worked, but only because the client knew every service and the exact order. The website and the call centre must repeat all of it.',
    'l1-fail-hotel':
      '😵 Wrong date: the hotel was booked before the bus, so check-in is {{depart}} instead of {{arrive}}. The client had to know that the hotel depends on the bus.',
    'l1-fail-guide':
      '😵 The guide waited at an empty bus stop: he was booked before the hotel, so he had no address. One more hidden dependency the client had to know.',
    'l1-fail-extra': '😵 This trip had no guide, but the bill now has {{fee}} for one. The client also has to know which calls each trip needs.',
    'l1-fail-sms':
      '😵 The SMS ticket went out before the bookings were done, so it was half empty: nothing to show at the bus counter. SMS must come last.',
    'l1-fail-nosms':
      '😵 Everything was booked, but no SMS was sent: no ticket to show at the bus counter. One forgotten step breaks the whole trip.',
    'l1-fail-nobus': '😵 No bus seat was reserved: a room is waiting in Cox’s Bazar, with no way to get there.',
    'l1-fail-nohotel': '😵 No hotel was booked: the bus arrives at 7am and there is nowhere to stay.',
    'l1-fail-noguide': '😵 This trip includes a guide, but guide.assign() was never called. Nobody is waiting at the hotel.',
    'level1-done':
      'Level complete! It worked, but the client had to know 4 services, what each one needs and the exact order. Every client screen repeats it.',

    // Level 2: Facade
    idle2:
      '{{name}} wants a trip for {{want}}. Pick the matching package: that is the only choice the client makes. TripFacade knows the rest.',
    picked2: '{{pkg}} picked. Press Book trip: the client makes one call and watches.',
    'wrong-package':
      '{{pkg}} means {{pkgWant}}, but {{name}} wants {{want}}. The facade books exactly the package you pass in: you choose what, it handles how.',
    call: 'One call: {{call}}. The client never even sees BusService, HotelService, GuideService or SmsService.',
    bus: 'Inside the facade the bus goes first: its arrival time ({{arrive}}) is what the hotel needs next.',
    hotel: 'Then the hotel, from the bus arrival date, for {{nights}}. The facade gets the order right, so no client ever has to.',
    guide: 'The package includes a guide, so the facade passes the hotel address to GuideService. Jamal bhai meets them at the hotel.',
    sms: 'Last, the SMS ticket: sent only now, so it lists every booking. The order lives in one place: TripFacade.',
    done: 'Booked for {{name}}: {{amount}}. +{{amount}}. The client wrote one line; every service call and its order stayed behind TripFacade.',
    'level2-done':
      'Level complete! One bookTrip() call per trip, and not one order mistake: the facade knows the services and their order, so no client has to.',

    // Level 3: a new subsystem
    'build-q1': 'New rule: every trip needs travel insurance ({{premiumEach}} per person). First: where does the insurance.cover() call go?',
    'wrong-q1-clients':
      'That is level 1 again: the app, the website and the call centre each get edited, and one of them will forget. Keep the new call behind the facade.',
    'wrong-q1-bus':
      'Then BusService does a job that is not its own, and anyone who books only a bus seat gets insurance too. Subsystems stay simple; the facade coordinates them.',
    'build-q2':
      'insurance.cover() goes inside bookTrip(), right after the bus, because it needs the seat. Now: what must the client screens change?',
    'wrong-q2-call':
      'Then every client has to learn about InsuranceService and the order all over again. The whole point of a facade is that clients only know bookTrip().',
    'wrong-q2-param':
      'That puts a subsystem back in the client’s hands. The facade creates and owns its subsystems, so bookTrip() keeps the same signature.',
    'build-ready': 'Done: one new class and one new line inside TripFacade, 0 lines in any client. Press “Use InsuranceService”.',
    'build-done': 'InsuranceService now sits behind the facade. Pick the package {{name}} wants and press Book trip.',
    'call-new': 'The client call has not changed at all: {{call}}. The new step is hidden inside.',
    insure: 'New: right after the bus, InsuranceService covers {{people}} people for {{premium}}. It needs the seat, so it comes after the bus.',
    'sms-new': 'The SMS ticket now lists the insurance policy too. Only TripFacade changed to make that happen.',
    'done-new':
      'Booked and insured for {{name}}: {{amount}}. +{{amount}}. App, website and call centre still make the same call: 0 lines of client code edited.',
    'level3-done':
      'You finished the game! A facade gives clients one simple door into a complicated set of services, and new services join behind that door.',
  },

  codeComments: {
    subsystems: 'Subsystems: each does one job and knows nothing about the others',
    packageType: 'Trip packages: the only choice a client makes',
    facade: 'Facade: one simple door in front of every subsystem',
    hidden: 'the facade creates and owns the subsystems',
    oneDoor: 'the only method clients ever call',
    busFirst: 'bus first: the hotel needs its arrival time',
    hotelNeeds: 'check in on the bus arrival date',
    guideNeeds: 'the guide meets them at the hotel address',
    smsLast: 'SMS last, so the ticket lists every booking',
    usage: 'Client code: pick a package, make one call',
    oneCall: 'one line books the whole trip',
    withoutIntro: 'No pattern: the client screen books every service itself',
    knowsAll: 'the client must know all four services…',
    orderYours: '…and the exact order: get it wrong and the trip breaks',
    withoutCopy: 'the website and the call centre copy these same calls, in the same order',
    withAdd: 'Travel insurance = one new subsystem',
    newSub: 'it needs the bus seat to issue a policy',
    withInside: 'Only the facade learns about it',
    onlyHere: 'the new subsystem lives inside the facade',
    restSame: 'bus, hotel, guide and sms: as before',
    newLine: 'one new line, right after the bus',
    smsPolicy: 'the SMS ticket now lists the policy too',
    withSame: 'Client code: exactly the same call as before',
    clientSame: 'unchanged in the app, the website and the call centre',
    withZero: 'Client code edited: 0 lines. Without a facade: every client screen',
  },

  compare: {
    without: {
      title: 'Every client books every service itself',
      points: [
        'The client screen holds BusService, HotelService, GuideService and SmsService.',
        'It must also know the hidden order: bus before hotel, hotel before guide, SMS last.',
        'A wrong order or a forgotten step breaks the trip: wrong hotel date, a guide at an empty stop, no ticket.',
        'The app, the website and the call centre all copy the same calls; a new service means editing every one.',
      ],
    },
    with: {
      title: 'One bookTrip() call; the facade does the rest',
      points: [
        'TripFacade gives clients one simple method: bookTrip(package, people, phone).',
        'The facade owns the subsystems and calls them in the right order, every time.',
        'Subsystems stay simple and unaware of each other; the facade coordinates them.',
        'A new subsystem (InsuranceService) is added inside the facade; client code does not change.',
      ],
    },
    benefit:
      'Facade hides a tangle of subsystems behind one small, easy method. Clients stop depending on every service and its quirks, the order lives in one place, and the subsystems can change or grow without touching client code.',
    whenToUse: [
      'Clients need to run a multi-step job across several classes or services: booking, checkout, onboarding, report generation.',
      'The subsystems have an order or dependencies that every client would otherwise have to get right.',
      'You want to keep clients decoupled from a library or set of services that may change or grow.',
    ],
  },
} satisfies PatternContent

export type FacadeContent = typeof en

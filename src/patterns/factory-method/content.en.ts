import type { PatternContent } from '@/types/pattern'

export const en = {
  title: 'Factory Method',
  tagline: 'Let subclasses decide which object to create, while the shared workflow stays the same.',
  intent:
    'Define a method for creating an object in a base class, and let each subclass override it to decide which concrete class gets created. The base class works only with the common interface.',

  scenario: {
    title: 'A courier company with three branches',
    paragraphs: [
      'Mitu sells sarees through her Facebook page and ships every order with Sathi Courier. Booking a parcel always works the same way: the branch picks a vehicle, writes a tracking number, sends the parcel and tells Mitu the fee and the delivery time.',
      'The vehicle depends on the branch. In Dhaka, a rickshaw-van gets through the narrow lanes to Mirpur for ৳60. Chattogram sends parcels to Agrabad by truck for ৳150. Barishal puts them on a launch to Bhola for ৳120.',
      'Next year Sathi Courier wants to open a Sylhet branch that delivers to the tea gardens by drone. The booking steps must stay exactly the same. Only the vehicle changes.',
    ],
    problem:
      'If the booking code does "new RickshawVan()" or "new Truck()" itself, it needs an if/else on the city to choose. Every new branch means editing that shared booking code and re-testing every city.',
  },

  visual: {
    clientRole: 'Client',
    clientTitle: "Mitu's parcel desk",
    parcel: 'Saree parcel',
    to: 'To',
    chooseBranch: 'Ship from branch',
    dhaka: 'Dhaka',
    chattogram: 'Chattogram',
    barishal: 'Barishal',
    mirpur: 'Mirpur',
    agrabad: 'Agrabad',
    bhola: 'Bhola',
    creatorRole: 'ConcreteCreator',
    creatorTag: 'Creator',
    extendsLabel: 'extends',
    sharedLabel: 'sendParcel(): inherited, same for every branch',
    overrideLabel: 'createTransport(): overridden here',
    stepCreate: 'Get a vehicle',
    stepBook: 'Write tracking number',
    stepDeliver: 'Send the parcel',
    transportSlot: 'transport',
    notCreated: 'not created yet',
    productRole: 'ConcreteProduct',
    productTag: 'Product',
    implementsLabel: 'implements',
    waiting: 'Waiting for createTransport()…',
    fee: 'Fee',
    eta: 'Delivery',
    etaDhaka: 'Today',
    etaChattogram: 'Tomorrow',
    etaBarishal: 'Overnight',
    bookingTitle: 'Booking',
    tracking: 'Tracking',
    booked: 'Booked',
    sendButton: 'Send parcel',
    whatsHappening: "What's happening",
    feeNote: 'Sathi Courier and its fees are made up for this example.',
  },

  steps: {
    idle: 'Pick a branch, then press Send parcel. Try all three: the booking steps never change, only the vehicle that createTransport() makes.',
    'pick-branch':
      'Mitu now ships from {{branchClass}}. Her code still only sees a CourierBranch, so nothing else in her code has to change.',
    'client-send':
      'Mitu calls branch.sendParcel(). She has no idea which vehicle will carry the saree, and she doesn\'t need to.',
    'call-factory':
      'sendParcel() is written once in CourierBranch. It needs a vehicle, but instead of saying "new Truck()" it calls its own factory method: this.createTransport().',
    create:
      '{{branchClass}} overrides createTransport() and returns a new {{productClass}}. This one line is the only place that knows the concrete vehicle class.',
    book: 'Back in the shared code: the branch writes tracking number {{tracking}}. This step is identical for every branch.',
    deliver:
      'sendParcel() calls transport.deliver({{to}}). It talks only to the Transport interface, so it works with a van, a truck or a launch alike.',
    drive: 'Now {{productClass}}.deliver() runs its own logic: {{how}}',
    howDhaka: 'the rickshaw-van weaves through the narrow lanes to Mirpur.',
    howChattogram: 'the truck takes the highway to Agrabad.',
    howBarishal: 'the launch sails down the river to Bhola.',
    done: 'Done! Mitu gets a booking: {{fee}} fee, delivery {{eta}}. Switch the branch and run again: the same sendParcel() gives a different vehicle.',
  },

  codeComments: {
    product: 'Product: every vehicle must offer this',
    creator: 'Creator: the shared booking workflow',
    factoryMethod: 'The factory method: subclasses decide what to create',
    shared: 'Written once and inherited by every branch',
    noNew: 'no "new" here!',
    noConcrete: 'no concrete class named here!',
    concreteCreators: 'Concrete creators: each branch picks its own vehicle',
    usage: 'Client code',
    withoutIntro: 'The booking code itself must choose a vehicle for every city',
    withoutTodo: 'Sylhet with drones? Edit this shared function again and re-test all cities',
    withAdd: 'New branch = one new product + one new creator. Nothing else is edited.',
    withSame: 'sendParcel() is reused as it is',
  },

  compare: {
    without: {
      title: 'One booking function that creates every vehicle',
      points: [
        'The booking code depends on every concrete vehicle class.',
        'An if/else on the city decides what to create, and it grows with each branch.',
        'Adding Sylhet means editing shared code that every branch uses.',
        'Hard to test one branch without running through the others.',
      ],
    },
    with: {
      title: 'Each branch overrides createTransport()',
      points: [
        'sendParcel() is written once and only knows the Transport interface.',
        'Each branch decides its vehicle in a one-line factory method.',
        'Adding Sylhet means two new classes and no edits to existing ones.',
        'Each branch and vehicle can be tested on its own.',
      ],
    },
    benefit:
      'Creating the object is the part that changes, so it moves into one overridable method. The shared workflow is "closed for modification" and depends only on an interface, while new subclasses extend it with new products. That is the Open/Closed Principle and the Dependency Inversion Principle working together.',
    whenToUse: [
      'A base class has a fixed workflow, but one object inside it should differ per subclass.',
      'You see "new SomeClass()" picked by an if/else or switch in shared code.',
      'You expect new variants later (a new branch, file format, database or UI theme) and want to add them without touching old code.',
    ],
  },
} satisfies PatternContent

export type FactoryMethodContent = typeof en

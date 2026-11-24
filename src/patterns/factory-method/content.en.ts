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
    // Game HUD
    levelsLabel: 'Game levels',
    levelLabel: 'Level {{n}}',
    level1Title: 'Do it all yourself',
    level2Title: 'Let each branch decide',
    level3Title: 'Open a new branch',
    level1Goal: 'You are the dispatcher, and there is no pattern yet. For every order you pick the vehicle yourself.',
    level2Goal: 'Now Factory Method is in place. Just hand each parcel to the right branch: its createTransport() picks the vehicle.',
    level3Goal: 'Sathi Courier is opening in Sylhet. Build the new branch without editing any old code, then deliver.',
    locked: 'Locked',
    earned: 'Earned',
    restart: 'Restart game',
    orderOf: 'Order {{n}}/{{total}}',

    // Nodes
    clientRole: 'Client',
    ordersTitle: 'New order',
    pickVehicle: 'Pick a vehicle',
    pickBranch: 'Hand it to a branch',
    dispatcherRole: 'No pattern',
    casesLabel: 'Cases your dispatcher must know',
    linesLabel: 'Lines of if/else you maintain',
    creatorRole: 'ConcreteCreator',
    creatorTag: 'Creator',
    extendsLabel: 'extends',
    overrideLabel: 'createTransport(): overridden here',
    stepCreate: 'Get a vehicle',
    stepBook: 'Tracking number',
    stepDeliver: 'Send it',
    transportSlot: 'transport',
    notCreated: 'not created yet',
    productRole: 'ConcreteProduct',
    productTag: 'Product',
    implementsLabel: 'implements',
    waiting: 'No vehicle yet…',
    buildSlot: 'Build it',
    newTag: 'New',

    // Builder (level 3)
    builderTitle: 'Build the Sylhet branch',
    builderStep1: 'Step 1 · New product',
    builderStep2: 'Step 2 · New creator',
    q1: 'Which Transport can reach the hilly tea gardens?',
    q2: 'Which method should SylhetBranch override?',
    openBranch: 'Open the branch',
    zeroEdits: 'Existing code edited: 0 lines',

    // Delivery
    dispatchButton: 'Dispatch',
    nextOrder: 'Next order',
    finishLevel: 'Finish level',
    tryAgain: 'Try again',
    delivered: 'Delivered',
    failed: 'Failed',

    // Level end
    levelDone: 'Level {{n}} complete!',
    nextLevel: 'Next level',
    replayLevel: 'Play this level again',
    playAgain: 'Play again from level 1',
    l1Teaser:
      'Then a new order arrives: 🍵 Tea → Srimangal (Sylhet). Your sendParcel() has no case for Sylhet, so you would have to edit that shared function again and re-test every city. There must be a better way…',
    l2Summary:
      'Your dispatcher never chose a vehicle in this level. It just called branch.sendParcel(parcel), and each branch created its own vehicle.',
    recapTitle: 'What you learned',
    recap1: 'Without the pattern, one shared function must know about, and create, every vehicle.',
    recap2: 'With Factory Method, the shared sendParcel() calls createTransport(), and each branch overrides it.',
    recap3: 'A new branch means new classes only. Old code stays untouched: the Open/Closed Principle.',

    // Names
    dhaka: 'Dhaka',
    chattogram: 'Chattogram',
    barishal: 'Barishal',
    sylhet: 'Sylhet',
    mirpur: 'Mirpur',
    agrabad: 'Agrabad',
    bhola: 'Bhola',
    srimangal: 'Srimangal',
    van: 'Rickshaw-van',
    truck: 'Truck',
    launch: 'Launch',
    drone: 'Drone',
    saree: 'Saree',
    hilsa: 'Hilsa fish',
    laptop: 'Laptop',
    mango: 'Mangoes',
    books: 'Books',
    tea: 'Tea leaves',
    etaDhaka: 'today',
    etaChattogram: 'tomorrow',
    etaBarishal: 'overnight',
    etaSylhet: 'in 2 hours',

    whatsHappening: "What's happening",
    feeNote: 'Sathi Courier and its fees are made up for this example.',
  },

  steps: {
    // Level 1: no pattern
    tutorial:
      "Your first order goes to Mirpur in Dhaka. We've picked the rickshaw-van for you this time. Press Dispatch and watch your code run.",
    idle1: 'A parcel for {{dest}}. Pick the vehicle you think fits, then press Dispatch.',
    picked1: 'You picked the {{vehicle}} for {{dest}}. Press Dispatch to find out if it works.',
    'l1-start':
      "Your sendParcel() gets the parcel and the city. Without the pattern, this one shared function has to do everything.",
    'l1-switch': 'It must check the city itself, so it needs a case for every city Sathi Courier serves.',
    'l1-new':
      'You chose the {{vehicle}}: new {{productClass}}() is created right inside the shared function, which now depends on every vehicle class.',
    'l1-deliver': 'The {{vehicle}} sets off for {{dest}}…',
    'l1-ok': 'Delivered! +{{fee}}. Right this time, but your dispatcher has to know every city and every vehicle.',
    'fail-lanes': "Stuck! 🚧 Only a rickshaw-van fits Dhaka's narrow lanes. One wrong case in the shared if/else breaks deliveries.",
    'fail-highway': 'Too late! ⏰ Agrabad is a long highway trip, and only the truck gets there on time.',
    'fail-river': 'Splash! 🌊 Bhola is across the river. Only a launch can get there.',
    'level1-done':
      'Level complete! Look at the highlighted line in the code: every new city would force you to edit this shared function again.',

    // Levels 2 and 3: Factory Method
    idle2: 'A parcel for {{dest}}. Tap the branch that serves it, then press Dispatch. You never pick the vehicle now.',
    'wrong-branch': 'The {{branch}} branch only delivers inside its own city. Which branch serves {{dest}}?',
    ready: '{{branchClass}} is ready. Press Dispatch and watch Factory Method run.',
    'client-send': 'The client calls branch.sendParcel(). It has no idea which vehicle will carry the parcel, and it doesn\'t need to.',
    'call-factory':
      'sendParcel() is written once in CourierBranch. It needs a vehicle, but instead of saying "new Truck()" it calls its own factory method: this.createTransport().',
    create:
      '{{branchClass}} overrides createTransport() and returns a new {{productClass}}. This one line is the only place that knows the concrete vehicle class.',
    book: 'Back in the shared code: the branch writes tracking number {{tracking}}. This step is identical for every branch.',
    deliver:
      'sendParcel() calls transport.deliver(). It only talks to the Transport interface, so a van, truck or launch all work the same way.',
    drive: 'Now {{productClass}}.deliver() runs its own logic: {{how}}',
    howDhaka: 'the rickshaw-van weaves through the narrow lanes to Mirpur.',
    howChattogram: 'the truck takes the highway to Agrabad.',
    howBarishal: 'the launch sails down the river to Bhola.',
    done: 'Delivered! +{{fee}}, arriving {{eta}}. The same sendParcel() ran; only the vehicle came from the branch.',
    'level2-done': 'Level complete! You only ever picked a branch. Each branch\'s createTransport() made the vehicle.',

    // Level 3: building a new branch
    'need-build': 'None of the existing branches reaches Srimangal. Tap “Build it” to open a Sylhet branch.',
    'build-product': 'First the product: Sylhet needs a new kind of Transport. Which one can reach the tea gardens?',
    'build-product-wrong':
      "The {{vehicle}} can't reach the hilly tea gardens. Add a brand-new Transport class instead of changing an old one.",
    'build-creator': 'Now the creator: SylhetBranch extends CourierBranch. Which single method does it need to override?',
    'wrong-sendParcel': "sendParcel() is the shared workflow that every branch inherits. Leave it alone: that's the whole point.",
    'wrong-deliver': 'deliver() belongs to the Transport (the product), and Drone already has it. The branch only decides what to create.',
    'build-ready': 'Both classes are written. Notice that no old class was touched. Press “Open the branch”.',
    'build-done': 'SylhetBranch is open! You added two new classes and edited 0 lines of old code. Press Dispatch.',
    'sylhet-send': 'The client calls sendParcel() on the new SylhetBranch. It is the same inherited method every branch uses.',
    'sylhet-create': 'SylhetBranch.createTransport() returns a new Drone. This is the only Sylhet-specific decision.',
    'sylhet-book': 'The inherited sendParcel() writes tracking number {{tracking}}, exactly as it does for every other branch.',
    'sylhet-deliver': 'Drone.deliver() flies over the hills to Srimangal 🚁',
    'sylhet-done': 'Delivered! +{{fee}}, arriving {{eta}}. The old branches and sendParcel() never changed.',
    'level3-done':
      'You finished the game! Factory Method keeps the workflow in the creator and lets subclasses decide which object to create.',
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

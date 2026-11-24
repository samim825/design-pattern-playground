import type { PatternContent } from '@/types/pattern'

export const en = {
  title: 'Abstract Factory',
  tagline: 'Create whole families of related objects that always match, without naming a single concrete class.',
  intent:
    'Provide an interface for creating a family of related objects (a main, a side, a dessert) without specifying their concrete classes. Each concrete factory makes one complete, consistent family.',

  scenario: {
    title: 'Combo meals at a Dhanmondi restaurant',
    paragraphs: [
      'Mitu runs Rongdhonu, a busy restaurant in Dhanmondi with two kitchens. Every combo is a main, a side and a dessert, and the three must come from the same cuisine.',
      'The Deshi combo is kacchi biryani, borhani and firni for ৳450. The Chinese combo is chicken fried rice, corn soup and custard pudding for ৳520. Kacchi with corn soup? A customer would send that straight back.',
      'Next month Mitu wants to open a Thai kitchen too: pad thai, tom yum soup and mango sticky rice. The ordering code should not need to change at all.',
    ],
    problem:
      'If the ordering code creates each dish by name (createDish("kacchi"), createDish("corn-soup")…), it must know every dish, and nothing stops it from mixing families. Every new cuisine means more names in the same if/else.',
  },

  visual: {
    // Game HUD
    levelsLabel: 'Game levels',
    levelLabel: 'Level {{n}}',
    level1Title: 'Assemble it yourself',
    level2Title: 'Pick a kitchen',
    level3Title: 'Open a Thai kitchen',
    level1Goal:
      'No pattern yet: the client picks every dish by name. Build each combo with one main, one side and one dessert from the same cuisine.',
    level2Goal:
      'Now each kitchen is a factory that makes a whole matching combo. Just send each order to the right kitchen.',
    level3Goal: 'Rongdhonu is adding Thai food. Open the new kitchen without editing serveCombo() or the old kitchens.',
    locked: 'Locked',
    earned: 'Sales',
    restart: 'Restart game',
    customerOf: 'Customer {{n}}/{{total}}',

    // Nodes
    clientRole: 'Client',
    counterTitle: 'At the counter',
    wantsCombo: 'wants the {{cuisine}} combo',
    pickDishes: 'Pick one main, one side and one dessert',
    pickKitchen: 'Send the order to a kitchen',
    noNames: 'serveCombo() never names a dish',
    noPatternRole: 'No pattern',
    casesLabel: 'Dish names the client must know',
    concreteFactoryRole: 'ConcreteFactory',
    abstractFactoryTag: 'AbstractFactory',
    implementsLabel: 'implements',
    noKitchen: 'No kitchen picked yet…',
    productsRole: 'ConcreteProducts',
    abstractProductTag: 'AbstractProduct',
    trayTitle: 'Combo tray',
    emptyTray: 'Empty tray',
    served: 'Served',
    sentBack: 'Sent back',
    mixedTag: 'mixed!',
    missingTag: 'missing',
    buildSlot: 'Build it',
    newTag: 'New',

    // Cuisines, courses and dishes
    deshi: 'Deshi',
    chinese: 'Chinese',
    thai: 'Thai',
    courseMain: 'Main',
    courseSide: 'Side',
    courseDessert: 'Dessert',
    kacchi: 'Kacchi biryani',
    borhani: 'Borhani',
    firni: 'Firni',
    friedrice: 'Chicken fried rice',
    cornsoup: 'Corn soup',
    pudding: 'Custard pudding',
    padthai: 'Pad thai',
    tomyum: 'Tom yum soup',
    mango: 'Mango sticky rice',

    // Builder (level 3)
    builderTitle: 'Open the Thai kitchen',
    builderStep1: 'Step 1 · What do you add?',
    builderStep2: 'Step 2 · And serveCombo()?',
    q1: 'What does Thai food need?',
    q1NewFamily: 'ThaiKitchen + 3 Thai dishes',
    q1IfElse: 'More cases in createDish()',
    q1Flag: 'A thai flag in DeshiKitchen',
    q2: 'What changes in serveCombo()?',
    q2Nothing: 'Nothing',
    q2Case: 'Add a Thai case',
    q2Method: 'Add createThaiMain()',
    openKitchen: 'Open ThaiKitchen',
    zeroEdits: 'serveCombo() & old kitchens edited: 0 lines',

    // Turn
    serveButton: 'Serve',
    nextCustomer: 'Next customer',
    finishLevel: 'Finish level',
    tryAgain: 'Try again',

    // Level end
    levelDone: 'Level {{n}} complete!',
    nextLevel: 'Next level',
    replayLevel: 'Play this level again',
    playAgain: 'Play again from level 1',
    l1Teaser:
      'Then Mitu says: “We are opening a Thai kitchen next month.” Three more dish names in createDish(), and still nothing stops kacchi from landing next to tom yum. There must be a better way…',
    l2Summary:
      'You never named a dish. You only picked a kitchen, and that one factory made a main, a side and a dessert that always matched.',
    recapTitle: 'What you learned',
    recap1: 'Without the pattern, the client creates each object by name and must keep the family consistent by hand.',
    recap2: 'With Abstract Factory, one factory creates the whole family, so related objects always match.',
    recap3: 'A new family (Thai) is one new factory plus its products. The client code never changes.',

    // Names
    rahim: 'Rahim',
    nusrat: 'Nusrat',
    karim: 'Karim',
    mitu: 'Mitu',

    whatsHappening: "What's happening",
    priceNote: 'Rongdhonu and its prices are made up for this example.',
  },

  steps: {
    // Level 1: no pattern
    tutorial:
      "Nusrat wants the Deshi combo. We've picked kacchi, borhani and firni for you this time. Press Serve and watch the client create each dish by name.",
    idle1: '{{name}} wants the {{cuisine}} combo. Tap one main, one side and one dessert that belong together, then press Serve.',
    picked1: 'Three dishes picked. Press Serve and see if {{name}} is happy.',
    'l1-order': 'The client calls serveCombo() with three dish names. The code has no idea they should belong together.',
    'l1-start': 'serveCombo() takes three loose names. Nothing ties them to one cuisine.',
    'l1-dish-ok': "createDish('{{code}}') makes {{dish}}. It fits the {{cuisine}} combo, but only because you remembered.",
    'l1-dish-mixed': "createDish('{{code}}') makes {{dish}}, a {{dishCuisine}} dish, inside a {{cuisine}} combo. The code happily allows it.",
    'l1-dish-missing': 'No {{course}} on the tray: you picked two of something else, and nothing warned you.',
    'l1-ok': 'Served! +{{total}}. {{name}} is happy, but the client had to know every dish and keep the family matching by hand.',
    'l1-mixed': "😖 Sent back! {{dish}} doesn't belong in a {{cuisine}} combo. Nothing in serveCombo() stops a mismatched family.",
    'l1-missing': '😖 Sent back! A combo needs one main, one side and one dessert, and this tray has no {{course}}.',
    'level1-done':
      'Level complete! Look at the highlighted line in the code: every new cuisine means more dish names for the client to know and keep matched.',

    // Level 2: Abstract Factory
    idle2: '{{name}} wants the {{cuisine}} combo. Send the order to the right kitchen, then press Serve.',
    'wrong-kitchen': '{{name}} ordered the {{cuisine}} combo, not {{picked}}. Pick the matching kitchen.',
    ready: '{{kitchenClass}} is picked. Press Serve: one factory, one matching family.',
    order: 'The client calls serveCombo(kitchen). It never names a dish: it only knows the Kitchen interface.',
    'create-main': 'kitchen.createMain(): {{kitchenClass}} decides the concrete dish and makes {{dish}}.',
    'create-side': 'kitchen.createSide(): the same kitchen makes {{dish}}, so it matches the main.',
    'create-dessert': 'kitchen.createDessert(): {{dish}}. All three come from one factory, so mixing is impossible.',
    serve: 'serveCombo() returns the tray: a main, a side and a dessert, all {{cuisine}}.',
    done: 'Served! +{{total}}. The client chose a kitchen once; the matching dishes followed automatically.',
    'level2-done': 'Level complete! The client never named a dish, and every combo matched, because one factory made each family.',

    // Level 3: a new family
    'need-build': 'No kitchen cooks Thai food yet. Tap “Build it” to open ThaiKitchen.',
    'build-q1': 'First: what do you add for Thai food?',
    'wrong-ifelse': "That's the old way: createDish() grows again, and nothing keeps the Thai dishes together.",
    'wrong-flag': 'A flag would turn DeshiKitchen into two kitchens at once, and every Deshi change could break Thai.',
    'build-q2': 'ThaiKitchen and its three dishes are written. Now: what changes in serveCombo()?',
    'wrong-case': 'No case needed: serveCombo() only talks to the Kitchen interface, so any new kitchen just works.',
    'wrong-method': 'Kitchen already has createMain(), and ThaiKitchen implements it. A new method would split the interface.',
    'build-ready': 'Done: one new factory and its family, nothing else edited. Press “Open ThaiKitchen”.',
    'build-done': 'ThaiKitchen is open, and serveCombo() was not touched. Press Serve!',
    'thai-order': 'The client calls serveCombo(new ThaiKitchen()): the very same function as before.',
    'thai-done': 'Served Thai! +{{total}}. serveCombo() and the other kitchens never changed.',
    'level3-done':
      'You finished the game! Abstract Factory makes whole families of objects that match, and a new family is just a new factory.',
  },

  codeComments: {
    abstractProducts: 'Abstract products: one type per course',
    concreteProducts: 'Concrete products: the real dishes',
    abstractFactory: 'Abstract factory: makes one whole combo family',
    concreteFactories: 'Concrete factories: each kitchen makes a matching set',
    client: 'Client: only knows Kitchen and the abstract dish types',
    noNames: 'no dish names here!',
    usage: 'Client code',
    withoutIntro: 'The client creates every dish by name',
    withoutMix: 'Compiles fine, but kacchi with corn soup?!',
    withoutTodo: 'Thai food next month? More names here, still no protection',
    withAdd: 'New family = one new kitchen + its dishes',
    withSame: 'serveCombo() is reused as it is',
  },

  compare: {
    without: {
      title: 'The client creates each dish by name',
      points: [
        'The client must know every concrete dish of every cuisine.',
        'Nothing stops a mismatched combo, like kacchi with corn soup.',
        'createDish() grows with every new cuisine.',
        'Changing a cuisine means hunting for its dish names all over the code.',
      ],
    },
    with: {
      title: 'One kitchen (factory) per cuisine',
      points: [
        'The client only knows Kitchen and the abstract dish types.',
        'Each kitchen creates a whole family, so a combo always matches.',
        'A new cuisine is one new factory plus its dishes.',
        'Swapping the whole family is one change: pass a different kitchen.',
      ],
    },
    benefit:
      'Abstract Factory keeps related objects consistent. The decision "which family?" is made once, when you pick the factory, and every object it creates belongs to that family. The client stays closed for modification while new families are added.',
    whenToUse: [
      'Your code creates several related objects that must be used together (UI widgets for one theme, parts for one platform, dishes for one cuisine).',
      'You want to swap a whole family at once (light vs dark theme, test vs production services).',
      'The client should not depend on the concrete classes of the objects it uses.',
    ],
  },
} satisfies PatternContent

export type AbstractFactoryContent = typeof en

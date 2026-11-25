import type { PatternContent } from '@/types/pattern'

export const en = {
  title: 'Decorator',
  tagline: 'Egg on top, chanachur on that, extra jhal on top of it all: wrap the plate, don’t write a new class for it.',
  intent:
    'Attach extra behaviour to an object by wrapping it in decorator objects that share its interface. Each wrapper does its own small part and passes the rest of the call to the object inside, so you can stack any combination at runtime instead of writing a subclass for each one.',

  scenario: {
    title: "Rahim mama's fuchka cart at Dhanmondi Lake",
    paragraphs: [
      'Every evening Rahim mama parks his fuchka cart by Dhanmondi Lake. A plain plate of fuchka is ৳60, and customers love their add-ons: a chopped egg on top (+৳20), a handful of chanachur (+৳10), or extra jhal with green chili (+৳5).',
      "His nephew wrote the billing app with one class per plate: FuchkaWithEgg, FuchkaWithSpicy, FuchkaWithEggAndSpicy… each with its own hard-coded price and receipt text.",
      'Then Karim asks for chanachur and extra jhal, Mitu wants double egg, and Rahim mama is thinking about adding tok-doi to the menu…',
    ],
    problem:
      'A subclass per combination explodes: 3 toppings already make 8 classes, and every new topping doubles the count. Each price is added up by hand, so one typo charges the wrong amount, and a "double egg" plate needs yet another class.',
  },

  visual: {
    // Game HUD
    levelsLabel: 'Game levels',
    levelLabel: 'Level {{n}}',
    level1Title: 'A class for every plate',
    level2Title: 'Wrap it, layer by layer',
    level3Title: 'Tok-doi joins the menu',
    level1Goal:
      'No pattern yet: every combination of toppings is its own subclass. For each order, pick the class that matches exactly, or copy-paste a new one.',
    level2Goal:
      'Now every topping is a decorator. Start from a plain Fuchka, wrap it in each topping the customer wants, then watch cost() pass through the layers.',
    level3Goal: 'Rahim mama adds tok-doi (+৳30). Add the new topping without editing a single old class.',
    locked: 'Locked',
    earned: 'Earned',
    restart: 'Restart game',
    orderOf: 'Order {{n}}/{{total}}',

    // Client
    clientRole: 'Client',
    cartTitle: "Rahim mama's cart",
    wants: 'wants',
    shelfLabel: 'Serve it with which class?',
    writeHint: '✍️ = no such class yet: copy-paste a new one',
    classesSoFar: 'Classes so far',
    allCombos: 'Every combo:',
    toppingsLabel: 'Wrap the plate in…',
    classMath: 'Classes: {{n}} · any combo, even double egg',

    // Plates and toppings
    fuchka: 'Fuchka',
    egg: 'Egg',
    chanachur: 'Chanachur',
    spicy: 'Extra jhal',
    tokdoi: 'Tok-doi',
    times: '×{{n}}',

    // Middle node
    noPatternRole: 'No pattern',
    hardcodedTag: 'hard-coded',
    copiedTag: 'copy-pasted',
    componentRole: 'Component',
    concreteComponentRole: 'ConcreteComponent',
    decoratorRole: 'Decorator',
    concreteDecoratorRole: 'ConcreteDecorator',
    newTag: 'New',
    noClassYet: 'no class yet',

    // Bottom node
    plateRole: 'Plate',
    objectRole: 'Object',
    ordered: 'Ordered',
    served: 'Served',
    plainPlate: 'Plain plate: tap a topping to wrap it',
    coreTag: 'core',
    receiptLabel: 'Receipt',
    servedOk: 'Right plate · {{amount}}',
    servedBad: 'Wrong plate!',

    // Builder (level 3)
    builderTitle: 'Add the TokDoi topping',
    builderStep1: 'Step 1 · What do you write?',
    builderStep2: 'Step 2 · What does cost() return?',
    q1: 'How do you add tok-doi to the menu?',
    q1Decorator: '1 new decorator: TokDoi',
    q1Subclasses: 'A tok-doi twin of every class',
    q1Flag: 'A hasTokDoi flag inside Fuchka',
    q2: 'TokDoi extends Topping. What does its cost() return?',
    q2Inner: 'inner.cost() + 30',
    q2Own: 'Just 30',
    q2Fixed: '60 + 30',
    useTokDoi: 'Use TokDoi',
    zeroEdits: 'Old classes edited: 0 lines',

    // Turn
    serveButton: 'Serve',
    nextOrder: 'Next order',
    finishLevel: 'Finish level',
    tryAgain: 'Try again',

    // Level end
    levelDone: 'Level {{n}} complete!',
    nextLevel: 'Next level',
    replayLevel: 'Play this level again',
    playAgain: 'Play again from level 1',
    l1Teaser:
      'Then Mitu asks for double egg, and Rahim mama wants to add tok-doi: every class needs a tok-doi twin, 8 classes become 16… There must be a better way…',
    l2Summary:
      'Not one combination class written. Five small classes made every plate, even double egg: each topping wraps the plate inside it, adds its own price, and asks the inside for the rest.',
    recapTitle: 'What you learned',
    recap1: 'A subclass per combination explodes: every new topping doubles the class count, and each price is typed in by hand.',
    recap2:
      'Decorator wraps an object in another object with the same interface. Each layer does its own part and passes the call inward, so any combination is built at runtime.',
    recap3: 'A new topping (TokDoi) is one new decorator class. Old classes and client code: 0 lines edited.',

    // Names
    nusrat: 'Nusrat',
    karim: 'Karim',
    mitu: 'Mitu',
    tania: 'Tania',

    whatsHappening: "What's happening",
    note: 'Prices are made up for this example.',
  },

  steps: {
    // Level 1: no pattern
    tutorial:
      'Nusrat wants fuchka with egg ({{amount}}). The class FuchkaWithEgg already exists, so it is picked for you. Press Serve and watch where the price comes from.',
    idle1: '{{name}} wants {{want}} ({{amount}}). Find the class for exactly that combination, or copy-paste a new one.',
    picked1: '{{cls}} picked. Press Serve: the plate will be whatever that class has hard-coded.',
    'picked1-write':
      'No class exists for this combination yet, so you will copy-paste {{cls}} and type its price and text by hand. Press Serve.',
    'l1-pick': 'new {{cls}}(): one class stands for one exact plate. To serve an order you must find the class whose name matches it.',
    'l1-write':
      'Copy-paste time: a whole new subclass for just this one combination, with its price ({{gotAmount}}) added up by hand and typed in.',
    'l1-serve': 'serve() asks the plate for its describe() and its cost().',
    'l1-cost': 'cost() returns a hard-coded {{gotAmount}}. Nothing is added up here: whoever wrote the class did the sum once, by hand.',
    'l1-describe': 'describe() returns a hard-coded “{{got}}”. The toppings live in the class name and the text, not in objects.',
    'l1-ok': 'Right plate! {{name}} pays {{amount}}. It worked only because a class for exactly this combination exists: {{classes}} classes so far.',
    'l1-fail':
      '😵 {{name}} ordered {{want}} but got {{got}}. A class is one fixed combination: the wrong class means the wrong plate and the wrong price.',
    'level1-done':
      'Level complete! Every new combination meant a new subclass with its price typed in by hand. 3 toppings already make 8 combinations, and double egg is still impossible.',

    // Level 2: Decorator
    idle2: '{{name}} wants {{want}}. The plate starts as a plain Fuchka. Tap each topping to wrap the plate in it, one layer at a time.',
    wrapped:
      'new {{layer}}(plate): the plate now has {{count}} layer(s). Each wrapper holds the previous plate inside it, and is still a Snack itself.',
    ready: 'That is exactly {{want}}. Press Serve and watch cost() travel inward through the layers and come back out.',
    'wrong-topping':
      '{{name}} did not ask for {{topping}}. Every wrapper adds its own price and words, so that layer would put {{add}} on the bill for nothing.',
    'wrong-enough':
      'The plate already has enough {{topping}}. One more wrapper would add another {{add}}: decorators stack, even the same one twice.',
    call: 'The client calls plate.cost() on the outermost layer only. It does not know (or care) how many layers are inside.',
    in: '{{layer}} cannot price the plate alone, so it first asks the snack it wraps: inner.cost(). The call passes one layer inward.',
    core: 'The call reaches the core: the plain Fuchka (ConcreteComponent) simply returns {{sum}}. Now the answers travel back out.',
    out: 'Back in {{layer}}: the inside said {{prev}}, so it adds its own {{add}} and returns {{sum}} to the layer around it.',
    describe: 'describe() takes the same trip: each layer adds its own words to what the inside says. “{{desc}}”',
    done: '{{name}} gets {{desc}} for {{sum}}. +{{sum}}. No class was written for this combination: the layers built it at runtime.',
    'level2-done':
      'Level complete! Five small classes made every plate, even double egg. Each topping only knows its own price and asks the inside for the rest.',

    // Level 3: a new decorator
    'need-build': "This order needs tok-doi, and there is no TokDoi class yet. Tap the 🔨 tok-doi tile to build it.",
    'build-q1': 'First: how do you add tok-doi to the menu?',
    'wrong-q1-subclasses': "That's level 1 again: a tok-doi twin of every existing class, and the class count doubles.",
    'wrong-q1-flag':
      'Then Fuchka gets edited for every new topping, and its cost() grows one more if each time. Decorator exists so old classes never need to change.',
    'build-q2': 'TokDoi extends Topping. Now: what does its cost() return?',
    'wrong-q2-own': 'Then the fuchka and every topping under the tok-doi would be free! A decorator must ask the inner snack first.',
    'wrong-q2-fixed':
      'That only works on a plain plate. Wrapped around an egg it forgets the egg: a decorator never knows what is inside, so it asks inner.cost().',
    'build-ready': 'Done: one new class, nothing old edited. Press “Use TokDoi”.',
    'build-done': 'TokDoi is ready, and the plate is wrapped in it like any other topping. Finish the plate and press Serve.',
    'in-new': '{{layer}} is the new decorator, yet it does exactly what the old ones do: ask inner.cost() first.',
    'out-new': 'TokDoi adds its own {{add}}: {{prev}} {{add}} = {{sum}}. The layer around it never notices a new class joined.',
    'done-new':
      '{{name}} gets {{desc}} for {{sum}}. +{{sum}}. Fuchka, Egg, Chanachur and ExtraSpicy ran unchanged: 0 lines of old code edited.',
    'level3-done':
      'You finished the game! Decorator adds behaviour by wrapping an object instead of subclassing every combination, and a new topping is just one more wrapper.',
  },

  codeComments: {
    component: 'Component: what every plate and every topping can answer',
    concrete: 'ConcreteComponent: the plain plate at the core',
    basePrice: 'a plain plate of fuchka',
    decorator: 'Decorator: a topping wraps another Snack and is a Snack itself',
    wrapsAny: 'the wrapped Snack: a plain plate or another topping',
    concreteDecorators: 'ConcreteDecorators: each adds only its own price and words',
    passIn: 'ask the inner Snack first, then add your own part',
    usage: 'Client code: wrap the plate layer by layer',
    wrapLayer: 'each wrap adds one layer (wrap Egg twice for double egg)',
    oneCall: 'one call on the outer layer runs through every layer',
    sameTrip: 'describe() takes the same trip inward',
    withoutIntro: 'No pattern: one subclass per combination',
    hardcoded: 'price and text hard-coded for this exact combination',
    withoutCopy: 'a new combination? copy-paste another subclass',
    copyPrice: 'the sum is worked out by hand, again',
    withoutPick: 'Serving: pick the class that matches the order exactly',
    withoutTodo: 'chanachur, double egg, tok-doi… every combination is one more class',
    withAdd: 'Tok-doi = one new ConcreteDecorator',
    onlyNew: 'only the new topping’s own price: 30',
    withSame: 'Old classes and client code work with it as they are',
    justWrap: 'wrapped like any other topping',
    oldStillWork: 'old toppings can wrap it, and it can wrap them',
    costUnchanged: 'the call is unchanged',
    withZero: 'Old classes edited: 0. Without Decorator: a tok-doi twin of every subclass',
  },

  compare: {
    without: {
      title: 'One subclass for every combination',
      points: [
        'Every combination of toppings is its own class: FuchkaWithEgg, FuchkaWithEggAndSpicy…',
        'Each class hard-codes its price and text, added up by hand, so one typo charges the wrong amount.',
        'The class count doubles with every new topping, and "double egg" needs yet another class.',
        'The cashier has to find the class whose name matches the order exactly.',
      ],
    },
    with: {
      title: 'Toppings wrap the plate, layer by layer',
      points: [
        'Fuchka (ConcreteComponent) and every topping (ConcreteDecorator) share the Snack interface.',
        'Each topping holds the snack it wraps and adds only its own price and words.',
        'Any combination, even the same topping twice, is built at runtime by stacking wrappers.',
        'A new topping (TokDoi) is one new class; old classes and the client stay untouched.',
      ],
    },
    benefit:
      'Decorator replaces a combinatorial explosion of subclasses with a few small, stackable wrappers. Each wrapper knows only its own extra, so prices are never added up by hand, and new extras plug in without touching the code that already works.',
    whenToUse: [
      'You need to add optional extras to objects in many combinations: toppings, add-ons, insurance riders, middleware.',
      'Subclassing every combination would explode, or the extras must be added and removed at runtime.',
      'The extra behaviour can wrap the original call: do something before or after, then pass it on.',
    ],
  },
} satisfies PatternContent

export type DecoratorContent = typeof en

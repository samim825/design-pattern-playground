import type { PatternContent } from '@/types/pattern'

export const en = {
  title: 'Builder',
  tagline: 'Build a complex object step by step, by name, instead of with one giant constructor.',
  intent:
    'Separate how a complex object is assembled from the steps that describe it: a builder adds the parts one by one, and a director knows the common recipes, so the same steps can produce different results.',

  scenario: {
    title: 'A custom PC at the computer market',
    paragraphs: [
      'Karim runs a small PC shop at the computer market on Elephant Road. Every customer wants a different machine: Nusrat needs an office PC for spreadsheets, Mitu a student PC for coding, and Rahim a gaming rig.',
      'Every PC is made from the same kinds of parts (a CPU, RAM, storage, an optional graphics card and a casing), but the choices differ. The office PC comes to about ৳21,800; the gaming one to ৳96,500.',
      "Karim's technician knows the popular recipes by heart. Soon customers also want a printed price quote before they buy, made from exactly the same recipe.",
    ],
    problem:
      "If a PC can only be made with one long constructor, new PC('Core i3', 8, '256GB SSD', null, 'Mini tower', false, false), every caller must remember the order of seven arguments and pass null for the parts they don't want. One more option breaks every call.",
  },

  visual: {
    // Game HUD
    levelsLabel: 'Game levels',
    levelLabel: 'Level {{n}}',
    level1Title: 'One long constructor',
    level2Title: 'Builder + Director',
    level3Title: 'A new kind of builder',
    level1Goal:
      "No pattern yet: a PC is made with new PC(…) and its arguments in a fixed order. Put each customer's parts in the right positions.",
    level2Goal:
      'Now a builder installs parts by name, and the technician (Director) knows the recipes. Pick the right recipe for each customer.',
    level3Goal:
      'Customers want a printed price quote first. Add a builder that writes quotes, reusing the same recipes without editing them.',
    locked: 'Locked',
    earned: 'Sales',
    restart: 'Restart game',
    customerOf: 'Customer {{n}}/{{total}}',

    // Nodes
    clientRole: 'Client',
    counterTitle: 'At the counter',
    needsLabel: 'Needs it for',
    wantsPc: 'wants the PC',
    wantsQuote: 'wants a price quote',
    noGpu: 'no graphics card',
    pickParts: 'Tap the parts in constructor order',
    clearSlots: 'Clear',
    pickPreset: 'Ask the technician for a recipe',
    pickBuilder: 'Which builder?',
    noPatternRole: 'No pattern',
    argsLabel: 'Arguments to remember',
    directorRole: 'Director',
    directorTitle: 'Technician',
    onlyInterface: 'Talks only to ComputerBuilder',
    noRecipe: 'No recipe picked yet…',
    concreteBuilderRole: 'ConcreteBuilder',
    productRole: 'Product',
    builderTag: 'Builder',
    productTag: 'Product',
    implementsLabel: 'implements',
    emptyCase: 'Empty case: no parts yet',
    emptyQuote: 'Empty quote: no lines yet',
    skipped: 'skipped',
    buildSlot: 'Build it',
    newTag: 'New',
    boots: 'Boots!',
    noBoot: "Won't boot",
    quoteTitle: 'Price quote',
    total: 'Total',

    // Recipes and builders
    office: 'Office',
    student: 'Student',
    gaming: 'Gaming',
    needOffice: 'spreadsheets, email and online banking',
    needStudent: 'coding and light video editing at university',
    needGaming: 'gaming at 1080p on high settings',
    pcBuilder: 'PC',
    quoteBuilder: 'Quote',

    // Parts
    partCpu: 'CPU',
    partRam: 'RAM',
    partStorage: 'Storage',
    partGpu: 'Graphics card',
    partCasing: 'Casing',
    nullCard: 'null (none)',

    // Builder (level 3)
    builderTitle: 'Add QuotationBuilder',
    builderStep1: 'Step 1 · What is it?',
    builderStep2: 'Step 2 · And the Director?',
    q1: 'What should QuotationBuilder be?',
    q1Implements: 'implements ComputerBuilder',
    q1ExtendsDirector: 'extends Technician',
    q1InPc: 'a quote() method on PC',
    q2: 'What changes in Technician?',
    q2Nothing: 'Nothing',
    q2NewMethod: 'Add buildGamingQuote()',
    q2Flag: 'Add an isQuote flag',
    useBuilder: 'Use QuotationBuilder',
    zeroEdits: 'Technician & PCBuilder edited: 0 lines',

    // Turn
    buildButton: 'Build',
    nextCustomer: 'Next customer',
    finishLevel: 'Finish level',
    tryAgain: 'Try again',

    // Level end
    levelDone: 'Level {{n}} complete!',
    nextLevel: 'Next level',
    replayLevel: 'Play this level again',
    playAgain: 'Play again from level 1',
    l1Teaser:
      'Then the shop starts selling Wi-Fi cards and RGB fans. Each new option is one more constructor argument, and every existing new PC(…) call has to change. There must be a better way…',
    l2Summary:
      'You never passed an argument by position. The technician called the builder step by step, by name, and simply skipped the parts a recipe did not need.',
    recapTitle: 'What you learned',
    recap1: "A long constructor makes callers remember positions and pass null for the parts they don't want.",
    recap2: 'With Builder, parts are added by name, step by step, and the Director keeps the common recipes in one place.',
    recap3: 'A new builder (QuotationBuilder) reuses the same Director steps to make a different result, without editing them.',

    // Names
    nusrat: 'Nusrat',
    rahim: 'Rahim',
    mitu: 'Mitu',

    whatsHappening: "What's happening",
    priceNote: 'Prices are illustrative, not real market rates.',
  },

  steps: {
    // Level 1: no pattern
    tutorial:
      "Nusrat's office PC. We've filled new PC(…) for you this time: CPU, RAM, storage, null for “no graphics card”, then the casing. Press Build and watch the constructor check each position.",
    idle1:
      "Build {{name}}'s PC. Tap the parts into new PC(…) in constructor order: cpu, ramGb, storage, gpu, casing. No graphics card? Pass null.",
    filled1: 'All five arguments are in. Press Build to find out if the PC boots.',
    'l1-call': 'new PC(…) is called with a row of arguments. Nothing says which value is which, only its position.',
    'l1-arg-ok': 'Position {{n}} is {{param}}: “{{part}}” fits.',
    'l1-arg-null': "Position {{n}} is {{param}}: {{name}} doesn't want one, so you had to pass null.",
    'l1-arg-bad': 'Position {{n}} is {{param}}, but you passed “{{part}}”. With look-alike arguments in a row, mix-ups are easy.',
    'l1-ok': "It boots! +{{total}}. But you had to remember every argument's position and pass null for the missing part.",
    'l1-fail': "💨 Won't boot: “{{part}}” went in as the {{param}}. The constructor couldn't tell you which value was which.",
    'level1-done':
      'Level complete! Look at the highlighted line in the code: every new PC option means changing this constructor, and every call to it.',

    // Level 2: Builder + Director
    idle2: '{{name}} needs a PC for {{need}}. Ask the technician (Director) for the right recipe, then press Build.',
    'wrong-preset': "The {{preset}} recipe isn't right for {{name}}, who needs it for {{need}}. Try another recipe.",
    ready: '{{method}}() is picked. Press Build and watch the technician call the builder step by step.',
    'new-builder': 'The client creates a PCBuilder: an empty case, waiting for parts.',
    director:
      'The client hands the builder to the technician: technician.{{method}}(builder). The Director knows the recipe; the builder knows how to install parts.',
    part: 'The technician calls b.{{call}}. The builder installs it by name, so order and position never matter.',
    build: 'builder.build() hands over the finished PC. The product is only returned once it is complete.',
    done: 'It boots! +{{total}}. The same PCBuilder made a different PC, because the Director called different steps.',
    'done-no-gpu': 'It boots! +{{total}}. Notice: no setGpu() call and no null. A recipe simply skips the parts it does not need.',
    'level2-done': 'Level complete! No positional arguments, no nulls: the Director called named steps, and the builder did the work.',

    // Level 3: a new kind of builder
    idle3: '{{name}} {{want}}, for {{need}}. Pick the builder and the recipe, then press Build.',
    'need-build': '{{name}} only wants a price quote on paper, and no builder makes quotes yet. Tap “Build it” to add QuotationBuilder.',
    'wrong-builder': '{{name}} {{want}}. Pick the other builder.',
    'build-q1': 'First: what should QuotationBuilder be?',
    'wrong-extends-director': 'The technician is the Director: it decides the steps but builds nothing itself. Building is the builder\'s job.',
    'wrong-in-pc': 'A quote method on PC mixes two jobs: every change to quotes would touch the PC class.',
    'build-q2': 'QuotationBuilder implements ComputerBuilder. Now: what has to change in Technician (the Director)?',
    'wrong-new-method': 'No new method needed: buildGaming(b) already works with any ComputerBuilder, quotes included.',
    'wrong-flag': 'A flag would make the Director know about quotes. It should only know the ComputerBuilder interface.',
    'build-ready': 'Done: one new class, nothing else edited. Press “Use QuotationBuilder”.',
    'build-done': 'QuotationBuilder is ready, and Technician was not touched. Pick the recipe and press Build.',
    'ready-q': 'QuotationBuilder + {{method}}() are picked. Press Build: the same recipe will now write a quote.',
    'q-new': 'The client creates a QuotationBuilder instead of a PCBuilder.',
    'q-director': 'The very same technician.{{method}}(…) runs: exactly the steps it uses for a real PC.',
    'q-part': 'b.{{call}} now adds a quote line instead of installing a part: {{value}} = {{price}}.',
    'q-build': 'getQuote() returns the finished quote: total {{total}}.',
    'q-done': 'Quote handed over: {{total}}. Same Director, same steps, a different result.',
    'level3-done':
      'You finished the game! Builder separates the recipe (Director) from the assembly (builders), so either side can change on its own.',
  },

  codeComments: {
    product: 'Product: the thing being built',
    builder: 'Builder: every builder offers these steps',
    concreteBuilder: 'Concrete builder: assembles a real PC',
    director: 'Director: knows the recipes, not the parts',
    optional: 'only the gaming PC gets a GPU',
    usage: 'Client code',
    usagePreset: 'or buildOffice / buildStudent',
    withoutIntro: 'One constructor, seven positional arguments',
    withoutOrder: 'Which value is which? Only the position tells you',
    withoutTodo: 'Selling Wi-Fi cards too? Change the constructor and every call above',
    withAdd: 'New builder: the same steps, but a price quote instead of a PC',
    withSame: 'The Director and its recipes are reused as they are',
  },

  compare: {
    without: {
      title: 'One constructor with seven arguments',
      points: [
        'Callers must remember the exact order of every argument.',
        'Optional parts force you to pass null or false placeholders.',
        'Look-alike arguments (three strings in a row) are easy to swap by accident.',
        'Adding a new option (Wi-Fi, RGB fans) changes the constructor and breaks every call.',
      ],
    },
    with: {
      title: 'A builder plus a director with recipes',
      points: [
        'Parts are added by name (setCpu(), setRam()…), so order and position never matter.',
        'Optional parts are simply skipped; no nulls needed.',
        'The Director keeps the common recipes (office, student, gaming) in one place.',
        'A new builder (QuotationBuilder) reuses the same recipes to make a different result.',
      ],
    },
    benefit:
      'Builder splits "how to assemble" (the builder) from "which steps, in which order" (the director). Each side can change on its own: new recipes don\'t touch the builders, and a new builder works with every recipe.',
    whenToUse: [
      'An object has many parts or options, and its constructor would need a long, confusing argument list.',
      'You build the same kinds of objects again and again from a few common recipes.',
      'The same construction steps should produce different results (a product, a quote, a summary).',
    ],
  },
} satisfies PatternContent

export type BuilderContent = typeof en

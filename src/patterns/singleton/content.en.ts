import type { PatternContent } from '@/types/pattern'

export const en = {
  title: 'Singleton',
  tagline: 'Make sure a class has exactly one instance, and give everyone the same way to reach it.',
  intent:
    'Ensure a class has only one instance and provide a single global point of access to it. The class itself guards the rule: its constructor is private, and getInstance() always returns the same object.',

  scenario: {
    title: 'One cash box at a New Market saree shop',
    paragraphs: [
      "Karim runs a busy saree shop in New Market. Rahim and Mitu sell all day, and every taka goes into one cash box (ক্যাশবাক্স) under the counter. At closing, Karim counts that box and checks it against the day's sales.",
      "If someone starts a second box, even by accident, the money gets split. Karim counts ৳2,700 in the box while sales were ৳3,500, and the missing ৳800 is sitting in a box nobody counted.",
      'Next week Nusrat opens a bKash counter at the same shop. Her payments must land in the very same cash box.',
    ],
    problem:
      'If CashBox has a public constructor, any code anywhere can call new CashBox(). A shared global variable is only a convention: nothing stops someone from creating, or replacing, another box, and the totals stop matching.',
  },

  visual: {
    // Game HUD
    levelsLabel: 'Game levels',
    levelLabel: 'Level {{n}}',
    level1Title: 'Anyone can make a box',
    level2Title: 'One box, guaranteed',
    level3Title: 'A bKash counter joins',
    level1Goal: "No pattern yet: CashBox has a public constructor. Give each salesperson a box, and keep Karim's closing count right.",
    level2Goal: 'Now CashBox is a Singleton. Pick how each salesperson gets the box, and watch the class protect itself.',
    level3Goal: "Nusrat's bKash counter is new code. Write it so the money still lands in the one and only box.",
    locked: 'Locked',
    earned: 'Sales',
    restart: 'Restart game',
    shiftOf: 'Sale {{n}}/{{total}}',

    // Nodes
    clientRole: 'Client',
    floorTitle: 'Shop floor',
    sells: 'sells {{item}}',
    atBkash: 'at the bKash counter',
    giveBox: 'Give {{name}} a cash box',
    howGet: "How does {{name}}'s code get the box?",
    optShared: 'shopBox (the box on the counter)',
    optNew: 'new CashBox()',
    optGet: 'CashBox.getInstance()',
    noPatternRole: 'No pattern',
    countersLabel: 'Boxes on the counter',
    instancesLabel: 'CashBox objects in memory',
    singletonRole: 'Singleton',
    privateCtor: 'private constructor',
    instanceSlot: 'instance',
    notCreated: 'not created yet',
    getSteps: 'What getInstance() does',
    stepCheck: 'Is there a box yet?',
    stepCreate: 'No: create it (first call only)',
    stepReturn: 'Return the one box',
    ownerRole: 'Client (owner)',
    ownerTitle: "Karim's closing count",
    salesSoFar: 'Sales so far',
    counted: 'Counted in the box',
    match: 'Totals match',
    mismatch: 'Totals don\'t match',
    lostIn: '{{amount}} is in a box nobody counts',
    buildSlot: 'Build it',
    newTag: 'New',
    shopBox: 'shopBox',
    secondBox: 'second box',

    // Builder (level 3)
    builderTitle: 'Write BkashCounter',
    builderStep1: 'Step 1 · Getting the box',
    builderStep2: 'Step 2 · Why private?',
    q1: 'How should BkashCounter get the cash box?',
    q1Get: 'CashBox.getInstance()',
    q1New: 'new CashBox()',
    q1Own: 'Its own BkashBox',
    q2: 'Why a private constructor, not just a global variable?',
    q2Control: 'So nobody can make a second box',
    q2Fast: 'To make it faster',
    q2Replace: 'So anyone can replace the box',
    useCounter: 'Open the bKash counter',
    zeroEdits: 'CashBox edited: 0 lines',

    // Turn
    openButton: 'Open shift',
    nextSale: 'Next sale',
    finishLevel: 'Finish level',
    tryAgain: 'Try again',

    // Level end
    levelDone: 'Level {{n}} complete!',
    nextLevel: 'Next level',
    replayLevel: 'Play this level again',
    playAgain: 'Play again from level 1',
    l1Teaser:
      'Then Karim hires two part-timers who write their own little tools. Each one could call new CashBox(), and nothing in the code would stop them. There must be a better way…',
    l2Summary:
      'Every salesperson called getInstance() and got the very same box. new CashBox() did not even compile, so the totals could not split.',
    recapTitle: 'What you learned',
    recap1: 'With a public constructor, any code can create another instance, and shared state gets split.',
    recap2: 'Singleton makes the constructor private and hands out the one instance through getInstance().',
    recap3: 'New code (the bKash counter) simply calls getInstance(); the class keeps the rule, not the callers.',

    // Names and items
    rahim: 'Rahim',
    mitu: 'Mitu',
    nusrat: 'Nusrat',
    saree: 'a saree',
    panjabi: 'a panjabi',
    threePiece: 'a three-piece',
    bkashPayment: 'a bKash payment',

    whatsHappening: "What's happening",
    feeNote: "Karim's shop and its sales are made up for this example.",
  },

  steps: {
    // Level 1: no pattern
    tutorial:
      "Rahim opens his shift and sells a saree for {{amount}}. We've handed him shopBox, the box on the counter, this time. Press Open shift and follow the money.",
    idle1: '{{name}} is about to sell {{item}} for {{amount}}. Give them a cash box, then press Open shift.',
    picked1: "{{name}} has a box. Press Open shift: at closing, Karim counts shopBox.",
    'l1-open': 'The shop opens. shopBox is on the counter with {{base}} from earlier sales.',
    'l1-shared': "{{name}} gets shopBox, the box on the counter. Nothing forces this; it's just a habit everyone has to remember.",
    'l1-new': "{{name}}'s code calls new CashBox(): a second box appears on the counter. Nothing stopped it.",
    'l1-add': '{{name}} puts {{amount}} into the {{boxName}}.',
    'l1-count': 'Karim counts shopBox: {{counted}}. Sales so far: {{expected}}.',
    'l1-ok': 'Totals match! +{{amount}}. But only because {{name}} happened to use the same box. Any code can still call new CashBox().',
    'l1-fail': "❌ The totals don't match! Karim counts {{counted}}, but sales were {{expected}}. {{amount}} is sitting in a second box nobody counts.",
    'level1-done':
      'Level complete! Look at the highlighted line in the code: with a public constructor, anyone can make another box, and the money gets split.',

    // Level 2: Singleton
    idle2: "{{name}} is about to sell {{item}} for {{amount}}. Pick how {{name}}'s code gets the cash box.",
    'wrong-new': "Compile error! CashBox's constructor is private, so no code outside the class can make a second box. Use CashBox.getInstance().",
    ready: "{{name}}'s code will call CashBox.getInstance(). Press Open shift.",
    sell: '{{name}} sells {{item}} for {{amount}} and rings it up.',
    call: "{{name}}'s code calls CashBox.getInstance(). It never says new.",
    check: 'getInstance() checks: does the one box exist yet?',
    'check-exists': 'getInstance() checks: the box already exists, so nothing new is created.',
    create: 'Not yet, so this very first call creates it and keeps it in CashBox.instance. This is the only new CashBox() in the whole program.',
    return: 'getInstance() returns the box: the very same object every caller gets.',
    add: '{{name}} puts {{amount}} in. The box now holds {{boxTotal}}.',
    count: 'Karim calls CashBox.getInstance() too, and counts the same box: {{counted}}.',
    done: 'Totals match! +{{amount}}. One box shared by everyone, guaranteed by the class itself.',
    'level2-done': 'Level complete! Everyone got the same box from getInstance(), and new CashBox() was blocked every time.',

    // Level 3: new client code
    'need-build': "Nusrat's bKash counter is brand-new code. Tap “Build it” to write BkashCounter.",
    'build-q1': 'First: how should BkashCounter get the cash box?',
    'wrong-q1-new': "That won't compile: the constructor is private. And even if it did, it would be a second box.",
    'wrong-q1-own': "A separate bKash box would split the money again, and Karim's count would come up short.",
    'build-q2': 'Right. Now: why is the constructor private, instead of just sharing a global variable?',
    'wrong-q2-fast': 'Speed is not the point. The private constructor is about control: it guarantees exactly one instance.',
    'wrong-q2-replace': 'That is the danger of a global: anyone can replace it. The singleton keeps control of its one instance.',
    'build-ready': "Done: BkashCounter calls getInstance(), and CashBox wasn't touched. Press “Open the bKash counter”.",
    'build-done': 'The bKash counter is open. Press Open shift to take a payment.',
    'b-start': "A customer pays {{amount}} with bKash at Nusrat's counter.",
    'b-receive': 'BkashCounter.receive() runs: new code, written today.',
    'b-call': 'It calls CashBox.getInstance(), exactly like the salespeople do.',
    'b-same': 'getInstance() returns the existing box: the same object the salespeople use. No second box.',
    'b-add': "Nusrat's {{amount}} goes into the shop's one box: now {{boxTotal}}.",
    'b-count': 'Karim counts the box: {{counted}}, bKash and cash together.',
    'b-done': 'Totals match! +{{amount}}. The new counter joined without a single change to CashBox.',
    'level3-done':
      'You finished the game! Singleton keeps exactly one instance and one way to reach it, so shared things stay shared.',
  },

  codeComments: {
    singleton: 'Singleton: there can only ever be one CashBox',
    theOne: 'the one and only box',
    noNew: 'nobody outside can call new',
    firstTime: 'created on the very first call only',
    client: 'Client: salespeople ring up sales',
    sameBox: 'always the same box',
    usage: 'Client code',
    withoutIntro: 'A normal class with a public constructor',
    withoutGlobal: 'the "shared" box is only a convention',
    withoutAnyone: 'nothing stops a second box!',
    withoutTodo: 'Every new tool can make its own box, and Karim never knows',
    withAdd: 'New client code: it just asks for the one box',
    withSame: 'CashBox is not touched',
  },

  compare: {
    without: {
      title: 'A normal class plus a "shared" variable',
      points: [
        'Anyone can call new CashBox() and start a second box.',
        'Sharing one box is just a convention everyone must remember.',
        'A global variable can be replaced or reassigned by any code.',
        'When totals split, the bug shows up far away, at closing time.',
      ],
    },
    with: {
      title: 'The class guarantees one instance',
      points: [
        'The constructor is private: new CashBox() does not even compile.',
        'Everyone calls CashBox.getInstance() and gets the same object.',
        'The box is created lazily, on the first call only.',
        'New code (the bKash counter) joins without changing CashBox.',
      ],
    },
    benefit:
      'Singleton puts the "only one" rule inside the class itself, so it cannot be broken by accident. Use it sparingly: a singleton is still global state, so for most shared services, passing one object around (dependency injection) is easier to test.',
    whenToUse: [
      'There must be exactly one of something in the whole program (a cash register, a config, a connection pool, a logger).',
      'Many unrelated parts of the code need to reach that one object.',
      'Creating a second one by mistake would cause real bugs, such as split totals or double connections.',
    ],
  },
} satisfies PatternContent

export type SingletonContent = typeof en

import type { PatternContent } from '@/types/pattern'

export const en = {
  title: 'Composite',
  tagline: 'A bag, a bag inside a bag, or a single egg: ask any of them for its price the same way.',
  intent:
    'Compose objects into tree structures and let clients treat single objects (leaves) and groups of objects (composites) the same way, through one shared interface. A composite does its job by asking each of its children, so the work recurses down the tree by itself.',

  scenario: {
    title: "Karim's bazar delivery at Karwan Bazar",
    paragraphs: [
      'Karim runs Bazar Sodai, a small delivery service: customers send him a bazar list, he shops at Karwan Bazar and brings everything home. Then his app adds up the receipts so he can bill the customer.',
      'But bazar never comes back flat. The fish goes in a fish bag, the vegetables in a vegetable bag, the green chilies in a little polythene inside the vegetable bag, and the eggs ride loose on top.',
      "The app's billTotal() has one loop for loose items and one for the items in bags. Then a bag inside a bag shows up…",
    ],
    problem:
      'Hand-written loops only reach as deep as someone wrote them. Every new level of nesting needs another copy-pasted loop, and anything deeper is silently skipped, so Karim undercharges and pays the difference from his own pocket.',
  },

  visual: {
    // Game HUD
    levelsLabel: 'Game levels',
    levelLabel: 'Level {{n}}',
    level1Title: 'A loop for every level',
    level2Title: 'One getPrice() for all',
    level3Title: 'Eid gift boxes arrive',
    level1Goal: 'No pattern yet: billTotal() needs one nested loop per level of bags. Pick how many loops run for each order, or copy-paste a deeper one.',
    level2Goal: 'Now every item and every bag has the same getPrice(). Answer each question by picking the node to call it on, and watch the recursion walk inside.',
    level3Goal: 'Customers want Eid gift boxes with a ৳50 wrap fee. Add the new container without editing a single old class.',
    locked: 'Locked',
    earned: 'Billed',
    restart: 'Restart game',
    orderOf: 'Order {{n}}/{{total}}',

    // Client
    clientRole: 'Client',
    appTitle: 'Bazar Sodai app',
    receipts: 'Receipts',
    asks: 'asks',
    askWhole: 'What is my whole bill?',
    askPart: 'How much was the {{target}}?',
    loopsLabel: 'How many nested loops run?',
    loopsN: 'Loops: {{n}}',
    writeLoop: '+ loop {{n}}',
    writeHint: '✍️ = no such loop yet: copy-paste a deeper one',
    loopsWritten: 'Loops in billTotal()',
    pickLabel: 'Call getPrice() on…',

    // Middle node
    noPatternRole: 'No pattern',
    loopDesc1: 'loose items',
    loopDesc2: 'items in bags',
    loopDesc3: 'bags in bags',
    loopDesc4: 'one level deeper',
    copiedTag: 'copy-pasted',
    sumLabel: 'sum',
    skippedTag: '{{n}} never counted',
    componentRole: 'Component',
    leafRole: 'Leaf',
    compositeRole: 'Composite',
    newTag: 'New',
    noClassYet: 'no class yet',
    stackLabel: 'Call stack',
    stackEmpty: 'empty: press Bill',

    // Bottom node
    dataRole: 'Data',
    treeRole: 'Object tree',
    billed: 'Billed {{amount}}',
    shortBy: '{{amount}} short',

    // Bags and items
    order: 'Order',
    juteBag: 'Jute bag',
    fishBag: 'Fish bag',
    vegBag: 'Vegetable bag',
    chiliBag: 'Chili bag',
    bigBag: 'Big bag',
    meatBag: 'Meat bag',
    spiceBag: 'Spice packet',
    giftBox: 'Eid gift box',
    eggs: 'Eggs',
    ilish: 'Ilish',
    rui: 'Rui',
    dal: 'Dal',
    potato: 'Potato',
    onion: 'Onion',
    greenChili: 'Green chili',
    salt: 'Salt',
    oil: 'Oil',
    beef: 'Beef',
    garlic: 'Garlic',
    ginger: 'Ginger',
    semai: 'Semai',
    sugar: 'Sugar',
    milk: 'Milk',
    mishti: 'Mishti',
    rice: 'Rice',
    ghee: 'Ghee',

    // Builder (level 3)
    builderTitle: 'Add the GiftBox container',
    builderStep1: 'Step 1 · What do you write?',
    builderStep2: 'Step 2 · What does getPrice() return?',
    q1: 'How do you add gift boxes to the bazar tree?',
    q1Class: '1 new class: GiftBox',
    q1If: 'An if (giftBox) inside Bag',
    q1Loop: 'One more loop in billTotal()',
    q2: 'GiftBox implements BazarItem. What does its getPrice() return?',
    q2Recurse: 'Wrap fee + each child.getPrice()',
    q2Fee: 'Only the ৳50 wrap fee',
    q2Field: 'Wrap fee + each child.price',
    useGiftBox: 'Use GiftBox',
    zeroEdits: 'Old classes edited: 0 lines',

    // Turn
    billButton: 'Bill',
    nextOrder: 'Next order',
    finishLevel: 'Finish level',
    tryAgain: 'Try again',

    // Level end
    levelDone: 'Level {{n}} complete!',
    nextLevel: 'Next level',
    replayLevel: 'Play this level again',
    playAgain: 'Play again from level 1',
    l1Teaser:
      'Then a customer sends a tiffin carrier full of bags, and inside one bag sits a spice packet with a tiny polythene of cardamom… That needs a 5th nested loop, and the order after it a 6th. There must be a better way…',
    l2Summary:
      'Not one loop written. Items and bags share getPrice(), a bag simply asks its children, and the recursion reached every level by itself: a single bag, a bag in a bag, the whole order.',
    recapTitle: 'What you learned',
    recap1: 'Hand-written loops only reach a fixed depth: every new level of nesting means editing the code, and deeper items get skipped.',
    recap2: 'Composite gives leaves and containers one interface. A container answers by asking its children, so one call walks the whole tree.',
    recap3: 'A new container (GiftBox) is one new class that implements the same interface. Old classes and client code: 0 lines edited.',

    // Names
    nusrat: 'Nusrat',
    mitu: 'Mitu',
    rahim: 'Rahim',
    karim: 'Karim',

    whatsHappening: "What's happening",
    note: 'Bazar Sodai, its customers and the prices are made up for this example.',
  },

  steps: {
    // Level 1: no pattern
    tutorial:
      'Nusrat paid {{amount}} at the shops: eggs, plus a fish bag. billTotal() already has 2 loops (loose items, then items in bags), so "Loops: 2" is picked for you. Press Bill and watch which items get counted.',
    idle1: 'The receipts for this order add up to {{amount}}. How deep do the bags go? Pick how many nested loops billTotal() should run.',
    picked1: '{{n}} loops picked. Press Bill and watch which items get counted.',
    'picked1-write': 'billTotal() only has {{have}} loops, so you will copy-paste loop number {{n}}, nested one level deeper. Press Bill.',
    'l1-call': 'billTotal(order) is called. It has one hard-coded loop for every nesting level somebody wrote so far.',
    'l1-write':
      'Copy-paste time: another for-loop, nested one level deeper, exactly like the one above it. billTotal() grows with every new kind of nesting.',
    'l1-loop': 'Loop {{k}} ({{desc}}) counts {{items}}: +{{added}}. Sum so far: {{sum}}.',
    'l1-loop-empty': 'Loop {{k}} ({{desc}}) finds nothing at this level. Sum so far: {{sum}}.',
    'l1-skip': '{{items}}: one level deeper than any loop goes. No loop opens that bag, so they are skipped without a word!',
    'l1-total': 'return sum: billTotal() says {{sum}}. It has no idea whether it opened every bag.',
    'l1-ok': 'Correct bill: {{amount}}! It works, but only because a loop exists for exactly this depth. {{loops}} loops so far.',
    'l1-short':
      '😵 The app billed {{sum}}, but the receipts say {{amount}}. Karim pays the missing {{short}} from his own pocket. A fixed number of loops can never reach every bag inside a bag.',
    'level1-done':
      'Level complete! Every deeper bag meant another copy-pasted loop, and the next order can always go one level deeper. Look at the line in the innermost loop.',

    // Level 2: Composite
    idle2: 'Pick the node that answers the question. Every node, a single item or a bag full of bags, has the same getPrice().',
    ready: '{{target}} picked: one getPrice() call is all it takes. Press Bill and watch the recursion walk inside it.',
    'wrong-leaf':
      '{{picked}} is a Leaf: its getPrice() just returns its own price, {{price}}. The question was about {{target}}.',
    'wrong-part':
      '{{picked}} is only one part of {{target}}. getPrice() on a node prices that node and everything inside it, nothing more.',
    'wrong-whole':
      '{{picked}} holds more than {{target}}: its getPrice() would add up everything inside it. Pick the smaller node.',
    'wrong-other': '{{picked}} is a different bag. Any node prices itself and its children, so call getPrice() on {{target}} itself.',
    call: 'picked.getPrice() on {{target}}. The client never checks whether it is a leaf or a bag: it is the same call.',
    open: '{{node}} is a Bag (Composite). It starts at ৳0 and asks each of its children for a price.',
    recurse:
      '{{node}} is a Bag too, so child.getPrice() goes one level deeper and the same method runs again. The parent just waits for a number.',
    leaf: '{{node}} is a Leaf (Item): getPrice() simply returns {{price}}. Running sum ({{parent}}): {{sum}}.',
    'bag-total': '{{node}} has asked every child, so it returns {{price}} to whoever called it.',
    done: 'The answer comes back: {{target}} = {{total}}. +{{amount}}. One call, and the recursion reached every level by itself.',
    'level2-done':
      'Level complete! You never wrote a loop: the same getPrice() priced a bag, a bag inside a bag, and the whole order.',

    // Level 3: a new composite
    'need-build':
      "This order has an Eid gift box, and there is no GiftBox class yet. Tap the 🔨 gift box tile to build it.",
    'build-q1': 'First: how do you add gift boxes to the bazar tree?',
    'wrong-q1-if':
      'Then Bag has to know about every kind of container, and gets edited each time a new one appears. Composite exists so old classes never need to.',
    'wrong-q1-loop': "That's level 1 again: a loop for one more case, and the next container needs another one.",
    'build-q2': 'GiftBox implements BazarItem. Now: what does its getPrice() return?',
    'wrong-q2-fee': 'Then the semai and sugar inside are free! A container must add up its children too, not just its own fee.',
    'wrong-q2-field':
      'A Bag has no price field: its price has to be computed. Only getPrice() works for every BazarItem, leaf or bag.',
    'build-ready': 'Done: one new class, nothing old edited. Press “Use GiftBox”.',
    'build-done': 'GiftBox is ready, and every old Bag can hold one already. Now pick the node to price and press Bill.',
    'gift-make':
      'new GiftBox(…) goes into the bag with add(), like any other BazarItem. The Bag class never heard of gift boxes, and it does not need to.',
    'gift-open': '{{node}} is the new GiftBox: it starts with the ৳50 wrap fee, then asks each child, exactly like a Bag.',
    'gift-total': '{{node}} returns {{price}}: wrap fee + its contents. To its parent it is just one more BazarItem.',
    'gift-done': 'Billed: {{target}} = {{total}}! +{{amount}}. The old Bag and Item code ran unchanged: 0 lines edited.',
    'level3-done':
      'You finished the game! Composite lets one call walk a tree of any depth, and a new kind of container is just one more class that answers getPrice().',
  },

  codeComments: {
    component: 'Component: what every item and every bag can do',
    leaf: 'Leaf: a single bazar item',
    leafPrice: 'a leaf just knows its own price',
    composite: 'Composite: a bag that holds items or other bags',
    anyChild: 'a child can be an Item or another Bag',
    recurse: 'ask each child, leaf or bag: the recursion',
    bagTotal: "the bag's price is its children's prices added up",
    usage: 'Client code: build the tree',
    bagInBag: 'a bag inside a bag, no extra code needed',
    anyNode: 'any node: a single item, a bag, the whole order',
    sameCall: 'the same call, whatever the depth',
    withoutIntro: 'No pattern: items and bags are different shapes',
    loopLoose: 'loop 1: loose items',
    loopBags: 'loop 2: items in bags',
    withoutCopy: 'bags in bags? copy-paste a nested loop',
    copyAgain: 'and again for one level deeper…',
    withoutTodo: 'deeper bags are never opened: skipped silently',
    withoutUse: 'Billing an order',
    shortBill: 'too few loops = a short bill',
    withAdd: 'A gift box = one new Composite class',
    wrapFee: 'only the gift box adds a wrap fee',
    sameRecursion: 'the same recursion as Bag',
    withSame: 'Old Bag and Item code works with it as it is',
    justAChild: 'to the Bag it is just another child',
    billUnchanged: 'the billing call is unchanged',
    withZero: 'Old classes edited: 0. Without Composite: another loop in billTotal()',
  },

  compare: {
    without: {
      title: 'A hand-written loop for every level of bags',
      points: [
        'Items and bags are different shapes, so the code has to check which is which.',
        'Every level of nesting needs another nested loop: bags, bags in bags, bags in bags in bags…',
        'Anything deeper than the last loop is skipped silently, and the bill comes out short.',
        'A new kind of container (a gift box) means editing billTotal() again.',
      ],
    },
    with: {
      title: 'Items and bags share one getPrice()',
      points: [
        'Leaf (Item) and Composite (Bag) implement the same BazarItem interface.',
        'A bag asks each child for getPrice(), so the call recurses to any depth by itself.',
        'The client calls getPrice() on any node: one item, one bag, or the whole order.',
        'A new container (GiftBox) is one new class; old classes and the client stay untouched.',
      ],
    },
    benefit:
      'Composite turns "how deep does this go?" into a question nobody has to answer. Because a container is priced the same way as a single item, one call handles any tree shape, and new kinds of leaves or containers plug in without touching the code that walks the tree.',
    whenToUse: [
      'Your data is a part-whole tree: bags of items, folders of files, menus of sub-menus, teams of employees.',
      'Clients should treat a single object and a group of objects the same way (price, size, render, count…).',
      'You catch yourself writing nested loops or instanceof checks for each level of nesting.',
    ],
  },
} satisfies PatternContent

export type CompositeContent = typeof en

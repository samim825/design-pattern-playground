import type { PatternContent } from '@/types/pattern'

export const en = {
  title: 'Command',
  tagline: 'Write the order on a slip. A slip can wait in line, be counted on the bill and be taken back. A shout can’t.',
  intent:
    'Turn a request into an object. The object holds everything needed to carry it out, so an invoker can queue it, run it later, keep a history of it and undo it, without knowing what the request actually does.',

  scenario: {
    title: 'Karim’s order slips at a kacchi house in Old Dhaka',
    paragraphs: [
      'Friday lunch at Shahi Kacchi Ghar in Nazira Bazar: every table is full. Karim takes the orders on the floor, and Rahim mama cooks in the kitchen at the back: kacchi ৳350, chicken roast ৳220, firni ৳90, borhani ৳80.',
      'Karim doesn’t write anything down. He shouts every order through the kitchen door: “One kacchi, table 2!” When two tables order at once, Rahim mama is busy at the stove and one shout is lost. When someone says “No borhani after all!”, nobody remembers what was made for whom, and the bill lives in Karim’s head.',
      'Then the owner wants something new: customers may ask “make it spicy”, and take it back if it’s too hot…',
    ],
    problem:
      'The waiter calls the kitchen directly, the moment the order is spoken. Nothing waits in line, nothing is recorded, so a busy cook loses orders, a cancel can’t be undone reliably, and the bill has to be fixed by hand. Every new kind of request means more special cases in the waiter.',
  },

  visual: {
    // Game HUD
    levelsLabel: 'Game levels',
    levelLabel: 'Level {{n}}',
    level1Title: 'Shout it at the cook',
    level2Title: 'Slips on the rail',
    level3Title: '“Make it spicy!”',
    level1Goal:
      'No pattern yet: Karim calls the kitchen directly by shouting. For each table, choose what he shouts, and watch what Rahim mama makes of it.',
    level2Goal:
      'Now every order is a slip (an OrderCommand). The OrderRail runs slips in order, keeps a history and adds up the bill. Choose how Karim hands each situation to the kitchen.',
    level3Goal: 'Customers want “make it spicy”, and “too hot, take it back!” Build a MakeSpicyCommand without editing the rail, the waiter or the kitchen.',
    locked: 'Locked',
    earned: 'Earned',
    restart: 'Restart game',
    turnOf: 'Turn {{n}}/{{total}}',

    // Roles and names
    clientRole: 'Client',
    waiterTitle: 'Karim, the waiter',
    invokerRole: 'Invoker',
    commandRole: 'Command',
    concreteRole: 'ConcreteCommand',
    receiverRole: 'Receiver',
    kitchenTitle: 'Kitchen · Rahim mama',
    nusrat: 'Nusrat',
    sumon: 'Sumon',
    tania: 'Tania',
    mitu: 'Mitu',
    rafiq: 'Rafiq',
    karim: 'Karim',
    tableShort: 'T{{n}}',

    // Dishes
    dishKacchi: 'kacchi',
    dishBorhani: 'borhani',
    dishFirni: 'firni',
    dishRoast: 'chicken roast',
    spicyTag: 'spicy',

    // Client
    cancelSays: '“No {{dish}} after all!”',
    tooHot: '“Too hot! Take the chili back!”',
    neverCame: 'never came',
    earlier: 'Already served: {{earlier}}',
    headBill: 'bill in Karim’s head: {{bill}}',
    inHead: 'remembering: {{dish}}, {{table}}',
    padLabel: 'Karim’s pad',
    padEmpty: 'no slips',
    yourChoice: 'Your choice',
    pickLabel1: 'What does Karim do?',
    pickLabel2: 'How does Karim hand this to the kitchen?',
    knowsL1: 'Karim calls the kitchen himself, right now, by mouth',
    knowsL2: 'Karim only writes slips and pins them: rail.pin(slip)',
    othersSame: 'OrderRail · CookDishCommand · Kitchen: unchanged',
    shoutLast: 'Cancel the last one!',
    shoutVague: 'Cancel!',
    shoutNo: 'No {{dish}}!',

    // Choices: level 1
    optNow: 'Shout “One kacchi!” now',
    optTwice: 'Shout it twice, to be safe',
    optSilent: 'Say nothing, the cook will notice',
    optBoth: 'Shout both orders at once',
    optLoud: 'Shout both, the borhani loudest',
    optHold: 'Shout the roast, keep the borhani in your head',
    optLast: 'Shout “Cancel the last one!”',
    optManual: 'Run in, find table 5’s borhani, fix the bill by hand',
    optVague: 'Just shout “Cancel!”',
    // Choices: level 2
    optShout: 'Skip the slips, shout both at Rahim mama',
    optPin: 'Write two slips, pin them on the rail',
    optPinShout: 'Pin the slips, and shout them too',
    optTear: 'Tear the borhani slip off the rail',
    optUndo: 'rail.undoLast()',
    optShoutCancel: 'Shout “No borhani!” into the kitchen',
    optDirect: 'kitchen.takeBack("roast", 9)',
    optUndoTwice: 'rail.undoLast() twice, to be safe',

    // Middle (level 1)
    noSlips: 'No slip, no rail, no history: just a shout through the door.',

    // Invoker
    queueLabel: 'queue',
    emptyQueue: 'empty',
    historyLabel: 'history',
    emptyHistory: 'empty',
    railBill: 'bill = history: {{bill}}',
    railSkipped: 'skipped: the rail never heard',
    tornTag: 'torn off, never undone',

    // Command
    commandNote: 'Every slip has the same two buttons: execute() and undo().',
    newTag: 'new',
    notBuilt: 'not built yet',
    slipLabel: 'slip',
    noSlip: 'waiting for the rail',

    // Receiver
    stoveIdle: 'stove free',
    cooking: 'cooking {{dish}} for {{table}}',
    cookingAgain: 'cooking another {{dish}}!',
    addingChili: 'adding extra chili to the {{dish}}',
    removingChili: 'taking the extra chili back out of the {{dish}}',
    takingBack: 'taking back the {{dish}} from {{table}}',
    didntHear: 'busy at the stove: didn’t hear “{{dish}}”',
    cancelWhat: '“Cancel what? For which table?”',
    heardNothing: 'heard nothing, so cooked nothing',
    neverTold: 'nobody called undo(): the kitchen never heard',
    platesLabel: 'plates',
    noPlates: 'none yet',
    wastedTag: 'wasted',
    lostTag: 'lost',
    extraTag: 'extra',
    wrongTag: 'wrong one',
    resultOk: 'Every table is happy · +{{coins}}',
    resultBad: 'Something went wrong in the kitchen!',

    // Builder (level 3)
    builderTitle: 'Build MakeSpicyCommand',
    builderStep1: 'Step 1 · What is it?',
    builderStep2: 'Step 2 · Who does the real work?',
    q1: 'The rail must run it and undo it like any other slip. What should MakeSpicyCommand be?',
    q1Rail: 'A new makeSpicy() method on OrderRail',
    q1Implements: 'implements OrderCommand',
    q1NoUndo: 'A slip with execute() only, no undo()',
    q2: 'Inside execute(), who actually adds the chili?',
    q2Self: 'The slip grinds the chili itself',
    q2Rail: 'The OrderRail, while it runs the slip',
    q2Kitchen: 'The Kitchen: kitchen.addChili(dish, table)',
    zeroEdits: 'Old code edited: 0 lines',
    useSpicy: 'Pin MakeSpicyCommand slips',

    // Turn
    playButton: 'Play',
    nextTurn: 'Next table',
    finishLevel: 'Finish level',
    tryAgain: 'Try again',

    // Level end
    levelDone: 'Level {{n}} complete!',
    nextLevel: 'Next level',
    replayLevel: 'Play this level again',
    playAgain: 'Play again from level 1',
    l1Teaser:
      'It worked, but only because Karim kept the queue, the history and the bill in his head. Next week the owner adds “make it spicy”: another kitchen method, another if in the waiter, and who remembers how to take it back?',
    l2Summary:
      'Karim only wrote slips. The rail ran them one by one, remembered them in its history, worked out the bill and undid the last one on request, without knowing a thing about kacchi or borhani.',
    recapTitle: 'What you learned',
    recap1: 'Without commands, the caller calls the receiver directly: nothing waits in line, nothing is recorded, so orders get lost and a cancel hits the wrong plate.',
    recap2:
      'A Command turns the request into an object with execute() and undo(). The invoker (the rail) queues it, runs it, keeps a history for undo and the bill, and never needs to know what is on the slip.',
    recap3: 'A new kind of request (MakeSpicyCommand) is one new class that calls the receiver. The rail, the waiter and the old commands: 0 lines edited.',

    whatsHappening: "What's happening",
    note: 'The restaurant, people and prices are made up for this example.',
  },

  steps: {
    // Level 1: no pattern
    tutorial:
      'Nusrat at table 2 orders a kacchi ({{price}}). In this kitchen Karim calls the cook directly, by shouting. “Shout now” is already picked for you. Press Play and watch.',
    'idle1-1': 'Nusrat at table 2 orders a kacchi ({{price}}). What should Karim shout?',
    'idle1-2': 'Rush hour! Two tables order at the same moment: {{orders}}. Rahim mama can only cook one thing at a time. What does Karim do?',
    'idle1-3': 'Earlier, Karim shouted borhani for Tania and then firni for Mitu. Now Tania says: “No borhani after all!” How does Karim cancel it?',
    picked1: 'You picked: {{choice}}. Press Play and see what the kitchen does with it.',
    'l1-order': '{{name}} at table {{table}} orders {{dish}} ({{price}}). Karim has no slip pad: whatever happens next, happens by mouth.',
    'l1-orders': 'Two orders arrive at once: {{orders}}. Karim must get both to one busy cook.',
    'l1-shout': 'Karim shouts “{{dish}}, table {{table}}!” through the door. That is a direct call: kitchen.cook…() runs right now, and nothing is written down.',
    'l1-shout2': 'To be safe, Karim shouts it again. A shout is not a thing you can look at, so Rahim mama can’t tell a repeat from a new order.',
    'l1-silent': 'Karim nods and says nothing. An order that only lives in someone’s ear is gone the moment they forget it.',
    'l1-idle': 'The kitchen heard nothing, so it cooks nothing.',
    'l1-wait': '{{name}} has been waiting for 30 minutes. Nobody even knows the order existed.',
    'l1-cook': 'Rahim mama cooks {{dish}} for table {{table}}.',
    'l1-extra': 'He heard “kacchi” twice, so he cooks a second plate. One {{dish}} too many: {{price}} wasted.',
    'l1-serve': 'Karim carries the plates out to the tables.',
    'l1-bill': 'Karim adds it up in his head: the bill is now {{bill}}.',
    'l1-bill-none': 'Nothing was cooked, so there is nothing to bill: {{bill}}.',
    'l1-ok': 'Served! Bill {{bill}}. It worked, but only because Karim did the queueing and the record-keeping in his head.',
    'l1-fail-extra':
      '😵 Two kacchi for one order: the extra {{price}} plate is wasted. Shouts can’t be counted or checked, so the kitchen did exactly what it heard.',
    'l1-fail-none': '😠 {{name}} walks out hungry. An order nobody wrote down or passed on simply vanishes.',
    'l1-shout-hold': 'Karim shouts “{{dish}}, table {{table}}!” and keeps the {{held}} in his head for later.',
    'l1-cook-hold': 'Rahim mama cooks the {{dish}}. Meanwhile the only queue in this restaurant is Karim’s memory: “{{held}}, table 5… {{held}}, table 5…”',
    'l1-shout-held': 'The stove is free, and Karim remembered! He shouts “{{dish}}, table {{table}}!”',
    'l1-shout-both': 'Karim shouts both at once: {{orders}}. Rahim mama starts on the first thing he hears.',
    'l1-shout-loud': 'Karim shouts both, the borhani loudest. Rahim mama hears only the borhani.',
    'l1-lost': 'Rahim mama is busy at the stove and the other shout is lost: {{dish}} for table {{table}} is never made. A shout can’t wait in line.',
    'l1-fail-lost':
      '😵 {{name}} never gets the {{dish}}. Two shouts at a busy cook, and one was lost: nothing held the second order until he was free.',
    'l1-cancel': '{{cname}} at table {{ctable}} changes her mind: “No {{cdish}} after all!” But the kitchen kept no record of what it made, or for whom.',
    'l1-dash': 'Karim runs into the kitchen himself and searches the counter for table {{table}}’s {{dish}}.',
    'l1-uncook': 'Found it. The {{dish}} for table {{table}} comes back to the kitchen.',
    'l1-bill-fix': 'Karim fixes the bill in his head: minus {{price}}, so the bill is now {{bill}}.',
    'l1-ok-manual':
      'Done, bill {{bill}}. It worked, but Karim had to remember who ordered what, run to the kitchen and do the maths. Every cancel will need the same detective work.',
    'l1-cshout-last': 'Karim shouts “Cancel the last one!” The last thing Rahim mama made was {{lastDish}} for table {{lastTable}}…',
    'l1-wrongBack': '…so he takes back the {{dish}} from table {{table}}. Wrong plate!',
    'l1-fail-wrong':
      '😱 Wrong dish cancelled! {{lastName}} lost the {{lastDish}} she wanted, and {{cname}} still has the {{cdish}}. “Last” means nothing when the kitchen keeps no history.',
    'l1-cshout-vague': 'Karim shouts “Cancel!” into the kitchen. Cancel what? For which table?',
    'l1-confused': 'Rahim mama shrugs. Without a record of the orders he can’t tell which one to take back.',
    'l1-bill-same': 'Nothing was cancelled, so the bill still says {{bill}}.',
    'l1-fail-vague': '😵 Nothing was cancelled. {{cname}} is still billed {{price}} for a {{cdish}} she doesn’t want.',
    'level1-done':
      'Level complete! Every order reached the kitchen, but only because Karim kept the queue, the history and the bill in his own head.',

    // Level 2: commands
    'idle2-1': 'Rush hour again, two orders at once: {{orders}}. How does Karim hand them to the kitchen?',
    'idle2-2': 'Rafiq’s roast and Tania’s borhani are already on the tables, and their slips are in the rail’s history. Now Tania says “No borhani!” What does Karim do?',
    'idle2-3': 'Rafiq at table 9 will order a chicken roast, and then change his mind. Mitu’s firni is already served. How does Karim cancel the roast?',
    picked2: 'You picked: {{choice}}. Press Play.',
    order: '{{name}} at table {{table}} orders {{dish}} ({{price}}).',
    orders: 'Two orders at once: {{orders}}.',
    write:
      'Karim writes each order on a slip: new CookDishCommand(kitchen, dish, table, price). The request is now an object: you can hold it, queue it and take it back.',
    pin: 'He pins the slips on the rail: rail.pin(slip). His job ends here. He doesn’t need to know how kacchi is made.',
    next: 'When Rahim mama is free, the rail takes the next slip in order and calls slip.execute(). It doesn’t know or care what is written on it.',
    exec: 'CookDishCommand.execute() hands the work to the receiver: kitchen.cook(dish, table). The slip knows who does the job.',
    cook: 'Rahim mama cooks {{dish}} for table {{table}}. The rail puts the slip in its history, so the bill is now {{bill}}.',
    'done-ok':
      'Everyone served! +{{coins}}. Two orders arrived at once and none was lost: the slips waited in the rail’s queue until the cook was free.',
    shout: 'Karim skips the slips and shouts at the kitchen: kitchen.cook(…) called directly, past the rail, just like level 1.',
    'cook-bypass': 'Rahim mama starts on the {{dish}}…',
    lost: '…and the {{dish}} for table {{table}} is lost in the noise. No slip, so nothing waits in the queue.',
    'bill-empty': 'And the rail never saw either order, so its history is empty and the bill says {{bill}}.',
    'done-shout':
      '😵 {{name}} never gets the {{dish}}, and the bill is {{bill}}. Talking to the receiver directly throws away everything the invoker does: queue, history, bill.',
    'shout-too': 'The slips are on the rail, and Karim also shouts them, “just in case”. Now two different callers are talking to the kitchen.',
    cookShout: 'Rahim mama cooks both orders from the shout. The rail doesn’t know: its slips are still waiting in the queue.',
    dup: 'Then the rail runs its first slip, and the kitchen cooks {{dish}} again: an extra {{price}} plate.',
    'done-dup':
      '😵 Every order would be cooked twice. If the rail is the one who calls execute(), nobody else should call the kitchen for the same order.',
    cancel: '{{cname}} at table {{ctable}} says: “No {{cdish}}, please!”',
    undo: 'Karim calls rail.undoLast(). The rail pops the most recent slip off its history: {{dish}}, table {{table}}.',
    uexec: 'The slip knows how to reverse itself: undo() calls kitchen.takeBack(dish, table).',
    uncook: 'Rahim mama takes the {{dish}} back from table {{table}}.',
    bill: 'The rail adds up what’s left in its history: the bill is {{bill}}.',
    'done-undo':
      'Cancelled cleanly! +{{coins}}. The slip remembered exactly what to take back, and the history kept the bill right. Karim didn’t have to remember anything.',
    'undo-again': 'To be safe, Karim calls rail.undoLast() a second time. Now it pops the slip before that: {{dish}} for table {{table}}.',
    wrongBack: 'Rahim mama takes back the {{dish}} from table {{table}}. But nobody cancelled that one!',
    'done-twice':
      '😵 {{lastName}} lost her {{lastDish}}. undoLast() undoes exactly one slip, the most recent; call it once per cancel.',
    cshout: 'Karim shouts “No {{dish}}!” into the kitchen himself, skipping the rail.',
    direct: 'Karim calls kitchen.takeBack("roast", 9) himself, skipping the rail.',
    'uncook-bypass': 'Rahim mama takes the {{dish}} back from table {{table}}. In the kitchen, at least, it’s done…',
    'bill-stale': '…but the slip is still in the rail’s history, so the bill still says {{bill}}.',
    'done-stale':
      '😵 {{name}} is billed {{price}} for a {{dish}} that went back. The kitchen and the rail’s history no longer agree. Undo through the invoker, so both stay in step.',
    tear: 'Karim tears the {{dish}} slip off the rail. The history (and the bill) forget it… but undo() is never called.',
    'idle-torn': 'So the kitchen never hears about the cancel. The {{dish}} is already on table {{table}}, and nobody pays for it.',
    'done-tear':
      '😵 A {{price}} {{dish}} wasted. Removing a slip isn’t undoing it: only the slip’s undo() knows how to reverse its work in the kitchen.',
    'level2-done':
      'Level complete! Orders became slips. The rail queued them, ran them in order, kept a history and undid the last one. The waiter never touched the kitchen.',

    // Level 3: a new command
    'build-q1':
      'New request type: “make it spicy” (+৳20), and “too hot, take it back!”. You’ll write MakeSpicyCommand. First: what should it be, so the rail can run and undo it?',
    'wrong-q1-rail':
      'Then the rail changes for every new kind of request, and it has to know about chili. The rail should only know one thing: OrderCommand, with execute() and undo().',
    'wrong-q1-noundo':
      'Then “too hot!” can’t be taken back: rail.undoLast() calls undo() on whatever slip is last. Every command must know how to reverse itself.',
    'build-q2': 'Right: implements OrderCommand, so it has execute() and undo(). Now, inside execute(), who actually adds the chili?',
    'wrong-q2-self':
      'A slip is just a note: if it cooks, the cooking skill is copied into every slip. The command holds a reference to the receiver and asks it to do the work.',
    'wrong-q2-rail': 'Then the rail has to know about chili, and it changes again for the next request. The rail only calls execute(); the slip decides what that means.',
    'build-ready': 'Done: one new class. 0 lines changed in OrderRail, CookDishCommand, Waiter or Kitchen. Press “Pin MakeSpicyCommand slips”.',
    'build-done': 'MakeSpicyCommand is ready. Press Play: Karim pins it like any other slip.',
    idle3: '{{name}} at table {{table}} orders {{dish}}, “and make it spicy!” Press Play.',
    'idle3-cancel': 'Tania’s roast went out spicy. She takes a bite: “Too hot!” Press Play to undo just the chili.',
    'l3-order': '{{name}} at table {{table}} orders {{dish}}: “and make it spicy!”',
    'l3-write': 'Karim writes two slips: a CookDishCommand and the new MakeSpicyCommand (+{{chili}}). Same pad, same pen.',
    'spicy-next': 'The rail runs the next slip exactly the same way: slip.execute(). It never learned what “spicy” means.',
    'spicy-exec': 'MakeSpicyCommand.execute() asks the receiver: kitchen.addChili(dish, table).',
    chili: 'Rahim mama adds the extra chili to the {{dish}}. The slip goes into the history: bill {{bill}}.',
    'l3-cancel': '{{cname}} takes a bite: “Too hot! Take the chili back!”',
    'spicy-undo': 'Karim calls the same old rail.undoLast(). The last slip in the history is the MakeSpicyCommand.',
    'spicy-uexec': 'MakeSpicyCommand.undo() asks the kitchen to reverse it: kitchen.removeChili(dish, table).',
    unchili: 'Rahim mama makes the {{dish}} mild again. Only the chili is undone; the roast stays on the table.',
    'done-new':
      'Spicy and served! +{{coins}}. A new kind of request was one new class: the rail ran it like any other slip.',
    'done-new-undo': 'Taken back! +{{coins}}. undoLast() undid exactly the chili, because the slip knows how to reverse itself.',
    'level3-done':
      'You finished the game! Requests became objects: they wait in line, run later, stay in a history and undo themselves. New requests are just new classes.',
  },

  codeComments: {
    command: 'Command: every slip has the same two buttons',
    slipPrice: 'what the slip adds to the bill',
    doIt: 'carry out the request',
    undoIt: 'and know how to take it back',
    receiver: 'Receiver: Rahim mama knows the real work',
    realWork: 'only the kitchen knows how to cook',
    concrete: 'ConcreteCommand: one order slip',
    holdsReceiver: 'the slip knows who will do the work',
    delegates: 'execute = ask the kitchen to cook',
    reverses: 'undo = ask the kitchen to take it back',
    invoker: 'Invoker: the order rail',
    queueField: 'slips waiting for the cook, in order',
    historyField: 'slips already done: for undo and the bill',
    waits: 'the slip waits in line; nothing is lost',
    inOrder: 'first pinned, first cooked',
    blind: 'the rail doesn’t know what’s on the slip',
    remember: 'remember it for undo and the bill',
    lastFirst: 'undo the most recent slip',
    billFromHistory: 'the bill comes from the history',
    client: 'Client: Karim writes slips and pins them',
    writeSlip: 'write a slip, pin it on the rail',
    railRuns: 'the rail runs it when the cook is free',
    cancelIsUndo: 'a cancel is just undo',
    withoutIntro: 'No pattern: Karim shouts straight at the cook',
    billInHead: 'the bill lives in the waiter’s head',
    knowsKitchen: 'the waiter knows every kitchen method',
    shoutNow: 'runs right now: busy cook? too bad',
    busyLost: 'nothing waits in line, nothing is recorded',
    noRecord: 'no record of what was made, or for whom',
    hopeRight: 'hope it’s the right plate',
    fixByHand: 'fix the bill by hand',
    withoutCopy: 'every new request = another kitchen method and another branch here',
    withAdd: '“Make it spicy” = one new command class',
    sameInterface: 'same two buttons: execute and undo',
    chiliPrice: 'extra chili: ৳20',
    askReceiver: 'the kitchen still does the real work',
    chiliOn: 'execute = add the chili',
    chiliOff: 'undo = take the chili back out',
    othersSame: 'Old classes: not a single line edited',
    withUse: 'Karim pins it like any other slip',
    newSlip: 'the new kind of slip',
    sameRail: 'the rail runs it the same way',
    tooHot: '“Too hot!” undoes only the chili',
    withZero: 'Old code edited: 0 lines. Without commands: a new branch in the waiter, and undo by hand',
  },

  compare: {
    without: {
      title: 'The caller talks to the receiver directly',
      points: [
        'The waiter calls the kitchen the moment an order is spoken: a busy cook simply misses it.',
        'Nothing is recorded, so “cancel the last one” has no last one, and the bill is fixed by hand.',
        'The waiter knows every kitchen method (cookKacchi, cookRoast, serveCold…) and grows a branch per dish.',
        'Every new kind of request, like “make it spicy”, means editing the waiter and inventing its undo again.',
      ],
    },
    with: {
      title: 'Each request is an object on the rail',
      points: [
        'A slip (CookDishCommand) holds the receiver and the details, behind one interface: execute() and undo().',
        'The rail (invoker) queues slips, runs them in order and keeps a history: nothing gets lost.',
        'Undo is rail.undoLast(): the slip reverses its own work, and the bill is read from the history.',
        'A new request type is one new class (MakeSpicyCommand); the rail, the waiter and the old commands don’t change.',
      ],
    },
    benefit:
      'Command separates asking for something from doing it. Because the request is an object, the invoker can queue it, schedule it, log it and undo it without knowing what it does, and new requests plug in as new classes.',
    whenToUse: [
      'You need undo / redo, or a history of what was done (editors, order systems, banking transactions).',
      'Requests should wait in a queue, run later, or run on another thread or machine (job queues, task schedulers).',
      'You want buttons, menus or shortcuts to trigger actions without knowing which object does the work.',
    ],
  },
} satisfies PatternContent

export type CommandContent = typeof en

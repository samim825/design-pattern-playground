import type { PatternContent } from '@/types/pattern'

export const en = {
  title: 'Strategy',
  tagline: 'Swap an algorithm at runtime — without touching the code that uses it.',
  intent:
    'Define a family of interchangeable algorithms, put each one in its own class behind a common interface, and let the context object switch between them at runtime.',

  scenario: {
    title: 'Checkout at an online shop',
    paragraphs: [
      'Rahim is buying a T-shirt and a mug from an online shop in Dhaka. The cart total is ৳1,250. At checkout he can pay with bKash, Nagad or a bank Card.',
      'Each method works differently. bKash charges a fee, then asks for an OTP and a PIN. Nagad has a lower fee and only needs an OTP. A Card payment goes through a 3-D Secure check, and then the bank has to authorize it.',
      'Next month the business team wants to add Rocket, and after that maybe cash on delivery. Whichever method the customer picks, the checkout has to keep working the same way.',
    ],
    problem:
      'If the checkout function itself knows how every payment method works, it turns into one huge if/else. Every new method means editing — and re-testing — the most critical function in the shop.',
  },

  visual: {
    // Game HUD
    levelsLabel: 'Game levels',
    levelLabel: 'Level {{n}}',
    level1Title: 'One big checkout',
    level2Title: 'Plug in a strategy',
    level3Title: 'Add Rocket',
    level1Goal: "No pattern yet: your checkout() itself must know every payment method's steps. Tick the steps for each customer's method.",
    level2Goal: 'Now each method is a strategy. Just plug the right one into Checkout. Watch out: customers can change their mind!',
    level3Goal: 'Customers want Rocket. Add it without touching Checkout or the other strategies, then take the payment.',
    locked: 'Locked',
    earned: 'Sales',
    restart: 'Restart game',
    customerOf: 'Customer {{n}}/{{total}}',

    // Nodes
    clientRole: 'Client',
    customersTitle: 'At the counter',
    wantsToPay: 'wants to pay with',
    changedMind: 'Changed mind!',
    pickSteps: 'Tick the steps to run',
    pickStrategy: 'Plug a strategy into Checkout',
    noPatternRole: 'No pattern',
    branchesLabel: 'Branches your checkout() must know',
    linesLabel: 'Lines of if/else you maintain',
    contextRole: 'Context',
    contextTitle: 'Checkout',
    unchanged: 'Checkout code unchanged',
    swapped: 'Swapped at runtime',
    strategyRole: 'ConcreteStrategy',
    implementsLabel: 'implements PaymentStrategy',
    processingRole: 'Payment steps',
    emptySlot: 'empty',
    noStrategy: 'No strategy plugged in yet…',
    buildSlot: 'Build it',
    newTag: 'New',

    // Payment steps
    procFee: 'Calculate fee',
    procOtp: 'Verify OTP',
    procPin: 'Confirm PIN',
    proc3ds: '3-D Secure check',
    procBank: 'Bank authorization',
    procNotNeeded: 'not part of {{method}}',

    // Builder (level 3)
    builderTitle: 'Add the Rocket payment',
    builderStep1: 'Step 1 · Where does the code go?',
    builderStep2: 'Step 2 · And in Checkout?',
    q1: "Where should Rocket's payment steps live?",
    q1ElseIf: 'Another else-if in Checkout',
    q1NewClass: 'New class RocketPayment',
    q1InBkash: 'Inside BkashPayment',
    q2: 'What do you change in Checkout?',
    q2Nothing: 'Nothing',
    q2AddCase: "Add a 'rocket' case",
    q2NewMethod: 'Add payRocket()',
    openStrategy: 'Use RocketPayment',
    zeroEdits: 'Checkout & old strategies edited: 0 lines',

    // Payment
    payButton: 'Take payment',
    nextCustomer: 'Next customer',
    finishLevel: 'Finish level',
    tryAgain: 'Try again',
    paid: 'Paid',
    declined: 'Declined',
    receiptTitle: 'Receipt',
    amount: 'Amount',
    fee: 'Fee',
    total: 'Total',

    // Level end
    levelDone: 'Level {{n}} complete!',
    nextLevel: 'Next level',
    replayLevel: 'Play this level again',
    playAgain: 'Play again from level 1',
    l1Teaser:
      'Then the business team says: “Add Rocket next month, then Upay.” Each one means editing this checkout() again, and re-testing every branch. There must be a better way…',
    l2Summary:
      "You never touched Checkout's code. You only plugged in strategies, and even swapped one at runtime when Rahim changed his mind.",
    recapTitle: 'What you learned',
    recap1: "Without the pattern, one checkout() knows every payment method's steps, and grows with each new one.",
    recap2: 'With Strategy, each method lives in its own class behind PaymentStrategy, and Checkout just delegates.',
    recap3: 'Swapping or adding a method never edits Checkout: setStrategy() at runtime, a new class for Rocket.',

    // Names
    rahim: 'Rahim',
    nusrat: 'Nusrat',
    karim: 'Karim',
    mitu: 'Mitu',
    bkash: 'bKash',
    nagad: 'Nagad',
    card: 'Card',
    rocket: 'Rocket',

    whatsHappening: "What's happening",
    feeNote: 'Fees are illustrative, not real rates.',
  },

  steps: {
    // Level 1: no pattern
    tutorial:
      "Rahim pays {{amount}} with bKash. We've ticked bKash's steps for you this time: OTP and PIN. Press Take payment and watch your checkout() run.",
    idle1: '{{name}} pays {{amount}} with {{method}}. Tick the steps your checkout() must run for {{method}}, then take the payment.',
    picked1: 'Steps ticked for {{method}}. Press Take payment to find out if they are right.',
    'l1-start': "checkout({{amount}}, '{{methodId}}') is called. Without the pattern, this one function must handle every method.",
    'l1-branch': "It searches its if/else for the {{method}} branch. Every method's details live in here.",
    'l1-step': 'Running “{{step}}” for {{method}}…',
    'l1-wrong': '“{{step}}” is not a {{method}} step, but the checkout runs it anyway…',
    'l1-ok': 'Paid! +{{amount}}. Right this time, but your checkout() had to know every detail of {{method}}.',
    'fail-missing': 'Declined! {{method}} also needs: {{missing}}. One forgotten step in the shared if/else and the payment fails.',
    'fail-extra': 'Error! {{method}} has no {{extra}} step. The customer got confused and walked away.',
    'level1-done':
      'Level complete! Look at the highlighted line in the code: every new payment method would force you to edit this checkout() again.',

    // Levels 2 and 3: Strategy
    idle2: '{{name}} pays {{amount}} with {{method}}. Plug that strategy into Checkout, then take the payment.',
    'wrong-strategy': '{{name}} wants to pay with {{method}}, not {{picked}}. Plug in the right strategy.',
    'change-mind': 'Wait! {{name}} changes their mind: “Can I pay by {{method}} instead?” Swap the strategy. Checkout itself stays the same.',
    'set-strategy':
      'The client calls checkout.setStrategy(new {{className}}()). Checkout just stores the new object in its strategy field. Nothing else in Checkout changes.',
    swapped:
      'Swapped at runtime with setStrategy(new {{className}}()). Checkout\'s code did not change at all. Press Take payment.',
    'client-pay': "The client calls checkout.pay({{amount}}). It doesn't know, or care, how the payment will actually happen.",
    delegate:
      "Checkout doesn't process the payment itself. It delegates to whichever strategy it currently holds: strategy.pay(amount).",
    fee: '{{method}} calculates its own fee: {{rate}} of {{amount}} = {{fee}}.',
    otp: "{{method}} sends a one-time password to {{name}}'s phone and verifies it.",
    pin: '{{name}} confirms the payment with their {{method}} PIN.',
    '3ds': "A 3-D Secure check makes sure it's really {{name}} using this card.",
    bank: 'The bank that issued the card authorizes the charge.',
    receipt: '{{method}} returns a Receipt. Every strategy returns the same shape, so Checkout treats them all alike.',
    done: 'Paid! +{{amount}} (fee {{fee}}). The same Checkout.pay() ran; only the strategy was different.',
    'level2-done': 'Level complete! Checkout never changed. You only plugged strategies in, and swapped one at runtime.',

    // Level 3: adding Rocket
    'need-build': 'No strategy handles Rocket yet. Tap “Build it” to add RocketPayment.',
    'build-q1': 'First: where should Rocket\'s fee and OTP steps go?',
    'wrong-elseif': "That's the old way: Checkout.pay() would grow another branch and need re-testing for every method.",
    'wrong-in-bkash': "Rocket isn't bKash. Mixing them means a Rocket change could break bKash payments.",
    'build-q2': 'RocketPayment implements PaymentStrategy. Now: what must change in Checkout?',
    'wrong-add-case': 'No case needed: Checkout only talks to the PaymentStrategy interface, so it already works with any new strategy.',
    'wrong-new-method': 'Checkout.pay() already delegates to whatever strategy it holds. A new method would only duplicate it.',
    'build-ready': 'Done: one new class, and nothing else edited. Press “Use RocketPayment”.',
    'build-done': 'RocketPayment is plugged in with setStrategy(new RocketPayment()). Checkout and the old strategies are untouched. Take the payment!',
    'rocket-pay': 'The client calls checkout.pay({{amount}}), exactly like before.',
    'rocket-delegate': 'Checkout delegates to the strategy it holds, which is now a RocketPayment. Checkout never heard of Rocket.',
    'rocket-fee': 'RocketPayment calculates its own fee: {{rate}} of {{amount}} = {{fee}}.',
    'rocket-otp': "RocketPayment sends an OTP to {{name}}'s phone and verifies it.",
    'rocket-receipt': 'RocketPayment returns the same kind of Receipt as every other strategy.',
    'rocket-done': 'Paid with Rocket! +{{amount}}. Checkout and the other strategies never changed.',
    'level3-done':
      'You finished the game! Strategy puts each way of doing a job in its own class, so you can swap or add one without touching the code that uses it.',
  },

  codeComments: {
    interface: 'Every payment method must follow this contract',
    bkashFee: 'bKash fee: 1.85%',
    nagadFee: 'Nagad fee: 1%',
    cardFee: 'Card fee: 2.5%',
    context: 'Context: holds a strategy, but never knows which one',
    swap: 'Swap the algorithm at runtime',
    delegate: 'Hand the real work to the current strategy',
    usage: 'Client code',
    withoutIntro: "Checkout has to know every payment method's details",
    withoutTodo: 'Adding Rocket? Edit this function again… and re-test every branch',
    withAdd: 'Adding Rocket = one new class. Checkout stays untouched.',
    withSwap: 'just plug it in',
  },

  compare: {
    without: {
      title: 'One checkout function with a long if/else',
      points: [
        'Checkout must know the details of every payment method.',
        'Adding or changing a method means editing this function — and re-testing every branch.',
        'Hard to unit-test one payment method on its own.',
        'The if/else keeps growing: bKash, Nagad, Card, Rocket, Upay…',
      ],
    },
    with: {
      title: 'Each method is its own strategy class',
      points: [
        'Checkout only knows the PaymentStrategy interface.',
        'Each payment method lives in its own small, focused class.',
        'Add Rocket by writing one new class — no existing code changes.',
        'Swap methods at runtime with setStrategy(), and test each strategy in isolation.',
      ],
    },
    benefit:
      'This is the Open/Closed Principle in action: the checkout is open for extension (new payment methods) but closed for modification. The behaviour that varies is pulled out into separate classes, so the part that stays the same — Checkout — never has to change.',
    whenToUse: [
      'You have several ways of doing the same job (payments, delivery charges, sorting, compression…).',
      'You see a growing if/else or switch that picks between behaviours.',
      'You want to choose or change the behaviour at runtime — from a user choice or a config value.',
    ],
  },
} satisfies PatternContent

export type StrategyContent = typeof en

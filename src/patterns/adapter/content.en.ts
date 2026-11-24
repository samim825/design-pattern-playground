import type { PatternContent } from '@/types/pattern'

export const en = {
  title: 'Adapter',
  tagline: 'Make a class with the "wrong" interface fit the one your code expects, without changing either side.',
  intent:
    'Convert the interface of a class into another interface that clients expect. The adapter wraps the incompatible object and translates every call and reply, so classes that could not work together now can.',

  scenario: {
    title: "A new bank SDK at Rahim's online shop",
    paragraphs: [
      "Rahim's online shop takes payments through one simple interface: PaymentProcessor.pay(amount), in taka. bKash already works that way, so Checkout never has to think about how each provider works.",
      'Now Padma Bank offers card payments, but its SDK speaks a different language: makeTransfer({ amountInPaisa, currency, ref }), with the amount in paisa, and a reply of { status, txnId } instead of a receipt. Rahim cannot change the bank\'s SDK, and he doesn\'t want to rewrite his Checkout.',
      'Next month a second SDK arrives, Jamuna Wallet, with yet another shape: debit("780.00", "BDT") that simply returns true or false.',
    ],
    problem:
      "If Checkout calls the bank's SDK directly, it has to learn the bank's method names, its paisa and its reply format. One unit mix-up charges ৳12.50 instead of ৳1,250, and every new SDK means rewriting Checkout again.",
  },

  visual: {
    // Game HUD
    levelsLabel: 'Game levels',
    levelLabel: 'Level {{n}}',
    level1Title: 'Call the SDK directly',
    level2Title: 'Plug in an adapter',
    level3Title: 'A second SDK arrives',
    level1Goal: "No pattern yet: checkout() calls Padma Bank's SDK itself. Rewrite the call in the bank's own language.",
    level2Goal: 'Now an adapter speaks both languages. Plug the right processor into Checkout for each customer.',
    level3Goal: 'Jamuna Wallet speaks yet another language. Connect it without changing Checkout or any processor.',
    locked: 'Locked',
    earned: 'Sales',
    restart: 'Restart game',
    orderOf: 'Order {{n}}/{{total}}',

    // Nodes
    clientRole: 'Client',
    checkoutTitle: "Rahim's checkout",
    paysWith: 'pays with {{provider}}',
    rewriteLabel: "Rewrite checkout() for Padma Bank's SDK",
    fieldMethod: 'Method to call',
    fieldAmount: 'Amount to send (amountInPaisa)',
    fieldResult: 'How to read the reply',
    plugLabel: 'Plug a processor into Checkout',
    optRawSdk: 'PadmaBankSdk (raw)',
    noPatternRole: 'No pattern',
    sdkDetails: 'Bank details checkout() must know',
    adapterRole: 'Adapter',
    processorRole: 'PaymentProcessor',
    targetTag: 'Target',
    implementsLabel: 'implements',
    noAdapterNeeded: 'Already speaks PaymentProcessor: no adapter needed',
    noProcessor: 'Nothing plugged in yet…',
    inLabel: 'Checkout says',
    outLabel: 'Bank hears',
    replyIn: 'Bank replies',
    replyOut: 'Checkout gets',
    adapteeRole: 'Adaptee',
    serviceRole: 'Service',
    adapteeApi: "Its own API (we can't change it)",
    charged: 'Charged',
    waitingCall: 'Waiting for a call…',
    paid: 'Paid',
    failed: 'Failed',
    buildSlot: 'Build it',
    newTag: 'New',

    // Providers
    bkash: 'bKash',
    padma: 'Padma Bank',
    jamuna: 'Jamuna Wallet',

    // Builder (level 3)
    builderTitle: 'Connect Jamuna Wallet',
    builderStep1: 'Step 1 · Where does the translation go?',
    builderStep2: 'Step 2 · What does it translate?',
    q1: 'How do you connect Jamuna Wallet?',
    q1Adapter: 'A JamunaWalletAdapter',
    q1Checkout: 'Make Checkout call debit()',
    q1Interface: 'Change PaymentProcessor',
    q2: 'debit() wants "780.00" and replies true or false. What does the adapter translate?',
    q2Text: 'number → "780.00", true → Receipt',
    q2Paisa: 'taka → paisa',
    q2Nothing: 'Nothing, just forward it',
    useAdapter: 'Use JamunaWalletAdapter',
    zeroEdits: 'Checkout & other processors edited: 0 lines',

    // Turn
    payButton: 'Take payment',
    nextOrder: 'Next order',
    finishLevel: 'Finish level',
    tryAgain: 'Try again',

    // Level end
    levelDone: 'Level {{n}} complete!',
    nextLevel: 'Next level',
    replayLevel: 'Play this level again',
    playAgain: 'Play again from level 1',
    l1Teaser:
      'Then Rahim hears: “Jamuna Wallet is coming next month, with a different SDK.” Checkout would have to be rewritten again, for yet another set of method names and units. There must be a better way…',
    l2Summary:
      "Checkout never learned a single Padma Bank detail. The adapter translated taka to paisa, pay() to makeTransfer() and the reply to a Receipt, and bKash didn't even need one.",
    recapTitle: 'What you learned',
    recap1: "Calling a foreign API directly welds your code to its method names, units and reply shapes.",
    recap2: 'An adapter implements the interface your code expects and translates every call and reply.',
    recap3: 'A new SDK means one new adapter; the client and the other adapters never change.',

    // Names
    nusrat: 'Nusrat',
    karim: 'Karim',
    mitu: 'Mitu',

    whatsHappening: "What's happening",
    note: 'Padma Bank, Jamuna Wallet and their SDKs are made up for this example.',
  },

  steps: {
    // Level 1: no pattern
    tutorial:
      "Nusrat pays {{amount}} with her Padma Bank card. We've written the SDK call for you this time. Press Take payment and watch checkout() talk to the bank directly.",
    idle1: "{{name}} pays {{amount}} with Padma Bank. Rewrite checkout() for the bank's SDK: the method, the amount and how to read the reply.",
    picked1: "checkout() is rewritten. Press Take payment and see if the bank understands it.",
    'l1-call': "checkout() talks to Padma Bank's SDK directly, with nothing in between.",
    'l1-method-ok': "padma.makeTransfer({…}): the bank's own method name. checkout() now has to know it.",
    'l1-method-bad': 'padma.pay(…)? The SDK has no pay() method at all.',
    'l1-amount-ok': 'amountInPaisa: {{paisa}}. Padma Bank counts in paisa, so {{amount}} × 100.',
    'l1-amount-bad': 'amountInPaisa: {{wrongValue}}. That number is in taka, but the bank reads it as paisa!',
    'l1-result-ok': "res.status === 'OK': the bank replies with a status and a txnId, not a receipt.",
    'l1-result-bad': 'res.receipt? The bank never sends one: its reply is { status, txnId }.',
    'l1-ok': "Paid! +{{amount}}. It works, but checkout() is now full of Padma Bank's method names, paisa and reply shape.",
    'l1-fail-method': '💥 TypeError: padma.pay is not a function. The payment never happened.',
    'l1-fail-amount': '😱 The bank charged {{charged}} instead of {{amount}}: taka was sent where paisa was expected.',
    'l1-fail-result': '❓ res.receipt is undefined. The money left the customer\'s account, but the shop never found out.',
    'level1-done':
      'Level complete! Look at the highlighted line in the code: Checkout is now welded to one bank. A second SDK means rewriting it again.',

    // Level 2: Adapter
    idle2: '{{name}} pays {{amount}} with {{provider}}. Plug the right processor into Checkout, then take the payment.',
    'wrong-raw':
      "Type error: PadmaBankSdk has no pay(amount). It doesn't speak PaymentProcessor, so Checkout can't use it. Wrap it in an adapter.",
    'wrong-provider': '{{name}} is paying with {{provider}}, not {{picked}}. Plug in the matching processor.',
    ready: '{{processor}} is plugged in. Press Take payment.',
    wire: 'new Checkout({{processor}}): Checkout only ever sees a PaymentProcessor.',
    order: 'The customer pays: checkout.pay({{amount}}), in taka, as always.',
    'client-pay': 'Checkout calls processor.pay({{amount}}). It has no idea which company is behind it.',
    'bkash-pay': 'BkashProcessor already speaks PaymentProcessor, so no adapter is needed: it charges {{amount}} directly.',
    'adapter-pay': "PadmaBankAdapter.pay({{amount}}) receives the call in Checkout's language.",
    translate: "It translates the call into the bank's language: sdk.makeTransfer({…}).",
    'to-paisa': 'Taka to paisa: {{amount}} becomes amountInPaisa: {{paisa}}.',
    'check-status': "The bank replies { status: 'OK', txnId }, and the adapter checks the status.",
    'to-receipt': '…then translates the reply back into a Receipt, the shape Checkout expects.',
    done: 'Paid! +{{amount}}. Checkout never learned a single Padma Bank detail.',
    'level2-done': 'Level complete! Every processor looked the same to Checkout; the adapter hid all of the bank\'s differences.',

    // Level 3: a second adaptee
    'need-build': '{{name}} wants to pay with Jamuna Wallet, a brand-new SDK. Tap “Build it” to connect it.',
    'build-q1': 'First: how do you connect Jamuna Wallet?',
    'wrong-q1-checkout': "Then Checkout would know Jamuna's API, and the next SDK would change it yet again.",
    'wrong-q1-interface': 'Changing PaymentProcessor would break bKash, Padma Bank and every other processor.',
    'build-q2': 'JamunaWalletAdapter implements PaymentProcessor. Now: what does it have to translate?',
    'wrong-q2-paisa': 'Paisa is Padma Bank\'s rule. Jamuna wants the amount as text, like "780.00".',
    'wrong-q2-nothing': "The shapes don't match: Jamuna has no pay(), wants text and replies true or false. Fixing that is the adapter's whole job.",
    'build-ready': 'Done: one new adapter, nothing else edited. Press “Use JamunaWalletAdapter”.',
    'build-done': 'JamunaWalletAdapter is plugged in, and Checkout was not touched. Press Take payment!',
    'j-wire': 'new Checkout(new JamunaWalletAdapter(…)): the very same Checkout class.',
    'j-pay': "JamunaWalletAdapter.pay({{amount}}) receives the call in Checkout's language.",
    'j-translate': 'It translates: debit("{{text}}", "BDT"), the amount as text, the way Jamuna wants it.',
    'j-check': 'Jamuna replies true, and the adapter checks it.',
    'j-receipt': '…then builds a Receipt for Checkout.',
    'j-done': 'Paid with Jamuna Wallet! +{{amount}}. Checkout and the other processors never changed.',
    'level3-done':
      'You finished the game! An adapter lets code with the "wrong" interface fit in, with one small class per SDK and no changes anywhere else.',
  },

  codeComments: {
    target: 'Target: the interface Checkout expects',
    existing: 'bKash already fits, no adapter needed',
    adaptee: "Adaptee: the bank's SDK, which we can't change",
    adapter: 'Adapter: looks like a PaymentProcessor, talks to the SDK',
    translateCall: 'translate the call',
    toPaisa: 'taka → paisa',
    toReceipt: 'translate the reply',
    client: 'Client: only knows PaymentProcessor',
    onlyTarget: 'no bank details here!',
    usage: 'Client code',
    withoutIntro: "Checkout calls the bank's SDK directly",
    withoutShape: "the bank's method name",
    withoutPaisa: "the bank's unit",
    withoutTodo: 'Jamuna Wallet next month? Rewrite checkout() again',
    withAdd: 'New SDK = one new adapter',
    toText: 'number → "780.00"',
    withSame: 'Checkout is used as it is',
  },

  compare: {
    without: {
      title: "Checkout calls the bank's SDK directly",
      points: [
        "Checkout must know the bank's method names, units and reply format.",
        'One unit mix-up (taka vs paisa) charges the wrong amount.',
        'Every new SDK means rewriting and re-testing Checkout.',
        'Switching banks means touching code all over the shop.',
      ],
    },
    with: {
      title: 'An adapter between Checkout and each SDK',
      points: [
        'Checkout only knows PaymentProcessor.pay(amount) in taka.',
        'Each adapter does the translation (names, units, replies) in one place.',
        'A new SDK is one new adapter class; nothing else changes.',
        'Neither Checkout nor the third-party SDK has to be modified.',
      ],
    },
    benefit:
      "Adapter lets two pieces that were never designed for each other work together. Your code keeps its own clean interface, the foreign API stays untouched, and all the translation lives in one small, testable class.",
    whenToUse: [
      'You want to use an existing class (often third-party) whose interface does not match the one your code needs.',
      'You integrate several outside services (payment SDKs, maps, SMS gateways) that each have a different API.',
      'You want to protect your code from changes in an external library: only the adapter has to change.',
    ],
  },
} satisfies PatternContent

export type AdapterContent = typeof en

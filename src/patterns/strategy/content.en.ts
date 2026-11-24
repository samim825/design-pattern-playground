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
    clientRole: 'Client',
    clientTitle: "Rahim's cart",
    tshirt: 'T-shirt',
    mug: 'Mug',
    total: 'Total',
    chooseMethod: 'Pay with',
    contextRole: 'Context',
    contextTitle: 'Checkout',
    unchanged: 'Checkout code unchanged',
    strategyRole: 'Concrete strategies',
    implementsLabel: 'implements PaymentStrategy',
    bkash: 'bKash',
    nagad: 'Nagad',
    card: 'Card',
    procFee: 'Calculate fee',
    procOtp: 'Verify OTP',
    procPin: 'Confirm PIN',
    proc3ds: '3-D Secure check',
    procBank: 'Bank authorization',
    receiptTitle: 'Receipt',
    amount: 'Amount',
    fee: 'Fee',
    paid: 'Paid',
    payButton: 'Pay {{amount}}',
    whatsHappening: "What's happening",
    feeNote: 'Fees are illustrative, not real rates.',
  },

  steps: {
    idle: 'Pick a payment method, then press Pay. Then swap the method and run it again — only the strategy changes, never the Checkout.',
    'set-strategy':
      'The client calls checkout.setStrategy(new {{className}}()). Checkout simply stores the new object in its strategy field — nothing else in Checkout changes.',
    'client-pay': "The client calls checkout.pay({{amount}}). It doesn't know — or care — how the payment will actually happen.",
    delegate:
      "Checkout doesn't process the payment itself. It delegates to whichever strategy it currently holds: strategy.pay(amount).",
    fee: '{{method}} calculates its own fee: {{rate}} of {{amount}} = {{fee}}.',
    otp: "{{method}} sends a one-time password to Rahim's phone and verifies it.",
    pin: 'Rahim confirms the payment with his {{method}} PIN.',
    '3ds': "A 3-D Secure check makes sure it's really Rahim using this card.",
    bank: 'The bank that issued the card authorizes the charge.',
    receipt:
      '{{method}} returns a Receipt. Every strategy returns the same shape, so Checkout can treat them all alike.',
    done: 'Done! Rahim paid {{total}} in total, including a {{fee}} fee. Swap the method and run it again to compare.',
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

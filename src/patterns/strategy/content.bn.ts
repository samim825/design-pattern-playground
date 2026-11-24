import type { DeepPartial } from '@/types/pattern'
import type { StrategyContent } from './content.en'

// Technical terms stay in English (Strategy, interface, class, runtime…).
// Anything missing here falls back to content.en.ts automatically.
export const bn: DeepPartial<StrategyContent> = {
  title: 'Strategy',
  tagline: 'Runtime-এ অ্যালগরিদম অদলবদল করুন — যে কোড সেটা ব্যবহার করে, তাতে একটুও হাত না দিয়ে।',
  intent:
    'একই কাজ করার কয়েকটা আলাদা উপায় (algorithm) থাকলে, প্রত্যেকটাকে একই interface (ইন্টারফেস) মেনে আলাদা class-এ রাখুন। তাহলে context অবজেক্টটা runtime-এ দরকারমতো যেকোনোটা বেছে নিতে পারবে।',

  scenario: {
    title: 'অনলাইন শপের চেকআউট',
    paragraphs: [
      'রহিম ঢাকার একটা অনলাইন শপ থেকে একটা টি-শার্ট আর একটা মগ কিনছে। কার্টে মোট ৳১,২৫০। চেকআউটে সে বিকাশ, নগদ অথবা ব্যাংক কার্ড — যেকোনোটা দিয়ে পেমেন্ট করতে পারে।',
      'প্রতিটা মেথডের কাজের ধরন আলাদা। বিকাশ একটা ফি কাটে, তারপর OTP আর PIN চায়। নগদের ফি কম, শুধু OTP লাগে। কার্ডে আগে 3-D Secure যাচাই হয়, তারপর ব্যাংক পেমেন্টটা অনুমোদন (authorize) করে।',
      'সামনের মাসে বিজনেস টিম রকেট যোগ করতে চায়, তারপর হয়তো ক্যাশ অন ডেলিভারি। কাস্টমার যে মেথডই বেছে নিক, চেকআউটকে ঠিক একইভাবে কাজ করে যেতে হবে।',
    ],
    problem:
      'চেকআউট ফাংশন নিজেই যদি প্রতিটা পেমেন্ট মেথডের খুঁটিনাটি জানে, তাহলে সেটা একটা বিশাল if/else হয়ে দাঁড়ায়। নতুন প্রতিটা মেথড মানেই শপের সবচেয়ে গুরুত্বপূর্ণ ফাংশনটা আবার এডিট করা — আর আবার পুরোটা টেস্ট করা।',
  },

  visual: {
    // Pattern-role and class names stay in English on purpose.
    levelsLabel: 'গেমের লেভেল',
    levelLabel: 'লেভেল {{n}}',
    level1Title: 'একটাই বড় চেকআউট',
    level2Title: 'Strategy প্লাগ ইন করুন',
    level3Title: 'রকেট যোগ করুন',
    level1Goal: 'এখনো কোনো pattern নেই: আপনার checkout()-কেই প্রতিটা পেমেন্ট মেথডের ধাপ জানতে হয়। প্রতিটা কাস্টমারের মেথডের জন্য ঠিক ধাপগুলোতে টিক দিন।',
    level2Goal: 'এবার প্রতিটা মেথড একেকটা strategy। শুধু ঠিক strategy-টা Checkout-এ প্লাগ করুন। সাবধান: কাস্টমার মত বদলাতে পারে!',
    level3Goal: 'কাস্টমাররা রকেটে দিতে চায়। Checkout বা অন্য strategy-তে হাত না দিয়ে রকেট যোগ করুন, তারপর পেমেন্ট নিন।',
    locked: 'লক করা',
    earned: 'বিক্রি',
    restart: 'গেম আবার শুরু',
    customerOf: 'কাস্টমার {{n}}/{{total}}',

    clientRole: 'Client',
    customersTitle: 'কাউন্টারে',
    wantsToPay: 'পেমেন্ট করবে',
    changedMind: 'মত বদলেছে!',
    pickSteps: 'কোন ধাপগুলো চলবে, টিক দিন',
    pickStrategy: 'Checkout-এ একটা strategy প্লাগ করুন',
    noPatternRole: 'Pattern ছাড়া',
    branchesLabel: 'আপনার checkout()-কে যত branch জানতে হয়',
    linesLabel: 'আপনাকে যত লাইন if/else সামলাতে হয়',
    contextRole: 'Context',
    contextTitle: 'Checkout',
    unchanged: 'Checkout-এর কোড একটুও বদলায়নি',
    swapped: 'Runtime-এ বদলানো হয়েছে',
    strategyRole: 'ConcreteStrategy',
    implementsLabel: 'implements PaymentStrategy',
    processingRole: 'পেমেন্টের ধাপ',
    emptySlot: 'খালি',
    noStrategy: 'এখনো কোনো strategy প্লাগ করা হয়নি…',
    buildSlot: 'বানান',
    newTag: 'নতুন',

    procFee: 'ফি হিসাব',
    procOtp: 'OTP যাচাই',
    procPin: 'PIN দিয়ে নিশ্চিত',
    proc3ds: '3-D Secure যাচাই',
    procBank: 'ব্যাংকের অনুমোদন',
    procNotNeeded: '{{method}}-এর ধাপ নয়',

    builderTitle: 'রকেট পেমেন্ট যোগ করুন',
    builderStep1: 'ধাপ ১ · কোডটা কোথায় যাবে?',
    builderStep2: 'ধাপ ২ · আর Checkout-এ?',
    q1: 'রকেটের পেমেন্টের ধাপগুলো কোথায় থাকা উচিত?',
    q1ElseIf: 'Checkout-এ আরেকটা else-if',
    q1NewClass: 'নতুন class RocketPayment',
    q1InBkash: 'BkashPayment-এর ভেতরে',
    q2: 'Checkout-এ কী বদলাবেন?',
    q2Nothing: 'কিছুই না',
    q2AddCase: "একটা 'rocket' case যোগ",
    q2NewMethod: 'payRocket() যোগ',
    openStrategy: 'RocketPayment ব্যবহার করুন',
    zeroEdits: 'Checkout আর পুরনো strategy এডিট: ০ লাইন',

    payButton: 'পেমেন্ট নিন',
    nextCustomer: 'পরের কাস্টমার',
    finishLevel: 'লেভেল শেষ করুন',
    tryAgain: 'আবার চেষ্টা করুন',
    paid: 'পরিশোধিত',
    declined: 'বাতিল',
    receiptTitle: 'রসিদ',
    amount: 'পরিমাণ',
    fee: 'ফি',
    total: 'মোট',

    levelDone: 'লেভেল {{n}} শেষ!',
    nextLevel: 'পরের লেভেল',
    replayLevel: 'এই লেভেল আবার খেলুন',
    playAgain: 'লেভেল ১ থেকে আবার খেলুন',
    l1Teaser:
      'তারপর বিজনেস টিম বলল: “সামনের মাসে রকেট যোগ করো, তারপর উপায়।” প্রতিটা মানেই এই checkout() আবার এডিট করা, আর প্রতিটা branch আবার টেস্ট করা। নিশ্চয়ই এর চেয়ে ভালো উপায় আছে…',
    l2Summary:
      'আপনি Checkout-এর কোডে একবারও হাত দেননি। শুধু strategy প্লাগ করেছেন, আর রহিম মত বদলালে runtime-এ একটা বদলেও দিয়েছেন।',
    recapTitle: 'যা শিখলেন',
    recap1: 'Pattern ছাড়া একটাই checkout()-কে প্রতিটা পেমেন্ট মেথডের ধাপ জানতে হয়, আর নতুন প্রতিটা মেথডের সাথে সেটা বড় হতে থাকে।',
    recap2: 'Strategy-তে প্রতিটা মেথড থাকে PaymentStrategy-এর পেছনে নিজের class-এ, আর Checkout শুধু কাজটা delegate করে।',
    recap3: 'মেথড বদলানো বা যোগ করায় Checkout কখনো এডিট হয় না: runtime-এ setStrategy(), আর রকেটের জন্য একটা নতুন class।',

    rahim: 'রহিম',
    nusrat: 'নুসরাত',
    karim: 'করিম',
    mitu: 'মিতু',
    bkash: 'বিকাশ',
    nagad: 'নগদ',
    card: 'কার্ড',
    rocket: 'রকেট',

    whatsHappening: 'এখন কী ঘটছে',
    feeNote: 'ফি-গুলো শুধু উদাহরণের জন্য, আসল রেট নয়।',
  },

  steps: {
    tutorial:
      'রহিম বিকাশ দিয়ে {{amount}} দিচ্ছে। এবারের মতো বিকাশের ধাপগুলো আমরাই টিক দিয়ে রেখেছি: OTP আর PIN। “পেমেন্ট নিন” চাপুন, আর দেখুন আপনার checkout() কীভাবে চলে।',
    idle1: '{{name}} {{method}} দিয়ে {{amount}} দিচ্ছে। {{method}}-এর জন্য আপনার checkout()-কে কোন ধাপগুলো চালাতে হবে, টিক দিয়ে পেমেন্ট নিন।',
    picked1: '{{method}}-এর ধাপে টিক দেওয়া হয়েছে। ঠিক হলো কিনা দেখতে “পেমেন্ট নিন” চাপুন।',
    'l1-start': "checkout({{amount}}, '{{methodId}}') কল হলো। Pattern ছাড়া এই একটা ফাংশনকেই সব মেথড সামলাতে হয়।",
    'l1-branch': 'সে নিজের if/else-এ {{method}}-এর branch খুঁজছে। সব মেথডের খুঁটিনাটি এখানেই থাকে।',
    'l1-step': '{{method}}-এর জন্য “{{step}}” চলছে…',
    'l1-wrong': '“{{step}}” {{method}}-এর ধাপ নয়, তবুও checkout সেটা চালাচ্ছে…',
    'l1-ok': 'পরিশোধ হয়েছে! +{{amount}}। এবার ঠিক হয়েছে, কিন্তু আপনার checkout()-কে {{method}}-এর সব খুঁটিনাটি জানতে হয়েছে।',
    'fail-missing': 'বাতিল! {{method}}-এর আরও লাগবে: {{missing}}। কমন if/else-এ একটা ধাপ ভুললেই পেমেন্ট ব্যর্থ।',
    'fail-extra': 'ভুল! {{method}} পেমেন্টে {{extra}} বলে কোনো ধাপ নেই। কাস্টমার বিভ্রান্ত হয়ে চলে গেল।',
    'level1-done': 'লেভেল শেষ! কোডের হাইলাইট করা লাইনটা দেখুন: প্রতিটা নতুন পেমেন্ট মেথডের জন্য এই checkout() আবার এডিট করতে হবে।',

    idle2: '{{name}} {{method}} দিয়ে {{amount}} দিচ্ছে। Checkout-এ ওই strategy প্লাগ করে পেমেন্ট নিন।',
    'wrong-strategy': '{{name}} দিতে চায় {{method}} দিয়ে, {{picked}} দিয়ে নয়। ঠিক strategy-টা প্লাগ করুন।',
    'change-mind': 'দাঁড়ান! {{name}} মত বদলেছে: “{{method}} দিয়ে দিতে পারি?” Strategy বদলে দিন। Checkout নিজে যেমন আছে তেমনই থাকবে।',
    'set-strategy':
      'Client কল করছে checkout.setStrategy(new {{className}}())। Checkout শুধু নতুন অবজেক্টটা নিজের strategy ফিল্ডে রেখে দেয়। Checkout-এর আর কিছুই বদলায় না।',
    swapped: 'setStrategy(new {{className}}()) দিয়ে runtime-এ বদলানো হলো। Checkout-এর কোড একটুও বদলায়নি। “পেমেন্ট নিন” চাপুন।',
    'client-pay': 'Client কল করছে checkout.pay({{amount}})। পেমেন্টটা আসলে কীভাবে হবে, সেটা সে জানেও না, জানার দরকারও নেই।',
    delegate:
      'Checkout নিজে পেমেন্ট প্রসেস করে না। এই মুহূর্তে যে strategy তার হাতে আছে, কাজটা তাকেই বুঝিয়ে দেয় (delegate করে): strategy.pay(amount)।',
    fee: '{{method}} নিজের নিয়মে ফি হিসাব করছে: {{amount}}-এর {{rate}} = {{fee}}।',
    otp: '{{method}} {{name}}-এর ফোনে একটা OTP পাঠিয়ে সেটা যাচাই করছে।',
    pin: '{{name}} {{method}} PIN দিয়ে পেমেন্টটা নিশ্চিত করছে।',
    '3ds': 'কার্ডটা সত্যিই {{name}} ব্যবহার করছে কিনা, 3-D Secure যাচাই দিয়ে সেটা নিশ্চিত করা হচ্ছে।',
    bank: 'যে ব্যাংক কার্ডটা দিয়েছে, তারা পেমেন্টটা অনুমোদন (authorize) করছে।',
    receipt: '{{method}} একটা Receipt ফেরত দিচ্ছে। সব strategy একই ধাঁচের Receipt দেয়, তাই Checkout সবাইকে একইভাবে সামলায়।',
    done: 'পরিশোধ হয়েছে! +{{amount}} (ফি {{fee}})। একই Checkout.pay() চলেছে; শুধু strategy-টা ছিল আলাদা।',
    'level2-done': 'লেভেল শেষ! Checkout কখনো বদলায়নি। আপনি শুধু strategy প্লাগ করেছেন, আর runtime-এ একটা বদলে দিয়েছেন।',

    'need-build': 'রকেট সামলানোর মতো কোনো strategy এখনো নেই। RocketPayment যোগ করতে “বানান”-এ ট্যাপ করুন।',
    'build-q1': 'প্রথমে: রকেটের ফি আর OTP-র ধাপগুলো কোথায় যাবে?',
    'wrong-elseif': 'এটা তো পুরনো পদ্ধতি: Checkout.pay()-তে আরেকটা branch বাড়বে, আর সব মেথড আবার টেস্ট করতে হবে।',
    'wrong-in-bkash': 'রকেট তো বিকাশ না। দুটো মেশালে রকেটের একটা বদলেই বিকাশের পেমেন্ট ভেঙে যেতে পারে।',
    'build-q2': 'RocketPayment, PaymentStrategy implement করে। এবার: Checkout-এ কী বদলাতে হবে?',
    'wrong-add-case': 'কোনো case লাগবে না: Checkout শুধু PaymentStrategy interface চেনে, তাই যেকোনো নতুন strategy-র সাথে সে আগে থেকেই কাজ করে।',
    'wrong-new-method': 'Checkout.pay() আগে থেকেই হাতের strategy-কে কাজ দেয়। নতুন method শুধু একই জিনিস দুবার লিখবে।',
    'build-ready': 'হয়ে গেছে: একটা নতুন class, আর কিছুই এডিট হয়নি। “RocketPayment ব্যবহার করুন” চাপুন।',
    'build-done': 'setStrategy(new RocketPayment()) দিয়ে RocketPayment প্লাগ করা হলো। Checkout আর পুরনো strategy-গুলো অক্ষত। পেমেন্ট নিন!',
    'rocket-pay': 'Client আগের মতোই checkout.pay({{amount}}) কল করছে।',
    'rocket-delegate': 'Checkout হাতের strategy-কে কাজ দিচ্ছে, যেটা এখন একটা RocketPayment। Checkout রকেটের নামও জানে না।',
    'rocket-fee': 'RocketPayment নিজের নিয়মে ফি হিসাব করছে: {{amount}}-এর {{rate}} = {{fee}}।',
    'rocket-otp': 'RocketPayment {{name}}-এর ফোনে একটা OTP পাঠিয়ে যাচাই করছে।',
    'rocket-receipt': 'RocketPayment অন্য সব strategy-র মতো একই ধরনের Receipt ফেরত দিচ্ছে।',
    'rocket-done': 'রকেটে পরিশোধ হয়েছে! +{{amount}}। Checkout আর অন্য strategy-গুলো একটুও বদলায়নি।',
    'level3-done': 'গেম শেষ! Strategy একই কাজের প্রতিটা উপায়কে আলাদা class-এ রাখে, তাই যে কোড সেটা ব্যবহার করে তাতে হাত না দিয়েই উপায় বদলানো বা যোগ করা যায়।',
  },

  codeComments: {
    interface: 'প্রতিটা পেমেন্ট মেথডকে এই নিয়ম (contract) মানতেই হবে',
    bkashFee: 'বিকাশের ফি: 1.85%',
    nagadFee: 'নগদের ফি: 1%',
    cardFee: 'কার্ডের ফি: 2.5%',
    context: 'Context: একটা strategy ধরে রাখে, কিন্তু কোনটা — তা জানে না',
    swap: 'Runtime-এ অ্যালগরিদম বদলানো',
    delegate: 'আসল কাজটা বর্তমান strategy-কে বুঝিয়ে দেওয়া',
    usage: 'Client কোড',
    withoutIntro: 'Checkout-কে সব পেমেন্ট মেথডের খুঁটিনাটি জানতে হচ্ছে',
    withoutTodo: 'রকেট যোগ করবেন? আবার এই ফাংশন এডিট করুন… আর প্রতিটা branch আবার টেস্ট করুন',
    withAdd: 'রকেট যোগ করা মানে শুধু একটা নতুন class। Checkout যেমন ছিল তেমনই থাকে।',
    withSwap: 'শুধু প্লাগ ইন করে দিন',
  },

  compare: {
    without: {
      title: 'লম্বা if/else সহ একটাই checkout ফাংশন',
      points: [
        'Checkout-কে প্রতিটা পেমেন্ট মেথডের খুঁটিনাটি জানতে হয়।',
        'কোনো মেথড যোগ বা বদল করতে হলে এই ফাংশনটাই এডিট করতে হয় — আর প্রতিটা branch আবার টেস্ট করতে হয়।',
        'একটা পেমেন্ট মেথডকে আলাদা করে unit test করা কঠিন।',
        'if/else শুধু লম্বাই হতে থাকে: বিকাশ, নগদ, কার্ড, রকেট, উপায়…',
      ],
    },
    with: {
      title: 'প্রতিটা মেথড আলাদা strategy class',
      points: [
        'Checkout শুধু PaymentStrategy interface-টা চেনে।',
        'প্রতিটা পেমেন্ট মেথড থাকে নিজের ছোট, গোছানো class-এ।',
        'রকেট যোগ করতে শুধু একটা নতুন class লিখলেই হয় — পুরনো কোডে হাত দিতে হয় না।',
        'setStrategy() দিয়ে runtime-এ মেথড বদলানো যায়, আর প্রতিটা strategy আলাদাভাবে টেস্ট করা যায়।',
      ],
    },
    benefit:
      'এটাই হাতে-কলমে Open/Closed Principle: checkout নতুন কিছু যোগ করার জন্য খোলা (open for extension), কিন্তু বদলানোর জন্য বন্ধ (closed for modification)। যে অংশটা বারবার বদলায়, সেটাকে আলাদা class-এ সরিয়ে রাখা হয়েছে — তাই যে অংশটা স্থির, অর্থাৎ Checkout, তাকে আর কখনো বদলাতে হয় না।',
    whenToUse: [
      'একই কাজ করার কয়েকটা উপায় আছে (পেমেন্ট, ডেলিভারি চার্জ, sorting, compression…)।',
      'কোডে এমন একটা if/else বা switch আছে যেটা আচরণ বেছে নেয়, আর দিন দিন লম্বা হচ্ছে।',
      'Runtime-এ আচরণ বেছে নিতে বা বদলাতে চান — যেমন ইউজারের পছন্দ বা config অনুযায়ী।',
    ],
  },
}

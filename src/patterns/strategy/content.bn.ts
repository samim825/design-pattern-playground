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
    clientRole: 'Client',
    clientTitle: 'রহিমের কার্ট',
    tshirt: 'টি-শার্ট',
    mug: 'মগ',
    total: 'মোট',
    chooseMethod: 'পেমেন্ট মেথড',
    contextRole: 'Context',
    contextTitle: 'Checkout',
    unchanged: 'Checkout-এর কোড একটুও বদলায়নি',
    strategyRole: 'Concrete strategy-গুলো',
    implementsLabel: 'implements PaymentStrategy',
    bkash: 'বিকাশ',
    nagad: 'নগদ',
    card: 'কার্ড',
    procFee: 'ফি হিসাব',
    procOtp: 'OTP যাচাই',
    procPin: 'PIN দিয়ে নিশ্চিত',
    proc3ds: '3-D Secure যাচাই',
    procBank: 'ব্যাংকের অনুমোদন',
    receiptTitle: 'রসিদ',
    amount: 'পরিমাণ',
    fee: 'ফি',
    paid: 'পরিশোধিত',
    payButton: '{{amount}} পে করুন',
    whatsHappening: 'এখন কী ঘটছে',
    feeNote: 'ফি-গুলো শুধু উদাহরণের জন্য, আসল রেট নয়।',
  },

  steps: {
    idle: 'একটা পেমেন্ট মেথড বেছে নিয়ে “পে করুন” চাপুন। তারপর মেথড বদলে আবার চালিয়ে দেখুন — বদলাবে শুধু strategy, Checkout কখনোই না।',
    'set-strategy':
      'Client কল করছে checkout.setStrategy(new {{className}}())। Checkout শুধু নতুন অবজেক্টটা নিজের strategy ফিল্ডে রেখে দেয় — Checkout-এর আর কিছুই বদলায় না।',
    'client-pay': 'Client কল করছে checkout.pay({{amount}})। পেমেন্টটা আসলে কীভাবে হবে, সেটা সে জানেও না, জানার দরকারও নেই।',
    delegate:
      'Checkout নিজে পেমেন্ট প্রসেস করে না। এই মুহূর্তে যে strategy তার হাতে আছে, কাজটা তাকেই বুঝিয়ে দেয় (delegate করে): strategy.pay(amount)।',
    fee: '{{method}} নিজের নিয়মে ফি হিসাব করছে: {{amount}}-এর {{rate}} = {{fee}}।',
    otp: '{{method}} রহিমের ফোনে একটা OTP পাঠিয়ে সেটা যাচাই করছে।',
    pin: 'রহিম তার {{method}} PIN দিয়ে পেমেন্টটা নিশ্চিত করছে।',
    '3ds': 'কার্ডটা সত্যিই রহিম ব্যবহার করছে কিনা, 3-D Secure যাচাই দিয়ে সেটা নিশ্চিত করা হচ্ছে।',
    bank: 'যে ব্যাংক কার্ডটা দিয়েছে, তারা পেমেন্টটা অনুমোদন (authorize) করছে।',
    receipt:
      '{{method}} একটা Receipt ফেরত দিচ্ছে। সব strategy একই ধাঁচের Receipt দেয়, তাই Checkout সবাইকে একইভাবে সামলাতে পারে।',
    done: 'হয়ে গেছে! {{fee}} ফি সহ রহিম মোট {{total}} পরিশোধ করেছে। এবার মেথড বদলে আবার চালিয়ে তুলনা করুন।',
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

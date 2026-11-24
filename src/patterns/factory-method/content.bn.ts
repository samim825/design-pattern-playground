import type { DeepPartial } from '@/types/pattern'
import type { FactoryMethodContent } from './content.en'

// Technical terms stay in English (Factory Method, class, interface, override…).
// Anything missing here falls back to content.en.ts automatically.
export const bn: DeepPartial<FactoryMethodContent> = {
  title: 'Factory Method',
  tagline: 'কোন object তৈরি হবে, সেটা subclass ঠিক করুক। আর মূল কাজের ধাপগুলো সবার জন্য একই থাকুক।',
  intent:
    'Base class-এ object তৈরির জন্য একটা method রাখুন, আর প্রতিটা subclass সেটা override করে ঠিক করুক কোন concrete class-এর object বানানো হবে। Base class শুধু কমন interface-টা চেনে।',

  scenario: {
    title: 'তিন শাখার একটা কুরিয়ার কোম্পানি',
    paragraphs: [
      'মিতু তার ফেসবুক পেজে শাড়ি বিক্রি করে, আর সব অর্ডার পাঠায় সাথী কুরিয়ারে। পার্সেল বুকিংয়ের নিয়ম সবসময় একই: শাখা একটা গাড়ি ঠিক করে, ট্র্যাকিং নম্বর লেখে, পার্সেল পাঠায়, তারপর মিতুকে ফি আর ডেলিভারির সময় জানায়।',
      'গাড়িটা কী হবে, সেটা শাখার ওপর নির্ভর করে। ঢাকায় সরু গলি পেরিয়ে মিরপুরে যায় রিকশা-ভ্যান, খরচ ৳৬০। চট্টগ্রাম আগ্রাবাদে পাঠায় ট্রাকে, ৳১৫০। বরিশাল পার্সেল তুলে দেয় ভোলার লঞ্চে, ৳১২০।',
      'সামনের বছর সাথী কুরিয়ার সিলেটে একটা শাখা খুলতে চায়, যেটা চা-বাগানে ড্রোনে ডেলিভারি দেবে। বুকিংয়ের ধাপগুলো হুবহু একই থাকতে হবে। বদলাবে শুধু গাড়িটা।',
    ],
    problem:
      'বুকিংয়ের কোড যদি নিজেই "new RickshawVan()" বা "new Truck()" লেখে, তাহলে কোন শহর সেটা দেখে if/else দিয়ে বাছতে হয়। নতুন প্রতিটা শাখা মানেই সবার ব্যবহার করা বুকিং কোড আবার এডিট করা, আর প্রতিটা শহর আবার টেস্ট করা।',
  },

  visual: {
    // Pattern-role and class names stay in English on purpose.
    levelsLabel: 'গেমের লেভেল',
    levelLabel: 'লেভেল {{n}}',
    level1Title: 'সব নিজেই করুন',
    level2Title: 'শাখাই ঠিক করুক',
    level3Title: 'নতুন শাখা খুলুন',
    level1Goal: 'আপনি dispatcher, আর এখনো কোনো pattern নেই। প্রতিটা অর্ডারের জন্য গাড়ি আপনাকেই বাছতে হবে।',
    level2Goal: 'এবার Factory Method চালু। পার্সেলটা শুধু ঠিক শাখার হাতে দিন: গাড়ি বাছবে সেই শাখার createTransport()।',
    level3Goal: 'সাথী কুরিয়ার সিলেটে শাখা খুলছে। পুরনো কোনো কোড এডিট না করে নতুন শাখা বানান, তারপর ডেলিভারি দিন।',
    locked: 'লক করা',
    earned: 'আয়',
    restart: 'গেম আবার শুরু',
    orderOf: 'অর্ডার {{n}}/{{total}}',

    clientRole: 'Client',
    ordersTitle: 'নতুন অর্ডার',
    pickVehicle: 'গাড়ি বাছুন',
    pickBranch: 'কোন শাখার হাতে দেবেন',
    dispatcherRole: 'Pattern ছাড়া',
    casesLabel: 'আপনার dispatcher-কে যত case জানতে হয়',
    linesLabel: 'আপনাকে যত লাইন if/else সামলাতে হয়',
    creatorRole: 'ConcreteCreator',
    creatorTag: 'Creator',
    extendsLabel: 'extends',
    overrideLabel: 'createTransport(): এখানে override করা',
    stepCreate: 'গাড়ি নেওয়া',
    stepBook: 'ট্র্যাকিং নম্বর',
    stepDeliver: 'পাঠানো',
    transportSlot: 'transport',
    notCreated: 'এখনো তৈরি হয়নি',
    productRole: 'ConcreteProduct',
    productTag: 'Product',
    implementsLabel: 'implements',
    waiting: 'এখনো কোনো গাড়ি নেই…',
    buildSlot: 'বানান',
    newTag: 'নতুন',

    builderTitle: 'সিলেট শাখা বানান',
    builderStep1: 'ধাপ ১ · নতুন product',
    builderStep2: 'ধাপ ২ · নতুন creator',
    q1: 'পাহাড়ি চা-বাগানে কোন Transport পৌঁছাতে পারবে?',
    q2: 'SylhetBranch কোন method override করবে?',
    openBranch: 'শাখা চালু করুন',
    zeroEdits: 'পুরনো কোড এডিট: ০ লাইন',

    dispatchButton: 'পাঠান',
    nextOrder: 'পরের অর্ডার',
    finishLevel: 'লেভেল শেষ করুন',
    tryAgain: 'আবার চেষ্টা করুন',
    delivered: 'ডেলিভারড',
    failed: 'ব্যর্থ',

    levelDone: 'লেভেল {{n}} শেষ!',
    nextLevel: 'পরের লেভেল',
    replayLevel: 'এই লেভেল আবার খেলুন',
    playAgain: 'লেভেল ১ থেকে আবার খেলুন',
    l1Teaser:
      'তারপর নতুন অর্ডার এলো: 🍵 চা → শ্রীমঙ্গল (সিলেট)। আপনার sendParcel()-এ সিলেটের কোনো case নেই। তাই সবার ব্যবহার করা ফাংশনটা আবার এডিট করতে হবে, আর প্রতিটা শহর আবার টেস্ট করতে হবে। নিশ্চয়ই এর চেয়ে ভালো উপায় আছে…',
    l2Summary:
      'এই লেভেলে আপনার dispatcher একবারও গাড়ি বাছেনি। সে শুধু branch.sendParcel(parcel) কল করেছে, আর প্রতিটা শাখা নিজের গাড়ি নিজে বানিয়েছে।',
    recapTitle: 'যা শিখলেন',
    recap1: 'Pattern ছাড়া একটা কমন ফাংশনকেই সব গাড়ির কথা জানতে হয়, আর সব গাড়ি বানাতে হয়।',
    recap2: 'Factory Method-এ কমন sendParcel() কল করে createTransport(), আর প্রতিটা শাখা সেটা override করে।',
    recap3: 'নতুন শাখা মানে শুধু নতুন class। পুরনো কোডে হাতই দিতে হয় না: এটাই Open/Closed Principle।',

    dhaka: 'ঢাকা',
    chattogram: 'চট্টগ্রাম',
    barishal: 'বরিশাল',
    sylhet: 'সিলেট',
    mirpur: 'মিরপুর',
    agrabad: 'আগ্রাবাদ',
    bhola: 'ভোলা',
    srimangal: 'শ্রীমঙ্গল',
    van: 'রিকশা-ভ্যান',
    truck: 'ট্রাক',
    launch: 'লঞ্চ',
    drone: 'ড্রোন',
    saree: 'শাড়ি',
    hilsa: 'ইলিশ মাছ',
    laptop: 'ল্যাপটপ',
    mango: 'আম',
    books: 'বই',
    tea: 'চা-পাতা',
    etaDhaka: 'আজই',
    etaChattogram: 'আগামীকাল',
    etaBarishal: 'রাতারাতি',
    etaSylhet: '২ ঘণ্টায়',

    whatsHappening: 'এখন কী ঘটছে',
    feeNote: 'সাথী কুরিয়ার আর এর ফি-গুলো শুধু উদাহরণের জন্য বানানো।',
  },

  steps: {
    tutorial:
      'প্রথম অর্ডার যাবে ঢাকার মিরপুরে। এবারের মতো রিকশা-ভ্যানটা আমরাই বেছে দিয়েছি। “পাঠান” চাপুন, আর দেখুন আপনার কোড কীভাবে চলে।',
    idle1: '{{dest}}-এর একটা পার্সেল। কোন গাড়ি মানাবে বলে মনে হয়, সেটা বেছে “পাঠান” চাপুন।',
    picked1: '{{dest}}-এর জন্য আপনি {{vehicle}} বেছেছেন। কাজ করে কিনা দেখতে “পাঠান” চাপুন।',
    'l1-start': 'আপনার sendParcel() পার্সেল আর শহরের নাম পাচ্ছে। Pattern ছাড়া এই একটা কমন ফাংশনকেই সব কাজ করতে হয়।',
    'l1-switch': 'শহরটা তাকে নিজেই দেখতে হচ্ছে, তাই সাথী কুরিয়ারের প্রতিটা শহরের জন্য একটা করে case লাগে।',
    'l1-new':
      'আপনি {{vehicle}} বেছেছেন: new {{productClass}}() তৈরি হচ্ছে সরাসরি কমন ফাংশনের ভেতরে। ফলে এই ফাংশন এখন প্রতিটা গাড়ির class-এর ওপর নির্ভরশীল।',
    'l1-deliver': '{{vehicle}} রওনা দিল {{dest}}-এর দিকে…',
    'l1-ok': 'ডেলিভারি হয়েছে! +{{fee}}। এবার ঠিক হয়েছে, কিন্তু আপনার dispatcher-কে প্রতিটা শহর আর প্রতিটা গাড়ি চিনে রাখতে হচ্ছে।',
    'fail-lanes': 'আটকে গেছে! 🚧 ঢাকার সরু গলিতে শুধু রিকশা-ভ্যানই ঢোকে। কমন if/else-এ একটা ভুল case মানেই ডেলিভারি নষ্ট।',
    'fail-highway': 'দেরি হয়ে গেল! ⏰ আগ্রাবাদ লম্বা হাইওয়ের পথ, সময়মতো পৌঁছায় শুধু ট্রাক।',
    'fail-river': 'ঝপাৎ! 🌊 ভোলা নদীর ওপারে। সেখানে যেতে পারে শুধু লঞ্চ।',
    'level1-done': 'লেভেল শেষ! কোডের হাইলাইট করা লাইনটা দেখুন: প্রতিটা নতুন শহরের জন্য এই কমন ফাংশন আবার এডিট করতে হবে।',

    idle2: '{{dest}}-এর একটা পার্সেল। যে শাখা ওখানে ডেলিভারি দেয়, সেটায় ট্যাপ করে “পাঠান” চাপুন। গাড়ি এখন আর আপনি বাছছেন না।',
    'wrong-branch': '{{branch}} শাখা শুধু নিজের শহরের ভেতরে ডেলিভারি দেয়। {{dest}}-এ কোন শাখা যায়?',
    ready: '{{branchClass}} তৈরি। “পাঠান” চাপুন, আর দেখুন Factory Method কীভাবে চলে।',
    'client-send': 'Client কল করছে branch.sendParcel()। পার্সেলটা কোন গাড়িতে যাবে, সে জানে না। জানার দরকারও নেই।',
    'call-factory':
      'sendParcel() একবারই লেখা হয়েছে, CourierBranch-এ। তার একটা গাড়ি লাগবে, কিন্তু সে "new Truck()" লেখে না। বরং নিজের factory method কল করে: this.createTransport()।',
    create:
      '{{branchClass}} createTransport() override করে একটা নতুন {{productClass}} ফেরত দিচ্ছে। Concrete গাড়ির class কোনটা, সেটা শুধু এই এক লাইনই জানে।',
    book: 'আবার কমন কোডে ফেরা: শাখা ট্র্যাকিং নম্বর {{tracking}} লিখছে। এই ধাপটা সব শাখার জন্য হুবহু এক।',
    deliver:
      'sendParcel() কল করছে transport.deliver()। সে শুধু Transport interface-এর সাথে কথা বলে, তাই ভ্যান, ট্রাক বা লঞ্চ, সবার সাথে একইভাবে কাজ করে।',
    drive: 'এবার {{productClass}}.deliver() নিজের মতো করে কাজ করছে: {{how}}',
    howDhaka: 'রিকশা-ভ্যান সরু গলি পেরিয়ে মিরপুরে যাচ্ছে।',
    howChattogram: 'ট্রাক হাইওয়ে ধরে আগ্রাবাদে যাচ্ছে।',
    howBarishal: 'লঞ্চ নদী বেয়ে ভোলায় যাচ্ছে।',
    done: 'ডেলিভারি হয়েছে! +{{fee}}, পৌঁছাবে {{eta}}। একই sendParcel() চলেছে; শুধু গাড়িটা এসেছে শাখা থেকে।',
    'level2-done': 'লেভেল শেষ! আপনি শুধু শাখা বেছেছেন। গাড়ি বানিয়েছে প্রতিটা শাখার createTransport()।',

    'need-build': 'এখনকার কোনো শাখা শ্রীমঙ্গলে যায় না। সিলেট শাখা খুলতে “বানান”-এ ট্যাপ করুন।',
    'build-product': 'আগে product: সিলেটের জন্য নতুন ধরনের Transport লাগবে। চা-বাগানে কোনটা পৌঁছাতে পারবে?',
    'build-product-wrong': '{{vehicle}} পাহাড়ি চা-বাগানে পৌঁছাতে পারবে না। পুরনো class বদলানোর বদলে একদম নতুন একটা Transport class যোগ করুন।',
    'build-creator': 'এবার creator: SylhetBranch, CourierBranch-কে extend করে। তাকে কোন একটা method override করতে হবে?',
    'wrong-sendParcel': 'sendParcel() হলো কমন কাজের ধাপ, যেটা প্রতিটা শাখা inherit করে। ওটায় হাত দেবেন না: পুরো ব্যাপারটাই তো এটা।',
    'wrong-deliver': 'deliver() হলো Transport-এর (product-এর) কাজ, আর Drone-এ সেটা আগেই আছে। শাখা শুধু ঠিক করে কী তৈরি হবে।',
    'build-ready': 'দুটো class-ই লেখা হয়ে গেছে। খেয়াল করুন, পুরনো কোনো class-এ হাত পড়েনি। “শাখা চালু করুন” চাপুন।',
    'build-done': 'SylhetBranch চালু! আপনি দুটো নতুন class যোগ করেছেন, আর পুরনো কোড এডিট করেছেন ০ লাইন। এবার “পাঠান” চাপুন।',
    'sylhet-send': 'Client নতুন SylhetBranch-এ sendParcel() কল করছে। এটা সেই একই inherit করা method, যেটা সব শাখা ব্যবহার করে।',
    'sylhet-create': 'SylhetBranch.createTransport() একটা নতুন Drone ফেরত দিচ্ছে। সিলেটের জন্য আলাদা সিদ্ধান্ত শুধু এটুকুই।',
    'sylhet-book': 'Inherit করা sendParcel() ট্র্যাকিং নম্বর {{tracking}} লিখছে, ঠিক অন্য সব শাখার মতোই।',
    'sylhet-deliver': 'Drone.deliver() পাহাড় পেরিয়ে শ্রীমঙ্গলে উড়ে যাচ্ছে 🚁',
    'sylhet-done': 'ডেলিভারি হয়েছে! +{{fee}}, পৌঁছাবে {{eta}}। পুরনো শাখাগুলো আর sendParcel() একটুও বদলায়নি।',
    'level3-done': 'গেম শেষ! Factory Method কাজের ধাপগুলো creator-এ রাখে, আর কোন object তৈরি হবে সেটা subclass-কে ঠিক করতে দেয়।',
  },

  codeComments: {
    product: 'Product: প্রতিটা গাড়িকে এটুকু দিতেই হবে',
    creator: 'Creator: সবার জন্য কমন বুকিংয়ের ধাপ',
    factoryMethod: 'Factory method: কী তৈরি হবে, subclass ঠিক করে',
    shared: 'একবার লেখা, সব শাখা inherit করে',
    noNew: 'এখানে কোনো "new" নেই!',
    noConcrete: 'এখানে কোনো concrete class-এর নাম নেই!',
    concreteCreators: 'Concrete creator: প্রতিটা শাখা নিজের গাড়ি বেছে নেয়',
    usage: 'Client কোড',
    withoutIntro: 'বুকিং কোডকেই প্রতিটা শহরের গাড়ি বাছতে হচ্ছে',
    withoutTodo: 'ড্রোন নিয়ে সিলেট? আবার এই কমন ফাংশন এডিট করুন, আর সব শহর আবার টেস্ট করুন',
    withAdd: 'নতুন শাখা = একটা নতুন product + একটা নতুন creator। আর কিছু এডিট করতে হয় না।',
    withSame: 'sendParcel() যেমন ছিল তেমনই কাজে লাগছে',
  },

  compare: {
    without: {
      title: 'একটাই বুকিং ফাংশন, যে সব গাড়ি নিজে বানায়',
      points: [
        'বুকিং কোড প্রতিটা concrete গাড়ির class-এর ওপর নির্ভর করে।',
        'শহর দেখে if/else ঠিক করে কী বানানো হবে, আর প্রতিটা শাখার সাথে সেটা লম্বা হয়।',
        'সিলেট যোগ করা মানে সব শাখার ব্যবহার করা কমন কোড এডিট করা।',
        'বাকিগুলো না চালিয়ে একটা শাখাকে আলাদা করে টেস্ট করা কঠিন।',
      ],
    },
    with: {
      title: 'প্রতিটা শাখা createTransport() override করে',
      points: [
        'sendParcel() একবারই লেখা, আর সে শুধু Transport interface-টা চেনে।',
        'প্রতিটা শাখা এক লাইনের factory method-এ নিজের গাড়ি ঠিক করে।',
        'সিলেট যোগ করতে দুটো নতুন class লাগে, পুরনো কোনো class এডিট করতে হয় না।',
        'প্রতিটা শাখা আর গাড়ি আলাদা করে টেস্ট করা যায়।',
      ],
    },
    benefit:
      'Object তৈরির অংশটাই বদলায়, তাই সেটাকে একটা override-যোগ্য method-এ সরিয়ে রাখা হয়েছে। কমন কাজের ধাপগুলো বদলানোর জন্য বন্ধ (closed for modification), আর সেগুলো শুধু একটা interface-এর ওপর নির্ভর করে। নতুন subclass এসে নতুন product যোগ করে (open for extension)। এখানে Open/Closed Principle আর Dependency Inversion Principle একসাথে কাজ করছে।',
    whenToUse: [
      'Base class-এর কাজের ধাপ ঠিক করা, কিন্তু ভেতরের একটা object subclass অনুযায়ী আলাদা হওয়া দরকার।',
      'কমন কোডে if/else বা switch দিয়ে বেছে "new SomeClass()" লেখা হচ্ছে।',
      'পরে নতুন ধরন আসবে বলে মনে হচ্ছে (নতুন শাখা, ফাইল ফরম্যাট, ডেটাবেস বা UI theme), আর সেগুলো পুরনো কোডে হাত না দিয়ে যোগ করতে চান।',
    ],
  },
}

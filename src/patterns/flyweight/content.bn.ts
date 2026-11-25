import type { DeepPartial } from '@/types/pattern'
import type { FlyweightContent } from './content.en'

// Technical terms stay in English (Flyweight, Factory, cache, object, intrinsic/extrinsic…).
// Never glue a Bangla suffix onto a name/place {{placeholder}} ("{{name}}-এর" reads wrong); rephrase instead.
// Number placeholders may take টা ("{{n}}টা") because they always render as digits.
// Anything missing here falls back to content.en.ts automatically.
export const bn: DeepPartial<FlyweightContent> = {
  title: 'Flyweight',
  tagline: 'এক ফোনের স্ক্রিনে দশ হাজার রিকশা, অথচ রিকশার ছবির কপি মাত্র একটা।',
  intent:
    'অনেকগুলো object-এর ভারী আর হুবহু একই অংশটা প্রতিটায় কপি না করে সবাই মিলে share করুন। একটা factory প্রতিটা টাইপের জন্য একটাই shared flyweight দেয় (intrinsic state), আর প্রতিটা object রাখে শুধু নিজের আলাদা তথ্য (extrinsic state), যেমন নিজের অবস্থান।',

  scenario: {
    title: 'নুসরাতের ঢাকা রিকশা ম্যাপ',
    paragraphs: [
      'মহাখালীর একটা ছোট স্টার্টআপে নুসরাত বানাচ্ছেন “ঢাকা রিকশা ম্যাপ” অ্যাপ। যাত্রীরা অ্যাপ খুলে আশেপাশের রিকশা দেখেন, তারপর একটা বুক করেন; ম্যাপে দেখানো প্রতিটা রিকশা থেকে অ্যাপের আয় হয় মোটামুটি ৳২ বুকিং ফি।',
      'ম্যাপের প্রতিটা রিকশার লাগে একটা রঙিন sprite (২০০ KB), হুডের রিকশা-আর্ট (৫০ KB) আর একটা বেলের আওয়াজ; সাথে নিজের অবস্থান, কোন দিকে মুখ, আর খালি না ভাড়ায় আছে। কম দামি Android ফোনে ম্যাপ পায় মোটে ৫০ MB। সকাল ৭টার ধানমন্ডিতে সমস্যা নেই। কিন্তু সন্ধ্যা ৬টার ফার্মগেটে রিকশা ২,০০০টা।',
      'আর চাঁদরাতে পুরো শহর রাস্তায়: ১০,০০০ রিকশা, তার ওপর এবার সিএনজিগুলোও ম্যাপে আসতে চায়…',
    ],
    problem:
      'প্রতিটা রিকশা object যদি একই ২৫০ KB ছবির নিজস্ব কপি বয়ে বেড়ায়, তাহলে প্রতিটা রিকশার সাথে মেমরি বাড়তেই থাকে: ২,০০০ রিকশা মানে ৫০০ MB একই পিক্সেল। অ্যাপ হয় বেশিরভাগ রিকশা লুকিয়ে রাখে, নয়তো জমে যায়; অথচ প্রতিটা রিকশার সত্যিকারের আলাদা তথ্য মাত্র ২৪ বাইট।',
  },

  visual: {
    // Pattern-role and class names stay in English on purpose.
    levelsLabel: 'গেমের লেভেল',
    levelLabel: 'লেভেল {{n}}',
    level1Title: 'প্রতিটা রিকশার নিজের ছবি',
    level2Title: 'মডেলটা share করুন',
    level3Title: 'ম্যাপে এলো সিএনজি',
    level1Goal:
      'এখনো কোনো pattern নেই: প্রতিটা Rickshaw object নিজের sprite নিজেই লোড করে। প্রতিটা এলাকার জন্য ঠিক করুন কয়টা রিকশা লোড হবে: ফোনের ৫০ MB-তে যতগুলো আঁটে, ঠিক ততগুলো।',
    level2Goal:
      'এবার আছে একটা ModelFactory। কোন field সব রিকশা মিলে share করতে পারে (একটাই VehicleModel), আর কোনটা প্রতিটা Vehicle নিজের কাছে রাখবে, সেটা ঠিক করুন। মেমরি বারটা খেয়াল করুন।',
    level3Goal: 'ম্যাপে যোগ হচ্ছে সিএনজি অটোরিকশা। পুরোনো কোডের একটা লাইনও এডিট না করে এগুলোকে আরেকটা shared model হিসেবে যোগ করুন।',
    locked: 'লক করা',
    earned: 'আয়',
    restart: 'গেম আবার শুরু',
    turnOf: 'এলাকা {{n}}/{{total}}',

    clientRole: 'Client',
    appTitle: 'ঢাকা রিকশা ম্যাপ',
    opensMap: 'ম্যাপ খুললেন {{name}}',
    rickshawCount: '{{n}}টা রিকশা',
    cngCount: '{{n}}টা সিএনজি',
    limitLabel: 'ম্যাপ কয়টা রিকশা লোড করবে?',
    optAll: 'সবগুলো',
    optNearest: 'কাছের',
    perObjectNote: 'প্রতিটা Rickshaw object: {{per}} · ম্যাপের বাজেট: {{budget}}',
    splitLabel: 'যে field-গুলো সব রিকশা share করতে পারে, সেগুলো চাপুন',
    splitHint: 'চাপা = VehicleModel-এ একবারই, সবার জন্য। বাকিগুলো থাকবে প্রতিটা Vehicle-এ।',
    newTag: 'নতুন',
    cngCallLabel: 'প্রতিটা সিএনজি কী চাইবে?',
    clientNote: 'Client শুধু নাম ধরে factory-র কাছে model চায়',

    noPatternRole: 'Pattern ছাড়া',
    perObject: 'প্রতিটা object: {{per}}',
    objectsInMemory: 'মেমরিতে {{n}}টা object',
    moreObjects: '+আরও {{n}}টা',
    samePicture: 'একই ছবি, আবার লোড!',
    factoryRole: 'Flyweight Factory',
    cacheLabel: 'cache',
    cacheEmpty: 'খালি: এখনো কোনো model লোড হয়নি',
    flyweightRole: 'Flyweight',
    missTag: 'Miss → বানানো হলো',
    hitTag: 'Hit → আবার কাজে লাগল',
    sharedNone: 'কিছুই share হয়নি',
    notBuilt: 'এখনো register হয়নি',

    phoneRole: 'ফোন',
    mapTitle: 'ম্যাপ · {{area}}',
    contextRole: 'Context',
    ownLabel: 'প্রতিটা Vehicle রাখে',
    memoryLabel: 'ম্যাপের মেমরি',
    memoryOf: '{{used}} / {{budget}}',
    naiveNote: 'প্রতিটা object-এ কপি থাকলে: {{naive}}',
    ghostNote: 'ঝাপসা = রাস্তায় আছে, ম্যাপে নেই',
    froze: 'ম্যাপ জমে গেল! এলাকা: {{area}}',
    drawnOk: 'ম্যাপ আঁকা শেষ · স্ক্রিনে {{n}}টা',
    tooFew: 'মাত্র {{n}}টা দেখানো হলো: আরও জায়গা ছিল',
    hiddenNote: 'ম্যাপ থেকে উধাও {{n}}টা রিকশা',
    pileUp: 'সবাই এক জায়গায় আঁকা!',
    sameWay: 'সবার মুখ এক দিকে!',
    allBusy: 'সবাই হঠাৎ ভাড়ায়!',

    builderTitle: 'সিএনজি অটোরিকশা যোগ করুন',
    builderStep1: 'ধাপ ১ · সব সিএনজি কী share করে?',
    builderStep2: 'ধাপ ২ · সিএনজির model কোথায় বানানো হয়?',
    q1: 'সিএনজির কোন তথ্য তার একমাত্র shared VehicleModel-এ যাবে?',
    q1Model: 'cng.png, খাঁচার আর্ট, হর্নের আওয়াজ',
    q1Pos: 'x, y আর heading',
    q1All: 'সবকিছু, প্রতিটা সিএনজির ভেতরে',
    q2: 'হাজার হাজার সিএনজি model চাইবে। সেটা বানানো হবে কোথায়?',
    q2Factory: 'ModelFactory-তে, প্রথম get(\'cng\')-এ',
    q2Screen: 'MapScreen-এ, প্রতি সিএনজিতে একটা',
    q2Edit: 'VehicleModel এডিট করে, তার ভেতরে',
    useCng: 'ম্যাপে সিএনজি যোগ করুন',
    zeroEdits: 'পুরোনো কোড এডিট: ০ লাইন',

    showButton: 'রিকশা দেখান',
    showVehicles: 'গাড়ি দেখান',
    nextArea: 'পরের এলাকা',
    finishLevel: 'লেভেল শেষ করুন',
    tryAgain: 'আবার চেষ্টা করুন',

    levelDone: 'লেভেল {{n}} শেষ!',
    nextLevel: 'পরের লেভেল',
    replayLevel: 'এই লেভেল আবার খেলুন',
    playAgain: 'লেভেল ১ থেকে আবার খেলুন',
    l1Teaser:
      'আর চাঁদরাতে ঢাকা জুড়ে রিকশা ১০,০০০টা। প্রতিটা ২৫০ KB হলে, একই ছবির পেছনে যাবে ২.৫ GB… নিশ্চয়ই এর চেয়ে ভালো উপায় আছে…',
    l2Summary:
      '১০,০০০ রিকশা, মেমরি মোটে আধা মেগাবাইটের মতো। ভারী আর হুবহু একই তথ্য একবারই আছে VehicleModel-এ; প্রতিটা Vehicle রাখে শুধু নিজের ২৫ বাইট।',
    recapTitle: 'যা শিখলেন',
    recap1:
      'Share না করলে প্রতিটা object একই ভারী তথ্যের নিজস্ব কপি বয়ে বেড়ায়, তাই প্রতিটা নতুন object-এ মেমরি বাড়ে: অ্যাপ হয় রিকশা লুকায়, নয়তো জমে যায়।',
    recap2:
      'Flyweight intrinsic state (সবার জন্য এক: sprite, আর্ট, আওয়াজ) একবারই রাখে। প্রতিটা object রাখে শুধু নিজের extrinsic state (x, y, heading, isFree), আর আঁকার সময় সেটা পাঠিয়ে দেয়।',
    recap3: 'নতুন টাইপ (সিএনজি) মানে একই ModelFactory-তে আরেকটা model। পুরোনো কোড এডিট: ০ লাইন।',

    mitu: 'মিতু',
    karim: 'করিম',
    rahim: 'রহিম',
    tania: 'তানিয়া',
    dhanmondi: 'ধানমন্ডি ২৭',
    mirpur: 'মিরপুর ১০',
    farmgate: 'ফার্মগেট',
    chawkbazar: 'চকবাজার',
    citywide: 'পুরো ঢাকা',
    gulshan: 'গুলশান ১',
    airport: 'এয়ারপোর্ট রোড',
    morning: 'সকাল ৭টা',
    noon: 'দুপুর ১টা',
    rush: 'সন্ধ্যা ৬টা, অফিস ছুটির ভিড়',
    evening: 'রাত ৮টা',
    eidEve: 'চাঁদরাত',

    whatsHappening: 'কী হচ্ছে',
    note: 'মেমরির মাপগুলো এই উদাহরণের জন্য বানানো গোল সংখ্যা (১ KB = ১,০০০ বাইট)।',
  },

  steps: {
    tutorial:
      'ম্যাপ খুললেন {{name}}। এলাকা {{area}}, রাস্তায় রিকশা {{onStreet}}টা। এখনো কোনো pattern নেই, তাই প্রতিটা Rickshaw object নিজের ছবি নিজেই লোড করে ({{per}}), আর ম্যাপ খরচ করতে পারে {{budget}}। “সবগুলো ({{onStreet}})” আগেই বেছে দেওয়া আছে: “রিকশা দেখান” চাপুন আর মেমরি বারটা দেখুন।',
    idle1:
      'ম্যাপ খুললেন {{name}}। এলাকা {{area}}, রাস্তায় রিকশা {{onStreet}}টা। প্রতিটা Rickshaw object-এর খরচ {{per}}, আর ম্যাপের বাজেট {{budget}}। যতগুলো আঁটে ততগুলো লোড করুন: বেশি হলে ফোন জমে যাবে, কম হলে যাত্রী দেখবেন প্রায় ফাঁকা ম্যাপ।',
    picked1: '{{n}}টা রিকশা × প্রতিটা {{per}}। {{budget}}-এর মধ্যে আঁটবে তো? “রিকশা দেখান” চাপুন।',
    'l1-start':
      'showArea() চলছে, লিমিট {{n}}। প্রতিটা রিকশা হচ্ছে একটা নতুন Rickshaw object, আর প্রতিটা object নিজের constructor-এ নিজের ছবি লোড করে।',
    'l1-new': 'প্রথম Rickshaw লোড করল rickshaw.png (২০০ KB) আর হুডের আর্ট (৫০ KB): এক রিকশাতেই {{per}}। এখন পর্যন্ত ঠিক আছে।',
    'l1-copy':
      'দ্বিতীয় Rickshaw হুবহু একই ছবিগুলো আবার লোড করল: আরও {{per}}, একদম একই পিক্সেল। আসলে আলাদা শুধু তার x, y আর heading (২৪ বাইট)।',
    'l1-fill': 'সব মিলিয়ে {{n}}টা object: {{n}} × {{per}} = {{used}}। {{budget}}-এ এঁটে গেল, কিন্তু প্রায় পুরোটাই একটা ছবি, কপি হয়েছে {{n}} বার।',
    'l1-fill-over': '{{n}} × {{per}} = {{used}}, অথচ ফোন ম্যাপকে দেয় মাত্র {{budget}}। মেমরি বার ফেটে যাচ্ছে…',
    'l1-ok': 'ম্যাপ আঁকা শেষ! সব {{shown}}টা রিকশা দেখছেন {{name}}, আর বুকিং ফি থেকে অ্যাপের আয় {{amount}}। কাজ হলো, কিন্তু শুধু এলাকাটা ছোট বলে।',
    'l1-ok-hidden':
      'ম্যাপ আঁকা হলো {{used}}-এ, আয় +{{amount}}। কিন্তু {{onStreet}}টার মধ্যে মাত্র {{shown}}টা রিকশা দেখছেন {{name}}: {{hidden}}টা উধাও, কারণ প্রতিটা object একই ছবির নিজস্ব কপি বয়ে বেড়ায়।',
    'l1-fail-crash': '😵 ম্যাপ জমে গেল! এলাকা: {{area}}। {{used}} ছবি {{budget}}-এ আঁটে না, তাই ফোন অ্যাপটাই বন্ধ করে দিল।',
    'l1-fail-few':
      '😵 ম্যাপে মাত্র {{shown}}টা রিকশা, অথচ ফোনে আরও জায়গা ছিল। প্রায় ফাঁকা রাস্তা দেখে {{name}} কিছুই বুক করলেন না। {{budget}}-এ যতগুলো আঁটে, ততগুলো লোড করুন।',
    'level1-done':
      'লেভেল শেষ! Share ছাড়া প্রতিটা Rickshaw নিজের {{per}} ছবি বয়ে বেড়ায়, তাই {{budget}}-এ আঁটে মোটে ২০০টার মতো রিকশা। অথচ শুধু ফার্মগেটেই আছে ২,০০০টা।',

    idle2:
      'ম্যাপ খুললেন {{name}}। এলাকা {{area}}, রিকশা {{n}}টা। এবার আছে একটা ModelFactory। যে field-গুলো সব রিকশার জন্য হুবহু এক, সেগুলো চাপুন: ওগুলো যাবে একটাই shared VehicleModel-এ। বাকিগুলো থাকবে প্রতিটা Vehicle-এ।',
    'idle2-more':
      'ম্যাপের নতুন ভার্সন: যোগ হলো {{newFields}}। ম্যাপ খুললেন {{name}}, এলাকা {{area}}, রিকশা {{n}}টা। VehicleModel-এ share, নাকি প্রতিটা Vehicle-এ আলাদা? নতুন field-গুলোর জন্য ঠিক করুন, তারপর “রিকশা দেখান” চাপুন।',
    picked2: 'VehicleModel-এ share: {{shared}}। প্রতিটা Vehicle-এ আলাদা: {{own}}। “রিকশা দেখান” চাপুন।',
    request: 'প্রথম রিকশা চাইল factory.get(\'rickshaw\')। কিছু লোড করার আগে factory আগে নিজের cache-এ খোঁজে।',
    miss: 'Cache miss: এখনো কোনো model নেই। Factory একটা VehicleModel বানাল, ভেতরে {{shared}} ({{sharedBytes}}), আর cache-এ রেখে দিল। এটা হয় মাত্র একবার।',
    hit: 'দ্বিতীয় রিকশা আবার চাইল: cache hit! Factory ফেরত দিল সেই একই VehicleModel object। কোনো ছবি দুবার লোড হলো না।',
    place: 'প্রতিটা নতুন Vehicle রাখে শুধু নিজের তথ্য: {{own}} ({{ownBytes}}), সাথে shared model-এর একটা reference।',
    fill: 'সব মিলিয়ে {{n}}টা Vehicle: একবার {{sharedBytes}} + {{n}} × {{ownBytes}} = {{used}}। প্রতিটা object-এ কপি থাকলে লাগত {{naive}}।',
    'fill-over': 'সর্বনাশ: {{field}} রয়ে গেছে প্রতিটা Vehicle-এ, তাই কপি হলো {{n}} বার: {{used}}। এটা {{budget}}-এর চেয়ে বেশি…',
    'l2-ok':
      'ম্যাপ আঁকা শেষ! প্রতিটা Vehicle নিজের x, y আর heading পাঠিয়ে দেয় shared model-এর draw()-এ। {{n}}টা রিকশা, মেমরি মাত্র {{used}}। +{{amount}}।',
    'l2-fail-crash':
      '😵 ম্যাপ জমে গেল! এলাকা: {{area}}। {{field}} সব রিকশার জন্য হুবহু এক, তাই এর জায়গা shared VehicleModel-এ, একবার; প্রতিটা Vehicle-এ না।',
    'l2-fail-pile':
      '😵 {{n}}টা রিকশাই আঁকা হলো এক জায়গায়! x, y share করা হয়েছে, তাই সব Vehicle-এর অবস্থান একটাই। অবস্থান হলো extrinsic: প্রতিটা Vehicle-কে নিজেরটা রাখতে হবে।',
    'l2-fail-facing':
      '😵 সব রিকশার মুখ এক দিকে, এমনকি ওয়ান-ওয়ে রাস্তাতেও। heading share করা হয়েছে, অথচ প্রতিটা রিকশা চলে নিজের দিকে: এটা থাকবে প্রতিটা Vehicle-এ।',
    'l2-fail-busy':
      '😵 একটা রিকশা বুক করলেন {{name}}, আর {{n}}টাই হয়ে গেল “ভাড়ায়”! isFree share করা হয়েছে, তাই এক জায়গার বদল লাগল সব Vehicle-এ। যে state প্রতিটা object-এ আলাদাভাবে বদলায়, সেটা কখনো share করা যায় না।',
    'level2-done':
      'লেভেল শেষ! ভারী আর হুবহু একই তথ্য (intrinsic) flyweight-এ একবারই থাকে; ছোট, নিজস্ব তথ্য (extrinsic) থাকে প্রতিটা Vehicle-এ। সংখ্যা যত বাড়ুক, মেমরি প্রায় একই থাকে।',

    'build-q1':
      'নতুন: ম্যাপে আসছে সিএনজি অটোরিকশা (প্রতিটা সিএনজি model-এ ছবি আর আওয়াজ মিলে {{cngModel}})। প্রথম প্রশ্ন: সিএনজির shared VehicleModel-এ কী যাবে?',
    'wrong-q1-pos':
      'x, y আর heading প্রতিটা সিএনজির আলাদা। Share করলে সব সিএনজি বসে থাকবে এক জায়গায়, মুখ এক দিকে। Share করুন শুধু যা সব সিএনজির জন্য হুবহু এক।',
    'wrong-q1-all': 'এ তো আবার লেভেল ১: প্রতিটা সিএনজি বয়ে বেড়াবে cng.png-এর নিজস্ব কপি। {{cngs}}টা সিএনজি × {{cngModel}} = {{naiveCng}}।',
    'build-q2': 'cng.png, সবুজ খাঁচার আর্ট আর হর্ন যাবে একটাই shared model-এ। এবার: সেই model বানানো হবে কোথায়?',
    'wrong-q2-screen':
      'তাহলে প্রতিটা সিএনজি নিজের model নিজেই বানাবে, share হবে না কিছুই। যত সিএনজিই চাক, টাইপ-প্রতি একটা model নিশ্চিত করে শুধু factory-র cache।',
    'wrong-q2-edit':
      'VehicleModel আগে থেকেই যেকোনো sprite, আর্ট আর আওয়াজ রাখতে পারে। সিএনজি মানে একই class-এর জন্য নতুন ডেটা, তাই যে কোড ঠিকঠাক চলছে তাতে হাত দেওয়ার দরকার নেই।',
    'build-ready':
      'হয়ে গেল: register(\'cng\', …) দিয়ে একটা নতুন কল, আর প্রথম get(\'cng\')-এ ModelFactory নিজেই সিএনজির model বানাবে। পুরোনো কোড এডিট: ০ লাইন। “ম্যাপে সিএনজি যোগ করুন” চাপুন।',
    'build-done': 'এখন সিএনজি চাওয়া যায়। প্রতিটা সিএনজি কী চাইবে বেছে নিন, তারপর “গাড়ি দেখান” চাপুন।',
    idle3: 'ম্যাপ খুললেন {{name}}। এলাকা {{area}}: রিকশা {{rickshaws}}টা, সিএনজি {{cngs}}টা। প্রতিটা সিএনজি কী চাইবে?',
    picked3: 'প্রতিটা সিএনজি ডাকবে factory.get(\'cng\'), ঠিক যেমন রিকশারা ডাকে get(\'rickshaw\')। “গাড়ি দেখান” চাপুন।',
    'wrong-pick-rickshaw':
      'factory.get(\'rickshaw\') ফেরত দেয় রিকশার model, তাই প্রতিটা সিএনজি আঁকা হবে প্যাডেল রিকশা হিসেবে। যাত্রী সিএনজি বুক করে দেখবেন রিকশা আসছে।',
    'wrong-pick-new': 'প্রতিটা সিএনজির জন্য নতুন VehicleModel মানে cng.png-এর {{cngs}}টা কপি: {{naiveCng}}। এ তো আবার লেভেল ১। Factory-র কাছে চান।',
    'l3-rickshaws':
      'আগে {{rickshaws}}টা রিকশা, ঠিক আগের মতোই: প্রথম get(\'rickshaw\') model বানায়, বাকি সবাই সেটাই আবার ব্যবহার করে। এই কোডে কেউ হাত দেয়নি।',
    'l3-request': 'প্রথম সিএনজি চাইল factory.get(\'cng\')। একই factory, একই method, শুধু নতুন একটা key।',
    'l3-miss': '\'cng\'-এর জন্য cache miss: factory নতুন loader-টা একবার চালাল, আর সিএনজির একটা VehicleModel ({{cngModel}}) cache-এ রাখল।',
    'l3-hit': 'বাকি সব সিএনজি: cache hit। গাড়ি যতই হোক, cache-এ এখন model মাত্র দুটো, টাইপ-প্রতি একটা।',
    'l3-place': 'প্রতিটা সিএনজি একটা সাধারণ Vehicle: নিজের x, y, heading আর isFree (২৫ বাইট), সাথে সিএনজি model-এর reference।',
    'l3-fill': 'মোট {{total}}টা গাড়ি: দুটো model ({{models}}) + {{total}} × ২৫ B = {{used}}। {{budget}} থেকে এখনো অনেক দূরে।',
    'l3-draw': 'রিকশা আর সিএনজি নিয়ে ম্যাপ আঁকা শেষ! {{name}} যেকোনোটা বুক করতে পারবেন। +{{amount}}। পুরোনো কোড এডিট: ০ লাইন।',
    'level3-done':
      'গেম শেষ! Flyweight অনেকগুলো object-এর ভারী আর হুবহু একই অংশটা share করে, আর নতুন টাইপ মানে factory-তে শুধু আরেকটা model।',
  },

  codeComments: {
    flyweight: 'Flyweight: যে ভারী তথ্য সব রিকশার একই (intrinsic state)',
    sharedSprite: 'টাইপ-প্রতি একবার লোড হয়, share করে হাজারো গাড়ি',
    extrinsicIn: 'প্রতিটা গাড়ির নিজের তথ্য (extrinsic state) পাঠানো হয়, রাখা হয় না',
    factory: 'Flyweight factory: টাইপ-প্রতি একটা model, cache-এ রাখা',
    lookFirst: 'কিছু লোড করার আগে cache-এ খোঁজো',
    missCreate: 'cache miss: model একবার লোড করে cache-এ রাখো',
    hitReuse: 'cache hit: পরের প্রতিটা চাওয়ায় একই object ফেরত',
    context: 'Context: প্রতিটা গাড়ির যা সত্যিই আলাদা (extrinsic state)',
    extrinsic: 'নিজের অবস্থান আর দিক: মাত্র কয়েক বাইট',
    sharedRef: 'shared model-এর reference, কপি না',
    usage: 'Client কোড: হাজারো গাড়ি, model একটাই',
    manyObjects: 'ফার্মগেটে ২,০০০ গাড়ি, তবু VehicleModel একটাই',
    withoutIntro: 'Pattern ছাড়া: প্রতিটা রিকশা object নিজের ছবি নিজেই লোড করে',
    ownCopy: 'প্রতিটা object-এর কাছে ছবির নিজস্ব কপি…',
    loadsAgain: '…প্রতিটা রিকশার জন্য আবার লোড (২৫০ KB)',
    pickLimit: 'কয়টা রিকশা সামলানো যাবে, স্ক্রিনকেই তার সীমা বাঁধতে হয়',
    perObject: 'নতুন Rickshaw = একই পিক্সেলের আরও ২৫০ KB',
    outOfMemory: 'রিকশা বেশি হলেই ফোনের মেমরি শেষ',
    withoutMath: '২,০০০ রিকশা × ২৫০ KB = একটা ছবির পেছনে ৫০০ MB; আসলে আলাদা শুধু ২৪ বাইট করে',
    withAdd: 'সিএনজি = একই factory-তে register করা একটা নতুন loader',
    newModel: 'চলে একবারই, প্রথম get(\'cng\')-এ',
    cngShared: 'intrinsic: cng.png, সবুজ খাঁচার আর্ট আর হর্ন',
    withSame: 'বাকি সব আগের মতো: একই factory, একই Vehicle, একই draw()',
    unchanged: 'রিকশা: হুবহু আগের কোড',
    sameFactory: 'নতুন key, একই get() method',
    sameDraw: 'একটাই লুপ দুই টাইপই আঁকে',
    withZero: 'পুরোনো কোড এডিট: ০ লাইন। আরও ৫,০০০ সিএনজির মেমরি: একটা ২৪০ KB model + প্রতিটায় ২৫ বাইট',
  },

  compare: {
    without: {
      title: 'প্রতিটা object নিজের কপি বয়ে বেড়ায়',
      points: [
        'প্রতিটা Rickshaw নিজের constructor-এ rickshaw.png আর হুডের আর্ট লোড করে: প্রতি object-এ ২৫০ KB।',
        'প্রতিটা রিকশার সাথে মেমরি বাড়ে: ২,০০০ রিকশা মানে একই ছবির ৫০০ MB।',
        'স্ক্রিনকে সংখ্যা বেঁধে দিতে হয়, তাই যাত্রী দেখেন আসল রিকশার সামান্য অংশ, নয়তো অ্যাপ জমে যায়।',
        'প্রতিটা রিকশার আসলে আলাদা মাত্র ২৪ বাইট (x, y, heading); বাকিটা অপচয়।',
      ],
    },
    with: {
      title: 'টাইপ-প্রতি একটা shared model, ছোট ছোট object',
      points: [
        'VehicleModel intrinsic state (sprite, আর্ট, আওয়াজ) রাখে টাইপ-প্রতি একবার।',
        'ModelFactory model-গুলো cache করে: প্রথম get() বানায়, পরের প্রতিটা get() সেটাই আবার দেয়।',
        'প্রতিটা Vehicle রাখে শুধু নিজের extrinsic state (x, y, heading, isFree), আর সেটা draw()-এ পাঠায়।',
        'নতুন টাইপ (সিএনজি) মানে আরেকটা register করা model; পুরোনো কোনো class বদলায় না।',
      ],
    },
    benefit:
      'Flyweight “একই ভারী তথ্যের N-টা কপি”-কে বানিয়ে দেয় “একটা কপি + N-টা ছোট object”। সংখ্যা বাড়লেও মেমরি প্রায় সমান থাকে, তাই কম দামি ফোনেও শহরের প্রতিটা রিকশা দেখানো যায়।',
    whenToUse: [
      'অ্যাপে লাগে বিশাল সংখ্যক একই রকম object: ম্যাপের মার্কার, গেমের sprite, টেক্সট এডিটরের অক্ষর, particle।',
      'প্রতিটা object-এর বেশিরভাগ তথ্য হুবহু এক আর share করা যায়, বাকিটা ছোট আর বাইরে থেকে পাঠানো যায়।',
      'মেমরি (বা লোডিং টাইম) হলো আসল সমস্যা, আর shared অংশটা একবার বানানোর পর আর বদলায় না।',
    ],
  },
}

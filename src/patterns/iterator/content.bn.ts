import type { DeepPartial } from '@/types/pattern'
import type { IteratorContent } from './content.en'

// Technical terms stay in English (Iterator, iterator, loop, list, Map, hasNext(), next(), strike rate, class, interface…).
// Never glue a Bangla suffix onto a {{placeholder}} ("{{name}}-কে" reads wrong); rephrase instead.
// Anything missing here falls back to content.en.ts automatically.
export const bn: DeepPartial<IteratorContent> = {
  title: 'Iterator',
  tagline: 'একই ছোট্ট loop দিয়ে দল ঘুরে দেখুন: ব্যাটিং অর্ডারে, strike rate অনুযায়ী বা শুধু অলরাউন্ডার। দল ভেতরে খেলোয়াড়দের কীভাবে রাখে, তা জানার দরকারই নেই।',
  intent:
    'একটা collection-কে এমন কিছু object দিন যারা আপনার হয়ে collection-টা ঘুরে দেখে: প্রতিটা iterator শুধু hasNext() আর next()-এর উত্তর দেয়। তাই client একে একে সব element পায়, যেকোনো ক্রমে বা ফিল্টারে, ভেতরে collection কীভাবে রাখা আছে তা না জেনেই।',

  scenario: {
    title: 'পাড়ার ক্রিকেট ক্লাবে মিরপুর টাইগার্সের ব্যাটিং অর্ডার',
    paragraphs: [
      'প্রতি শুক্রবার বিকেলে মসজিদের পেছনের মাঠে মিরপুর টাইগার্স পাড়ার ক্রিকেট খেলে। ক্যাপ্টেন করিম ভাই, আর ক্লাবের ছোট্ট অ্যাপে স্কোর রাখে নুসরাত। প্রতি ইনিংসের আগে করিম ভাই বলে দেন কে কে ব্যাট করতে নামবে, আর নুসরাত একে একে নাম ডাকে।',
      'অনুরোধ একেক দিন একেক রকম: “আজকের ব্যাটিং অর্ডারে”, “কার ফর্ম ভালো? সবচেয়ে বেশি strike rate আগে”, “সুপার ওভার: শুধু অলরাউন্ডাররা”। অ্যাপে Squad তার খেলোয়াড়দের কাঁচা list সরাসরি দিয়ে দেয়, তাই প্রতিটা অনুরোধের জন্য নুসরাতকে নতুন loop লিখতে হয়: index-এর হিসাব, sort, ফিল্টার। ০-এর বদলে ১ থেকে শুরু করলেই ওপেনার রহিম আর ব্যাটই পায় না। আসল list-টা sort করে ফেললে পরের সপ্তাহের ব্যাটিং অর্ডার এলোমেলো। আর অ্যাপের developer যেদিন list-টা Map-এ সরিয়ে নেয়, সেদিন সব loop একসাথে ভেঙে পড়ে।',
      'তারপর বল করতে আসে একজন লেগ-স্পিনার, আর করিম ভাই চান শুধু বাঁহাতি ব্যাটাররা নামুক…',
    ],
    problem:
      'প্রতিটা client নিজে নিজে দলের কাঁচা list-এর ওপর loop চালায়। তাই সবাই আলাদা করে index-এর হিসাব, sort আর ফিল্টার লেখে, আর সবাই নির্ভর করে list-টা কীভাবে রাখা আছে তার ওপর। ছোট্ট একটা ভুলে কেউ বাদ পড়ে বা অ্যাপ crash করে; বেখেয়ালে sort করলে list সবার জন্য বদলে যায়; আর রাখার ধরন বদলালে (array থেকে Map) একসাথে সব loop ভাঙে।',
  },

  visual: {
    levelsLabel: 'গেমের লেভেল',
    levelLabel: 'লেভেল {{n}}',
    level1Title: 'হাতে লেখা loop',
    level2Title: 'iterator চেয়ে নিন',
    level3Title: 'নতুন iterator: বাঁহাতি',
    level1Goal:
      'এখনো কোনো pattern নেই: Squad তার কাঁচা list দিয়ে দেয়, আর করিম ভাইয়ের প্রতিটা অনুরোধের জন্য নুসরাত একটা loop লেখে। loop বাছুন, তারপর দেখুন কে কে ব্যাট করতে নামে।',
    level2Goal:
      'এবার Squad তার list লুকিয়ে রাখে, বাইরে দেয় শুধু iterator। নুসরাতের loop সবসময় একই: while (it.hasNext()) announce(it.next().name)। অনুরোধ অনুযায়ী ঠিক iterator-টা বাছুন।',
    level3Goal: 'লেগ-স্পিনার বল করছে, তাই করিম ভাই চান শুধু বাঁহাতিরা। Squad, Team বা পুরোনো iterator এডিট না করে LeftHandedIterator বানান, তারপর ব্যবহার করুন।',
    locked: 'লক করা',
    earned: 'প্রাইজমানি',
    restart: 'গেম আবার শুরু',
    turnOf: 'ম্যাচ {{n}}/{{total}}',

    clientRole: 'Client',
    scorerTitle: 'স্কোরার · নুসরাত',
    captainSays: 'ক্যাপ্টেন করিম ভাই',
    loopRole: 'কোনো pattern নেই',
    loopTitle: 'নুসরাতের হাতে লেখা loop',
    exposedRole: 'কোনো pattern নেই',
    squadRole: 'ConcreteAggregate',
    squadTitle: 'Squad · মিরপুর টাইগার্স',
    concreteIteratorRole: 'ConcreteIterator',
    innerRole: 'ভেতরের iterator',
    aggregateRole: 'Aggregate',
    iteratorRole: 'Iterator',
    rahim: 'রহিম',
    sumon: 'সুমন',
    tania: 'তানিয়া',
    jamal: 'জামাল',
    rafiq: 'রফিক',
    mitu: 'মিতু',
    babu: 'বাবু',
    roleBatter: 'ব্যাটার',
    roleKeeper: 'কিপার',
    roleAllrounder: 'অলরাউন্ডার',
    roleBowler: 'বোলার',
    handLeft: 'বাঁহাতি',
    handRight: 'ডানহাতি',
    handLeftShort: 'বাঁহাতি',
    handRightShort: 'ডানহাতি',
    srLabel: 'SR',

    reqOrder: 'আজকের ব্যাটিং অর্ডারে ব্যাটারদের পাঠাও।',
    reqForm: 'কার ফর্ম ভালো? সবচেয়ে বেশি strike rate যার, সে আগে।',
    reqSuperOver: 'সুপার ওভার! শুধু অলরাউন্ডারদের পাঠাও।',
    reqFinal: 'পল্লবী একাদশের সাথে ফাইনাল: সবাই, ব্যাটিং অর্ডারে।',
    reqLefty1: 'লেগ-স্পিনার বল করছে: শুধু বাঁহাতিরা, ব্যাটিং অর্ডারে।',
    reqLefty2: 'শুধু বাঁহাতিরা, সবচেয়ে বেশি strike rate আগে।',
    reqLefty3: 'বাবু ৭ নম্বরে দলে এসেছে। শুধু বাঁহাতিরা, ব্যাটিং অর্ডারে।',

    calledOut: 'নাম ডাকা হয়েছে',
    nobodyYet: 'এখনো কেউ না',
    yourChoice: 'আপনার পছন্দ',
    pickLabel1: 'নুসরাত কোন loop লিখবে?',
    pickLabel2: 'নুসরাত কোন iterator চাইবে?',
    knowsL1: 'নুসরাতের loop Squad-এর list চেনে: তার index, তার ক্রম, তার ধরন',
    knowsL2: 'নুসরাত শুধু hasNext() আর next() চেনে; list থাকে লুকানো',
    othersSame: 'Squad · Team · পুরোনো ৩টা iterator · নুসরাতের loop: অপরিবর্তিত',

    optZero: 'for (let i = 0; i < players.length; i++)',
    optOne: 'for (let i = 1; i <= players.length; i++)',
    optMinus: 'for (let i = 0; i < players.length - 1; i++)',
    optCopy: 'একটা কপি sort করো: [...players].sort(bySR), তারপর loop',
    optInPlace: 'list-টাই sort করো: players.sort(bySR), তারপর loop',
    optReverse: 'উল্টো দিক থেকে loop: i = players.length - 1 থেকে 0',
    optValues: 'for (const p of players.values()), শুধু অলরাউন্ডার রাখো',
    optOldLoop: 'পুরোনো loop-টাই থাক: for (i = 0; i < players.length; i++)',
    optFilter: 'players.filter(p => p.role === "all-rounder")',

    pickLoop: 'ওপর থেকে একটা loop বাছুন।',
    copyLabel: 'নুসরাতের sort করা কপি',
    crashTitle: 'অ্যাপ crash করেছে!',

    pickIterator: 'ওপর থেকে একটা iterator বাছুন।',
    ownCopy: 'তার নিজের sort করা কপি (দলের list-এ হাতই পড়ে না)',
    iterOrder: 'দলের রাখা ব্যাটিং অর্ডার ধরে হাঁটে',
    iterSr: 'sort করা একটা কপি ধরে হাঁটে, বেশি strike rate আগে',
    iterAr: 'দল ধরে হাঁটে, অলরাউন্ডার না হলে বাদ দেয়',
    lhNote: 'যে iterator-কে মুড়ে রেখেছে তার কাছ থেকে খেলোয়াড় নেয়, ডানহাতিদের বাদ দেয়',
    notBuilt: 'এখনো বানানো হয়নি',
    newTag: 'নতুন',
    teamNote: 'Squad কথা দেয় iterator দেবে, নিজের list কখনো না।',
    iteratorNote: 'প্রতিটা iterator একই দুটো প্রশ্নের উত্তর দেয়।',

    storagePublic: 'যে কেউ ভেতরে হাত দিতে পারে',
    storagePrivate: 'শুধু তার iterator-রা ঘুরে দেখে',
    scrambled: 'দলের আসল ব্যাটিং অর্ডারই বদলে গেছে!',

    resultOk: 'ঠিক লাইনআপ! মিরপুর টাইগার্স জিতেছে · +{{coins}}',
    resultBad: 'ভুল লাইনআপ!',
    resultCrash: 'ম্যাচের মাঝখানে অ্যাপ crash করেছে!',

    builderTitle: 'LeftHandedIterator বানান',
    builderStep1: 'ধাপ ১ · এটা কী?',
    builderStep2: 'ধাপ ২ · খেলোয়াড় আসবে কোথা থেকে?',
    q1: 'নুসরাতের loop এটাকে অন্য যেকোনো iterator-এর মতোই ব্যবহার করবে। নতুন কোডটা কী হওয়া উচিত?',
    q1ClientIf: 'নুসরাতের loop-এর ভেতরে একটা if (p.leftHanded)',
    q1Implements: 'class LeftHandedIterator implements PlayerIterator',
    q1SquadMethod: 'Squad-এ নতুন একটা leftHanders() loop যোগ করা',
    q2: 'Squad-এর list লুকানো। LeftHandedIterator বাঁহাতিদের খুঁজে পাবে কীভাবে?',
    q2ReadList: 'সরাসরি squad.players পড়বে',
    q2SortList: 'দলটা এমনভাবে sort করবে যাতে বাঁহাতিরা আগে আসে',
    q2Wrap: 'আরেকটা iterator-কে মুড়ে রাখবে, আর নিজের hasNext()-এ ডানহাতিদের বাদ দেবে',
    zeroEdits: 'পুরোনো কোড এডিট: ০ লাইন',
    useLh: 'LeftHandedIterator ব্যবহার করুন',

    playButton: 'চালান',
    nextTurn: 'পরের ম্যাচ',
    finishLevel: 'লেভেল শেষ',
    tryAgain: 'আবার চেষ্টা',

    levelDone: 'লেভেল {{n}} শেষ!',
    nextLevel: 'পরের লেভেল',
    replayLevel: 'এই লেভেল আবার খেলুন',
    playAgain: 'লেভেল ১ থেকে আবার খেলুন',
    l1Teaser:
      'তিনটা অনুরোধ, তিনটা আলাদা loop, আর Squad ভেতরে বদলালেই প্রতিটা ভাঙে। এরপর লেগ-স্পিনার আসছে, করিম ভাই চান বাঁহাতিদের। আরও একটা loop?',
    l2Summary:
      'তিনটা আলাদা অনুরোধ, অথচ নুসরাতের loop একবারও বদলায়নি। Squad তার list লুকিয়ে রেখেছে; কীভাবে হাঁটতে হবে (ক্রমে, strike rate ধরে, বা অলরাউন্ডার ছাড়া বাকিদের বাদ দিয়ে) সেটা জানত প্রতিটা iterator।',
    recapTitle: 'যা শিখলেন',
    recap1:
      'collection যখন কাঁচা list দিয়ে দেয়, প্রতিটা client নিজের loop লেখে: index-এর হিসাব, sort, ফিল্টার বারবার লিখতে হয়, এক ধাপ ভুল হলেই কেউ বাদ পড়ে বা crash করে, আর রাখার ধরন বদলালে সব loop ভাঙে।',
    recap2:
      'Iterator list-টা লুকিয়ে রাখে, আর বাইরে দেয় এমন object যারা list ধরে হাঁটে: প্রতিটা hasNext() আর next()-এর উত্তর দেয়। ক্রমে হোক, strike rate ধরে হোক, বা শুধু অলরাউন্ডার, client-এর loop সবসময় একই।',
    recap3:
      'নতুন ধরনের হাঁটা (বাঁহাতি) মানে একই interface-ওয়ালা একটা নতুন iterator class। সে চাইলে পুরোনো iterator-কেও মুড়ে নিতে পারে। Squad, Team আর পুরোনো iterator: ০ লাইন এডিট।',

    whatsHappening: 'কী হচ্ছে',
    note: 'ক্লাব, খেলোয়াড় আর সংখ্যাগুলো এই উদাহরণের জন্য বানানো।',
  },

  steps: {
    tutorial:
      'করিম ভাই: “{{req}}” কোনো pattern নেই, তাই Squad নুসরাতের হাতে কাঁচা list দিয়ে দেয়, loop-টা নুসরাতকেই লিখতে হয়। ঠিক loop-টা আগে থেকেই বাছা আছে। চালান চাপুন আর দেখুন।',
    'idle1-1': 'করিম ভাই: “{{req}}” squad.players-এর ওপর নুসরাত কোন loop লিখবে?',
    'idle1-2': 'করিম ভাই: “{{req}}” প্রতিটা কার্ডে strike rate লেখা আছে। নুসরাত ওই ক্রমে list ধরে loop চালাবে কীভাবে?',
    'idle1-3':
      'অ্যাপের developer এইমাত্র Squad-এর খেলোয়াড়দের একটা Map-এ সরিয়েছে, জার্সি নম্বর দিয়ে। করিম ভাই: “{{req}}” এখন কোন loop কাজ করবে?',
    picked1: 'আপনি বেছেছেন: {{choice}}। চালান চাপুন, দেখুন কে কে ব্যাট করতে নামে।',
    'l1-request': 'করিম ভাই: “{{req}}” এখানে Squad-এর কোনো ভূমিকা নেই: তার players list public, তাই নুসরাতের কোড সোজা ভেতরে হাত দেয়।',
    'l1-start-zero': 'loop শুরু হয় i = 0 থেকে, list-এর প্রথম ঘর, আর চলে যতক্ষণ i < {{n}}।',
    'l1-start-one': 'loop শুরু হয় i = 1 থেকে। কিন্তু list গোনা শুরু হয় 0 থেকে, তাই players[0] কখনো পড়াই হয় না: ওপেনার বাদ!',
    'l1-start-minus': 'loop চলে যতক্ষণ i < players.length - 1। এই শর্ত এক ঘর আগেই থেমে যায়…',
    'l1-start-reverse': 'loop শুরু হয় শেষ থেকে, i = {{last}}, তারপর গুনে গুনে 0 পর্যন্ত নামে।',
    'l1-read': 'i = {{i}}: players[{{i}}] হলো {{name}}। নুসরাত নামটা ডাকে।',
    'l1-crash':
      'i = {{i}}: শর্ত বলছে i <= length, কিন্তু শেষ ঘর তো players[{{last}}]। players[{{i}}] হলো undefined, আর তার .name পড়তে গিয়েই অ্যাপ crash! 💥',
    'l1-loop-end': 'i = {{i}}: i < {{n}} এখন false, তাই loop থামে। সবার নাম একবার করে ডাকা হয়েছে।',
    'l1-loop-end-minus': 'i = {{i}}: loop থেমে গেল, একজন আগেই। প্যাড পরে বসে আছে: {{name}}!',
    'l1-loop-end-reverse': 'i = -1: loop থামে। সবার নাম ডাকা হয়েছে, শেষ ঘর থেকে প্রথম ঘর পর্যন্ত।',
    'l1-sort-copy': 'নুসরাত আগে list-টার কপি বানায় ([...players]), তারপর কপিটা strike rate ধরে sort করে। squad.players নিজে ব্যাটিং অর্ডারেই থাকে।',
    'l1-sort-inplace': 'players.sort() দলের আসল list-টাই জায়গায় বসে sort করে দেয়। দলের দিকে তাকান: ব্যাটিং অর্ডারটাই বদলে গেল!',
    'l1-read-sorted': 'sort করা list-এ এরপর: {{name}}, strike rate {{sr}}। নুসরাত নামটা ডাকে।',
    'l1-next-match':
      'পরের শুক্রবার স্কোরবোর্ড squad.players থেকে ব্যাটিং অর্ডার পড়ে, আর ওপেন করতে নামে {{name}}, {{opener}} নয়। এক client-এর sort সবার list বদলে দিয়েছে!',
    'l1-map': 'Squad এখন খেলোয়াড়দের রাখে একটা Map-এ, জার্সি নম্বর দিয়ে: খুঁজে পাওয়া সহজ। কিন্তু client-দের loop-গুলোকে কেউ জানায়নি।',
    'l1-read-ar': 'অলরাউন্ডার: {{name}}। নাম ডাকা হলো।',
    'l1-skip': '{{name}}: {{role}}, অলরাউন্ডার নয়। নুসরাতের loop-এর if এই খেলোয়াড়কে বাদ দেয়।',
    'l1-map-end': 'values()-এ আর কোনো খেলোয়াড় নেই, তাই loop শেষ।',
    'l1-oldloop':
      'Map-এর players.length হলো undefined, আর 0 < undefined হলো false। পুরোনো loop একবারও চলে না: সুপার ওভারে কেউই নামে না!',
    'l1-filter-crash': 'Map-এর কোনো filter() method নেই। TypeError: players.filter is not a function। 💥 কারও নাম ডাকার আগেই অ্যাপ crash।',
    'l1-ok': 'ঠিক লাইনআপ! মিরপুর টাইগার্স জিতেছে · +{{coins}}। কাজ হয়েছে, কিন্তু শুধু এই কারণে যে নুসরাতের loop ঠিক জানে Squad খেলোয়াড়দের কীভাবে রাখে।',
    'l1-fail-one':
      '😵 ওপেনার রহিমের নাম ডাকাই হয়নি, আর শেষে loop শেষ খেলোয়াড় পেরিয়ে পড়তে গিয়ে crash করেছে। list গোনা শুরু 0 থেকে: প্রথম খেলোয়াড় players[0], শেষজন players[length - 1]।',
    'l1-fail-minus':
      '😵 মিতু প্যাড পরে বসেই রইল। i < length - 1 একজন আগেই থেমে যায়। index-এর হিসাবে ভুল করা খুব সহজ, আর প্রতিটা client-এর loop-কে আবার সেটা ঠিকঠাক করতে হয়।',
    'l1-fail-inPlace':
      '😵 আজকের অর্ডার ঠিক ছিল, কিন্তু players.sort() দলের আসল list-টাই sort করে ফেলেছে। এখন বাকি সব client দেখছে তানিয়া ওপেনার। সবার ভাগের list কোনো এক client-এর এলোমেলো করা চলবে না।',
    'l1-fail-reverse':
      '😵 উল্টো দিক থেকে loop চালালে শুধু ব্যাটিং অর্ডারটা উল্টে যায়: ওপেন করল মিতু, বোলার, strike rate মাত্র ৭৪। “ফর্ম” মানে একটা কপিকে strike rate ধরে sort করা।',
    'l1-fail-oldLoop':
      '😵 সুপার ওভারে কেউই নামেনি। পুরোনো index loop ধরে নিয়েছিল squad.players একটা array; Map-এর ওপর সে একবারও চলেনি। Squad বদলেছে ভেতরে, আর ভেঙেছে বাইরের client-এর loop।',
    'l1-fail-filter':
      '😵 Crash! filter() আছে array-তে, Map-এ নেই। squad.players-এর ওপর যত client array-র method ব্যবহার করেছিল, Squad রাখার ধরন বদলানোর দিনই সবাই ভেঙেছে।',
    'level1-done':
      'লেভেল শেষ! তিনটা অনুরোধ, তিনটা আলাদা হাতে লেখা loop, আর প্রতিটাই নির্ভর করে Squad-এর list-এর ওপর: তার index, তার ক্রম, তার ধরন।',

    'idle2-1': 'করিম ভাই: “{{req}}” Squad-এর list এখন লুকানো। নুসরাত কোন iterator চাইবে?',
    'idle2-2': 'করিম ভাই: “{{req}}” iterator বাছুন। নুসরাতের loop হুবহু একই থাকবে।',
    'idle2-3': 'করিম ভাই: “{{req}}” কোন iterator দলটাকে ওই ক্রমে ঘুরে দেখে?',
    picked2: 'আপনি বেছেছেন {{choice}}। চালান চাপুন: নুসরাত ওই iterator দিয়ে তার চেনা loop চালাবে।',
    request: 'করিম ভাই: “{{req}}” নুসরাত list ছুঁয়েও দেখে না। সে দলের কাছে একটা iterator চায়: {{call}}।',
    create: 'Squad তার লুকানো list-এর ওপর নতুন একটা {{cls}} বানিয়ে দেয়। নুসরাত পায় শুধু iterator, list কখনো না।',
    'sort-copy': 'StrikeRateIterator strike rate ধরে sort করে তার নিজের কপি। দলের আসল ব্যাটিং অর্ডারে হাতই পড়ে না।',
    'loop-start': 'প্রতিটা অনুরোধে নুসরাতের loop একই: while (it.hasNext()) announce(it.next().name)।',
    'has-next-yes': 'it.hasNext()? iterator তার cursor দেখে: হ্যাঁ, এরপর {{name}}। true।',
    'skip-ar': 'hasNext()-এর ভেতরেই AllRounderIterator বাদ দেয় {{name}} ({{role}})। বাদ দেওয়ার কাজটা থাকে iterator-এ; নুসরাতের loop সেটা টেরই পায় না।',
    next: 'it.next() দেয়: {{name}}, আর cursor এক ঘর এগোয়। নুসরাত নামটা ডাকে।',
    'has-next-no': 'it.hasNext()? আর কোনো খেলোয়াড় নেই: false। loop শেষ।',
    'l2-ok': 'ঠিক লাইনআপ! +{{coins}}। নুসরাতের loop একটুও বদলায়নি; বদলেছে শুধু সে কোন iterator চেয়েছে।',
    'l2-fail-superOver-order':
      '😵 সুপার ওভারে পুরো দল নেমে গেছে! BattingOrderIterator সবাইকেই দেয়। শুধু অলরাউন্ডার চাইলে সেই iterator লাগবে যে বাকিদের বাদ দেয়: allRounders()।',
    'l2-fail-superOver-sr':
      '😵 সবাই নেমেছে, strike rate অনুযায়ী সাজিয়ে। StrikeRateIterator ক্রম বদলায়, কে থাকবে তা নয়। সুপার ওভারে লাগবে allRounders()।',
    'l2-fail-final-sr':
      '😵 ফাইনালে রহিমের বদলে ওপেন করল তানিয়া। StrikeRateIterator হাঁটে নিজের sort করা কপি ধরে; ফাইনালে লাগবে দলের আসল ব্যাটিং অর্ডার: battingOrder()।',
    'l2-fail-final-ar':
      '😵 ফাইনালে ব্যাট করল মাত্র দুজন! AllRounderIterator অলরাউন্ডার ছাড়া সবাইকে বাদ দেয়। পুরো দলের জন্য চাইতে হবে battingOrder()।',
    'l2-fail-form-order':
      '😵 রহিম যথারীতি ওপেন করল, কিন্তু করিম ভাই চেয়েছিলেন ফর্মে থাকারা আগে। battingOrder() রাখা ক্রমেই চলে; byStrikeRate() হাঁটে sort করা কপি ধরে।',
    'l2-fail-form-ar':
      '😵 নামল শুধু তানিয়া আর রফিক। allRounders() role দেখে ফিল্টার করে; “ফর্ম” মানে সবাই, বেশি strike rate আগে: byStrikeRate()।',
    'level2-done':
      'লেভেল শেষ! তিনটা অনুরোধ, একটাই অপরিবর্তিত loop। দলটা কীভাবে ঘুরতে হবে, সেটা ছিল iterator-দের কাজ, আর list কখনো Squad-এর বাইরে যায়নি।',

    'build-q1':
      'লেগ-স্পিনার বল করতে আসছে, করিম ভাই চান বাঁহাতিদের। এর জন্য এখনো কোনো iterator নেই, তাই আপনি একটা যোগ করবেন। প্রথমে: নতুন কোডটা কী হওয়া উচিত?',
    'wrong-q1-clientIf':
      'তাহলে ফিল্টার আবার client-এ ফিরে যায়: নুসরাতের loop-এ একটা if ঢোকে, আর বাঁহাতি চাওয়া প্রতিটা client সেটা কপি করে। loop-টা সব অনুরোধে একই থাকার কথা।',
    'wrong-q1-squadMethod':
      'তাতে Squad আর Team এডিট হয়, যে পুরোনো কোডের ওপর প্রতিটা অনুরোধ দাঁড়িয়ে আছে। দল ঘোরার নতুন উপায় মানে নতুন একটা iterator class, collection-এ বদল নয়।',
    'build-q2':
      'ঠিক: implements PlayerIterator, তাই নুসরাতের loop একে অন্য যেকোনো iterator-এর মতো ব্যবহার করতে পারবে। কিন্তু Squad-এর list লুকানো। LeftHandedIterator বাঁহাতিদের খুঁজবে কীভাবে?',
    'wrong-q2-readList':
      'squad.players লুকানো, আর আসল কথা সেটাই: যে iterator list-এর ভেতরে হাত দেয়, Squad যেদিন Map-এ যাবে সেদিন সে আবার ভাঙবে। Squad বাইরে যা দেয় সেটাই ব্যবহার করুন: একটা iterator।',
    'wrong-q2-sortList':
      'এ তো লেভেল ১-এর সেই বাগ: দলের আসল list এলোমেলো করলে বাকি সবার ব্যাটিং অর্ডার নষ্ট। iterator শুধু হাঁটে; কিছু সাজায় না।',
    'build-ready':
      'হয়ে গেছে: একটা নতুন class। Squad, Team, পুরোনো ৩টা iterator বা নুসরাতের loop-এ ০ লাইন বদল। “LeftHandedIterator ব্যবহার করুন” চাপুন।',
    'build-done': 'LeftHandedIterator তৈরি। চালান চাপুন: এটা একটা পুরোনো iterator-কে মুড়ে নেয়, আর hasNext()-এর ভেতরেই ডানহাতিদের বাদ দেয়।',
    'idle3-1': 'করিম ভাই: “{{req}}” নুসরাত battingOrder()-কে নতুন iterator-এ মুড়ে নেয়। চালান চাপুন।',
    'idle3-2': 'করিম ভাই: “{{req}}” সেই একই নতুন class, কিন্তু এবার সে মুড়েছে byStrikeRate()। চালান চাপুন।',
    'idle3-3': 'করিম ভাই: “{{req}}” দলে একজন খেলোয়াড় বেড়েছে; কোনো iterator বদলায়নি। চালান চাপুন।',
    'l3-create': 'নুসরাত পুরোনো একটা iterator-কে নতুনটার ভেতরে মুড়ে নেয়: new LeftHandedIterator(squad.{{factory}}())। Squad একটুও বদলায়নি।',
    'l3-loop': 'বরাবরের সেই loop: while (it.hasNext()) announce(it.next().name)। কাউকে যে বাদ দেওয়া হচ্ছে, নুসরাত জানেই না।',
    'lh-skip': 'hasNext()-এর ভেতরে LeftHandedIterator মুড়ে রাখা iterator থেকে খেলোয়াড় নেয়: {{name}}, ডানহাতি, তাই বাদ।',
    'lh-keep': 'এবার আসে {{name}}: বাঁহাতি! এই খেলোয়াড়কে সে found-এ রেখে দেয়, আর hasNext() বলে true।',
    'lh-next': 'it.next() নুসরাতের হাতে দেয়: {{name}}। নুসরাত নামটা ডাকে।',
    'lh-no-more': 'মুড়ে রাখা iterator-এর খেলোয়াড় ফুরিয়েছে, তাই hasNext() বলে false, loop শেষ।',
    'l3-done-1': 'ঠিক লাইনআপ! +{{coins}}। বাঁহাতিরা নামল ব্যাটিং অর্ডারে, আর নুসরাতের loop একজন ডানহাতিকেও দেখেনি।',
    'l3-done-2':
      'ঠিক লাইনআপ! +{{coins}}। সেই একই LeftHandedIterator, এবার StrikeRateIterator-কে মুড়ে: বাঁহাতিরা, বেশি strike rate আগে। iterator একটার ওপর আরেকটা বসানো যায়।',
    'l3-done-3': 'ঠিক লাইনআপ! +{{coins}}। বাবু দলে এল আর নিজে থেকেই তালিকায় উঠে গেল: iterator হাঁটে Squad-এ যা আছে তা-ই ধরে।',
    'level3-done':
      'গেম শেষ! Squad তার list লুকিয়ে রাখে, যেভাবে দরকার সেভাবে iterator সেটা ঘুরে দেখে, আর ঘোরার নতুন উপায় মানে শুধু নতুন একটা iterator class।',
  },

  codeComments: {
    player: 'একজন খেলোয়াড়ের কার্ড: নাম, strike rate, role, ব্যাটিং হাত',
    iterator: 'Iterator: client কীভাবে দলটা ঘুরবে, একবারে একজন',
    concreteIterator: 'ConcreteIterator: প্রত্যেকে list ঘোরার একটা করে উপায় জানে',
    cursor: 'cursor: এরপর কে',
    handOut: 'একজন খেলোয়াড় দাও, cursor এক ঘর এগোও',
    sortedCopy: 'নিজের কপি sort করে: দলের ক্রম যেমন ছিল তেমনই থাকে',
    skipInside: 'বাদ দেওয়া হয় iterator-এর ভেতরে, client-এ নয়',
    aggregate: 'Aggregate: দল কথা দেয় iterator দেবে, list নয়',
    concreteAggregate: 'ConcreteAggregate: নিজের মতো করে খেলোয়াড় রাখে, iterator বানায়',
    hidden: 'private: খেলোয়াড় কীভাবে রাখা, বাইরের কেউ জানে না',
    client: 'Client: নুসরাত, স্কোরার',
    pickOne: 'অনুরোধ অনুযায়ী iterator বাছো…',
    sameLoop: '…loop সবসময় একই',
    withoutIntro: 'কোনো pattern নেই: Squad তার কাঁচা list দিয়ে দেয়',
    exposed: 'public: প্রতিটা client ভেতরে হাত দেয়',
    orderLoop: 'ব্যাটিং অর্ডার: হাতে হাতে index-এর হিসাব',
    indexMath: '0 থেকে শুরু, length-এর আগে থামো: ভুল করা খুব সহজ',
    formLoop: 'ফর্ম: strike rate ধরে sort, আরেকটা হাতে লেখা loop-এ',
    copyFirst: 'আগে কপি, নইলে আসল ব্যাটিং অর্ডার এলোমেলো',
    changed: 'পরের মাসে Squad খেলোয়াড় রাখে জার্সি নম্বর দিয়ে…',
    breaksAll: '…আর পুরোনো ধরন চেনা প্রতিটা loop ভাঙে',
    filterHere: 'ফিল্টার থাকে client-এ, যেখানে দরকার সেখানে কপি করা',
    withoutNext: 'শুধু বাঁহাতি? আরও একটা হাতে লেখা loop',
    withAdd: 'দল ঘোরার নতুন উপায় = একটা নতুন iterator class',
    sameInterface: 'বাকি সবার মতো একই iterator interface',
    wrapsAny: 'যেকোনো iterator মুড়ে নেয়: ব্যাটিং অর্ডার, strike rate…',
    pull: 'মুড়ে রাখা iterator-এর কাছে পরের খেলোয়াড় চাও',
    skipRight: 'বাঁহাতি রাখো; ডানহাতিরা এখানেই বাদ',
    othersSame: 'Squad, Team আর পুরোনো iterator: একটা লাইনও এডিট নয়',
    withUse: 'পুরোনো iterator মুড়ে নাও; loop একই থাকে',
    wrapUse: 'বাঁহাতিরা, ব্যাটিং অর্ডারে',
    withZero: 'পুরোনো কোড এডিট: ০ লাইন। pattern ছাড়া: প্রতিটা client-এ আরও একটা loop',
  },

  compare: {
    without: {
      title: 'প্রতিটা client কাঁচা list-এর ওপর loop চালায়',
      points: [
        'Squad তার list public রাখে, তাই প্রতিটা client নিজের মতো করে এর ওপর loop লেখে।',
        'প্রতিটা ধরনের হাঁটা (ক্রমে, strike rate ধরে, শুধু অলরাউন্ডার) হাতে হাতে index, sort বা ফিল্টার আবার লেখে।',
        'এক ধাপ ভুল হলেই কেউ বাদ পড়ে, list-এর শেষ পেরিয়ে পড়া হয়, বা সবার ভাগের list জায়গায় বসেই sort হয়ে যায়।',
        'Squad খেলোয়াড় রাখার ধরন বদলালে (array থেকে Map) একসাথে সব client-এর loop ভাঙে।',
      ],
    },
    with: {
      title: 'Squad বাইরে দেয় iterator',
      points: [
        'Squad তার list লুকিয়ে রাখে, আর দেয় iterator: battingOrder(), byStrikeRate(), allRounders()।',
        'প্রতিটা iterator-এর একই দুটো method, hasNext() আর next(), তাই client-এর loop কখনো বদলায় না।',
        'sort আর বাদ দেওয়ার কাজ থাকে iterator-এর ভেতরে; দলের আসল ক্রমে হাত পড়ে না।',
        'নতুন ধরনের হাঁটা (বাঁহাতি) মানে একটা নতুন iterator class। সে পুরোনো একটাকে মুড়েও নিতে পারে, Squad-এ ০ এডিট।',
      ],
    },
    benefit:
      'Iterator আলাদা করে দেয় collection রাখা আর collection ঘোরা। collection ভেতরে বদলাতে পারে, ঘোরার নতুন উপায় নতুন class হিসেবে যোগ হয়, আর প্রতিটা client রাখে একই সহজ loop: while (it.hasNext()) use(it.next())।',
    whenToUse: [
      'client-দের একটা collection-এর element-গুলো ঘুরে দেখতে হবে, কিন্তু সেটা কীভাবে রাখা (array, Map, tree, database-এর পাতা) তা জানা বা তার ওপর নির্ভর করা চলবে না।',
      'একই collection কয়েকভাবে ঘুরতে হবে (ক্রমে, sort করে, ফিল্টার করে), আর আপনি চান না প্রতিটা client সেটা আবার লিখুক।',
      'আলাদা আলাদা collection বা ঘোরার ধরনের জন্য একটাই loop চান। (বেশিরভাগ ভাষায় এটা আগে থেকেই আছে: for-of, foreach, Python-এর generator, Rust-এর Iterator।)',
    ],
  },
}

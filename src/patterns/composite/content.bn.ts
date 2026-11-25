import type { DeepPartial } from '@/types/pattern'
import type { CompositeContent } from './content.en'

// Technical terms stay in English (Composite, Leaf, Component, class, interface…).
// Never glue a Bangla suffix onto a {{placeholder}} ("{{node}}-এর" reads wrong); rephrase instead.
// Anything missing here falls back to content.en.ts automatically.
export const bn: DeepPartial<CompositeContent> = {
  title: 'Composite',
  tagline: 'একটা ব্যাগ, ব্যাগের ভেতরে ব্যাগ, নাকি একটা ডিম: সবার কাছে দাম জিজ্ঞেস করুন একইভাবে।',
  intent:
    'Object-গুলোকে গাছের মতো (tree) সাজান, আর client যেন একক object (leaf) আর object-এর দল (composite), দুটোকেই একটা interface দিয়ে একইভাবে ব্যবহার করতে পারে। Composite নিজের কাজটা করে প্রতিটা child-কে জিজ্ঞেস করে, তাই কাজটা নিজে নিজেই recursion করে গাছের নিচ পর্যন্ত নামে।',

  scenario: {
    title: 'কারওয়ান বাজারে করিমের বাজার ডেলিভারি',
    paragraphs: [
      'করিম চালায় “বাজার সদাই”, ছোট একটা ডেলিভারি সার্ভিস: কাস্টমার বাজারের লিস্ট পাঠায়, করিম কারওয়ান বাজার থেকে কিনে বাসায় পৌঁছে দেয়। তারপর তার অ্যাপ রসিদগুলো যোগ করে কাস্টমারকে বিল করে।',
      'কিন্তু বাজার কখনো সমান হয়ে আসে না। মাছ যায় মাছের ব্যাগে, সবজি সবজির ব্যাগে, কাঁচামরিচ সবজির ব্যাগের ভেতরে ছোট্ট একটা পলিথিনে, আর ডিম আলগা ওপরে।',
      'অ্যাপের billTotal()-এ একটা loop আছে আলগা জিনিসের জন্য, আরেকটা ব্যাগের জিনিসের জন্য। তারপর এলো ব্যাগের ভেতরে ব্যাগ…',
    ],
    problem:
      'হাতে লেখা loop ঠিক ততটাই গভীরে যায়, যতটা কেউ লিখেছে। প্রতিটা নতুন স্তরের জন্য আরেকটা কপি-পেস্ট করা loop লাগে, আর তার চেয়ে গভীরের সবকিছু চুপচাপ বাদ পড়ে। ফলে করিম কম বিল করে, আর বাকিটা নিজের পকেট থেকে দেয়।',
  },

  visual: {
    // Pattern-role and class names stay in English on purpose.
    levelsLabel: 'গেমের লেভেল',
    levelLabel: 'লেভেল {{n}}',
    level1Title: 'প্রতি স্তরে একটা loop',
    level2Title: 'সবার জন্য একটাই getPrice()',
    level3Title: 'ঈদের গিফট বক্স এলো',
    level1Goal:
      'এখনো কোনো pattern নেই: billTotal()-এ ব্যাগের প্রতিটা স্তরের জন্য একটা করে nested loop লাগে। প্রতিটা অর্ডারে কয়টা loop চলবে বাছুন, নয়তো আরও গভীর একটা কপি-পেস্ট করুন।',
    level2Goal:
      'এবার প্রতিটা জিনিস আর প্রতিটা ব্যাগের একই getPrice() আছে। কোন node-এ কল করবেন বেছে প্রশ্নের উত্তর দিন, আর দেখুন recursion কীভাবে ভেতরে হাঁটে।',
    level3Goal: 'কাস্টমাররা ৳৫০ র‍্যাপিং চার্জসহ ঈদের গিফট বক্স চায়। পুরোনো একটা class-ও এডিট না করে নতুন এই container যোগ করুন।',
    locked: 'লক করা',
    earned: 'বিল হয়েছে',
    restart: 'গেম আবার শুরু',
    orderOf: 'অর্ডার {{n}}/{{total}}',

    clientRole: 'Client',
    appTitle: 'বাজার সদাই অ্যাপ',
    receipts: 'রসিদ',
    asks: 'জানতে চায়',
    askWhole: 'আমার পুরো বিল কত?',
    askPart: 'দাম কত হলো: {{target}}?',
    loopsLabel: 'কয়টা nested loop চলবে?',
    loopsN: '{{n}}টা loop',
    writeLoop: '+ loop {{n}}',
    writeHint: '✍️ = এমন loop এখনো নেই: আরও গভীর একটা কপি-পেস্ট করুন',
    loopsWritten: 'billTotal()-এ loop',
    pickLabel: 'getPrice() কল করুন…',

    noPatternRole: 'Pattern ছাড়া',
    loopDesc1: 'আলগা জিনিস',
    loopDesc2: 'ব্যাগের জিনিস',
    loopDesc3: 'ব্যাগের ভেতরে ব্যাগ',
    loopDesc4: 'আরও এক স্তর নিচে',
    copiedTag: 'কপি-পেস্ট',
    sumLabel: 'যোগফল',
    skippedTag: '{{n}}টা গোনাই হয়নি',
    componentRole: 'Component',
    leafRole: 'Leaf',
    compositeRole: 'Composite',
    newTag: 'নতুন',
    noClassYet: 'class এখনো নেই',
    stackLabel: 'Call stack',
    stackEmpty: 'খালি: “বিল করুন” চাপুন',

    dataRole: 'Data',
    treeRole: 'Object tree',
    billed: 'বিল: {{amount}}',
    shortBy: '{{amount}} কম',

    order: 'অর্ডার',
    juteBag: 'পাটের ব্যাগ',
    fishBag: 'মাছের ব্যাগ',
    vegBag: 'সবজির ব্যাগ',
    chiliBag: 'মরিচের পলিথিন',
    bigBag: 'বড় ব্যাগ',
    meatBag: 'মাংসের ব্যাগ',
    spiceBag: 'মসলার প্যাকেট',
    giftBox: 'ঈদের গিফট বক্স',
    eggs: 'ডিম',
    ilish: 'ইলিশ',
    rui: 'রুই',
    dal: 'ডাল',
    potato: 'আলু',
    onion: 'পেঁয়াজ',
    greenChili: 'কাঁচামরিচ',
    salt: 'লবণ',
    oil: 'তেল',
    beef: 'গরুর মাংস',
    garlic: 'রসুন',
    ginger: 'আদা',
    semai: 'সেমাই',
    sugar: 'চিনি',
    milk: 'দুধ',
    mishti: 'মিষ্টি',
    rice: 'চাল',
    ghee: 'ঘি',

    builderTitle: 'GiftBox container যোগ করুন',
    builderStep1: 'ধাপ ১ · কী লিখবেন?',
    builderStep2: 'ধাপ ২ · getPrice() কী ফেরত দেবে?',
    q1: 'বাজারের tree-তে গিফট বক্স কীভাবে যোগ করবেন?',
    q1Class: '১টা নতুন class: GiftBox',
    q1If: 'Bag-এর ভেতরে if (giftBox)',
    q1Loop: 'billTotal()-এ আরেকটা loop',
    q2: 'GiftBox, BazarItem implement করে। তার getPrice() কী ফেরত দেবে?',
    q2Recurse: 'র‍্যাপিং চার্জ + প্রতিটা child.getPrice()',
    q2Fee: 'শুধু ৳৫০ র‍্যাপিং চার্জ',
    q2Field: 'র‍্যাপিং চার্জ + প্রতিটা child.price',
    useGiftBox: 'GiftBox ব্যবহার করুন',
    zeroEdits: 'পুরোনো class এডিট: ০ লাইন',

    billButton: 'বিল করুন',
    nextOrder: 'পরের অর্ডার',
    finishLevel: 'লেভেল শেষ করুন',
    tryAgain: 'আবার চেষ্টা করুন',

    levelDone: 'লেভেল {{n}} শেষ!',
    nextLevel: 'পরের লেভেল',
    replayLevel: 'এই লেভেল আবার খেলুন',
    playAgain: 'লেভেল ১ থেকে আবার খেলুন',
    l1Teaser:
      'তারপর এক কাস্টমার পাঠাল ব্যাগভর্তি একটা টিফিন ক্যারিয়ার, তার এক ব্যাগে মসলার প্যাকেট, তার ভেতরে ছোট্ট পলিথিনে এলাচ… মানে ৫ নম্বর nested loop, আর পরের অর্ডারে ৬ নম্বর। নিশ্চয়ই এর চেয়ে ভালো উপায় আছে…',
    l2Summary:
      'একটা loop-ও লিখতে হয়নি। জিনিস আর ব্যাগ একই getPrice() শেয়ার করে, ব্যাগ শুধু তার child-দের জিজ্ঞেস করে, আর recursion নিজেই প্রতিটা স্তরে পৌঁছে গেছে: একটা ব্যাগ, ব্যাগের ভেতরে ব্যাগ, পুরো অর্ডার।',
    recapTitle: 'যা শিখলেন',
    recap1: 'হাতে লেখা loop একটা নির্দিষ্ট গভীরতা পর্যন্তই যায়: প্রতিটা নতুন স্তর মানে কোড এডিট, আর গভীরের জিনিস বাদ পড়ে।',
    recap2: 'Composite, leaf আর container-কে একটাই interface দেয়। Container উত্তর দেয় child-দের জিজ্ঞেস করে, তাই একটা কলেই পুরো tree ঘোরা হয়ে যায়।',
    recap3: 'নতুন container (GiftBox) মানে একই interface implement করা একটা নতুন class। পুরোনো class আর client কোড: ০ লাইন এডিট।',

    nusrat: 'নুসরাত',
    mitu: 'মিতু',
    rahim: 'রহিম',
    karim: 'করিম',

    whatsHappening: 'এখন কী ঘটছে',
    note: 'বাজার সদাই, এর কাস্টমার আর দামগুলো শুধু উদাহরণের জন্য বানানো।',
  },

  steps: {
    tutorial:
      'নুসরাতের বাজারে খরচ হয়েছে {{amount}}: ডিম, আর একটা মাছের ব্যাগ। billTotal()-এ আগে থেকেই ২টা loop আছে (আলগা জিনিস, তারপর ব্যাগের জিনিস), তাই “২টা loop” আমরাই বেছে দিয়েছি। “বিল করুন” চাপুন, আর দেখুন কোন কোন জিনিস গোনা হয়।',
    idle1: 'এই অর্ডারের রসিদ যোগ করলে হয় {{amount}}। ব্যাগগুলো কত গভীর? billTotal() কয়টা nested loop চালাবে, বাছুন।',
    picked1: '{{n}}টা loop বাছা হলো। “বিল করুন” চাপুন, দেখুন কোন কোন জিনিস গোনা হয়।',
    'picked1-write': 'billTotal()-এ loop আছে মাত্র {{have}}টা, তাই এক স্তর গভীরে {{n}} নম্বর loop কপি-পেস্ট করতে হবে। “বিল করুন” চাপুন।',
    'l1-call': 'billTotal(order) কল হলো। এ পর্যন্ত যতগুলো স্তরের কথা কেউ ভেবেছে, প্রতিটার জন্য এতে একটা করে hard-coded loop আছে।',
    'l1-write':
      'কপি-পেস্টের পালা: ঠিক ওপরেরটার মতো আরেকটা for-loop, এক স্তর গভীরে। নতুন ধরনের প্রতিটা nesting-এ billTotal() আরও বড় হয়।',
    'l1-loop': 'Loop {{k}} ({{desc}}) গুনল: {{items}}। +{{added}}। এখন পর্যন্ত যোগফল {{sum}}।',
    'l1-loop-empty': 'Loop {{k}} ({{desc}}) এই স্তরে কিছুই পেল না। এখন পর্যন্ত যোগফল {{sum}}।',
    'l1-skip': 'এগুলো আছে কোনো loop যতটা নামে তার চেয়েও এক স্তর নিচে: {{items}}। ওই ব্যাগ কোনো loop খোলেই না, তাই কোনো সাড়াশব্দ ছাড়াই বাদ পড়ল!',
    'l1-total': 'return sum: billTotal() বলছে {{sum}}। সব ব্যাগ খোলা হয়েছে কি না, সে জানেই না।',
    'l1-ok': 'বিল ঠিক আছে: {{amount}}! কাজ হলো, কিন্তু শুধু এই কারণে যে ঠিক এই গভীরতার জন্য একটা loop আছে। এ পর্যন্ত loop {{loops}}টা।',
    'l1-short':
      '😵 অ্যাপ বিল করল {{sum}}, অথচ রসিদে আছে {{amount}}। বাকি {{short}} করিমকে নিজের পকেট থেকে দিতে হলো। নির্দিষ্ট সংখ্যক loop দিয়ে ব্যাগের ভেতরের প্রতিটা ব্যাগে কখনোই পৌঁছানো যায় না।',
    'level1-done':
      'লেভেল শেষ! প্রতিটা গভীর ব্যাগের জন্য আরেকটা কপি-পেস্ট করা loop লাগল, আর পরের অর্ডার সবসময়ই আরও এক স্তর গভীর হতে পারে। সবচেয়ে ভেতরের loop-এর লাইনটা দেখুন।',

    idle2: 'প্রশ্নের উত্তর দেয় যে node, সেটা বাছুন। একটা জিনিস হোক বা ব্যাগভর্তি ব্যাগ, প্রতিটা node-এর একই getPrice() আছে।',
    ready: '{{target}} বাছা হলো: একটা getPrice() কলই যথেষ্ট। “বিল করুন” চাপুন, দেখুন recursion কীভাবে ভেতরে হাঁটে।',
    'wrong-leaf': '{{picked}} একটা Leaf: তার getPrice() শুধু নিজের দামটা ফেরত দেয়, {{price}}। প্রশ্ন ছিল এটা নিয়ে: {{target}}।',
    'wrong-part':
      '{{picked}} তো পুরোটার একটা অংশ মাত্র (পুরোটা: {{target}})। কোনো node-এ getPrice() কল করলে শুধু সেই node আর তার ভেতরের সবকিছুর দাম আসে, এর বেশি না।',
    'wrong-whole': '{{picked}} ধরে রেখেছে আরও অনেক কিছু, শুধু {{target}} না: এর getPrice() ভেতরের সবকিছুই যোগ করবে। ছোট node-টা বাছুন।',
    'wrong-other': '{{picked}} অন্য একটা ব্যাগ। প্রতিটা node নিজের আর নিজের child-দের দাম দেয়, তাই সরাসরি এটাতেই getPrice() কল করুন: {{target}}।',
    call: 'picked.getPrice() কল হলো, node: {{target}}। এটা leaf না ব্যাগ, client কখনো দেখে না: কলটা একই।',
    open: '{{node}} একটা Bag (Composite)। সে শুরু করে ৳০ থেকে, আর নিজের প্রতিটা child-কে দাম জিজ্ঞেস করে।',
    recurse: '{{node}} নিজেও একটা Bag, তাই child.getPrice() এক স্তর নিচে নামে আর একই method আবার চলে। Parent শুধু একটা সংখ্যার অপেক্ষায় থাকে।',
    leaf: '{{node}} একটা Leaf (Item): getPrice() সোজা ফেরত দেয় {{price}}। চলতি যোগফল ({{parent}}): {{sum}}।',
    'bag-total': '{{node}} প্রতিটা child-কে জিজ্ঞেস করা শেষ, তাই যে কল করেছিল তাকে ফেরত দেয় {{price}}।',
    done: 'উত্তর ফিরে এলো: {{target}} = {{total}}। +{{amount}}। একটা কল, আর recursion নিজেই প্রতিটা স্তরে পৌঁছে গেল।',
    'level2-done': 'লেভেল শেষ! একটা loop-ও লিখতে হয়নি: একই getPrice() দাম বের করল একটা ব্যাগের, ব্যাগের ভেতরের ব্যাগের, আর পুরো অর্ডারের।',

    'need-build': 'এই অর্ডারে একটা ঈদের গিফট বক্স আছে, কিন্তু GiftBox class এখনো নেই। 🔨 গিফট বক্স টাইলে ট্যাপ করে বানিয়ে নিন।',
    'build-q1': 'প্রথমে: বাজারের tree-তে গিফট বক্স কীভাবে যোগ করবেন?',
    'wrong-q1-if':
      'তাহলে Bag-কে সব ধরনের container-এর কথা জানতে হবে, আর নতুন কিছু এলেই তাকে এডিট করতে হবে। Composite আছেই যাতে পুরোনো class-এ কখনো হাত দিতে না হয়।',
    'wrong-q1-loop': 'এটা তো আবার লেভেল ১: আরও একটা কেসের জন্য আরও একটা loop, আর পরের container এলে আবার একটা।',
    'build-q2': 'GiftBox, BazarItem implement করে। এবার: তার getPrice() কী ফেরত দেবে?',
    'wrong-q2-fee': 'তাহলে ভেতরের সেমাই আর চিনি তো ফ্রি! Container-কে নিজের চার্জের সাথে child-দের দামও যোগ করতে হয়।',
    'wrong-q2-field': 'Bag-এর কোনো price field নেই: তার দাম হিসাব করে বের করতে হয়। Leaf হোক বা ব্যাগ, সব BazarItem-এ কাজ করে শুধু getPrice()।',
    'build-ready': 'হয়ে গেছে: একটা নতুন class, পুরোনো কিছুই এডিট হয়নি। “GiftBox ব্যবহার করুন” চাপুন।',
    'build-done': 'GiftBox তৈরি, আর পুরোনো প্রতিটা Bag এখনই এটা রাখতে পারে। এবার কোন node-এর দাম চাই বেছে “বিল করুন” চাপুন।',
    'gift-make':
      'new GiftBox(…) অন্য যেকোনো BazarItem-এর মতোই add() দিয়ে ব্যাগে ঢুকল। Bag class গিফট বক্সের নামও শোনেনি, আর শোনার দরকারও নেই।',
    'gift-open': '{{node}} হলো নতুন GiftBox: সে শুরু করে ৳৫০ র‍্যাপিং চার্জ দিয়ে, তারপর ঠিক Bag-এর মতোই প্রতিটা child-কে জিজ্ঞেস করে।',
    'gift-total': '{{node}} ফেরত দেয় {{price}}: র‍্যাপিং চার্জ + ভেতরের জিনিস। Parent-এর কাছে এটা স্রেফ আরেকটা BazarItem।',
    'gift-done': 'বিল হলো: {{target}} = {{total}}! +{{amount}}। পুরোনো Bag আর Item কোড যেমন ছিল তেমনই চলল: ০ লাইন এডিট।',
    'level3-done':
      'গেম শেষ! Composite-এ একটা কলই যেকোনো গভীরতার tree ঘুরে আসে, আর নতুন ধরনের container মানে getPrice() জানা আরও একটা class মাত্র।',
  },

  codeComments: {
    component: 'Component: প্রতিটা জিনিস আর প্রতিটা ব্যাগ যা পারে',
    leaf: 'Leaf: বাজারের একটা জিনিস',
    leafPrice: 'leaf শুধু নিজের দামটা জানে',
    composite: 'Composite: যে ব্যাগে জিনিস বা অন্য ব্যাগ থাকে',
    anyChild: 'child হতে পারে Item, বা আরেকটা Bag',
    recurse: 'প্রতিটা child-কে জিজ্ঞেস করো, leaf হোক বা ব্যাগ: এটাই recursion',
    bagTotal: 'ব্যাগের দাম = child-দের দামের যোগফল',
    usage: 'Client কোড: tree বানানো',
    bagInBag: 'ব্যাগের ভেতরে ব্যাগ, বাড়তি কোনো কোড লাগে না',
    anyNode: 'যেকোনো node: একটা জিনিস, একটা ব্যাগ, পুরো অর্ডার',
    sameCall: 'গভীরতা যতই হোক, কলটা একই',
    withoutIntro: 'Pattern ছাড়া: জিনিস আর ব্যাগের গঠন আলাদা',
    loopLoose: 'loop ১: আলগা জিনিস',
    loopBags: 'loop ২: ব্যাগের জিনিস',
    withoutCopy: 'ব্যাগের ভেতরে ব্যাগ? একটা nested loop কপি-পেস্ট',
    copyAgain: 'আর আরও এক স্তর নিচের জন্য আবার…',
    withoutTodo: 'এর চেয়ে গভীর ব্যাগ খোলাই হয় না: চুপচাপ বাদ',
    withoutUse: 'একটা অর্ডারের বিল',
    shortBill: 'loop কম = বিলও কম',
    withAdd: 'গিফট বক্স = একটা নতুন Composite class',
    wrapFee: 'শুধু গিফট বক্সেই র‍্যাপিং চার্জ',
    sameRecursion: 'Bag-এর মতোই একই recursion',
    withSame: 'পুরোনো Bag আর Item কোড যেমন আছে তেমনই এর সাথে চলে',
    justAChild: 'Bag-এর কাছে এটা স্রেফ আরেকটা child',
    billUnchanged: 'বিলের কল একটুও বদলায়নি',
    withZero: 'পুরোনো class এডিট: ০। Composite ছাড়া: billTotal()-এ আরও একটা loop',
  },

  compare: {
    without: {
      title: 'ব্যাগের প্রতিটা স্তরের জন্য হাতে লেখা loop',
      points: [
        'জিনিস আর ব্যাগের গঠন আলাদা, তাই কোডকে আলাদা আলাদা করে দেখতে হয় কোনটা কী।',
        'প্রতিটা স্তরের জন্য আরেকটা nested loop লাগে: ব্যাগ, ব্যাগের ভেতরে ব্যাগ, তার ভেতরে ব্যাগ…',
        'শেষ loop-এর চেয়ে গভীরের সবকিছু চুপচাপ বাদ পড়ে, আর বিল কম আসে।',
        'নতুন ধরনের container (গিফট বক্স) মানে আবার billTotal() এডিট।',
      ],
    },
    with: {
      title: 'জিনিস আর ব্যাগ, দুজনেরই একটাই getPrice()',
      points: [
        'Leaf (Item) আর Composite (Bag) একই BazarItem interface implement করে।',
        'ব্যাগ প্রতিটা child-কে getPrice() জিজ্ঞেস করে, তাই কলটা নিজে নিজেই যেকোনো গভীরতায় নামে।',
        'Client যেকোনো node-এ getPrice() কল করে: একটা জিনিস, একটা ব্যাগ, বা পুরো অর্ডার।',
        'নতুন container (GiftBox) মানে একটা নতুন class; পুরোনো class আর client অক্ষত থাকে।',
      ],
    },
    benefit:
      'Composite “এটা কত গভীরে যায়?” প্রশ্নটাই মুছে দেয়। Container-এর দাম যেহেতু একটা জিনিসের মতো করেই বের হয়, একটা কলেই যেকোনো আকারের tree সামলানো যায়, আর নতুন ধরনের leaf বা container যোগ করতে tree-ঘোরা কোডে হাত দিতে হয় না।',
    whenToUse: [
      'আপনার ডেটা অংশ-আর-পুরো (part-whole) ধরনের tree: জিনিসভর্তি ব্যাগ, ফাইলভর্তি ফোল্ডার, সাব-মেনুসহ মেনু, কর্মীসহ টিম।',
      'Client একটা object আর object-এর দলকে একইভাবে ব্যবহার করবে (দাম, সাইজ, render, গোনা…)।',
      'দেখছেন প্রতিটা স্তরের জন্য nested loop বা instanceof চেক লিখে যাচ্ছেন।',
    ],
  },
}

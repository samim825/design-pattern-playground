import type { DeepPartial } from '@/types/pattern'
import type { BridgeContent } from './content.en'

// Technical terms stay in English (Bridge, Abstraction, Implementor, class, interface…).
// Never glue a Bangla suffix onto a {{placeholder}} ("{{name}}-এর" reads wrong); rephrase instead.
// Anything missing here falls back to content.en.ts automatically.
export const bn: DeepPartial<BridgeContent> = {
  title: 'Bridge',
  tagline: 'দুই দিকে বদলায় এমন জিনিস, একটা সেতুর দুই পাশে রাখুন: যেকোনো পাশে যোগ করুন, class গুণ হয়ে বাড়বে না।',
  intent:
    'যে class দুইভাবে বদলায়, তাকে দুটো আলাদা hierarchy-তে ভাগ করুন: abstraction (কী করবেন) আর implementation (কীভাবে হবে)। Abstraction একটা implementor-এর reference রাখে, এটাই bridge, আর নিচের স্তরের কাজটা তাকে delegate করে। ফলে দুই পাশ আলাদা আলাদাভাবে বাড়তে পারে।',

  scenario: {
    title: 'রহিমের হাট বাজারে নোটিফিকেশন',
    paragraphs: [
      'রহিম চালায় হাট বাজার, ঢাকার একটা অনলাইন মুদি দোকান। তাদের অ্যাপ তিন রকম মেসেজ পাঠায়: কাস্টমার পেমেন্ট করলে OTP, অফার থাকলে প্রোমো (যেমন ঈদের আগে ২০% ছাড়), আর অর্ডার রওনা দিলে অ্যালার্ট।',
      'কাস্টমাররা মেসেজ পড়ে আলাদা আলাদা জায়গায়: কেউ সারাদিন পুশ নোটিফিকেশন দেখে, কেউ শুধু SMS, আর অফিসগুলো চায় ইমেইল। তাই প্রতিটা মেসেজ টাইপকে প্রতিটা চ্যানেলে চলতে হবে।',
      'প্রথম ডেভেলপার প্রতিটা জোড়ার জন্য একটা করে class লিখেছিল: OtpSms, PromoEmail, AlertPush… আর এখন কাস্টমাররা হোয়াটসঅ্যাপও চাইছে।',
    ],
    problem:
      '৩টা মেসেজ টাইপ × ৩টা চ্যানেল মানে এখনই ৯টা class, প্রতিটা অন্য দুটো থেকে কপি-পেস্ট করা। হোয়াটসঅ্যাপ এলে আরও ৩টা, নতুন একটা মেসেজ টাইপ এলে আরও ৪টা, আর SMS কোডে একটা ফিক্স করতে হয় ৩টা আলাদা class-এ।',
  },

  visual: {
    // Pattern-role and class names stay in English on purpose.
    levelsLabel: 'গেমের লেভেল',
    levelLabel: 'লেভেল {{n}}',
    level1Title: 'প্রতি জোড়ায় একটা class',
    level2Title: 'একটা bridge বানান',
    level3Title: 'হোয়াটসঅ্যাপ এলো',
    level1Goal:
      'এখনো কোনো pattern নেই: প্রতিটা class একটা মেসেজ টাইপ একটা চ্যানেলেই পাঠায়। প্রত্যেক কাস্টমারের জন্য ঠিক class-টা বাছুন, নয়তো নতুন একটা কপি-পেস্ট করুন।',
    level2Goal: 'এবার মেসেজ টাইপ আর চ্যানেল আলাদা। প্রত্যেক কাস্টমারের জন্য একটা টাইপ আর একটা চ্যানেল বাছুন: যেকোনো টাইপ যেকোনো চ্যানেলে চলে।',
    level3Goal: 'কাস্টমাররা হোয়াটসঅ্যাপ চায়। পুরোনো একটা class-ও এডিট না করে সব মেসেজ টাইপের জন্য এটা যোগ করুন।',
    locked: 'লক করা',
    earned: 'অর্ডার',
    restart: 'গেম আবার শুরু',
    orderOf: 'মেসেজ {{n}}/{{total}}',

    clientRole: 'Client',
    appTitle: 'হাট বাজার অ্যাপ',
    needs: 'চায়',
    shelfLabel: 'কোন class পাঠাবে, বাছুন',
    writeHint: '✍️ = এমন class এখনো নেই: নতুন একটা কপি-পেস্ট করুন',
    classesSoFar: 'জোড়া-class লেখা হয়েছে',
    allPairs: '৯টা জোড়ার জন্য লাগবে',
    typeLabel: 'মেসেজ টাইপ (Abstraction)',
    channelLabel: 'চ্যানেল (Implementor)',
    classMath: '{{types}} টাইপ + {{channels}} চ্যানেল = {{sum}}টা class',
    vsPairs: '{{pairs}}টা নয়',

    noPatternRole: 'Pattern ছাড়া',
    whatLabel: 'কী বলবে',
    howLabel: 'কীভাবে পাঠাবে',
    weldedTag: 'এক class-এ জোড়া লাগানো',
    copiedTag: 'কপি-পেস্ট',
    abstractionRole: 'Abstraction',
    extendsLabel: 'extends',
    bridgeLabel: 'Bridge field',
    pickType: 'একটা মেসেজ টাইপ বাছুন…',
    pickChannel: 'একটা চ্যানেল বাছুন…',

    serviceRole: 'Service',
    implementorRole: 'ConcreteImplementor',
    implementsLabel: 'implements',
    phoneLabel: 'কাস্টমারের ফোন',
    checksHere: 'এখানে দেখে',
    delivered: 'পৌঁছেছে',
    missed: 'মিস হলো',

    otp: 'OTP',
    promo: 'প্রোমো',
    alert: 'অ্যালার্ট',
    sms: 'SMS',
    email: 'ইমেইল',
    push: 'পুশ',
    whatsapp: 'হোয়াটসঅ্যাপ',
    msgOtp: 'হাট বাজার OTP: {{code}}',
    msgPromo: 'ঈদ অফার: বাজারে ২০% ছাড়!',
    msgAlert: 'আপনার অর্ডার রওনা দিয়েছে',

    builderTitle: 'হোয়াটসঅ্যাপ চ্যানেল যোগ করুন',
    builderStep1: 'ধাপ ১ · কী লিখবেন?',
    builderStep2: 'ধাপ ২ · ভেতরে কী থাকবে?',
    q1: 'তিনটা মেসেজ টাইপের জন্যই হোয়াটসঅ্যাপ কীভাবে যোগ করবেন?',
    q1Channel: '১টা class: WhatsAppChannel',
    q1Pairs: '৩টা class: OtpWhatsApp…',
    q1Edit: 'প্রতিটা টাইপে if (whatsApp)',
    q2: 'WhatsAppChannel, Channel implement করে। তাকে কী জানতে হবে?',
    q2How: 'শুধু টেক্সট কীভাবে পাঠাতে হয়',
    q2Texts: 'OTP, প্রোমো, অ্যালার্টের লেখা',
    q2Types: 'কোন টাইপ তাকে কল করছে',
    newTag: 'নতুন',
    useChannel: 'WhatsAppChannel ব্যবহার করুন',
    zeroEdits: 'পুরোনো class এডিট: ০ লাইন',

    sendButton: 'পাঠান',
    nextMessage: 'পরের মেসেজ',
    finishLevel: 'লেভেল শেষ করুন',
    tryAgain: 'আবার চেষ্টা করুন',

    levelDone: 'লেভেল {{n}} শেষ!',
    nextLevel: 'পরের লেভেল',
    replayLevel: 'এই লেভেল আবার খেলুন',
    playAgain: 'লেভেল ১ থেকে আবার খেলুন',
    l1Teaser:
      'তারপর রহিম শুনল: “কাস্টমাররা হোয়াটসঅ্যাপও চায়।” মানে OtpWhatsApp, PromoWhatsApp আর AlertWhatsApp: আরও তিনটা কপি-পেস্ট করা class, আর পরে চতুর্থ কোনো চ্যানেল এলে আবার তিনটা। নিশ্চয়ই এর চেয়ে ভালো উপায় আছে…',
    l2Summary:
      'ছয়টা ছোট class দিয়েই নয়টা জোড়া হয়ে গেল। প্রতিটা মেসেজ টাইপ শুধু বলেছে কী পাঠাতে হবে, প্রতিটা চ্যানেল শুধু জানে কীভাবে, আর bridge field runtime-এ দুজনকে জুড়ে দিয়েছে।',
    recapTitle: 'যা শিখলেন',
    recap1: 'দুটো আলাদা বদলানো জিনিস এক class hierarchy-তে মেশালে class গুণ হয়ে বাড়ে: টাইপ × চ্যানেল।',
    recap2: 'Bridge এদের আলাদা করে: abstraction (মেসেজ টাইপ) একটা implementor (চ্যানেল) রাখে আর কাজটা তাকে delegate করে।',
    recap3: 'নতুন চ্যানেল বা নতুন টাইপ মানে নিজের পাশে একটা নতুন class: ৩ × ৪ = ১২-র বদলে ৩ + ৪ = ৭।',

    nusrat: 'নুসরাত',
    karim: 'করিম',
    mitu: 'মিতু',

    whatsHappening: 'এখন কী ঘটছে',
    note: 'হাট বাজার আর এর কাস্টমাররা শুধু উদাহরণের জন্য বানানো।',
  },

  steps: {
    tutorial:
      'নুসরাত {{amount}} পেমেন্ট করছে, তার দরকার SMS দিয়ে OTP। OtpSms class আগে থেকেই আছে, তাই আমরাই বেছে দিয়েছি। “পাঠান” চাপুন, আর দেখুন একটা class কীভাবে দুটো কাজই করে।',
    idle1: 'এবারের কাস্টমার {{name}}। দরকার {{channel}} দিয়ে {{type}} মেসেজ। ঠিক এই জোড়ার class-টা বাছুন, নয়তো নতুন একটা লিখুন (✍️)।',
    picked1: '{{cls}} বাছা হয়েছে। “পাঠান” চাপুন, দেখুন কাস্টমার কী পায়।',
    'picked1-write': '{{cls}} নামে কোনো class এখনো নেই, তাই একটা কপি-পেস্ট করতে হবে। “পাঠান” চাপুন।',
    'l1-pick': 'new {{cls}}(): একটাই class, যে ঠিক করে কী বলবে আর কীভাবে পাঠাবে, দুটোই।',
    'l1-write':
      '{{cls}} এখনো নেই: এক class থেকে {{type}} মেসেজের লেখা আর আরেকটা থেকে {{channel}} কোড কপি করুন। জোড়া-class হলো মোট {{count}}টা।',
    'l1-send': 'কাস্টমার {{name}}, তার জন্য {{cls}}.send() কল হলো।',
    'l1-format-ok': 'সে {{type}} মেসেজ লিখল: “{{text}}”।',
    'l1-format-bad': 'সে লিখল {{gotType}} মেসেজ: “{{text}}”। কিন্তু দরকার ছিল {{type}} মেসেজ!',
    'l1-deliver-ok': '…আর পাঠাল {{channel}} দিয়ে, গেটওয়ের কোডও ওই একই class-এ জোড়া লাগানো।',
    'l1-deliver-bad': '…আর পাঠাল {{gotChannel}} দিয়ে। কিন্তু কাস্টমার তো দেখছে {{channel}}!',
    'l1-ok': 'পৌঁছেছে! +{{amount}}। কাজ হলো, কিন্তু প্রতিটা জোড়ার জন্য আলাদা class লাগে: এ পর্যন্ত {{count}}টা, সব জোড়ার জন্য ৯টা।',
    'l1-fail-type':
      '😵 {{type}} মেসেজের বদলে কাস্টমার পেল {{gotType}} মেসেজ। জোড়া-class শুধু নিজের জোড়াতেই খাটে; অন্য জোড়ার জন্য আবার ব্যবহার করা যায় না।',
    'l1-fail-channel': '📭 মেসেজ গেল {{gotChannel}} দিয়ে, অথচ {{name}} অপেক্ষা করছিল {{channel}} দেখে। মেসেজটা কেউ পড়লই না।',
    'level1-done':
      'লেভেল শেষ! প্রায় প্রতিটা মেসেজের জন্যই নতুন class লাগল, আর লেখা ও গেটওয়ের কোড class থেকে class-এ কপি-পেস্ট হলো। কোডের শেষ লাইনটা দেখুন।',

    idle2: 'এবারের কাস্টমার {{name}}। দরকার {{channel}} দিয়ে {{type}} মেসেজ। মেসেজ টাইপ আর চ্যানেল আলাদা করে বাছুন।',
    'wrong-type': 'দরকার {{type}} মেসেজ, {{picked}} নয়। মেসেজ টাইপ হলো Abstraction: সে ঠিক করে কী বলা হবে।',
    'wrong-channel': '{{name}} দেখে {{channel}}, {{picked}} নয়। চ্যানেল হলো Implementor: সে ঠিক করে মেসেজ কীভাবে যাবে।',
    ready: '{{typeCls}} + {{chanCls}}: যেকোনো টাইপ যেকোনো চ্যানেলের সাথে চলে। “পাঠান” চাপুন।',
    wire: 'new {{typeCls}}(new {{chanCls}}()): চ্যানেল object-টা bridge field-এ ঢুকে গেল।',
    send: 'কাস্টমার {{name}}, তার জন্য notification.send() কল হলো। Client শুধু Notification-এর সাথেই কথা বলে।',
    format: '{{typeCls}} ঠিক করে কী বলবে: “{{text}}”। লেখাটা কীভাবে যাবে, সে জানেই না।',
    delegate: 'this.channel.deliver(to, text): মেসেজ bridge পার হচ্ছে। Notification “কীভাবে”-র কাজটা তার হাতে থাকা চ্যানেলকে delegate করে।',
    deliver: '{{chanCls}} ঠিক করে কীভাবে: সে লেখাটা {{channel}} গেটওয়ের হাতে দেয়। লেখায় কী আছে, তাতে তার কিছু যায় আসে না।',
    done: 'পৌঁছেছে! +{{amount}}। মাত্র {{classes}}টা ছোট class দিয়েই সব টাইপ × চ্যানেল জোড়া হয়ে যায়।',
    'level2-done': 'লেভেল শেষ! টাইপ আর চ্যানেল ইচ্ছেমতো মেলালেন, অথচ কোনো class-কে দুটোর কথা একসাথে জানতে হয়নি।',

    'need-build': '{{name}} শুধু হোয়াটসঅ্যাপ দেখে, আর হোয়াটসঅ্যাপ চ্যানেল এখনো নেই। 🔨 হোয়াটসঅ্যাপ টাইলে ট্যাপ করে বানিয়ে নিন।',
    'build-q1': 'প্রথমে: তিনটা মেসেজ টাইপের জন্যই হোয়াটসঅ্যাপ কীভাবে যোগ করবেন?',
    'wrong-q1-pairs': 'এটা তো লেভেল ১-এর সেই class বিস্ফোরণ: এখন ৩টা নতুন class, আর ভবিষ্যতের প্রতিটা চ্যানেলে আরও ৩টা।',
    'wrong-q1-edit': 'তাহলে প্রতিটা Notification class এডিট করতে হবে, আর সবাইকে হোয়াটসঅ্যাপের কথা জানতে হবে। Bridge আছেই যাতে এটা কখনো না লাগে।',
    'build-q2': 'WhatsAppChannel, Channel implement করে। এবার: তাকে কী জানতে হবে?',
    'wrong-q2-texts': 'লেখাগুলো মেসেজ টাইপের, মানে Abstraction পাশের। চ্যানেল শুধু যে লেখা পায়, সেটাই বয়ে নিয়ে যায়।',
    'wrong-q2-types': 'চ্যানেল কখনো জিজ্ঞেস করে না কে কল করছে: deliver(to, text) দিয়ে যেকোনো Notification তাকে ব্যবহার করতে পারে।',
    'build-ready': 'হয়ে গেছে: একটা নতুন class, পুরোনো কিছুই এডিট হয়নি। “WhatsAppChannel ব্যবহার করুন” চাপুন।',
    'build-done': 'WhatsAppChannel তৈরি, আর প্রতিটা মেসেজ টাইপ এখনই এটা ব্যবহার করতে পারে। মেসেজ টাইপ বেছে “পাঠান” চাপুন।',
    'wa-wire': 'new {{typeCls}}(new WhatsAppChannel()): আগের সেই একই {{typeCls}}, শুধু হাতে নতুন চ্যানেল।',
    'wa-format': '{{typeCls}} লিখছে “{{text}}”, ঠিক আগের মতো: এর একটা লাইনও বদলায়নি।',
    'wa-delegate': 'this.channel.deliver(…) bridge পার হচ্ছে, আর এবার গিয়ে পৌঁছাচ্ছে WhatsAppChannel.deliver()-এ।',
    'wa-send': 'WhatsAppChannel শুধু জানে কীভাবে: whatsapp.sendMessage(phone, text)।',
    'wa-done': 'হোয়াটসঅ্যাপে পৌঁছেছে! +{{amount}}। ৩টার বদলে ১টা নতুন class, আর পুরোনো কোড এডিট ০ লাইন।',
    'level3-done':
      'গেম শেষ! Bridge “কী” (মেসেজ টাইপ) আর “কীভাবে” (চ্যানেল) আলাদা রাখে, তাই প্রতিটা পাশ নিজের মতো বাড়ে: ৩ × ৪ = ১২-র বদলে ৩ + ৪ = ৭টা class।',
  },

  codeComments: {
    implementor: 'Implementor: মেসেজ কীভাবে যাবে',
    concreteImpl: 'Concrete implementor: প্রতি চ্যানেলে একটা',
    abstraction: 'Abstraction: কী পাঠানো হবে',
    bridgeField: 'এটাই bridge: প্রতিটা notification একটা Channel রাখে',
    refined: 'Refined abstraction: প্রতি মেসেজ টাইপে একটা',
    delegate: '“কীভাবে”-র কাজ bridge পার করে delegate',
    usage: 'Client কোড',
    anyPair: 'যেকোনো টাইপ + যেকোনো চ্যানেল',
    withoutIntro: 'প্রতিটা টাইপ × চ্যানেল জোড়ার জন্য একটা class',
    whatPart: 'কী বলবে…',
    howPart: '…আর কীভাবে পাঠাবে, একসাথে জোড়া লাগানো',
    withoutCopy: 'নতুন জোড়া? পুরো একটা class কপি-পেস্ট করুন',
    copyHow: 'সেই একই push কোড, আবার কপি',
    withoutPick: 'ঠিক জোড়ার class-টা বাছুন',
    withoutTodo: '৩ টাইপ × ৩ চ্যানেল = ৯টা class। হোয়াটসঅ্যাপ? ১২টা',
    withAdd: 'হোয়াটসঅ্যাপ = একটা নতুন Channel class',
    onlyHow: 'সে শুধু জানে কীভাবে পাঠাতে হয়',
    withSame: 'পুরোনো প্রতিটা মেসেজ টাইপ যেমন আছে তেমনই এটা দিয়ে চলে',
    withZero: 'পুরোনো class এডিট: ০। Bridge ছাড়া: OtpWhatsApp, PromoWhatsApp, AlertWhatsApp',
  },

  compare: {
    without: {
      title: 'প্রতিটা টাইপ × চ্যানেল জোড়ার জন্য একটা class',
      points: [
        'প্রতিটা নতুন জোড়ার জন্য আলাদা class লাগে: OtpSms, PromoEmail, AlertPush…',
        'Class-এর সংখ্যা গুণ হয়ে বাড়ে: ৩ টাইপ × ৩ চ্যানেল = ৯, হোয়াটসঅ্যাপ এলে ১২।',
        'মেসেজের লেখা আর গেটওয়ের কোড class থেকে class-এ কপি-পেস্ট হয়।',
        'SMS কোডে একটা ফিক্স করতে হয় প্রতিটা …Sms class-এ।',
      ],
    },
    with: {
      title: 'মেসেজ টাইপ আর চ্যানেল, bridge-এর দুই পাশে',
      points: [
        'মেসেজ টাইপ শুধু ঠিক করে কী বলবে; চ্যানেল শুধু জানে কীভাবে পাঠাবে।',
        'প্রতিটা Notification একটা Channel রাখে (এটাই bridge) আর কাজটা তাকে delegate করে।',
        'Class-এর সংখ্যা গুণ না হয়ে যোগ হয়: ৩ + ৩ = ৬, হোয়াটসঅ্যাপ এলে ৭।',
        'নতুন চ্যানেল বা মেসেজ টাইপ মানে একটা class; পুরোনো কিছু এডিট হয় না।',
      ],
    },
    benefit:
      'Bridge গুণকে যোগে বদলে দেয়। কোনো class দুটো স্বাধীন দিকে বদলালে, প্রতিটা দিককে নিজের hierarchy-তে রাখলে দুটোই ছোট থাকে, runtime-এ ইচ্ছেমতো জোড়া লাগানো যায়, আর এক পাশ বদলালে অন্য পাশে হাত দিতে হয় না।',
    whenToUse: [
      'একটা class দুই (বা বেশি) স্বাধীন দিকে বদলায়, যেমন মেসেজ টাইপ × চ্যানেল, বা shape × renderer।',
      'দেখছেন প্রতিটা কম্বিনেশনের জন্য দুই শব্দ জোড়া দেওয়া class-এর নাম (OtpSms, PromoEmail…), আর তালিকা বেড়েই চলেছে।',
      'Runtime-এ implementation বদলাতে চান, বা দুই পাশে দুটো টিমকে আলাদাভাবে কাজ করতে দিতে চান।',
    ],
  },
}

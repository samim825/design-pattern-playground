import type { DeepPartial } from '@/types/pattern'
import type { ProxyContent } from './content.en'

// Technical terms stay in English (Proxy, Subject, RealSubject, cache, interface, class, getRate…).
// Never glue a Bangla suffix onto a {{placeholder}} ("{{name}}-এর" reads wrong); rephrase instead.
// Anything missing here falls back to content.en.ts automatically.
export const bn: DeepPartial<ProxyContent> = {
  title: 'Proxy',
  tagline: 'ধীরগতির ব্যাংকের সামনে একজন প্রতিনিধি বসিয়ে দিন। একই প্রশ্ন আবার এলে সে নিজেই উত্তর দেয়, আর কাউন্টার টেরও পায় না।',
  intent:
    'কোনো object-এর সামনে একই interface-ওয়ালা একটা প্রতিনিধি (stand-in) বসান। Proxy আসল object-এ পৌঁছানো নিয়ন্ত্রণ করে: কল cache করতে পারে, log করতে পারে, চেক করতে পারে বা দেরিতে করতে পারে, আর client আগের মতোই কল করে যায়।',

  scenario: {
    title: 'মতিঝিলে নুসরাতের রেমিট্যান্স কাউন্টার',
    paragraphs: [
      'মতিঝিলের শাপলা মানি এক্সচেঞ্জে কাউন্টার সামলান নুসরাত। সারাদিন মানুষ আসেন বিদেশ থেকে পরিবারের পাঠানো টাকা ভাঙাতে: রহিম আনেন নিউ ইয়র্কে থাকা ভাইয়ের পাঠানো ৫০০ মার্কিন ডলার, করিম রিয়াদ থেকে ২,০০০ সৌদি রিয়াল, মিতু কুয়ালালামপুর থেকে রিংগিত।',
      'প্রতিটা কোটের জন্য কাউন্টারের অ্যাপ ব্যাংকের রেট ফিডে জিজ্ঞেস করে: USD ≈ ৳১২২, SAR ≈ ৳৩২.৫০, MYR ≈ ৳২৭। ফিডটা ধীর, প্রতি কলে প্রায় ৩ সেকেন্ড, আর প্রতিটা কলে দোকানের ৳২ ফি কাটে। রেট দিনে হাতে গোনা কয়েকবার বদলায়, অথচ অ্যাপ প্রতিটা গ্রাহকের জন্য নতুন করে জিজ্ঞেস করে।',
      'তাই নুসরাত আজকের রেটগুলো একটা খাতায় লিখে রাখেন, আর প্রতিবার হাতে হাতে ঠিক করেন: ব্যাংকে জিজ্ঞেস করবেন, নাকি খাতার ওপর ভরসা? তারপর কমপ্লায়েন্স অফিসার জানালেন, অডিটের জন্য প্রতিটা রেট দেখার রেকর্ড (log) রাখতে হবে…',
    ],
    problem:
      'কাউন্টার সরাসরি ধীর ব্যাংকের সাথে কথা বলে। একই কারেন্সি আবার জিজ্ঞেস করলেও ৩ সেকেন্ড অপেক্ষা আর ৳২ ফি, তাই তাড়াহুড়োর গ্রাহকেরা চলে যান। হাতে হাতে cache করলে খাতার হিসাব ঢুকে পড়ে কাউন্টারের ভেতরেই, একটা ভুল আন্দাজে ভুল রেট চলে যায়, আর প্রতিটা নতুন কাউন্টার বা অ্যাপকে সেটা কপি করতে হয়।',
  },

  visual: {
    // Pattern-role and class names stay in English on purpose.
    levelsLabel: 'গেমের লেভেল',
    levelLabel: 'লেভেল {{n}}',
    level1Title: 'প্রতিটা রেট হাতে হাতে আনুন',
    level2Title: 'একটা proxy বসিয়ে দিন',
    level3Title: 'অডিটর চান log',
    level1Goal:
      'এখনো কোনো pattern নেই: কাউন্টার নিজেই ধীর ব্যাংকের সাথে কথা বলে। প্রতিটা গ্রাহকের জন্য ঠিক করুন রেট কোথা থেকে আসবে: ব্যাংক (৩ সে., ৳২), নুসরাতের খাতা, নাকি স্ক্রিনের শেষ রেট।',
    level2Goal:
      'এবার কাউন্টার চেনে শুধু RateService interface। কোন RateService বসাবেন বাছুন, যাতে একই প্রশ্ন দ্বিতীয়বার এলে সাথে সাথে উত্তর মেলে।',
    level3Goal: 'কমপ্লায়েন্স চায় প্রতিটা রেট দেখার log। একটা LoggingRateService বানিয়ে cache-এর ওপরে বসিয়ে দিন, কাউন্টার বা cache এডিট না করে।',
    locked: 'লক করা',
    earned: 'আয়',
    restart: 'গেম আবার শুরু',
    turnOf: 'পালা {{n}}/{{total}}',

    clientRole: 'Client',
    counterTitle: 'কাউন্টার, মতিঝিল',
    patient: 'অপেক্ষা করতে পারেন ৫ সে.',
    hurry: 'তাড়ায় আছেন: ১ সে.',
    waitingMood: 'অপেক্ষায়',
    servedMood: 'পেলেন {{quote}}',
    leftMood: '{{s}} সে. পর চলে গেলেন',
    wrongMood: 'ভুল রেট!',
    noRateMood: 'রেটই নেই!',
    pickLabel: 'এই রেটটা কোথা থেকে আসবে?',
    srcBank: 'ব্যাংকে কল',
    srcNotebook: 'নুসরাতের খাতা',
    srcLast: 'স্ক্রিনের শেষ রেট',
    knowsL1: 'এই কাউন্টারকে প্রতিবার ঠিক করতে হয়: ব্যাংক, খাতা, নাকি শেষ রেট',
    wireLabel: 'new Counter(…)-এ কোন RateService যাবে?',
    wireBank: 'BankRateService',
    wireShared: 'CachedRateService · একটাই, সবার জন্য',
    wireFresh: 'CachedRateService · প্রতি গ্রাহকে নতুন',
    wireHint: 'আপনার বাছাই পরের গ্রাহকদের জন্যও লাগানো থাকবে।',
    knowsL2: 'কাউন্টার চেনে শুধু ১টা জিনিস: rates.getRate(currency)',
    othersSame: 'Counter · CachedRateService · BankRateService: কোনো বদল নেই',

    noPatternRole: 'Pattern ছাড়া',
    quoteTitle: 'Counter.quote()',
    notebookLabel: 'নুসরাতের খাতা',
    lastLabel: 'স্ক্রিনের শেষ রেট',
    noneYet: 'এখনো নেই',
    emptyNotes: 'খালি পাতা',
    handTag: 'হাতে হাতে cache',

    subjectRole: 'Subject',
    subjectNote: 'এখানে যা-ই বসানো হোক, সে getRate(currency)-এর উত্তর দেয়।',
    proxyRole: 'Proxy',
    cacheLabel: 'cache',
    cacheEmpty: 'খালি',
    hitTag: 'hit',
    missTag: 'miss',
    newProxyTag: 'নতুন instance: cache খালি',
    notWired: 'বসানো হয়নি',
    notBuilt: 'এখনো বানানো হয়নি',
    newTag: 'নতুন',
    auditLabel: 'অডিট log',
    auditEmpty: 'এখনো কোনো এন্ট্রি নেই',
    realRole: 'RealSubject',
    bankWait: 'bankFeed.fetch() · ৩ সে.',
    idleBank: 'বসে আছে',
    busyBank: 'আনছে…',
    calls: 'কল: {{n}} · ফি: {{fee}}',
    wasted: '{{cur}} আবার জিজ্ঞেস করা হলো!',
    resultOk: 'সবাই সেবা পেলেন · +{{coins}}',
    resultBad: 'গ্রাহক হারালেন!',

    builderTitle: 'LoggingRateService বানান',
    builderStep1: 'ধাপ ১ · এটা কী implement করবে?',
    builderStep2: 'ধাপ ২ · এটা কী ধরে রাখবে, পরে কাকে কল করবে?',
    q1: 'কাউন্টারে কোনো বদল ছাড়াই সব চলতে হবে। LoggingRateService কী হবে?',
    q1Implements: 'implements RateService',
    q1Extends: 'extends BankRateService',
    q1Counter: 'কিছুই না: Counter আগে log() কল করবে',
    q2: 'log লেখার পর রেটের উত্তর দেবে কে?',
    q2Inner: 'যে RateService-কে সে মুড়ে রেখেছে (cache)',
    q2Bank: 'তার নিজের নতুন BankRateService()',
    q2Counter: 'Counter',
    plugLogging: 'LoggingRateService বসিয়ে দিন',
    zeroEdits: 'পুরোনো কোড এডিট: ০ লাইন',

    askButton: 'রেট আনুন',
    nextCustomer: 'পরের গ্রাহক',
    finishLevel: 'লেভেল শেষ',
    tryAgain: 'আবার চেষ্টা',

    levelDone: 'লেভেল {{n}} শেষ!',
    nextLevel: 'পরের লেভেল',
    replayLevel: 'এই লেভেল আবার খেলুন',
    playAgain: 'লেভেল ১ থেকে আবার খেলুন',
    l1Teaser:
      'আগামী সপ্তাহে দোকানে খুলছে আরও দুটো কাউন্টার আর একটা মোবাইল অ্যাপ। প্রত্যেকের লাগবে নিজের খাতা, নিজের if/else, আর এমন কেউ যে মনে রাখবে কোন রেট আগেই লেখা আছে… নিশ্চয়ই এর চেয়ে ভালো কোনো উপায় আছে…',
    l2Summary:
      'আপনি BankRateService সরিয়ে CachedRateService বসালেন, আর Counter-এর একটা লাইনও বদলাল না: দুটোই RateService। কখন hit, কখন miss, proxy নিজেই ঠিক করেছে, তাই একই প্রশ্ন দ্বিতীয়বার এলে উত্তর গেছে সাথে সাথে, বিনা খরচে।',
    recapTitle: 'যা শিখলেন',
    recap1: 'Proxy ছাড়া client সরাসরি ধীর সার্ভিসকে ডাকে, নয়তো হাতে হাতে cache করে: প্রতিবার অপেক্ষা আর ফি, আর একটা ভুল আন্দাজে ভুল রেট।',
    recap2:
      'Proxy আসল object-এর মতোই একই interface implement করে, আর আসলটার একটা reference ধরে রাখে। পারলে cache থেকে উত্তর দেয়, না পারলে কলটা আসলটার কাছে পাঠায়। কোন object পেল, client বুঝতেই পারে না।',
    recap3: 'নতুন proxy (LoggingRateService) মুড়ে রাখে cache-কে, আর cache মুড়ে রাখে ব্যাংককে। Counter, cache আর ব্যাংকের কোড: ০ লাইন এডিট।',

    rahim: 'রহিম',
    karim: 'করিম',
    mitu: 'মিতু',
    tania: 'তানিয়া',
    sumon: 'সুমন',
    secs: '{{s}} সে.',

    whatsHappening: 'কী হচ্ছে',
    note: 'দোকান, মানুষ, রেট, ফি আর সময়, সবই এই উদাহরণের জন্য বানানো।',
  },

  steps: {
    tutorial:
      'গ্রাহক {{name}}, ভাঙাবেন {{amount}}। খাতা এখনো খালি, তাই রেটের আসল উৎস শুধু ব্যাংক। “ব্যাংকে কল” আপনার জন্য বাছাই করা আছে। “রেট আনুন” চেপে দেখুন।',
    idle1: 'গ্রাহক {{name}}, ভাঙাবেন {{amount}} ({{patience}})। রেট কোথা থেকে আসবে? আগে মাঝের কার্ডে খাতা আর শেষ রেটটা দেখে নিন।',
    picked1: 'আপনি বাছলেন: {{source}}। “রেট আনুন” চাপুন, দেখুন গ্রাহক খুশি হয়ে যান কি না।',
    'l1-start': 'Counter.quote() পেল গ্রাহকের অনুরোধ, সাথে আপনার বাছাই করা উৎস। মাঝে কোনো প্রতিনিধি নেই: প্রতিটা রেট কোথা থেকে আসবে, কাউন্টার নিজেই ঠিক করে।',
    'l1-route-bank': 'if/else গেল ব্যাংকের শাখায়: কাউন্টার নিজেই bank.getRate("{{cur}}") কল করছে।',
    'l1-route-notebook': 'if/else গেল খাতার শাখায়: নুসরাত খাতার পাতা উল্টে {{cur}} খুঁজছেন।',
    'l1-route-last': 'if/else গেল শেষ-রেটের শাখায়: স্ক্রিনে যে রেট আছে সেটাই চালিয়ে দেবে, সেটা যে কারেন্সিরই হোক।',
    'l1-call':
      'ব্যাংকের ফিড ধীর: গ্রাহক অপেক্ষা করছেন ৩ সেকেন্ড, আর দোকানের কাটছে ৳২ ফি। এক মিনিট আগে কেউ {{cur}} জিজ্ঞেস করেছিল কি না, তাতে কিছু যায় আসে না: প্রতিটা কল পুরো রাস্তা ঘুরে আসে।',
    'l1-note': 'ব্যাংক বলল প্রতি {{cur}} = {{rate}}। নুসরাত হাতে লিখে রাখলেন খাতায়, যাতে পরের বার ব্যাংক এড়ানো যায়, যদি খাতা দেখার কথা মনে থাকে।',
    'l1-lookup-found': 'পাওয়া গেছে: খাতায় লেখা {{cur}} = {{rate}}। অপেক্ষা নেই, ফি নেই। তবে কাজ হলো শুধু এজন্য যে আপনি জানতেন ওটা ওখানে আছে।',
    'l1-lookup-blank': 'খালি: খাতায় এখনো {{cur}} রেট নেই। আগে কেউ যা লিখে রেখেছে, খাতা শুধু সেটুকুই জানে।',
    'l1-lookup-none': 'স্ক্রিন ফাঁকা: আজ এখনো কোনো রেট দেখানো হয়নি, তাই lastRate এখনো ০।',
    'l1-lookup-last': 'স্ক্রিনে এখনো আছে শেষ রেট: প্রতি {{lastCur}} = {{lastRate}}। কোন কারেন্সির রেট, তা না দেখেই কোড সেটাকে {{cur}} রেট হিসেবে চালিয়ে দিল।',
    'l1-reply': 'Counter.quote() নুসরাতকে ফেরত দিল {{amount}} × {{rate}} = {{quote}}।',
    'l1-ok':
      'হয়ে গেল! গ্রাহক {{name}} পেলেন {{quote}}। দোকানের আয় +{{coins}}। কাজ হলো, কিন্তু শুধু এজন্য যে উৎসটা আপনি হাতে বেছেছেন। প্রতিটা কাউন্টার আর অ্যাপকে এই সিদ্ধান্ত বারবার নিতে হবে।',
    'l1-fail-slow':
      '😵 গ্রাহক {{name}} তাড়ায় ছিলেন, ৩ সেকেন্ড পর বেরিয়ে গেলেন। খাতায় {{cur}} আগে থেকেই ছিল, তবু কাউন্টার আবার ব্যাংকে জিজ্ঞেস করল।',
    'l1-fail-blank':
      '😵 খাতায় {{cur}} রেট নেই, তাই কোট এল ৳০, আর গ্রাহক {{name}} হতভম্ব হয়ে চলে গেলেন। যে রেট এখনো কেউ ব্যাংক থেকে আনেনি, সেটা খাতায় থাকতে পারে না।',
    'l1-fail-none':
      '😵 স্ক্রিনে তখনো কিছু ছিল না, তাই lastRate ছিল ০, আর গ্রাহক {{name}} কোট পেলেন ৳০। এই রেট ছিল শুধু ব্যাংকের কাছে।',
    'l1-fail-wrong':
      '😱 ভুল রেট! গ্রাহক {{name}} কোট পেলেন {{quote}}, পাওয়ার কথা {{rightQuote}}: {{cur}} রেটের জায়গায় চলে গেছে {{lastCur}} রেট। মালিক শেষ মুহূর্তে পেমেন্ট আটকালেন।',
    'level1-done':
      'লেভেল শেষ! কাজ হলো, কিন্তু সবকিছু কাউন্টার হাতে হাতে ঠিক করেছে: কখন ধীর ব্যাংককে ডাকবে, কখন খাতায় ভরসা করবে, আর কখন শেষ রেট নিরাপদ।',

    idle2: 'লাইনে দুজন গ্রাহক: {{queue}}। কাউন্টারে কোন RateService বসাবেন বাছুন, তারপর “রেট আনুন” চাপুন।',
    picked2: 'বসানো আছে: {{wiring}}। লাইন: {{queue}}। “রেট আনুন” চাপুন: কাউন্টার শুধু rates.getRate() কল করবে।',
    'wire-shared':
      'new Counter(new CachedRateService(new BankRateService())): কাউন্টার পেল একটা proxy, কিন্তু দেখে শুধু একটা RateService। একটাই proxy সবাইকে সেবা দেয়, তাই তার cache টিকে থাকে।',
    'wire-bank': 'new Counter(new BankRateService()): কাউন্টার পেল সরাসরি আসল ব্যাংক সার্ভিস। চলবে, কারণ দুটোই RateService, কিন্তু ব্যাংকের সামনে কেউ দাঁড়িয়ে নেই।',
    'wire-fresh': 'প্রতিটা গ্রাহকের জন্য কাউন্টার একটা নতুন CachedRateService বানাবে। প্রতিটাই আসল proxy, কিন্তু প্রতিটার cache শুরু হয় খালি।',
    ask: 'গ্রাহক {{name}} চাইলেন {{cur}} রেট। কাউন্টার কল করল rates.getRate("{{cur}}")। কোন object উত্তর দেবে, সেটা কাউন্টার জানে না, জানার দরকারও নেই।',
    fresh: 'গ্রাহক {{name}}, তাঁর জন্য বানানো হলো একদম নতুন CachedRateService। এর cache খালি, তাই আগের proxy-গুলো যা শিখেছিল সব হারিয়ে গেছে।',
    'check-hit': 'Proxy আগে নিজের cache দেখে: {{cur}} আছে ({{rate}})। Hit!',
    'check-miss': 'Proxy আগে নিজের cache দেখে: {{cur}} এখনো নেই। Miss, তাই আসল ব্যাংককে জিজ্ঞেস করতেই হবে।',
    hit: 'Proxy উত্তর দিল নিজের cache থেকে: ০ সেকেন্ড, ৳০। এই অনুরোধের কথা ব্যাংক জানলই না।',
    forward: 'Miss হলে proxy একই কল পাঠিয়ে দেয় যে object-কে সে ধরে রেখেছে তার কাছে: real.getRate("{{cur}}")।',
    bank: 'ধীর কাজটা করে BankRateService: ৩ সেকেন্ড আর ৳২ ফি। ব্যাংকের ফিডের সাথে কথা বলে শুধু RealSubject।',
    'bank-direct': 'মাঝে কোনো proxy নেই: কল সোজা গেল BankRateService-এ। ৩ সেকেন্ড আর ৳২, এক মুহূর্ত আগে {{cur}} জিজ্ঞেস করা হলেও।',
    store: 'রেট ফিরে এল: প্রতি {{cur}} = {{rate}}। পাঠিয়ে দেওয়ার আগে proxy সেটা নিজের cache-এ মনে রাখে।',
    'reply-fast': 'গ্রাহক {{name}} সাথে সাথে পেলেন {{quote}}। কাউন্টারের দিক থেকে এটা ছিল সেই চেনা getRate() কলই।',
    'reply-slow': 'গ্রাহক {{name}} ৩ সেকেন্ড অপেক্ষা করলেন, তবে তাঁর তাড়া ছিল না। পেলেন {{quote}}।',
    'reply-left': '😠 গ্রাহক {{name}} তাড়ায় ছিলেন, {{s}} সেকেন্ড পর চলে গেলেন। {{cur}} রেট আগেই আনা হয়েছিল, কিন্তু কেউ সেটা মনে রাখেনি।',
    'done-ok':
      'সবাই সেবা পেলেন! +{{coins}}। এই পালায় ব্যাংকে মোট কল: {{calls}}। Counter শুধু getRate() কল করেছে, জানতেই পারেনি উত্তর দিচ্ছে একটা proxy।',
    'done-bank':
      '😵 একই কারেন্সির জন্য ব্যাংককে দুবার জিজ্ঞেস করা হলো, আর তাড়ায় থাকা গ্রাহক চলে গেলেন। এমন একটা RateService বসান যে মনে রাখে: Counter যেকোনো RateService নেয়, তাই আর কিছুই বদলাতে হবে না।',
    'done-fresh':
      '😵 প্রতিটা গ্রাহক পেলেন খালি cache-ওয়ালা একদম নতুন proxy, তাই প্রতিটা অনুরোধই miss। Caching proxy-কে তার cache-এর সমান দিন বাঁচতে হয়: একবার বানান, সবাই মিলে ব্যবহার করুন।',
    'level2-done':
      'লেভেল শেষ! Counter না ছুঁয়েই আপনি একটা proxy বসিয়ে দিলেন। একই প্রশ্ন আবার এলে সে উত্তর দিয়েছে cache থেকে, আর ব্যাংককে ডেকেছে শুধু miss হলে।',

    'build-q1':
      'নতুন নিয়ম: অডিটের জন্য প্রতিটা রেট দেখার log রাখতে হবে, cache যেগুলোর উত্তর দেয় সেগুলোরও। আপনি লিখবেন LoggingRateService। প্রথমে: এটা কী হবে, যাতে কাউন্টার টের না পায়?',
    'wrong-q1-extends':
      'তাহলে এটা ব্যাংকের সাথে ঝালাই হয়ে গেল: শুধু BankRateService-এর সামনেই দাঁড়াতে পারবে, cache-এর সামনে কখনো না। Proxy যার প্রতিনিধি, তার মতোই একই interface implement করে।',
    'wrong-q1-counter':
      'তাহলে Counter বদলাতে হবে, আর প্রতিটা কাউন্টার, অ্যাপ আর ওয়েবসাইটকে মনে রাখতে হবে log() কল করার কথা। Proxy log যোগ করে এমন জায়গায়, যেটা client দেখতেই পায় না।',
    'build-q2':
      'ঠিক: implements RateService, তাই কাউন্টার টের পায় না। এবার: log লেখার পর রেটের উত্তর দেবে কে?',
    'wrong-q2-bank':
      'তাহলে প্রতিটা অনুরোধ cache এড়িয়ে আবার ৩ সেকেন্ড অপেক্ষা করবে। তার বদলে একটা RateService ধরে রাখুন, তাহলে logger-টা cache-এর ওপরে বসানো যায়।',
    'wrong-q2-counter':
      'উল্টো হয়ে গেল: Counter ধরে রাখে proxy-কে, proxy Counter-কে না। Proxy ধরে রাখে সেই object-কে, যার সামনে সে দাঁড়িয়ে আছে।',
    'build-ready': 'হয়ে গেল: একটাই নতুন class। Counter, CachedRateService বা BankRateService-এ ০ লাইন বদল। “LoggingRateService বসিয়ে দিন” চাপুন।',
    'build-done': 'সাজানো হলো: Counter → LoggingRateService → CachedRateService → BankRateService। “রেট আনুন” চাপুন।',
    'wire-new': 'নতুন লাইন শুধু একটাই: new LoggingRateService(new CachedRateService(new BankRateService()))। কাউন্টার এখনো পায় একটা RateService।',
    'ask-new': 'গ্রাহক {{name}} চাইলেন {{cur}} রেট। কাউন্টার করল হুবহু সেই একই কল: rates.getRate("{{cur}}")।',
    log: 'LoggingRateService আগে অডিটের লাইনটা লেখে: কে {{cur}} রেট চাইলেন, কখন।',
    delegate: 'তারপর একই কল পাঠিয়ে দেয় যে RateService-কে সে মুড়ে রেখেছে তার কাছে: inner.getRate("{{cur}}")। এখানে সেটা cache।',
    'reply-new': 'গ্রাহক {{name}} পেলেন {{quote}}। উত্তরটা দুটো proxy পেরিয়ে কাউন্টারে ফিরে এল।',
    'done-new':
      'log হলো, সেবাও হলো! +{{coins}}। এখন পর্যন্ত মোট অডিট লাইন: {{logs}}। উত্তর cache দিক বা ব্যাংক, log হয় সবই, কারণ logger দাঁড়িয়ে আছে cache-এর সামনে। পুরোনো কোড এডিট: ০ লাইন।',
    'level3-done':
      'গেম শেষ! Proxy একই interface নিয়ে আসল object-এর সামনে দাঁড়ায়: একটা cache করে, একটা log রাখে, আর client কিছুই টের পায় না।',
  },

  codeComments: {
    subject: 'Subject: কাউন্টার যে একটাই interface চেনে',
    oneMethod: 'আসল সার্ভিস আর প্রতিটা proxy এর উত্তর দেয়',
    realSubject: 'RealSubject: আসল, ধীর কাজটা করে',
    slowCall: 'প্রতি কলে প্রায় ৩ সে. আর ৳২ ফি',
    proxy: 'Proxy: একই interface, আসল সার্ভিসের সামনে দাঁড়ায়',
    cacheField: 'যে রেটগুলো আগেই আনা হয়েছে',
    holdsReal: 'আসল সার্ভিসের reference ধরে রাখে',
    sameDoor: 'ডাকা হয় হুবহু আসলটার মতো',
    lookFirst: 'আগে cache-এ দেখো',
    hitFast: 'hit: সাথে সাথে উত্তর, ব্যাংকে কল নেই',
    missForward: 'miss: কলটা আসল সার্ভিসে পাঠাও',
    remember: 'পরের গ্রাহকের জন্য মনে রাখো',
    client: 'Client: নির্ভর করে শুধু interface-এর ওপর',
    onlyInterface: 'যেকোনো RateService বসানো যায়',
    cantTell: 'proxy আর আসলটার তফাত সে বোঝে না',
    usage: 'একবার জুড়ে দাও: proxy মুড়ে রাখে ব্যাংককে',
    wireOnce: 'কাউন্টার পায় proxy, ব্যাংক না',
    firstMiss: 'miss: ব্যাংকে জিজ্ঞেস (৩ সে.)',
    thenHit: 'hit: উত্তর cache থেকে (০ সে.)',
    withoutIntro: 'Pattern ছাড়া: কাউন্টার নিজেই ধীর ব্যাংকের সাথে কথা বলে',
    knowsBank: 'আসল ব্যাংক সার্ভিস তার কাছেই…',
    handNotes: '…সাথে হাতে লেখা একটা খাতা',
    youDecide: 'প্রতিটা রেট কোথা থেকে আসবে, caller ঠিক করে',
    blankPage: 'কেউ না লিখে থাকলে খালি',
    anyCurrency: 'অন্য কারেন্সির রেটও হতে পারে!',
    slowEveryTime: '৩ সে. আর ৳২, একই প্রশ্ন আবার হলেও',
    noteByHand: 'পরের বারের জন্য হাতে লিখে রাখো',
    withoutCopy: 'প্রতিটা কাউন্টার আর অ্যাপ এই একই if/else কপি করে',
    withAdd: 'অডিটের নিয়ম = একটা নতুন proxy class',
    sameInterface: 'একই interface: কাউন্টার টের পায় না',
    wrapsAny: 'যেকোনো RateService মুড়ে রাখে: এখানে cache',
    logFirst: 'তার একটাই বাড়তি কাজ: অডিট লাইন লেখা',
    passOn: 'তারপর একই কল সামনে পাঠানো',
    othersSame: 'পুরোনো class: একটা লাইনও এডিট হয়নি',
    withWire: 'জোড়া লাগানো: নতুন proxy বসে cache-এর ওপরে',
    stacked: 'logger → cache → ব্যাংক',
    clientSame: 'কাউন্টার আগের মতোই যেকোনো RateService নেয়',
    withSame: 'Client কোড: আগের হুবহু একই কল',
    withZero: 'পুরোনো কোড এডিট: ০ লাইন। Proxy ছাড়া: প্রতিটা কাউন্টার, সাথে প্রতিটায় একটা log() কল',
  },

  compare: {
    without: {
      title: 'Client সরাসরি ধীর সার্ভিসের সাথে কথা বলে',
      points: [
        'প্রতিটা রেট যায় ব্যাংকে: ৩ সেকেন্ড আর ৳২ ফি, এক মিনিট আগে জিজ্ঞেস করা কারেন্সির জন্যও।',
        'Cache করা হয় হাতে হাতে, কাউন্টারের ভেতরেই: একটা খাতা, একটা শেষ-রেট field, আর এর মধ্যে বাছার একটা if/else।',
        'একটা ভুল আন্দাজে ভুল রেট চলে যায়, আর খালি বা পুরোনো নোট থেকে আসে কিছুই না।',
        'প্রতিটা কাউন্টার আর মোবাইল অ্যাপ খাতার একই হিসাব কপি করে; অডিট log যোগ করা মানে সবগুলো এডিট করা।',
      ],
    },
    with: {
      title: 'একই interface-ওয়ালা একজন প্রতিনিধি সামনে বসে',
      points: [
        'CachedRateService implement করে RateService, তাই আসল ব্যাংক সার্ভিসের সাথে এর তফাত কাউন্টার বোঝে না।',
        'Proxy নিজেই ঠিক করে: hit হলে সাথে সাথে উত্তর, miss হলে ব্যাংকে পাঠায় আর মনে রাখে।',
        'কাউন্টারে cache-এর কোনো হিসাবই নেই: সে শুধু rates.getRate(currency) কল করে।',
        'নতুন দায়িত্ব (অডিট log, rate limit) মানে ওপরে আরেকটা নতুন proxy; পুরোনো class যেমন ছিল তেমনই থাকে।',
      ],
    },
    benefit:
      'Proxy একটা object-এর সামনে নিয়ন্ত্রণ বসায়, client না জেনেই। Proxy-র interface একই আর সে আসল object ধরে রাখে, তাই শুধু মুড়ে দিয়েই caching, logging, access check বা lazy loading যোগ করা যায়, আর এই মোড়কগুলো ইচ্ছেমতো বদলানো বা একটার ওপর আরেকটা বসানো যায়।',
    whenToUse: [
      'আসল object-কে ডাকা ধীর বা খরুচে (রিমোট API, ডেটাবেস, বড় ফাইল), আর caching বা lazy loading করা একজন প্রতিনিধি কাজে লাগবে।',
      'এতে পৌঁছানো নিয়ন্ত্রণ করতে হবে: permission চেক, মিনিটে কল সীমিত করা, বা অডিটের জন্য প্রতিটা ব্যবহার log করা।',
      'Client-কে কিছু জানানো চলবে না: সে আগে থেকেই একটা interface-এর ওপর নির্ভর করে, আর আপনি client বা আসল object এডিট না করেই নতুন আচরণ যোগ করতে চান।',
    ],
  },
}

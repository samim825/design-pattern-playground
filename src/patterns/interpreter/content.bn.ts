import type { DeepPartial } from '@/types/pattern'
import type { InterpreterContent } from './content.en'

// Technical terms stay in English (Interpreter, expression, tree, interpret(), AND, OR, true/false, class…).
// Never glue a Bangla suffix onto a {{placeholder}} ("{{name}}-এর" reads wrong); rephrase instead.
// Anything missing here falls back to content.en.ts automatically.
export const bn: DeepPartial<InterpreterContent> = {
  title: 'Interpreter',
  tagline: 'প্রতিটা ছাড়ের নিয়ম ব্লক জোড়া দিয়ে ছোট্ট একটা বাক্যের মতো লিখুন। অ্যাপ নিজেই বাক্যটা পড়বে; নতুন নিয়ম এলেই checkout() নতুন করে লিখতে হবে না।',
  intent:
    'ছোট একটা ভাষার প্রতিটা grammar নিয়মের জন্য একটা করে class বানান, প্রতিটা বাক্যকে সেই object-গুলোর একটা tree হিসেবে সাজান, আর root-এ interpret() কল করে হিসাব করুন। root তখন তার child-দের একে একে জিজ্ঞেস করে।',

  scenario: {
    title: 'নিউ মার্কেটের শাড়ির দোকানে মিতু আপার ঈদের ছাড়ের নিয়ম',
    paragraphs: [
      'ঈদের আর এক সপ্তাহ বাকি, নিউ মার্কেটে মিতুর শাড়ি কুটিরে পা ফেলার জায়গা নেই। প্রতিদিন সকালে মিতু আপা কাউন্টারের পাশের বোর্ডে দিনের অফার লিখে দেন: “৳৩,০০০-এর বেশি দামের যেকোনো শাড়িতে ১০% ছাড়”। বিলিং কাউন্টারে সুমন বিলিং অ্যাপে প্রতিটা কাস্টমারের কার্টের বিল করে।',
      'ঝামেলা হলো, বিলিং অ্যাপ বোর্ড পড়তে পারে না। প্রতিটা নিয়ম checkout()-এর ভেতরে একটা if হয়ে বসে আছে। মিতু আপা বোর্ড বদলালেই (“৳৫,০০০-এর বেশি যেকোনো অর্ডারে ১৫%”, “৳২,০০০-এর বেশি পাঞ্জাবিতে ৫%”) একজন developer checkout() এডিট করে, অ্যাপ আবার deploy করে, আর দশ মিনিট কাউন্টার বন্ধ থাকে। একটা else if ভুল জায়গায় বসলেই নুসরাত পেয়ে যায় ডাবল ছাড়, আর রহিম পায় বোর্ডে লেখার চেয়ে কম।',
      'আর ঈদের শেষ কয়েক দিনের জন্য মিতু আপা চান OR-ওয়ালা নিয়ম: “যেকোনো শাড়িতে, OR ৳৫,০০০-এর বেশি যেকোনো অর্ডারে ১০% ছাড়”…',
    ],
    problem:
      'নিয়মগুলো checkout()-এর ভেতরে if/else branch হিসেবে hard-code করা। প্রতিটা নতুন নিয়ম মানে একই function এডিট করা আর আবার deploy করা। branch-গুলোর ক্রম চুপচাপ ঠিক করে দেয় কে কত ছাড় পাবে, আর শর্ত জোড়া দিতে (AND, OR) প্রতিবার হাতে হাতে শর্ত নতুন করে লিখতে হয়।',
  },

  visual: {
    levelsLabel: 'গেমের লেভেল',
    levelLabel: 'লেভেল {{n}}',
    level1Title: 'checkout()-এ hard-code করা নিয়ম',
    level2Title: 'ব্লক দিয়ে বানানো নিয়ম',
    level3Title: 'নতুন ব্লক: Or',
    level1Goal:
      'এখনো কোনো pattern নেই: মিতু আপার বোর্ডের প্রতিটা নিয়ম checkout()-এর ভেতরে একটা if। প্রতিটা নতুন নিয়মের জন্য ঠিক করুন কোড কীভাবে বদলাবেন, তারপর দেখুন কাস্টমাররা কত টাকা দেয়।',
    level2Goal:
      'এবার একটা নিয়ম মানে object-এর একটা tree: TotalAbove, CategoryIs আর And, সবার আছে interpret(cart)। বোর্ডে যা লেখা ঠিক তা-ই বলে এমন ব্লক বাছুন। checkout() কখনো বদলায় না।',
    level3Goal: 'মিতু আপার ঈদের নিয়মে OR লাগবে। And, TotalAbove, CategoryIs বা checkout() এডিট না করে একটা Or ব্লক বানান, তারপর পুরোনো ব্লকের সাথে মিলিয়ে nested নিয়মে ব্যবহার করুন।',
    locked: 'লক করা',
    earned: 'আয়',
    restart: 'গেম আবার শুরু',
    turnOf: 'পালা {{n}}/{{total}}',

    clientRole: 'Client',
    counterTitle: 'বিলিং কাউন্টার · সুমন',
    contextRole: 'Context',
    abstractRole: 'AbstractExpression',
    terminalRole: 'TerminalExpression',
    nonterminalRole: 'NonterminalExpression',
    hardcodedRole: 'কোনো pattern নেই',
    nusrat: 'নুসরাত',
    rahim: 'রহিম',
    tania: 'তানিয়া',
    karim: 'করিম',
    itemSaree: 'জামদানি শাড়ি',
    itemPanjabi: 'ঈদের পাঞ্জাবি',
    itemLungi: 'পাবনার লুঙ্গি',

    boardTitle: 'মিতু আপার বোর্ড',
    newTag: 'নতুন',
    bestOnly: 'শুধু সবচেয়ে ভালো ছাড়টা পাবে, দুটো একসাথে কখনো না।',
    ruleSaree: '৳৩,০০০-এর বেশি যেকোনো শাড়িতে ১০% ছাড়',
    ruleBig: '৳৫,০০০-এর বেশি যেকোনো অর্ডারে ১৫% ছাড়',
    rulePanjabi: '৳২,০০০-এর বেশি যেকোনো পাঞ্জাবিতে ৫% ছাড়',
    ruleEid1: '১০% ছাড়: যেকোনো শাড়ি, OR ৳৫,০০০-এর বেশি যেকোনো অর্ডার',
    ruleEid2: '১০% ছাড়: ৳৩,০০০-এর বেশি শাড়ি, OR ৳৫,০০০-এর বেশি যেকোনো অর্ডার',
    ruleEid3: '১০% ছাড়: পাঞ্জাবি OR লুঙ্গি, দাম ৳২,০০০ ছাড়ালে',

    noDiscount: 'ছাড় নেই',
    pays: 'দিল {{paid}}',
    loss: 'লোকসান {{diff}}',
    boardSays: 'বোর্ডে লেখা {{pct}}',

    statEdits: 'checkout() এডিট: {{n}}',
    statDeploys: 'redeploy: {{n}}',
    yourChoice: 'আপনার বাছাই',
    pickLabel1: 'checkout() কীভাবে বদলাবেন?',
    pickLabel2: 'কোন ব্লকগুলো ঠিক বোর্ডের কথাটাই বলে?',
    knowsL1: 'প্রতিটা নিয়ম checkout()-এর ভেতরে একটা if: নতুন নিয়ম = এডিট + redeploy',
    knowsL2: 'checkout() শুধু rule.interpret(cart) কল করে। নতুন নিয়ম = object-এর নতুন একটা tree',
    othersSame: 'And · TotalAbove · CategoryIs · checkout(): কোনো বদল নেই',

    optAnd: 'if (saree && total > 3000) → ১০%',
    optOr: 'if (saree || total > 3000) → ১০%',
    optNoCat: 'if (total > 3000) → ১০%, ছোট করে',
    optTop: 'নতুন if (total > 5000) সবার ওপরে; শাড়ির if হয়ে যাবে else if',
    optExtra: 'নিচে আলাদা একটা if (total > 5000) → +১৫% যোগ করুন',
    optBottom: 'একদম নিচে else if (total > 5000) যোগ করুন',
    optLast: 'শেষে else if (panjabi && total > 2000) যোগ করুন',
    optFirst: 'পাঞ্জাবির if-টা সবার ওপরে বসান',
    optReuse: 'শাড়ির লাইনটাই বদলে দিন: (saree || panjabi) && total > 2000',

    redeploying: 'বিলিং অ্যাপ আবার deploy হচ্ছে… কাউন্টার বন্ধ',

    treeEmpty: 'আজকের নিয়ম বানাতে ওপর থেকে ব্লক বাছুন।',
    readsTotal: 'cart.total পড়ে',
    readsCategory: 'cart.category পড়ে',
    andIdle: 'দুই দিকই true হলে তবেই true',
    orIdle: 'যেকোনো এক দিক true হলেই true',
    asking: 'child-দের জিজ্ঞেস করছে…',
    skipped: 'জিজ্ঞেসই করা হয়নি: বাদ',
    ruleNote: 'প্রতিটা ব্লকের method একই, তাই যেকোনো ব্লক tree-র যেকোনো জায়গায় বসতে পারে।',
    notBuilt: 'এখনো বানানো হয়নি',

    cartWaiting: 'পরের কাস্টমারের অপেক্ষায়',

    resultOk: 'সব কাস্টমার ঠিক দাম দিয়েছে · +{{coins}}',
    resultBad: 'কাউন্টারে ভুল ছাড় হয়ে গেল!',

    builderTitle: 'Or ব্লক বানান',
    builderStep1: 'ধাপ ১ · এটা কী হবে?',
    builderStep2: 'ধাপ ২ · উত্তরটা কীভাবে বের করবে?',
    q1: 'কাউন্টার, এমনকি একটা And ব্লকও, Or-কে অন্য যেকোনো ব্লকের মতোই ব্যবহার করবে। Or কী হওয়া উচিত?',
    q1Flag: 'And-এ একটা mode flag: And(left, right, mode = "or")',
    q1Implements: 'class Or implements Rule',
    q1Counter: 'checkout()-এর ভেতরে একটা if (isOrRule)',
    q2: 'Or.interpret(cart)-এর ভেতরে উত্তরটা কীভাবে আসবে?',
    q2Hard: 'cart.category == "saree" || cart.total > 5000',
    q2Children: 'left.interpret(cart) || right.interpret(cart)',
    q2And: 'left.interpret(cart) && right.interpret(cart)',
    zeroEdits: 'পুরোনো কোড এডিট: ০ লাইন',
    useOr: 'Or ব্লক ব্যবহার করুন',

    playButton: 'চালান',
    nextTurn: 'পরের নিয়ম',
    finishLevel: 'লেভেল শেষ',
    tryAgain: 'আবার চেষ্টা',

    levelDone: 'লেভেল {{n}} শেষ!',
    nextLevel: 'পরের লেভেল',
    replayLevel: 'এই লেভেল আবার খেলুন',
    playAgain: 'লেভেল ১ থেকে আবার খেলুন',
    l1Teaser:
      'কাজ হচ্ছে, কিন্তু তিনটা নিয়মের জন্য checkout() তিনবার এডিট, তিনবার redeploy, আর লোকসান থেকে মাত্র একটা ভুল branch দূরে। এরপর মিতু আপা চান “শাড়ি OR ৳৫,০০০-এর বেশি”। সেই else if কোথায় বসবে?',
    l2Summary:
      'তিনটা নতুন নিয়ম, অথচ checkout() একবারও এডিট বা redeploy হয়নি। প্রতিটা নিয়ম ছিল ব্লকের ছোট্ট একটা tree; কাউন্টার শুধু rule.interpret(cart) কল করেছে, উত্তর বের করেছে tree নিজেই।',
    recapTitle: 'যা শিখলেন',
    recap1: 'Hard-code করা নিয়মে checkout() একটা বাড়তে থাকা if/else শিকল হয়ে যায়: প্রতিটা নিয়ম বদল মানে এডিট আর redeploy, আর branch-এর ক্রম চুপচাপ ঠিক করে কে কত ছাড় পাবে।',
    recap2:
      'Interpreter নিয়মের ভাষার প্রতিটা অংশকে একটা class দেয়: terminal-রা (TotalAbove, CategoryIs) context পড়ে, nonterminal-রা (And) child-দের মেলায়। একটা নিয়ম মানে একটা tree, হিসাব হয় এক কলে: interpret(cart)।',
    recap3: 'নতুন grammar নিয়ম (Or) মানে একই interpret() সহ একটা নতুন class। পুরোনো ব্লকের সাথে যেকোনো আকারে nest হয়, আর পুরোনো class-গুলোতে এডিট: ০ লাইন।',

    whatsHappening: 'কী হচ্ছে',
    note: 'দোকান, মানুষ আর টাকার অঙ্ক এই উদাহরণের জন্য বানানো।',
  },

  steps: {
    tutorial:
      'মিতু আপা বোর্ডে ঈদের প্রথম অফার লিখলেন: {{rule}}। কোনো pattern নেই, তাই অ্যাপ এটা জানতে পারে একটাই উপায়ে: checkout()-এর ভেতরে একটা if। ঠিক এডিটটা আগেই বেছে দেওয়া আছে। চালান চাপুন আর দেখুন।',
    'idle1-1': 'বোর্ডে লেখা: {{rule}}। checkout()-এ এটা কীভাবে লিখবেন?',
    'idle1-2':
      'মিতু আপা দ্বিতীয় অফার দিলেন: {{rule}}। একজন কাস্টমার শুধু সবচেয়ে ভালো ছাড়টা পাবে, দুটো কখনো না। checkout() কীভাবে বদলাবেন?',
    'idle1-3': 'তৃতীয় অফার: {{rule}}। checkout()-এ এর মধ্যেই দুটো branch আছে। নতুনটা কোথায় বসবে?',
    picked1: 'আপনার বাছাই: {{choice}}। চালান চাপুন: developer checkout() এডিট করবে, অ্যাপ আবার deploy করবে, তারপর কাস্টমাররা টাকা দেবে।',
    'l1-rule': 'বোর্ডে নতুন: {{rule}}। বিলিং অ্যাপ বোর্ড পড়তে পারে না, তাই একজন developer-কে এটা কোডে লিখতে হবে।',
    'l1-edit': 'developer checkout() খুলে if/else শিকলটা এডিট করছে। একই function-এ এটা {{edits}} নম্বর এডিট।',
    'l1-deploy': 'বিলিং অ্যাপ আবার deploy। দশ মিনিট কাউন্টার বন্ধ, লাইন লম্বা হচ্ছে। প্রতিটা নিয়ম বদলের দাম এটা।',
    'l1-cart': 'কাউন্টারে এলেন {{name}}: {{item}}, দাম {{total}}। সুমন checkout(cart) চালাল।',
    'l1-check-hit': 'checkout() ওপর থেকে শিকল ধরে নামে, আর প্রথম যে branch মেলে সেখানেই থামে: ছাড় {{pct}}। branch-এর ক্রমই ছাড় ঠিক করে দিচ্ছে।',
    'l1-check-none': 'এই কার্টের সাথে কোনো branch মেলেনি, তাই ছাড় ০।',
    'l1-check-double': 'আলাদা দুটো if দুটোই মিলে গেছে, আর দ্বিতীয়টা ওপরে যোগ করে দিয়েছে: মোট ছাড় {{pct}}!',
    'l1-pay-yes': 'ছাড় {{pct}}: {{name}} দিলেন {{paid}}, ঠিক বোর্ডে যেমন লেখা।',
    'l1-pay-no': 'ছাড় নেই: {{name}} দিলেন {{paid}}। ঠিক আছে, বোর্ডের কোনো অফার এই কার্টে খাটে না।',
    'l1-pay-loss': 'ছাড় পড়ল {{pct}}, অথচ বোর্ডে লেখা {{expected}}। দোকানের লোকসান {{diff}}!',
    'l1-pay-short': 'ছাড় পড়ল মাত্র {{pct}}, অথচ বোর্ডে লেখা {{expected}}! “আপা, নিজের বোর্ডটা একবার পড়েন!”',
    'l1-ok':
      'সব কাস্টমার ঠিক দাম দিয়েছে। +{{coins}}। কাজ হলো, কিন্তু এর জন্য checkout()-এ {{edits}} নম্বর এডিট আর আরেকবার redeploy লাগল।',
    'l1-fail-or':
      '😵 রহিমের পাঞ্জাবি শাড়ির ছাড় পেয়ে গেল। || মানে “যেকোনো একটা হলেই চলবে”, তাই ৳৩,০০০-এর বেশি সব অর্ডারই ছাড় পেল। বোর্ডে দুটো শর্তই লাগবে: &&।',
    'l1-fail-noCat':
      '😵 রহিমের পাঞ্জাবিতে ১০% ছাড় পড়ল। শাড়ির শর্ত বাদ দিয়ে if ছোট হলো, কিন্তু ভুলও হলো: নিয়মে দুটো শর্ত, কোডেও দুটোই রাখতে হবে।',
    'l1-fail-extra':
      '😵 নুসরাতের ৳৬,০০০-এর শাড়ি দুটো if-এই মিলে গেছে: ১০% + ১৫% = ২৫% ছাড়। আলাদা if জানে না ওপরেরটা আগেই কত দিয়েছে। ছাড় ঠিক করল branch-এর সাজানো, বোর্ড না।',
    'l1-fail-bottom':
      '😵 নুসরাতের ৳৬,০০০-এর শাড়ি শাড়ির branch-এ (১০%) থেমে গেছে, নিচের ১৫%-এ পৌঁছায়ইনি। else-if শিকলে প্রথম মিলটাই জেতে, তাই ক্রমটা নিজেই একটা লুকানো নিয়ম।',
    'l1-fail-first':
      '😵 রহিমের ৳৫,৫০০-এর পাঞ্জাবি নতুন পাঞ্জাবির branch-এ (৫%) থেমে গেছে, ১৫%-এ পৌঁছায়নি। ওপরে একটা নিয়ম বসাতেই চুপচাপ একটা পুরোনো নিয়ম বদলে গেল।',
    'l1-fail-reuse':
      '😵 শাড়ির লাইন এডিট করতেই সেটা ভেঙে গেল: তানিয়ার ৳২,৫০০-এর শাড়ি এখন ১০% পাচ্ছে (বোর্ডে লেখা ৳৩,০০০-এর বেশি), আর করিমের পাঞ্জাবি ৫%-এর বদলে ১০%। এক লাইন এডিট, দুটো পুরোনো নিয়ম বদলে গেল।',
    'level1-done':
      'লেভেল শেষ! সব নিয়ম কাজ করছে, কিন্তু প্রতিটার জন্য checkout() এডিট, অ্যাপ redeploy, আর আশা করা যে branch-এর ক্রম ঠিক আছে।',

    'idle2-1': 'আজকের বোর্ড: {{rule}}। কোন ব্লকগুলো ঠিক এই কথাটা বলে?',
    'idle2-2': 'বোর্ডে নতুন অফার: {{rule}}। ব্লক বাছুন। checkout() যেমন আছে তেমনই থাকবে।',
    'idle2-3': 'আজকের শেষ অফার: {{rule}}। এখানে কি আদৌ And লাগবে?',
    picked2: 'আপনি বানালেন: {{choice}}। চালান চাপুন: প্রতিটা কাস্টমারের জন্য কাউন্টার rule.interpret(cart) কল করবে।',
    build:
      'কাউন্টার নিয়মটা object-এর একটা tree হিসেবে বানাল: {{choice}}। পুরো “এডিট” বলতে এটুকুই: checkout()-এ কোনো if যোগ হয়নি, কিছু redeploy-ও হয়নি।',
    cart: '{{name}} এলেন {{item}} নিয়ে, দাম {{total}}। কাউন্টার tree-র root-এ একটাই কল করে: rule.interpret(cart)।',
    'enter-and': 'And নিজে কোনো ছাড়ের নিয়ম জানে না। সে একই কার্ট বাঁ দিকের child-কে দেয়: left.interpret(cart)।',
    'enter-or': 'Or প্রথমে একই কার্ট বাঁ দিকের child-কে দেয়: left.interpret(cart)।',
    'leaf-total': 'TotalAbove context থেকে একটাই তথ্য পড়ে, cart.total: {{total}} কি {{amount}}-এর চেয়ে বেশি? {{answer}}।',
    'leaf-cat': 'CategoryIs context থেকে একটাই তথ্য পড়ে, cart.category: "{{actual}}" আর "{{want}}" কি একই? {{answer}}।',
    'combine-and': 'দুই child-ই উত্তর দিয়েছে। And মেলায়: {{left}} AND {{right}} = {{answer}}।',
    'skip-and': 'বাঁ দিক false, তাই ডান দিক যা-ই বলুক And false। ডান child-কে জিজ্ঞেসই করে না।',
    'combine-or': 'দুই child-ই উত্তর দিয়েছে। Or মেলায়: {{left}} OR {{right}} = {{answer}}।',
    'skip-or': 'বাঁ দিক true, তাই Or এরই মধ্যে true। ডান child-কে জিজ্ঞেসই করে না।',
    'result-yes': 'tree বলল true: ছাড় {{pct}}, {{name}} দিলেন {{paid}}, ঠিক বোর্ডে যেমন লেখা।',
    'result-no': 'tree বলল false: ছাড় নেই, {{name}} দিলেন {{paid}}। ঠিক আছে, অফারটা এই কার্টে খাটে না।',
    'result-loss': 'tree বলল true, তাই ছাড় পড়ল {{pct}}। কিন্তু বোর্ডের অফার এই কার্টে খাটে না! দোকানের লোকসান {{diff}}।',
    'result-short': 'tree বলল false, তাই {{name}} কোনো ছাড় পেলেন না। কিন্তু বোর্ডে লেখা {{expected}} ছাড়! কাস্টমার রেগে আগুন।',
    'done-ok':
      'সব কাস্টমার ঠিক দাম দিয়েছে। +{{coins}}। নতুন নিয়ম মানে শুধু ব্লকের নতুন একটা tree: checkout() ছোঁয়াও হয়নি, redeploy-ও না।',
    'done-catOnly':
      '😵 তানিয়ার ৳১,২০০-এর শাড়িতে ১০% ছাড় পড়ল। শুধু CategoryIs("saree") যেকোনো শাড়ির জন্যই true; বোর্ডে আরও লেখা “৳৩,০০০-এর বেশি”। দুটো শর্ত মানে দুটো ব্লক নিয়ে একটা And।',
    'done-amount':
      '😵 TotalAbove(300) প্রায় সব কার্টেই true, তাই তানিয়ার ৳১,২০০-এর শাড়ি ছাড় পেয়ে গেল। tree ঠিক তা-ই করেছে যা তার ব্লক বলে; ব্লকগুলোই ভুল কথা বলছিল।',
    'done-wrongCat':
      '😵 করিমের পাঞ্জাবি কিছুই পেল না, আর তানিয়ার শাড়ি পেল ৫%। And ঠিক ছিল, কিন্তু CategoryIs("saree") ভুল ব্লক: একটা leaf শুধু সেটাই দেখে যা দিয়ে তাকে বানানো হয়েছে।',
    'done-noCat2':
      '😵 শুধু TotalAbove(2000) দিয়ে তানিয়ার শাড়ি পাঞ্জাবির ছাড় পেয়ে গেল। একটা ব্লক বাদ দিলে নিয়মটা বোর্ডের চেয়ে বড় হয়ে যায়।',
    'done-andSaree':
      '😵 রহিমের ৳৫,৫০০-এর পাঞ্জাবি কিছুই পেল না। বোর্ডে লেখা “৳৫,০০০-এর বেশি যেকোনো অর্ডার”: শর্ত একটাই। একটা TotalAbove ব্লক নিজেই একটা পুরো নিয়ম।',
    'done-zero':
      '😵 TotalAbove(500) নুসরাতের ৳৩,৪৫০-এর শাড়িতে ১৫% ছাড় দিয়ে দিল। একটা শূন্য বাদ, একটা ভুল ব্লক। কিন্তু খেয়াল করুন: ঠিক করতে শুধু ব্লক বদলাতে হবে, checkout() এডিট না।',
    'level2-done':
      'লেভেল শেষ! তিনটা নতুন নিয়ম, checkout()-এ শূন্য এডিট, শূন্য redeploy। প্রতিটা নিয়ম ছিল একটা tree; root-এ interpret(cart) একে একে প্রতিটা ব্লককে জিজ্ঞেস করেছে।',

    'build-q1':
      'মিতু আপার ঈদের নিয়মে OR লাগবে, অথচ ভাষায় এখনো কোনো Or ব্লক নেই। এটা আপনি লিখবেন। প্রথমে: কাউন্টার আর অন্য ব্লকরা যেন ব্যবহার করতে পারে, সেজন্য Or কী হবে?',
    'wrong-q1-flag':
      'তাতে And এডিট হয়, যে পুরোনো class সব নিয়মই ব্যবহার করছে, আর প্রতিটা And-কে এখন mode চেক করতে হবে। নতুন grammar নিয়ম মানে নতুন class, পুরোনো class-এ নতুন switch না।',
    'wrong-q1-counter':
      'এটা তো আবার লেভেল ১: প্রতিটা নতুন ধরনের নিয়মের জন্য checkout()-এ একটা করে if বাড়ে। কাউন্টারের শুধু একটা জিনিস জানা উচিত: Rule, যার আছে interpret(cart)।',
    'build-q2':
      'ঠিক: implements Rule, তাই অন্য সব ব্লকের মতো Or-এরও interpret(cart) আছে, আর সে tree-র যেকোনো জায়গায় বসতে পারে। এবার: Or.interpret(cart) উত্তর বের করবে কীভাবে?',
    'wrong-q2-hard':
      'এতে Or-এর ভেতরে একটা নিয়মই hard-code হয়ে যায়, সে শুধু শাড়ি আর ৳৫,০০০-এর জন্য কাজ করবে। Or-কে যেকোনো দুটো ব্লকের জন্য কাজ করতে হবে, এমনকি পুরো sub-tree-র জন্যও: তাকে child-দের জিজ্ঞেস করতেই হবে।',
    'wrong-q2-and': 'এটা তো And: দুটোই true হতে হবে। Or true হয় যেকোনো একটা child true হলেই, তাই উত্তর মেলায় || দিয়ে।',
    'build-ready': 'হয়ে গেল: একটাই নতুন class। And, TotalAbove, CategoryIs বা checkout()-এ ০ লাইন বদল। “Or ব্লক ব্যবহার করুন” চাপুন।',
    'build-done': 'Or তৈরি। চালান চাপুন: কাউন্টার এটা দিয়ে আজকের নিয়ম বানাবে, আর interpret(cart) কাজ করবে আগের মতোই।',
    'idle3-1': 'আজকের বোর্ড: {{rule}}। চালান চাপুন।',
    'idle3-2': 'এবার Or-এর ভেতরে আস্ত একটা And: {{rule}}। পুরোনো ব্লক, নতুন ব্লক, একই interpret()। চালান চাপুন।',
    'idle3-3': 'এবার উল্টো, And-এর ভেতরে একটা Or: {{rule}}। চালান চাপুন।',
    'l3-build': 'কাউন্টার নতুন Or ব্লক পুরোনোগুলোর সাথে জোড়া দিল: {{choice}}। আর কিছুই বদলায়নি।',
    'done-new-1': 'ছাড় একদম ঠিক! +{{coins}}। Or তার child-দের জিজ্ঞেস করেছে, আর বাঁ দিক true হতেই আগেভাগে থেমে গেছে।',
    'done-new-2':
      'ছাড় একদম ঠিক! +{{coins}}। Or-এর বাঁ child যে আস্ত একটা And, তাতে Or-এর কিছু যায় আসে না: সে শুধু তার ওপর interpret(cart) কল করেছে। এটাই recursion।',
    'done-new-3': 'ছাড় একদম ঠিক! +{{coins}}। একটা পুরোনো And নতুন Or-কে child হিসেবে রাখল, And-এর একটা লাইনও না বদলে।',
    'level3-done':
      'গেম শেষ! নিয়মের একটা ভাষা হয়ে গেল ছোট ছোট class-এর একটা tree। প্রতিটা class নিজের grammar নিয়মটা জানে, interpret() tree ধরে ঘুরে আসে, আর নতুন ধরনের নিয়ম মানে শুধু একটা নতুন class।',
  },

  codeComments: {
    context: 'Context: যে তথ্য সব নিয়ম পড়ে',
    abstract: 'AbstractExpression: প্রতিটা ব্লকের আছে interpret()',
    terminal: 'TerminalExpression: leaf, কার্ট থেকে পড়ে',
    readsTotal: 'একটাই তথ্য: মোট দাম কি এর বেশি?',
    readsCategory: 'একটাই তথ্য: এটা কি এই category?',
    nonterminal: 'NonterminalExpression: দুটো নিয়ম মেলায়',
    holdsRules: 'child যেকোনো Rule হতে পারে, আরেকটা And-ও',
    asksLeft: 'আগে বাঁ child-কে জিজ্ঞেস…',
    shortCircuit: '…বাঁ দিক true হলে তবেই ডান দিক',
    client: 'Client: বিলিং কাউন্টার',
    oneCall: 'root-এ একটাই কল; বাকিটা tree নিজে করে',
    payOrNot: 'নিয়ম true বললে তবেই ছাড়',
    buildTree: 'বোর্ডের নিয়ম, object-এর tree হিসেবে বানানো',
    withoutIntro: 'কোনো pattern নেই: প্রতিটা নিয়ম checkout()-এর ভেতরে একটা if',
    everyRuleHere: 'বোর্ডের সব অফার শেষমেশ এখানেই ঢোকে',
    orderMatters: 'প্রথম মিলটাই জেতে: ক্রমটা একটা লুকানো নিয়ম',
    redeploy: 'প্রতিটা নিয়ম বদল = এই function এডিট + redeploy',
    withoutNext: '“শাড়ি OR ৳৫,০০০-এর বেশি”? আরেকটা branch, আরেকবার redeploy',
    withAdd: 'নতুন grammar নিয়ম = একটা নতুন class',
    sameInterface: 'বাকি সব ব্লকের মতো একই interface',
    recursive: 'child-দের জিজ্ঞেস করো: তারা আস্ত tree-ও হতে পারে',
    orShort: 'বাঁ দিক false হলে তবেই ডান child',
    othersSame: 'পুরোনো class: একটা লাইনও এডিট হয়নি',
    withUse: 'নতুন ব্লক পুরোনোগুলোর সাথে nest করুন',
    nested: 'And-কে ধরে রাখা একটা Or: যেকোনো আকার চলে',
    sameCall: 'কাউন্টারের কল আগের মতোই',
    withZero: 'পুরোনো কোড এডিট: ০ লাইন। pattern ছাড়া: আরেকটা else if, আর একটা redeploy',
  },

  compare: {
    without: {
      title: 'checkout()-এ if/else হিসেবে hard-code করা নিয়ম',
      points: [
        'বোর্ডের প্রতিটা অফার একই checkout() function-এ আরেকটা branch হয়ে ঢোকে।',
        'প্রতিটা নিয়ম বদল মানে checkout() এডিট আর পুরো বিলিং অ্যাপ redeploy।',
        'branch-এর ক্রম চুপচাপ ছাড় ঠিক করে দেয়: একটা ভুল জায়গার else if মানে ডাবল ছাড় বা হাতছাড়া বিক্রি।',
        'AND / OR মেলাতে প্রতিটা শর্ত হাতে নতুন করে লিখতে হয়, তাই এক লাইনের এডিটে কয়েকটা পুরোনো নিয়ম বদলে যেতে পারে।',
      ],
    },
    with: {
      title: 'প্রতিটা নিয়ম expression object-এর একটা tree',
      points: [
        'প্রতিটা grammar নিয়মের জন্য ছোট্ট একটা class: TotalAbove আর CategoryIs context পড়ে, And দুটো নিয়ম মেলায়।',
        'নিয়ম বানানো হয় সেই object-গুলোর tree দিয়ে; checkout() শুধু rule.interpret(cart) কল করে।',
        'অফার বদলানো মানে অন্য একটা tree বানানো: checkout() এডিট নেই, redeploy নেই।',
        'নতুন grammar নিয়ম (Or) মানে একই interpret() সহ একটা নতুন class; পুরোনো ব্লকের সাথে যেকোনো আকারে nest হয়।',
      ],
    },
    benefit:
      'Interpreter নিয়মকে data বানিয়ে ফেলে: ছোট একটা ভাষার প্রতিটা বাক্য object-এর একটা tree, যে নিজের হিসাব নিজেই করে। নতুন বাক্যে কোড বদলাতে হয় না, আর নতুন grammar নিয়ম মানে নতুন class, তাই যা কাজ করছে তা না ছুঁয়েই ভাষাটা বাড়ে।',
    whenToUse: [
      'ছোট আর স্থির একটা grammar-এর নিয়ম বা expression আছে (ছাড়ের নিয়ম, filter, search query, access rule), যেগুলো ইউজার বা অ্যাডমিন জোড়া দিয়ে বানায়।',
      'একই নিয়ম বারবার আলাদা আলাদা data-র ওপর হিসাব করতে হয় (প্রতিটা কার্ট, প্রতিটা request, প্রতিটা row)।',
      'কোডের চেয়ে নিয়ম অনেক বেশি বদলায়, আর আপনি চান redeploy ছাড়াই নিয়ম বানানো, রাখা বা বদলানো যাক। (বড় grammar হলে বরং parser generator ব্যবহার করুন।)',
    ],
  },
}

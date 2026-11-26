import type { DeepPartial } from '@/types/pattern'
import type { MementoContent } from './content.en'

// Technical terms stay in English (snapshot, undo, save, restore, history, field, private, public, class…).
// Class and method names (PostEditor, PostSnapshot, History, PostScreen, save(), restore()) are never translated.
// Never glue a Bangla suffix onto a {{placeholder}} ("{{price}}-এ" reads wrong); rephrase instead.
// Anything missing here falls back to content.en.ts automatically.
export const bn: DeepPartial<MementoContent> = {
  title: 'Memento',
  tagline: 'Object-এর জন্য save point: সে নিজের state একটা সিল-করা snapshot-এ ভরে রাখে, আর Undo সেই snapshot ফেরত দেয়।',
  intent:
    'একটা object-এর ভেতরের state একটা snapshot-এ (memento) ধরে রাখুন, যাতে পরে আবার ফিরিয়ে আনা যায়, অথচ সেই state বাইরের কারও সামনে খুলতে না হয়। Snapshot খুলতে পারে শুধু যে object সেটা বানিয়েছে; যে history সেটা জমা রাখে, সে শুধু যত্ন করে রেখে দেয়।',

  scenario: {
    title: 'পৌষ মেলার আগে তানিয়ার পিঠার পোস্ট',
    paragraphs: [
      'পৌষ মাস এসে গেছে, আর মিরপুরের ফ্ল্যাট থেকে তানিয়া ঘরে বানানো পিঠা বিক্রি করে: ভাপা পিঠা প্রতি পিস ৳৩০, পাটিসাপটা ৳৪০, শুঁটকি ভর্তা দিয়ে চিতই ৳২০। প্রতি সন্ধ্যায় সে গল্প নামের একটা সোশ্যাল অ্যাপে তার পেজ “তানিয়ার পিঠাঘর”-এর জন্য পোস্ট লেখে। পোস্টটা শুধু Friends-দের জন্য, কারণ পিঠা নিতে আসার ঠিকানা হিসেবে ওতে তার বাসার ঠিকানা দেওয়া থাকে।',
      'পোস্ট লিখতে গেলেই ছোটখাটো দুর্ঘটনা। আঙুল ফসকে ৳৩০ হয়ে যায় ৳৩০০। ছোট বোন মিতু পোস্টটা “একটু গুছিয়ে দিতে” গিয়ে ভুল করে Public চেপে দেয়। তাই অ্যাপে Save আর Undo বাটন আছে। প্রশ্ন হলো, Undo পুরোনো পোস্টটা মনে রাখে কীভাবে?',
      'স্ক্রিনের কোড যদি নিজেই editor-এর field গুলো হাতে হাতে কপি করে, তাহলে তাকে সব field চিনতে হয়, আর যেদিন একটা (audience) ভুলে যায়, সেদিন Undo লেখা ফেরত আনে কিন্তু পোস্ট থেকে যায় Public। Memento-তে editor নিজেই নিজের state একটা সিল-করা snapshot-এ ভরে, আর একটা History stack সেই snapshot গুলো রাখে, ভেতরে কখনো না তাকিয়েই।',
    ],
    problem:
      'Undo করতে হলে কাউকে না কাউকে পুরোনো state মনে রাখতে হয়। UI নিজেই যদি editor-এর field কপি করে, তাহলে field গুলো public রাখতে হয়, UI-কে প্রতিটা field চিনতে হয়, একটা field বাদ পড়লে বা ভুল করে একই reference রাখলে ভুল পোস্ট ফিরে আসে, আর প্রতিটা নতুন field (একটা ছবি) এলে undo-র কোড আবার বদলাতে হয়।',
  },

  visual: {
    // Game HUD
    levelsLabel: 'গেমের লেভেল',
    levelLabel: 'লেভেল {{n}}',
    level1Title: 'হাতে হাতে কপি',
    level2Title: 'Save point',
    level3Title: 'নতুন field: ছবি',
    level1Goal:
      'এখনো কোনো প্যাটার্ন নেই: PostEditor-এর field গুলো public, আর প্রতিটা edit-এর আগে PostScreen-এর কোড নিজেই হাতে হাতে backup রাখে। কীভাবে backup রাখবে বেছে নিন, তারপর দেখুন Undo কী করে আর কোন পোস্টটা বের হয়।',
    level2Goal:
      'এখন PostEditor নিজেকে একটা সিল-করা PostSnapshot-এ save করে, আর History সেই snapshot গুলো রাখে। কখন save করবেন, snapshot কে বানাবে, বা কীভাবে undo করবেন বেছে নিন, আর দেখুন ঠিক পোস্টটা বের হচ্ছে কি না।',
    level3Goal:
      'তানিয়া পোস্টে একটা ছবি চায়, আর Undo-কে ছবিটাও ফেরত আনতে হবে। History বা PostScreen না ছুঁয়ে photo field যোগ করুন, তারপর তিনটা পোস্টে চালিয়ে দেখুন।',
    locked: 'বন্ধ',
    earned: 'পিঠার অর্ডার',
    restart: 'গেম আবার শুরু',
    turnOf: 'পোস্ট {{n}}/{{total}}',

    // The story
    appName: 'গল্প',
    shopName: 'তানিয়ার পিঠাঘর',
    clientWho: 'গল্প অ্যাপে তানিয়া',
    btnSave: 'Save',
    btnUndo: 'Undo',
    btnPost: 'পোস্ট',
    txtBhapa: 'খেজুরের গুড় দিয়ে গরম ভাপা পিঠা, প্রতিদিন সকালে টাটকা!',
    txtPatishapta: 'ক্ষীরের পুর দেওয়া পাটিসাপটা। শুক্রবারের মধ্যে অর্ডার দিন!',
    txtChitoi: 'শুঁটকি ভর্তা দিয়ে চিতই পিঠা, পৌষ মেলা স্পেশাল',
    txtScribble: 'পিঠাআআ!!! 🔥🔥 সেল সেল সেল',
    perPiece: 'প্রতি পিস {{price}}',
    audPublic: 'Public',
    audFriends: 'Friends',
    pickup: 'পিঠা নিন: তানিয়ার বাসা, মিরপুর ১০',
    photoLabel: 'ছবি',
    noPhoto: 'ছবি নেই',
    photoBhapa: 'ভাপা পিঠা',
    photoPatishapta: 'পাটিসাপটা',
    photoBlurry: 'ঝাপসা, অন্ধকার',
    photoChitoi: 'চিতই',

    // Roles and nodes
    clientRole: 'Client',
    l1EditorRole: 'প্যাটার্ন নেই',
    originatorRole: 'Originator',
    caretakerRole: 'Caretaker',
    mementoRole: 'Memento',
    noPatternRole: 'প্যাটার্ন নেই',
    publicFields: 'public field: যে কেউ পড়তে ও বদলাতে পারে',
    privateFields: 'private field: শুধু PostEditor ছোঁয়',
    backupsNote: 'editor-এর field গুলোর PostScreen-এর নিজের কপি',
    storeEmpty: 'খালি',
    notCopied: 'কপি হয়নি!',
    sameObject: 'editor-এর সাথে একই object!',
    oneVar: 'একটাই variable',
    historyNote: 'Snapshot রাখে, কখনো খোলে না।',
    historyEmpty: 'খালি: undo করার কিছু নেই',
    snapshotLabel: 'Snapshot',
    sealed: 'সিল করা',
    liveCard: 'snapshot না: আসল editor!',
    mementoNote: 'বদলানো যায় না। ভেতরে কী আছে, পড়তে পারে শুধু PostEditor।',
    newTag: 'নতুন',
    notBuilt: 'এখনো যোগ হয়নি',
    packing: 'snapshot ভরছে…',
    errPrivate: 'editor.audience is private',
    errSealed: 'a snapshot is sealed: no .price',
    posted: 'গল্প-তে পোস্ট হয়েছে',
    draft: 'ড্রাফট',
    ordersLine: '{{n}}টা অর্ডার · {{coins}}',

    // Reactions
    reactPrice: '😂 একটা পিঠার দাম {{price}}?!',
    reactPrice2: '🤔 আপা, টাইপো নাকি?',
    reactLeak: '🕵️ অচেনা একজন: “মিরপুর ১০, কোন বিল্ডিং?”',
    reactLeak2: '😟 তানিয়ার বাসার ঠিকানা এখন সবার সামনে',
    reactText: '🤨 “সেল সেল সেল” মানে?',
    reactOk: '😋 দশ পিস বুক করলাম!',

    // Situations
    situationLabel: 'পরিস্থিতি',
    'sit1-1':
      'তানিয়ার ভাপা পিঠার পোস্ট: প্রতি পিস ৳৩০, শুধু Friends। সে দাম বদলাতে যাচ্ছে, তাই আগে PostScreen-কে পোস্টের backup রাখতে হবে।',
    'sit1-2': 'ছোট বোন মিতু ফোন নিয়ে পাটিসাপটার পোস্টটা “একটু গুছিয়ে দিচ্ছে”। কোন কোন field-এ হাত দেবে, কেউ জানে না।',
    'sit1-3': 'চিতইয়ের পোস্টে পরপর দুটো edit: প্রথমে দাম, তারপর audience। তানিয়া দুটোই undo করতে চায়।',
    'sit2-1': 'ভাপা পিঠা ৳৩০, শুধু Friends। তানিয়া দামটা আবার টাইপ করতে যাচ্ছে।',
    'sit2-2': 'মিতু আবার পাটিসাপটার পোস্ট “গোছাতে” যাচ্ছে। এবার PostEditor-এর field গুলো private।',
    'sit2-3':
      'দুটো edit-এর প্রতিটার আগে তানিয়া save করেছিল। এখন চিতইয়ের পোস্টে লেখা ৳২০০ আর Public, আর History-তে আছে দুটো snapshot। সে আসল পোস্টটা ফেরত চায়।',
    'sit3-1': 'ভাপা পিঠার পোস্টে এখন একটা ছবি আছে। মিতু ভুল করে ছবিটা মুছে ফেলছে।',
    'sit3-2': 'পাটিসাপটার পোস্টে তানিয়া একটা ঝাপসা ছবি বসিয়ে দেয়, আর ভুল করে দাম লেখে ৳৪০০।',
    'sit3-3': 'দুটো save আগে চিতইয়ের পোস্টে ছবি ছিল, দাম ছিল ৳২০। এর মধ্যে ছবি উধাও, দাম লেখা ৳২০০। দুবার undo করুন।',

    // Questions and choices
    yourChoice: 'আপনার পছন্দ',
    'ask1-1': 'edit-এর আগে PostScreen কীভাবে backup রাখবে?',
    'ask1-2': 'onSave() কোন কোন field কপি করবে?',
    'ask1-3': 'PostScreen তার backup গুলো কোথায় রাখবে?',
    'ask2-1': 'অ্যাপ history.push(editor.save()) কখন ডাকবে?',
    'ask2-2': 'Snapshot কে বানাবে?',
    'ask2-3': 'Undo বাটন কী করবে?',
    optCopyAll: 'তিনটা field-ই একটা নতুন object-এ কপি',
    optRef: 'backup = editor (একই object রেখে দাও)',
    optTextPrice: 'শুধু text আর price কপি (audience তো সহজে বদলায় না)',
    optOneVar: 'একটাই backup variable, প্রতি save-এ নতুন করে লেখা হয়',
    optList: 'একটা list: প্রতি save-এ একটা কপি push, undo-তে pop',
    optBefore: 'edit-এর আগে',
    optAfter: 'edit-এর পরে',
    optNever: 'কখনো না: Undo নিজেই বুঝে নেবে',
    optEditorSaves: 'editor.save(): editor নিজের field নিজেই ভরে',
    optUiBuilds: 'PostScreen field পড়ে নিজেই PostSnapshot বানায়',
    optPushEditor: 'history.push(editor): editor-টাকেই রেখে দাও',
    optUndoOnce: 'একবার undo',
    optUndoTwice: 'দুবার undo: দুইবার pop আর restore',
    optPeek: 'ওপরের snapshot খুলে ভেতরের দামটা ঠিক করে দাও',

    // Result
    resultOk: '{{n}}টা অর্ডার: +{{coins}}',
    resultPrice: 'ভুল দাম বেরিয়ে গেছে: একটাও অর্ডার নেই!',
    resultLeak: 'সবার জন্য পোস্ট হয়ে গেছে: বাসার ঠিকানা ফাঁস!',
    resultText: 'মিতুর আঁকিবুঁকি বেরিয়ে গেছে: একটাও অর্ডার নেই!',

    // Builder (level 3)
    builderTitle: 'পোস্টে একটা ছবি যোগ করুন',
    builderStep1: 'ধাপ ১ · ছবি save করবে কে?',
    builderStep2: 'ধাপ ২ · History কি বদলাবে?',
    q1: 'তানিয়া পোস্টে ছবি চায়, আর Undo-কে ছবিটাও ফেরত আনতে হবে। কোন কোন class বদলাবে?',
    q1Editor: 'PostEditor আর তার PostSnapshot: editor নিজের নতুন field নিজেই save করবে',
    q1Ui: 'PostScreen: লেভেল ১-এর মতো editor.photo একটা backup-এ কপি করবে',
    q1All: 'সবাই: PostEditor, PostSnapshot, History আর PostScreen',
    q2: 'History snapshot গুলো রাখে। ছবিও রাখতে হলে কি তাকে বদলাতে হবে?',
    q2List: 'হ্যাঁ: snapshot-এর পাশে ছবির একটা আলাদা list লাগবে',
    q2No: 'না: সে সিল-করা snapshot রাখে, ভেতরে যা-ই থাকুক',
    q2Check: 'হ্যাঁ: প্রতিটা snapshot-এ ছবি আছে কি না, সেটা তাকে দেখতে হবে',
    editsLine: 'PostEditor + PostSnapshot: একটা করে নতুন field',
    zeroEdits: 'History: ০ লাইন · PostScreen: ০ লাইন',
    flyIn: 'একটা পোস্টে চালিয়ে দেখি',

    // Turn
    playButton: 'চালান',
    nextTurn: 'পরের পোস্ট',
    finishLevel: 'লেভেল শেষ',
    tryAgain: 'আবার চেষ্টা',

    // Level end
    levelDone: 'লেভেল {{n}} শেষ!',
    nextLevel: 'পরের লেভেল',
    replayLevel: 'এই লেভেল আবার খেলুন',
    playAgain: 'লেভেল ১ থেকে আবার খেলুন',
    l1Teaser:
      'Undo কাজ করেছে, তবে শুধু এই কারণে যে PostScreen editor-এর প্রতিটা field চিনত, আর field গুলো public রাখতে হয়েছিল। একটা field বাদ পড়ায় ঠিকানা ফাঁস হলো; একই reference রাখায় টাইপোটা থেকে গেল। এবার তানিয়া পোস্টে ছবি চায়। PostScreen-এর কপির কোড কি আবার বদলাতে হবে?',
    l2Summary:
      'PostScreen একটা field-ও ছোঁয়নি। PostEditor নিজের state একটা সিল-করা PostSnapshot-এ ভরেছে, History না খুলেই snapshot গুলো সাজিয়ে রেখেছে, আর Undo শুধু ঠিক snapshot-টা ফেরত দিয়েছে।',
    recapTitle: 'যা শিখলেন',
    recap1:
      'Memento ছাড়া UI নিজে হাতে হাতে editor-এর field কপি করে: field গুলো public রাখতে হয়, একটা field বাদ পড়লে বা একই reference রাখলে ভুল পোস্ট ফেরে, আর প্রতিটা নতুন field-এ undo-র কোড বদলাতে হয়।',
    recap2:
      'Memento: Originator (PostEditor) save() দিয়ে নিজের state একটা অপরিবর্তনীয় snapshot-এ ভরে, আর restore(s) দিয়ে খুলে ফেরত বসায়। Caretaker (History) শুধু snapshot push আর pop করে, কখনো খোলে না।',
    recap3:
      'নতুন field (ছবি) এসে বদলেছে শুধু PostEditor আর তার PostSnapshot। History আর PostScreen-এ ০ লাইন বদল, আর Undo ছবিটাও ফেরত এনেছে।',

    whatsHappening: 'কী হচ্ছে',
    note: 'তানিয়া, মিতু, গল্প অ্যাপ, দাম আর অর্ডার সবই এই উদাহরণের জন্য বানানো।',
  },

  steps: {
    // Level 1: no pattern
    tutorial:
      'এখনো প্যাটার্ন নেই: তানিয়া edit করার আগে PostScreen-কে নিজেই পোস্টের backup রাখতে হবে। ঠিক উত্তরটা আগে থেকেই বাছা আছে: তিনটা field-ই একটা নতুন object-এ কপি। Play চাপুন আর দেখুন।',
    'idle1-1': 'তানিয়া দাম বদলাতে যাচ্ছে। PostScreen কীভাবে backup রাখবে?',
    'idle1-2': 'মিতু পোস্টটা edit করতে যাচ্ছে। onSave() কোন কোন field কপি করবে?',
    'idle1-3': 'দুটো edit আসছে, আর তানিয়া দুটোই undo করতে চাইবে। PostScreen backup গুলো কোথায় রাখবে?',
    picked1: 'আপনি বেছেছেন: {{choice}}। Play চাপুন, দেখুন Undo কী করে আর কোন পোস্টটা বের হয়।',
    'l1-click-save': 'তানিয়া Save চাপল। চলছে PostScreen.onSave(): পোস্টটা মনে রাখতে হবে স্ক্রিনের কোডকেই।',
    'l1-copy-all':
      'onSave() পড়ছে editor.text, editor.price আর editor.audience, তারপর একটা নতুন object-এ কপি করে backups-এ রাখছে। কাজ হচ্ছে, তবে শুধু এই কারণে যে field গুলো public, আর স্ক্রিন প্রতিটা field চেনে।',
    'l1-copy-some': 'onSave() editor.text আর editor.price কপি করে backups-এ রাখল। Audience কপি হয়নি: স্ক্রিনের কোড স্রেফ ভুলে গেছে।',
    'l1-copy-ref': 'backup = editor: কোনো কপি হলো না। “Backup” আসলে একই editor object-এর আরেকটা নাম মাত্র।',
    'l1-copy-slot': 'onSave() তিনটা field-ই তার একমাত্র backup variable-এ কপি করল: দাম {{price}}, audience {{aud}}।',
    'l1-copy-push2': 'onSave() list-এ দ্বিতীয় একটা কপি push করল: দাম {{price}}, audience {{aud}}। প্রথম কপিটা নিচে রয়ে গেছে।',
    'l1-copy-over':
      'onSave() আবার সেই একই backup variable-এ পোস্টটা কপি করল: দাম {{price}}, audience {{aud}}। আসল দামের প্রথম কপিটা মুছে গেল, আর ফেরত আসবে না।',
    'l1-edit-price': 'তানিয়া দামটা আবার টাইপ করছে, আর আঙুল ফসকে গেল: ৳৩০ এর বদলে দাম হয়ে গেল {{price}}।',
    'l1-edit-ref': 'আঙুল ফসকে দাম হলো {{price}}। আর দেখুন: backup-এও এখন একই দাম, {{price}}। একই object, তাই editor-এর সাথে সেটাও বদলে গেছে।',
    'l1-edit-mitu': 'মিতু লেখাটা বড় হাতের অক্ষরে নতুন করে লিখল, আর ভুল করে Public চেপে দিল। বাসার ঠিকানা এখন অচেনা লোকের দিকে যাচ্ছে।',
    'l1-edit-mitu-ref': 'মিতু লেখা বদলাল আর Public চাপল। “Backup”-ও বদলে গেল: সেটা তো editor-এর সাথে একই object।',
    'l1-edit-price3': 'প্রথম edit: দাম হয়ে গেল {{price}}। উফ, একটা শূন্য বেশি।',
    'l1-edit-aud': 'দ্বিতীয় edit: audience উল্টে হয়ে গেল Public।',
    'l1-click-undo': 'তানিয়া Undo চাপল। চলছে PostScreen.onUndo()।',
    'l1-pop': 'onUndo() backups থেকে শেষ কপিটা pop করল।',
    'l1-pop-slot': 'onUndo() তার একমাত্র backup variable পড়ল। ওতে এখনো শেষ save-এর কপি: দাম {{price}}, audience {{aud}}।',
    'l1-undo-all': 'onUndo() প্রতিটা field একটা একটা করে editor-এ ফেরত কপি করল: দাম {{price}}, audience {{aud}}।',
    'l1-undo-some': 'onUndo() text আর price ফেরত কপি করল। কপিতে audience নেই, তাই পোস্ট থেকে গেল Public।',
    'l1-undo-ref': 'onUndo() “backup” থেকে editor-এ কপি করল: একই object নিজের ওপরেই। কিছুই বদলাল না; দাম এখনো {{price}}।',
    publish: 'তানিয়া পোস্ট চাপল: পোস্ট বের হলো, প্রতি পিস {{price}}, audience {{aud}}।',
    'react-price': 'কমেন্ট আসতে শুরু করল: “একটা পিঠার দাম {{price}}?!” কেউ অর্ডার দিল না।',
    'react-leak': 'পোস্টটা Public, আর তাতে তানিয়ার বাসার ঠিকানা। অচেনা লোকজন জিজ্ঞেস করছে কোন বিল্ডিং।',
    'react-text': 'পোস্ট বের হলো মিতুর আঁকিবুঁকি নিয়ে। লোকজন কিছুই বুঝল না, অর্ডারও দিল না।',
    'l1-ok-1':
      '{{n}}টা অর্ডার: +{{coins}}! Undo ৳৩০ ফেরত এনেছে, কারণ backup-টা ছিল সত্যিকারের কপি। কিন্তু প্রতিটা public field PostScreen-কে নিজে পড়তে হয়েছে।',
    'l1-ok-2':
      '{{n}}টা অর্ডার: +{{coins}}! তিনটা field-ই ফিরেছে, শুধু Friends। তবে editor-এর প্রতিটা field PostScreen-কে চিনতে হয়েছে, একটাও ভোলা চলবে না।',
    'l1-ok-3':
      '{{n}}টা অর্ডার: +{{coins}}! কপির list থাকায় দুবার Undo দুটো edit-ই পিছিয়ে দিল। আপনি হাতে হাতে একটা history stack বানিয়ে ফেললেন, আর এখনো প্রতিটা field নিজেই কপি করছেন।',
    'l1-fail-ref':
      '😵 backup = editor কোনো backup না: এটা একই object, তাই edit-এ দুটোই বদলে গেছে। Save point মানে state-এর একটা আলাদা কপি।',
    'l1-fail-textPrice':
      '😵 Audience কখনো কপিই হয়নি, তাই Undo সেটা ফেরত বসাতে পারেনি, আর ঠিকানা চলে গেছে Public-এ। UI যখন হাতে field কপি করে, তখন প্রতিটা field তাকে চিনতে হয়, আর মনেও রাখতে হয়।',
    'l1-fail-oneVar':
      '😵 একটা variable-এ একটাই save point ধরে। দ্বিতীয় save আসল ৳২০-এর কপিটা মুছে দিয়েছে, তাই দুবার Undo করেও ৳২০০-এর বেশি পেছানো গেল না। অনেকগুলো edit undo করতে save point-এর একটা stack লাগে।',
    'level1-done':
      'লেভেল শেষ! Undo কাজ করেছে, কিন্তু স্ক্রিনের কোডকে editor-এর public field-এ হাত ঢুকিয়ে প্রতিটা field নিজেই কপি করতে হয়েছে।',

    // Level 2: Memento
    'idle2-1': 'তানিয়া দামটা আবার টাইপ করতে যাচ্ছে। অ্যাপ কখন save করবে?',
    'idle2-2': 'মিতু edit করতে যাচ্ছে। PostEditor-এর field এখন private। Snapshot কে বানাবে?',
    'idle2-3': 'History-তে দুটো snapshot, আর পোস্টটা আসল অবস্থা থেকে দুটো edit দূরে। Undo কী করবে?',
    picked2: 'আপনি বেছেছেন: {{choice}}। Play চাপুন আর snapshot গুলোর দিকে নজর রাখুন।',
    'click-save': 'তানিয়া Save চাপল। অ্যাপ ডাকল history.push(editor.save()): editor-এর কাছে একটা snapshot চাইল।',
    save: 'editor.save(): PostEditor নিজের private field গুলো একটা নতুন PostSnapshot-এ ভরল: দাম {{price}}, audience {{aud}}। আর কাউকে সেগুলো পড়তে হলো না।',
    'save-photo':
      'editor.save(): PostEditor নিজের field গুলো, এখন ছবিসহ, একটা PostSnapshot-এ ভরল। নিজের field সে নিজেই চেনে; আর কারও চেনার দরকার নেই।',
    'save-after': 'editor.save() পোস্টটা এই মুহূর্তে যেমন আছে তেমনই ভরল, টাইপোসহ: দাম {{price}}, audience {{aud}}।',
    push: 'history.push(s): সিল-করা snapshot-টা stack-এর একদম ওপরে গেল। History এটা পড়তে পারে না, আর পড়ার দরকারও নেই।',
    'edit-price': 'তানিয়া দামটা আবার টাইপ করছে, আর আঙুল ফসকে গেল: দাম এখন {{price}}।',
    'edit-mitu': 'মিতু লেখাটা বড় হাতের অক্ষরে নতুন করে লিখল, আর ভুল করে Public চেপে দিল।',
    'click-undo': 'তানিয়া Undo চাপল। অ্যাপ ডাকল history.pop(), আর snapshot-টা editor-কে ফেরত দিল।',
    pop: 'history.pop(): ওপরের snapshot-টা stack থেকে বেরিয়ে এল, এখনো সিল করা।',
    empty: 'history.pop() কিছুই ফেরত দিল না: History খালি, তাই undo করার কিছু নেই।',
    restore: 'editor.restore(s): নিজের snapshot খুলতে পারে শুধু PostEditor, আর সে নিজেই প্রতিটা field ফেরত বসাল: দাম {{price}}, audience {{aud}}।',
    'restore-photo': 'editor.restore(s): PostEditor snapshot খুলে প্রতিটা field ফেরত বসাল, ছবিসহ: ছবি {{photo}}, দাম {{price}}।',
    'restore-typo': 'editor.restore(s) ঠিক যা save হয়েছিল তাই ফেরত আনল: দাম {{price}}। Snapshot নেওয়া হয়েছিল টাইপোর পরে।',
    'ui-builds': 'PostScreen নিজেই snapshot বানাতে চাইছে: new PostSnapshot(editor.text, editor.price, editor.audience)।',
    'err-private':
      '🔒 Compile error: editor.audience is private। স্ক্রিন editor-এর field পড়তে পারে না, তাই কোনো snapshot save হলো না।',
    'push-editor': 'অ্যাপ ডাকল history.push(editor): কোনো snapshot না, সরাসরি editor object-টাই।',
    'push-live': 'History-তে এখন editor-এর একটা জ্যান্ত link, তার state-এর সিল-করা কপি না।',
    'edit-live': 'মিতু লেখা বদলাল আর Public চাপল, আর History-র “save point”-ও সাথে সাথে বদলে গেল। এটা একই object।',
    'restore-live': 'editor নিজের থেকেই restore করল: পোস্ট তো এমনিতেই এরকম, তাই কিছুই বদলাল না।',
    peek: 'অ্যাপ ওপরের snapshot-টা খুলে হাতে দাম ৳২০ বসাতে চাইছে।',
    'err-sealed':
      '🔒 Snapshot সিল করা: History আর PostScreen শুধু একটা Snapshot দেখে, তাতে পড়ার বা বদলানোর মতো কোনো price নেই। পোস্ট যেমন ছিল তেমনই থাকল।',
    'l2-ok-1': '{{n}}টা অর্ডার: +{{coins}}! ঝুঁকির edit-এর আগেই save হয়েছিল, তাই Undo-র হাতে ভালো ৳৩০-এর version-টা ছিল।',
    'l2-ok-2': '{{n}}টা অর্ডার: +{{coins}}! PostEditor নিজের private field নিজেই save করেছে। ভেতরে কী আছে, স্ক্রিনের জানার দরকারই হয়নি।',
    'l2-ok-3':
      '{{n}}টা অর্ডার: +{{coins}}! দুবার pop, দুবার restore: History নতুন থেকে পুরোনো ক্রমে snapshot ফেরত দিয়েছে, একদম ৳২০ আর শুধু Friends পর্যন্ত।',
    'l2-fail-after':
      '😵 Save point নেওয়া হয়েছে টাইপোর পরে, তাই সে মনে রেখেছে ৳৩০০। ঝুঁকির বদলের আগে save করুন, তবেই Undo সেখানে ফিরতে পারবে।',
    'l2-fail-never':
      '😵 Undo-র ফেরার মতো কিছুই নেই। Memento তখনই কাজ করে যখন কেউ আগে save করে: edit-এর আগে history.push(editor.save())।',
    'l2-fail-uiBuilds':
      '😵 Field গুলো private, আর সেটাই আসল কথা: নিজের state দেখতে পারে শুধু Originator। তাকেই বলুন: editor.save()।',
    'l2-fail-pushEditor':
      '😵 History রেখেছে জ্যান্ত editor-টাকেই, তাই প্রতিটা edit-এ “save point”-ও বদলে গেছে। Memento মানে state-এর একটা জমাট কপি, যেটা বানায় editor.save()।',
    'l2-fail-undoOnce':
      '😵 একবার Undo মাত্র একটা save point পেছাল: আবার Friends হলো, কিন্তু দাম এখনো ৳২০০। দুটো edit মানে দুবার Undo।',
    'l2-fail-peek':
      '😵 PostEditor ছাড়া আর কেউ snapshot খুলতে পারে না, তাই বাইরে থেকে দাম ঠিক করা গেল না। Undo snapshot-টা editor.restore()-কে দেয়, দুবার।',
    'level2-done':
      'লেভেল শেষ! PostEditor নিজেই নিজেকে save আর restore করেছে, আর History সিল-করা snapshot গুলো সাজিয়ে রেখেছে। PostScreen একটা field-ও ছোঁয়নি।',

    // Level 3: a new field
    'build-q1': 'তানিয়া পোস্টে পিঠার একটা ছবি চায়, আর Undo-কে ছবিটাও ফেরত আনতে হবে। প্রথমে: কোন কোন class বদলাবে?',
    'wrong-q1-ui':
      'এটা তো আবার লেভেল ১: PostScreen-কে editor.photo পড়তে হবে, মানে ছবিটা public রাখতে হবে। Editor নিজের field নিজেই save করে।',
    'wrong-q1-all':
      'History আর PostScreen কখনো snapshot-এর ভেতরে তাকায় না, তাই নতুন field নিয়ে তাদের মাথাব্যথা নেই। বদলায় শুধু Originator আর তার Memento।',
    'build-q2':
      'ঠিক: PostEditor পেল একটা private photo field, আর PostSnapshot পেল সেটা ধরে রাখার জন্য আরেকটা field। এবার: History কি বদলাতে হবে?',
    'wrong-q2-list': 'History কখনো snapshot খোলে না। ছবি যায় snapshot-এর ভেতরে, তাই snapshot-এর সেই একই stack ছবিটাও রেখে দেয়।',
    'wrong-q2-check': 'তাহলে History-কে snapshot-এর ভেতরে পড়তে হতো, অথচ সে পারে না। ভেতরে কী আছে, সেটা শুধু PostEditor-এর ব্যাপার।',
    'build-ready':
      'হয়ে গেল: PostEditor আর PostSnapshot একটা করে field পেল। History: ০ লাইন, PostScreen: ০ লাইন। “একটা পোস্টে চালিয়ে দেখি” চাপুন।',
    'build-done': 'Photo field যোগ হয়েছে। Play চাপুন: Save আর Undo আগের মতোই একই method ডাকে।',
    'idle3-1': 'ভাপা পিঠার পোস্টে ছবি আছে, আর মিতু সেটা মুছতে যাচ্ছে। Play চাপুন।',
    'idle3-2': 'তানিয়া ছবিটা বদলাতে আর ভুল দাম লিখতে যাচ্ছে। Play চাপুন।',
    'idle3-3': 'History-তে দুটো snapshot; সবচেয়ে পুরোনোটায় আছে ছবি আর ৳২০। Play চাপুন।',
    'w-edit-photo': 'মিতু ডাস্টবিন আইকনে চাপল: editor.setPhoto(null)। পোস্ট থেকে ছবি উধাও।',
    'w-edit-photo-price': 'তানিয়া একটা ঝাপসা ছবি বসাল, আর দাম লিখল {{price}}।',
    'l3-done-1': '{{n}}টা অর্ডার: +{{coins}}! Undo-র সাথে ছবিও ফিরে এল, আর সেটা রাখতে History-র একটা লাইনও বদলাতে হয়নি।',
    'l3-done-2': '{{n}}টা অর্ডার: +{{coins}}! ছবি আর দাম একসাথে ফিরে এল, একটা সিল-করা snapshot থেকেই।',
    'l3-done-3': '{{n}}টা অর্ডার: +{{coins}}! দুবার Undo, আর ছবি ও ৳২০ ফেরত। সেই একই History, সেই একই Undo বাটন।',
    'level3-done':
      'গেম শেষ! Editor নিজের state নিজেই save আর restore করে, History শুধু সিল-করা snapshot রাখে, আর নতুন field এলে অন্য কিছুতে হাত দিতে হয় না।',
  },

  codeComments: {
    memento: 'Memento: পোস্টের একটা সিল-করা snapshot',
    opaque: 'History শুধু এটুকু দেখে: একটা snapshot, কোনো field না',
    onlyEditor: 'ভেতরে কী আছে পড়ে শুধু PostEditor',
    originator: 'Originator: editor নিজেই নিজেকে save ও restore করে',
    privateFields: 'private: আর কেউ পড়ে না, কপিও করে না',
    packsItself: 'নিজের state নিজেই ভরে',
    onlyEditorOpens: 'নিজের snapshot খোলে শুধু editor',
    caretaker: 'Caretaker: snapshot রাখে, কখনো খোলে না',
    neverLooks: 'সিল-করা snapshot-এর একটা stack',
    lastFirst: 'সবচেয়ে নতুন save point আগে বের হয়',
    client: 'Client: Save আর Undo বাটন',
    saveBeforeRisk: 'ঝুঁকির edit-এর আগেই save',
    oops: 'উফ: ৳৩০ এর বদলে ৳৩০০',
    undoButton: 'Undo: শেষ snapshot-টা নাও…',
    nothingToUndo: '…আর editor-কে ফেরত দাও',
    withoutIntro: 'প্যাটার্ন নেই: স্ক্রিন নিজেই editor-এর field হাতে কপি করে',
    publicFields: 'public, যাতে স্ক্রিন কপি করতে পারে',
    uiCode: 'undo-র কাজ PostScreen নিজেই করে',
    ownStack: 'নিজের কপির list',
    knowsEveryField: 'editor-এর প্রতিটা field তাকে চিনতে হয়',
    copyEach: 'নতুন object, প্রতিটা field, প্রতিবার',
    copyBack: 'আর সবগুলো একটা একটা করে ফেরত কপি',
    easyToMiss: 'এই লাইন ভুললেই পোস্ট থেকে যায় Public',
    withoutNext: 'Photo field এল? onSave() আর onUndo() আবার বদলাও',
    withAdd: 'নতুন field: বদলায় শুধু editor আর তার snapshot',
    newField: 'snapshot ছবিটাও ধরে রাখে',
    photoPrivate: 'একটা নতুন private field',
    asBefore: 'text, price আর audience আগের মতোই',
    savesPhoto: 'save() ছবিটাও সাথে ভরে',
    othersSame: 'History কখনো snapshot খোলে না: একটা লাইনও বদলায়নি',
    historySame: 'সেই একই push() আর pop()',
    clientSame: 'PostScreen: সেই একই Save আর Undo কল',
    oopsPhoto: 'উফ: ছবিটা মুছে গেল',
    sameUndo: 'সেই একই Undo ফেরত আনে',
    withZero: 'History আর PostScreen-এ বদল: ০ লাইন',
  },

  compare: {
    without: {
      title: 'স্ক্রিন নিজেই প্রতিটা field হাতে কপি করে',
      points: [
        'PostEditor-এর field গুলো public রাখতে হয়, তাই যে কোনো কোড সেগুলো পড়তে ও বদলাতে পারে।',
        'PostScreen-কে প্রতিটা field চিনতে হয় আর দুদিকেই একটা একটা করে কপি করতে হয়। একবার audience ভুললেই পোস্ট Public।',
        'কপির বদলে reference রাখলে (backup = editor) backup নিঃশব্দে আসল object-টাই হয়ে যায়।',
        'নতুন field (একটা ছবি) এলে onSave() আর onUndo() আবার বদলাতে হয়, যেখানে যেখানে Undo আছে সব স্ক্রিনে।',
      ],
    },
    with: {
      title: 'Editor নিজেকে save করে; History রাখে সিল-করা snapshot',
      points: [
        'PostEditor নিজের field private রাখে, আর save() দিয়ে সেগুলো একটা PostSnapshot-এ ভরে।',
        'Snapshot বদলানো যায় না, ভেতরটাও দেখা যায় না: খুলতে পারে শুধু PostEditor, restore(s)-এ।',
        'History একটা সাধারণ snapshot-এর stack: ঝুঁকির edit-এর আগে push(), Undo-তে pop(), নতুনটা আগে।',
        'নতুন field ছোঁয় শুধু PostEditor আর PostSnapshot; History আর Undo বাটন হুবহু আগের মতো থাকে।',
      ],
    },
    benefit:
      'Memento দিয়ে undo, ড্রাফট আর save point পাওয়া যায় encapsulation না ভেঙেই: যে object-এর state, শুধু সে-ই জানে কীভাবে তা save আর restore করতে হয়। তাই অ্যাপের বাকি অংশ ভেতরে কী আছে তার ওপর নির্ভর না করেই snapshot রাখতে আর ফেরত দিতে পারে।',
    whenToUse: [
      'Undo / redo, save point, ড্রাফট বা “পরিবর্তন বাতিল” বাটন লাগবে, অথচ object-এর field গুলো private রাখতে চান।',
      'বাইরে থেকে object-এর state কপি করতে গেলে তার field খুলে দিতে হতো, বা caller-কে সবগুলো field চিনতে হতো।',
      'State-টা কপি করার মতো ছোট। (বড় object হলে শুধু যা বদলেছে সেটুকু রাখুন, বা History কয়টা snapshot রাখবে তার সীমা দিন।)',
    ],
  },
}

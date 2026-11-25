import type { PatternContent } from '@/types/pattern'

export const en = {
  title: 'Bridge',
  tagline: 'Two things that vary, kept on two sides of a bridge: add to either side without multiplying classes.',
  intent:
    'Split a class that varies in two ways into two separate hierarchies: an abstraction (what you do) and an implementation (how it gets done). The abstraction holds a reference to an implementor, the bridge, and delegates the low-level work to it, so both sides can grow independently.',

  scenario: {
    title: "Notifications at Rahim's Haat Bazar",
    paragraphs: [
      "Rahim runs Haat Bazar, an online grocery shop in Dhaka. Its app sends three kinds of messages: an OTP when a customer pays, a promo when there's an offer (like 20% off before Eid), and an alert when an order is on its way.",
      'Customers read them in different places: some live in push notifications, some only check SMS, and offices prefer email. So every message type has to work on every channel.',
      'The first developer wrote one class per pair: OtpSms, PromoEmail, AlertPush… and now customers are asking for WhatsApp too.',
    ],
    problem:
      '3 message types × 3 channels is already 9 classes, each one a copy-paste of two others. WhatsApp adds 3 more, a new message type adds 4 more, and one fix to the SMS code has to be made in 3 different classes.',
  },

  visual: {
    // Game HUD
    levelsLabel: 'Game levels',
    levelLabel: 'Level {{n}}',
    level1Title: 'A class for every pair',
    level2Title: 'Build a bridge',
    level3Title: 'WhatsApp arrives',
    level1Goal: 'No pattern yet: each class sends one message type by one channel. Pick the right class for each customer, or copy-paste a new one.',
    level2Goal: 'Now message types and channels are separate. Pick a type and a channel for each customer: any type works with any channel.',
    level3Goal: 'Customers want WhatsApp. Add it for every message type without editing a single old class.',
    locked: 'Locked',
    earned: 'Orders',
    restart: 'Restart game',
    orderOf: 'Message {{n}}/{{total}}',

    // Client
    clientRole: 'Client',
    appTitle: 'Haat Bazar app',
    needs: 'needs',
    shelfLabel: 'Pick the class that sends it',
    writeHint: '✍️ = no such class yet: copy-paste a new one',
    classesSoFar: 'Pair classes written',
    allPairs: 'Needed for all 9 pairs',
    typeLabel: 'Message type (Abstraction)',
    channelLabel: 'Channel (Implementor)',
    classMath: '{{types}} types + {{channels}} channels = {{sum}} classes',
    vsPairs: 'not {{pairs}}',

    // Middle node
    noPatternRole: 'No pattern',
    whatLabel: 'What to say',
    howLabel: 'How to send',
    weldedTag: 'Welded in one class',
    copiedTag: 'Copy-pasted',
    abstractionRole: 'Abstraction',
    extendsLabel: 'extends',
    bridgeLabel: 'Bridge field',
    pickType: 'Pick a message type…',
    pickChannel: 'Pick a channel…',

    // Bottom node
    serviceRole: 'Service',
    implementorRole: 'ConcreteImplementor',
    implementsLabel: 'implements',
    phoneLabel: "Customer's phone",
    checksHere: 'checks here',
    delivered: 'Delivered',
    missed: 'Missed',

    // Message types, channels, texts
    otp: 'OTP',
    promo: 'Promo',
    alert: 'Alert',
    sms: 'SMS',
    email: 'Email',
    push: 'Push',
    whatsapp: 'WhatsApp',
    msgOtp: 'Haat Bazar OTP: {{code}}',
    msgPromo: 'Eid offer: 20% off groceries!',
    msgAlert: 'Your order is on its way',

    // Builder (level 3)
    builderTitle: 'Add the WhatsApp channel',
    builderStep1: 'Step 1 · What do you write?',
    builderStep2: 'Step 2 · What goes inside it?',
    q1: 'How do you add WhatsApp for all 3 message types?',
    q1Channel: '1 class: WhatsAppChannel',
    q1Pairs: '3 classes: OtpWhatsApp…',
    q1Edit: 'An if (whatsApp) in each type',
    q2: 'WhatsAppChannel implements Channel. What does it need to know?',
    q2How: 'Only how to send a text',
    q2Texts: 'The OTP, promo, alert texts',
    q2Types: 'Which type is calling it',
    newTag: 'New',
    useChannel: 'Use WhatsAppChannel',
    zeroEdits: 'Old classes edited: 0 lines',

    // Turn
    sendButton: 'Send',
    nextMessage: 'Next message',
    finishLevel: 'Finish level',
    tryAgain: 'Try again',

    // Level end
    levelDone: 'Level {{n}} complete!',
    nextLevel: 'Next level',
    replayLevel: 'Play this level again',
    playAgain: 'Play again from level 1',
    l1Teaser:
      'Then Rahim hears: “Customers want WhatsApp too.” That means OtpWhatsApp, PromoWhatsApp and AlertWhatsApp: three more copy-pasted classes, and a fourth channel later means three more again. There must be a better way…',
    l2Summary:
      'Six small classes covered all nine pairs. Each message type only said WHAT to send, each channel only knew HOW, and the bridge field joined them at runtime.',
    recapTitle: 'What you learned',
    recap1: 'Mixing two things that vary in one class hierarchy makes the classes multiply: types × channels.',
    recap2: 'Bridge splits them: the abstraction (message type) holds an implementor (channel) and delegates to it.',
    recap3: 'A new channel or a new type is one new class on its own side: 3 + 4 = 7 instead of 3 × 4 = 12.',

    // Names
    nusrat: 'Nusrat',
    karim: 'Karim',
    mitu: 'Mitu',

    whatsHappening: "What's happening",
    note: 'Haat Bazar and its customers are made up for this example.',
  },

  steps: {
    // Level 1: no pattern
    tutorial:
      'Nusrat is paying {{amount}} and needs her OTP by SMS. The class OtpSms already exists, so it is picked for you. Press Send and watch one class do both jobs.',
    idle1: '{{name}} needs the {{type}} message by {{channel}}. Pick the class for exactly that pair, or write a new one (✍️).',
    picked1: '{{cls}} is picked. Press Send and see what {{name}} receives.',
    'picked1-write': 'There is no {{cls}} class yet, so you will copy-paste one. Press Send.',
    'l1-pick': 'new {{cls}}(): one class that decides both WHAT to say and HOW to send it.',
    'l1-write':
      'No {{cls}} yet: copy the {{type}} text from one class and the {{channel}} code from another. That makes {{count}} pair classes.',
    'l1-send': '{{cls}}.send() is called for {{name}}.',
    'l1-format-ok': 'It writes the {{type}} text: “{{text}}”.',
    'l1-format-bad': 'It writes the {{gotType}} text: “{{text}}”. But {{name}} needed the {{type}} message!',
    'l1-deliver-ok': '…and sends it by {{channel}}, with the gateway code welded into the same class.',
    'l1-deliver-bad': '…and sends it by {{gotChannel}}. But {{name}} is checking {{channel}}!',
    'l1-ok': 'Delivered! +{{amount}}. It works, but every pair needs its own class: {{count}} written so far, 9 to cover every pair.',
    'l1-fail-type':
      '😵 {{name}} got the {{gotType}} message instead of the {{type}} one. A pair class only fits its own exact pair; you cannot reuse it for another.',
    'l1-fail-channel': '📭 The message went by {{gotChannel}}, but {{name}} was waiting on {{channel}}. It was never read.',
    'level1-done':
      'Level complete! You needed a new class for almost every message, and the texts and gateway code are copy-pasted between them. Look at the last line in the code.',

    // Level 2: Bridge
    idle2: '{{name}} needs the {{type}} message by {{channel}}. Pick the message type and the channel separately.',
    'wrong-type': '{{name}} needs the {{type}} message, not {{picked}}. The message type is the Abstraction: it decides WHAT to say.',
    'wrong-channel': '{{name}} checks {{channel}}, not {{picked}}. The channel is the Implementor: it decides HOW the message travels.',
    ready: '{{typeCls}} + {{chanCls}}: any type works with any channel. Press Send.',
    wire: 'new {{typeCls}}(new {{chanCls}}()): the channel object goes into the bridge field.',
    send: 'notification.send() for {{name}}. The client only talks to the Notification side.',
    format: '{{typeCls}} decides WHAT to say: “{{text}}”. It has no idea how the text will travel.',
    delegate: 'this.channel.deliver(to, text): the message crosses the bridge. Notification delegates the HOW to whatever channel it holds.',
    deliver: "{{chanCls}} decides HOW: it hands the text to the {{channel}} gateway. It doesn't care what the text says.",
    done: 'Delivered! +{{amount}}. {{classes}} small classes cover every type × channel pair.',
    'level2-done': 'Level complete! You mixed types and channels freely, and no class had to know about both.',

    // Level 3: a new implementor
    'need-build': '{{name}} only reads WhatsApp, and there is no WhatsApp channel yet. Tap the 🔨 WhatsApp tile to build it.',
    'build-q1': 'First: how do you add WhatsApp for all 3 message types?',
    'wrong-q1-pairs': "That's the class explosion from level 1 again: 3 new classes now, and 3 more for every future channel.",
    'wrong-q1-edit': 'Then every Notification class gets edited and has to know about WhatsApp. The bridge exists so they never need to.',
    'build-q2': 'WhatsAppChannel implements Channel. Now: what does it need to know?',
    'wrong-q2-texts': 'The texts belong to the message types, on the Abstraction side. A channel just carries whatever text it is given.',
    'wrong-q2-types': 'A channel never asks who is calling: any Notification can use it through deliver(to, text).',
    'build-ready': 'Done: one new class, nothing old edited. Press “Use WhatsAppChannel”.',
    'build-done': 'WhatsAppChannel is ready, and every message type can use it already. Pick the message type and press Send.',
    'wa-wire': 'new {{typeCls}}(new WhatsAppChannel()): the same old {{typeCls}}, now holding the new channel.',
    'wa-format': '{{typeCls}} writes “{{text}}”, exactly as before: not one line of it changed.',
    'wa-delegate': 'this.channel.deliver(…) crosses the bridge, and this time it lands in WhatsAppChannel.deliver().',
    'wa-send': 'WhatsAppChannel knows only HOW: whatsapp.sendMessage(phone, text).',
    'wa-done': 'Delivered on WhatsApp! +{{amount}}. 1 new class instead of 3, and 0 old lines edited.',
    'level3-done':
      'You finished the game! Bridge keeps WHAT (message types) apart from HOW (channels), so each side grows on its own: 3 + 4 = 7 classes instead of 3 × 4 = 12.',
  },

  codeComments: {
    implementor: 'Implementor: HOW a message travels',
    concreteImpl: 'Concrete implementors: one per channel',
    abstraction: 'Abstraction: WHAT to send',
    bridgeField: 'the bridge: every notification holds a Channel',
    refined: 'Refined abstractions: one per message type',
    delegate: 'delegate the HOW across the bridge',
    usage: 'Client code',
    anyPair: 'any type + any channel',
    withoutIntro: 'One class for every type × channel pair',
    whatPart: 'WHAT to say…',
    howPart: '…and HOW to send it, welded together',
    withoutCopy: 'A new pair? Copy-paste a whole new class',
    copyHow: 'the same push code, copied again',
    withoutPick: 'Pick the exact pair class',
    withoutTodo: '3 types × 3 channels = 9 classes. WhatsApp? 12',
    withAdd: 'WhatsApp = one new Channel class',
    onlyHow: 'it only knows HOW to send',
    withSame: 'Every old message type works with it as it is',
    withZero: 'Old classes edited: 0. Without Bridge: OtpWhatsApp, PromoWhatsApp, AlertWhatsApp',
  },

  compare: {
    without: {
      title: 'One class for every type × channel pair',
      points: [
        'Every new pair needs its own class: OtpSms, PromoEmail, AlertPush…',
        'The class count multiplies: 3 types × 3 channels = 9, plus WhatsApp = 12.',
        'Message texts and gateway code are copy-pasted between classes.',
        'A fix to the SMS code has to be made in every …Sms class.',
      ],
    },
    with: {
      title: 'Message types and channels on two sides of a bridge',
      points: [
        'Message types only decide WHAT to say; channels only know HOW to send.',
        'Each Notification holds a Channel (the bridge) and delegates to it.',
        'The class count adds up instead of multiplying: 3 + 3 = 6, plus WhatsApp = 7.',
        'A new channel or message type is one class; nothing old is edited.',
      ],
    },
    benefit:
      'Bridge turns a multiplication into an addition. When a class varies in two independent ways, putting each way in its own hierarchy keeps both small, lets you combine them at runtime, and lets either side change without touching the other.',
    whenToUse: [
      'A class varies along two (or more) independent dimensions, like message type × channel or shape × renderer.',
      'You see a class name built from two words for every combination (OtpSms, PromoEmail…) and the list keeps growing.',
      'You want to switch the implementation at runtime, or let two teams work on the two sides independently.',
    ],
  },
} satisfies PatternContent

export type BridgeContent = typeof en

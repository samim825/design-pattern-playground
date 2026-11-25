import type { PatternContent } from '@/types/pattern'

export const en = {
  title: 'Proxy',
  tagline: 'Put a stand-in in front of the slow bank. It answers repeat questions itself, and the counter can’t tell the difference.',
  intent:
    'Give an object a stand-in with the same interface. The proxy controls access to the real object: it can cache, log, check or delay calls, while the client keeps calling it exactly as before.',

  scenario: {
    title: 'Nusrat’s remittance counter at Motijheel',
    paragraphs: [
      'Nusrat runs the counter at Shapla Money Exchange in Motijheel. All day, people come in to cash money sent home by family abroad: Rahim brings 500 US dollars from his brother in New York, Karim 2,000 Saudi riyals from Riyadh, Mitu ringgit from Kuala Lumpur.',
      'For every quote the counter app asks the bank’s rate feed: USD ≈ ৳122, SAR ≈ ৳32.50, MYR ≈ ৳27. The feed is slow, about 3 seconds per call, and every call costs the shop a ৳2 fee. The rate only changes a few times a day, yet the app asks again for every single customer.',
      'So Nusrat keeps a notebook of today’s rates and decides by hand: ask the bank, or trust the notebook? Then the compliance officer says every rate lookup must be logged for the audit…',
    ],
    problem:
      'The counter talks to the slow bank directly. Asking again for the same currency still waits 3 seconds and costs ৳2, so impatient customers walk out. Caching by hand puts notebook logic inside the counter, where one wrong guess quotes the wrong rate, and every new counter or app has to copy it.',
  },

  visual: {
    // Game HUD
    levelsLabel: 'Game levels',
    levelLabel: 'Level {{n}}',
    level1Title: 'Get every rate by hand',
    level2Title: 'Plug in a proxy',
    level3Title: 'The auditor wants a log',
    level1Goal:
      'No pattern yet: the counter talks to the slow bank itself. For each customer, decide where the rate comes from: the bank (3 s, ৳2), Nusrat’s notebook or the last rate on screen.',
    level2Goal:
      'Now the counter only knows the RateService interface. Pick which RateService to plug in, so that a repeat question is answered at once.',
    level3Goal: 'Compliance wants every lookup logged. Build a LoggingRateService and stack it on top of the cache, without editing the counter or the cache.',
    locked: 'Locked',
    earned: 'Earned',
    restart: 'Restart game',
    turnOf: 'Turn {{n}}/{{total}}',

    // Client
    clientRole: 'Client',
    counterTitle: 'Counter, Motijheel',
    patient: 'can wait 5 s',
    hurry: 'in a hurry: 1 s',
    waitingMood: 'waiting',
    servedMood: 'got {{quote}}',
    leftMood: 'left after {{s}} s',
    wrongMood: 'wrong rate!',
    noRateMood: 'no rate!',
    pickLabel: 'Where should this rate come from?',
    srcBank: 'Call the bank',
    srcNotebook: 'Nusrat’s notebook',
    srcLast: 'Last rate on screen',
    knowsL1: 'This counter decides every time: bank, notebook or last rate',
    wireLabel: 'Which RateService goes into new Counter(…)?',
    wireBank: 'BankRateService',
    wireShared: 'CachedRateService · one, shared',
    wireFresh: 'CachedRateService · a new one per customer',
    wireHint: 'Your pick stays plugged in for the next customers.',
    knowsL2: 'The counter knows 1 thing: rates.getRate(currency)',
    othersSame: 'Counter · CachedRateService · BankRateService: unchanged',

    // Middle (level 1)
    noPatternRole: 'No pattern',
    quoteTitle: 'Counter.quote()',
    notebookLabel: 'Nusrat’s notebook',
    lastLabel: 'Last rate on screen',
    noneYet: 'none yet',
    emptyNotes: 'empty page',
    handTag: 'caching by hand',

    // Subject / Proxy / RealSubject
    subjectRole: 'Subject',
    subjectNote: 'Whatever is plugged in here answers getRate(currency).',
    proxyRole: 'Proxy',
    cacheLabel: 'cache',
    cacheEmpty: 'empty',
    hitTag: 'hit',
    missTag: 'miss',
    newProxyTag: 'new instance: empty cache',
    notWired: 'not plugged in',
    notBuilt: 'not built yet',
    newTag: 'New',
    auditLabel: 'audit log',
    auditEmpty: 'no entries yet',
    realRole: 'RealSubject',
    bankWait: 'bankFeed.fetch() · 3 s',
    idleBank: 'idle',
    busyBank: 'fetching…',
    calls: 'calls: {{n}} · fees: {{fee}}',
    wasted: 'asked again for {{cur}}!',
    resultOk: 'Everyone served · +{{coins}}',
    resultBad: 'Customer lost!',

    // Builder (level 3)
    builderTitle: 'Build LoggingRateService',
    builderStep1: 'Step 1 · What does it implement?',
    builderStep2: 'Step 2 · What does it hold and call next?',
    q1: 'The counter must keep working with no changes. What should LoggingRateService be?',
    q1Implements: 'implements RateService',
    q1Extends: 'extends BankRateService',
    q1Counter: 'Nothing: Counter calls log() first',
    q2: 'After writing the log line, who answers the rate?',
    q2Inner: 'The RateService it wraps (the cache)',
    q2Bank: 'Its own new BankRateService()',
    q2Counter: 'The Counter',
    plugLogging: 'Plug in LoggingRateService',
    zeroEdits: 'Old code edited: 0 lines',

    // Turn
    askButton: 'Get rate',
    nextCustomer: 'Next customer',
    finishLevel: 'Finish level',
    tryAgain: 'Try again',

    // Level end
    levelDone: 'Level {{n}} complete!',
    nextLevel: 'Next level',
    replayLevel: 'Play this level again',
    playAgain: 'Play again from level 1',
    l1Teaser:
      'Next week the shop opens two more counters and a mobile app. Each one needs its own notebook, its own if/else, and someone who remembers which rates are already noted… There must be a better way…',
    l2Summary:
      'You swapped BankRateService for CachedRateService and the Counter didn’t change a line: both are a RateService. The proxy decided hit or miss by itself, so repeat questions came back instantly and free.',
    recapTitle: 'What you learned',
    recap1: 'Without a proxy, the client talks to the slow service directly, or caches by hand: every repeat waits and costs a fee, and one wrong guess quotes the wrong rate.',
    recap2:
      'A Proxy implements the same interface as the real object and holds a reference to it. It answers from its cache, or forwards the call. The client can’t tell which object it got.',
    recap3: 'A new proxy (LoggingRateService) wraps the cache, which wraps the bank. Counter, cache and bank: 0 lines edited.',

    // Names
    rahim: 'Rahim',
    karim: 'Karim',
    mitu: 'Mitu',
    tania: 'Tania',
    sumon: 'Sumon',
    secs: '{{s}} s',

    whatsHappening: "What's happening",
    note: 'The shop, people, rates, fees and timings are made up for this example.',
  },

  steps: {
    // Level 1: no pattern
    tutorial:
      '{{name}} wants to cash {{amount}}. The notebook is still empty, so the only real source is the bank. “Call the bank” is already picked for you. Press Get rate and watch.',
    idle1: '{{name}} wants to cash {{amount}} ({{patience}}). Where should the rate come from? Look at the notebook and the last rate in the middle card first.',
    picked1: 'You picked: {{source}}. Press Get rate and see if {{name}} leaves happy.',
    'l1-start': 'Counter.quote() gets {{name}}’s request plus your choice of source. There is no stand-in: the counter itself decides where every rate comes from.',
    'l1-route-bank': 'The if/else takes the bank branch: the counter calls bank.getRate("{{cur}}") itself.',
    'l1-route-notebook': 'The if/else takes the notebook branch: Nusrat flips through the notebook looking for {{cur}}.',
    'l1-route-last': 'The if/else takes the last-rate branch: it reuses whatever rate is on the screen, whatever currency that was.',
    'l1-call':
      'The bank feed is slow: {{name}} waits 3 seconds and the shop pays a ৳2 fee. It does not matter whether anyone asked for {{cur}} a minute ago: every call is a full trip.',
    'l1-note': 'The bank says {{rate}} per {{cur}}. Nusrat writes it in the notebook by hand, so she can skip the bank next time, if she remembers to look.',
    'l1-lookup-found': 'Found it: {{cur}} = {{rate}} is in the notebook. No wait, no fee. But it worked only because you knew it was there.',
    'l1-lookup-blank': 'Blank: there is no {{cur}} rate in the notebook yet. The notebook only knows what someone wrote down earlier.',
    'l1-lookup-none': 'The screen is empty: no rate has been shown yet today, so lastRate is still 0.',
    'l1-lookup-last': 'The screen still shows the last rate: {{lastRate}} per {{lastCur}}. The code uses it for {{cur}} without asking which currency it was.',
    'l1-reply': 'Counter.quote() returns {{amount}} × {{rate}} = {{quote}} to Nusrat.',
    'l1-ok':
      'Served! {{name}} gets {{quote}}. +{{coins}} for the shop. It worked, but only because you chose the source by hand. Every counter and app must repeat this decision.',
    'l1-fail-slow':
      '😵 {{name}} was in a hurry and walked out after 3 seconds. The counter asked the bank for {{cur}} again, although the notebook already had it.',
    'l1-fail-blank':
      '😵 No rate for {{cur}} in the notebook, so {{name}} got a quote of ৳0 and left confused. A rate nobody asked the bank for yet can’t be in the notebook.',
    'l1-fail-none':
      '😵 Nothing was on the screen yet, so lastRate was 0 and {{name}} got a quote of ৳0. Only the bank had this rate.',
    'l1-fail-wrong':
      '😱 Wrong rate! {{name}} was quoted {{quote}} instead of {{rightQuote}}: the {{lastCur}} rate was used for {{cur}}. The owner stops the payout just in time.',
    'level1-done':
      'Level complete! It worked, but the counter decided everything by hand: when to call the slow bank, when to trust the notebook, and when the last rate was safe.',

    // Level 2: the proxy
    idle2: 'Two customers are in the queue: {{queue}}. Pick which RateService to plug into the counter, then press Get rate.',
    picked2: 'Plugged in: {{wiring}}. Queue: {{queue}}. Press Get rate: the counter will just call rates.getRate().',
    'wire-shared':
      'new Counter(new CachedRateService(new BankRateService())): the counter gets a proxy and only sees a RateService. One proxy serves everyone, so its cache lives on.',
    'wire-bank': 'new Counter(new BankRateService()): the counter gets the real bank service directly. It works, because both are a RateService, but nothing stands in front of the bank.',
    'wire-fresh': 'The counter will create a fresh CachedRateService for every customer. Each one is a real proxy, but each starts with an empty cache.',
    ask: '{{name}} asks for {{cur}}. The counter calls rates.getRate("{{cur}}"). It doesn’t know, or care, which object answers.',
    fresh: 'A brand-new CachedRateService is made for {{name}}. Its cache is empty, so whatever earlier proxies learned is gone.',
    'check-hit': 'The proxy looks in its cache first: {{cur}} is there ({{rate}}). A hit!',
    'check-miss': 'The proxy looks in its cache first: no {{cur}} yet. A miss, so it must ask the real bank.',
    hit: 'The proxy answers from its cache: 0 seconds, ৳0. The bank never even hears about this request.',
    forward: 'On a miss the proxy forwards the same call to the object it holds: real.getRate("{{cur}}").',
    bank: 'BankRateService does the slow work: 3 seconds and a ৳2 fee. Only the RealSubject ever talks to the bank feed.',
    'bank-direct': 'No proxy in between: the call goes straight to BankRateService. 3 seconds and ৳2, even if {{cur}} was asked a moment ago.',
    store: 'The rate comes back: {{rate}} per {{cur}}. The proxy remembers it in its cache before passing it on.',
    'reply-fast': '{{name}} gets {{quote}} instantly. From the counter’s side it was the same getRate() call as always.',
    'reply-slow': '{{name}} waited 3 seconds but could wait, and gets {{quote}}.',
    'reply-left': '😠 {{name}} was in a hurry and left after {{s}} seconds. The rate for {{cur}} had been fetched before, but nothing remembered it.',
    'done-ok':
      'Everyone served! +{{coins}}. Bank calls this turn: {{calls}}. The Counter called getRate() and never knew a proxy was answering.',
    'done-bank':
      '😵 The bank was asked for the same currency twice, and the hurried customer left. Swap in a RateService that remembers: the Counter accepts any RateService, so nothing else changes.',
    'done-fresh':
      '😵 Every customer got a brand-new proxy with an empty cache, so every request was a miss. A caching proxy must live as long as its cache: create it once and share it.',
    'level2-done':
      'Level complete! You plugged a proxy in without touching the Counter. It answered repeat questions from its cache and only bothered the bank on a miss.',

    // Level 3: a new proxy
    'build-q1':
      'New rule: every rate lookup must be logged for the audit, even the ones the cache answers. You’ll write LoggingRateService. First: what should it be, so the counter can’t tell?',
    'wrong-q1-extends':
      'Then it’s welded to the bank: it can only stand in front of BankRateService, never in front of the cache. A proxy implements the same interface as what it stands in for.',
    'wrong-q1-counter':
      'Then the Counter changes, and every counter, app and website must remember to call log(). A proxy adds the logging where the client can’t even see it.',
    'build-q2':
      'Right: implements RateService, so the counter can’t tell. Now: after writing the log line, who answers the rate?',
    'wrong-q2-bank':
      'Then every lookup skips the cache and waits 3 seconds again. Hold a RateService instead, and you can stack the logger on top of the cache.',
    'wrong-q2-counter':
      'That’s backwards: the Counter holds the proxy, not the other way round. A proxy holds the object it stands in front of.',
    'build-ready': 'Done: one new class. 0 lines changed in Counter, CachedRateService or BankRateService. Press “Plug in LoggingRateService”.',
    'build-done': 'Stacked: Counter → LoggingRateService → CachedRateService → BankRateService. Press Get rate.',
    'wire-new': 'The only new line: new LoggingRateService(new CachedRateService(new BankRateService())). The counter still gets a RateService.',
    'ask-new': '{{name}} asks for {{cur}}. The counter makes the very same call: rates.getRate("{{cur}}").',
    log: 'LoggingRateService writes the audit line first: who asked for {{cur}}, and when.',
    delegate: 'Then it passes the same call to the RateService it wraps: inner.getRate("{{cur}}"). Here that’s the cache.',
    'reply-new': '{{name}} gets {{quote}}. The answer climbs back through both proxies to the counter.',
    'done-new':
      'Logged and served! +{{coins}}. Audit lines so far: {{logs}}, whether the cache or the bank answered, because the logger stands in front of the cache. 0 lines of old code edited.',
    'level3-done':
      'You finished the game! Proxies stand in front of a real object with the same interface: one caches, one logs, and the client never notices.',
  },

  codeComments: {
    subject: 'Subject: the one interface the counter knows',
    oneMethod: 'the real service and every proxy answer this',
    realSubject: 'RealSubject: does the real, slow work',
    slowCall: 'about 3 s and a ৳2 fee per call',
    proxy: 'Proxy: same interface, stands in front of the real service',
    cacheField: 'rates it has already fetched',
    holdsReal: 'holds a reference to the real service',
    sameDoor: 'called exactly like the real one',
    lookFirst: 'look in the cache first',
    hitFast: 'hit: answer at once, no bank call',
    missForward: 'miss: forward the call to the real service',
    remember: 'remember it for the next customer',
    client: 'Client: depends only on the interface',
    onlyInterface: 'any RateService can be plugged in',
    cantTell: 'it can’t tell a proxy from the real thing',
    usage: 'Wire it once: the proxy wraps the bank',
    wireOnce: 'the counter gets a proxy, not the bank',
    firstMiss: 'miss: asks the bank (3 s)',
    thenHit: 'hit: answered from the cache (0 s)',
    withoutIntro: 'No pattern: the counter talks to the slow bank itself',
    knowsBank: 'it holds the real bank service…',
    handNotes: '…and a notebook it keeps by hand',
    youDecide: 'the caller decides where each rate comes from',
    blankPage: 'empty if nobody wrote it down',
    anyCurrency: 'might be the rate of another currency!',
    slowEveryTime: '3 s and ৳2, even for a repeat',
    noteByHand: 'note it by hand for next time',
    withoutCopy: 'every counter and the app copy this same if/else',
    withAdd: 'Audit rule = one new proxy class',
    sameInterface: 'same interface: the counter can’t tell',
    wrapsAny: 'wraps any RateService: here, the cache',
    logFirst: 'its one extra job: write the audit line',
    passOn: 'then pass the same call on',
    othersSame: 'Old classes: not a single line edited',
    withWire: 'Wiring: stack the new proxy on top of the cache',
    stacked: 'logger → cache → bank',
    clientSame: 'the counter takes any RateService, as before',
    withSame: 'Client code: exactly the same call as before',
    withZero: 'Old code edited: 0 lines. Without a proxy: every counter, plus a log() call in each',
  },

  compare: {
    without: {
      title: 'The client talks to the slow service directly',
      points: [
        'Every rate lookup goes to the bank: 3 seconds and a ৳2 fee, even for a currency asked a minute ago.',
        'Caching is done by hand inside the counter: a notebook, a last-rate field and an if/else that picks between them.',
        'One wrong guess quotes the wrong rate, and a stale or blank note quotes nothing at all.',
        'Every counter and the mobile app copy the same notebook logic; adding audit logging means editing all of them.',
      ],
    },
    with: {
      title: 'A stand-in with the same interface sits in front',
      points: [
        'CachedRateService implements RateService, so the counter can’t tell it from the real bank service.',
        'The proxy decides by itself: a hit is answered at once, a miss is forwarded to the bank and remembered.',
        'The counter has no cache logic at all: it just calls rates.getRate(currency).',
        'New concerns (an audit log, a rate limit) are new proxies stacked on top; old classes stay unchanged.',
      ],
    },
    benefit:
      'Proxy puts control in front of an object without the client knowing. Because the proxy has the same interface and holds the real object, you can add caching, logging, access checks or lazy loading by wrapping, and swap or stack those wrappers freely.',
    whenToUse: [
      'The real object is slow or costly to call (a remote API, a database, a big file), and a caching or lazy-loading stand-in would help.',
      'You need to control access to it: check permissions, limit calls per minute, or log every use for an audit.',
      'The client should stay unaware: it already depends on an interface, and you want to add the behaviour without editing the client or the real object.',
    ],
  },
} satisfies PatternContent

export type ProxyContent = typeof en

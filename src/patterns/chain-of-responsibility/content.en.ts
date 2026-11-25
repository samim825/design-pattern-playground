import type { PatternContent } from '@/types/pattern'

export const en = {
  title: 'Chain of Responsibility',
  tagline: 'Hand the loan file to the first desk. It climbs the chain until someone is allowed to sign it.',
  intent:
    'Pass a request along a chain of handlers. Each handler either handles it or passes it to the next one, so the sender never needs to know who will finally deal with it.',

  scenario: {
    title: 'Loan approval at Dhanshiri Bank, Mirpur-10',
    paragraphs: [
      'At the Mirpur-10 branch of Dhanshiri Bank, who may sign a loan depends on its size. The loan officer signs up to ৳50,000, the branch manager up to ৳500,000, and anything bigger goes to the head office in Motijheel, up to ৳5,000,000.',
      'Today the loan desk has to route every file itself: Mitu wants ৳30,000 for a sewing machine, Karim ৳300,000 to grow his grocery shop, Rahim ৳2,500,000 for a garment workshop. The desk, the mobile app and the website each keep the same if/else list of limits.',
      'Then the bank opens a regional office that can sign up to ৳2,000,000…',
    ],
    problem:
      'The sender must know every approver and every limit. Send a big loan to a junior and it gets signed beyond their limit (audit flag!); send a small one to a senior and it waits weeks in the wrong queue. Every new approver means editing every if/else ladder.',
  },

  visual: {
    // Game HUD
    levelsLabel: 'Game levels',
    levelLabel: 'Level {{n}}',
    level1Title: 'Route every loan yourself',
    level2Title: 'Link the chain',
    level3Title: 'A regional office opens',
    level1Goal:
      'No pattern yet: the loan desk decides who signs each loan. Pick the right approver: the most junior one whose limit covers the amount.',
    level2Goal:
      'Now every approver is a Handler with a next link. Wire the chain once, then the desk hands every loan to the first handler and lets it travel.',
    level3Goal: 'A RegionalManager (up to ৳2,000,000) joins. Link it into the chain without editing the desk or the other handlers.',
    locked: 'Locked',
    earned: 'Earned',
    restart: 'Restart game',
    loanOf: 'Loan {{n}}/{{total}}',

    // Client
    clientRole: 'Client',
    deskTitle: 'Loan desk, Mirpur-10',
    needs: 'needs',
    pickLabel: 'Who should sign this loan?',
    knowsL1: 'This desk must know: 3 approvers and every limit',
    chainLabel: 'Wire the chain: tap handlers in order',
    chainHint: 'Tap a linked handler again to unlink it.',
    knowsL2: 'The desk knows 1 thing: the first handler',
    othersSame: 'LoanDesk · LoanOfficer · BranchManager · HeadOffice: unchanged',

    // Middle (level 1)
    noPatternRole: 'No pattern',
    ladderLabel: 'if / else: the desk routes it',
    anyAmount: 'anything else',
    knowsAllTag: 'knows every limit',

    // Approvers / handlers
    approversRole: 'Approvers',
    approversTitle: 'Dhanshiri Bank',
    approverRole: 'Approver',
    handlerRole: 'Handler',
    upTo: 'up to {{limit}}',
    waiting: 'waiting',
    signedOk: 'signed · wait: {{wait}}',
    signedOver: 'over my limit! audit flag',
    signedSlow: 'signed, but wait: {{wait}}',
    canYes: 'within my limit',
    canNo: 'too big → next',
    notReached: 'not reached',
    emptyChain: 'No chain yet: tap the handlers above.',
    endOfChain: 'End of chain: nobody can sign',
    newTag: 'New',
    notBuilt: 'not built yet',
    waitSameDay: 'same day',
    wait2Days: '2 days',
    wait3Days: '3 days',
    wait3Weeks: '3 weeks',
    resultOk: 'Loan approved · {{amount}}',
    resultBad: 'Loan stuck!',

    // Builder (level 3)
    builderTitle: 'Add RegionalManager',
    builderStep1: 'Step 1 · Where does it go in the chain?',
    builderStep2: 'Step 2 · What else must change?',
    q1: 'RegionalManager signs up to {{limit}}. Where do you link it?',
    q1Between: 'Between BranchManager and HeadOffice',
    q1First: 'At the front, before LoanOfficer',
    q1Last: 'At the end, after HeadOffice',
    q2: 'What must change in LoanDesk and in the other handlers?',
    q2Nothing: 'Nothing: still officer.handle(loan)',
    q2Desk: 'Add an else-if to LoanDesk',
    q2Edit: 'Make BranchManager call it',
    linkRegional: 'Link RegionalManager',
    zeroEdits: 'Old code edited: 0 lines',

    // Turn
    submitButton: 'Submit loan',
    nextLoan: 'Next loan',
    finishLevel: 'Finish level',
    tryAgain: 'Try again',

    // Level end
    levelDone: 'Level {{n}} complete!',
    nextLevel: 'Next level',
    replayLevel: 'Play this level again',
    playAgain: 'Play again from level 1',
    l1Teaser:
      'Next month a regional office opens that signs up to ৳2,000,000. The desk, the app and the website each need a new else-if, with the limits in exactly the right order… There must be a better way…',
    l2Summary:
      'You wired the chain once; after that the desk made one call per loan and never looked at a limit. Each handler checks its own limit, so nobody can sign beyond it.',
    recapTitle: 'What you learned',
    recap1: 'Without a chain, the sender must know every approver and every limit: one wrong guess means an audit flag or weeks of waiting.',
    recap2:
      'Chain of Responsibility links handlers with setNext(). Each one handles the request if it can, or passes it to the next. The sender only knows the first link.',
    recap3: 'A new handler (RegionalManager) joins by linking it in. The desk and the other handlers: 0 lines edited.',

    // Names and loan purposes
    mitu: 'Mitu',
    karim: 'Karim',
    rahim: 'Rahim',
    nusrat: 'Nusrat',
    tania: 'Tania',
    forSewing: 'a sewing machine',
    forShop: 'a bigger grocery shop',
    forGarment: 'a garment workshop',
    forLaptop: 'a freelancing laptop',
    forBoutique: 'boutique stock',
    forPickup: 'a delivery pickup van',
    forBakery: 'a bakery oven line',
    forFridge: 'a shop fridge',
    forPoultry: 'a poultry farm',

    whatsHappening: "What's happening",
    note: 'The bank, limits and waiting times are made up for this example.',
  },

  steps: {
    // Level 1: no pattern
    tutorial:
      '{{name}} needs {{amount}} for {{purpose}}. There is no chain yet, so the desk itself must pick who signs. LoanOfficer (up to {{officerLimit}}) is already picked for you. Press Submit loan and watch.',
    idle1:
      '{{name}} needs {{amount}} for {{purpose}}. Pick the approver: the most junior one whose limit covers the amount. The limits are on the cards below.',
    picked1: 'You picked {{approver}}. Press Submit loan and see whether that was the right desk.',
    'l1-start':
      'LoanDesk.submit() gets the file plus your choice of approver. Nobody else checks it: routing is entirely the desk’s job.',
    'l1-route': 'The if/else ladder sends the file straight to {{approver}}, because the client said so.',
    'l1-sign':
      '{{approver}} signs it. approve() never checks a limit: deciding who signs what was the client’s job, so the approver trusts it blindly.',
    'l1-check-ok':
      '{{amount}} is within the {{limit}} limit, and no one more junior could have signed it: the right desk. The routing line got it right, this time.',
    'l1-check-over':
      'Audit! {{amount}} is above the {{limit}} limit for {{approver}}. The loan is frozen and the branch is flagged. The mistake was in the routing line.',
    'l1-check-slow':
      '{{approver}} may sign it, but {{right}} could have done it. A small file sat in a senior’s queue: {{name}} waits {{wait}}.',
    'l1-ok':
      'Approved! {{name}} gets {{amount}} (wait: {{wait}}), and the bank earns a {{fee}} fee. It worked only because the client knew every limit by heart. The app and the website repeat the same ladder.',
    'l1-fail-over':
      '😵 Audit flag: {{approver}} signed {{amount}}, far beyond the {{limit}} limit. Nobody in between checked, because the client did all the routing.',
    'l1-fail-slow':
      '😵 {{name}} waited {{wait}} and walked out angry. A senior desk spent its time on a file that {{right}} could sign (wait: {{rightWait}}).',
    'level1-done':
      'Level complete! It worked, but the desk had to know every approver and every limit, and one wrong guess cost an audit flag or weeks of waiting.',

    // Level 2: the chain
    idle2:
      '{{name}} needs {{amount}} for {{purpose}}. First wire the chain: tap the handlers in the order a file should visit them. The desk will only ever talk to the first one.',
    wiring2: 'Chain so far: {{chain}}. Link at least one more handler.',
    picked2:
      '{{name}} needs {{amount}} for {{purpose}}. Your chain: {{chain}}. Press Submit loan: the desk only calls {{first}}.handle(loan).',
    wire: 'The chain is wired with setNext(): {{chain}}. Each handler knows only its next link, nothing more.',
    submit: 'One call: {{first}}.handle(loan). The desk does not know any limit, or even who will sign.',
    'check-yes': '{{handler}} checks: is {{amount}} within my limit of {{limit}}? Yes, so it can handle it.',
    'check-no': '{{handler}} checks: is {{amount}} within my limit of {{limit}}? No. It does not know who can sign; it only knows its next link.',
    pass: '{{handler}} passes the file to its next link: next.handle(loan). The desk never sees this hop.',
    approve: '{{handler}} signs it. The first handler that can sign, does, and the request stops here.',
    'approve-slow':
      '{{handler}} can sign {{amount}}, so it does: a handler takes the first job it is allowed to. But {{right}} could have signed it much sooner. Juniors belong at the front of the chain.',
    'approve-new': 'New link at work: RegionalManager signs {{amount}} (wait: {{wait}}) instead of 3 weeks in the head office queue.',
    reject: '{{handler}} cannot sign {{amount}}, and it has no next link. The file falls off the end of the chain: nobody signs it.',
    'done-ok':
      'Approved by {{handler}}: {{name}} gets {{amount}} (wait: {{wait}}). +{{fee}} fee. The desk wrote one line and knew nothing about limits.',
    'done-slow':
      '😵 Approved, but by {{handler}} (wait: {{wait}}). The order of the chain matters: put the most junior handler first, so small files never reach a senior.',
    'done-nobody':
      '😵 Nobody signed: the file ran off the end of the chain. {{amount}} needs a handler with a higher limit linked in, like HeadOffice.',
    'level2-done':
      'Level complete! You wired the chain once, and after that every loan was one handle() call. Each handler checks its own limit, so no audit flags are even possible.',

    // Level 3: a new handler
    'build-q1':
      'New: a RegionalManager signs up to {{regionalLimit}} in 3 days, so mid-size loans no longer wait 3 weeks at head office. First: where do you link it?',
    'wrong-q1-first':
      'Then RegionalManager catches every loan up to {{regionalLimit}} first, even a ৳30,000 sewing-machine loan. Juniors go first, so small files never bother a senior.',
    'wrong-q1-last':
      'HeadOffice signs anything up to {{headLimit}}, so no file would ever get past it: the new link would never be reached. Order by limit, smallest first.',
    'build-q2':
      'It goes between BranchManager and HeadOffice: one new setNext() link. Now: what must change in LoanDesk and in the other handlers?',
    'wrong-q2-desk':
      'That is level 1’s ladder again. The desk only knows the first handler; the chain decides who signs, so the desk stays as it is.',
    'wrong-q2-edit':
      'BranchManager never names who comes after it: it just calls next.handle(loan). The order lives in the wiring, so only the setNext() calls change.',
    'build-ready': 'Done: one new class and one new link in the wiring. 0 lines changed in the desk or the other handlers. Press “Link RegionalManager”.',
    'build-done': 'RegionalManager is linked: officer → manager → regional → head office. Press Submit loan.',
    'wire-new': 'The wiring now has one more setNext(): {{chain}}. That is the only place that changed.',
    'done-new':
      'Approved by {{handler}}: {{name}} gets {{amount}} (wait: {{wait}}). +{{fee}} fee. The desk still makes the same call: 0 lines of old code edited.',
    'level3-done':
      'You finished the game! A chain of handlers decides who handles a request, so the sender stays simple and new handlers join by linking them in.',
  },

  codeComments: {
    loanType: 'A loan request and the decision that comes back',
    handlerType: 'Handler: every approver has a limit and a link to the next one',
    ownLimit: 'each concrete handler sets its own limit',
    link: 'wire the chain once',
    chainable: 'returning next lets the setNext() calls chain',
    sameDoor: 'every handler is called the same way',
    canI: 'can I sign this?',
    yesApprove: 'yes: handle it here, the request stops',
    passOn: 'no: pass it to the next link',
    endOfChain: 'end of the chain: nobody could sign',
    concrete: 'Concrete handlers: only their limits differ',
    usage: 'Client code: wire once, then talk only to the first link',
    wireOnce: 'officer → manager → head office',
    oneEntry: 'every loan enters at the front; the chain finds the signer',
    withoutIntro: 'No pattern: the loan desk routes every file itself',
    knowsAll: 'it holds every approver…',
    youRoute: '…and the caller must say who signs',
    officerLimit: 'right only up to ৳50,000',
    managerLimit: 'right only up to ৳500,000',
    headLimit: 'everything else waits 3 weeks at head office',
    approveBlind: 'Approvers trust the routing blindly',
    noCheck: 'signs whatever it is handed: no limit check',
    clientPicks: 'The caller must know every limit to pick the approver',
    withoutCopy: 'the app and the website copy this same ladder of limits',
    withAdd: 'Regional office = one new handler class',
    regionalLimit: 'its limit is the only thing it states',
    inherits: 'handle() and setNext() are inherited: nothing else to write',
    othersSame: 'Old handlers: not a single line edited',
    withWire: 'Wiring: one new link between manager and head office',
    newLink: 'the only new line in the wiring',
    withSame: 'Client code: exactly the same call as before',
    clientSame: 'the desk still knows only the first link',
    withZero: 'Old code edited: 0 lines. Without the chain: every if/else ladder',
  },

  compare: {
    without: {
      title: 'The sender routes every request itself',
      points: [
        'LoanDesk holds every approver and an if/else ladder of their limits.',
        'Approvers sign whatever they are handed; the limit check lives in the caller.',
        'One wrong branch means a junior signs beyond their limit, or a senior wastes weeks on a tiny file.',
        'The app and the website copy the same ladder; a new approver means editing every copy.',
      ],
    },
    with: {
      title: 'Hand it to the first link; the chain finds the signer',
      points: [
        'Each handler checks only its own limit: sign it, or pass it with next.handle().',
        'The chain is wired once with setNext(); the desk only knows the first link.',
        'Nobody can sign beyond their limit: the check lives with the handler.',
        'A new handler (RegionalManager) is one class and one new link; the desk is unchanged.',
      ],
    },
    benefit:
      'Chain of Responsibility decouples the sender from the receiver. The sender makes one call, each handler decides for itself, and the order lives in one place: the wiring. Adding, removing or reordering handlers never touches the client.',
    whenToUse: [
      'Several objects may handle a request and the right one depends on the request: approvals by amount, support tickets by level, discounts by rule.',
      'You want to try handlers in a fixed order, and change or extend that order without editing the sender.',
      'Request pipelines like middleware, logging levels or event bubbling, where each step may handle the request or pass it on.',
    ],
  },
} satisfies PatternContent

export type ChainContent = typeof en

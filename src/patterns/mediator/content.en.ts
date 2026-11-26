import type { PatternContent } from '@/types/pattern'

export const en = {
  title: 'Mediator',
  tagline: 'Planes don’t radio each other: they all talk to one control tower, and the tower decides who gets the runway.',
  intent:
    'Put one object in the middle that coordinates a group of objects. Each colleague talks only to the mediator, never to the others, so they stay loosely coupled and the rules of how they work together live in one place.',

  scenario: {
    title: 'Evening rush at Osmani airport, Sylhet',
    paragraphs: [
      'Osmani International Airport in Sylhet has one runway. Every evening, flights come in close together: Padma Air PA-101 from Dhaka, Meghna Airways MG-207 from Chattogram, and the Karnaphuli Cargo plane KC-33, full of tea chests. Only one aircraft can use the runway at a time.',
      'Imagine there were no tower, and each pilot had to radio every other plane: “Are you landing?” With two planes that is one radio link. With four it is six, and every new arrival has to be told about every plane already in the sky. Forget to ask just one of them, and two planes meet on the runway.',
      'So Nusrat sits in the control tower. Every plane talks only to her, and she keeps the runway state and the queue. Then, one evening, an air ambulance helicopter, Rescue-1, calls in with a patient on board…',
    ],
    problem:
      'When colleagues talk to each other directly, every one of them has to know (and keep up with) all the others: n planes need n·(n−1)/2 links. The landing rules get copied into every plane, one missed message means a runway conflict, and adding a new kind of aircraft means editing all the existing ones.',
  },

  visual: {
    // Game HUD
    levelsLabel: 'Game levels',
    levelLabel: 'Level {{n}}',
    level1Title: 'Plane to plane',
    level2Title: 'Talk to the tower',
    level3Title: 'A new colleague: Rescue-1',
    level1Goal:
      'No pattern yet: there is no tower, so each arriving plane must radio the other planes before it lands. Pick whom it radios, then watch the runway.',
    level2Goal:
      'Now every aircraft talks only to SylhetTower, which holds the runway state and the queue. Pick the right message, or the tower’s right reply, and watch it keep the runway safe.',
    level3Goal:
      'An air ambulance helicopter needs to land first. Build the Helicopter class without editing PassengerPlane, CargoPlane or SylhetTower, then fly it in.',
    locked: 'Locked',
    earned: 'Landing fees',
    restart: 'Restart game',
    turnOf: 'Flight {{n}}/{{total}}',

    // Aircraft
    airPadma: 'Padma Air',
    airMeghna: 'Meghna Airways',
    airKarnaphuli: 'Karnaphuli Cargo',
    airSurma: 'Surma Air',
    airRescue: 'Air ambulance',
    planeRole: 'Aircraft',
    colleagueRole: 'Colleague',
    knowsN: 'must know {{n}} other planes',
    knowsTower: 'knows only the tower',
    airspace: 'Sylhet airspace',

    // Statuses
    stArriving: 'arriving',
    stCircling: 'circling',
    stFinal: 'on final',
    stHolding: 'holding',
    stCleared: 'cleared to land',
    stRunway: 'on the runway',
    stLanded: 'landed',
    stGoAround: 'go-around!',
    stParked: 'at the gate',
    stUnknown: 'unknown',

    // Situations
    situationLabel: 'Situation',
    'sit1-1': 'MG-207 has just arrived over Sylhet and wants to land. PA-101 is somewhere in the sky too.',
    'sit1-2': 'KC-33, the cargo plane, arrives. PA-101 and MG-207 are already in the sky. One of them may be landing right now.',
    'sit1-3': 'Surma Air SA-412 arrives as well: now there are four planes over Sylhet. Which one is landing?',
    'sit2-1': 'PA-101 arrives and wants to land. KC-33 is still rolling down the runway.',
    'sit2-2': 'MG-207 calls the tower to land, but PA-101 is still on the runway.',
    'sit2-3': 'PA-101 has landed and is turning off the runway. KC-33 and MG-207 are holding in the queue.',
    'sit3-1': 'MG-207 is on the runway and KC-33 is waiting in the queue. Rescue-1, an air ambulance, calls in with a patient.',
    'sit3-2': 'A quiet moment: the runway is free. Rescue-1 calls in, and PA-101 comes in right behind it.',
    'sit3-3': 'Rush hour: KC-33 is on the runway, and PA-101 and MG-207 are both holding. Rescue-1 calls in again.',

    // Questions and choices
    yourChoice: 'Your choice',
    ask1: 'Before it lands, whom does {{plane}} radio?',
    'ask2-1': 'How does PA-101 ask to land?',
    'ask2-2': 'What should SylhetTower reply to MG-207?',
    'ask2-3': 'How does the next plane find out the runway is free?',
    optNone: 'Nobody: just land straight away',
    optPa: 'Radio PA-101 only',
    optPaMg: 'Radio PA-101 and MG-207',
    optAll: 'Radio every other plane, one by one',
    optTower: 'tower.requestLanding(this)',
    optJustLand: 'Just land: the runway looks clear from up here',
    optAskKc: 'Radio KC-33 directly, like in level 1',
    optReplyHold: '“Hold: you are next in the queue”',
    optReplyLand: '“Cleared to land”',
    optReplyGoAround: '“Go around and call again later”',
    optNotify: "tower.notify(this, 'landed')",
    optBroadcast: 'PA-101 radios KC-33 and MG-207: “runway’s free!”',
    optSilent: 'PA-101 taxis to the gate and tells no one',

    // Radio lines (short; call signs stay in English)
    sayLanding: 'are you landing?',
    sayOnFinal: 'yes, I’m on final!',
    sayCircling: 'no, I’m circling',
    sayVacated: 'runway’s clear now',
    sayRequest: 'request landing',
    sayHold: 'hold, you’re in the queue',
    sayHolding: 'holding over the hills',
    sayCleared: 'cleared to land',
    sayWho: 'who is that?!',
    sayGoAround: 'go around!',
    sayLooksClear: 'looks clear…',
    sayTowerOnly: 'I only listen to the tower',
    sayFree: 'runway’s free!',
    sayFuel: 'fuel running low…',
    sayStillBusy: 'runway still busy?',

    // Mesh (level 1)
    noPatternRole: 'No pattern',
    meshTitle: 'Direct radio links',
    linksCount: 'links: {{n}}',
    linksNote: 'every plane ↔ every plane',

    // Tower and runway
    mediatorRole: 'ConcreteMediator',
    towerWho: 'Controller Nusrat',
    towerLinks: '{{n}} links: one per aircraft',
    runwayRole: 'Shared resource',
    runwayTitle: 'Runway 11/29',
    runwayEmpty: 'empty',
    conflictBanner: 'RUNWAY CONFLICT!',
    stuckBanner: 'The runway sits empty while planes circle and burn fuel.',
    feesLabel: 'Landing fees',
    feeEach: '{{fee}} per safe landing',

    // Legend (levels 2-3)
    mediatorIfaceRole: 'Mediator',
    towerIfaceNote: 'Every aircraft talks to this, and only this.',
    colleagueBaseRole: 'Colleague',
    aircraftNote: 'Holds the tower, never another plane.',
    newTag: 'new',
    notBuilt: 'not built yet',

    // Result
    resultOk: 'Safe landings! +{{coins}} in landing fees',
    resultConflict: 'Runway conflict: everyone had to go around!',
    resultStuck: 'Planes left circling: fuel burned, nobody landed!',

    // Builder (level 3)
    builderTitle: 'Build the Helicopter class',
    builderStep1: 'Step 1 · Who does it know?',
    builderStep2: 'Step 2 · How does it land first?',
    q1: 'Rescue-1 is a new kind of aircraft. What does the Helicopter class need a reference to?',
    q1AllPlanes: 'A list of every plane: PA-101, MG-207, KC-33…',
    q1Tower: 'Only the ControlTower, like every plane',
    q1Runway: 'The runway itself, so it can check and land',
    q2: 'It carries a patient, so it must land before the planes in the queue. How?',
    q2RadioPlanes: 'It radios each waiting plane and asks it to give way',
    q2EditPlanes: 'Edit PassengerPlane and CargoPlane so they let helicopters go first',
    q2Priority: 'Override priority → true; the tower already puts priority flights first',
    zeroEdits: 'Old code edited: 0 lines',
    flyIn: 'Fly Rescue-1 in',

    // Turn
    playButton: 'Play',
    nextTurn: 'Next flight',
    finishLevel: 'Finish level',
    tryAgain: 'Try again',

    // Level end
    levelDone: 'Level {{n}} complete!',
    nextLevel: 'Next level',
    replayLevel: 'Play this level again',
    playAgain: 'Play again from level 1',
    l1Teaser:
      'Two planes needed 1 link, four planes needed 6, and missing a single radio call put two planes on the runway. Next, a helicopter joins. Must every plane learn about it too?',
    l2Summary:
      'Not one plane knew about another. SylhetTower held the runway state and the queue, told planes to hold, and cleared the next one as soon as it heard “landed”.',
    recapTitle: 'What you learned',
    recap1:
      'Without a mediator, every colleague talks to every other one: n·(n−1)/2 links, the same coordination rules copied into each plane, and one missed message means a runway conflict.',
    recap2:
      'Mediator puts one object in the middle. Planes only call tower.requestLanding() and tower.notify(); SylhetTower keeps the runway state and the queue and decides who lands.',
    recap3:
      'A new colleague (Helicopter) only needs to know the tower. It joined with one new class and 0 lines edited in the planes or the tower, and it still landed first.',

    whatsHappening: "What's happening",
    note: 'The airlines, call signs, landing fee and flights are made up for this example.',
  },

  steps: {
    // Level 1: no pattern
    tutorial:
      'No tower yet: before landing, MG-207 must radio the other planes itself. The right call is already picked: radio PA-101. Press Play and watch.',
    'idle1-1': '{{plane}} wants to land. There is no tower, so whom does it radio first?',
    'idle1-2': '{{plane}} wants to land. You can’t see who is on final. Whom does it radio?',
    'idle1-3': '{{plane}} wants to land, and four planes share the sky now. Whom does it radio?',
    picked1: 'You picked: {{choice}}. Press Play and watch the radio calls, and the runway.',
    'l1-arrive':
      '{{plane}} arrives. With no tower, it must be wired, both ways, to every plane already here ({{added}}). {{n}} planes now need {{links}} direct links in total.',
    'l1-ask': '{{from}} radios {{to}} directly: “Are you landing?” Each plane has to ask the others itself.',
    'l1-reply-final': '{{to}}: “Yes, I’m on final!” Good thing {{from}} asked.',
    'l1-reply-circling': '{{to}}: “No, I’m circling.” But that says nothing about the other planes…',
    'l1-hold': '{{plane}} holds over the hills and waits for {{other}} to land first.',
    'l1-land-first': '{{other}} lands safely. The airport earns a {{fee}} landing fee.',
    'l1-land-second': '{{other}} radios that the runway is clear, and {{plane}} lands too. +{{fee}}.',
    'l1-land-blind': 'Nobody said “yes, I’m landing”, so {{plane}} starts its landing. But it didn’t ask everyone…',
    'l1-land-none': '{{plane}} asks nobody and starts its landing.',
    'l1-conflict':
      '🚨 {{planes}} on the runway at the same time! The plane on final was never asked, and nothing in the code guards the runway.',
    'go-around': '{{planes}}: full power, pull up and go around! Nobody is hurt, but the airport loses time, fuel and fees.',
    'l1-ok':
      'Safe landings! +{{coins}}. It worked because {{plane}} asked the plane that was landing. Direct links to keep up: {{links}}, and the number grows with every arrival.',
    'l1-fail':
      '😵 Runway conflict! {{missed}} was on final, but {{plane}} never radioed it. Without a tower, a plane only stays safe if it asks every other plane, every time. Try again.',
    'level1-done':
      'Level complete! You kept the runway safe by hand, but every plane had to know every other plane, and the links grew from 1 to 6.',

    // Level 2: the tower
    'idle2-1': '{{plane}} wants to land, and KC-33 is still on the runway. How does PA-101 ask?',
    'idle2-2': 'MG-207 is asking to land, but the runway is busy. What does the tower reply?',
    'idle2-3': 'PA-101 is done with the runway. How does the next plane in the queue find out?',
    picked2: 'You picked: {{choice}}. Press Play and watch the radio calls.',
    request: '{{plane}} radios only the tower: tower.requestLanding(this). It doesn’t know (or care) which other planes are around.',
    'check-free': 'SylhetTower checks its own state: runwayFree is true, so it can clear the plane right away.',
    'check-busy': 'SylhetTower checks its own state: runwayFree is false, {{on}} is on the runway. Only the tower needs to know that.',
    queue: 'The tower adds {{plane}} to the end of its queue. The queue lives in one place: the mediator.',
    hold: 'The tower tells {{plane}} to hold: it is number {{pos}} in the queue. The plane just waits for the tower’s call.',
    vacate: '{{plane}} rolls off the runway and calls tower.notify(this, ‘landed’). It reports to the tower, not to the other planes.',
    'runway-free': 'The tower marks the runway free. Next in its queue: {{next}}.',
    'runway-free-empty': 'The tower marks the runway free. Its queue is empty, so nobody is called.',
    clear: 'Runway free: the tower sets runwayFree = false and clears {{plane}} to land. Only one plane at a time.',
    'clear-next': 'The tower takes {{plane}} from the front of the queue, sets runwayFree = false, and clears it to land.',
    land: '{{plane}} lands safely: the only aircraft on the runway. +{{fee}} in landing fees.',
    unannounced: '{{planes}}: straight past the tower without a word. The tower has no idea who is coming!',
    conflict: '🚨 {{planes}} on the runway at the same time! The plane skipped the tower, so nobody kept the runway clear.',
    'conflict-tower': '🚨 {{planes}} on the runway at the same time! The tower cleared a plane onto a busy runway.',
    'conflict-both': '🚨 {{planes}} heard “runway free” at once, and both landed. The tower, which keeps the queue, was skipped.',
    'l2-skip-tower': 'PA-101 doesn’t call the tower: from up here, the runway looks clear…',
    'l2-no-link':
      'PA-101 tries to radio KC-33, but in this design an Aircraft only holds a reference to the tower. There is no kc33 to call!',
    'l2-no-answer': 'KC-33 never hears it: it only listens to the tower. PA-101 gets no answer and decides the way must be clear…',
    'l2-clear-anyway': 'The tower replies “Cleared to land”, even though runwayFree is false…',
    'l2-sent-away': 'The tower tells MG-207 to go around and call again later. MG-207 is not in the queue: the tower forgets it.',
    'l2-stuck-goaround':
      'The runway is free, but the queue is empty: MG-207 is still out over Jaflong, burning fuel, waiting to call again.',
    'l2-taxi': 'PA-101 turns off the runway, but doesn’t tell the tower.',
    'l2-broadcast': 'Instead, PA-101 radios KC-33 and MG-207 directly: “Runway’s free!” Both of them hear it at the same moment.',
    'l2-taxi-silent': 'PA-101 turns off the runway and taxis to the gate, telling no one.',
    'l2-tower-unaware': 'Nobody called tower.notify(), so the tower still thinks runwayFree is false.',
    'l2-still-holding': '{{plane}} keeps holding. The tower won’t clear anyone while it thinks the runway is busy.',
    'l2-stuck-silent': 'An empty runway and two planes circling: the tower’s queue only moves when someone notifies it.',
    'l2-ok-1': 'Safe landing! +{{coins}}. PA-101 asked the tower, the tower queued it, and cleared it the moment KC-33 reported “landed”.',
    'l2-ok-2': 'Safe landing! +{{coins}}. The tower kept MG-207 in its queue and cleared it as soon as the runway was free.',
    'l2-ok-3': 'Safe landings! +{{coins}}. Each plane reported “landed” to the tower, and the tower cleared the next in line. No plane talked to another.',
    'l2-fail-justLand':
      '😵 Skipping the tower brings back the level-1 problem: nobody knew PA-101 was coming. In Mediator, a colleague always goes through the mediator: tower.requestLanding(this).',
    'l2-fail-askKc':
      '😵 PA-101 only has a reference to the tower, by design. Colleagues don’t know each other; that’s what keeps them loosely coupled. Ask the tower: tower.requestLanding(this).',
    'l2-fail-replyLand':
      '😵 The tower is the one place that knows the runway is busy, and it ignored its own state. When the runway is busy, the mediator queues the plane and tells it to hold.',
    'l2-fail-replyGoAround':
      '😵 MG-207 was sent away and forgotten. The tower has a queue for exactly this: “Hold, you’re next”, then clear it when the runway is free.',
    'l2-fail-broadcast':
      '😵 Two planes heard “free” at once. Only the tower knows the queue order, so a plane reports to the tower (tower.notify) and the tower decides who is next.',
    'l2-fail-silent':
      '😵 The tower never learned the runway was free, so nobody was cleared. A colleague must tell the mediator when something changes: tower.notify(this, ‘landed’).',
    'level2-done':
      'Level complete! Planes talked only to SylhetTower. The runway state, the queue and the rules lived in one class, the mediator.',

    // Level 3: a new colleague
    'build-q1':
      'Rescue-1, an air ambulance helicopter, is flying a patient to Sylhet. It’s a new kind of aircraft. First: what does the Helicopter class need a reference to?',
    'wrong-q1-allPlanes':
      'That’s the level-1 mesh again: Rescue-1 would need a link to every plane, and every plane a link back to it. In Mediator, a colleague knows only the mediator.',
    'wrong-q1-runway':
      'Then the helicopter would decide by itself whether the runway is free, and skip the tower’s queue. The runway belongs to the tower; colleagues ask the tower.',
    'build-q2':
      'Right: class Helicopter extends Aircraft, with only the tower. Now, it has a patient on board and must land before the queue. How?',
    'wrong-q2-radioPlanes':
      'Colleagues don’t talk to each other, and Rescue-1 doesn’t even know which planes are waiting. Who lands next is the tower’s decision.',
    'wrong-q2-editPlanes':
      'That edits old classes, and every plane would need to know about helicopters. The planes don’t decide the order at all: the tower’s queue does, and it already puts priority flights first.',
    'build-ready':
      'Done: one new class. PassengerPlane, CargoPlane and SylhetTower: 0 lines edited. Press “Fly Rescue-1 in”.',
    'build-done': 'Helicopter is ready. Press Play: Rescue-1 calls the same tower.requestLanding(this) as every plane.',
    'idle3-1': 'MG-207 is on the runway, KC-33 is in the queue, and Rescue-1 calls in. Press Play.',
    'idle3-2': 'The runway is free this time. Rescue-1 calls in, with PA-101 right behind. Press Play.',
    'idle3-3': 'Two planes are already holding. Will Rescue-1 still land first? Press Play.',
    'h-create': 'new Helicopter(‘Rescue-1’, tower): it gets only the tower. No plane is told about it, and no plane needs to be.',
    'h-request': 'Rescue-1 radios the tower: tower.requestLanding(this). The same call every plane makes.',
    'h-priority': 'The runway is busy. The tower asks the plane for its priority: Helicopter says true. The queue was: {{queue}}.',
    'queue-front': 'Priority flight: the tower puts {{plane}} at the FRONT of its queue. The waiting planes don’t need to know why.',
    'hold-front': 'The tower tells {{plane}} to hold: it is number {{pos}}, first in line.',
    'h-land': 'Rescue-1 lands: the patient is on the ground and on the way to hospital. +{{fee}}.',
    'h-vacate': 'Rescue-1 leaves the runway and calls tower.notify(this, ‘landed’), exactly like the planes do.',
    'l3-done-1': 'Safe landing! +{{coins}}. Rescue-1 jumped ahead of KC-33, and KC-33 is cleared next. KC-33 never had to know why.',
    'l3-done-2': 'Safe landings! +{{coins}}. With a free runway, Rescue-1 was cleared at once; PA-101 simply waited its turn in the queue.',
    'l3-done-3':
      'Safe landing! +{{coins}}. Rescue-1 went ahead of both waiting planes, and PA-101 is cleared next. Not one plane class changed.',
    'level3-done':
      'You finished the game! Colleagues talk only to the mediator, the mediator keeps the shared state and the rules, and a new colleague joins without touching the others.',
  },

  codeComments: {
    mediator: 'Mediator: the one thing every aircraft talks to',
    colleague: 'Colleague: an aircraft knows the tower, never another plane',
    onlyTower: 'its only contact: the tower',
    priorityHook: 'a normal flight waits its turn',
    askTower: 'ask the tower, not the other planes',
    concreteColleague: 'ConcreteColleagues: each lands its own way, then reports to the tower',
    reportBack: 'off the runway: tell the tower',
    concreteMediator: 'ConcreteMediator: holds the runway state and the queue, decides who lands',
    runwayState: 'only the tower tracks the runway',
    waitingLine: 'planes waiting their turn',
    emergencyFirst: 'priority flights go to the front',
    runwayBack: 'the runway is free again',
    nextInLine: 'the next plane in the queue',
    onlyOne: 'one aircraft on the runway at a time',
    client: 'Client: every aircraft gets only the tower',
    noPlaneKnowsPlane: 'PA-101 knows nothing about KC-33',
    withoutIntro: 'No pattern: every plane talks to every other plane',
    knowsAll: 'each plane keeps a list of all the others',
    askEach: 'radio every plane: are you landing?',
    waitTurn: 'someone is landing: wait',
    hopeClear: 'nobody said yes, so land… and hope',
    nobodyGuards: 'nobody guards the runway',
    wireUp: 'KC-33 arrives: wire it to every plane, both ways',
    linksGrow: 'n planes = n·(n−1)/2 links',
    withoutNext: 'A helicopter joins? Every plane’s list must change again',
    withAdd: 'A new colleague = one new class',
    sameBase: 'the same Aircraft base, the same tower',
    airAmbulance: 'an air ambulance: the tower puts it first',
    othersSame: 'PassengerPlane, CargoPlane, SylhetTower: not a line edited',
    towerSame: 'its queue already puts priority flights first',
    withUse: 'Rescue-1 joins: give it the tower',
    knowsTower: 'no list of planes needed',
    sameCall: 'the same call every plane makes',
    withZero: 'Old code edited: 0 lines. Without the pattern: a new link in every plane',
  },

  compare: {
    without: {
      title: 'Every plane radios every plane',
      points: [
        'Each plane keeps a list of all the other planes and asks each one before it lands.',
        'The links grow fast: n planes need n·(n−1)/2 of them, and every arrival must be wired to everyone.',
        'The landing rules are copied into every plane; miss one message and two planes meet on the runway.',
        'A new kind of aircraft (a helicopter) means editing every existing plane so they know about it.',
      ],
    },
    with: {
      title: 'Every plane talks only to the tower',
      points: [
        'Aircraft hold one reference: the ControlTower. They call requestLanding() and notify(), nothing else.',
        'SylhetTower keeps the runway state and the queue, so the coordination rules live in one class.',
        'Links grow by one per aircraft, not one per pair.',
        'A new colleague (Helicopter) is one new class that knows the tower; the planes are not edited at all.',
      ],
    },
    benefit:
      'Mediator turns a tangle of many-to-many links into one-to-many: colleagues stay simple and reusable because they don’t know each other, and how they work together can be read and changed in one place, the mediator.',
    whenToUse: [
      'Many objects must coordinate, and wiring each to all the others makes the code tangled and hard to change (chat rooms, air-traffic control, form fields that depend on each other).',
      'You want to reuse a component without dragging along references to everything it talks to.',
      'The rules of how a group behaves together keep changing, and you want them in one class. (Watch that the mediator itself doesn’t grow into a giant “god object”.)',
    ],
  },
} satisfies PatternContent

export type MediatorContent = typeof en

import type { PatternContent } from '@/types/pattern'

export const en = {
  title: 'Flyweight',
  tagline: 'Ten thousand rickshaws on one phone screen, and only one copy of the rickshaw picture.',
  intent:
    'Share the heavy, identical part of many objects instead of copying it into each one. A factory hands out one shared flyweight per type (intrinsic state), and each object keeps only what is truly its own (extrinsic state), like its position.',

  scenario: {
    title: 'Nusrat’s Dhaka Rickshaw Map',
    paragraphs: [
      'Nusrat builds the Dhaka Rickshaw Map app at a small startup in Mohakhali. Riders open it, see the rickshaws around them, and book one; the app earns about ৳2 in booking fees for every rickshaw it shows.',
      'Each rickshaw on the map needs a painted sprite (200 KB), its hood art (50 KB) and a bell sound, plus its own position, heading and free/busy status. On a budget Android phone the map gets about 50 MB. Dhanmondi at 7am is fine. Farmgate at 6pm has 2,000 rickshaws.',
      'And on Eid eve the whole city is on the move: 10,000 rickshaws, and then the CNGs want in too…',
    ],
    problem:
      'If every rickshaw object carries its own copy of the same 250 KB picture, memory grows with every rickshaw: 2,000 rickshaws need 500 MB of identical pixels. The app either hides most rickshaws or freezes, even though only 24 bytes per rickshaw are really different.',
  },

  visual: {
    // Game HUD
    levelsLabel: 'Game levels',
    levelLabel: 'Level {{n}}',
    level1Title: 'Every rickshaw, its own picture',
    level2Title: 'Share the model',
    level3Title: 'CNGs join the map',
    level1Goal:
      'No pattern yet: every Rickshaw object loads its own sprite. For each area, choose how many rickshaws to load: as many as fit in the phone’s 50 MB.',
    level2Goal:
      'Now there is a ModelFactory. Decide which fields every rickshaw can share (one VehicleModel) and which each Vehicle keeps for itself. Watch the memory bar.',
    level3Goal: 'CNG auto-rickshaws join the map. Add them as one more shared model, without editing a single line of old code.',
    locked: 'Locked',
    earned: 'Earned',
    restart: 'Restart game',
    turnOf: 'Area {{n}}/{{total}}',

    // Client
    clientRole: 'Client',
    appTitle: 'Dhaka Rickshaw Map',
    opensMap: '{{name}} opens the map',
    rickshawCount: '{{n}} rickshaws',
    cngCount: '{{n}} CNGs',
    limitLabel: 'How many rickshaws should the map load?',
    optAll: 'All',
    optNearest: 'Nearest',
    perObjectNote: 'Each Rickshaw object: {{per}} · map budget: {{budget}}',
    splitLabel: 'Tap the fields every rickshaw can share',
    splitHint: 'Tapped = shared, once, in VehicleModel. The rest stay in each Vehicle.',
    newTag: 'New',
    cngCallLabel: 'What should each CNG ask for?',
    clientNote: 'The client only asks the factory for a model by name',

    // Middle node
    noPatternRole: 'No pattern',
    perObject: 'Each object: {{per}}',
    objectsInMemory: '{{n}} objects in memory',
    moreObjects: '+{{n}} more',
    samePicture: 'same picture, loaded again!',
    factoryRole: 'Flyweight Factory',
    cacheLabel: 'cache',
    cacheEmpty: 'Empty: no model loaded yet',
    flyweightRole: 'Flyweight',
    missTag: 'Miss → created',
    hitTag: 'Hit → reused',
    sharedNone: 'nothing shared',
    notBuilt: 'not registered yet',

    // Bottom node
    phoneRole: 'Phone',
    mapTitle: 'Map · {{area}}',
    contextRole: 'Context',
    ownLabel: 'Each Vehicle keeps',
    memoryLabel: 'Map memory',
    memoryOf: '{{used}} / {{budget}}',
    naiveNote: 'With a copy in every object: {{naive}}',
    ghostNote: 'Faded = on the street, not on the map',
    froze: 'The map froze at {{area}}!',
    drawnOk: 'Map drawn · {{n}} on screen',
    tooFew: 'Only {{n}} shown: room for more',
    hiddenNote: '{{n}} rickshaws missing from the map',
    pileUp: 'All drawn on one spot!',
    sameWay: 'All facing one way!',
    allBusy: 'All turned busy!',

    // Builder (level 3)
    builderTitle: 'Add CNG auto-rickshaws',
    builderStep1: 'Step 1 · What does every CNG share?',
    builderStep2: 'Step 2 · Where is the CNG model made?',
    q1: 'Which CNG data goes into its one shared VehicleModel?',
    q1Model: 'cng.png, cage art, horn sound',
    q1Pos: 'x, y and heading',
    q1All: 'All of it, inside every CNG',
    q2: 'Thousands of CNGs will ask for a model. Where is it created?',
    q2Factory: 'In ModelFactory, on the first get(\'cng\')',
    q2Screen: 'In MapScreen, one per CNG',
    q2Edit: 'Inside VehicleModel, by editing it',
    useCng: 'Add CNGs to the map',
    zeroEdits: 'Old code edited: 0 lines',

    // Turn
    showButton: 'Show rickshaws',
    showVehicles: 'Show vehicles',
    nextArea: 'Next area',
    finishLevel: 'Finish level',
    tryAgain: 'Try again',

    // Level end
    levelDone: 'Level {{n}} complete!',
    nextLevel: 'Next level',
    replayLevel: 'Play this level again',
    playAgain: 'Play again from level 1',
    l1Teaser:
      'And on Eid eve there are 10,000 rickshaws across Dhaka. At 250 KB each, that is 2.5 GB of the same picture… There must be a better way…',
    l2Summary:
      '10,000 rickshaws in about half a megabyte. The heavy, identical data lives once in VehicleModel; each Vehicle keeps only its own 25 bytes.',
    recapTitle: 'What you learned',
    recap1: 'Without sharing, every object carries its own copy of the same heavy data, so memory grows with every object and the app hides rickshaws or freezes.',
    recap2:
      'A Flyweight holds the intrinsic state (same for all: sprite, art, sound) once. Each object keeps only its extrinsic state (x, y, heading, isFree) and passes it in when drawing.',
    recap3: 'A new type (CNG) is one more model in the same ModelFactory. Old code edited: 0 lines.',

    // Names and places
    mitu: 'Mitu',
    karim: 'Karim',
    rahim: 'Rahim',
    tania: 'Tania',
    dhanmondi: 'Dhanmondi 27',
    mirpur: 'Mirpur 10',
    farmgate: 'Farmgate',
    chawkbazar: 'Chawkbazar',
    citywide: 'all of Dhaka',
    gulshan: 'Gulshan 1',
    airport: 'Airport Road',
    morning: '7am',
    noon: '1pm',
    rush: '6pm rush hour',
    evening: '8pm',
    eidEve: 'Eid eve',

    whatsHappening: "What's happening",
    note: 'Memory sizes are made-up round numbers for this example (1 KB = 1,000 bytes).',
  },

  steps: {
    // Level 1: no pattern
    tutorial:
      '{{name}} opens the map at {{area}}: {{onStreet}} rickshaws are on the street. No pattern yet, so every Rickshaw object loads its own pictures ({{per}}), and the map may use {{budget}}. “All ({{onStreet}})” is picked for you: press Show rickshaws and watch the memory bar.',
    idle1:
      '{{name}} opens the map at {{area}}: {{onStreet}} rickshaws are on the street. Each Rickshaw object costs {{per}} and the map may use {{budget}}. Load as many as fit: too many freezes the phone, too few leaves riders with an empty map.',
    picked1: '{{n}} rickshaws × {{per}} each. Will that fit in {{budget}}? Press Show rickshaws.',
    'l1-start':
      'showArea() runs with a limit of {{n}}. Every rickshaw becomes a new Rickshaw object, and every object loads its own pictures in its constructor.',
    'l1-new': 'The first Rickshaw loads rickshaw.png (200 KB) and its hood art (50 KB): {{per}} for one rickshaw. Fine so far.',
    'l1-copy':
      'The second Rickshaw loads the very same pictures again: another {{per}} of identical pixels. Only its x, y and heading (24 bytes) are actually different.',
    'l1-fill': 'All {{n}} objects: {{n}} × {{per}} = {{used}}. It fits in {{budget}}, but nearly all of it is one picture, copied {{n}} times.',
    'l1-fill-over': '{{n}} × {{per}} = {{used}}, but the phone gives the map only {{budget}}. The memory bar bursts…',
    'l1-ok': 'Map drawn! {{name}} sees all {{shown}} rickshaws, and the app earns {{amount}} in booking fees. It worked, but only because this area is small.',
    'l1-ok-hidden':
      'Map drawn in {{used}}, +{{amount}}. But {{name}} sees only {{shown}} of {{onStreet}} rickshaws: {{hidden}} are missing, because every object carries its own copy of the same picture.',
    'l1-fail-crash': '😵 The map froze at {{area}}! {{used}} of pictures does not fit in {{budget}}, so the phone killed the app.',
    'l1-fail-few':
      '😵 Only {{shown}} rickshaws on the map, though the phone had room for more. {{name}} sees an almost empty street and books nothing. Load as many as fit in {{budget}}.',
    'level1-done':
      'Level complete! Without sharing, every Rickshaw carries its own {{per}} picture, so {{budget}} holds only about 200 rickshaws. Farmgate alone has 2,000.',

    // Level 2: Flyweight
    idle2:
      '{{name}} opens the map at {{area}}: {{n}} rickshaws. Now there is a ModelFactory. Tap the fields that are the same for every rickshaw: they go into one shared VehicleModel. The rest stay in each Vehicle.',
    'idle2-more':
      'A new version of the map: {{newFields}} joined. {{name}} opens it at {{area}} with {{n}} rickshaws. Shared in VehicleModel, or kept in each Vehicle? Decide for the new fields, then press Show rickshaws.',
    picked2: 'Shared in VehicleModel: {{shared}}. Kept in each Vehicle: {{own}}. Press Show rickshaws.',
    request: 'The first rickshaw asks factory.get(\'rickshaw\'). The factory looks in its cache before loading anything.',
    miss: 'Cache miss: there is no model yet. The factory creates one VehicleModel with {{shared}} ({{sharedBytes}}) and caches it. This happens once.',
    hit: 'The second rickshaw asks again: cache hit! The factory returns the same VehicleModel object. No picture is loaded twice.',
    place: 'Each new Vehicle keeps only its own data: {{own}} ({{ownBytes}}), plus a reference to the shared model.',
    fill: 'All {{n}} vehicles: {{sharedBytes}} once + {{n}} × {{ownBytes}} = {{used}}. With a copy in every object it would be {{naive}}.',
    'fill-over': 'Uh-oh: {{field}} stayed in each Vehicle, so it is copied {{n}} times: {{used}}. That is more than {{budget}}…',
    'l2-ok':
      'Map drawn! Each Vehicle passes its own x, y and heading into the shared model’s draw(). {{n}} rickshaws in {{used}}. +{{amount}}.',
    'l2-fail-crash':
      '😵 The map froze at {{area}}. {{field}} is the same for every rickshaw, so it belongs once in the shared VehicleModel, not in each Vehicle.',
    'l2-fail-pile':
      '😵 All {{n}} rickshaws are drawn on one spot! x, y was shared, so every Vehicle has the same position. Position is extrinsic: each Vehicle must keep its own.',
    'l2-fail-facing':
      '😵 Every rickshaw faces the same way, even on one-way roads. heading was shared, but each rickshaw drives its own direction: keep it in each Vehicle.',
    'l2-fail-busy':
      '😵 {{name}} booked one rickshaw and all {{n}} turned busy! isFree was shared, so one change hit every Vehicle. State that changes per object must never be shared.',
    'level2-done':
      'Level complete! Heavy, identical data (intrinsic) lives once in the flyweight; small, per-object data (extrinsic) stays in each Vehicle. Memory stays flat as the count grows.',

    // Level 3: a new flyweight type
    'build-q1':
      'New: CNG auto-rickshaws join the map ({{cngModel}} of pictures and sound per CNG model). First: what goes into the CNG’s shared VehicleModel?',
    'wrong-q1-pos':
      'x, y and heading are different for every CNG. Shared, all CNGs would sit on one spot facing one way. Share only what is identical for every CNG.',
    'wrong-q1-all': 'That is level 1 again: every CNG would carry its own copy of cng.png. {{cngs}} CNGs × {{cngModel}} = {{naiveCng}}.',
    'build-q2': 'cng.png, the green cage art and the horn go into one shared model. Now: where is that model created?',
    'wrong-q2-screen':
      'Then every CNG makes its own model, and nothing is shared. Only the factory’s cache guarantees one model per type, however many CNGs ask.',
    'wrong-q2-edit':
      'VehicleModel already holds any sprite, art and sound. A CNG is just new data for the same class, so there is no need to touch code that works.',
    'build-ready':
      'Done: one new register(\'cng\', …) call, and ModelFactory creates the CNG model on the first get(\'cng\'). Old code edited: 0 lines. Press “Add CNGs to the map”.',
    'build-done': 'CNGs can be requested now. Choose what each CNG asks for, then press Show vehicles.',
    idle3: '{{name}} opens the map at {{area}}: {{rickshaws}} rickshaws and {{cngs}} CNGs. What should each CNG ask for?',
    picked3: 'Each CNG calls factory.get(\'cng\'), just like the rickshaws call get(\'rickshaw\'). Press Show vehicles.',
    'wrong-pick-rickshaw':
      'factory.get(\'rickshaw\') returns the rickshaw model, so every CNG would be drawn as a pedal rickshaw. Riders would book a CNG and see a rickshaw arrive.',
    'wrong-pick-new': 'A new VehicleModel for each CNG means {{cngs}} copies of cng.png: {{naiveCng}}. That is level 1 again. Ask the factory.',
    'l3-rickshaws':
      'First the {{rickshaws}} rickshaws, exactly as before: the first get(\'rickshaw\') creates the model, every other one reuses it. That code was not touched.',
    'l3-request': 'The first CNG asks factory.get(\'cng\'). Same factory, same method, just a new key.',
    'l3-miss': 'Cache miss for \'cng\': the factory runs the new loader once and caches a CNG VehicleModel ({{cngModel}}).',
    'l3-hit': 'Every other CNG: cache hit. The cache now holds two models, one per type, however many vehicles there are.',
    'l3-place': 'Each CNG is an ordinary Vehicle: its own x, y, heading and isFree (25 bytes) plus a reference to the CNG model.',
    'l3-fill': '{{total}} vehicles: two models ({{models}}) + {{total}} × 25 B = {{used}}, still far below {{budget}}.',
    'l3-draw': 'Map drawn with rickshaws and CNGs! {{name}} can book either. +{{amount}}. Old code edited: 0 lines.',
    'level3-done':
      'You finished the game! Flyweight shares the heavy, identical part of many objects, and a new type is just one more model in the factory.',
  },

  codeComments: {
    flyweight: 'Flyweight: the heavy data every rickshaw has in common (intrinsic state)',
    sharedSprite: 'loaded once per type, shared by thousands of vehicles',
    extrinsicIn: 'the per-vehicle data (extrinsic state) is passed in, never stored',
    factory: 'Flyweight factory: one model per type, cached',
    lookFirst: 'look in the cache before loading anything',
    missCreate: 'cache miss: load the model once and cache it',
    hitReuse: 'cache hit: every later request gets the same object back',
    context: 'Context: what is truly different for each vehicle (extrinsic state)',
    extrinsic: 'its own position and heading: a few bytes',
    sharedRef: 'a reference to the shared model, not a copy',
    usage: 'Client code: thousands of vehicles, one model',
    manyObjects: '2,000 vehicles at Farmgate, still one VehicleModel',
    withoutIntro: 'No pattern: every rickshaw object loads its own pictures',
    ownCopy: 'each object holds its own copy of the picture…',
    loadsAgain: '…loaded again for every single rickshaw (250 KB)',
    pickLimit: 'the screen must cap how many rickshaws it can afford',
    perObject: 'new Rickshaw = another 250 KB of the same pixels',
    outOfMemory: 'too many rickshaws and the phone runs out of memory',
    withoutMath: '2,000 rickshaws × 250 KB = 500 MB of one picture; only 24 bytes each really differ',
    withAdd: 'CNGs = one new loader registered with the same factory',
    newModel: 'runs once, on the first get(\'cng\')',
    cngShared: 'intrinsic: cng.png, the green cage art and the horn',
    withSame: 'The rest is unchanged: same factory, same Vehicle, same draw()',
    unchanged: 'rickshaws: exactly the code from before',
    sameFactory: 'a new key, the same get() method',
    sameDraw: 'one loop draws both types',
    withZero: 'Old code edited: 0 lines. Memory for 5,000 more CNGs: one 240 KB model + 25 bytes each',
  },

  compare: {
    without: {
      title: 'Every object carries its own copy',
      points: [
        'Each Rickshaw loads rickshaw.png and the hood art in its constructor: 250 KB per object.',
        'Memory grows with every rickshaw: 2,000 rickshaws need 500 MB of the same picture.',
        'The screen has to cap the count, so riders see only a fraction of the real rickshaws, or the app freezes.',
        'Only 24 bytes per rickshaw (x, y, heading) are actually different; the rest is waste.',
      ],
    },
    with: {
      title: 'One shared model per type, tiny objects',
      points: [
        'VehicleModel holds the intrinsic state (sprite, art, sound) once per type.',
        'ModelFactory caches the models: the first get() creates one, every later get() reuses it.',
        'Each Vehicle keeps only its extrinsic state (x, y, heading, isFree) and passes it into draw().',
        'A new type (CNG) is one more registered model; no old class changes.',
      ],
    },
    benefit:
      'Flyweight turns "N copies of the same heavy data" into "one copy plus N small objects". Memory stays nearly flat as the count grows, so the app can show every rickshaw in the city on a budget phone.',
    whenToUse: [
      'An app needs a huge number of similar objects: map markers, game sprites, characters in a text editor, particles.',
      'Most of each object’s data is identical and can be shared, and the rest is small and can be passed in.',
      'Memory (or loading time) is the bottleneck, and the shared part never changes after it is created.',
    ],
  },
} satisfies PatternContent

export type FlyweightContent = typeof en

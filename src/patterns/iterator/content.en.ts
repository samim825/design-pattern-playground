import type { PatternContent } from '@/types/pattern'

export const en = {
  title: 'Iterator',
  tagline: 'Walk a collection in batting order, by strike rate or all-rounders only, with the same little loop, and without ever seeing how it stores its players.',
  intent:
    'Give a collection objects that walk it for you: each iterator answers hasNext() and next(), so clients can go through the elements one by one, in any order or filter, without knowing how the collection is stored inside.',

  scenario: {
    title: 'Mirpur Tigers’ batting order at the para cricket club',
    paragraphs: [
      'Every Friday afternoon, the Mirpur Tigers play para cricket on the field behind the mosque. Karim bhai is the captain, and Nusrat keeps the score on the club’s little app. Before each innings, Karim bhai tells her who goes out to bat, and she calls the names out one by one.',
      'The requests keep changing: “today’s batting order”, “who’s in form? highest strike rate first”, “super over: only the all-rounders”. In the app, Squad simply hands out its raw list of players, so Nusrat writes a new loop for every request: index math, sorting, filtering. Start at 1 instead of 0 and Rahim the opener never bats. Sort the real list and next week’s batting order is scrambled. And when the app’s developer moves the list to a Map, every one of those loops breaks.',
      'Then a leg-spinner comes on to bowl, and Karim bhai wants only the left-handers…',
    ],
    problem:
      'Every client loops over the squad’s raw list by itself, so each one repeats the index math, the sorting and the filtering, and each one depends on how the list is stored. A small mistake skips or crashes; a careless sort changes the list for everyone; and changing the storage (array to Map) breaks every loop at once.',
  },

  visual: {
    // Game HUD
    levelsLabel: 'Game levels',
    levelLabel: 'Level {{n}}',
    level1Title: 'Hand-written loops',
    level2Title: 'Ask for an iterator',
    level3Title: 'A new iterator: left-handers',
    level1Goal:
      'No pattern yet: Squad hands out its raw list, and Nusrat writes a loop for each of Karim bhai’s requests. Pick the loop, then watch the batters walk out.',
    level2Goal:
      'Now Squad keeps its list private and gives out iterators. Nusrat’s loop is always the same: while (it.hasNext()) announce(it.next().name). Just pick the right iterator for the request.',
    level3Goal: 'A leg-spinner is bowling, so Karim bhai wants left-handers only. Build LeftHandedIterator without editing Squad, Team or the old iterators, then use it.',
    locked: 'Locked',
    earned: 'Prize money',
    restart: 'Restart game',
    turnOf: 'Match {{n}}/{{total}}',

    // Roles and names
    clientRole: 'Client',
    scorerTitle: 'Scorer · Nusrat',
    captainSays: 'Karim bhai, captain',
    loopRole: 'No pattern',
    loopTitle: 'Nusrat’s hand-written loop',
    exposedRole: 'No pattern',
    squadRole: 'ConcreteAggregate',
    squadTitle: 'Squad · Mirpur Tigers',
    concreteIteratorRole: 'ConcreteIterator',
    innerRole: 'Wrapped iterator',
    aggregateRole: 'Aggregate',
    iteratorRole: 'Iterator',
    rahim: 'Rahim',
    sumon: 'Sumon',
    tania: 'Tania',
    jamal: 'Jamal',
    rafiq: 'Rafiq',
    mitu: 'Mitu',
    babu: 'Babu',
    roleBatter: 'batter',
    roleKeeper: 'keeper',
    roleAllrounder: 'all-rounder',
    roleBowler: 'bowler',
    handLeft: 'left-hand',
    handRight: 'right-hand',
    handLeftShort: 'left',
    handRightShort: 'right',
    srLabel: 'SR',

    // Requests
    reqOrder: 'Send the batters out in today’s batting order.',
    reqForm: 'Who’s in form? Send them out highest strike rate first.',
    reqSuperOver: 'Super over! Send out only the all-rounders.',
    reqFinal: 'The final against Pallabi XI: everyone, in batting order.',
    reqLefty1: 'A leg-spinner is bowling: left-handers only, in batting order.',
    reqLefty2: 'Left-handers only, best strike rate first.',
    reqLefty3: 'Babu has joined at No. 7. Left-handers only, in batting order.',

    // Client
    calledOut: 'Called out',
    nobodyYet: 'nobody yet',
    yourChoice: 'Your choice',
    pickLabel1: 'Which loop does Nusrat write?',
    pickLabel2: 'Which iterator does Nusrat ask for?',
    knowsL1: 'Nusrat’s loop knows Squad’s list: its indexes, its order and its type',
    knowsL2: 'Nusrat only knows hasNext() and next(); the list stays private',
    othersSame: 'Squad · Team · the 3 old iterators · Nusrat’s loop: unchanged',

    // Choices: level 1
    optZero: 'for (let i = 0; i < players.length; i++)',
    optOne: 'for (let i = 1; i <= players.length; i++)',
    optMinus: 'for (let i = 0; i < players.length - 1; i++)',
    optCopy: 'Sort a copy: [...players].sort(bySR), then loop it',
    optInPlace: 'Sort the list itself: players.sort(bySR), then loop it',
    optReverse: 'Loop backwards: i from players.length - 1 down to 0',
    optValues: 'for (const p of players.values()), keep the all-rounders',
    optOldLoop: 'Keep the old loop: for (i = 0; i < players.length; i++)',
    optFilter: 'players.filter(p => p.role === "all-rounder")',

    // Loop (level 1)
    pickLoop: 'Pick a loop above.',
    copyLabel: 'Nusrat’s sorted copy',
    crashTitle: 'The app crashed!',

    // Iterators
    pickIterator: 'Pick an iterator above.',
    ownCopy: 'its own sorted copy (the squad isn’t touched)',
    iterOrder: 'walks the squad in its stored batting order',
    iterSr: 'walks a sorted copy, highest strike rate first',
    iterAr: 'walks the squad, skipping anyone who isn’t an all-rounder',
    lhNote: 'pulls players from the iterator it wraps and skips the right-handers',
    notBuilt: 'not built yet',
    newTag: 'new',
    teamNote: 'Squad promises iterators, never its list.',
    iteratorNote: 'Every iterator answers the same two questions.',

    // Squad
    storagePublic: 'anyone can reach in',
    storagePrivate: 'only its iterators walk it',
    scrambled: 'The squad’s real batting order has changed!',

    // Result
    resultOk: 'Right lineup! Mirpur Tigers win · +{{coins}}',
    resultBad: 'Wrong lineup!',
    resultCrash: 'The app crashed mid-match!',

    // Builder (level 3)
    builderTitle: 'Build LeftHandedIterator',
    builderStep1: 'Step 1 · What is it?',
    builderStep2: 'Step 2 · Where do the players come from?',
    q1: 'Nusrat’s loop must use it like any other iterator. What should the new code be?',
    q1ClientIf: 'An if (p.leftHanded) inside Nusrat’s loop',
    q1Implements: 'class LeftHandedIterator implements PlayerIterator',
    q1SquadMethod: 'A new leftHanders() loop added to Squad',
    q2: 'Squad’s list is private. How does LeftHandedIterator find the left-handers?',
    q2ReadList: 'It reads squad.players directly',
    q2SortList: 'It sorts the squad so the left-handers come first',
    q2Wrap: 'It wraps another iterator and skips the right-handers in its own hasNext()',
    zeroEdits: 'Old code edited: 0 lines',
    useLh: 'Use LeftHandedIterator',

    // Turn
    playButton: 'Play',
    nextTurn: 'Next match',
    finishLevel: 'Finish level',
    tryAgain: 'Try again',

    // Level end
    levelDone: 'Level {{n}} complete!',
    nextLevel: 'Next level',
    replayLevel: 'Play this level again',
    playAgain: 'Play again from level 1',
    l1Teaser:
      'Three requests, three different loops, and each one breaks when Squad changes inside. Next, a leg-spinner comes on and Karim bhai wants the left-handers. Yet another loop?',
    l2Summary:
      'Three different requests, and Nusrat’s loop never changed. Squad kept its list private; each iterator knew how to walk it (in order, sorted by strike rate, or skipping non-all-rounders).',
    recapTitle: 'What you learned',
    recap1:
      'When a collection hands out its raw list, every client writes its own loop: the index math, sorting and filtering get repeated, one wrong step skips or crashes, and changing the storage breaks every loop.',
    recap2:
      'Iterator keeps the list private and gives out objects that walk it: each answers hasNext() and next(). The client’s loop is the same for every traversal, whether it’s in order, by strike rate or all-rounders only.',
    recap3:
      'A new traversal (left-handers) is one new iterator class with the same interface. It can even wrap an old iterator. Squad, Team and the old iterators: 0 lines edited.',

    whatsHappening: "What's happening",
    note: 'The club, players and figures are made up for this example.',
  },

  steps: {
    // Level 1: no pattern
    tutorial:
      'Karim bhai: “{{req}}” With no pattern, Squad just hands Nusrat its raw list, so she writes the loop herself. The right loop is already picked. Press Play and watch.',
    'idle1-1': 'Karim bhai: “{{req}}” Which loop does Nusrat write over squad.players?',
    'idle1-2': 'Karim bhai: “{{req}}” Strike rates are on the cards. How does Nusrat loop over the list in that order?',
    'idle1-3':
      'The app’s developer just moved Squad’s players into a Map, keyed by jersey number. Karim bhai: “{{req}}” Which loop works now?',
    picked1: 'You picked: {{choice}}. Press Play and watch who walks out to bat.',
    'l1-request': 'Karim bhai: “{{req}}” Squad has no say in it: its players list is public, so Nusrat’s code reaches straight in.',
    'l1-start-zero': 'The loop starts at i = 0, the first slot of the list, and runs while i < {{n}}.',
    'l1-start-one': 'The loop starts at i = 1. But lists count from 0, so players[0] is never read: the opener is skipped!',
    'l1-start-minus': 'The loop runs while i < players.length - 1. That condition stops one slot short…',
    'l1-start-reverse': 'The loop starts at the end, i = {{last}}, and counts down to 0.',
    'l1-read': 'i = {{i}}: players[{{i}}] is {{name}}. Nusrat calls the name out.',
    'l1-crash':
      'i = {{i}}: the condition says i <= length, but the last slot is players[{{last}}]. players[{{i}}] is undefined, and reading .name on it crashes the app! 💥',
    'l1-loop-end': 'i = {{i}}: i < {{n}} is false, so the loop stops. Everyone was called once.',
    'l1-loop-end-minus': 'i = {{i}}: the loop stops, one player early. {{name}} is still sitting padded up!',
    'l1-loop-end-reverse': 'i = -1: the loop stops. Everyone was called, from the last slot to the first.',
    'l1-sort-copy': 'Nusrat copies the list first ([...players]) and sorts the copy by strike rate. squad.players itself stays in batting order.',
    'l1-sort-inplace': 'players.sort() sorts the squad’s REAL list, in place. Look at the squad: the batting order itself just changed!',
    'l1-read-sorted': 'Next in the sorted list: {{name}}, strike rate {{sr}}. Nusrat calls the name out.',
    'l1-next-match':
      'Next Friday, the scoreboard reads the batting order from squad.players, and {{name}} walks out to open instead of {{opener}}. One client’s sort changed the list for everyone!',
    'l1-map': 'Squad now stores its players in a Map, keyed by jersey number: quicker to look up. Nobody told the client loops.',
    'l1-read-ar': '{{name}} is an all-rounder: called out.',
    'l1-skip': '{{name}}: {{role}}, not an all-rounder. The if in Nusrat’s loop skips this player.',
    'l1-map-end': 'values() has no more players, so the loop ends.',
    'l1-oldloop':
      'players.length on a Map is undefined, and 0 < undefined is false. The old loop runs zero times: nobody comes out for the super over!',
    'l1-filter-crash': 'A Map has no filter() method. TypeError: players.filter is not a function. 💥 The app crashes before anyone is called.',
    'l1-ok': 'Right lineup! Mirpur Tigers win · +{{coins}}. It worked, but only because Nusrat’s loop knows exactly how Squad stores its players.',
    'l1-fail-one':
      '😵 Rahim, the opener, was never called, and at the end the loop read past the last player and crashed. Lists count from 0: the first player is players[0], the last is players[length - 1].',
    'l1-fail-minus':
      '😵 Mitu was left sitting padded up. i < length - 1 stops one player early. Index math is easy to get wrong, and every client loop has to get it right again.',
    'l1-fail-inPlace':
      '😵 Today’s order was right, but players.sort() sorted the squad’s real list. Now every other client sees Tania as the opener. One client must never rearrange a list everyone shares.',
    'l1-fail-reverse':
      '😵 Looping backwards only reverses the batting order: Mitu, the bowler with a strike rate of 74, opened. “In form” means sorting a copy by strike rate.',
    'l1-fail-oldLoop':
      '😵 Nobody came out for the super over. The old index loop assumed squad.players was an array; on a Map it never ran. Squad changed inside, and a client loop broke outside.',
    'l1-fail-filter':
      '😵 Crash! filter() exists on arrays, not on Maps. Every client that used array methods on squad.players broke the day Squad changed how it stores players.',
    'level1-done':
      'Level complete! Three requests, three different hand-written loops, and each one depends on Squad’s list: its indexes, its order and its type.',

    // Level 2: iterators
    'idle2-1': 'Karim bhai: “{{req}}” Squad’s list is private now. Which iterator does Nusrat ask for?',
    'idle2-2': 'Karim bhai: “{{req}}” Pick the iterator. Nusrat’s loop stays exactly the same.',
    'idle2-3': 'Karim bhai: “{{req}}” Which iterator walks the squad in that order?',
    picked2: 'You picked {{choice}}. Press Play: Nusrat runs her usual loop with that iterator.',
    request: 'Karim bhai: “{{req}}” Nusrat doesn’t touch the list. She asks the squad for an iterator: {{call}}.',
    create: 'Squad makes a new {{cls}} over its private list and hands it out. Nusrat gets the iterator, never the list.',
    'sort-copy': 'StrikeRateIterator sorts its OWN copy by strike rate. The squad’s real batting order is not touched.',
    'loop-start': 'Nusrat’s loop is the same for every request: while (it.hasNext()) announce(it.next().name).',
    'has-next-yes': 'it.hasNext()? The iterator checks its cursor: yes, {{name}} is next. true.',
    'skip-ar': 'Inside hasNext(), AllRounderIterator skips {{name}} ({{role}}). The skipping lives in the iterator; Nusrat’s loop never sees it.',
    next: 'it.next() hands out {{name}} and moves the cursor on. Nusrat calls the name out.',
    'has-next-no': 'it.hasNext()? No players left: false. The loop ends.',
    'l2-ok': 'Right lineup! +{{coins}}. Nusrat’s loop didn’t change at all; only the iterator she asked for did.',
    'l2-fail-superOver-order':
      '😵 The whole team walked out for the super over! BattingOrderIterator hands out everyone. For all-rounders only, ask for the iterator that skips the rest: allRounders().',
    'l2-fail-superOver-sr':
      '😵 Everyone came out, sorted by strike rate. StrikeRateIterator changes the order, not who is included. The super over needs allRounders().',
    'l2-fail-final-sr':
      '😵 Tania opened the final instead of Rahim. StrikeRateIterator walks its own sorted copy; the final needs the squad’s real batting order: battingOrder().',
    'l2-fail-final-ar':
      '😵 Only two players batted in the final! AllRounderIterator skips everyone who isn’t an all-rounder. For the whole team, ask for battingOrder().',
    'l2-fail-form-order':
      '😵 Rahim opened as usual, but Karim bhai wanted the in-form players first. battingOrder() keeps the stored order; byStrikeRate() walks a sorted copy.',
    'l2-fail-form-ar':
      '😵 Only Tania and Rafiq came out. allRounders() filters by role; “in form” means everyone, highest strike rate first: byStrikeRate().',
    'level2-done':
      'Level complete! Three requests, one unchanged loop. How to walk the squad lived in the iterators, and the list never left Squad.',

    // Level 3: a new iterator
    'build-q1':
      'A leg-spinner is coming on, and Karim bhai wants the left-handers. There’s no iterator for that yet, so you’ll add one. First: what should the new code be?',
    'wrong-q1-clientIf':
      'That puts the filter back into the client: Nusrat’s loop gets an if, and every other client that wants left-handers copies it. The loop should stay the same for every request.',
    'wrong-q1-squadMethod':
      'That edits Squad and Team, old code every request already depends on. A new way to walk the squad should be a new iterator class, not a change to the collection.',
    'build-q2':
      'Right: implements PlayerIterator, so Nusrat’s loop can use it like any other iterator. But Squad’s list is private. How does LeftHandedIterator find the left-handers?',
    'wrong-q2-readList':
      'squad.players is private, and that’s the point: an iterator that reached into the list would break again the day Squad switches to a Map. Use what Squad already gives out: an iterator.',
    'wrong-q2-sortList':
      'That’s the level-1 bug again: rearranging the squad’s real list scrambles the batting order for everyone else. An iterator only walks; it never rearranges.',
    'build-ready':
      'Done: one new class. 0 lines changed in Squad, Team, the 3 old iterators or Nusrat’s loop. Press “Use LeftHandedIterator”.',
    'build-done': 'LeftHandedIterator is ready. Press Play: it wraps an old iterator and skips the right-handers inside hasNext().',
    'idle3-1': 'Karim bhai: “{{req}}” Nusrat wraps battingOrder() in the new iterator. Press Play.',
    'idle3-2': 'Karim bhai: “{{req}}” Same new class, but this time it wraps byStrikeRate(). Press Play.',
    'idle3-3': 'Karim bhai: “{{req}}” Squad has one more player; no iterator changes. Press Play.',
    'l3-create': 'Nusrat wraps an old iterator in the new one: new LeftHandedIterator(squad.{{factory}}()). Squad wasn’t changed at all.',
    'l3-loop': 'The same loop as always: while (it.hasNext()) announce(it.next().name). Nusrat has no idea anyone is being skipped.',
    'lh-skip': 'Inside hasNext(), LeftHandedIterator pulls {{name}} from the iterator it wraps: right-handed, so skipped.',
    'lh-keep': 'It pulls {{name}}: left-handed! It keeps this player in found, and hasNext() answers true.',
    'lh-next': 'it.next() hands {{name}} to Nusrat, who calls the name out.',
    'lh-no-more': 'The wrapped iterator has run out, so hasNext() answers false and the loop ends.',
    'l3-done-1': 'Right lineup! +{{coins}}. The left-handers came out in batting order, and Nusrat’s loop never saw a right-hander.',
    'l3-done-2':
      'Right lineup! +{{coins}}. The same LeftHandedIterator, wrapped around StrikeRateIterator this time: left-handers, best strike rate first. Iterators stack.',
    'l3-done-3': 'Right lineup! +{{coins}}. Babu joined the squad and was picked up automatically: an iterator walks whatever Squad holds.',
    'level3-done':
      'You finished the game! Squad keeps its list private, iterators walk it whichever way you need, and a new way to walk it is just a new iterator class.',
  },

  codeComments: {
    player: 'One player card: name, strike rate, role, batting hand',
    iterator: 'Iterator: how a client walks the squad, one player at a time',
    concreteIterator: 'ConcreteIterators: each knows one way to walk the list',
    cursor: 'the cursor: who comes next',
    handOut: 'hand out one player and move the cursor on',
    sortedCopy: 'sorts its own copy: the squad’s order stays as it is',
    skipInside: 'the skipping happens inside the iterator, not in the client',
    aggregate: 'Aggregate: the squad promises iterators, not its list',
    concreteAggregate: 'ConcreteAggregate: stores players its own way, makes the iterators',
    hidden: 'private: nobody outside knows how players are stored',
    client: 'Client: Nusrat, the scorer',
    pickOne: 'pick the iterator for the request…',
    sameLoop: '…the loop is always the same',
    withoutIntro: 'No pattern: Squad hands out its raw list',
    exposed: 'public: every client reaches in',
    orderLoop: 'Batting order: index math by hand',
    indexMath: 'start at 0, stop before the length: easy to get wrong',
    formLoop: 'In form: sort by strike rate, in another hand-written loop',
    copyFirst: 'copy first, or the real batting order gets scrambled',
    changed: 'Next month Squad stores players by jersey number…',
    breaksAll: '…and every loop that knew the old shape breaks',
    filterHere: 'the filter lives in the client, copied wherever it’s needed',
    withoutNext: 'Left-handers only? Yet another hand-written loop',
    withAdd: 'A new way to walk the squad = one new iterator class',
    sameInterface: 'the same iterator interface as all the others',
    wrapsAny: 'wraps any iterator: batting order, strike rate…',
    pull: 'ask the wrapped iterator for its next player',
    skipRight: 'keep left-handers; right-handers are skipped right here',
    othersSame: 'Squad, Team and the old iterators: not a line edited',
    withUse: 'Wrap an old iterator; the loop stays the same',
    wrapUse: 'left-handers, in batting order',
    withZero: 'Old code edited: 0 lines. Without the pattern: one more loop in every client',
  },

  compare: {
    without: {
      title: 'Every client loops over the raw list',
      points: [
        'Squad makes its list public, so every client writes its own loop over it.',
        'Each traversal (in order, by strike rate, all-rounders only) repeats the index math, sorting or filtering by hand.',
        'One wrong step skips a player, reads past the end, or sorts the shared list in place for everyone.',
        'Changing how Squad stores its players (an array to a Map) breaks every client loop at once.',
      ],
    },
    with: {
      title: 'Squad gives out iterators',
      points: [
        'Squad keeps its list private and offers iterators: battingOrder(), byStrikeRate(), allRounders().',
        'Every iterator has the same two methods, hasNext() and next(), so the client’s loop never changes.',
        'Sorting and skipping live inside the iterators; the squad’s real order is never touched.',
        'A new traversal (left-handers) is one new iterator class. It can wrap an old one, with 0 edits to Squad.',
      ],
    },
    benefit:
      'Iterator separates walking a collection from storing it. The collection can change its insides, new ways to walk it can be added as new classes, and every client keeps the same simple loop: while (it.hasNext()) use(it.next()).',
    whenToUse: [
      'Clients need to go through a collection’s elements without knowing (or depending on) how it is stored: an array, a Map, a tree, a database page.',
      'The same collection must be walked in several ways (in order, sorted, filtered), and you don’t want each client to code that again.',
      'You want one uniform loop for different collections or traversals. (Most languages build this in: for-of, foreach, Python generators, Rust’s Iterator.)',
    ],
  },
} satisfies PatternContent

export type IteratorContent = typeof en

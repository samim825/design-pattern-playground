import type { PatternContent } from '@/types/pattern'

export const en = {
  title: 'Prototype',
  tagline: 'Make new objects by cloning an existing one, instead of building each copy from scratch.',
  intent:
    'Create new objects by copying a ready-made prototype. The object copies itself through clone(), so the code that asks for a copy never needs to know its class or retype its fields.',

  scenario: {
    title: 'Exam week at a Mirpur school',
    paragraphs: [
      'It is exam week at a school in Mirpur. Nusrat has set the Class 8 Math paper: 90 minutes, 50 marks, four questions. So that students in neighbouring rows can\'t copy, she needs Set A, Set B and Set C: the same paper, with the questions in a different order.',
      'Mitu needs the same for her Class 8 English paper, and the head teacher Rahim checks every set against the master. One wrong mark or a missed question, and the sets are unfair.',
      "Next week Karim's Class 9 Science paper arrives. It has diagrams too, so it's a new kind of paper, and it still needs Sets A, B and C.",
    ],
    problem:
      'If every set is built from scratch with new ExamPaper(…), someone has to retype every field for every set. One slip ("60 minutes" instead of 90) makes the sets unfair, and the copying code must know every paper class and all of its fields.',
  },

  visual: {
    // Game HUD
    levelsLabel: 'Game levels',
    levelLabel: 'Level {{n}}',
    level1Title: 'Retype every set',
    level2Title: 'Clone the master',
    level3Title: 'A paper with diagrams',
    level1Goal: 'No pattern yet: each new set is typed again from scratch. Copy every field from the master paper exactly.',
    level2Goal: 'Now every master paper can clone() itself. Pick the right master, and the copy comes out exact.',
    level3Goal: "Karim's Science paper has diagrams. Make it cloneable without editing makeSet() or ExamPaper.",
    locked: 'Locked',
    earned: 'Earned',
    restart: 'Restart game',
    turnOf: 'Request {{n}}/{{total}}',

    // Nodes
    clientRole: 'Client',
    deskTitle: "Exam office",
    needsSet: 'needs Set {{set}}',
    masterLabel: 'Master paper (Set A)',
    retypeLabel: 'Retype Set {{set}} field by field',
    pickMaster: 'Pick the master to clone',
    noRetyping: 'makeSet() never retypes a field',
    noPatternRole: 'No pattern',
    fieldsLabel: 'Fields you retype for every set',
    concretePrototypeRole: 'ConcretePrototype',
    prototypeTag: 'Prototype',
    implementsLabel: 'implements',
    noMaster: 'No master picked yet…',
    cloneRole: 'Clone',
    productRole: 'New set',
    setTitle: 'Set {{set}}',
    emptyPaper: 'Nothing printed yet',
    approved: 'Approved',
    rejected: 'Rejected',
    buildSlot: 'Build it',
    newTag: 'New',
    cloneSteps: 'What clone() does',
    stepHeader: 'Copy the header',
    stepQuestions: 'Copy questions (new list)',
    stepDiagrams: 'Copy diagrams',
    stepReturn: 'Return the copy',
    diagramsLabel: 'Diagrams',

    // Fields and formats
    fieldSubject: 'Subject',
    fieldTime: 'Time',
    fieldMarks: 'Total marks',
    fieldQuestions: 'Questions',
    minutesFmt: '{{n}} min',
    marksFmt: '{{n}} marks',
    questionsFmt: '{{n}} questions',

    // Papers
    math: 'Class 8 Math',
    mathTypo: 'Class 8 Maths',
    english: 'Class 8 English',
    englishTypo: 'Class 8 Engish',
    science: 'Class 9 Science',
    mq1: 'Solve 2x + 3 = 11',
    mq2: 'Area of a 6 cm square',
    mq3: 'Simplify 3/4 + 1/8',
    mq4: '15% of ৳800',
    eq1: 'Paragraph: Pohela Boishakh',
    eq2: 'Translate into English',
    eq3: 'Fill in the blanks',
    eq4: 'Letter to a friend',
    sq1: 'Label a plant cell',
    sq2: 'Draw the water cycle',
    sq3: 'What is photosynthesis?',
    sq4: 'Name three metals',
    dCell: 'Plant cell',
    dWater: 'Water cycle',

    // Builder (level 3)
    builderTitle: 'Make DiagramPaper cloneable',
    builderStep1: 'Step 1 · Who copies it?',
    builderStep2: 'Step 2 · And makeSet()?',
    q1: 'How should a DiagramPaper get copied?',
    q1OwnClone: 'It overrides clone()',
    q1Instanceof: 'makeSet() checks the class',
    q1Reuse: 'Reuse ExamPaper.clone()',
    q2: 'What changes in makeSet()?',
    q2Nothing: 'Nothing',
    q2Check: 'Add an instanceof check',
    q2CopyDiagrams: 'Add copyDiagrams()',
    useBuilder: 'Use DiagramPaper',
    zeroEdits: 'makeSet() & ExamPaper edited: 0 lines',

    // Turn
    printButton: 'Print',
    nextRequest: 'Next request',
    finishLevel: 'Finish level',
    tryAgain: 'Try again',

    // Level end
    levelDone: 'Level {{n}} complete!',
    nextLevel: 'Next level',
    replayLevel: 'Play this level again',
    playAgain: 'Play again from level 1',
    l1Teaser:
      'Then the head teacher adds: “From now on, Sets D and E too, for every subject.” That is every field retyped again and again, with a new chance for a mistake each time. There must be a better way…',
    l2Summary:
      'You never retyped a field. Each master cloned itself, the copy got its own label and shuffled questions, and the master stayed untouched.',
    recapTitle: 'What you learned',
    recap1: 'Without the pattern, every copy is rebuilt by hand, field by field, so copies can drift from the original.',
    recap2: 'With Prototype, the object copies itself through clone(), so the copy is always exact.',
    recap3: 'A new kind of object (DiagramPaper) brings its own clone(). The code asking for copies never changes.',

    // Names
    nusrat: 'Nusrat',
    mitu: 'Mitu',
    karim: 'Karim',

    whatsHappening: "What's happening",
    feeNote: 'The school and its printing fees are made up for this example.',
  },

  steps: {
    // Level 1: no pattern
    tutorial:
      "Nusrat needs Set B of the Class 8 Math paper. We've copied the master's details for you this time. Press Print and watch every field get checked.",
    idle1: '{{name}} needs Set {{set}} of {{subject}}. Copy every field from the master exactly, then press Print.',
    filled1: 'All four fields filled. Press Print; the head teacher will compare it with the master.',
    'l1-new': 'No pattern: Set {{set}} is built from scratch with new ExamPaper(…), so every field has to be typed again.',
    'l1-field-ok': '{{field}}: “{{value}}”, the same as the master.',
    'l1-field-bad': '{{field}}: “{{value}}”, but the master says “{{expected}}”. Retyping is where mistakes creep in.',
    'l1-ok': "Approved! +{{fee}}. But you retyped four fields for one set, and you'll do it again for every set and subject.",
    'l1-fail': '❌ Rejected by the head teacher: the {{field}} says “{{value}}”, but Set A says “{{expected}}”. That set would be unfair.',
    'level1-done':
      'Level complete! Look at the highlighted line in the code: every new set means retyping every field, and one slip makes the sets unfair.',

    // Level 2: Prototype
    idle2: '{{name}} needs Set {{set}} of {{subject}}. Pick the right master paper, then press Print.',
    'wrong-master': "That's the {{picked}} master, but {{name}} needs {{subject}}. Pick the matching master.",
    ready: 'The {{subject}} master is picked. Press Print and watch it clone itself.',
    'make-set': "The client calls makeSet(master, '{{set}}'). It never types a field; it only knows the paper can clone itself.",
    clone: 'makeSet() calls master.clone(). The paper copies itself, because it knows its own fields best.',
    'copy-header': 'clone() copies the header: {{subject}}, {{minutes}}, {{marks}}. Exactly the master\'s, with no typing.',
    'copy-questions': 'It copies the questions into a new list, so shuffling the copy can never scramble the master.',
    cloned: 'clone() returns the new paper: an exact twin of the master.',
    label: 'The copy gets its own label: Set {{set}}.',
    shuffle: 'Now its questions are shuffled, so neighbouring rows get a different order.',
    done: 'Approved! +{{fee}}. A perfect copy in one call, and the master stayed untouched.',
    'level2-done': 'Level complete! You never retyped a field: each master cloned itself, and every copy was exact.',

    // Level 3: a new kind of paper
    'need-build': "Karim's Science master has diagrams: it's a new kind of paper, DiagramPaper. Tap “Build it” to make it cloneable.",
    'build-q1': 'First: how should a DiagramPaper get copied?',
    'wrong-instanceof': 'Then makeSet() would have to know every paper class, and change for each new one.',
    'wrong-reuse': "ExamPaper.clone() doesn't know about diagrams: every copy would come out with no diagrams at all!",
    'build-q2': 'DiagramPaper.clone() copies its diagrams too. Now: what changes in makeSet()?',
    'wrong-check': 'No check needed: makeSet() just calls clone(), and each paper knows how to copy itself.',
    'wrong-copy-diagrams': "Copying diagrams is DiagramPaper's own job, inside its clone(). makeSet() shouldn't even know they exist.",
    'build-ready': 'Done: DiagramPaper knows how to clone itself, and nothing else changed. Press “Use DiagramPaper”.',
    'build-done': 'DiagramPaper is ready, and makeSet() was not touched. Press Print!',
    'd-make-set': "The client calls makeSet(scienceMaster, '{{set}}'): the very same function as before.",
    'd-clone': "master.clone() now runs DiagramPaper's own clone(). makeSet() doesn't know, or care.",
    'd-copy-diagrams': 'It also copies the diagrams ({{diagrams}}). Only DiagramPaper knows they exist.',
    'd-done': 'Approved! +{{fee}}, diagrams included. makeSet() and ExamPaper never changed.',
    'level3-done':
      'You finished the game! Prototype lets an object copy itself, so new copies are exact and the copying code never depends on its class.',
  },

  codeComments: {
    prototype: 'Prototype: anything that can copy itself',
    concretePrototype: 'Concrete prototype: an exam paper',
    copyHeader: 'same header, no retyping',
    newList: 'a new list, so the master stays safe',
    client: 'Client: makes a set from any prototype',
    noRetyping: 'no fields typed here!',
    usage: 'Client code',
    withoutIntro: 'The master paper',
    withoutRetype: 'Set B: every field typed again by hand',
    withoutTodo: 'Sets C, D, E… and every subject: retype it all again',
    withAdd: 'New kind of paper: it brings its own clone()',
    copyDiagrams: 'only DiagramPaper knows about diagrams',
    withSame: 'makeSet() is reused as it is',
  },

  compare: {
    without: {
      title: 'Every set rebuilt with new ExamPaper(…)',
      points: [
        'Every field is retyped for every set and every subject.',
        'One slip (wrong time, wrong marks, a missed question) makes the sets unfair.',
        'The copying code must know the paper\'s class and all of its fields.',
        'A new kind of paper (with diagrams) means more copying code everywhere.',
      ],
    },
    with: {
      title: 'Each paper clones itself',
      points: [
        'One call, master.clone(), and the copy is exact.',
        'The copy gets new lists, so changing it never touches the master.',
        'makeSet() only knows the Prototype interface, not the paper classes.',
        'A new kind of paper brings its own clone(); nothing else changes.',
      ],
    },
    benefit:
      'Prototype moves "how to copy me" into the object itself. The object knows all its fields, including private ones, so the copy is always complete, and the client can copy objects it knows nothing about.',
    whenToUse: [
      'Making a new object from scratch is slow or fiddly, but you already have a good one to copy.',
      'You need many similar objects that differ only a little (sets of a paper, game enemies, document templates).',
      'Your code must copy objects without depending on their concrete classes.',
    ],
  },
} satisfies PatternContent

export type PrototypeContent = typeof en

import type { PatternContent } from '@/types/pattern'

export const en = {
  title: 'Memento',
  tagline: 'Save points for an object: it packs its own state into a sealed snapshot, and Undo hands the snapshot back.',
  intent:
    'Capture an object’s internal state in a snapshot (the memento) so it can be restored later, without exposing that state to anyone else. Only the object that made the snapshot can open it; the history that stores it just keeps it safe.',

  scenario: {
    title: 'Tania’s pitha post before Poush mela',
    paragraphs: [
      'Poush is here, and Tania sells home-made pitha from her flat in Mirpur: bhapa pitha at ৳30 a piece, patishapta at ৳40, chitoi with shutki bhorta at ৳20. Every evening she writes a post on Golpo, a social app, for her page “Tania’s Pitha Ghor”. The post is for Friends only, because it gives her home as the pickup address.',
      'Writing a post is full of little accidents. Her thumb slips and ৳30 becomes ৳300. Her sister Mitu “tidies up” the post and taps Public by mistake. So the app has Save and Undo buttons. The question is how Undo remembers the old post.',
      'If the screen code copies the editor’s fields by hand, it must know every field, and the day it forgets one (the audience), Undo brings back the text but leaves the post Public. Memento lets the editor pack its own state into a sealed snapshot, while a History stack keeps the snapshots without ever looking inside.',
    ],
    problem:
      'To undo, someone has to remember the old state. If the UI copies the editor’s fields itself, those fields must be public, the UI must know every one of them, a missed field or a shared reference brings back the wrong post, and every new field (a photo) means editing the undo code again.',
  },

  visual: {
    // Game HUD
    levelsLabel: 'Game levels',
    levelLabel: 'Level {{n}}',
    level1Title: 'Copy it by hand',
    level2Title: 'Save points',
    level3Title: 'A new field: the photo',
    level1Goal:
      'No pattern yet: PostEditor’s fields are public, and the PostScreen code backs them up by hand before each edit. Choose how it backs up, then watch Undo and the post that goes out.',
    level2Goal:
      'Now PostEditor saves itself into a sealed PostSnapshot, and History keeps the snapshots. Choose when to save, who makes the snapshot, or how to undo, and watch the right post go out.',
    level3Goal:
      'Tania wants a photo in her post, and Undo must bring it back too. Add the photo field without touching History or PostScreen, then try it on three posts.',
    locked: 'Locked',
    earned: 'Pitha orders',
    restart: 'Restart game',
    turnOf: 'Post {{n}}/{{total}}',

    // The story
    appName: 'Golpo',
    shopName: 'Tania’s Pitha Ghor',
    clientWho: 'Tania, on the Golpo app',
    btnSave: 'Save',
    btnUndo: 'Undo',
    btnPost: 'Post',
    txtBhapa: 'Hot bhapa pitha with date-palm gur, fresh every morning!',
    txtPatishapta: 'Patishapta with kheer filling. Order by Friday!',
    txtChitoi: 'Chitoi pitha with shutki bhorta, a Poush mela special',
    txtScribble: 'PITHAAA!!! 🔥🔥 sale sale sale',
    perPiece: '{{price}} / piece',
    audPublic: 'Public',
    audFriends: 'Friends',
    pickup: 'Pickup: Tania’s flat, Mirpur 10',
    photoLabel: 'photo',
    noPhoto: 'no photo',
    photoBhapa: 'bhapa pitha',
    photoPatishapta: 'patishapta',
    photoBlurry: 'blurry, dark',
    photoChitoi: 'chitoi',

    // Roles and nodes
    clientRole: 'Client',
    l1EditorRole: 'No pattern',
    originatorRole: 'Originator',
    caretakerRole: 'Caretaker',
    mementoRole: 'Memento',
    noPatternRole: 'No pattern',
    publicFields: 'public fields: anyone can read and change them',
    privateFields: 'private fields: only PostEditor touches them',
    backupsNote: 'PostScreen’s own copies of the editor’s fields',
    storeEmpty: 'empty',
    notCopied: 'not copied!',
    sameObject: 'the same object as the editor!',
    oneVar: 'one variable',
    historyNote: 'Keeps snapshots, never opens them.',
    historyEmpty: 'empty: nothing to undo',
    snapshotLabel: 'Snapshot',
    sealed: 'sealed',
    liveCard: 'not a snapshot: the live editor!',
    mementoNote: 'Immutable. Only PostEditor can read what is inside.',
    newTag: 'new',
    notBuilt: 'not added yet',
    packing: 'packing a snapshot…',
    errPrivate: 'editor.audience is private',
    errSealed: 'a snapshot is sealed: no .price',
    posted: 'Posted on Golpo',
    draft: 'Draft',
    ordersLine: '{{n}} orders · {{coins}}',

    // Reactions
    reactPrice: '😂 {{price}} for ONE pitha?!',
    reactPrice2: '🤔 typo, apa?',
    reactLeak: '🕵️ A stranger: “Mirpur 10, which building?”',
    reactLeak2: '😟 Tania’s home address is public',
    reactText: '🤨 “sale sale sale”?',
    reactOk: '😋 Booking 10 pieces!',

    // Situations
    situationLabel: 'Situation',
    'sit1-1':
      'Tania’s bhapa pitha post: ৳30 a piece, Friends only. She is about to change the price, so PostScreen must back up the post first.',
    'sit1-2':
      'Her sister Mitu borrows the phone to “tidy up” the patishapta post. Nobody knows which fields she will touch.',
    'sit1-3':
      'Two edits in a row on the chitoi post: first the price, then the audience. Tania wants to undo both.',
    'sit2-1': 'Bhapa pitha at ৳30, Friends only. Tania is about to retype the price.',
    'sit2-2': 'Mitu is about to “tidy up” the patishapta post again. This time PostEditor has private fields.',
    'sit2-3':
      'Tania saved before each of her two edits. Now the chitoi post says ৳200 and Public, and History holds two snapshots. She wants the original back.',
    'sit3-1': 'The bhapa pitha post now has a photo. Mitu deletes it by accident.',
    'sit3-2': 'On the patishapta post, Tania swaps in a blurry photo and types ৳400 by mistake.',
    'sit3-3':
      'Two saves ago, the chitoi post had a photo and ৳20. Since then the photo is gone and the price says ৳200. Undo twice.',

    // Questions and choices
    yourChoice: 'Your choice',
    'ask1-1': 'How does PostScreen keep a backup before the edit?',
    'ask1-2': 'Which fields does onSave() copy?',
    'ask1-3': 'Where does PostScreen keep its backups?',
    'ask2-1': 'When does the app call history.push(editor.save())?',
    'ask2-2': 'Who makes the snapshot?',
    'ask2-3': 'What does the Undo button do?',
    optCopyAll: 'Copy all 3 fields into a new object',
    optRef: 'backup = editor (keep the same object)',
    optTextPrice: 'Copy text and price (the audience rarely changes)',
    optOneVar: 'One backup variable, overwritten on every save',
    optList: 'A list: push a copy on every save, pop it on undo',
    optBefore: 'Before the edit',
    optAfter: 'After the edit',
    optNever: 'Never: Undo will work it out',
    optEditorSaves: 'editor.save(): the editor packs its own fields',
    optUiBuilds: 'PostScreen reads the fields and builds the PostSnapshot',
    optPushEditor: 'history.push(editor): store the editor itself',
    optUndoOnce: 'Undo once',
    optUndoTwice: 'Undo twice: pop and restore, two times',
    optPeek: 'Open the top snapshot and fix the price inside',

    // Result
    resultOk: '{{n}} orders: +{{coins}}',
    resultPrice: 'The wrong price went out: no orders!',
    resultLeak: 'Posted to everyone: the home address leaked!',
    resultText: 'Mitu’s scribble went out: no orders!',

    // Builder (level 3)
    builderTitle: 'Add a photo to the post',
    builderStep1: 'Step 1 · Who saves the photo?',
    builderStep2: 'Step 2 · Does History change?',
    q1: 'Tania wants a photo in the post, and Undo must bring it back too. Which classes change?',
    q1Editor: 'PostEditor and its PostSnapshot: the editor saves its own new field',
    q1Ui: 'PostScreen: copy editor.photo into a backup, like in level 1',
    q1All: 'All of them: PostEditor, PostSnapshot, History and PostScreen',
    q2: 'History keeps the snapshots. Does it need a change to keep photos too?',
    q2List: 'Yes: add a photos list next to the snapshots',
    q2No: 'No: it keeps sealed snapshots, whatever is inside them',
    q2Check: 'Yes: it must check that every snapshot has a photo',
    editsLine: 'PostEditor + PostSnapshot: +1 field each',
    zeroEdits: 'History: 0 lines · PostScreen: 0 lines',
    flyIn: 'Try it on a post',

    // Turn
    playButton: 'Play',
    nextTurn: 'Next post',
    finishLevel: 'Finish level',
    tryAgain: 'Try again',

    // Level end
    levelDone: 'Level {{n}} complete!',
    nextLevel: 'Next level',
    replayLevel: 'Play this level again',
    playAgain: 'Play again from level 1',
    l1Teaser:
      'Undo worked, but only because PostScreen knew every field of the editor, and those fields had to be public. One missed field leaked the address; one shared reference kept the typo. Next, Tania wants a photo in her post. Must PostScreen’s copy code change again?',
    l2Summary:
      'PostScreen never touched a field. PostEditor packed its own state into a sealed PostSnapshot, History stacked the snapshots without opening them, and Undo just handed the right one back.',
    recapTitle: 'What you learned',
    recap1:
      'Without Memento, the UI copies the editor’s fields by hand: the fields must be public, a missed field or a shared reference brings back the wrong post, and every new field means editing the undo code.',
    recap2:
      'Memento: the Originator (PostEditor) packs its own state into an immutable snapshot with save() and unpacks it with restore(s). The Caretaker (History) only pushes and pops snapshots, never opens them.',
    recap3:
      'A new field (the photo) changed only PostEditor and its PostSnapshot. History and PostScreen: 0 lines edited, and Undo brought the photo back.',

    whatsHappening: "What's happening",
    note: 'Tania, Mitu, the Golpo app, the prices and the orders are made up for this example.',
  },

  steps: {
    // Level 1: no pattern
    tutorial:
      'No pattern yet: PostScreen must back up the post itself before Tania edits it. The right answer is already picked: copy all 3 fields into a new object. Press Play and watch.',
    'idle1-1': 'Tania is about to change the price. How does PostScreen keep a backup?',
    'idle1-2': 'Mitu is about to edit the post. Which fields does onSave() copy?',
    'idle1-3': 'Two edits are coming, and Tania will want to undo both. Where does PostScreen keep its backups?',
    picked1: 'You picked: {{choice}}. Press Play and watch Undo, and the post that goes out.',
    'l1-click-save': 'Tania taps Save. PostScreen.onSave() runs: the screen code itself must remember the post.',
    'l1-copy-all':
      'onSave() reads editor.text, editor.price and editor.audience, and copies them into a new object in backups. It works, but only because those fields are public, and the screen knows every one of them.',
    'l1-copy-some':
      'onSave() copies editor.text and editor.price into backups. The audience is not copied: the screen code simply forgot it.',
    'l1-copy-ref':
      'backup = editor: no copy is made. The “backup” is just a second name for the same editor object.',
    'l1-copy-slot': 'onSave() copies all 3 fields into its one backup variable: {{price}}, {{aud}}.',
    'l1-copy-push2': 'onSave() pushes a second copy onto the list: {{price}}, {{aud}}. The first copy is still underneath.',
    'l1-copy-over':
      'onSave() copies the post into the same backup variable again: {{price}}, {{aud}}. The first copy, with the original price, is overwritten and gone.',
    'l1-edit-price': 'Tania retypes the price, and her thumb slips: {{price}} instead of ৳30.',
    'l1-edit-ref': 'Her thumb slips: {{price}}. And look: the backup says {{price}} too. It is the same object, so it changed along with the editor.',
    'l1-edit-mitu': 'Mitu rewrites the text in capitals and, by mistake, taps Public. The pickup address is now headed to strangers.',
    'l1-edit-mitu-ref': 'Mitu rewrites the text and taps Public. The “backup” changes too: it is the same object as the editor.',
    'l1-edit-price3': 'First edit: the price becomes {{price}}. Oops, one zero too many.',
    'l1-edit-aud': 'Second edit: the audience flips to Public.',
    'l1-click-undo': 'Tania taps Undo. PostScreen.onUndo() runs.',
    'l1-pop': 'onUndo() pops the last copy from backups.',
    'l1-pop-slot': 'onUndo() reads its one backup variable. It still holds the copy from the last save: {{price}}, {{aud}}.',
    'l1-undo-all': 'onUndo() copies every field back into the editor, one by one: {{price}}, {{aud}}.',
    'l1-undo-some':
      'onUndo() copies the text and the price back. There is no audience in the copy, so the post stays Public.',
    'l1-undo-ref': 'onUndo() copies the “backup” into the editor: the same object onto itself. Nothing changes; the post still says {{price}}.',
    publish: 'Tania taps Post: the post goes out at {{price}} a piece, to {{aud}}.',
    'react-price': 'The comments roll in: “{{price}} for ONE pitha?!” Nobody orders.',
    'react-leak': 'The post is Public, with Tania’s home address in it. Strangers start asking which building.',
    'react-text': 'The post goes out as Mitu’s scribble. People are confused, and nobody orders.',
    'l1-ok-1':
      '{{n}} orders: +{{coins}}! Undo brought back ৳30 because the backup was a real copy. But PostScreen had to read every public field itself.',
    'l1-ok-2':
      '{{n}} orders: +{{coins}}! All 3 fields came back, Friends only. PostScreen had to know every field of the editor, and not forget one.',
    'l1-ok-3':
      '{{n}} orders: +{{coins}}! With a list of copies, two Undos walked back two edits. You just hand-built a history stack, still copying every field yourself.',
    'l1-fail-ref':
      '😵 backup = editor is not a backup: it is the same object, so the edit changed both. A save point must be a separate copy of the state.',
    'l1-fail-textPrice':
      '😵 The audience was never copied, so Undo couldn’t put it back, and the address went Public. When the UI copies fields by hand, it must know, and remember, every single one.',
    'l1-fail-oneVar':
      '😵 One variable holds one save point. The second save overwrote the original ৳20, so two Undos could only reach ৳200. Undoing many edits needs a stack of save points.',
    'level1-done':
      'Level complete! Undo worked, but the screen code had to reach into the editor’s public fields and copy every one of them by hand.',

    // Level 2: Memento
    'idle2-1': 'Tania is about to retype the price. When does the app save?',
    'idle2-2': 'Mitu is about to edit. PostEditor’s fields are private now. Who makes the snapshot?',
    'idle2-3': 'History holds two snapshots, and the post is two edits away from the original. What does Undo do?',
    picked2: 'You picked: {{choice}}. Press Play and watch the snapshots.',
    'click-save': 'Tania taps Save. The app calls history.push(editor.save()): it asks the editor for a snapshot.',
    save: 'editor.save(): PostEditor packs its own private fields into a new PostSnapshot: {{price}}, {{aud}}. Nobody else had to read them.',
    'save-photo':
      'editor.save(): PostEditor packs its fields, now including the photo, into a PostSnapshot. It knows its own fields; nobody else has to.',
    'save-after': 'editor.save() packs the post as it is now, typo included: {{price}}, {{aud}}.',
    push: 'history.push(s): the sealed snapshot goes on top of the stack. History can’t read it, and doesn’t need to.',
    'edit-price': 'Tania retypes the price, and her thumb slips: {{price}}.',
    'edit-mitu': 'Mitu rewrites the text in capitals and taps Public by mistake.',
    'click-undo': 'Tania taps Undo. The app calls history.pop() and hands the snapshot back to the editor.',
    pop: 'history.pop(): the top snapshot comes off the stack, still sealed.',
    empty: 'history.pop() returns nothing: History is empty, so there is nothing to undo.',
    restore: 'editor.restore(s): only PostEditor can open its snapshot, and it puts back every field itself: {{price}}, {{aud}}.',
    'restore-photo': 'editor.restore(s): PostEditor opens the snapshot and puts back every field, the photo too: {{photo}}, {{price}}.',
    'restore-typo': 'editor.restore(s) brings back exactly what was saved: {{price}}. The snapshot was taken after the typo.',
    'ui-builds':
      'PostScreen tries to build the snapshot itself: new PostSnapshot(editor.text, editor.price, editor.audience).',
    'err-private':
      '🔒 Compile error: editor.audience is private. The screen can’t read the editor’s fields, so no snapshot is saved.',
    'push-editor': 'The app calls history.push(editor): no snapshot, just the editor object itself.',
    'push-live': 'History now holds a live link to the editor, not a sealed copy of its state.',
    'edit-live': 'Mitu rewrites the text and taps Public, and the “save point” in History changes with it. It is the same object.',
    'restore-live': 'editor.restore() from itself: the post already looks like this, so nothing changes.',
    peek: 'The app tries to open the top snapshot and set its price to ৳20 by hand.',
    'err-sealed':
      '🔒 A snapshot is sealed: History and PostScreen only see a Snapshot, with no price to read or change. The post stays as it is.',
    'l2-ok-1':
      '{{n}} orders: +{{coins}}! Saved before the risky edit, so Undo had the good ৳30 version to hand back.',
    'l2-ok-2':
      '{{n}} orders: +{{coins}}! PostEditor saved its own private fields. The screen never needed to know what was inside.',
    'l2-ok-3':
      '{{n}} orders: +{{coins}}! Two pops, two restores: History handed back the snapshots newest first, all the way to ৳20, Friends only.',
    'l2-fail-after':
      '😵 The save point was taken after the typo, so it remembers ৳300. Save before the risky change, then Undo can go back to it.',
    'l2-fail-never':
      '😵 Undo has nothing to go back to. Memento only works if someone saves first: history.push(editor.save()) before the edit.',
    'l2-fail-uiBuilds':
      '😵 The fields are private, and that is the point: only the Originator can see its own state. Ask it: editor.save().',
    'l2-fail-pushEditor':
      '😵 History kept the live editor, so every edit changed the “save point” too. A memento must be a frozen copy of the state, made by editor.save().',
    'l2-fail-undoOnce':
      '😵 One Undo only went back one save point: Friends again, but still ৳200. Two edits need two Undos.',
    'l2-fail-peek':
      '😵 Nobody but PostEditor may open a snapshot, so the price couldn’t be fixed from outside. Undo hands the snapshot to editor.restore(), twice.',
    'level2-done':
      'Level complete! PostEditor saved and restored itself, and History stacked the sealed snapshots. PostScreen never touched a field.',

    // Level 3: a new field
    'build-q1':
      'Tania wants a photo of her pitha in the post, and Undo must bring it back too. First: which classes change?',
    'wrong-q1-ui':
      'That is level 1 again: PostScreen would have to read editor.photo, so the photo would have to be public. The editor saves its own fields.',
    'wrong-q1-all':
      'History and PostScreen never see what is inside a snapshot, so they don’t care about a new field. Only the Originator and its Memento change.',
    'build-q2':
      'Right: PostEditor gets a private photo field, and PostSnapshot gets one more field to hold it. Now: does History need to change?',
    'wrong-q2-list':
      'History never opens a snapshot. The photo travels inside the snapshot, so the same stack of snapshots keeps it.',
    'wrong-q2-check':
      'Then History would have to read inside the snapshots, and it can’t. What is inside is only PostEditor’s business.',
    'build-ready':
      'Done: PostEditor and PostSnapshot got one field each. History: 0 lines, PostScreen: 0 lines. Press “Try it on a post”.',
    'build-done': 'The photo field is in. Press Play: Save and Undo call exactly the same methods as before.',
    'idle3-1': 'The bhapa pitha post has a photo, and Mitu is about to delete it. Press Play.',
    'idle3-2': 'Tania is about to swap the photo and mistype the price. Press Play.',
    'idle3-3': 'History holds two snapshots; the oldest has the photo and ৳20. Press Play.',
    'w-edit-photo': 'Mitu taps the bin icon: editor.setPhoto(null). The photo is gone from the post.',
    'w-edit-photo-price': 'Tania swaps in a blurry photo and types {{price}}.',
    'l3-done-1': '{{n}} orders: +{{coins}}! The photo came back with Undo, and History didn’t change a line to keep it.',
    'l3-done-2': '{{n}} orders: +{{coins}}! The photo and the price came back together, from one sealed snapshot.',
    'l3-done-3':
      '{{n}} orders: +{{coins}}! Two Undos, and the photo and ৳20 are back. The same History, the same Undo button.',
    'level3-done':
      'You finished the game! The editor saves and restores its own state, History only keeps sealed snapshots, and a new field touches nothing else.',
  },

  codeComments: {
    memento: 'Memento: a sealed snapshot of the post',
    opaque: 'all History sees: a snapshot, no fields',
    onlyEditor: 'only PostEditor reads what is inside',
    originator: 'Originator: the editor saves and restores itself',
    privateFields: 'private: nobody else reads or copies them',
    packsItself: 'it packs its own state',
    onlyEditorOpens: 'only the editor opens its snapshot',
    caretaker: 'Caretaker: keeps the snapshots, never opens them',
    neverLooks: 'a stack of sealed snapshots',
    lastFirst: 'the newest save point comes off first',
    client: 'Client: the Save and Undo buttons',
    saveBeforeRisk: 'save BEFORE the risky edit',
    oops: 'oops: ৳300 instead of ৳30',
    undoButton: 'Undo: take the last snapshot…',
    nothingToUndo: '…and give it back to the editor',
    withoutIntro: 'No pattern: the screen copies the editor’s fields by hand',
    publicFields: 'public, so the screen can copy them',
    uiCode: 'PostScreen does the undo work itself',
    ownStack: 'its own list of copies',
    knowsEveryField: 'it must know every field of the editor',
    copyEach: 'a new object, every field, every time',
    copyBack: 'and copy them all back, one by one',
    easyToMiss: 'forget this line and the post stays Public',
    withoutNext: 'A photo field? Edit onSave() and onUndo() again',
    withAdd: 'A new field: only the editor and its snapshot change',
    newField: 'the snapshot holds the photo too',
    photoPrivate: 'a new private field',
    asBefore: 'text, price and audience as before',
    savesPhoto: 'save() packs the photo along',
    othersSame: 'History never opens a snapshot: not a line edited',
    historySame: 'the same push() and pop()',
    clientSame: 'PostScreen: the same Save and Undo calls',
    oopsPhoto: 'oops: the photo is deleted',
    sameUndo: 'the same Undo brings it back',
    withZero: 'History and PostScreen edited: 0 lines',
  },

  compare: {
    without: {
      title: 'The screen copies every field by hand',
      points: [
        'PostEditor’s fields must be public, so any code can read and change them.',
        'PostScreen must know every field and copy each one, both ways. Miss the audience once and the post goes Public.',
        'Keeping a reference instead of a copy (backup = editor) silently turns the backup into the live object.',
        'A new field (a photo) means editing onSave() and onUndo() again, in every screen that has an Undo.',
      ],
    },
    with: {
      title: 'The editor saves itself; History keeps sealed snapshots',
      points: [
        'PostEditor keeps its fields private and packs them into a PostSnapshot with save().',
        'The snapshot is immutable and opaque: only PostEditor can open it, in restore(s).',
        'History is a plain stack of snapshots: push() before a risky edit, pop() on Undo, newest first.',
        'A new field touches only PostEditor and PostSnapshot; History and the Undo button stay exactly the same.',
      ],
    },
    benefit:
      'Memento gives you undo, drafts and save points without breaking encapsulation: the object that owns the state is the only one that knows how to save and restore it, so the rest of the app can keep and hand back snapshots without depending on what is inside.',
    whenToUse: [
      'You need undo / redo, save points, drafts or a “cancel changes” button, and the object’s fields should stay private.',
      'Copying an object’s state from outside would mean exposing its fields, or knowing all of them in the caller.',
      'The state is small enough to copy. (For big objects, store only what changed, or limit how many snapshots History keeps.)',
    ],
  },
} satisfies PatternContent

export type MementoContent = typeof en

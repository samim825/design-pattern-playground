import type { PatternContent } from '@/types/pattern'

export const en = {
  title: 'Interpreter',
  tagline: 'Write each discount rule as a little sentence of blocks. The app reads the sentence; nobody rewrites checkout() for every new rule.',
  intent:
    'Give a small language a class for each grammar rule, build every sentence as a tree of those objects, and evaluate it by calling interpret() on the root, which asks its children in turn.',

  scenario: {
    title: 'Mitu’s Eid discount rules at a saree shop in New Market',
    paragraphs: [
      'Eid is a week away and Mitu’s Saree Kuthi in New Market is packed. Every morning Mitu apa writes the day’s offer on the board by the counter: “10% off any saree over ৳3,000”. At the billing counter, Sumon rings up each customer’s cart in the billing app.',
      'The trouble: the billing app can’t read the board. Every rule lives as an if inside checkout(). Each time Mitu apa changes the board (“15% off anything over ৳5,000”, “5% off panjabi over ৳2,000”), a developer edits checkout(), redeploys the app and closes the counter for ten minutes. Put an else if in the wrong place and Nusrat gets a double discount, or Rahim gets less than the board promised.',
      'And for the last days before Eid, Mitu apa wants rules with OR in them: “10% off any saree, OR any order over ৳5,000”…',
    ],
    problem:
      'The rules are hard-coded as if/else branches in checkout(). Every new rule means editing the same function and redeploying it, the order of the branches silently decides who gets which discount, and combining conditions (AND, OR) means rewriting the conditions by hand.',
  },

  visual: {
    // Game HUD
    levelsLabel: 'Game levels',
    levelLabel: 'Level {{n}}',
    level1Title: 'Rules hard-coded in checkout()',
    level2Title: 'Rules built from blocks',
    level3Title: 'A new block: Or',
    level1Goal:
      'No pattern yet: every rule on Mitu apa’s board becomes an if inside checkout(). For each new rule, choose how to change the code, then watch the customers pay.',
    level2Goal:
      'Now a rule is a tree of objects: TotalAbove, CategoryIs and And, all with interpret(cart). Pick the blocks that say exactly what the board says. checkout() never changes.',
    level3Goal: 'Mitu apa’s Eid rules need OR. Build an Or block without editing And, TotalAbove, CategoryIs or checkout(), then use it in nested rules.',
    locked: 'Locked',
    earned: 'Earned',
    restart: 'Restart game',
    turnOf: 'Turn {{n}}/{{total}}',

    // Roles and names
    clientRole: 'Client',
    counterTitle: 'Billing counter · Sumon',
    contextRole: 'Context',
    abstractRole: 'AbstractExpression',
    terminalRole: 'TerminalExpression',
    nonterminalRole: 'NonterminalExpression',
    hardcodedRole: 'No pattern',
    nusrat: 'Nusrat',
    rahim: 'Rahim',
    tania: 'Tania',
    karim: 'Karim',
    itemSaree: 'Jamdani saree',
    itemPanjabi: 'Eid panjabi',
    itemLungi: 'Pabna lungi',

    // Board
    boardTitle: 'Mitu apa’s board',
    newTag: 'new',
    bestOnly: 'Only the best discount applies, never two.',
    ruleSaree: '10% off any saree over ৳3,000',
    ruleBig: '15% off any order over ৳5,000',
    rulePanjabi: '5% off any panjabi over ৳2,000',
    ruleEid1: '10% off any saree, OR any order over ৳5,000',
    ruleEid2: '10% off: a saree over ৳3,000, OR any order over ৳5,000',
    ruleEid3: '10% off a panjabi OR a lungi, when it’s over ৳2,000',

    // Customers
    noDiscount: 'no discount',
    pays: 'pays {{paid}}',
    loss: 'loss {{diff}}',
    boardSays: 'board says {{pct}}',

    // Client footer
    statEdits: 'checkout() edits: {{n}}',
    statDeploys: 'redeploys: {{n}}',
    yourChoice: 'Your choice',
    pickLabel1: 'How do you change checkout()?',
    pickLabel2: 'Which blocks say exactly what the board says?',
    knowsL1: 'Every rule is an if inside checkout(): a new rule = an edit + a redeploy',
    knowsL2: 'checkout() only calls rule.interpret(cart). A new rule = a new tree of objects',
    othersSame: 'And · TotalAbove · CategoryIs · checkout(): unchanged',

    // Choices: level 1
    optAnd: 'if (saree && total > 3000) → 10%',
    optOr: 'if (saree || total > 3000) → 10%',
    optNoCat: 'if (total > 3000) → 10%, shorter',
    optTop: 'New if (total > 5000) on top; the saree if becomes else if',
    optExtra: 'Add a separate if (total > 5000) → +15% below',
    optBottom: 'Add else if (total > 5000) at the bottom',
    optLast: 'Add else if (panjabi && total > 2000) at the end',
    optFirst: 'Put the panjabi if first, on top',
    optReuse: 'Change the saree line to (saree || panjabi) && total > 2000',

    // checkout() (level 1)
    redeploying: 'Redeploying the billing app… counter closed',

    // Expression tree
    treeEmpty: 'Pick the blocks above to build today’s rule.',
    readsTotal: 'reads cart.total',
    readsCategory: 'reads cart.category',
    andIdle: 'true only if both sides are true',
    orIdle: 'true if either side is true',
    asking: 'asking its children…',
    skipped: 'not asked: skipped',
    ruleNote: 'Every block has the same method, so any block can sit anywhere in the tree.',
    notBuilt: 'not built yet',

    // Cart
    cartWaiting: 'waiting for the next customer',

    // Result
    resultOk: 'Every customer paid the right price · +{{coins}}',
    resultBad: 'Wrong discount at the counter!',

    // Builder (level 3)
    builderTitle: 'Build the Or block',
    builderStep1: 'Step 1 · What is it?',
    builderStep2: 'Step 2 · How does it answer?',
    q1: 'The counter, and even an And block, must use Or like any other block. What should Or be?',
    q1Flag: 'A mode flag on And: And(left, right, mode = "or")',
    q1Implements: 'class Or implements Rule',
    q1Counter: 'An if (isOrRule) inside checkout()',
    q2: 'Inside Or.interpret(cart), how does it get its answer?',
    q2Hard: 'cart.category == "saree" || cart.total > 5000',
    q2Children: 'left.interpret(cart) || right.interpret(cart)',
    q2And: 'left.interpret(cart) && right.interpret(cart)',
    zeroEdits: 'Old code edited: 0 lines',
    useOr: 'Use the Or block',

    // Turn
    playButton: 'Play',
    nextTurn: 'Next rule',
    finishLevel: 'Finish level',
    tryAgain: 'Try again',

    // Level end
    levelDone: 'Level {{n}} complete!',
    nextLevel: 'Next level',
    replayLevel: 'Play this level again',
    playAgain: 'Play again from level 1',
    l1Teaser:
      'It works, but three rules cost three edits to checkout(), three redeploys, and one wrong branch away from a loss. Next, Mitu apa wants “saree OR over ৳5,000”. Where does that else if go?',
    l2Summary:
      'Three new rules, and checkout() was never edited or redeployed. Each rule was a small tree of blocks; the counter just called rule.interpret(cart) and the tree worked out the answer.',
    recapTitle: 'What you learned',
    recap1: 'Hard-coded rules turn checkout() into a growing if/else chain: every rule change is an edit and a redeploy, and the branch order quietly decides who gets which discount.',
    recap2:
      'Interpreter gives each piece of the rule language a class: terminals (TotalAbove, CategoryIs) read the context, nonterminals (And) combine children. A rule is a tree, evaluated with one call: interpret(cart).',
    recap3: 'A new grammar rule (Or) is one new class with the same interpret(). It nests with the old blocks in any shape, and the old classes: 0 lines edited.',

    whatsHappening: "What's happening",
    note: 'The shop, people and amounts are made up for this example.',
  },

  steps: {
    // Level 1: no pattern
    tutorial:
      'Mitu apa writes her first Eid offer on the board: {{rule}}. With no pattern, the only way the app can know it is an if inside checkout(). The right edit is already picked. Press Play and watch.',
    'idle1-1': 'The board says: {{rule}}. How do you write it into checkout()?',
    'idle1-2':
      'Mitu apa adds a second offer: {{rule}}. A customer gets only the best discount, never two. How do you change checkout()?',
    'idle1-3': 'A third offer: {{rule}}. checkout() already has two branches. Where does the new one go?',
    picked1: 'You picked: {{choice}}. Press Play: the developer edits checkout(), redeploys the app, then the customers pay.',
    'l1-rule': 'New on the board: {{rule}}. The billing app can’t read the board, so a developer has to turn it into code.',
    'l1-edit': 'The developer opens checkout() and edits the if/else chain. That is edit number {{edits}} to the same function.',
    'l1-deploy': 'Redeploy the billing app. For ten minutes the counter is closed and the queue grows. Every rule change costs this.',
    'l1-cart': '{{name}} comes to the counter: {{item}}, {{total}}. Sumon runs checkout(cart).',
    'l1-check-hit': 'checkout() walks the chain from the top and stops at the first branch that matches: {{pct}} off. The order of the branches decides the discount.',
    'l1-check-none': 'No branch matches this cart, so the discount is 0.',
    'l1-check-double': 'Two separate ifs both match, and the second one adds on top: {{pct}} off in total!',
    'l1-pay-yes': '{{name}} gets {{pct}} off and pays {{paid}}, just as the board says.',
    'l1-pay-no': 'No discount: {{name}} pays {{paid}}. Correct, no offer on the board covers this cart.',
    'l1-pay-loss': '{{name}} gets {{pct}} off, but the board promises {{expected}}. The shop loses {{diff}}!',
    'l1-pay-short': '{{name}} gets only {{pct}} off, but the board says {{expected}}! “Apa, read your own board!”',
    'l1-ok':
      'Every customer paid the right price. +{{coins}}. It worked, but it took edit number {{edits}} to checkout() and another redeploy.',
    'l1-fail-or':
      '😵 Rahim’s panjabi got the saree discount. || means “either one is enough”, so every order over ৳3,000 qualified. The board needs both conditions: &&.',
    'l1-fail-noCat':
      '😵 Rahim’s panjabi got 10% off. Dropping the saree check made the if shorter, and wrong: the rule has two conditions, and the code must keep both.',
    'l1-fail-extra':
      '😵 Nusrat’s ৳6,000 saree matched both ifs: 10% + 15% = 25% off. A separate if doesn’t know what the one above already gave. The branch layout decided the discount, not the board.',
    'l1-fail-bottom':
      '😵 Nusrat’s ৳6,000 saree stopped at the saree branch (10%) and never reached the 15% one at the bottom. In an else-if chain the first match wins, so the order is a hidden rule of its own.',
    'l1-fail-first':
      '😵 Rahim’s ৳5,500 panjabi stopped at the new panjabi branch (5%) and never reached the 15% one. Adding a rule on top quietly changed an old rule.',
    'l1-fail-reuse':
      '😵 Editing the saree line broke it: Tania’s ৳2,500 saree now gets 10% (the board says over ৳3,000), and Karim’s panjabi gets 10% instead of 5%. One edited line, two old rules changed.',
    'level1-done':
      'Level complete! Every rule works, but each one meant editing checkout(), redeploying the app, and hoping the branch order was right.',

    // Level 2: rules as trees of blocks
    'idle2-1': 'Today’s board: {{rule}}. Which blocks say exactly that?',
    'idle2-2': 'New offer on the board: {{rule}}. Pick the blocks. checkout() stays as it is.',
    'idle2-3': 'Last offer of the day: {{rule}}. Does it even need an And?',
    picked2: 'You built: {{choice}}. Press Play: the counter calls rule.interpret(cart) for each customer.',
    build:
      'The counter builds the rule as a tree of objects: {{choice}}. That is the whole “edit”: no if was added to checkout(), and nothing is redeployed.',
    cart: '{{name}} comes with {{item}}, {{total}}. The counter makes one call on the root of the tree: rule.interpret(cart).',
    'enter-and': 'And doesn’t know any discount rule by itself. It passes the same cart to its left child: left.interpret(cart).',
    'enter-or': 'Or passes the same cart to its left child first: left.interpret(cart).',
    'leaf-total': 'TotalAbove reads one fact from the context, cart.total: is {{total}} more than {{amount}}? {{answer}}.',
    'leaf-cat': 'CategoryIs reads one fact from the context, cart.category: is "{{actual}}" the same as "{{want}}"? {{answer}}.',
    'combine-and': 'Both children answered. And combines them: {{left}} AND {{right}} = {{answer}}.',
    'skip-and': 'The left side is false, so And is false whatever the right side says. It doesn’t even ask the right child.',
    'combine-or': 'Both children answered. Or combines them: {{left}} OR {{right}} = {{answer}}.',
    'skip-or': 'The left side is true, so Or is already true. It doesn’t even ask the right child.',
    'result-yes': 'The tree says true: {{name}} gets {{pct}} off and pays {{paid}}, just as the board says.',
    'result-no': 'The tree says false: no discount, {{name}} pays {{paid}}. Correct, the offer doesn’t cover this cart.',
    'result-loss': 'The tree says true, so {{name}} gets {{pct}} off. But the board’s offer doesn’t cover this cart! The shop loses {{diff}}.',
    'result-short': 'The tree says false, so no discount for {{name}}. But the board says {{expected}} off! An angry customer.',
    'done-ok':
      'Every customer paid the right price. +{{coins}}. A new rule was just a new tree of blocks: checkout() wasn’t touched or redeployed.',
    'done-catOnly':
      '😵 Tania’s ৳1,200 saree got 10% off. CategoryIs("saree") alone is true for any saree; the board also says “over ৳3,000”. Two conditions need an And with both blocks.',
    'done-amount':
      '😵 TotalAbove(300) is true for almost every cart, so Tania’s ৳1,200 saree got the discount. The tree did exactly what its blocks say; the blocks just said the wrong thing.',
    'done-wrongCat':
      '😵 Karim’s panjabi got nothing and Tania’s saree got 5%. The And was right, but CategoryIs("saree") is the wrong block: a leaf only checks what it was built with.',
    'done-noCat2':
      '😵 TotalAbove(2000) alone gave Tania’s saree the panjabi discount. Leaving out a block makes the rule wider than the board.',
    'done-andSaree':
      '😵 Rahim’s ৳5,500 panjabi got nothing. The board says “any order over ৳5,000”: one condition. A single TotalAbove block is already a complete rule.',
    'done-zero':
      '😵 TotalAbove(500) gave Nusrat’s ৳3,450 saree 15% off. One missing zero, one wrong block. But notice: fixing it means swapping a block, not editing checkout().',
    'level2-done':
      'Level complete! Three new rules, zero edits to checkout(), zero redeploys. Each rule was a tree; interpret(cart) on the root asked each block in turn.',

    // Level 3: a new expression class
    'build-q1':
      'Mitu apa’s Eid rules need OR, and the language has no Or block yet. You’ll write it. First: what should Or be, so the counter and other blocks can use it?',
    'wrong-q1-flag':
      'That edits And, an old class every rule already uses, and every And now has to check a mode. A new grammar rule should be a new class, not a new switch in an old one.',
    'wrong-q1-counter':
      'That’s level 1 again: checkout() grows an if for every kind of rule. The counter should only know one thing: Rule, with interpret(cart).',
    'build-q2':
      'Right: implements Rule, so Or has interpret(cart) like every other block, and can sit anywhere in a tree. Now: how does Or.interpret(cart) get its answer?',
    'wrong-q2-hard':
      'That hard-codes one rule inside Or, so it only works for saree and ৳5,000. Or must work for ANY two blocks, even whole sub-trees: it has to ask its children.',
    'wrong-q2-and': 'That’s And: both must be true. Or is true when either child is true, so it combines the answers with ||.',
    'build-ready': 'Done: one new class. 0 lines changed in And, TotalAbove, CategoryIs or checkout(). Press “Use the Or block”.',
    'build-done': 'Or is ready. Press Play: the counter builds today’s rule with it, and interpret(cart) works as before.',
    'idle3-1': 'Today’s board: {{rule}}. Press Play.',
    'idle3-2': 'Now Or holds a whole And inside it: {{rule}}. Old block, new block, same interpret(). Press Play.',
    'idle3-3': 'The other way round, an Or inside an And: {{rule}}. Press Play.',
    'l3-build': 'The counter snaps the new Or block together with the old ones: {{choice}}. Nothing else changed.',
    'done-new-1':
      'Right discounts! +{{coins}}. Or asked its children and stopped early when the left side was already true.',
    'done-new-2':
      'Right discounts! +{{coins}}. Or didn’t care that its left child was a whole And: it just called interpret(cart) on it. That is the recursion.',
    'done-new-3':
      'Right discounts! +{{coins}}. An old And held the new Or as its child, without a single line of And changing.',
    'level3-done':
      'You finished the game! A rule language became a tree of small classes. Each one knows its own grammar rule, interpret() walks the tree, and a new rule type is just a new class.',
  },

  codeComments: {
    context: 'Context: the facts every rule reads',
    abstract: 'AbstractExpression: every block has interpret()',
    terminal: 'TerminalExpressions: leaves that read the cart',
    readsTotal: 'one fact: is the total over the amount?',
    readsCategory: 'one fact: is it this category?',
    nonterminal: 'NonterminalExpression: combines two rules',
    holdsRules: 'its children can be any Rule, even another And',
    asksLeft: 'ask the left child first…',
    shortCircuit: '…the right one only if the left was true',
    client: 'Client: the billing counter',
    oneCall: 'one call on the root; the tree does the rest',
    payOrNot: 'discount only if the rule says true',
    buildTree: 'the board’s rule, built as a tree of objects',
    withoutIntro: 'No pattern: every rule is an if inside checkout()',
    everyRuleHere: 'every offer on the board ends up in here',
    orderMatters: 'the first match wins: the order is a hidden rule',
    redeploy: 'every rule change = edit this function + redeploy',
    withoutNext: '“saree OR over ৳5,000”? Another branch, another redeploy',
    withAdd: 'A new grammar rule = one new class',
    sameInterface: 'same interface as every block',
    recursive: 'ask the children: they may be whole trees',
    orShort: 'the right child only if the left was false',
    othersSame: 'Old classes: not a single line edited',
    withUse: 'Nest the new block with the old ones',
    nested: 'an Or holding an And: any shape works',
    sameCall: 'the counter’s call is the same as before',
    withZero: 'Old code edited: 0 lines. Without the pattern: another else if, and a redeploy',
  },

  compare: {
    without: {
      title: 'Rules hard-coded as if/else in checkout()',
      points: [
        'Every offer on the board becomes another branch in the same checkout() function.',
        'Each rule change means editing checkout() and redeploying the whole billing app.',
        'The order of the branches silently decides the discount: one misplaced else if is a double discount or a lost sale.',
        'AND / OR combinations are rewritten by hand in each condition, so one edited line can change several old rules.',
      ],
    },
    with: {
      title: 'Each rule is a tree of expression objects',
      points: [
        'A small class per grammar rule: TotalAbove and CategoryIs read the context, And combines two rules.',
        'A rule is built as a tree of those objects; checkout() just calls rule.interpret(cart).',
        'Changing the offer means building a different tree: no edit to checkout(), no redeploy.',
        'A new grammar rule (Or) is one new class with the same interpret(); it nests with the old blocks in any shape.',
      ],
    },
    benefit:
      'Interpreter turns rules into data: each sentence of a small language is a tree of objects that evaluates itself. New sentences need no code changes, and new grammar rules are new classes, so the language grows without touching what already works.',
    whenToUse: [
      'You have a small, stable grammar of rules or expressions (discount rules, filters, search queries, access rules) that users or admins combine.',
      'The same rule must be evaluated many times against different data (each cart, each request, each row).',
      'Rules change far more often than the code, and you want them built, stored or edited without redeploying. (For large grammars, use a parser generator instead.)',
    ],
  },
} satisfies PatternContent

export type InterpreterContent = typeof en

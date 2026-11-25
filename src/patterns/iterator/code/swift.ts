import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Swift: IteratorProtocol merges hasNext() and next() into one next() -> Player?; nil means "no more players".
// Structs can't inherit, so AllRounderIterator wraps a BattingOrderIterator instead of extending it.

const main = `
// {{player}}
struct Player {
    let name: String
    let strikeRate: Int
    let role: String
    let leftHanded: Bool
}

// {{iterator}}
protocol PlayerIterator: IteratorProtocol where Element == Player {}

// {{concreteIterator}}
struct BattingOrderIterator: PlayerIterator {
    let players: [Player]
    var pos = 0 // {{cursor}}
    mutating func next() -> Player? {
        guard pos < players.count else { return nil } // @step:has-next
        pos += 1
        return players[pos - 1] // {{handOut}} // @step:next
    }
}

func strikeRateIterator(_ players: [Player]) -> BattingOrderIterator {
    BattingOrderIterator(players: players.sorted { $0.strikeRate > $1.strikeRate }) // {{sortedCopy}} // @step:sort-copy
}

struct AllRounderIterator: PlayerIterator {
    var base: BattingOrderIterator
    mutating func next() -> Player? {
        while let p = base.next() { // @step:ar-has-next
            if p.role == "all-rounder" { return p } // {{skipInside}} // @step:skip
        }
        return nil
    }
}

// {{aggregate}}
protocol Team {
    func battingOrder() -> any PlayerIterator
    func byStrikeRate() -> any PlayerIterator
    func allRounders() -> any PlayerIterator
}

// {{concreteAggregate}}
struct Squad: Team {
    private var players: [Player] = [] // {{hidden}}
    mutating func add(_ p: Player) { players.append(p) }
    func battingOrder() -> any PlayerIterator { BattingOrderIterator(players: players) } // @step:create-order
    func byStrikeRate() -> any PlayerIterator { strikeRateIterator(players) } // @step:create-sr
    func allRounders() -> any PlayerIterator { AllRounderIterator(base: BattingOrderIterator(players: players)) } // @step:create-ar
}

// {{client}}
var it = squad.allRounders() // {{pickOne}} // @step:request
while let p = it.next() { // {{sameLoop}} // @step:loop
    announce(p.name)
}
`

const without = `
// {{withoutIntro}}
class Squad {
    var players: [Player] = [] // {{exposed}} // @step:l1-expose
}

// {{orderLoop}}
for i in 0..<squad.players.count { // {{indexMath}} // @step:l1-loop
    announce(squad.players[i].name) // @step:l1-read
}

// {{formLoop}}
let inForm = squad.players.sorted { $0.strikeRate > $1.strikeRate } // {{copyFirst}} // @step:l1-sort
inForm.forEach { announce($0.name) } // @step:l1-read-sorted

// {{changed}}
class Squad { var players: [Int: Player] = [:] } // {{breaksAll}} // @step:l1-map
for p in squad.players.values { // @step:l1-loop-map
    if p.role == "all-rounder" { announce(p.name) } // {{filterHere}} // @step:l1-filter
}
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
struct LeftHandedIterator: PlayerIterator { // {{sameInterface}} // @step:build-class
    var inner: any PlayerIterator // {{wrapsAny}} // @step:build-wrap
    mutating func next() -> Player? {
        while let p = inner.next() { // {{pull}} // @step:lh-skip,lh-keep
            if p.leftHanded { return p } // {{skipRight}} // @step:lh-skip,lh-keep,lh-next
        }
        return nil // @step:lh-has-next
    }
}

// {{othersSame}}
struct Squad: Team { /* … */ }

// {{withUse}}
var it = LeftHandedIterator(inner: squad.battingOrder()) // {{wrapUse}} // @step:lh-create
while let p = it.next() { // {{sameLoop}} // @step:loop
    announce(p.name)
}
// {{withZero}}
`

export const swift: CodeSet = {
  main: { filename: 'Squad.swift', source: main },
  without: { filename: 'SquadWithoutIterator.swift', source: without },
  with: { filename: 'LeftHandedIterator.swift', source: withPattern },
}

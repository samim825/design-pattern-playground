import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Go: no inheritance, so AllRounderIterator embeds BattingOrderIterator, and the strike-rate iterator is a constructor that sorts a copy.

const main = `
// {{player}}
type Player struct {
    Name       string
    StrikeRate int
    Role       string
    LeftHanded bool
}

// {{iterator}}
type PlayerIterator interface {
    HasNext() bool
    Next() Player
}

// {{concreteIterator}}
type BattingOrderIterator struct {
    players []Player
    pos     int // {{cursor}}
}

func (it *BattingOrderIterator) HasNext() bool {
    return it.pos < len(it.players) // @step:has-next
}

func (it *BattingOrderIterator) Next() Player {
    it.pos++
    return it.players[it.pos-1] // {{handOut}} // @step:next
}

func NewStrikeRateIterator(players []Player) *BattingOrderIterator {
    sorted := slices.Clone(players) // {{sortedCopy}} // @step:sort-copy
    slices.SortFunc(sorted, func(a, b Player) int { return b.StrikeRate - a.StrikeRate }) // @step:sort-copy
    return &BattingOrderIterator{players: sorted}
}

type AllRounderIterator struct{ BattingOrderIterator }

func (it *AllRounderIterator) HasNext() bool {
    for it.pos < len(it.players) && it.players[it.pos].Role != "all-rounder" { // {{skipInside}} // @step:skip
        it.pos++
    }
    return it.BattingOrderIterator.HasNext() // @step:ar-has-next
}

// {{aggregate}}
type Team interface {
    BattingOrder() PlayerIterator
    ByStrikeRate() PlayerIterator
    AllRounders() PlayerIterator
}

// {{concreteAggregate}}
type Squad struct {
    players []Player // {{hidden}}
}

func (s *Squad) Add(p Player)                 { s.players = append(s.players, p) }
func (s *Squad) BattingOrder() PlayerIterator { return &BattingOrderIterator{players: s.players} } // @step:create-order
func (s *Squad) ByStrikeRate() PlayerIterator { return NewStrikeRateIterator(s.players) } // @step:create-sr
func (s *Squad) AllRounders() PlayerIterator  { return &AllRounderIterator{BattingOrderIterator{players: s.players}} } // @step:create-ar

// {{client}}
it := squad.AllRounders() // {{pickOne}} // @step:request
for it.HasNext() { // {{sameLoop}} // @step:loop
    announce(it.Next().Name)
}
`

const without = `
// {{withoutIntro}}
type Squad struct {
    Players []Player // {{exposed}} // @step:l1-expose
}

// {{orderLoop}}
for i := 0; i < len(squad.Players); i++ { // {{indexMath}} // @step:l1-loop
    announce(squad.Players[i].Name) // @step:l1-read
}

// {{formLoop}}
inForm := slices.Clone(squad.Players) // {{copyFirst}} // @step:l1-sort
slices.SortFunc(inForm, func(a, b Player) int { return b.StrikeRate - a.StrikeRate }) // @step:l1-sort
for _, p := range inForm {
    announce(p.Name) // @step:l1-read-sorted
}

// {{changed}}
type Squad struct{ Players map[int]Player } // {{breaksAll}} // @step:l1-map
for _, p := range squad.Players { // @step:l1-loop-map
    if p.Role == "all-rounder" {
        announce(p.Name) // {{filterHere}} // @step:l1-filter
    }
}
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
type LeftHandedIterator struct { // {{sameInterface}} // @step:build-class
    inner PlayerIterator // {{wrapsAny}} // @step:build-wrap
    found *Player
}

func (it *LeftHandedIterator) HasNext() bool {
    for it.found == nil && it.inner.HasNext() {
        p := it.inner.Next() // {{pull}} // @step:lh-skip,lh-keep
        if p.LeftHanded { // {{skipRight}} // @step:lh-skip,lh-keep
            it.found = &p
        }
    }
    return it.found != nil // @step:lh-has-next
}

func (it *LeftHandedIterator) Next() Player {
    p := *it.found // @step:lh-next
    it.found = nil
    return p
}

// {{othersSame}}
type Squad struct{ /* … */ }

// {{withUse}}
var it PlayerIterator = &LeftHandedIterator{inner: squad.BattingOrder()} // {{wrapUse}} // @step:lh-create
for it.HasNext() { // {{sameLoop}} // @step:loop
    announce(it.Next().Name)
}
// {{withZero}}
`

export const go: CodeSet = {
  main: { filename: 'squad.go', source: main },
  without: { filename: 'squad_without_iterator.go', source: without },
  with: { filename: 'left_handed_iterator.go', source: withPattern },
}

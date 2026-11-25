import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Rust: the built-in Iterator trait merges hasNext() and next() into one next() -> Option<Item>; None means "no more players".

const main = `
// {{player}}
pub struct Player {
    pub name: String,
    pub strike_rate: u32,
    pub role: &'static str,
    pub left_handed: bool,
}

// {{iterator}}
pub type PlayerIterator<'a> = Box<dyn Iterator<Item = &'a Player> + 'a>;

// {{concreteIterator}}
pub struct BattingOrderIterator<'a> {
    players: Vec<&'a Player>,
    pos: usize, // {{cursor}}
}

impl<'a> Iterator for BattingOrderIterator<'a> {
    type Item = &'a Player;
    fn next(&mut self) -> Option<&'a Player> {
        if self.pos >= self.players.len() { return None; } // @step:has-next
        self.pos += 1;
        Some(self.players[self.pos - 1]) // {{handOut}} // @step:next
    }
}

fn strike_rate_iterator(players: &[Player]) -> BattingOrderIterator<'_> {
    let mut sorted: Vec<&Player> = players.iter().collect(); // {{sortedCopy}} // @step:sort-copy
    sorted.sort_by(|a, b| b.strike_rate.cmp(&a.strike_rate)); // @step:sort-copy
    BattingOrderIterator { players: sorted, pos: 0 }
}

pub struct AllRounderIterator<'a>(BattingOrderIterator<'a>);

impl<'a> Iterator for AllRounderIterator<'a> {
    type Item = &'a Player;
    fn next(&mut self) -> Option<&'a Player> {
        loop {
            let p = self.0.next()?; // @step:ar-has-next
            if p.role == "all-rounder" { return Some(p); } // {{skipInside}} // @step:skip
        }
    }
}

// {{aggregate}}
pub trait Team {
    fn batting_order(&self) -> PlayerIterator<'_>;
    fn by_strike_rate(&self) -> PlayerIterator<'_>;
    fn all_rounders(&self) -> PlayerIterator<'_>;
}

// {{concreteAggregate}}
pub struct Squad {
    players: Vec<Player>, // {{hidden}}
}

impl Team for Squad {
    fn batting_order(&self) -> PlayerIterator<'_> {
        Box::new(BattingOrderIterator { players: self.players.iter().collect(), pos: 0 }) // @step:create-order
    }
    fn by_strike_rate(&self) -> PlayerIterator<'_> {
        Box::new(strike_rate_iterator(&self.players)) // @step:create-sr
    }
    fn all_rounders(&self) -> PlayerIterator<'_> {
        Box::new(AllRounderIterator(BattingOrderIterator { players: self.players.iter().collect(), pos: 0 })) // @step:create-ar
    }
}

// {{client}}
let mut it = squad.all_rounders(); // {{pickOne}} // @step:request
while let Some(p) = it.next() { // {{sameLoop}} // @step:loop
    announce(&p.name);
}
`

const without = `
// {{withoutIntro}}
pub struct Squad {
    pub players: Vec<Player>, // {{exposed}} // @step:l1-expose
}

// {{orderLoop}}
for i in 0..squad.players.len() { // {{indexMath}} // @step:l1-loop
    announce(&squad.players[i].name); // @step:l1-read
}

// {{formLoop}}
let mut in_form: Vec<&Player> = squad.players.iter().collect(); // {{copyFirst}} // @step:l1-sort
in_form.sort_by(|a, b| b.strike_rate.cmp(&a.strike_rate)); // @step:l1-sort
for p in &in_form { announce(&p.name); } // @step:l1-read-sorted

// {{changed}}
pub struct Squad { pub players: HashMap<u32, Player> } // {{breaksAll}} // @step:l1-map
for p in squad.players.values() { // @step:l1-loop-map
    if p.role == "all-rounder" { announce(&p.name); } // {{filterHere}} // @step:l1-filter
}
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
pub struct LeftHandedIterator<'a> {
    inner: PlayerIterator<'a>, // {{wrapsAny}} // @step:build-wrap
}

impl<'a> Iterator for LeftHandedIterator<'a> { // {{sameInterface}} // @step:build-class
    type Item = &'a Player;
    fn next(&mut self) -> Option<&'a Player> {
        loop {
            let p = self.inner.next()?; // {{pull}} // @step:lh-skip,lh-keep,lh-has-next
            if p.left_handed { // {{skipRight}} // @step:lh-skip,lh-keep
                return Some(p); // @step:lh-next
            }
        }
    }
}

// {{othersSame}}
impl Team for Squad { /* … */ }

// {{withUse}}
let mut it = LeftHandedIterator { inner: squad.batting_order() }; // {{wrapUse}} // @step:lh-create
while let Some(p) = it.next() { // {{sameLoop}} // @step:loop
    announce(&p.name);
}
// {{withZero}}
`

export const rust: CodeSet = {
  main: { filename: 'squad.rs', source: main },
  without: { filename: 'squad_without_iterator.rs', source: without },
  with: { filename: 'left_handed_iterator.rs', source: withPattern },
}

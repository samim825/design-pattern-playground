import type { CodeSet } from '@/types/pattern'

/*
 * Conventions (see CLAUDE.md):
 *   // {{key}}        → translated comment from content.<lang>.ts → codeComments[key]
 *   // @step:a,b      → this line lights up while visual step a or b runs (stripped on display)
 * announce() (the scorer reading a name out loud) is left undeclared to keep the snippets small.
 */

const main = `
// {{player}}
interface Player {
  readonly name: string;
  readonly strikeRate: number;
  readonly role: 'batter' | 'keeper' | 'all-rounder' | 'bowler';
  readonly leftHanded: boolean;
}

// {{iterator}}
interface PlayerIterator {
  hasNext(): boolean;
  next(): Player;
}

// {{concreteIterator}}
class BattingOrderIterator implements PlayerIterator {
  protected pos = 0; // {{cursor}}
  constructor(protected readonly players: readonly Player[]) {}
  hasNext(): boolean {
    return this.pos < this.players.length; // @step:has-next
  }
  next(): Player {
    return this.players[this.pos++]; // {{handOut}} // @step:next
  }
}

class StrikeRateIterator extends BattingOrderIterator {
  constructor(players: readonly Player[]) {
    super([...players].sort((a, b) => b.strikeRate - a.strikeRate)); // {{sortedCopy}} // @step:sort-copy
  }
}

class AllRounderIterator extends BattingOrderIterator {
  hasNext(): boolean {
    while (super.hasNext() && this.players[this.pos].role !== 'all-rounder') this.pos++; // {{skipInside}} // @step:skip
    return super.hasNext(); // @step:ar-has-next
  }
}

// {{aggregate}}
interface Team {
  battingOrder(): PlayerIterator;
  byStrikeRate(): PlayerIterator;
  allRounders(): PlayerIterator;
}

// {{concreteAggregate}}
class Squad implements Team {
  private readonly players: Player[] = []; // {{hidden}}
  add(p: Player): void { this.players.push(p); }
  battingOrder(): PlayerIterator { return new BattingOrderIterator(this.players); } // @step:create-order
  byStrikeRate(): PlayerIterator { return new StrikeRateIterator(this.players); } // @step:create-sr
  allRounders(): PlayerIterator { return new AllRounderIterator(this.players); } // @step:create-ar
}

// {{client}}
const it: PlayerIterator = squad.allRounders(); // {{pickOne}} // @step:request
while (it.hasNext()) { // {{sameLoop}} // @step:loop
  announce(it.next().name);
}
`

const without = `
// {{withoutIntro}}
class Squad {
  players: Player[] = []; // {{exposed}} // @step:l1-expose
}

// {{orderLoop}}
for (let i = 0; i < squad.players.length; i++) { // {{indexMath}} // @step:l1-loop
  announce(squad.players[i].name); // @step:l1-read
}

// {{formLoop}}
const inForm = [...squad.players].sort((a, b) => b.strikeRate - a.strikeRate); // {{copyFirst}} // @step:l1-sort
inForm.forEach((p) => announce(p.name)); // @step:l1-read-sorted

// {{changed}}
class Squad { players = new Map<number, Player>(); } // {{breaksAll}} // @step:l1-map
for (const p of squad.players.values()) { // @step:l1-loop-map
  if (p.role === 'all-rounder') announce(p.name); // {{filterHere}} // @step:l1-filter
}
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
class LeftHandedIterator implements PlayerIterator { // {{sameInterface}} // @step:build-class
  private found: Player | null = null;
  constructor(private readonly inner: PlayerIterator) {} // {{wrapsAny}} // @step:build-wrap
  hasNext(): boolean {
    while (this.found === null && this.inner.hasNext()) {
      const p = this.inner.next(); // {{pull}} // @step:lh-skip,lh-keep
      if (p.leftHanded) this.found = p; // {{skipRight}} // @step:lh-skip,lh-keep
    }
    return this.found !== null; // @step:lh-has-next
  }
  next(): Player {
    const p = this.found!; // @step:lh-next
    this.found = null;
    return p;
  }
}

// {{othersSame}}
class Squad implements Team { /* … */ }

// {{withUse}}
const it: PlayerIterator = new LeftHandedIterator(squad.battingOrder()); // {{wrapUse}} // @step:lh-create
while (it.hasNext()) { // {{sameLoop}} // @step:loop
  announce(it.next().name);
}
// {{withZero}}
`

export const ts: CodeSet = {
  main: { filename: 'squad.ts', source: main },
  without: { filename: 'squad-without-iterator.ts', source: without },
  with: { filename: 'left-handed-iterator.ts', source: withPattern },
}

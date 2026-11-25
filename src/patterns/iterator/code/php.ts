import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// PHP: the built-in Iterator interface uses valid() / current() / next(); a small PlayerIterator keeps hasNext() / next() visible.

const main = `
<?php
// {{player}}
readonly class Player
{
    public function __construct(
        public string $name,
        public int $strikeRate,
        public string $role,
        public bool $leftHanded,
    ) {}
}

// {{iterator}}
interface PlayerIterator
{
    public function hasNext(): bool;
    public function next(): Player;
}

// {{concreteIterator}}
class BattingOrderIterator implements PlayerIterator
{
    protected int $pos = 0; // {{cursor}}
    public function __construct(protected array $players) {}
    public function hasNext(): bool
    {
        return $this->pos < count($this->players); // @step:has-next
    }
    public function next(): Player
    {
        return $this->players[$this->pos++]; // {{handOut}} // @step:next
    }
}

class StrikeRateIterator extends BattingOrderIterator
{
    public function __construct(array $players)
    {
        usort($players, fn($a, $b) => $b->strikeRate <=> $a->strikeRate); // {{sortedCopy}} // @step:sort-copy
        parent::__construct($players);
    }
}

class AllRounderIterator extends BattingOrderIterator
{
    public function hasNext(): bool
    {
        while (parent::hasNext() && $this->players[$this->pos]->role !== 'all-rounder') $this->pos++; // {{skipInside}} // @step:skip
        return parent::hasNext(); // @step:ar-has-next
    }
}

// {{aggregate}}
interface Team
{
    public function battingOrder(): PlayerIterator;
    public function byStrikeRate(): PlayerIterator;
    public function allRounders(): PlayerIterator;
}

// {{concreteAggregate}}
class Squad implements Team
{
    private array $players = []; // {{hidden}}
    public function add(Player $p): void { $this->players[] = $p; }
    public function battingOrder(): PlayerIterator { return new BattingOrderIterator($this->players); } // @step:create-order
    public function byStrikeRate(): PlayerIterator { return new StrikeRateIterator($this->players); } // @step:create-sr
    public function allRounders(): PlayerIterator { return new AllRounderIterator($this->players); } // @step:create-ar
}

// {{client}}
$it = $squad->allRounders(); // {{pickOne}} // @step:request
while ($it->hasNext()) { // {{sameLoop}} // @step:loop
    announce($it->next()->name);
}
`

const without = `
<?php
// {{withoutIntro}}
class Squad
{
    public array $players = []; // {{exposed}} // @step:l1-expose
}

// {{orderLoop}}
for ($i = 0; $i < count($squad->players); $i++) { // {{indexMath}} // @step:l1-loop
    announce($squad->players[$i]->name); // @step:l1-read
}

// {{formLoop}}
$inForm = $squad->players; // {{copyFirst}} // @step:l1-sort
usort($inForm, fn($a, $b) => $b->strikeRate <=> $a->strikeRate); // @step:l1-sort
foreach ($inForm as $p) announce($p->name); // @step:l1-read-sorted

// {{changed}}
$squad->players = [7 => $rahim, 1 => $sumon /* … */]; // {{breaksAll}} // @step:l1-map
foreach ($squad->players as $jersey => $p) { // @step:l1-loop-map
    if ($p->role === 'all-rounder') announce($p->name); // {{filterHere}} // @step:l1-filter
}
// {{withoutNext}}
`

const withPattern = `
<?php
// {{withAdd}}
class LeftHandedIterator implements PlayerIterator // {{sameInterface}} // @step:build-class
{
    private ?Player $found = null;
    public function __construct(private PlayerIterator $inner) {} // {{wrapsAny}} // @step:build-wrap
    public function hasNext(): bool
    {
        while ($this->found === null && $this->inner->hasNext()) {
            $p = $this->inner->next(); // {{pull}} // @step:lh-skip,lh-keep
            if ($p->leftHanded) $this->found = $p; // {{skipRight}} // @step:lh-skip,lh-keep
        }
        return $this->found !== null; // @step:lh-has-next
    }
    public function next(): Player
    {
        [$p, $this->found] = [$this->found, null]; // @step:lh-next
        return $p;
    }
}

// {{othersSame}}
class Squad implements Team { /* … */ }

// {{withUse}}
$it = new LeftHandedIterator($squad->battingOrder()); // {{wrapUse}} // @step:lh-create
while ($it->hasNext()) { // {{sameLoop}} // @step:loop
    announce($it->next()->name);
}
// {{withZero}}
`

export const php: CodeSet = {
  main: { filename: 'Squad.php', source: main },
  without: { filename: 'SquadWithoutIterator.php', source: without },
  with: { filename: 'LeftHandedIterator.php', source: withPattern },
}

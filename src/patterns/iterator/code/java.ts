import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Java: PlayerIterator extends java.util.Iterator<Player>, which already declares hasNext() and next().

const main = `
// {{player}}
record Player(String name, int strikeRate, String role, boolean leftHanded) {}

// {{iterator}}
interface PlayerIterator extends Iterator<Player> {}

// {{concreteIterator}}
class BattingOrderIterator implements PlayerIterator {
    protected final List<Player> players;
    protected int pos = 0; // {{cursor}}
    BattingOrderIterator(List<Player> players) { this.players = players; }
    @Override public boolean hasNext() {
        return pos < players.size(); // @step:has-next
    }
    @Override public Player next() {
        return players.get(pos++); // {{handOut}} // @step:next
    }
}

class StrikeRateIterator extends BattingOrderIterator {
    StrikeRateIterator(List<Player> players) {
        super(players.stream()
            .sorted(Comparator.comparingInt(Player::strikeRate).reversed()) // {{sortedCopy}} // @step:sort-copy
            .toList());
    }
}

class AllRounderIterator extends BattingOrderIterator {
    AllRounderIterator(List<Player> players) { super(players); }
    @Override public boolean hasNext() {
        while (super.hasNext() && !players.get(pos).role().equals("all-rounder")) pos++; // {{skipInside}} // @step:skip
        return super.hasNext(); // @step:ar-has-next
    }
}

// {{aggregate}}
interface Team {
    PlayerIterator battingOrder();
    PlayerIterator byStrikeRate();
    PlayerIterator allRounders();
}

// {{concreteAggregate}}
class Squad implements Team {
    private final List<Player> players = new ArrayList<>(); // {{hidden}}
    void add(Player p) { players.add(p); }
    @Override public PlayerIterator battingOrder() { return new BattingOrderIterator(players); } // @step:create-order
    @Override public PlayerIterator byStrikeRate() { return new StrikeRateIterator(players); } // @step:create-sr
    @Override public PlayerIterator allRounders() { return new AllRounderIterator(players); } // @step:create-ar
}

// {{client}}
PlayerIterator it = squad.allRounders(); // {{pickOne}} // @step:request
while (it.hasNext()) { // {{sameLoop}} // @step:loop
    announce(it.next().name());
}
`

const without = `
// {{withoutIntro}}
class Squad {
    public List<Player> players = new ArrayList<>(); // {{exposed}} // @step:l1-expose
}

// {{orderLoop}}
for (int i = 0; i < squad.players.size(); i++) { // {{indexMath}} // @step:l1-loop
    announce(squad.players.get(i).name()); // @step:l1-read
}

// {{formLoop}}
var inForm = new ArrayList<>(squad.players); // {{copyFirst}} // @step:l1-sort
inForm.sort(Comparator.comparingInt(Player::strikeRate).reversed()); // @step:l1-sort
inForm.forEach(p -> announce(p.name())); // @step:l1-read-sorted

// {{changed}}
class Squad { public Map<Integer, Player> players = new HashMap<>(); } // {{breaksAll}} // @step:l1-map
for (Player p : squad.players.values()) { // @step:l1-loop-map
    if (p.role().equals("all-rounder")) announce(p.name()); // {{filterHere}} // @step:l1-filter
}
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
class LeftHandedIterator implements PlayerIterator { // {{sameInterface}} // @step:build-class
    private final PlayerIterator inner;
    private Player found = null;
    LeftHandedIterator(PlayerIterator inner) { this.inner = inner; } // {{wrapsAny}} // @step:build-wrap
    @Override public boolean hasNext() {
        while (found == null && inner.hasNext()) {
            Player p = inner.next(); // {{pull}} // @step:lh-skip,lh-keep
            if (p.leftHanded()) found = p; // {{skipRight}} // @step:lh-skip,lh-keep
        }
        return found != null; // @step:lh-has-next
    }
    @Override public Player next() {
        Player p = found; // @step:lh-next
        found = null;
        return p;
    }
}

// {{othersSame}}
class Squad implements Team { /* … */ }

// {{withUse}}
PlayerIterator it = new LeftHandedIterator(squad.battingOrder()); // {{wrapUse}} // @step:lh-create
while (it.hasNext()) { // {{sameLoop}} // @step:loop
    announce(it.next().name());
}
// {{withZero}}
`

export const java: CodeSet = {
  main: { filename: 'Squad.java', source: main },
  without: { filename: 'SquadWithoutIterator.java', source: without },
  with: { filename: 'LeftHandedIterator.java', source: withPattern },
}

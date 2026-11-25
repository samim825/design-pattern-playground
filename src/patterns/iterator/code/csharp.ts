import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// C#: the built-in IEnumerator uses MoveNext() + Current; a small IPlayerIterator keeps HasNext() / Next() visible.

const main = `
// {{player}}
public record Player(string Name, int StrikeRate, string Role, bool LeftHanded);

// {{iterator}}
public interface IPlayerIterator
{
    bool HasNext();
    Player Next();
}

// {{concreteIterator}}
public class BattingOrderIterator : IPlayerIterator
{
    protected readonly IReadOnlyList<Player> players;
    protected int pos = 0; // {{cursor}}
    public BattingOrderIterator(IReadOnlyList<Player> players) => this.players = players;
    public virtual bool HasNext() => pos < players.Count; // @step:has-next
    public Player Next() => players[pos++]; // {{handOut}} // @step:next
}

public class StrikeRateIterator : BattingOrderIterator
{
    public StrikeRateIterator(IReadOnlyList<Player> players)
        : base(players.OrderByDescending(p => p.StrikeRate).ToList()) { } // {{sortedCopy}} // @step:sort-copy
}

public class AllRounderIterator : BattingOrderIterator
{
    public AllRounderIterator(IReadOnlyList<Player> players) : base(players) { }
    public override bool HasNext()
    {
        while (base.HasNext() && players[pos].Role != "all-rounder") pos++; // {{skipInside}} // @step:skip
        return base.HasNext(); // @step:ar-has-next
    }
}

// {{aggregate}}
public interface ITeam
{
    IPlayerIterator BattingOrder();
    IPlayerIterator ByStrikeRate();
    IPlayerIterator AllRounders();
}

// {{concreteAggregate}}
public class Squad : ITeam
{
    private readonly List<Player> players = new(); // {{hidden}}
    public void Add(Player p) => players.Add(p);
    public IPlayerIterator BattingOrder() => new BattingOrderIterator(players); // @step:create-order
    public IPlayerIterator ByStrikeRate() => new StrikeRateIterator(players); // @step:create-sr
    public IPlayerIterator AllRounders() => new AllRounderIterator(players); // @step:create-ar
}

// {{client}}
IPlayerIterator it = squad.AllRounders(); // {{pickOne}} // @step:request
while (it.HasNext()) // {{sameLoop}} // @step:loop
{
    Announce(it.Next().Name);
}
`

const without = `
// {{withoutIntro}}
public class Squad
{
    public List<Player> Players = new(); // {{exposed}} // @step:l1-expose
}

// {{orderLoop}}
for (int i = 0; i < squad.Players.Count; i++) // {{indexMath}} // @step:l1-loop
{
    Announce(squad.Players[i].Name); // @step:l1-read
}

// {{formLoop}}
var inForm = squad.Players.OrderByDescending(p => p.StrikeRate).ToList(); // {{copyFirst}} // @step:l1-sort
inForm.ForEach(p => Announce(p.Name)); // @step:l1-read-sorted

// {{changed}}
public class Squad { public Dictionary<int, Player> Players = new(); } // {{breaksAll}} // @step:l1-map
foreach (var p in squad.Players.Values) // @step:l1-loop-map
{
    if (p.Role == "all-rounder") Announce(p.Name); // {{filterHere}} // @step:l1-filter
}
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
public class LeftHandedIterator : IPlayerIterator // {{sameInterface}} // @step:build-class
{
    private readonly IPlayerIterator inner;
    private Player? found;
    public LeftHandedIterator(IPlayerIterator inner) => this.inner = inner; // {{wrapsAny}} // @step:build-wrap
    public bool HasNext()
    {
        while (found is null && inner.HasNext())
        {
            var p = inner.Next(); // {{pull}} // @step:lh-skip,lh-keep
            if (p.LeftHanded) found = p; // {{skipRight}} // @step:lh-skip,lh-keep
        }
        return found is not null; // @step:lh-has-next
    }
    public Player Next()
    {
        var p = found!; // @step:lh-next
        found = null;
        return p;
    }
}

// {{othersSame}}
public class Squad : ITeam { /* … */ }

// {{withUse}}
IPlayerIterator it = new LeftHandedIterator(squad.BattingOrder()); // {{wrapUse}} // @step:lh-create
while (it.HasNext()) // {{sameLoop}} // @step:loop
{
    Announce(it.Next().Name);
}
// {{withZero}}
`

export const csharp: CodeSet = {
  main: { filename: 'Squad.cs', source: main },
  without: { filename: 'SquadWithoutIterator.cs', source: without },
  with: { filename: 'LeftHandedIterator.cs', source: withPattern },
}

import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Python: an iterator has no has_next(); __next__ raises StopIteration when the squad runs out, and a for loop stops there.

const main = `
# {{player}}
@dataclass(frozen=True)
class Player:
    name: str
    strike_rate: int
    role: str
    left_handed: bool


# {{iterator}}
PlayerIterator = Iterator[Player]


# {{concreteIterator}}
class BattingOrderIterator(Iterator[Player]):
    def __init__(self, players: list[Player]) -> None:
        self.players = players
        self.pos = 0  # {{cursor}}

    def __next__(self) -> Player:
        if self.pos >= len(self.players):  # @step:has-next
            raise StopIteration
        self.pos += 1
        return self.players[self.pos - 1]  # {{handOut}} # @step:next


class StrikeRateIterator(BattingOrderIterator):
    def __init__(self, players: list[Player]) -> None:
        super().__init__(sorted(players, key=lambda p: p.strike_rate, reverse=True))  # {{sortedCopy}} # @step:sort-copy


class AllRounderIterator(BattingOrderIterator):
    def __next__(self) -> Player:
        while self.pos < len(self.players) and self.players[self.pos].role != "all-rounder":  # {{skipInside}} # @step:skip
            self.pos += 1
        return super().__next__()  # @step:ar-has-next


# {{aggregate}}
class Team(ABC):
    @abstractmethod
    def batting_order(self) -> PlayerIterator: ...
    @abstractmethod
    def by_strike_rate(self) -> PlayerIterator: ...
    @abstractmethod
    def all_rounders(self) -> PlayerIterator: ...


# {{concreteAggregate}}
class Squad(Team):
    def __init__(self) -> None:
        self._players: list[Player] = []  # {{hidden}}

    def add(self, p: Player) -> None: self._players.append(p)
    def batting_order(self) -> PlayerIterator: return BattingOrderIterator(self._players)  # @step:create-order
    def by_strike_rate(self) -> PlayerIterator: return StrikeRateIterator(self._players)  # @step:create-sr
    def all_rounders(self) -> PlayerIterator: return AllRounderIterator(self._players)  # @step:create-ar


# {{client}}
it = squad.all_rounders()  # {{pickOne}} # @step:request
for p in it:  # {{sameLoop}} # @step:loop
    announce(p.name)
`

const without = `
# {{withoutIntro}}
class Squad:
    def __init__(self) -> None:
        self.players: list[Player] = []  # {{exposed}} # @step:l1-expose


# {{orderLoop}}
for i in range(len(squad.players)):  # {{indexMath}} # @step:l1-loop
    announce(squad.players[i].name)  # @step:l1-read

# {{formLoop}}
in_form = sorted(squad.players, key=lambda p: p.strike_rate, reverse=True)  # {{copyFirst}} # @step:l1-sort
for p in in_form:
    announce(p.name)  # @step:l1-read-sorted

# {{changed}}
squad.players = dict[int, Player]()  # {{breaksAll}} # @step:l1-map
for p in squad.players.values():  # @step:l1-loop-map
    if p.role == "all-rounder":
        announce(p.name)  # {{filterHere}} # @step:l1-filter
# {{withoutNext}}
`

const withPattern = `
# {{withAdd}}
class LeftHandedIterator(Iterator[Player]):  # {{sameInterface}} # @step:build-class
    def __init__(self, inner: PlayerIterator) -> None:
        self.inner = inner  # {{wrapsAny}} # @step:build-wrap

    def __next__(self) -> Player:
        for p in self.inner:  # {{pull}} # @step:lh-skip,lh-keep
            if p.left_handed:  # {{skipRight}} # @step:lh-skip,lh-keep
                return p  # @step:lh-next
        raise StopIteration  # @step:lh-has-next


# {{othersSame}}
class Squad(Team): ...


# {{withUse}}
it = LeftHandedIterator(squad.batting_order())  # {{wrapUse}} # @step:lh-create
for p in it:  # {{sameLoop}} # @step:loop
    announce(p.name)
# {{withZero}}
`

export const python: CodeSet = {
  main: { filename: 'squad.py', source: main },
  without: { filename: 'squad_without_iterator.py', source: without },
  with: { filename: 'left_handed_iterator.py', source: withPattern },
}

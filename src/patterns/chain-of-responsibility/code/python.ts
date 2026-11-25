import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Python: each concrete handler sets `limit` as a class attribute, which satisfies the abstract property.

const main = `
from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass

# {{loanType}}
@dataclass(frozen=True)
class Loan:
    customer: str
    amount: int

@dataclass(frozen=True)
class Decision:
    approved: bool
    by: str

# {{handlerType}}
class Approver(ABC):
    def __init__(self) -> None:
        self._next: Approver | None = None

    @property
    @abstractmethod
    def limit(self) -> int: ...  # {{ownLimit}}

    def set_next(self, nxt: Approver) -> Approver:  # {{link}} # @step:wire
        self._next = nxt
        return nxt  # {{chainable}}

    def handle(self, loan: Loan) -> Decision:  # {{sameDoor}}
        if loan.amount <= self.limit:  # {{canI}} # @step:check
            return Decision(True, type(self).__name__)  # {{yesApprove}} # @step:approve
        if self._next:
            return self._next.handle(loan)  # {{passOn}} # @step:pass
        return Decision(False, "nobody")  # {{endOfChain}} # @step:reject

# {{concrete}}
class LoanOfficer(Approver): limit = 50_000
class BranchManager(Approver): limit = 500_000
class HeadOffice(Approver): limit = 5_000_000

# {{usage}}
officer = LoanOfficer()
officer.set_next(BranchManager()).set_next(HeadOffice())  # {{wireOnce}} # @step:wire
decision = officer.handle(Loan("Nusrat", 40_000))  # {{oneEntry}} # @step:submit,done
`

const without = `
# {{withoutIntro}}
class LoanDesk:
    # {{knowsAll}}
    def __init__(self) -> None:
        self.officer = LoanOfficer()
        self.manager = BranchManager()
        self.head_office = HeadOffice()

    def submit(self, loan: Loan, to: str) -> Decision:  # {{youRoute}} # @step:l1-start
        if to == "officer":
            return self.officer.approve(loan)  # {{officerLimit}} # @step:l1-officer
        if to == "manager":
            return self.manager.approve(loan)  # {{managerLimit}} # @step:l1-manager
        return self.head_office.approve(loan)  # {{headLimit}} # @step:l1-head

# {{approveBlind}}
class Signer(Protocol):
    def approve(self, loan: Loan) -> Decision: ...  # {{noCheck}} # @step:l1-sign

# {{clientPicks}}
to = "officer" if loan.amount <= 50_000 else "manager" if loan.amount <= 500_000 else "head"  # @step:l1-pick
decision = desk.submit(loan, to)  # @step:l1-result
# {{withoutCopy}} # @step:l1-copy
`

const withPattern = `
# {{withAdd}}
class RegionalManager(Approver):  # @step:build-class,regional
    limit = 2_000_000  # {{regionalLimit}} # @step:build-class,regional
# {{inherits}}

# {{othersSame}}
class LoanOfficer(Approver): limit = 50_000  # @step:hop-officer
class BranchManager(Approver): limit = 500_000  # @step:hop-manager
class HeadOffice(Approver): limit = 5_000_000  # @step:hop-head

# {{withWire}}
officer = LoanOfficer()
(officer.set_next(BranchManager())  # @step:wire-new
    .set_next(RegionalManager())  # {{newLink}} # @step:build-link,wire-new
    .set_next(HeadOffice()))  # @step:wire-new

# {{withSame}}
decision = officer.handle(loan)  # {{clientSame}} # @step:client-same,submit-new,done-new
# {{withZero}}
`

export const python: CodeSet = {
  main: { filename: 'loan_approval.py', source: main },
  without: { filename: 'loan_without_chain.py', source: without },
  with: { filename: 'loan_with_chain.py', source: withPattern },
}

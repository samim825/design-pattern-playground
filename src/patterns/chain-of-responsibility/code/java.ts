import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{loanType}}
record Loan(String customer, long amount) {}
record Decision(boolean approved, String by) {}

// {{handlerType}}
abstract class Approver {
    private Approver next;
    protected abstract long limit(); // {{ownLimit}}

    Approver setNext(Approver next) { // {{link}} // @step:wire
        this.next = next;
        return next; // {{chainable}}
    }

    Decision handle(Loan loan) { // {{sameDoor}}
        if (loan.amount() <= limit()) { // {{canI}} // @step:check
            return new Decision(true, getClass().getSimpleName()); // {{yesApprove}} // @step:approve
        }
        if (next != null) return next.handle(loan); // {{passOn}} // @step:pass
        return new Decision(false, "nobody"); // {{endOfChain}} // @step:reject
    }
}

// {{concrete}}
class LoanOfficer extends Approver { @Override protected long limit() { return 50_000; } }
class BranchManager extends Approver { @Override protected long limit() { return 500_000; } }
class HeadOffice extends Approver { @Override protected long limit() { return 5_000_000; } }

// {{usage}}
Approver officer = new LoanOfficer();
officer.setNext(new BranchManager()).setNext(new HeadOffice()); // {{wireOnce}} // @step:wire
Decision decision = officer.handle(new Loan("Nusrat", 40_000)); // {{oneEntry}} // @step:submit,done
`

const without = `
// {{withoutIntro}}
class LoanDesk {
    // {{knowsAll}}
    private final LoanOfficer officer = new LoanOfficer();
    private final BranchManager manager = new BranchManager();
    private final HeadOffice headOffice = new HeadOffice();

    Decision submit(Loan loan, String to) { // {{youRoute}} // @step:l1-start
        if (to.equals("officer")) return officer.approve(loan); // {{officerLimit}} // @step:l1-officer
        if (to.equals("manager")) return manager.approve(loan); // {{managerLimit}} // @step:l1-manager
        return headOffice.approve(loan); // {{headLimit}} // @step:l1-head
    }
}

// {{approveBlind}}
interface Signer {
    Decision approve(Loan loan); // {{noCheck}} // @step:l1-sign
}

// {{clientPicks}}
String to = loan.amount() <= 50_000 ? "officer" : loan.amount() <= 500_000 ? "manager" : "head"; // @step:l1-pick
Decision decision = desk.submit(loan, to); // @step:l1-result
// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
class RegionalManager extends Approver { // @step:build-class,regional
    @Override protected long limit() { return 2_000_000; } // {{regionalLimit}} // @step:build-class,regional
}
// {{inherits}}

// {{othersSame}}
class LoanOfficer extends Approver { @Override protected long limit() { return 50_000; } } // @step:hop-officer
class BranchManager extends Approver { @Override protected long limit() { return 500_000; } } // @step:hop-manager
class HeadOffice extends Approver { @Override protected long limit() { return 5_000_000; } } // @step:hop-head

// {{withWire}}
Approver officer = new LoanOfficer();
officer.setNext(new BranchManager()) // @step:wire-new
       .setNext(new RegionalManager()) // {{newLink}} // @step:build-link,wire-new
       .setNext(new HeadOffice()); // @step:wire-new

// {{withSame}}
Decision decision = officer.handle(loan); // {{clientSame}} // @step:client-same,submit-new,done-new
// {{withZero}}
`

export const java: CodeSet = {
  main: { filename: 'LoanApproval.java', source: main },
  without: { filename: 'LoanWithoutChain.java', source: without },
  with: { filename: 'LoanWithChain.java', source: withPattern },
}

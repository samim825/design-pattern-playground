import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{loanType}}
public record Loan(string Customer, decimal Amount);
public record Decision(bool Approved, string By);

// {{handlerType}}
public abstract class Approver
{
    private Approver? _next;
    protected abstract decimal Limit { get; } // {{ownLimit}}

    public Approver SetNext(Approver next) // {{link}} // @step:wire
    {
        _next = next;
        return next; // {{chainable}}
    }

    public Decision Handle(Loan loan) // {{sameDoor}}
    {
        if (loan.Amount <= Limit) // {{canI}} // @step:check
            return new Decision(true, GetType().Name); // {{yesApprove}} // @step:approve
        if (_next is not null) return _next.Handle(loan); // {{passOn}} // @step:pass
        return new Decision(false, "nobody"); // {{endOfChain}} // @step:reject
    }
}

// {{concrete}}
public sealed class LoanOfficer : Approver { protected override decimal Limit => 50_000m; }
public sealed class BranchManager : Approver { protected override decimal Limit => 500_000m; }
public sealed class HeadOffice : Approver { protected override decimal Limit => 5_000_000m; }

// {{usage}}
Approver officer = new LoanOfficer();
officer.SetNext(new BranchManager()).SetNext(new HeadOffice()); // {{wireOnce}} // @step:wire
var decision = officer.Handle(new Loan("Nusrat", 40_000m)); // {{oneEntry}} // @step:submit,done
`

const without = `
// {{withoutIntro}}
public class LoanDesk
{
    // {{knowsAll}}
    private readonly LoanOfficer _officer = new();
    private readonly BranchManager _manager = new();
    private readonly HeadOffice _headOffice = new();

    public Decision Submit(Loan loan, string to) // {{youRoute}} // @step:l1-start
    {
        if (to == "officer") return _officer.Approve(loan); // {{officerLimit}} // @step:l1-officer
        if (to == "manager") return _manager.Approve(loan); // {{managerLimit}} // @step:l1-manager
        return _headOffice.Approve(loan); // {{headLimit}} // @step:l1-head
    }
}

// {{approveBlind}}
public interface ISigner
{
    Decision Approve(Loan loan); // {{noCheck}} // @step:l1-sign
}

// {{clientPicks}}
var to = loan.Amount <= 50_000m ? "officer" : loan.Amount <= 500_000m ? "manager" : "head"; // @step:l1-pick
var decision = desk.Submit(loan, to); // @step:l1-result
// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
public sealed class RegionalManager : Approver // @step:build-class,regional
{
    protected override decimal Limit => 2_000_000m; // {{regionalLimit}} // @step:build-class,regional
}
// {{inherits}}

// {{othersSame}}
public sealed class LoanOfficer : Approver { protected override decimal Limit => 50_000m; } // @step:hop-officer
public sealed class BranchManager : Approver { protected override decimal Limit => 500_000m; } // @step:hop-manager
public sealed class HeadOffice : Approver { protected override decimal Limit => 5_000_000m; } // @step:hop-head

// {{withWire}}
Approver officer = new LoanOfficer();
officer.SetNext(new BranchManager()) // @step:wire-new
       .SetNext(new RegionalManager()) // {{newLink}} // @step:build-link,wire-new
       .SetNext(new HeadOffice()); // @step:wire-new

// {{withSame}}
var decision = officer.Handle(loan); // {{clientSame}} // @step:client-same,submit-new,done-new
// {{withZero}}
`

export const csharp: CodeSet = {
  main: { filename: 'LoanApproval.cs', source: main },
  without: { filename: 'LoanWithoutChain.cs', source: without },
  with: { filename: 'LoanWithChain.cs', source: withPattern },
}

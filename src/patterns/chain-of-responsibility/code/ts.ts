import type { CodeSet } from '@/types/pattern'

/*
 * Conventions (see CLAUDE.md):
 *   // {{key}}        → translated comment from content.<lang>.ts → codeComments[key]
 *   // @step:a,b      → this line lights up while visual step a or b runs (stripped on display)
 * Loan, Decision, desk and loan are left undeclared in the short snippets to keep them small.
 */

const main = `
// {{loanType}}
interface Loan { readonly customer: string; readonly amount: number; }
interface Decision { readonly approved: boolean; readonly by: string; }

// {{handlerType}}
abstract class Approver {
  private next: Approver | null = null;
  protected abstract readonly limit: number; // {{ownLimit}}

  setNext(next: Approver): Approver { // {{link}} // @step:wire
    this.next = next;
    return next; // {{chainable}}
  }

  handle(loan: Loan): Decision { // {{sameDoor}}
    if (loan.amount <= this.limit) { // {{canI}} // @step:check
      return { approved: true, by: this.constructor.name }; // {{yesApprove}} // @step:approve
    }
    if (this.next) return this.next.handle(loan); // {{passOn}} // @step:pass
    return { approved: false, by: 'nobody' }; // {{endOfChain}} // @step:reject
  }
}

// {{concrete}}
class LoanOfficer extends Approver { protected readonly limit = 50_000; }
class BranchManager extends Approver { protected readonly limit = 500_000; }
class HeadOffice extends Approver { protected readonly limit = 5_000_000; }

// {{usage}}
const officer = new LoanOfficer();
officer.setNext(new BranchManager()).setNext(new HeadOffice()); // {{wireOnce}} // @step:wire
const decision = officer.handle({ customer: 'Nusrat', amount: 40_000 }); // {{oneEntry}} // @step:submit,done
`

const without = `
// {{withoutIntro}}
class LoanDesk {
  // {{knowsAll}}
  private readonly officer = new LoanOfficer();
  private readonly manager = new BranchManager();
  private readonly headOffice = new HeadOffice();

  submit(loan: Loan, to: 'officer' | 'manager' | 'head'): Decision { // {{youRoute}} // @step:l1-start
    if (to === 'officer') return this.officer.approve(loan); // {{officerLimit}} // @step:l1-officer
    if (to === 'manager') return this.manager.approve(loan); // {{managerLimit}} // @step:l1-manager
    return this.headOffice.approve(loan); // {{headLimit}} // @step:l1-head
  }
}

// {{approveBlind}}
interface Signer {
  approve(loan: Loan): Decision; // {{noCheck}} // @step:l1-sign
}

// {{clientPicks}}
const to = loan.amount <= 50_000 ? 'officer' : loan.amount <= 500_000 ? 'manager' : 'head'; // @step:l1-pick
const decision = desk.submit(loan, to); // @step:l1-result
// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
class RegionalManager extends Approver { // @step:build-class,regional
  protected readonly limit = 2_000_000; // {{regionalLimit}} // @step:build-class,regional
}
// {{inherits}}

// {{othersSame}}
class LoanOfficer extends Approver { protected readonly limit = 50_000; } // @step:hop-officer
class BranchManager extends Approver { protected readonly limit = 500_000; } // @step:hop-manager
class HeadOffice extends Approver { protected readonly limit = 5_000_000; } // @step:hop-head

// {{withWire}}
const officer = new LoanOfficer();
officer.setNext(new BranchManager()) // @step:wire-new
  .setNext(new RegionalManager()) // {{newLink}} // @step:build-link,wire-new
  .setNext(new HeadOffice()); // @step:wire-new

// {{withSame}}
const decision = officer.handle(loan); // {{clientSame}} // @step:client-same,submit-new,done-new
// {{withZero}}
`

export const ts: CodeSet = {
  main: { filename: 'loan-approval.ts', source: main },
  without: { filename: 'loan-without-chain.ts', source: without },
  with: { filename: 'loan-with-chain.ts', source: withPattern },
}

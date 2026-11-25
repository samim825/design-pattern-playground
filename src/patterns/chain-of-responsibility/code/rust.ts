import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Rust: no inheritance, so each approver is a small struct implementing an `Approver` trait
// (its name and limit), and one `Handler` struct holds the shared logic plus
// `next: Option<Box<Handler>>`. Ownership means the chain is built from the back: each
// set_next takes the rest of the chain.

const main = `
// {{loanType}}
pub struct Loan { pub customer: String, pub amount: u64 }
pub struct Decision { pub approved: bool, pub by: &'static str }

// {{handlerType}}
pub trait Approver {
    fn name(&self) -> &'static str;
    fn limit(&self) -> u64; // {{ownLimit}}
}

pub struct Handler { approver: Box<dyn Approver>, next: Option<Box<Handler>> }

impl Handler {
    pub fn new(approver: impl Approver + 'static) -> Self { Self { approver: Box::new(approver), next: None } }

    pub fn set_next(mut self, next: Handler) -> Self { // {{link}} // @step:wire
        self.next = Some(Box::new(next));
        self // {{chainable}}
    }

    pub fn handle(&self, loan: &Loan) -> Decision { // {{sameDoor}}
        if loan.amount <= self.approver.limit() { // {{canI}} // @step:check
            return Decision { approved: true, by: self.approver.name() }; // {{yesApprove}} // @step:approve
        }
        match &self.next {
            Some(next) => next.handle(loan), // {{passOn}} // @step:pass
            None => Decision { approved: false, by: "nobody" }, // {{endOfChain}} // @step:reject
        }
    }
}

// {{concrete}}
pub struct LoanOfficer;
pub struct BranchManager;
pub struct HeadOffice;
impl Approver for LoanOfficer { fn name(&self) -> &'static str { "LoanOfficer" } fn limit(&self) -> u64 { 50_000 } }
impl Approver for BranchManager { fn name(&self) -> &'static str { "BranchManager" } fn limit(&self) -> u64 { 500_000 } }
impl Approver for HeadOffice { fn name(&self) -> &'static str { "HeadOffice" } fn limit(&self) -> u64 { 5_000_000 } }

// {{usage}}
let officer = Handler::new(LoanOfficer)
    .set_next(Handler::new(BranchManager).set_next(Handler::new(HeadOffice))); // {{wireOnce}} // @step:wire
let decision = officer.handle(&Loan { customer: "Nusrat".into(), amount: 40_000 }); // {{oneEntry}} // @step:submit,done
`

const without = `
// {{withoutIntro}}
// {{knowsAll}}
pub struct LoanDesk { officer: LoanOfficer, manager: BranchManager, head_office: HeadOffice }

impl LoanDesk {
    pub fn submit(&self, loan: &Loan, to: To) -> Decision { // {{youRoute}} // @step:l1-start
        match to {
            To::Officer => self.officer.approve(loan), // {{officerLimit}} // @step:l1-officer
            To::Manager => self.manager.approve(loan), // {{managerLimit}} // @step:l1-manager
            To::Head => self.head_office.approve(loan), // {{headLimit}} // @step:l1-head
        }
    }
}

// {{approveBlind}}
pub trait Signer {
    fn approve(&self, loan: &Loan) -> Decision; // {{noCheck}} // @step:l1-sign
}

// {{clientPicks}}
let to = match loan.amount { 0..=50_000 => To::Officer, 50_001..=500_000 => To::Manager, _ => To::Head }; // @step:l1-pick
let decision = desk.submit(&loan, to); // @step:l1-result
// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
pub struct RegionalManager; // @step:build-class,regional
impl Approver for RegionalManager {
    fn name(&self) -> &'static str { "RegionalManager" }
    fn limit(&self) -> u64 { 2_000_000 } // {{regionalLimit}} // @step:build-class,regional
}
// {{inherits}}

// {{othersSame}}
impl Approver for LoanOfficer { fn name(&self) -> &'static str { "LoanOfficer" } fn limit(&self) -> u64 { 50_000 } } // @step:hop-officer
impl Approver for BranchManager { fn name(&self) -> &'static str { "BranchManager" } fn limit(&self) -> u64 { 500_000 } } // @step:hop-manager
impl Approver for HeadOffice { fn name(&self) -> &'static str { "HeadOffice" } fn limit(&self) -> u64 { 5_000_000 } } // @step:hop-head

// {{withWire}}
let officer = Handler::new(LoanOfficer).set_next( // @step:wire-new
    Handler::new(BranchManager).set_next(
        Handler::new(RegionalManager).set_next(Handler::new(HeadOffice)))); // {{newLink}} // @step:build-link,wire-new

// {{withSame}}
let decision = officer.handle(&loan); // {{clientSame}} // @step:client-same,submit-new,done-new
// {{withZero}}
`

export const rust: CodeSet = {
  main: { filename: 'loan_approval.rs', source: main },
  without: { filename: 'loan_without_chain.rs', source: without },
  with: { filename: 'loan_with_chain.rs', source: withPattern },
}

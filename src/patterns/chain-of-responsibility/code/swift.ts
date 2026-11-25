import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Swift: the handler is a class-bound protocol; setNext and handle live in a protocol extension,
// so each concrete approver only states its limit and its own `next` slot.

const main = `
// {{loanType}}
struct Loan { let customer: String; let amount: Int }
struct Decision { let approved: Bool; let by: String }

// {{handlerType}}
protocol Approver: AnyObject {
    var limit: Int { get } // {{ownLimit}}
    var next: (any Approver)? { get set }
}

extension Approver {
    @discardableResult
    func setNext(_ next: any Approver) -> any Approver { // {{link}} // @step:wire
        self.next = next
        return next // {{chainable}}
    }

    func handle(_ loan: Loan) -> Decision { // {{sameDoor}}
        if loan.amount <= limit { // {{canI}} // @step:check
            return Decision(approved: true, by: String(describing: type(of: self))) // {{yesApprove}} // @step:approve
        }
        if let next { return next.handle(loan) } // {{passOn}} // @step:pass
        return Decision(approved: false, by: "nobody") // {{endOfChain}} // @step:reject
    }
}

// {{concrete}}
final class LoanOfficer: Approver { let limit = 50_000; var next: (any Approver)? }
final class BranchManager: Approver { let limit = 500_000; var next: (any Approver)? }
final class HeadOffice: Approver { let limit = 5_000_000; var next: (any Approver)? }

// {{usage}}
let officer = LoanOfficer()
officer.setNext(BranchManager()).setNext(HeadOffice()) // {{wireOnce}} // @step:wire
let decision = officer.handle(Loan(customer: "Nusrat", amount: 40_000)) // {{oneEntry}} // @step:submit,done
`

const without = `
// {{withoutIntro}}
struct LoanDesk {
    // {{knowsAll}}
    let officer = LoanOfficer()
    let manager = BranchManager()
    let headOffice = HeadOffice()

    enum To { case officer, manager, head }

    func submit(_ loan: Loan, to: To) -> Decision { // {{youRoute}} // @step:l1-start
        switch to {
        case .officer: return officer.approve(loan) // {{officerLimit}} // @step:l1-officer
        case .manager: return manager.approve(loan) // {{managerLimit}} // @step:l1-manager
        case .head: return headOffice.approve(loan) // {{headLimit}} // @step:l1-head
        }
    }
}

// {{approveBlind}}
protocol Signer {
    func approve(_ loan: Loan) -> Decision // {{noCheck}} // @step:l1-sign
}

// {{clientPicks}}
let to: LoanDesk.To = loan.amount <= 50_000 ? .officer : loan.amount <= 500_000 ? .manager : .head // @step:l1-pick
let decision = desk.submit(loan, to: to) // @step:l1-result
// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
final class RegionalManager: Approver { // @step:build-class,regional
    let limit = 2_000_000 // {{regionalLimit}} // @step:build-class,regional
    var next: (any Approver)?
}
// {{inherits}}

// {{othersSame}}
final class LoanOfficer: Approver { let limit = 50_000; var next: (any Approver)? } // @step:hop-officer
final class BranchManager: Approver { let limit = 500_000; var next: (any Approver)? } // @step:hop-manager
final class HeadOffice: Approver { let limit = 5_000_000; var next: (any Approver)? } // @step:hop-head

// {{withWire}}
let officer = LoanOfficer()
officer.setNext(BranchManager()) // @step:wire-new
    .setNext(RegionalManager()) // {{newLink}} // @step:build-link,wire-new
    .setNext(HeadOffice()) // @step:wire-new

// {{withSame}}
let decision = officer.handle(loan) // {{clientSame}} // @step:client-same,submit-new,done-new
// {{withZero}}
`

export const swift: CodeSet = {
  main: { filename: 'LoanApproval.swift', source: main },
  without: { filename: 'LoanWithoutChain.swift', source: without },
  with: { filename: 'LoanWithChain.swift', source: withPattern },
}

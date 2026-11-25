import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Go: no inheritance, so the handler is an interface and one Link struct holds the shared
// handle/pass logic with a `next` field; each concrete approver is a constructor that sets its limit.

const main = `
// {{loanType}}
type Loan struct {
    Customer string
    Amount   int
}
type Decision struct {
    Approved bool
    By       string
}

// {{handlerType}}
type Approver interface {
    SetNext(next Approver) Approver
    Handle(loan Loan) Decision
}

type Link struct {
    Name  string
    Limit int // {{ownLimit}}
    next  Approver
}

func (l *Link) SetNext(next Approver) Approver { // {{link}} // @step:wire
    l.next = next
    return next // {{chainable}}
}

func (l *Link) Handle(loan Loan) Decision { // {{sameDoor}}
    if loan.Amount <= l.Limit { // {{canI}} // @step:check
        return Decision{Approved: true, By: l.Name} // {{yesApprove}} // @step:approve
    }
    if l.next != nil {
        return l.next.Handle(loan) // {{passOn}} // @step:pass
    }
    return Decision{Approved: false, By: "nobody"} // {{endOfChain}} // @step:reject
}

// {{concrete}}
func NewLoanOfficer() *Link   { return &Link{Name: "LoanOfficer", Limit: 50_000} }
func NewBranchManager() *Link { return &Link{Name: "BranchManager", Limit: 500_000} }
func NewHeadOffice() *Link    { return &Link{Name: "HeadOffice", Limit: 5_000_000} }

// {{usage}}
officer := NewLoanOfficer()
officer.SetNext(NewBranchManager()).SetNext(NewHeadOffice()) // {{wireOnce}} // @step:wire
decision := officer.Handle(Loan{Customer: "Nusrat", Amount: 40_000}) // {{oneEntry}} // @step:submit,done
`

const without = `
// {{withoutIntro}}
// {{knowsAll}}
type LoanDesk struct {
    officer    LoanOfficer
    manager    BranchManager
    headOffice HeadOffice
}

func (d *LoanDesk) Submit(loan Loan, to string) Decision { // {{youRoute}} // @step:l1-start
    switch to {
    case "officer":
        return d.officer.Approve(loan) // {{officerLimit}} // @step:l1-officer
    case "manager":
        return d.manager.Approve(loan) // {{managerLimit}} // @step:l1-manager
    default:
        return d.headOffice.Approve(loan) // {{headLimit}} // @step:l1-head
    }
}

// {{approveBlind}}
type Signer interface {
    Approve(loan Loan) Decision // {{noCheck}} // @step:l1-sign
}

// {{clientPicks}}
to := "head"
if loan.Amount <= 50_000 { // @step:l1-pick
    to = "officer"
} else if loan.Amount <= 500_000 { // @step:l1-pick
    to = "manager"
}
decision := desk.Submit(loan, to) // @step:l1-result
// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
func NewRegionalManager() *Link { // @step:build-class,regional
    return &Link{Name: "RegionalManager", Limit: 2_000_000} // {{regionalLimit}} // @step:build-class,regional
}
// {{inherits}}

// {{othersSame}}
func NewLoanOfficer() *Link   { return &Link{Name: "LoanOfficer", Limit: 50_000} } // @step:hop-officer
func NewBranchManager() *Link { return &Link{Name: "BranchManager", Limit: 500_000} } // @step:hop-manager
func NewHeadOffice() *Link    { return &Link{Name: "HeadOffice", Limit: 5_000_000} } // @step:hop-head

// {{withWire}}
officer := NewLoanOfficer()
officer.SetNext(NewBranchManager()). // @step:wire-new
    SetNext(NewRegionalManager()). // {{newLink}} // @step:build-link,wire-new
    SetNext(NewHeadOffice()) // @step:wire-new

// {{withSame}}
decision := officer.Handle(loan) // {{clientSame}} // @step:client-same,submit-new,done-new
// {{withZero}}
`

export const go: CodeSet = {
  main: { filename: 'loan_approval.go', source: main },
  without: { filename: 'loan_without_chain.go', source: without },
  with: { filename: 'loan_with_chain.go', source: withPattern },
}

import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// C++: each handler owns the next one through a std::unique_ptr; setNext returns a reference
// to the new link, so calls can be chained.

const main = `
// {{loanType}}
struct Loan { std::string customer; long amount; };
struct Decision { bool approved; std::string by; };

// {{handlerType}}
class Approver {
public:
    virtual ~Approver() = default;

    Approver& setNext(std::unique_ptr<Approver> n) { // {{link}} // @step:wire
        next = std::move(n);
        return *next; // {{chainable}}
    }

    Decision handle(const Loan& loan) const { // {{sameDoor}}
        if (loan.amount <= limit()) { // {{canI}} // @step:check
            return {true, name()}; // {{yesApprove}} // @step:approve
        }
        if (next) return next->handle(loan); // {{passOn}} // @step:pass
        return {false, "nobody"}; // {{endOfChain}} // @step:reject
    }

protected:
    virtual long limit() const = 0; // {{ownLimit}}
    virtual std::string name() const = 0;

private:
    std::unique_ptr<Approver> next;
};

// {{concrete}}
class LoanOfficer : public Approver {
    long limit() const override { return 50'000; }
    std::string name() const override { return "LoanOfficer"; }
};
class BranchManager : public Approver {
    long limit() const override { return 500'000; }
    std::string name() const override { return "BranchManager"; }
};
class HeadOffice : public Approver {
    long limit() const override { return 5'000'000; }
    std::string name() const override { return "HeadOffice"; }
};

// {{usage}}
auto officer = std::make_unique<LoanOfficer>();
officer->setNext(std::make_unique<BranchManager>()).setNext(std::make_unique<HeadOffice>()); // {{wireOnce}} // @step:wire
Decision decision = officer->handle({"Nusrat", 40'000}); // {{oneEntry}} // @step:submit,done
`

const without = `
// {{withoutIntro}}
class LoanDesk {
    // {{knowsAll}}
    LoanOfficer officer;
    BranchManager manager;
    HeadOffice headOffice;

public:
    Decision submit(const Loan& loan, const std::string& to) { // {{youRoute}} // @step:l1-start
        if (to == "officer") return officer.approve(loan); // {{officerLimit}} // @step:l1-officer
        if (to == "manager") return manager.approve(loan); // {{managerLimit}} // @step:l1-manager
        return headOffice.approve(loan); // {{headLimit}} // @step:l1-head
    }
};

// {{approveBlind}}
class Signer {
public:
    virtual Decision approve(const Loan& loan) = 0; // {{noCheck}} // @step:l1-sign
};

// {{clientPicks}}
std::string to = loan.amount <= 50'000 ? "officer" : loan.amount <= 500'000 ? "manager" : "head"; // @step:l1-pick
Decision decision = desk.submit(loan, to); // @step:l1-result
// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
class RegionalManager : public Approver { // @step:build-class,regional
    long limit() const override { return 2'000'000; } // {{regionalLimit}} // @step:build-class,regional
    std::string name() const override { return "RegionalManager"; }
};
// {{inherits}}

// {{othersSame}}
class LoanOfficer : public Approver { long limit() const override { return 50'000; } std::string name() const override { return "LoanOfficer"; } }; // @step:hop-officer
class BranchManager : public Approver { long limit() const override { return 500'000; } std::string name() const override { return "BranchManager"; } }; // @step:hop-manager
class HeadOffice : public Approver { long limit() const override { return 5'000'000; } std::string name() const override { return "HeadOffice"; } }; // @step:hop-head

// {{withWire}}
auto officer = std::make_unique<LoanOfficer>();
officer->setNext(std::make_unique<BranchManager>()) // @step:wire-new
    .setNext(std::make_unique<RegionalManager>()) // {{newLink}} // @step:build-link,wire-new
    .setNext(std::make_unique<HeadOffice>()); // @step:wire-new

// {{withSame}}
Decision decision = officer->handle(loan); // {{clientSame}} // @step:client-same,submit-new,done-new
// {{withZero}}
`

export const cpp: CodeSet = {
  main: { filename: 'loan_approval.cpp', source: main },
  without: { filename: 'loan_without_chain.cpp', source: without },
  with: { filename: 'loan_with_chain.cpp', source: withPattern },
}

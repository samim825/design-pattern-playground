import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Ruby: `next` is a keyword, so the link is stored in @successor and set with set_next.

const main = `
# {{loanType}}
Loan = Data.define(:customer, :amount)
Decision = Data.define(:approved, :by)

# {{handlerType}}
class Approver
  def limit = raise(NotImplementedError) # {{ownLimit}}

  def set_next(approver) # {{link}} # @step:wire
    @successor = approver
    approver # {{chainable}}
  end

  def handle(loan) # {{sameDoor}}
    if loan.amount <= limit # {{canI}} # @step:check
      return Decision.new(approved: true, by: self.class.name) # {{yesApprove}} # @step:approve
    end
    return @successor.handle(loan) if @successor # {{passOn}} # @step:pass

    Decision.new(approved: false, by: "nobody") # {{endOfChain}} # @step:reject
  end
end

# {{concrete}}
class LoanOfficer < Approver
  def limit = 50_000
end

class BranchManager < Approver
  def limit = 500_000
end

class HeadOffice < Approver
  def limit = 5_000_000
end

# {{usage}}
officer = LoanOfficer.new
officer.set_next(BranchManager.new).set_next(HeadOffice.new) # {{wireOnce}} # @step:wire
decision = officer.handle(Loan.new(customer: "Nusrat", amount: 40_000)) # {{oneEntry}} # @step:submit,done
`

const without = `
# {{withoutIntro}}
class LoanDesk
  # {{knowsAll}}
  def initialize
    @officer = LoanOfficer.new
    @manager = BranchManager.new
    @head_office = HeadOffice.new
  end

  def submit(loan, to) # {{youRoute}} # @step:l1-start
    case to
    when :officer then @officer.approve(loan) # {{officerLimit}} # @step:l1-officer
    when :manager then @manager.approve(loan) # {{managerLimit}} # @step:l1-manager
    else @head_office.approve(loan) # {{headLimit}} # @step:l1-head
    end
  end
end

# {{approveBlind}}
class LoanOfficer
  def approve(loan) = sign(loan) # {{noCheck}} # @step:l1-sign
end

# {{clientPicks}}
to = loan.amount <= 50_000 ? :officer : (loan.amount <= 500_000 ? :manager : :head) # @step:l1-pick
decision = desk.submit(loan, to) # @step:l1-result
# {{withoutCopy}} # @step:l1-copy
`

const withPattern = `
# {{withAdd}}
class RegionalManager < Approver # @step:build-class,regional
  def limit = 2_000_000 # {{regionalLimit}} # @step:build-class,regional
end
# {{inherits}}

# {{othersSame}}
class LoanOfficer < Approver; def limit = 50_000; end # @step:hop-officer
class BranchManager < Approver; def limit = 500_000; end # @step:hop-manager
class HeadOffice < Approver; def limit = 5_000_000; end # @step:hop-head

# {{withWire}}
officer = LoanOfficer.new
officer.set_next(BranchManager.new) # @step:wire-new
       .set_next(RegionalManager.new) # {{newLink}} # @step:build-link,wire-new
       .set_next(HeadOffice.new) # @step:wire-new

# {{withSame}}
decision = officer.handle(loan) # {{clientSame}} # @step:client-same,submit-new,done-new
# {{withZero}}
`

export const ruby: CodeSet = {
  main: { filename: 'loan_approval.rb', source: main },
  without: { filename: 'loan_without_chain.rb', source: without },
  with: { filename: 'loan_with_chain.rb', source: withPattern },
}

import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
<?php
// {{loanType}}
final readonly class Loan
{
    public function __construct(public string $customer, public int $amount) {}
}
final readonly class Decision
{
    public function __construct(public bool $approved, public string $by) {}
}

// {{handlerType}}
abstract class Approver
{
    private ?Approver $next = null;
    abstract protected function limit(): int; // {{ownLimit}}

    public function setNext(Approver $next): Approver // {{link}} // @step:wire
    {
        $this->next = $next;
        return $next; // {{chainable}}
    }

    public function handle(Loan $loan): Decision // {{sameDoor}}
    {
        if ($loan->amount <= $this->limit()) { // {{canI}} // @step:check
            return new Decision(true, static::class); // {{yesApprove}} // @step:approve
        }
        if ($this->next !== null) return $this->next->handle($loan); // {{passOn}} // @step:pass
        return new Decision(false, 'nobody'); // {{endOfChain}} // @step:reject
    }
}

// {{concrete}}
final class LoanOfficer extends Approver { protected function limit(): int { return 50_000; } }
final class BranchManager extends Approver { protected function limit(): int { return 500_000; } }
final class HeadOffice extends Approver { protected function limit(): int { return 5_000_000; } }

// {{usage}}
$officer = new LoanOfficer();
$officer->setNext(new BranchManager())->setNext(new HeadOffice()); // {{wireOnce}} // @step:wire
$decision = $officer->handle(new Loan('Nusrat', 40_000)); // {{oneEntry}} // @step:submit,done
`

const without = `
<?php
// {{withoutIntro}}
final class LoanDesk
{
    // {{knowsAll}}
    public function __construct(
        private LoanOfficer $officer = new LoanOfficer(),
        private BranchManager $manager = new BranchManager(),
        private HeadOffice $headOffice = new HeadOffice(),
    ) {}

    public function submit(Loan $loan, string $to): Decision // {{youRoute}} // @step:l1-start
    {
        return match ($to) {
            'officer' => $this->officer->approve($loan), // {{officerLimit}} // @step:l1-officer
            'manager' => $this->manager->approve($loan), // {{managerLimit}} // @step:l1-manager
            default => $this->headOffice->approve($loan), // {{headLimit}} // @step:l1-head
        };
    }
}

// {{approveBlind}}
interface Signer
{
    public function approve(Loan $loan): Decision; // {{noCheck}} // @step:l1-sign
}

// {{clientPicks}}
$to = $loan->amount <= 50_000 ? 'officer' : ($loan->amount <= 500_000 ? 'manager' : 'head'); // @step:l1-pick
$decision = $desk->submit($loan, $to); // @step:l1-result
// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
<?php
// {{withAdd}}
final class RegionalManager extends Approver // @step:build-class,regional
{
    protected function limit(): int { return 2_000_000; } // {{regionalLimit}} // @step:build-class,regional
}
// {{inherits}}

// {{othersSame}}
final class LoanOfficer extends Approver { protected function limit(): int { return 50_000; } } // @step:hop-officer
final class BranchManager extends Approver { protected function limit(): int { return 500_000; } } // @step:hop-manager
final class HeadOffice extends Approver { protected function limit(): int { return 5_000_000; } } // @step:hop-head

// {{withWire}}
$officer = new LoanOfficer();
$officer->setNext(new BranchManager()) // @step:wire-new
    ->setNext(new RegionalManager()) // {{newLink}} // @step:build-link,wire-new
    ->setNext(new HeadOffice()); // @step:wire-new

// {{withSame}}
$decision = $officer->handle($loan); // {{clientSame}} // @step:client-same,submit-new,done-new
// {{withZero}}
`

export const php: CodeSet = {
  main: { filename: 'LoanApproval.php', source: main },
  without: { filename: 'LoanWithoutChain.php', source: without },
  with: { filename: 'LoanWithChain.php', source: withPattern },
}

import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
<?php
// {{mediator}}
interface ControlTower
{
    public function requestLanding(Aircraft $plane): void;
    public function notify(Aircraft $sender, string $event): void;
}

// {{colleague}}
abstract class Aircraft
{
    public function __construct(
        public readonly string $callSign,
        protected readonly ControlTower $tower, // {{onlyTower}} // @step:only-tower
    ) {}
    public function priority(): bool { return false; } // {{priorityHook}}
    public function askToLand(): void
    {
        $this->tower->requestLanding($this); // {{askTower}} // @step:request
    }
    public function hold(): void { radio($this->callSign . ': holding'); } // @step:hold
    abstract public function land(): void;
}

// {{concreteColleague}}
class PassengerPlane extends Aircraft
{
    public function land(): void
    {
        radio($this->callSign . ': landing with passengers'); // @step:land
        $this->tower->notify($this, 'landed'); // {{reportBack}} // @step:vacate
    }
}

class CargoPlane extends Aircraft
{
    public function land(): void
    {
        radio($this->callSign . ': landing with cargo'); // @step:land
        $this->tower->notify($this, 'landed'); // @step:vacate
    }
}

// {{concreteMediator}}
class SylhetTower implements ControlTower
{
    private bool $runwayFree = true; // {{runwayState}}
    private array $queue = []; // {{waitingLine}}

    public function requestLanding(Aircraft $plane): void
    {
        if ($this->runwayFree) { $this->clear($plane); return; } // @step:check-runway
        if ($plane->priority()) array_unshift($this->queue, $plane); // {{emergencyFirst}} // @step:queue
        else $this->queue[] = $plane; // @step:queue
        $plane->hold(); // @step:hold
    }

    public function notify(Aircraft $sender, string $event): void
    {
        $this->runwayFree = true; // {{runwayBack}} // @step:runway-free
        $next = array_shift($this->queue); // {{nextInLine}} // @step:clear-next
        if ($next !== null) $this->clear($next); // @step:clear-next
    }

    private function clear(Aircraft $plane): void
    {
        $this->runwayFree = false; // {{onlyOne}} // @step:clear,clear-next,conflict
        $plane->land(); // @step:clear,clear-next
    }
}

// {{client}}
$tower = new SylhetTower();
$pa101 = new PassengerPlane('PA-101', $tower); // {{noPlaneKnowsPlane}}
$kc33 = new CargoPlane('KC-33', $tower);
$pa101->askToLand(); // @step:request
`

const without = `
<?php
// {{withoutIntro}}
class Plane
{
    public array $others = []; // {{knowsAll}} // @step:l1-arrive
    public bool $onFinal = false;

    public function tryToLand(Runway $runway): void
    {
        foreach ($this->others as $other) { // {{askEach}} // @step:l1-ask
            if ($other->isLanding()) { $this->hold(); return; } // {{waitTurn}} // @step:l1-hold
        }
        $runway->land($this); // {{hopeClear}} // @step:l1-land
    }

    public function isLanding(): bool
    {
        return $this->onFinal; // @step:l1-reply
    }
}

// {{nobodyGuards}}
function landOn(Runway $runway, Plane $plane): void { $runway->planes[] = $plane; } // @step:l1-conflict

// {{wireUp}}
foreach ([$pa101, $mg207] as $p) { $kc33->others[] = $p; $p->others[] = $kc33; } // {{linksGrow}} // @step:l1-arrive
$kc33->tryToLand($runway); // @step:l1-try
// {{withoutNext}}
`

const withPattern = `
<?php
// {{withAdd}}
class Helicopter extends Aircraft // {{sameBase}} // @step:build-class
{
    public function priority(): bool { return true; } // {{airAmbulance}} // @step:build-priority,h-priority
    public function land(): void
    {
        radio($this->callSign . ': landing with a patient'); // @step:h-land
        $this->tower->notify($this, 'landed'); // {{reportBack}} // @step:h-vacate
    }
}

// {{othersSame}}
class PassengerPlane extends Aircraft { /* … */ } // @step:p-pass
class CargoPlane extends Aircraft { /* … */ } // @step:p-cargo
class SylhetTower implements ControlTower { /* … */ } // {{towerSame}} // @step:t-act

// {{withUse}}
$rescue1 = new Helicopter('Rescue-1', $tower); // {{knowsTower}} // @step:h-create
$rescue1->askToLand(); // {{sameCall}} // @step:h-request
// {{withZero}}
`

export const php: CodeSet = {
  main: { filename: 'ControlTower.php', source: main },
  without: { filename: 'ControlTowerWithoutMediator.php', source: without },
  with: { filename: 'Helicopter.php', source: withPattern },
}

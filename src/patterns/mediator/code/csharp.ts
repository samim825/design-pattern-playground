import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{mediator}}
public interface IControlTower
{
    void RequestLanding(Aircraft plane);
    void Notify(Aircraft sender, string ev);
}

// {{colleague}}
public abstract class Aircraft(string callSign, IControlTower tower) // {{onlyTower}} // @step:only-tower
{
    public string CallSign => callSign;
    protected IControlTower Tower => tower;
    public virtual bool Priority => false; // {{priorityHook}}
    public void AskToLand() => Tower.RequestLanding(this); // {{askTower}} // @step:request
    public void Hold() => Radio(CallSign + ": holding"); // @step:hold
    public abstract void Land();
}

// {{concreteColleague}}
public class PassengerPlane(string callSign, IControlTower tower) : Aircraft(callSign, tower)
{
    public override void Land()
    {
        Radio(CallSign + ": landing with passengers"); // @step:land
        Tower.Notify(this, "landed"); // {{reportBack}} // @step:vacate
    }
}

public class CargoPlane(string callSign, IControlTower tower) : Aircraft(callSign, tower)
{
    public override void Land()
    {
        Radio(CallSign + ": landing with cargo"); // @step:land
        Tower.Notify(this, "landed"); // @step:vacate
    }
}

// {{concreteMediator}}
public class SylhetTower : IControlTower
{
    private bool _runwayFree = true; // {{runwayState}}
    private readonly LinkedList<Aircraft> _queue = new(); // {{waitingLine}}

    public void RequestLanding(Aircraft plane)
    {
        if (_runwayFree) { Clear(plane); return; } // @step:check-runway
        if (plane.Priority) _queue.AddFirst(plane); // {{emergencyFirst}} // @step:queue
        else _queue.AddLast(plane); // @step:queue
        plane.Hold(); // @step:hold
    }

    public void Notify(Aircraft sender, string ev)
    {
        _runwayFree = true; // {{runwayBack}} // @step:runway-free
        var next = _queue.First?.Value; // {{nextInLine}} // @step:clear-next
        if (next != null) { _queue.RemoveFirst(); Clear(next); } // @step:clear-next
    }

    private void Clear(Aircraft plane)
    {
        _runwayFree = false; // {{onlyOne}} // @step:clear,clear-next,conflict
        plane.Land(); // @step:clear,clear-next
    }
}

// {{client}}
var tower = new SylhetTower();
var pa101 = new PassengerPlane("PA-101", tower); // {{noPlaneKnowsPlane}}
var kc33 = new CargoPlane("KC-33", tower);
pa101.AskToLand(); // @step:request
`

const without = `
// {{withoutIntro}}
public class Plane
{
    public List<Plane> Others { get; } = new(); // {{knowsAll}} // @step:l1-arrive
    public bool OnFinal { get; set; }

    public void TryToLand(Runway runway)
    {
        foreach (var other in Others) // {{askEach}} // @step:l1-ask
        {
            if (other.IsLanding()) { Hold(); return; } // {{waitTurn}} // @step:l1-hold
        }
        runway.Land(this); // {{hopeClear}} // @step:l1-land
    }

    public bool IsLanding() => OnFinal; // @step:l1-reply
}

public class Runway
{
    public void Land(Plane plane) => _planes.Add(plane); // {{nobodyGuards}} // @step:l1-conflict
}

// {{wireUp}}
foreach (var p in new[] { pa101, mg207 }) { kc33.Others.Add(p); p.Others.Add(kc33); } // {{linksGrow}} // @step:l1-arrive
kc33.TryToLand(runway); // @step:l1-try
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
public class Helicopter(string callSign, IControlTower tower) : Aircraft(callSign, tower) // {{sameBase}} // @step:build-class
{
    public override bool Priority => true; // {{airAmbulance}} // @step:build-priority,h-priority
    public override void Land()
    {
        Radio(CallSign + ": landing with a patient"); // @step:h-land
        Tower.Notify(this, "landed"); // {{reportBack}} // @step:h-vacate
    }
}

// {{othersSame}}
public class PassengerPlane : Aircraft { /* … */ } // @step:p-pass
public class CargoPlane : Aircraft { /* … */ } // @step:p-cargo
public class SylhetTower : IControlTower { /* … */ } // {{towerSame}} // @step:t-act

// {{withUse}}
var rescue1 = new Helicopter("Rescue-1", tower); // {{knowsTower}} // @step:h-create
rescue1.AskToLand(); // {{sameCall}} // @step:h-request
// {{withZero}}
`

export const csharp: CodeSet = {
  main: { filename: 'ControlTower.cs', source: main },
  without: { filename: 'ControlTowerWithoutMediator.cs', source: without },
  with: { filename: 'Helicopter.cs', source: withPattern },
}

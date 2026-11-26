import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Go: no inheritance, so each plane embeds a base struct that holds the tower, and the shared askToLand is a function that takes any Aircraft.

const main = `
// {{mediator}}
type ControlTower interface {
    RequestLanding(plane Aircraft)
    Notify(sender Aircraft, event string)
}

// {{colleague}}
type Aircraft interface {
    CallSign() string
    Tower() ControlTower
    Priority() bool
    Hold()
    Land()
}

type base struct {
    callSign string
    tower    ControlTower // {{onlyTower}} // @step:only-tower
}

func (b *base) CallSign() string    { return b.callSign }
func (b *base) Tower() ControlTower { return b.tower }
func (b *base) Priority() bool      { return false } // {{priorityHook}}
func (b *base) Hold()               { radio(b.callSign + ": holding") } // @step:hold

func AskToLand(plane Aircraft) {
    plane.Tower().RequestLanding(plane) // {{askTower}} // @step:request
}

// {{concreteColleague}}
type PassengerPlane struct{ base }
type CargoPlane struct{ base }

func (p *PassengerPlane) Land() {
    radio(p.callSign + ": landing with passengers") // @step:land
    p.tower.Notify(p, "landed") // {{reportBack}} // @step:vacate
}

func (c *CargoPlane) Land() {
    radio(c.callSign + ": landing with cargo") // @step:land
    c.tower.Notify(c, "landed") // @step:vacate
}

// {{concreteMediator}}
type SylhetTower struct {
    runwayFree bool       // {{runwayState}}
    queue      []Aircraft // {{waitingLine}}
}

func (t *SylhetTower) RequestLanding(plane Aircraft) {
    if t.runwayFree { t.clear(plane); return } // @step:check-runway
    if plane.Priority() { // {{emergencyFirst}} // @step:queue
        t.queue = append([]Aircraft{plane}, t.queue...) // @step:queue
    } else {
        t.queue = append(t.queue, plane) // @step:queue
    }
    plane.Hold() // @step:hold
}

func (t *SylhetTower) Notify(sender Aircraft, event string) {
    t.runwayFree = true // {{runwayBack}} // @step:runway-free
    if len(t.queue) > 0 { // {{nextInLine}} // @step:clear-next
        next := t.queue[0]; t.queue = t.queue[1:]; t.clear(next) // @step:clear-next
    }
}

func (t *SylhetTower) clear(plane Aircraft) {
    t.runwayFree = false // {{onlyOne}} // @step:clear,clear-next,conflict
    plane.Land() // @step:clear,clear-next
}

// {{client}}
tower := &SylhetTower{runwayFree: true}
pa101 := &PassengerPlane{base{"PA-101", tower}} // {{noPlaneKnowsPlane}}
kc33 := &CargoPlane{base{"KC-33", tower}}
AskToLand(pa101) // @step:request
`

const without = `
// {{withoutIntro}}
type Plane struct {
    CallSign string
    Others   []*Plane // {{knowsAll}} // @step:l1-arrive
    OnFinal  bool
}

func (p *Plane) TryToLand(runway *Runway) {
    for _, other := range p.Others { // {{askEach}} // @step:l1-ask
        if other.IsLanding() { p.Hold(); return } // {{waitTurn}} // @step:l1-hold
    }
    runway.Land(p) // {{hopeClear}} // @step:l1-land
}

func (p *Plane) IsLanding() bool {
    return p.OnFinal // @step:l1-reply
}

func (r *Runway) Land(p *Plane) { r.planes = append(r.planes, p) } // {{nobodyGuards}} // @step:l1-conflict

// {{wireUp}}
for _, p := range []*Plane{pa101, mg207} { kc33.Others = append(kc33.Others, p); p.Others = append(p.Others, kc33) } // {{linksGrow}} // @step:l1-arrive
kc33.TryToLand(runway) // @step:l1-try
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
type Helicopter struct{ base } // {{sameBase}} // @step:build-class

func (h *Helicopter) Priority() bool { return true } // {{airAmbulance}} // @step:build-priority,h-priority

func (h *Helicopter) Land() {
    radio(h.callSign + ": landing with a patient") // @step:h-land
    h.tower.Notify(h, "landed") // {{reportBack}} // @step:h-vacate
}

// {{othersSame}}
type PassengerPlane struct{ base } // @step:p-pass
type CargoPlane struct{ base } // @step:p-cargo
type SylhetTower struct{ /* … */ } // {{towerSame}} // @step:t-act

// {{withUse}}
rescue1 := &Helicopter{base{"Rescue-1", tower}} // {{knowsTower}} // @step:h-create
AskToLand(rescue1) // {{sameCall}} // @step:h-request
// {{withZero}}
`

export const go: CodeSet = {
  main: { filename: 'control_tower.go', source: main },
  without: { filename: 'control_tower_without_mediator.go', source: without },
  with: { filename: 'helicopter.go', source: withPattern },
}

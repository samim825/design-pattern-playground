import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// PHP snippets start with <?php so the highlighter reads them as PHP, not HTML.

const main = `
<?php

readonly class Parcel
{
    public function __construct(public string $item, public string $to) {}
}

readonly class Booking
{
    public function __construct(public string $tracking, public int $fee, public string $eta) {}
}

// {{product}}
interface Transport
{
    public function fee(): int;
    public function deliver(string $to): string;
}

class RickshawVan implements Transport
{
    public function fee(): int { return 60; }
    public function deliver(string $to): string { return 'Through the lanes to ' . $to . ', today'; } // @step:dhaka-deliver
}

class Truck implements Transport
{
    public function fee(): int { return 150; }
    public function deliver(string $to): string { return 'On the highway to ' . $to . ', tomorrow'; } // @step:chattogram-deliver
}

class Launch implements Transport
{
    public function fee(): int { return 120; }
    public function deliver(string $to): string { return 'Down the river to ' . $to . ', overnight'; } // @step:barishal-deliver
}

// {{creator}}
abstract class CourierBranch
{
    // {{factoryMethod}}
    abstract protected function createTransport(): Transport;

    // {{shared}}
    public function sendParcel(Parcel $parcel): Booking
    {
        $transport = $this->createTransport(); // {{noNew}} // @step:call-factory
        $tracking = newTrackingId(); // @step:book
        $eta = $transport->deliver($parcel->to); // @step:deliver
        return new Booking($tracking, $transport->fee(), $eta); // @step:done
    }
}

// {{concreteCreators}}
class DhakaBranch extends CourierBranch
{
    protected function createTransport(): Transport { return new RickshawVan(); } // @step:dhaka-create
}

class ChattogramBranch extends CourierBranch
{
    protected function createTransport(): Transport { return new Truck(); } // @step:chattogram-create
}

class BarishalBranch extends CourierBranch
{
    protected function createTransport(): Transport { return new Launch(); } // @step:barishal-create
}

// {{usage}}
$branch = $branches[$selectedCity]; // @step:pick-branch
$booking = $branch->sendParcel(new Parcel('Saree', $destination)); // @step:client-send,done
`

const without = `
<?php

// {{withoutIntro}}
function sendParcel(Parcel $parcel, string $city): Booking
{
    $transport = match ($city) {
        'dhaka' => new RickshawVan(),
        'chattogram' => new Truck(),
        'barishal' => new Launch(),
        default => throw new InvalidArgumentException('No transport for ' . $city),
    };
    // {{withoutTodo}}

    $tracking = newTrackingId();
    $eta = $transport->deliver($parcel->to);
    return new Booking($tracking, $transport->fee(), $eta);
}
`

const withPattern = `
<?php

// {{withAdd}}
class Drone implements Transport
{
    public function fee(): int { return 200; }
    public function deliver(string $to): string { return 'Flying over the hills to ' . $to; }
}

class SylhetBranch extends CourierBranch
{
    protected function createTransport(): Transport { return new Drone(); }
}

// {{withSame}}
(new SylhetBranch())->sendParcel(new Parcel('Tea', 'Srimangal'));
`

export const php: CodeSet = {
  main: { filename: 'CourierBranch.php', source: main },
  without: { filename: 'CourierWithoutFactoryMethod.php', source: without },
  with: { filename: 'CourierWithFactoryMethod.php', source: withPattern },
}

import type { CodeSet } from '@/types/pattern'

/*
 * Conventions (see CLAUDE.md):
 *   // {{key}}        → translated comment from content.<lang>.ts → codeComments[key]
 *   // @step:a,b      → this line lights up while visual step a or b runs (stripped on display)
 */

const main = `
type Parcel = { item: string; to: string };
type Booking = { tracking: string; fee: number; eta: string };

// {{product}}
interface Transport {
  readonly fee: number;
  deliver(to: string): string;
}

class RickshawVan implements Transport {
  readonly fee = 60;
  deliver(to: string) { return 'Through the lanes to ' + to + ', today'; } // @step:dhaka-deliver
}

class Truck implements Transport {
  readonly fee = 150;
  deliver(to: string) { return 'On the highway to ' + to + ', tomorrow'; } // @step:chattogram-deliver
}

class Launch implements Transport {
  readonly fee = 120;
  deliver(to: string) { return 'Down the river to ' + to + ', overnight'; } // @step:barishal-deliver
}

// {{creator}}
abstract class CourierBranch {
  // {{factoryMethod}}
  protected abstract createTransport(): Transport;

  // {{shared}}
  sendParcel(parcel: Parcel): Booking {
    const transport = this.createTransport(); // {{noNew}} // @step:call-factory
    const tracking = newTrackingId(); // @step:book
    const eta = transport.deliver(parcel.to); // @step:deliver
    return { tracking, fee: transport.fee, eta }; // @step:done
  }
}

// {{concreteCreators}}
class DhakaBranch extends CourierBranch {
  protected createTransport() { return new RickshawVan(); } // @step:dhaka-create
}

class ChattogramBranch extends CourierBranch {
  protected createTransport() { return new Truck(); } // @step:chattogram-create
}

class BarishalBranch extends CourierBranch {
  protected createTransport() { return new Launch(); } // @step:barishal-create
}

// {{usage}}
const branch: CourierBranch = branches[selectedCity]; // @step:pick-branch
const booking = branch.sendParcel({ item: 'Saree', to: destination }); // @step:client-send,done
`

const without = `
// {{withoutIntro}}
function sendParcel(parcel: Parcel, city: string): Booking { // @step:l1-start
  let transport;

  if (city === 'dhaka') { // @step:l1-switch
    transport = new RickshawVan(); // @step:l1-new-van
  } else if (city === 'chattogram') {
    transport = new Truck(); // @step:l1-new-truck
  } else if (city === 'barishal') {
    transport = new Launch(); // @step:l1-new-launch
  } else {
    throw new Error('No transport for ' + city);
  }
  // {{withoutTodo}} // @step:l1-todo

  const tracking = newTrackingId();
  const eta = transport.deliver(parcel.to); // @step:l1-deliver
  return { tracking, fee: transport.fee, eta }; // @step:l1-result
}
`

const withPattern = `
// {{withAdd}}
class Drone implements Transport { // @step:build-product
  readonly fee = 200;
  deliver(to: string) { return 'Flying over the hills to ' + to; } // @step:sylhet-deliver
}

class SylhetBranch extends CourierBranch { // @step:build-creator
  protected createTransport() { return new Drone(); } // @step:build-creator,sylhet-create
}

// {{withSame}}
new SylhetBranch().sendParcel({ item: 'Tea', to: 'Srimangal' }); // @step:sylhet-send,sylhet-done
`

export const ts: CodeSet = {
  main: { filename: 'courier.ts', source: main },
  without: { filename: 'courier-without-factory-method.ts', source: without },
  with: { filename: 'courier-with-factory-method.ts', source: withPattern },
}

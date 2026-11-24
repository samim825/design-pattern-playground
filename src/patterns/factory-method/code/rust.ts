import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Rust has no inheritance: the Creator is a trait whose default method is the shared workflow.

const main = `
pub struct Parcel { pub item: String, pub to: String }
pub struct Booking { pub tracking: String, pub fee: u32, pub eta: String }

// {{product}}
pub trait Transport {
    fn fee(&self) -> u32;
    fn deliver(&self, to: &str) -> String;
}

pub struct RickshawVan;
impl Transport for RickshawVan {
    fn fee(&self) -> u32 { 60 }
    fn deliver(&self, to: &str) -> String { format!("Through the lanes to {to}, today") } // @step:dhaka-deliver
}

pub struct Truck;
impl Transport for Truck {
    fn fee(&self) -> u32 { 150 }
    fn deliver(&self, to: &str) -> String { format!("On the highway to {to}, tomorrow") } // @step:chattogram-deliver
}

pub struct Launch;
impl Transport for Launch {
    fn fee(&self) -> u32 { 120 }
    fn deliver(&self, to: &str) -> String { format!("Down the river to {to}, overnight") } // @step:barishal-deliver
}

// {{creator}}
pub trait CourierBranch {
    // {{factoryMethod}}
    fn create_transport(&self) -> Box<dyn Transport>;

    // {{shared}}
    fn send_parcel(&self, parcel: &Parcel) -> Booking {
        let transport = self.create_transport(); // {{noConcrete}} // @step:call-factory
        let tracking = new_tracking_id(); // @step:book
        let eta = transport.deliver(&parcel.to); // @step:deliver
        Booking { tracking, fee: transport.fee(), eta } // @step:done
    }
}

// {{concreteCreators}}
pub struct DhakaBranch;
impl CourierBranch for DhakaBranch {
    fn create_transport(&self) -> Box<dyn Transport> { Box::new(RickshawVan) } // @step:dhaka-create
}

pub struct ChattogramBranch;
impl CourierBranch for ChattogramBranch {
    fn create_transport(&self) -> Box<dyn Transport> { Box::new(Truck) } // @step:chattogram-create
}

pub struct BarishalBranch;
impl CourierBranch for BarishalBranch {
    fn create_transport(&self) -> Box<dyn Transport> { Box::new(Launch) } // @step:barishal-create
}

// {{usage}}
let branch: &dyn CourierBranch = branch_for(selected_city); // @step:pick-branch
let booking = branch.send_parcel(&Parcel { item: "Saree".into(), to: destination }); // @step:client-send,done
`

const without = `
// {{withoutIntro}}
fn send_parcel(parcel: &Parcel, city: &str) -> Result<Booking, String> { // @step:l1-start
    let transport: Box<dyn Transport> = match city { // @step:l1-switch
        "dhaka" => Box::new(RickshawVan), // @step:l1-new-van
        "chattogram" => Box::new(Truck), // @step:l1-new-truck
        "barishal" => Box::new(Launch), // @step:l1-new-launch
        other => return Err(format!("No transport for {other}")),
    };
    // {{withoutTodo}} // @step:l1-todo

    let tracking = new_tracking_id();
    let eta = transport.deliver(&parcel.to); // @step:l1-deliver
    Ok(Booking { tracking, fee: transport.fee(), eta }) // @step:l1-result
}
`

const withPattern = `
// {{withAdd}}
pub struct Drone; // @step:build-product
impl Transport for Drone {
    fn fee(&self) -> u32 { 200 }
    fn deliver(&self, to: &str) -> String { format!("Flying over the hills to {to}") } // @step:sylhet-deliver
}

pub struct SylhetBranch; // @step:build-creator
impl CourierBranch for SylhetBranch {
    fn create_transport(&self) -> Box<dyn Transport> { Box::new(Drone) } // @step:build-creator,sylhet-create
}

// {{withSame}}
SylhetBranch.send_parcel(&Parcel { item: "Tea".into(), to: "Srimangal".into() }); // @step:sylhet-send,sylhet-done
`

export const rust: CodeSet = {
  main: { filename: 'courier.rs', source: main },
  without: { filename: 'courier_without_factory_method.rs', source: without },
  with: { filename: 'courier_with_factory_method.rs', source: withPattern },
}

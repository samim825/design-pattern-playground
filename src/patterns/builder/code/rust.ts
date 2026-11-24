import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Rust naming: acronyms are camel-cased (Pc, PcBuilder), and an optional GPU is Option<String>.

const main = `
// {{product}}
#[derive(Default)]
pub struct Pc { pub cpu: String, pub ram_gb: u32, pub storage: String, pub gpu: Option<String>, pub casing: String }

// {{builder}}
pub trait ComputerBuilder {
    fn set_cpu(&mut self, cpu: &str);
    fn set_ram(&mut self, gb: u32);
    fn set_storage(&mut self, storage: &str);
    fn set_gpu(&mut self, gpu: &str);
    fn set_casing(&mut self, casing: &str);
}

// {{concreteBuilder}}
#[derive(Default)]
pub struct PcBuilder { pc: Pc }

impl ComputerBuilder for PcBuilder {
    fn set_cpu(&mut self, cpu: &str) { self.pc.cpu = cpu.into(); } // @step:office-cpu,student-cpu,gaming-cpu
    fn set_ram(&mut self, gb: u32) { self.pc.ram_gb = gb; } // @step:office-ram,student-ram,gaming-ram
    fn set_storage(&mut self, s: &str) { self.pc.storage = s.into(); } // @step:office-storage,student-storage,gaming-storage
    fn set_gpu(&mut self, gpu: &str) { self.pc.gpu = Some(gpu.into()); } // @step:gaming-gpu
    fn set_casing(&mut self, c: &str) { self.pc.casing = c.into(); } // @step:office-casing,student-casing,gaming-casing
}

impl PcBuilder {
    pub fn build(self) -> Pc { self.pc } // @step:build
}

// {{director}}
pub struct Technician;

impl Technician {
    pub fn build_office(&self, b: &mut dyn ComputerBuilder) { // @step:director-office
        b.set_cpu("Core i3"); // @step:office-cpu
        b.set_ram(8); // @step:office-ram
        b.set_storage("256GB SSD"); // @step:office-storage
        b.set_casing("Mini tower"); // @step:office-casing
    }

    pub fn build_student(&self, b: &mut dyn ComputerBuilder) { // @step:director-student
        b.set_cpu("Core i5"); // @step:student-cpu
        b.set_ram(16); // @step:student-ram
        b.set_storage("512GB SSD"); // @step:student-storage
        b.set_casing("Mid tower"); // @step:student-casing
    }

    pub fn build_gaming(&self, b: &mut dyn ComputerBuilder) { // @step:director-gaming
        b.set_cpu("Ryzen 7"); // @step:gaming-cpu
        b.set_ram(32); // @step:gaming-ram
        b.set_storage("1TB NVMe"); // @step:gaming-storage
        b.set_gpu("RTX 4060"); // {{optional}} // @step:gaming-gpu
        b.set_casing("RGB tower"); // @step:gaming-casing
    }
}

// {{usage}}
let mut builder = PcBuilder::default(); // @step:new-builder
technician.build_gaming(&mut builder); // {{usagePreset}} // @step:director-office,director-student,director-gaming
let pc = builder.build(); // @step:build,done
`

const without = `
// {{withoutIntro}}
impl Pc {
    pub fn new(
        cpu: &str, // @step:l1-cpu
        ram_gb: u32, // @step:l1-ram
        storage: &str, // @step:l1-storage
        gpu: Option<&str>, // @step:l1-gpu
        casing: &str, // @step:l1-casing
        wifi: bool,
        rgb: bool,
    ) -> Self {
        Self { cpu: cpu.into(), ram_gb, storage: storage.into(), gpu: gpu.map(Into::into), casing: casing.into() }
    }
}

// {{withoutOrder}}
let office = Pc::new("Core i3", 8, "256GB SSD", None, "Mini tower", false, false); // @step:l1-call
let gaming = Pc::new("Ryzen 7", 32, "1TB NVMe", Some("RTX 4060"), "RGB tower", true, true);
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
#[derive(Default)]
pub struct QuotationBuilder { lines: Vec<String>, total: u32 } // @step:build-q-class

impl ComputerBuilder for QuotationBuilder {
    fn set_cpu(&mut self, cpu: &str) { self.add(cpu); } // @step:q-cpu
    fn set_ram(&mut self, gb: u32) { self.add(&format!("{gb}GB RAM")); } // @step:q-ram
    fn set_storage(&mut self, s: &str) { self.add(s); } // @step:q-storage
    fn set_gpu(&mut self, gpu: &str) { self.add(gpu); } // @step:q-gpu
    fn set_casing(&mut self, c: &str) { self.add(c); } // @step:q-casing
}

impl QuotationBuilder {
    pub fn quote(self) -> Quote { Quote { lines: self.lines, total: self.total } } // @step:q-build
    fn add(&mut self, part: &str) {
        self.lines.push(format!("{part}: {}", price_of(part)));
        self.total += price_of(part);
    }
}

// {{withSame}}
let mut quote = QuotationBuilder::default(); // @step:q-new
technician.build_gaming(&mut quote); // @step:q-director
let printed = quote.quote(); // @step:q-done
`

export const rust: CodeSet = {
  main: { filename: 'pc_shop.rs', source: main },
  without: { filename: 'pc_shop_without_builder.rs', source: without },
  with: { filename: 'pc_shop_with_builder.rs', source: withPattern },
}

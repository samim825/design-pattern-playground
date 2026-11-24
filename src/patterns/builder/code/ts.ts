import type { CodeSet } from '@/types/pattern'

/*
 * Conventions (see CLAUDE.md):
 *   // {{key}}        → translated comment from content.<lang>.ts → codeComments[key]
 *   // @step:a,b      → this line lights up while visual step a or b runs (stripped on display)
 */

const main = `
// {{product}}
class PC {
  cpu = '';
  ramGb = 0;
  storage = '';
  gpu?: string;
  casing = '';
}

// {{builder}}
interface ComputerBuilder {
  setCpu(cpu: string): void;
  setRam(gb: number): void;
  setStorage(storage: string): void;
  setGpu(gpu: string): void;
  setCasing(casing: string): void;
}

// {{concreteBuilder}}
class PCBuilder implements ComputerBuilder {
  private pc = new PC();
  setCpu(cpu: string) { this.pc.cpu = cpu; } // @step:office-cpu,student-cpu,gaming-cpu
  setRam(gb: number) { this.pc.ramGb = gb; } // @step:office-ram,student-ram,gaming-ram
  setStorage(s: string) { this.pc.storage = s; } // @step:office-storage,student-storage,gaming-storage
  setGpu(gpu: string) { this.pc.gpu = gpu; } // @step:gaming-gpu
  setCasing(c: string) { this.pc.casing = c; } // @step:office-casing,student-casing,gaming-casing
  build(): PC { return this.pc; } // @step:build
}

// {{director}}
class Technician {
  buildOffice(b: ComputerBuilder) { // @step:director-office
    b.setCpu('Core i3'); // @step:office-cpu
    b.setRam(8); // @step:office-ram
    b.setStorage('256GB SSD'); // @step:office-storage
    b.setCasing('Mini tower'); // @step:office-casing
  }

  buildStudent(b: ComputerBuilder) { // @step:director-student
    b.setCpu('Core i5'); // @step:student-cpu
    b.setRam(16); // @step:student-ram
    b.setStorage('512GB SSD'); // @step:student-storage
    b.setCasing('Mid tower'); // @step:student-casing
  }

  buildGaming(b: ComputerBuilder) { // @step:director-gaming
    b.setCpu('Ryzen 7'); // @step:gaming-cpu
    b.setRam(32); // @step:gaming-ram
    b.setStorage('1TB NVMe'); // @step:gaming-storage
    b.setGpu('RTX 4060'); // {{optional}} // @step:gaming-gpu
    b.setCasing('RGB tower'); // @step:gaming-casing
  }
}

// {{usage}}
const builder = new PCBuilder(); // @step:new-builder
technician.buildGaming(builder); // {{usagePreset}} // @step:director-office,director-student,director-gaming
const pc = builder.build(); // @step:build,done
`

const without = `
// {{withoutIntro}}
class PC {
  constructor(
    public cpu: string, // @step:l1-cpu
    public ramGb: number, // @step:l1-ram
    public storage: string, // @step:l1-storage
    public gpu: string | null, // @step:l1-gpu
    public casing: string, // @step:l1-casing
    public wifi: boolean,
    public rgb: boolean,
  ) {}
}

// {{withoutOrder}}
const office = new PC('Core i3', 8, '256GB SSD', null, 'Mini tower', false, false); // @step:l1-call
const gaming = new PC('Ryzen 7', 32, '1TB NVMe', 'RTX 4060', 'RGB tower', true, true);
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
class QuotationBuilder implements ComputerBuilder { // @step:build-q-class
  private lines: string[] = [];
  private total = 0;
  setCpu(cpu: string) { this.add(cpu); } // @step:q-cpu
  setRam(gb: number) { this.add(gb + 'GB RAM'); } // @step:q-ram
  setStorage(s: string) { this.add(s); } // @step:q-storage
  setGpu(gpu: string) { this.add(gpu); } // @step:q-gpu
  setCasing(c: string) { this.add(c); } // @step:q-casing
  getQuote(): Quote { return { lines: this.lines, total: this.total }; } // @step:q-build

  private add(part: string) {
    this.lines.push(part + ': ' + priceOf(part));
    this.total += priceOf(part);
  }
}

// {{withSame}}
const quote = new QuotationBuilder(); // @step:q-new
technician.buildGaming(quote); // @step:q-director
const printed = quote.getQuote(); // @step:q-done
`

export const ts: CodeSet = {
  main: { filename: 'pc-shop.ts', source: main },
  without: { filename: 'pc-shop-without-builder.ts', source: without },
  with: { filename: 'pc-shop-with-builder.ts', source: withPattern },
}

import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{product}}
class PC {
    String cpu, storage, gpu, casing;
    int ramGb;
}

// {{builder}}
interface ComputerBuilder {
    void setCpu(String cpu);
    void setRam(int gb);
    void setStorage(String storage);
    void setGpu(String gpu);
    void setCasing(String casing);
}

// {{concreteBuilder}}
class PCBuilder implements ComputerBuilder {
    private final PC pc = new PC();
    public void setCpu(String cpu) { pc.cpu = cpu; } // @step:office-cpu,student-cpu,gaming-cpu
    public void setRam(int gb) { pc.ramGb = gb; } // @step:office-ram,student-ram,gaming-ram
    public void setStorage(String s) { pc.storage = s; } // @step:office-storage,student-storage,gaming-storage
    public void setGpu(String gpu) { pc.gpu = gpu; } // @step:gaming-gpu
    public void setCasing(String c) { pc.casing = c; } // @step:office-casing,student-casing,gaming-casing
    public PC build() { return pc; } // @step:build
}

// {{director}}
class Technician {
    void buildOffice(ComputerBuilder b) { // @step:director-office
        b.setCpu("Core i3"); // @step:office-cpu
        b.setRam(8); // @step:office-ram
        b.setStorage("256GB SSD"); // @step:office-storage
        b.setCasing("Mini tower"); // @step:office-casing
    }

    void buildStudent(ComputerBuilder b) { // @step:director-student
        b.setCpu("Core i5"); // @step:student-cpu
        b.setRam(16); // @step:student-ram
        b.setStorage("512GB SSD"); // @step:student-storage
        b.setCasing("Mid tower"); // @step:student-casing
    }

    void buildGaming(ComputerBuilder b) { // @step:director-gaming
        b.setCpu("Ryzen 7"); // @step:gaming-cpu
        b.setRam(32); // @step:gaming-ram
        b.setStorage("1TB NVMe"); // @step:gaming-storage
        b.setGpu("RTX 4060"); // {{optional}} // @step:gaming-gpu
        b.setCasing("RGB tower"); // @step:gaming-casing
    }
}

// {{usage}}
PCBuilder builder = new PCBuilder(); // @step:new-builder
technician.buildGaming(builder); // {{usagePreset}} // @step:director-office,director-student,director-gaming
PC pc = builder.build(); // @step:build,done
`

const without = `
// {{withoutIntro}}
record PC(
    String cpu, // @step:l1-cpu
    int ramGb, // @step:l1-ram
    String storage, // @step:l1-storage
    String gpu, // @step:l1-gpu
    String casing, // @step:l1-casing
    boolean wifi,
    boolean rgb
) {}

// {{withoutOrder}}
var office = new PC("Core i3", 8, "256GB SSD", null, "Mini tower", false, false); // @step:l1-call
var gaming = new PC("Ryzen 7", 32, "1TB NVMe", "RTX 4060", "RGB tower", true, true);
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
class QuotationBuilder implements ComputerBuilder { // @step:build-q-class
    private final List<String> lines = new ArrayList<>();
    private int total;
    public void setCpu(String cpu) { add(cpu); } // @step:q-cpu
    public void setRam(int gb) { add(gb + "GB RAM"); } // @step:q-ram
    public void setStorage(String s) { add(s); } // @step:q-storage
    public void setGpu(String gpu) { add(gpu); } // @step:q-gpu
    public void setCasing(String c) { add(c); } // @step:q-casing
    public Quote getQuote() { return new Quote(lines, total); } // @step:q-build

    private void add(String part) {
        lines.add(part + ": " + priceOf(part));
        total += priceOf(part);
    }
}

// {{withSame}}
var quote = new QuotationBuilder(); // @step:q-new
technician.buildGaming(quote); // @step:q-director
Quote printed = quote.getQuote(); // @step:q-done
`

export const java: CodeSet = {
  main: { filename: 'PCShop.java', source: main },
  without: { filename: 'PCShopWithoutBuilder.java', source: without },
  with: { filename: 'PCShopWithBuilder.java', source: withPattern },
}

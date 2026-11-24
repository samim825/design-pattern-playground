import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{product}}
struct PC { std::string cpu, storage, casing; int ramGb = 0; std::optional<std::string> gpu; };

// {{builder}}
class ComputerBuilder {
public:
    virtual ~ComputerBuilder() = default;
    virtual void setCpu(const std::string& cpu) = 0;
    virtual void setRam(int gb) = 0;
    virtual void setStorage(const std::string& storage) = 0;
    virtual void setGpu(const std::string& gpu) = 0;
    virtual void setCasing(const std::string& casing) = 0;
};

// {{concreteBuilder}}
class PCBuilder : public ComputerBuilder {
    PC pc;
public:
    void setCpu(const std::string& cpu) override { pc.cpu = cpu; } // @step:office-cpu,student-cpu,gaming-cpu
    void setRam(int gb) override { pc.ramGb = gb; } // @step:office-ram,student-ram,gaming-ram
    void setStorage(const std::string& s) override { pc.storage = s; } // @step:office-storage,student-storage,gaming-storage
    void setGpu(const std::string& gpu) override { pc.gpu = gpu; } // @step:gaming-gpu
    void setCasing(const std::string& c) override { pc.casing = c; } // @step:office-casing,student-casing,gaming-casing
    PC build() const { return pc; } // @step:build
};

// {{director}}
class Technician {
public:
    void buildOffice(ComputerBuilder& b) const { // @step:director-office
        b.setCpu("Core i3"); // @step:office-cpu
        b.setRam(8); // @step:office-ram
        b.setStorage("256GB SSD"); // @step:office-storage
        b.setCasing("Mini tower"); // @step:office-casing
    }

    void buildStudent(ComputerBuilder& b) const { // @step:director-student
        b.setCpu("Core i5"); // @step:student-cpu
        b.setRam(16); // @step:student-ram
        b.setStorage("512GB SSD"); // @step:student-storage
        b.setCasing("Mid tower"); // @step:student-casing
    }

    void buildGaming(ComputerBuilder& b) const { // @step:director-gaming
        b.setCpu("Ryzen 7"); // @step:gaming-cpu
        b.setRam(32); // @step:gaming-ram
        b.setStorage("1TB NVMe"); // @step:gaming-storage
        b.setGpu("RTX 4060"); // {{optional}} // @step:gaming-gpu
        b.setCasing("RGB tower"); // @step:gaming-casing
    }
};

// {{usage}}
PCBuilder builder; // @step:new-builder
technician.buildGaming(builder); // {{usagePreset}} // @step:director-office,director-student,director-gaming
PC pc = builder.build(); // @step:build,done
`

const without = `
// {{withoutIntro}}
class PC {
public:
    PC(const std::string& cpu, // @step:l1-cpu
       int ramGb, // @step:l1-ram
       const std::string& storage, // @step:l1-storage
       std::optional<std::string> gpu, // @step:l1-gpu
       const std::string& casing, // @step:l1-casing
       bool wifi,
       bool rgb);
};

// {{withoutOrder}}
PC office("Core i3", 8, "256GB SSD", std::nullopt, "Mini tower", false, false); // @step:l1-call
PC gaming("Ryzen 7", 32, "1TB NVMe", "RTX 4060", "RGB tower", true, true);
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
class QuotationBuilder : public ComputerBuilder { // @step:build-q-class
    std::vector<std::string> lines;
    int total = 0;
    void add(const std::string& part) {
        lines.push_back(part + ": " + std::to_string(priceOf(part)));
        total += priceOf(part);
    }
public:
    void setCpu(const std::string& cpu) override { add(cpu); } // @step:q-cpu
    void setRam(int gb) override { add(std::to_string(gb) + "GB RAM"); } // @step:q-ram
    void setStorage(const std::string& s) override { add(s); } // @step:q-storage
    void setGpu(const std::string& gpu) override { add(gpu); } // @step:q-gpu
    void setCasing(const std::string& c) override { add(c); } // @step:q-casing
    Quote getQuote() const { return {lines, total}; } // @step:q-build
};

// {{withSame}}
QuotationBuilder quote; // @step:q-new
technician.buildGaming(quote); // @step:q-director
Quote printed = quote.getQuote(); // @step:q-done
`

export const cpp: CodeSet = {
  main: { filename: 'pc_shop.cpp', source: main },
  without: { filename: 'pc_shop_without_builder.cpp', source: without },
  with: { filename: 'pc_shop_with_builder.cpp', source: withPattern },
}

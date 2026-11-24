import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{product}}
struct PC {
    var cpu = "", storage = "", casing = ""
    var ramGB = 0
    var gpu: String?
}

// {{builder}}
protocol ComputerBuilder {
    func setCPU(_ cpu: String)
    func setRAM(_ gb: Int)
    func setStorage(_ storage: String)
    func setGPU(_ gpu: String)
    func setCasing(_ casing: String)
}

// {{concreteBuilder}}
final class PCBuilder: ComputerBuilder {
    private var pc = PC()
    func setCPU(_ cpu: String) { pc.cpu = cpu } // @step:office-cpu,student-cpu,gaming-cpu
    func setRAM(_ gb: Int) { pc.ramGB = gb } // @step:office-ram,student-ram,gaming-ram
    func setStorage(_ s: String) { pc.storage = s } // @step:office-storage,student-storage,gaming-storage
    func setGPU(_ gpu: String) { pc.gpu = gpu } // @step:gaming-gpu
    func setCasing(_ c: String) { pc.casing = c } // @step:office-casing,student-casing,gaming-casing
    func build() -> PC { pc } // @step:build
}

// {{director}}
struct Technician {
    func buildOffice(_ b: any ComputerBuilder) { // @step:director-office
        b.setCPU("Core i3") // @step:office-cpu
        b.setRAM(8) // @step:office-ram
        b.setStorage("256GB SSD") // @step:office-storage
        b.setCasing("Mini tower") // @step:office-casing
    }

    func buildStudent(_ b: any ComputerBuilder) { // @step:director-student
        b.setCPU("Core i5") // @step:student-cpu
        b.setRAM(16) // @step:student-ram
        b.setStorage("512GB SSD") // @step:student-storage
        b.setCasing("Mid tower") // @step:student-casing
    }

    func buildGaming(_ b: any ComputerBuilder) { // @step:director-gaming
        b.setCPU("Ryzen 7") // @step:gaming-cpu
        b.setRAM(32) // @step:gaming-ram
        b.setStorage("1TB NVMe") // @step:gaming-storage
        b.setGPU("RTX 4060") // {{optional}} // @step:gaming-gpu
        b.setCasing("RGB tower") // @step:gaming-casing
    }
}

// {{usage}}
let builder = PCBuilder() // @step:new-builder
technician.buildGaming(builder) // {{usagePreset}} // @step:director-office,director-student,director-gaming
let pc = builder.build() // @step:build,done
`

const without = `
// {{withoutIntro}}
struct PC {
    init(
        _ cpu: String, // @step:l1-cpu
        _ ramGB: Int, // @step:l1-ram
        _ storage: String, // @step:l1-storage
        _ gpu: String?, // @step:l1-gpu
        _ casing: String, // @step:l1-casing
        _ wifi: Bool,
        _ rgb: Bool
    ) {}
}

// {{withoutOrder}}
let office = PC("Core i3", 8, "256GB SSD", nil, "Mini tower", false, false) // @step:l1-call
let gaming = PC("Ryzen 7", 32, "1TB NVMe", "RTX 4060", "RGB tower", true, true)
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
final class QuotationBuilder: ComputerBuilder { // @step:build-q-class
    private var lines: [String] = []
    private var total = 0
    func setCPU(_ cpu: String) { add(cpu) } // @step:q-cpu
    func setRAM(_ gb: Int) { add(String(gb) + "GB RAM") } // @step:q-ram
    func setStorage(_ s: String) { add(s) } // @step:q-storage
    func setGPU(_ gpu: String) { add(gpu) } // @step:q-gpu
    func setCasing(_ c: String) { add(c) } // @step:q-casing
    func quote() -> Quote { Quote(lines: lines, total: total) } // @step:q-build

    private func add(_ part: String) {
        lines.append(part + ": " + String(priceOf(part)))
        total += priceOf(part)
    }
}

// {{withSame}}
let quote = QuotationBuilder() // @step:q-new
technician.buildGaming(quote) // @step:q-director
let printed = quote.quote() // @step:q-done
`

export const swift: CodeSet = {
  main: { filename: 'PCShop.swift', source: main },
  without: { filename: 'PCShopWithoutBuilder.swift', source: without },
  with: { filename: 'PCShopWithBuilder.swift', source: withPattern },
}

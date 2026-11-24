import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Go has no constructors or classes: NewPC is a plain function and the Director is a struct.

const main = `
// {{product}}
type PC struct {
    CPU, Storage, GPU, Casing string
    RAMGB                     int
}

// {{builder}}
type ComputerBuilder interface {
    SetCPU(cpu string)
    SetRAM(gb int)
    SetStorage(storage string)
    SetGPU(gpu string)
    SetCasing(casing string)
}

// {{concreteBuilder}}
type PCBuilder struct{ pc PC }

func (b *PCBuilder) SetCPU(cpu string)   { b.pc.CPU = cpu } // @step:office-cpu,student-cpu,gaming-cpu
func (b *PCBuilder) SetRAM(gb int)       { b.pc.RAMGB = gb } // @step:office-ram,student-ram,gaming-ram
func (b *PCBuilder) SetStorage(s string) { b.pc.Storage = s } // @step:office-storage,student-storage,gaming-storage
func (b *PCBuilder) SetGPU(gpu string)   { b.pc.GPU = gpu } // @step:gaming-gpu
func (b *PCBuilder) SetCasing(c string)  { b.pc.Casing = c } // @step:office-casing,student-casing,gaming-casing
func (b *PCBuilder) Build() PC           { return b.pc } // @step:build

// {{director}}
type Technician struct{}

func (Technician) BuildOffice(b ComputerBuilder) { // @step:director-office
    b.SetCPU("Core i3") // @step:office-cpu
    b.SetRAM(8) // @step:office-ram
    b.SetStorage("256GB SSD") // @step:office-storage
    b.SetCasing("Mini tower") // @step:office-casing
}

func (Technician) BuildStudent(b ComputerBuilder) { // @step:director-student
    b.SetCPU("Core i5") // @step:student-cpu
    b.SetRAM(16) // @step:student-ram
    b.SetStorage("512GB SSD") // @step:student-storage
    b.SetCasing("Mid tower") // @step:student-casing
}

func (Technician) BuildGaming(b ComputerBuilder) { // @step:director-gaming
    b.SetCPU("Ryzen 7") // @step:gaming-cpu
    b.SetRAM(32) // @step:gaming-ram
    b.SetStorage("1TB NVMe") // @step:gaming-storage
    b.SetGPU("RTX 4060") // {{optional}} // @step:gaming-gpu
    b.SetCasing("RGB tower") // @step:gaming-casing
}

// {{usage}}
builder := &PCBuilder{} // @step:new-builder
technician.BuildGaming(builder) // {{usagePreset}} // @step:director-office,director-student,director-gaming
pc := builder.Build() // @step:build,done
`

const without = `
// {{withoutIntro}}
func NewPC(
    cpu string, // @step:l1-cpu
    ramGB int, // @step:l1-ram
    storage string, // @step:l1-storage
    gpu string, // @step:l1-gpu
    casing string, // @step:l1-casing
    wifi bool,
    rgb bool,
) PC {
    return PC{CPU: cpu, RAMGB: ramGB, Storage: storage, GPU: gpu, Casing: casing}
}

// {{withoutOrder}}
office := NewPC("Core i3", 8, "256GB SSD", "", "Mini tower", false, false) // @step:l1-call
gaming := NewPC("Ryzen 7", 32, "1TB NVMe", "RTX 4060", "RGB tower", true, true)
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
type QuotationBuilder struct { // @step:build-q-class
    lines []string
    total int
}

func (q *QuotationBuilder) SetCPU(cpu string)   { q.add(cpu) } // @step:q-cpu
func (q *QuotationBuilder) SetRAM(gb int)       { q.add(strconv.Itoa(gb) + "GB RAM") } // @step:q-ram
func (q *QuotationBuilder) SetStorage(s string) { q.add(s) } // @step:q-storage
func (q *QuotationBuilder) SetGPU(gpu string)   { q.add(gpu) } // @step:q-gpu
func (q *QuotationBuilder) SetCasing(c string)  { q.add(c) } // @step:q-casing
func (q *QuotationBuilder) Quote() Quote        { return Quote{q.lines, q.total} } // @step:q-build

func (q *QuotationBuilder) add(part string) {
    q.lines = append(q.lines, part+": "+strconv.Itoa(priceOf(part)))
    q.total += priceOf(part)
}

// {{withSame}}
quote := &QuotationBuilder{} // @step:q-new
technician.BuildGaming(quote) // @step:q-director
printed := quote.Quote() // @step:q-done
`

export const go: CodeSet = {
  main: { filename: 'pc_shop.go', source: main },
  without: { filename: 'pc_shop_without_builder.go', source: without },
  with: { filename: 'pc_shop_with_builder.go', source: withPattern },
}

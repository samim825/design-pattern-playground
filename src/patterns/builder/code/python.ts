import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
from dataclasses import dataclass
from typing import Protocol

# {{product}}
@dataclass
class PC:
    cpu: str = ""
    ram_gb: int = 0
    storage: str = ""
    gpu: str | None = None
    casing: str = ""

# {{builder}}
class ComputerBuilder(Protocol):
    def set_cpu(self, cpu: str) -> None: ...
    def set_ram(self, gb: int) -> None: ...
    def set_storage(self, storage: str) -> None: ...
    def set_gpu(self, gpu: str) -> None: ...
    def set_casing(self, casing: str) -> None: ...

# {{concreteBuilder}}
class PCBuilder:
    def __init__(self) -> None:
        self._pc = PC()

    def set_cpu(self, cpu: str) -> None: self._pc.cpu = cpu  # @step:office-cpu,student-cpu,gaming-cpu
    def set_ram(self, gb: int) -> None: self._pc.ram_gb = gb  # @step:office-ram,student-ram,gaming-ram
    def set_storage(self, s: str) -> None: self._pc.storage = s  # @step:office-storage,student-storage,gaming-storage
    def set_gpu(self, gpu: str) -> None: self._pc.gpu = gpu  # @step:gaming-gpu
    def set_casing(self, c: str) -> None: self._pc.casing = c  # @step:office-casing,student-casing,gaming-casing
    def build(self) -> PC: return self._pc  # @step:build

# {{director}}
class Technician:
    def build_office(self, b: ComputerBuilder) -> None:  # @step:director-office
        b.set_cpu("Core i3")  # @step:office-cpu
        b.set_ram(8)  # @step:office-ram
        b.set_storage("256GB SSD")  # @step:office-storage
        b.set_casing("Mini tower")  # @step:office-casing

    def build_student(self, b: ComputerBuilder) -> None:  # @step:director-student
        b.set_cpu("Core i5")  # @step:student-cpu
        b.set_ram(16)  # @step:student-ram
        b.set_storage("512GB SSD")  # @step:student-storage
        b.set_casing("Mid tower")  # @step:student-casing

    def build_gaming(self, b: ComputerBuilder) -> None:  # @step:director-gaming
        b.set_cpu("Ryzen 7")  # @step:gaming-cpu
        b.set_ram(32)  # @step:gaming-ram
        b.set_storage("1TB NVMe")  # @step:gaming-storage
        b.set_gpu("RTX 4060")  # {{optional}}  # @step:gaming-gpu
        b.set_casing("RGB tower")  # @step:gaming-casing

# {{usage}}
builder = PCBuilder()  # @step:new-builder
technician.build_gaming(builder)  # {{usagePreset}}  # @step:director-office,director-student,director-gaming
pc = builder.build()  # @step:build,done
`

const without = `
# {{withoutIntro}}
@dataclass
class PC:
    cpu: str  # @step:l1-cpu
    ram_gb: int  # @step:l1-ram
    storage: str  # @step:l1-storage
    gpu: str | None  # @step:l1-gpu
    casing: str  # @step:l1-casing
    wifi: bool
    rgb: bool

# {{withoutOrder}}
office = PC("Core i3", 8, "256GB SSD", None, "Mini tower", False, False)  # @step:l1-call
gaming = PC("Ryzen 7", 32, "1TB NVMe", "RTX 4060", "RGB tower", True, True)
# {{withoutTodo}}  # @step:l1-todo
`

const withPattern = `
# {{withAdd}}
class QuotationBuilder:  # @step:build-q-class
    def __init__(self) -> None:
        self._lines: list[str] = []
        self._total = 0

    def set_cpu(self, cpu: str) -> None: self._add(cpu)  # @step:q-cpu
    def set_ram(self, gb: int) -> None: self._add(str(gb) + "GB RAM")  # @step:q-ram
    def set_storage(self, s: str) -> None: self._add(s)  # @step:q-storage
    def set_gpu(self, gpu: str) -> None: self._add(gpu)  # @step:q-gpu
    def set_casing(self, c: str) -> None: self._add(c)  # @step:q-casing
    def get_quote(self) -> Quote: return Quote(self._lines, self._total)  # @step:q-build

    def _add(self, part: str) -> None:
        self._lines.append(part + ": " + str(price_of(part)))
        self._total += price_of(part)

# {{withSame}}
quote = QuotationBuilder()  # @step:q-new
technician.build_gaming(quote)  # @step:q-director
printed = quote.get_quote()  # @step:q-done
`

export const python: CodeSet = {
  main: { filename: 'pc_shop.py', source: main },
  without: { filename: 'pc_shop_without_builder.py', source: without },
  with: { filename: 'pc_shop_with_builder.py', source: withPattern },
}

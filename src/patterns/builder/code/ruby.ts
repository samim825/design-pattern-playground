import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
# {{product}}
PC = Struct.new(:cpu, :ram_gb, :storage, :gpu, :casing)

# {{builder}}
module ComputerBuilder
  def set_cpu(cpu) = raise(NotImplementedError)
  def set_ram(gb) = raise(NotImplementedError)
  def set_storage(storage) = raise(NotImplementedError)
  def set_gpu(gpu) = raise(NotImplementedError)
  def set_casing(casing) = raise(NotImplementedError)
end

# {{concreteBuilder}}
class PCBuilder
  include ComputerBuilder

  def initialize
    @pc = PC.new
  end

  def set_cpu(cpu) = (@pc.cpu = cpu) # @step:office-cpu,student-cpu,gaming-cpu
  def set_ram(gb) = (@pc.ram_gb = gb) # @step:office-ram,student-ram,gaming-ram
  def set_storage(s) = (@pc.storage = s) # @step:office-storage,student-storage,gaming-storage
  def set_gpu(gpu) = (@pc.gpu = gpu) # @step:gaming-gpu
  def set_casing(c) = (@pc.casing = c) # @step:office-casing,student-casing,gaming-casing
  def build = @pc # @step:build
end

# {{director}}
class Technician
  def build_office(b) # @step:director-office
    b.set_cpu("Core i3") # @step:office-cpu
    b.set_ram(8) # @step:office-ram
    b.set_storage("256GB SSD") # @step:office-storage
    b.set_casing("Mini tower") # @step:office-casing
  end

  def build_student(b) # @step:director-student
    b.set_cpu("Core i5") # @step:student-cpu
    b.set_ram(16) # @step:student-ram
    b.set_storage("512GB SSD") # @step:student-storage
    b.set_casing("Mid tower") # @step:student-casing
  end

  def build_gaming(b) # @step:director-gaming
    b.set_cpu("Ryzen 7") # @step:gaming-cpu
    b.set_ram(32) # @step:gaming-ram
    b.set_storage("1TB NVMe") # @step:gaming-storage
    b.set_gpu("RTX 4060") # {{optional}} # @step:gaming-gpu
    b.set_casing("RGB tower") # @step:gaming-casing
  end
end

# {{usage}}
builder = PCBuilder.new # @step:new-builder
technician.build_gaming(builder) # {{usagePreset}} # @step:director-office,director-student,director-gaming
pc = builder.build # @step:build,done
`

const without = `
# {{withoutIntro}}
class PC
  def initialize(
    cpu, # @step:l1-cpu
    ram_gb, # @step:l1-ram
    storage, # @step:l1-storage
    gpu, # @step:l1-gpu
    casing, # @step:l1-casing
    wifi,
    rgb
  )
    @cpu, @ram_gb, @storage, @gpu, @casing = cpu, ram_gb, storage, gpu, casing
  end
end

# {{withoutOrder}}
office = PC.new("Core i3", 8, "256GB SSD", nil, "Mini tower", false, false) # @step:l1-call
gaming = PC.new("Ryzen 7", 32, "1TB NVMe", "RTX 4060", "RGB tower", true, true)
# {{withoutTodo}} # @step:l1-todo
`

const withPattern = `
# {{withAdd}}
class QuotationBuilder # @step:build-q-class
  include ComputerBuilder

  def initialize
    @lines = []
    @total = 0
  end

  def set_cpu(cpu) = add(cpu) # @step:q-cpu
  def set_ram(gb) = add("#{gb}GB RAM") # @step:q-ram
  def set_storage(s) = add(s) # @step:q-storage
  def set_gpu(gpu) = add(gpu) # @step:q-gpu
  def set_casing(c) = add(c) # @step:q-casing
  def quote = Quote.new(@lines, @total) # @step:q-build

  private

  def add(part)
    @lines << "#{part}: #{price_of(part)}"
    @total += price_of(part)
  end
end

# {{withSame}}
quote = QuotationBuilder.new # @step:q-new
technician.build_gaming(quote) # @step:q-director
printed = quote.quote # @step:q-done
`

export const ruby: CodeSet = {
  main: { filename: 'pc_shop.rb', source: main },
  without: { filename: 'pc_shop_without_builder.rb', source: without },
  with: { filename: 'pc_shop_with_builder.rb', source: withPattern },
}

import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{product}}
class PC
{
    public string Cpu = "", Storage = "", Casing = "";
    public int RamGb;
    public string? Gpu;
}

// {{builder}}
interface IComputerBuilder
{
    void SetCpu(string cpu);
    void SetRam(int gb);
    void SetStorage(string storage);
    void SetGpu(string gpu);
    void SetCasing(string casing);
}

// {{concreteBuilder}}
class PCBuilder : IComputerBuilder
{
    private readonly PC pc = new();
    public void SetCpu(string cpu) => pc.Cpu = cpu; // @step:office-cpu,student-cpu,gaming-cpu
    public void SetRam(int gb) => pc.RamGb = gb; // @step:office-ram,student-ram,gaming-ram
    public void SetStorage(string s) => pc.Storage = s; // @step:office-storage,student-storage,gaming-storage
    public void SetGpu(string gpu) => pc.Gpu = gpu; // @step:gaming-gpu
    public void SetCasing(string c) => pc.Casing = c; // @step:office-casing,student-casing,gaming-casing
    public PC Build() => pc; // @step:build
}

// {{director}}
class Technician
{
    public void BuildOffice(IComputerBuilder b) // @step:director-office
    {
        b.SetCpu("Core i3"); // @step:office-cpu
        b.SetRam(8); // @step:office-ram
        b.SetStorage("256GB SSD"); // @step:office-storage
        b.SetCasing("Mini tower"); // @step:office-casing
    }

    public void BuildStudent(IComputerBuilder b) // @step:director-student
    {
        b.SetCpu("Core i5"); // @step:student-cpu
        b.SetRam(16); // @step:student-ram
        b.SetStorage("512GB SSD"); // @step:student-storage
        b.SetCasing("Mid tower"); // @step:student-casing
    }

    public void BuildGaming(IComputerBuilder b) // @step:director-gaming
    {
        b.SetCpu("Ryzen 7"); // @step:gaming-cpu
        b.SetRam(32); // @step:gaming-ram
        b.SetStorage("1TB NVMe"); // @step:gaming-storage
        b.SetGpu("RTX 4060"); // {{optional}} // @step:gaming-gpu
        b.SetCasing("RGB tower"); // @step:gaming-casing
    }
}

// {{usage}}
var builder = new PCBuilder(); // @step:new-builder
technician.BuildGaming(builder); // {{usagePreset}} // @step:director-office,director-student,director-gaming
var pc = builder.Build(); // @step:build,done
`

const without = `
// {{withoutIntro}}
record PC(
    string Cpu, // @step:l1-cpu
    int RamGb, // @step:l1-ram
    string Storage, // @step:l1-storage
    string? Gpu, // @step:l1-gpu
    string Casing, // @step:l1-casing
    bool Wifi,
    bool Rgb);

// {{withoutOrder}}
var office = new PC("Core i3", 8, "256GB SSD", null, "Mini tower", false, false); // @step:l1-call
var gaming = new PC("Ryzen 7", 32, "1TB NVMe", "RTX 4060", "RGB tower", true, true);
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
class QuotationBuilder : IComputerBuilder // @step:build-q-class
{
    private readonly List<string> lines = new();
    private int total;
    public void SetCpu(string cpu) => Add(cpu); // @step:q-cpu
    public void SetRam(int gb) => Add(gb + "GB RAM"); // @step:q-ram
    public void SetStorage(string s) => Add(s); // @step:q-storage
    public void SetGpu(string gpu) => Add(gpu); // @step:q-gpu
    public void SetCasing(string c) => Add(c); // @step:q-casing
    public Quote GetQuote() => new(lines, total); // @step:q-build

    private void Add(string part)
    {
        lines.Add(part + ": " + PriceOf(part));
        total += PriceOf(part);
    }
}

// {{withSame}}
var quote = new QuotationBuilder(); // @step:q-new
technician.BuildGaming(quote); // @step:q-director
var printed = quote.GetQuote(); // @step:q-done
`

export const csharp: CodeSet = {
  main: { filename: 'PCShop.cs', source: main },
  without: { filename: 'PCShopWithoutBuilder.cs', source: without },
  with: { filename: 'PCShopWithBuilder.cs', source: withPattern },
}

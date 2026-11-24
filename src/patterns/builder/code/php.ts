import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// PHP snippets start with <?php so the highlighter reads them as PHP, not HTML.

const main = `
<?php

// {{product}}
class PC
{
    public string $cpu = '';
    public int $ramGb = 0;
    public string $storage = '';
    public ?string $gpu = null;
    public string $casing = '';
}

// {{builder}}
interface ComputerBuilder
{
    public function setCpu(string $cpu): void;
    public function setRam(int $gb): void;
    public function setStorage(string $storage): void;
    public function setGpu(string $gpu): void;
    public function setCasing(string $casing): void;
}

// {{concreteBuilder}}
class PCBuilder implements ComputerBuilder
{
    private PC $pc;
    public function __construct() { $this->pc = new PC(); }
    public function setCpu(string $cpu): void { $this->pc->cpu = $cpu; } // @step:office-cpu,student-cpu,gaming-cpu
    public function setRam(int $gb): void { $this->pc->ramGb = $gb; } // @step:office-ram,student-ram,gaming-ram
    public function setStorage(string $s): void { $this->pc->storage = $s; } // @step:office-storage,student-storage,gaming-storage
    public function setGpu(string $gpu): void { $this->pc->gpu = $gpu; } // @step:gaming-gpu
    public function setCasing(string $c): void { $this->pc->casing = $c; } // @step:office-casing,student-casing,gaming-casing
    public function build(): PC { return $this->pc; } // @step:build
}

// {{director}}
class Technician
{
    public function buildOffice(ComputerBuilder $b): void // @step:director-office
    {
        $b->setCpu('Core i3'); // @step:office-cpu
        $b->setRam(8); // @step:office-ram
        $b->setStorage('256GB SSD'); // @step:office-storage
        $b->setCasing('Mini tower'); // @step:office-casing
    }

    public function buildStudent(ComputerBuilder $b): void // @step:director-student
    {
        $b->setCpu('Core i5'); // @step:student-cpu
        $b->setRam(16); // @step:student-ram
        $b->setStorage('512GB SSD'); // @step:student-storage
        $b->setCasing('Mid tower'); // @step:student-casing
    }

    public function buildGaming(ComputerBuilder $b): void // @step:director-gaming
    {
        $b->setCpu('Ryzen 7'); // @step:gaming-cpu
        $b->setRam(32); // @step:gaming-ram
        $b->setStorage('1TB NVMe'); // @step:gaming-storage
        $b->setGpu('RTX 4060'); // {{optional}} // @step:gaming-gpu
        $b->setCasing('RGB tower'); // @step:gaming-casing
    }
}

// {{usage}}
$builder = new PCBuilder(); // @step:new-builder
$technician->buildGaming($builder); // {{usagePreset}} // @step:director-office,director-student,director-gaming
$pc = $builder->build(); // @step:build,done
`

const without = `
<?php

// {{withoutIntro}}
class PC
{
    public function __construct(
        public string $cpu, // @step:l1-cpu
        public int $ramGb, // @step:l1-ram
        public string $storage, // @step:l1-storage
        public ?string $gpu, // @step:l1-gpu
        public string $casing, // @step:l1-casing
        public bool $wifi,
        public bool $rgb,
    ) {}
}

// {{withoutOrder}}
$office = new PC('Core i3', 8, '256GB SSD', null, 'Mini tower', false, false); // @step:l1-call
$gaming = new PC('Ryzen 7', 32, '1TB NVMe', 'RTX 4060', 'RGB tower', true, true);
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
<?php

// {{withAdd}}
class QuotationBuilder implements ComputerBuilder // @step:build-q-class
{
    private array $lines = [];
    private int $total = 0;
    public function setCpu(string $cpu): void { $this->add($cpu); } // @step:q-cpu
    public function setRam(int $gb): void { $this->add($gb . 'GB RAM'); } // @step:q-ram
    public function setStorage(string $s): void { $this->add($s); } // @step:q-storage
    public function setGpu(string $gpu): void { $this->add($gpu); } // @step:q-gpu
    public function setCasing(string $c): void { $this->add($c); } // @step:q-casing
    public function getQuote(): Quote { return new Quote($this->lines, $this->total); } // @step:q-build

    private function add(string $part): void
    {
        $this->lines[] = $part . ': ' . priceOf($part);
        $this->total += priceOf($part);
    }
}

// {{withSame}}
$quote = new QuotationBuilder(); // @step:q-new
$technician->buildGaming($quote); // @step:q-director
$printed = $quote->getQuote(); // @step:q-done
`

export const php: CodeSet = {
  main: { filename: 'PCShop.php', source: main },
  without: { filename: 'PCShopWithoutBuilder.php', source: without },
  with: { filename: 'PCShopWithBuilder.php', source: withPattern },
}

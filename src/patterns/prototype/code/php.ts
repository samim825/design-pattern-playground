import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// PHP snippets start with <?php so the highlighter reads them as PHP, not HTML.
// "clone" is a PHP keyword, so the prototype method is called copy() here.

const main = `
<?php

// {{prototype}}
interface Prototype
{
    public function copy(): static;
}

// {{concretePrototype}}
class ExamPaper implements Prototype
{
    public array $questions = [];
    public string $set = 'A';

    public function __construct(public string $subject, public int $minutes, public int $marks) {}

    public function copy(): static // @step:clone
    {
        $copy = new static($this->subject, $this->minutes, $this->marks); // {{copyHeader}} // @step:copy-header
        $copy->questions = $this->questions; // {{newList}} // @step:copy-questions
        return $copy; // @step:cloned
    }
}

// {{client}}
function makeSet(Prototype $master, string $label): ExamPaper
{
    $paper = $master->copy(); // {{noRetyping}} // @step:clone
    $paper->set = $label; // @step:label
    shuffle($paper->questions); // @step:shuffle
    return $paper; // @step:done
}

// {{usage}}
$master = $masters[$selectedSubject]; // @step:pick-master
$setB = makeSet($master, 'B'); // @step:make-set,done
`

const without = `
<?php

// {{withoutIntro}}
$setA = new ExamPaper('Class 8 Math', 90, 50, $questions);

// {{withoutRetype}}
$setB = new ExamPaper( // @step:l1-new
    'Class 8 Math', // @step:l1-subject
    90, // @step:l1-minutes
    50, // @step:l1-marks
    $questions, // @step:l1-questions
);
$setB->set = 'B';
printPaper($setB); // @step:l1-check
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
<?php

// {{withAdd}}
class DiagramPaper extends ExamPaper // @step:build-diagram
{
    public array $diagrams = [];

    public function copy(): static // @step:build-diagram,d-clone
    {
        $copy = new static($this->subject, $this->minutes, $this->marks); // @step:d-copy-header
        $copy->questions = $this->questions; // @step:d-copy-questions
        $copy->diagrams = $this->diagrams; // {{copyDiagrams}} // @step:d-copy-diagrams
        return $copy; // @step:d-cloned
    }
}

// {{withSame}}
$setB = makeSet($scienceMaster, 'B'); // @step:d-make-set,d-done
`

export const php: CodeSet = {
  main: { filename: 'ExamPapers.php', source: main },
  without: { filename: 'ExamPapersWithoutPrototype.php', source: without },
  with: { filename: 'ExamPapersWithPrototype.php', source: withPattern },
}

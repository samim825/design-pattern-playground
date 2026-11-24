import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{prototype}}
interface IPrototype<T>
{
    T Clone();
}

// {{concretePrototype}}
class ExamPaper(string subject, int minutes, int marks) : IPrototype<ExamPaper>
{
    public string Subject { get; } = subject;
    public int Minutes { get; } = minutes;
    public int Marks { get; } = marks;
    public List<string> Questions { get; set; } = [];
    public string Set { get; set; } = "A";

    public virtual ExamPaper Clone() // @step:clone
    {
        var copy = new ExamPaper(Subject, Minutes, Marks); // {{copyHeader}} // @step:copy-header
        copy.Questions = [.. Questions]; // {{newList}} // @step:copy-questions
        return copy; // @step:cloned
    }
}

// {{client}}
ExamPaper MakeSet(IPrototype<ExamPaper> master, string label)
{
    var paper = master.Clone(); // {{noRetyping}} // @step:clone
    paper.Set = label; // @step:label
    Shuffle(paper.Questions); // @step:shuffle
    return paper; // @step:done
}

// {{usage}}
IPrototype<ExamPaper> master = masters[selectedSubject]; // @step:pick-master
var setB = MakeSet(master, "B"); // @step:make-set,done
`

const without = `
// {{withoutIntro}}
var setA = new ExamPaper("Class 8 Math", 90, 50, questions);

// {{withoutRetype}}
var setB = new ExamPaper( // @step:l1-new
    "Class 8 Math", // @step:l1-subject
    90, // @step:l1-minutes
    50, // @step:l1-marks
    [.. questions]); // @step:l1-questions
setB.Set = "B";
Print(setB); // @step:l1-check
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
class DiagramPaper(string subject, int minutes, int marks) : ExamPaper(subject, minutes, marks) // @step:build-diagram
{
    public List<string> Diagrams { get; set; } = [];

    public override DiagramPaper Clone() // @step:build-diagram,d-clone
    {
        var copy = new DiagramPaper(Subject, Minutes, Marks); // @step:d-copy-header
        copy.Questions = [.. Questions]; // @step:d-copy-questions
        copy.Diagrams = [.. Diagrams]; // {{copyDiagrams}} // @step:d-copy-diagrams
        return copy; // @step:d-cloned
    }
}

// {{withSame}}
var setB = MakeSet(scienceMaster, "B"); // @step:d-make-set,d-done
`

export const csharp: CodeSet = {
  main: { filename: 'ExamPapers.cs', source: main },
  without: { filename: 'ExamPapersWithoutPrototype.cs', source: without },
  with: { filename: 'ExamPapersWithPrototype.cs', source: withPattern },
}

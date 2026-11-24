import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{prototype}}
interface Prototype<T> {
    T clone();
}

// {{concretePrototype}}
class ExamPaper implements Prototype<ExamPaper> {
    final String subject;
    final int minutes, marks;
    List<String> questions = new ArrayList<>();
    String set = "A";

    ExamPaper(String subject, int minutes, int marks) {
        this.subject = subject; this.minutes = minutes; this.marks = marks;
    }

    @Override
    public ExamPaper clone() { // @step:clone
        ExamPaper copy = new ExamPaper(subject, minutes, marks); // {{copyHeader}} // @step:copy-header
        copy.questions = new ArrayList<>(questions); // {{newList}} // @step:copy-questions
        return copy; // @step:cloned
    }
}

// {{client}}
ExamPaper makeSet(Prototype<ExamPaper> master, String label) {
    ExamPaper paper = master.clone(); // {{noRetyping}} // @step:clone
    paper.set = label; // @step:label
    Collections.shuffle(paper.questions); // @step:shuffle
    return paper; // @step:done
}

// {{usage}}
Prototype<ExamPaper> master = masters.get(selectedSubject); // @step:pick-master
ExamPaper setB = makeSet(master, "B"); // @step:make-set,done
`

const without = `
// {{withoutIntro}}
ExamPaper setA = new ExamPaper("Class 8 Math", 90, 50, questions);

// {{withoutRetype}}
ExamPaper setB = new ExamPaper( // @step:l1-new
    "Class 8 Math", // @step:l1-subject
    90, // @step:l1-minutes
    50, // @step:l1-marks
    new ArrayList<>(questions) // @step:l1-questions
);
setB.set = "B";
print(setB); // @step:l1-check
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
class DiagramPaper extends ExamPaper { // @step:build-diagram
    List<String> diagrams = new ArrayList<>();

    DiagramPaper(String subject, int minutes, int marks) { super(subject, minutes, marks); }

    @Override
    public DiagramPaper clone() { // @step:build-diagram,d-clone
        DiagramPaper copy = new DiagramPaper(subject, minutes, marks); // @step:d-copy-header
        copy.questions = new ArrayList<>(questions); // @step:d-copy-questions
        copy.diagrams = new ArrayList<>(diagrams); // {{copyDiagrams}} // @step:d-copy-diagrams
        return copy; // @step:d-cloned
    }
}

// {{withSame}}
ExamPaper setB = makeSet(scienceMaster, "B"); // @step:d-make-set,d-done
`

export const java: CodeSet = {
  main: { filename: 'ExamPapers.java', source: main },
  without: { filename: 'ExamPapersWithoutPrototype.java', source: without },
  with: { filename: 'ExamPapersWithPrototype.java', source: withPattern },
}

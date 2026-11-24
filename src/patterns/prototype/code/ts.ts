import type { CodeSet } from '@/types/pattern'

/*
 * Conventions (see CLAUDE.md):
 *   // {{key}}        → translated comment from content.<lang>.ts → codeComments[key]
 *   // @step:a,b      → this line lights up while visual step a or b runs (stripped on display)
 */

const main = `
// {{prototype}}
interface Prototype<T> {
  clone(): T;
}

// {{concretePrototype}}
class ExamPaper implements Prototype<ExamPaper> {
  questions: string[] = [];
  set = 'A';

  constructor(public subject: string, public minutes: number, public marks: number) {}

  clone(): ExamPaper { // @step:clone
    const copy = new ExamPaper(this.subject, this.minutes, this.marks); // {{copyHeader}} // @step:copy-header
    copy.questions = [...this.questions]; // {{newList}} // @step:copy-questions
    return copy; // @step:cloned
  }
}

// {{client}}
function makeSet(master: Prototype<ExamPaper>, label: string): ExamPaper {
  const paper = master.clone(); // {{noRetyping}} // @step:clone
  paper.set = label; // @step:label
  shuffle(paper.questions); // @step:shuffle
  return paper; // @step:done
}

// {{usage}}
const master = masters[selectedSubject]; // @step:pick-master
const setB = makeSet(master, 'B'); // @step:make-set,done
`

const without = `
// {{withoutIntro}}
const setA = new ExamPaper('Class 8 Math', 90, 50, questions);

// {{withoutRetype}}
const setB = new ExamPaper( // @step:l1-new
  'Class 8 Math', // @step:l1-subject
  90, // @step:l1-minutes
  50, // @step:l1-marks
  [...questions], // @step:l1-questions
);
setB.set = 'B';
print(setB); // @step:l1-check
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
class DiagramPaper extends ExamPaper { // @step:build-diagram
  diagrams: string[] = [];

  clone(): DiagramPaper { // @step:build-diagram,d-clone
    const copy = new DiagramPaper(this.subject, this.minutes, this.marks); // @step:d-copy-header
    copy.questions = [...this.questions]; // @step:d-copy-questions
    copy.diagrams = [...this.diagrams]; // {{copyDiagrams}} // @step:d-copy-diagrams
    return copy; // @step:d-cloned
  }
}

// {{withSame}}
const setB = makeSet(scienceMaster, 'B'); // @step:d-make-set,d-done
`

export const ts: CodeSet = {
  main: { filename: 'exam-papers.ts', source: main },
  without: { filename: 'exam-papers-without-prototype.ts', source: without },
  with: { filename: 'exam-papers-with-prototype.ts', source: withPattern },
}

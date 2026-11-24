import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Rust's built-in prototype is the Clone trait; it is implemented by hand here to show each copy step.

const main = `
// {{prototype}}
pub trait Paper: Clone {
    fn set_label(&mut self, label: &str);
    fn questions_mut(&mut self) -> &mut Vec<String>;
}

// {{concretePrototype}}
pub struct ExamPaper { pub subject: String, pub minutes: u32, pub marks: u32, pub questions: Vec<String>, pub set: String }

impl Clone for ExamPaper {
    fn clone(&self) -> Self { // @step:clone
        let mut copy = ExamPaper::new(&self.subject, self.minutes, self.marks); // {{copyHeader}} // @step:copy-header
        copy.questions = self.questions.to_vec(); // {{newList}} // @step:copy-questions
        copy // @step:cloned
    }
}

impl Paper for ExamPaper {
    fn set_label(&mut self, label: &str) { self.set = label.into(); }
    fn questions_mut(&mut self) -> &mut Vec<String> { &mut self.questions }
}

// {{client}}
pub fn make_set<P: Paper>(master: &P, label: &str) -> P {
    let mut paper = master.clone(); // {{noRetyping}} // @step:clone
    paper.set_label(label); // @step:label
    paper.questions_mut().shuffle(&mut rand::rng()); // @step:shuffle
    paper // @step:done
}

// {{usage}}
let master = &masters[selected_subject]; // @step:pick-master
let set_b = make_set(master, "B"); // @step:make-set,done
`

const without = `
// {{withoutIntro}}
let set_a = ExamPaper::new("Class 8 Math", 90, 50, questions.to_vec());

// {{withoutRetype}}
let mut set_b = ExamPaper::new( // @step:l1-new
    "Class 8 Math", // @step:l1-subject
    90, // @step:l1-minutes
    50, // @step:l1-marks
    questions.to_vec(), // @step:l1-questions
);
set_b.set = "B".into();
print_paper(&set_b); // @step:l1-check
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
pub struct DiagramPaper { pub base: ExamPaper, pub diagrams: Vec<String> } // @step:build-diagram

impl Clone for DiagramPaper {
    fn clone(&self) -> Self { // @step:build-diagram,d-clone
        let base = ExamPaper::new(&self.base.subject, self.base.minutes, self.base.marks); // @step:d-copy-header
        let questions = self.base.questions.to_vec(); // @step:d-copy-questions
        let diagrams = self.diagrams.to_vec(); // {{copyDiagrams}} // @step:d-copy-diagrams
        DiagramPaper { base: ExamPaper { questions, ..base }, diagrams } // @step:d-cloned
    }
}

impl Paper for DiagramPaper {
    fn set_label(&mut self, label: &str) { self.base.set_label(label); }
    fn questions_mut(&mut self) -> &mut Vec<String> { self.base.questions_mut() }
}

// {{withSame}}
let set_b = make_set(&science_master, "B"); // @step:d-make-set,d-done
`

export const rust: CodeSet = {
  main: { filename: 'exam_papers.rs', source: main },
  without: { filename: 'exam_papers_without_prototype.rs', source: without },
  with: { filename: 'exam_papers_with_prototype.rs', source: withPattern },
}

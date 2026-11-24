import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// C++ calls this the "virtual copy constructor" idiom: a virtual clone() returning a smart pointer.

const main = `
// {{prototype}}
class Paper {
public:
    virtual ~Paper() = default;
    virtual std::unique_ptr<Paper> clone() const = 0;
    std::vector<std::string> questions;
    std::string set = "A";
};

// {{concretePrototype}}
class ExamPaper : public Paper {
public:
    std::string subject;
    int minutes, marks;
    ExamPaper(std::string s, int min, int m) : subject(std::move(s)), minutes(min), marks(m) {}

    std::unique_ptr<Paper> clone() const override { // @step:clone
        auto copy = std::make_unique<ExamPaper>(subject, minutes, marks); // {{copyHeader}} // @step:copy-header
        copy->questions = questions; // {{newList}} // @step:copy-questions
        return copy; // @step:cloned
    }
};

// {{client}}
std::unique_ptr<Paper> makeSet(const Paper& master, const std::string& label) {
    auto paper = master.clone(); // {{noRetyping}} // @step:clone
    paper->set = label; // @step:label
    std::ranges::shuffle(paper->questions, rng); // @step:shuffle
    return paper; // @step:done
}

// {{usage}}
const Paper& master = masterFor(selectedSubject); // @step:pick-master
auto setB = makeSet(master, "B"); // @step:make-set,done
`

const without = `
// {{withoutIntro}}
ExamPaper setA("Class 8 Math", 90, 50, questions);

// {{withoutRetype}}
ExamPaper setB( // @step:l1-new
    "Class 8 Math", // @step:l1-subject
    90, // @step:l1-minutes
    50, // @step:l1-marks
    questions); // @step:l1-questions
setB.set = "B";
print(setB); // @step:l1-check
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
class DiagramPaper : public ExamPaper { // @step:build-diagram
public:
    std::vector<std::string> diagrams;
    using ExamPaper::ExamPaper;

    std::unique_ptr<Paper> clone() const override { // @step:build-diagram,d-clone
        auto copy = std::make_unique<DiagramPaper>(subject, minutes, marks); // @step:d-copy-header
        copy->questions = questions; // @step:d-copy-questions
        copy->diagrams = diagrams; // {{copyDiagrams}} // @step:d-copy-diagrams
        return copy; // @step:d-cloned
    }
};

// {{withSame}}
auto setB = makeSet(scienceMaster, "B"); // @step:d-make-set,d-done
`

export const cpp: CodeSet = {
  main: { filename: 'exam_papers.cpp', source: main },
  without: { filename: 'exam_papers_without_prototype.cpp', source: without },
  with: { filename: 'exam_papers_with_prototype.cpp', source: withPattern },
}

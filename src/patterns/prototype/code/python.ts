import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
from abc import ABC, abstractmethod
import random

# {{prototype}}
class Prototype(ABC):
    @abstractmethod
    def clone(self): ...

# {{concretePrototype}}
class ExamPaper(Prototype):
    def __init__(self, subject: str, minutes: int, marks: int) -> None:
        self.subject, self.minutes, self.marks = subject, minutes, marks
        self.questions: list[str] = []
        self.set = "A"

    def clone(self) -> "ExamPaper":  # @step:clone
        copy = ExamPaper(self.subject, self.minutes, self.marks)  # {{copyHeader}}  # @step:copy-header
        copy.questions = list(self.questions)  # {{newList}}  # @step:copy-questions
        return copy  # @step:cloned

# {{client}}
def make_set(master: Prototype, label: str) -> ExamPaper:
    paper = master.clone()  # {{noRetyping}}  # @step:clone
    paper.set = label  # @step:label
    random.shuffle(paper.questions)  # @step:shuffle
    return paper  # @step:done

# {{usage}}
master = masters[selected_subject]  # @step:pick-master
set_b = make_set(master, "B")  # @step:make-set,done
`

const without = `
# {{withoutIntro}}
set_a = ExamPaper("Class 8 Math", 90, 50, questions)

# {{withoutRetype}}
set_b = ExamPaper(  # @step:l1-new
    "Class 8 Math",  # @step:l1-subject
    90,  # @step:l1-minutes
    50,  # @step:l1-marks
    list(questions),  # @step:l1-questions
)
set_b.set = "B"
print_paper(set_b)  # @step:l1-check
# {{withoutTodo}}  # @step:l1-todo
`

const withPattern = `
# {{withAdd}}
class DiagramPaper(ExamPaper):  # @step:build-diagram
    def __init__(self, subject: str, minutes: int, marks: int) -> None:
        super().__init__(subject, minutes, marks)
        self.diagrams: list[str] = []

    def clone(self) -> "DiagramPaper":  # @step:build-diagram,d-clone
        copy = DiagramPaper(self.subject, self.minutes, self.marks)  # @step:d-copy-header
        copy.questions = list(self.questions)  # @step:d-copy-questions
        copy.diagrams = list(self.diagrams)  # {{copyDiagrams}}  # @step:d-copy-diagrams
        return copy  # @step:d-cloned

# {{withSame}}
set_b = make_set(science_master, "B")  # @step:d-make-set,d-done
`

export const python: CodeSet = {
  main: { filename: 'exam_papers.py', source: main },
  without: { filename: 'exam_papers_without_prototype.py', source: without },
  with: { filename: 'exam_papers_with_prototype.py', source: withPattern },
}

import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Go has no inheritance: Paper is the prototype interface, and DiagramPaper embeds ExamPaper
// and overrides Clone().

const main = `
// {{prototype}}
type Paper interface {
    Clone() Paper
    Base() *ExamPaper
}

// {{concretePrototype}}
type ExamPaper struct {
    Subject        string
    Minutes, Marks int
    Questions      []string
    Set            string
}

func (p *ExamPaper) Base() *ExamPaper { return p }

func (p *ExamPaper) Clone() Paper { // @step:clone
    cp := &ExamPaper{Subject: p.Subject, Minutes: p.Minutes, Marks: p.Marks} // {{copyHeader}} // @step:copy-header
    cp.Questions = slices.Clone(p.Questions) // {{newList}} // @step:copy-questions
    return cp // @step:cloned
}

// {{client}}
func MakeSet(master Paper, label string) Paper {
    paper := master.Clone() // {{noRetyping}} // @step:clone
    paper.Base().Set = label // @step:label
    shuffle(paper.Base().Questions) // @step:shuffle
    return paper // @step:done
}

// {{usage}}
master := masters[selectedSubject] // @step:pick-master
setB := MakeSet(master, "B") // @step:make-set,done
`

const without = `
// {{withoutIntro}}
setA := NewExamPaper("Class 8 Math", 90, 50, questions)

// {{withoutRetype}}
setB := NewExamPaper( // @step:l1-new
    "Class 8 Math", // @step:l1-subject
    90, // @step:l1-minutes
    50, // @step:l1-marks
    slices.Clone(questions), // @step:l1-questions
)
setB.Set = "B"
printPaper(setB) // @step:l1-check
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
type DiagramPaper struct { // @step:build-diagram
    ExamPaper
    Diagrams []string
}

func (p *DiagramPaper) Clone() Paper { // @step:build-diagram,d-clone
    cp := &DiagramPaper{ExamPaper: ExamPaper{Subject: p.Subject, Minutes: p.Minutes, Marks: p.Marks}} // @step:d-copy-header
    cp.Questions = slices.Clone(p.Questions) // @step:d-copy-questions
    cp.Diagrams = slices.Clone(p.Diagrams) // {{copyDiagrams}} // @step:d-copy-diagrams
    return cp // @step:d-cloned
}

// {{withSame}}
setB := MakeSet(scienceMaster, "B") // @step:d-make-set,d-done
`

export const go: CodeSet = {
  main: { filename: 'exam_papers.go', source: main },
  without: { filename: 'exam_papers_without_prototype.go', source: without },
  with: { filename: 'exam_papers_with_prototype.go', source: withPattern },
}

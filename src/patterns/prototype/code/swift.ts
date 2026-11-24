import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Swift arrays are value types, so assigning them already makes an independent copy.

const main = `
// {{prototype}}
protocol Prototype {
    func clone() -> Self
}

// {{concretePrototype}}
class ExamPaper: Prototype {
    let subject: String
    let minutes, marks: Int
    var questions: [String] = []
    var set = "A"

    required init(subject: String, minutes: Int, marks: Int) {
        self.subject = subject; self.minutes = minutes; self.marks = marks
    }

    func clone() -> Self { // @step:clone
        let copy = Self(subject: subject, minutes: minutes, marks: marks) // {{copyHeader}} // @step:copy-header
        copy.questions = questions // {{newList}} // @step:copy-questions
        return copy // @step:cloned
    }
}

// {{client}}
func makeSet(_ master: ExamPaper, label: String) -> ExamPaper {
    let paper = master.clone() // {{noRetyping}} // @step:clone
    paper.set = label // @step:label
    paper.questions.shuffle() // @step:shuffle
    return paper // @step:done
}

// {{usage}}
let master = masters[selectedSubject]! // @step:pick-master
let setB = makeSet(master, label: "B") // @step:make-set,done
`

const without = `
// {{withoutIntro}}
let setA = ExamPaper(subject: "Class 8 Math", minutes: 90, marks: 50, questions: questions)

// {{withoutRetype}}
let setB = ExamPaper( // @step:l1-new
    subject: "Class 8 Math", // @step:l1-subject
    minutes: 90, // @step:l1-minutes
    marks: 50, // @step:l1-marks
    questions: questions // @step:l1-questions
)
setB.set = "B"
printPaper(setB) // @step:l1-check
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
final class DiagramPaper: ExamPaper { // @step:build-diagram
    var diagrams: [String] = []

    override func clone() -> Self { // @step:build-diagram,d-clone
        let copy = Self(subject: subject, minutes: minutes, marks: marks) // @step:d-copy-header
        copy.questions = questions // @step:d-copy-questions
        copy.diagrams = diagrams // {{copyDiagrams}} // @step:d-copy-diagrams
        return copy // @step:d-cloned
    }
}

// {{withSame}}
let setB = makeSet(scienceMaster, label: "B") // @step:d-make-set,d-done
`

export const swift: CodeSet = {
  main: { filename: 'ExamPapers.swift', source: main },
  without: { filename: 'ExamPapersWithoutPrototype.swift', source: without },
  with: { filename: 'ExamPapersWithPrototype.swift', source: withPattern },
}

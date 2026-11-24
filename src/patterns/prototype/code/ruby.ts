import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Ruby objects already have clone; a class customises the copy in initialize_copy.

const main = `
# {{concretePrototype}}
class ExamPaper
  attr_accessor :subject, :minutes, :marks, :questions, :set

  def initialize(subject, minutes, marks)
    @subject, @minutes, @marks = subject, minutes, marks
    @questions = []
    @set = "A"
  end

  # {{prototype}}
  def initialize_copy(source) # @step:clone
    super # {{copyHeader}} # @step:copy-header
    @questions = source.questions.dup # {{newList}} # @step:copy-questions
  end # @step:cloned
end

# {{client}}
def make_set(master, label)
  paper = master.clone # {{noRetyping}} # @step:clone
  paper.set = label # @step:label
  paper.questions.shuffle! # @step:shuffle
  paper # @step:done
end

# {{usage}}
master = MASTERS.fetch(selected_subject) # @step:pick-master
set_b = make_set(master, "B") # @step:make-set,done
`

const without = `
# {{withoutIntro}}
set_a = ExamPaper.new("Class 8 Math", 90, 50, questions)

# {{withoutRetype}}
set_b = ExamPaper.new( # @step:l1-new
  "Class 8 Math", # @step:l1-subject
  90, # @step:l1-minutes
  50, # @step:l1-marks
  questions.dup # @step:l1-questions
)
set_b.set = "B"
print_paper(set_b) # @step:l1-check
# {{withoutTodo}} # @step:l1-todo
`

const withPattern = `
# {{withAdd}}
class DiagramPaper < ExamPaper # @step:build-diagram
  attr_accessor :diagrams

  def initialize(...)
    super
    @diagrams = []
  end

  def initialize_copy(source) # @step:build-diagram,d-clone
    super # @step:d-copy-header,d-copy-questions
    @diagrams = source.diagrams.dup # {{copyDiagrams}} # @step:d-copy-diagrams
  end # @step:d-cloned
end

# {{withSame}}
set_b = make_set(science_master, "B") # @step:d-make-set,d-done
`

export const ruby: CodeSet = {
  main: { filename: 'exam_papers.rb', source: main },
  without: { filename: 'exam_papers_without_prototype.rb', source: without },
  with: { filename: 'exam_papers_with_prototype.rb', source: withPattern },
}

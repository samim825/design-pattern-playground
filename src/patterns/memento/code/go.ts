import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Go: no classes or friends; privacy is per package. Snapshot is exported but its fields are not, so code
// outside package post (History, the app) can hold a Snapshot but never read inside it.

const main = `
package post

type Audience string

// {{memento}}
type Snapshot struct { // {{opaque}} // @step:sealed
    savedAt  string
    text     string // {{onlyEditor}}
    price    int
    audience Audience
}

// {{originator}}
type PostEditor struct {
    text     string   // {{privateFields}} // @step:private
    price    int      // @step:private
    audience Audience // @step:private
}

func (e *PostEditor) SetText(text string)     { e.text = text } // @step:edit
func (e *PostEditor) SetPrice(taka int)       { e.price = taka } // @step:edit
func (e *PostEditor) SetAudience(a Audience)  { e.audience = a } // @step:edit

func (e *PostEditor) Save() Snapshot {
    return Snapshot{now(), e.text, e.price, e.audience} // {{packsItself}} // @step:save
}

func (e *PostEditor) Restore(s Snapshot) { // {{onlyEditorOpens}} // @step:restore
    e.text, e.price, e.audience = s.text, s.price, s.audience // @step:restore
}

package app

// {{caretaker}}
type History struct {
    stack []post.Snapshot // {{neverLooks}}
}

func (h *History) Push(s post.Snapshot) { h.stack = append(h.stack, s) } // @step:push

func (h *History) Pop() (post.Snapshot, bool) {
    if len(h.stack) == 0 { return post.Snapshot{}, false } // {{lastFirst}} // @step:pop,empty
    s := h.stack[len(h.stack)-1]; h.stack = h.stack[:len(h.stack)-1] // @step:pop
    return s, true
}

// {{client}}
editor := &post.PostEditor{}
history := &History{}
history.Push(editor.Save()) // {{saveBeforeRisk}} // @step:click-save
editor.SetPrice(300) // {{oops}} // @step:edit
last, ok := history.Pop() // {{undoButton}} // @step:undo
if ok { editor.Restore(last) } // {{nothingToUndo}} // @step:restore,empty
publish(editor) // @step:publish
`

const without = `
// {{withoutIntro}}
type PostEditor struct {
    Text     string   // {{publicFields}} // @step:l1-edit
    Price    int      // @step:l1-edit
    Audience Audience // @step:l1-edit
}

type postCopy struct { text string; price int; audience Audience }

// {{uiCode}}
type PostScreen struct {
    editor  *PostEditor
    backups []postCopy // {{ownStack}}
}

func (p *PostScreen) OnSave() {
    e := p.editor // {{knowsEveryField}}
    p.backups = append(p.backups, postCopy{e.Text, e.Price, e.Audience}) // {{copyEach}} // @step:l1-copy
}

func (p *PostScreen) OnUndo() {
    if len(p.backups) == 0 { return } // @step:l1-pop
    b := p.backups[len(p.backups)-1]; p.backups = p.backups[:len(p.backups)-1] // @step:l1-pop
    p.editor.Text = b.text // {{copyBack}} // @step:l1-undo
    p.editor.Price = b.price // @step:l1-undo
    p.editor.Audience = b.audience // {{easyToMiss}} // @step:l1-undo
}

screen.OnSave() // @step:l1-save
editor.Price = 300 // {{oops}} // @step:l1-edit
screen.OnUndo() // @step:l1-undo-call
publish(editor) // @step:l1-post
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
type Snapshot struct {
    savedAt, text string
    price         int
    audience      Audience
    photo         *Photo // {{newField}} // @step:build-field
}

type PostEditor struct {
    // {{asBefore}}
    photo *Photo // {{photoPrivate}} // @step:build-field
}

func (e *PostEditor) SetPhoto(p *Photo) { e.photo = p } // @step:w-edit

func (e *PostEditor) Save() Snapshot {
    return Snapshot{now(), e.text, e.price, e.audience, e.photo} // {{savesPhoto}} // @step:w-save
}

func (e *PostEditor) Restore(s Snapshot) {
    e.text, e.price, e.audience, e.photo = s.text, s.price, s.audience, s.photo // @step:w-restore
}

// {{othersSame}}
type History struct{ /* … */ } // {{historySame}} // @step:build-same,w-push,w-pop

// {{clientSame}}
history.Push(editor.Save()) // @step:w-click-save
editor.SetPhoto(nil) // {{oopsPhoto}} // @step:w-edit
if last, ok := history.Pop(); ok { editor.Restore(last) } // {{sameUndo}} // @step:w-undo
publish(editor) // @step:w-publish
// {{withZero}}
`

export const go: CodeSet = {
  main: { filename: 'post_editor.go', source: main },
  without: { filename: 'post_editor_without_memento.go', source: without },
  with: { filename: 'post_editor_photo.go', source: withPattern },
}

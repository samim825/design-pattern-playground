import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Swift: PostSnapshot and PostEditor share one file, so fileprivate lets only the editor read the snapshot;
// History lives in another file and only sees the Snapshot protocol.

const main = `
enum Audience { case everyone, friends }

// {{memento}}
protocol Snapshot { var savedAt: String { get } } // {{opaque}} // @step:sealed

struct PostSnapshot: Snapshot { // {{onlyEditor}}
    let savedAt: String
    fileprivate let text: String
    fileprivate let price: Int
    fileprivate let audience: Audience
}

// {{originator}}
final class PostEditor {
    private var text = "" // {{privateFields}} // @step:private
    private var price = 0 // @step:private
    private var audience = Audience.friends // @step:private

    func setText(_ text: String) { self.text = text } // @step:edit
    func setPrice(_ taka: Int) { price = taka } // @step:edit
    func setAudience(_ a: Audience) { audience = a } // @step:edit

    func save() -> any Snapshot {
        PostSnapshot(savedAt: now(), text: text, price: price, audience: audience) // {{packsItself}} // @step:save
    }

    func restore(_ s: any Snapshot) {
        guard let p = s as? PostSnapshot else { return } // {{onlyEditorOpens}} // @step:restore
        (text, price, audience) = (p.text, p.price, p.audience) // @step:restore
    }
}

// {{caretaker}}
final class History {
    private var stack: [any Snapshot] = [] // {{neverLooks}}
    func push(_ s: any Snapshot) { stack.append(s) } // @step:push
    func pop() -> (any Snapshot)? { stack.popLast() } // {{lastFirst}} // @step:pop,empty
}

// {{client}}
let editor = PostEditor()
let history = History()
history.push(editor.save()) // {{saveBeforeRisk}} // @step:click-save
editor.setPrice(300) // {{oops}} // @step:edit
let last = history.pop() // {{undoButton}} // @step:undo
if let last { editor.restore(last) } // {{nothingToUndo}} // @step:restore,empty
publish(editor) // @step:publish
`

const without = `
// {{withoutIntro}}
final class PostEditor {
    var text = "" // {{publicFields}} // @step:l1-edit
    var price = 0 // @step:l1-edit
    var audience = Audience.friends // @step:l1-edit
}

// {{uiCode}}
final class PostScreen {
    private let editor: PostEditor
    private var backups: [(text: String, price: Int, audience: Audience)] = [] // {{ownStack}}
    init(editor: PostEditor) { self.editor = editor }

    func onSave() {
        let e = editor // {{knowsEveryField}}
        backups.append((e.text, e.price, e.audience)) // {{copyEach}} // @step:l1-copy
    }

    func onUndo() {
        guard let b = backups.popLast() else { return } // @step:l1-pop
        editor.text = b.text // {{copyBack}} // @step:l1-undo
        editor.price = b.price // @step:l1-undo
        editor.audience = b.audience // {{easyToMiss}} // @step:l1-undo
    }
}

screen.onSave() // @step:l1-save
editor.price = 300 // {{oops}} // @step:l1-edit
screen.onUndo() // @step:l1-undo-call
publish(editor) // @step:l1-post
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
struct PostSnapshot: Snapshot {
    let savedAt: String
    fileprivate let text: String, price: Int, audience: Audience
    fileprivate let photo: Photo? // {{newField}} // @step:build-field
}

final class PostEditor {
    // {{asBefore}}
    private var photo: Photo? // {{photoPrivate}} // @step:build-field
    func setPhoto(_ p: Photo?) { photo = p } // @step:w-edit

    func save() -> any Snapshot {
        PostSnapshot(savedAt: now(), text: text, price: price, audience: audience, photo: photo) // {{savesPhoto}} // @step:w-save
    }
    func restore(_ s: any Snapshot) {
        guard let p = s as? PostSnapshot else { return } // @step:w-restore
        (text, price, audience, photo) = (p.text, p.price, p.audience, p.photo) // @step:w-restore
    }
}

// {{othersSame}}
final class History { /* … */ } // {{historySame}} // @step:build-same,w-push,w-pop

// {{clientSame}}
history.push(editor.save()) // @step:w-click-save
editor.setPhoto(nil) // {{oopsPhoto}} // @step:w-edit
if let last = history.pop() { editor.restore(last) } // {{sameUndo}} // @step:w-undo
publish(editor) // @step:w-publish
// {{withZero}}
`

export const swift: CodeSet = {
  main: { filename: 'PostEditor.swift', source: main },
  without: { filename: 'PostEditorWithoutMemento.swift', source: without },
  with: { filename: 'PostEditorPhoto.swift', source: withPattern },
}

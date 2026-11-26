import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Python: privacy is by convention only — the leading underscore marks _PostSnapshot and the editor's fields
// as "don't touch", and frozen=True makes the snapshot immutable.

const main = `
from dataclasses import dataclass
from typing import Literal

Audience = Literal["Public", "Friends"]

# {{memento}}
@dataclass(frozen=True)
class _PostSnapshot:  # {{opaque}} # @step:sealed
    saved_at: str
    text: str  # {{onlyEditor}}
    price: int
    audience: Audience

# {{originator}}
class PostEditor:
    def __init__(self) -> None:
        self._text = ""  # {{privateFields}} # @step:private
        self._price = 0  # @step:private
        self._audience: Audience = "Friends"  # @step:private

    def set_text(self, text: str) -> None: self._text = text  # @step:edit
    def set_price(self, taka: int) -> None: self._price = taka  # @step:edit
    def set_audience(self, a: Audience) -> None: self._audience = a  # @step:edit

    def save(self) -> _PostSnapshot:
        return _PostSnapshot(now(), self._text, self._price, self._audience)  # {{packsItself}} # @step:save

    def restore(self, s: _PostSnapshot) -> None:  # {{onlyEditorOpens}} # @step:restore
        self._text, self._price, self._audience = s.text, s.price, s.audience  # @step:restore

# {{caretaker}}
class History:
    def __init__(self) -> None:
        self._stack: list[_PostSnapshot] = []  # {{neverLooks}}

    def push(self, s: _PostSnapshot) -> None: self._stack.append(s)  # @step:push
    def pop(self) -> _PostSnapshot | None:
        return self._stack.pop() if self._stack else None  # {{lastFirst}} # @step:pop,empty

# {{client}}
editor = PostEditor()
history = History()
history.push(editor.save())  # {{saveBeforeRisk}} # @step:click-save
editor.set_price(300)  # {{oops}} # @step:edit
last = history.pop()  # {{undoButton}} # @step:undo
if last: editor.restore(last)  # {{nothingToUndo}} # @step:restore,empty
publish(editor)  # @step:publish
`

const without = `
# {{withoutIntro}}
class PostEditor:
    def __init__(self) -> None:
        self.text = ""  # {{publicFields}} # @step:l1-edit
        self.price = 0  # @step:l1-edit
        self.audience = "Friends"  # @step:l1-edit

# {{uiCode}}
class PostScreen:
    def __init__(self, editor: PostEditor) -> None:
        self.editor = editor
        self.backups: list[dict] = []  # {{ownStack}}

    def on_save(self) -> None:
        e = self.editor  # {{knowsEveryField}}
        self.backups.append({"text": e.text, "price": e.price, "audience": e.audience})  # {{copyEach}} # @step:l1-copy

    def on_undo(self) -> None:
        if not self.backups: return  # @step:l1-pop
        b = self.backups.pop()  # @step:l1-pop
        self.editor.text = b["text"]  # {{copyBack}} # @step:l1-undo
        self.editor.price = b["price"]  # @step:l1-undo
        self.editor.audience = b["audience"]  # {{easyToMiss}} # @step:l1-undo

screen.on_save()  # @step:l1-save
editor.price = 300  # {{oops}} # @step:l1-edit
screen.on_undo()  # @step:l1-undo-call
publish(editor)  # @step:l1-post
# {{withoutNext}}
`

const withPattern = `
# {{withAdd}}
@dataclass(frozen=True)
class _PostSnapshot:
    saved_at: str
    text: str
    price: int
    audience: Audience
    photo: Photo | None  # {{newField}} # @step:build-field

class PostEditor:
    # {{asBefore}}
    _photo: Photo | None = None  # {{photoPrivate}} # @step:build-field
    def set_photo(self, p: Photo | None) -> None: self._photo = p  # @step:w-edit

    def save(self) -> _PostSnapshot:
        return _PostSnapshot(now(), self._text, self._price, self._audience, self._photo)  # {{savesPhoto}} # @step:w-save

    def restore(self, s: _PostSnapshot) -> None:
        self._text, self._price, self._audience, self._photo = s.text, s.price, s.audience, s.photo  # @step:w-restore

# {{othersSame}}
class History: ...  # {{historySame}} # @step:build-same,w-push,w-pop

# {{clientSame}}
history.push(editor.save())  # @step:w-click-save
editor.set_photo(None)  # {{oopsPhoto}} # @step:w-edit
editor.restore(history.pop())  # {{sameUndo}} # @step:w-undo
publish(editor)  # @step:w-publish
# {{withZero}}
`

export const python: CodeSet = {
  main: { filename: 'post_editor.py', source: main },
  without: { filename: 'post_editor_without_memento.py', source: without },
  with: { filename: 'post_editor_photo.py', source: withPattern },
}

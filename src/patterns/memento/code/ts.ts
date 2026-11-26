import type { CodeSet } from '@/types/pattern'

/*
 * Conventions (see CLAUDE.md):
 *   // {{key}}        → translated comment from content.<lang>.ts → codeComments[key]
 *   // @step:a,b      → this line lights up while visual step a or b runs (stripped on display)
 * now() (a timestamp) and publish() (posts to the Golpo feed) are left undeclared to keep the snippets small.
 * TS has no "friend" classes: History only sees the Snapshot interface (savedAt), and PostSnapshot is not
 * exported, so only PostEditor in this module opens it.
 */

const main = `
type Audience = 'Public' | 'Friends';

// {{memento}}
export interface Snapshot { readonly savedAt: string; } // {{opaque}} // @step:sealed

class PostSnapshot implements Snapshot { // {{onlyEditor}}
  constructor(
    readonly savedAt: string,
    readonly text: string,
    readonly price: number,
    readonly audience: Audience,
  ) {}
}

// {{originator}}
export class PostEditor {
  private text = ''; // {{privateFields}} // @step:private
  private price = 0; // @step:private
  private audience: Audience = 'Friends'; // @step:private

  setText(text: string): void { this.text = text; } // @step:edit
  setPrice(taka: number): void { this.price = taka; } // @step:edit
  setAudience(a: Audience): void { this.audience = a; } // @step:edit

  save(): Snapshot {
    return new PostSnapshot(now(), this.text, this.price, this.audience); // {{packsItself}} // @step:save
  }

  restore(s: Snapshot): void {
    const p = s as PostSnapshot; // {{onlyEditorOpens}} // @step:restore
    this.text = p.text; this.price = p.price; this.audience = p.audience; // @step:restore
  }
}

// {{caretaker}}
export class History {
  private readonly stack: Snapshot[] = []; // {{neverLooks}}
  push(s: Snapshot): void { this.stack.push(s); } // @step:push
  pop(): Snapshot | undefined { return this.stack.pop(); } // {{lastFirst}} // @step:pop,empty
}

// {{client}}
const editor = new PostEditor();
const history = new History();
history.push(editor.save()); // {{saveBeforeRisk}} // @step:click-save
editor.setPrice(300); // {{oops}} // @step:edit
const last = history.pop(); // {{undoButton}} // @step:undo
if (last) editor.restore(last); // {{nothingToUndo}} // @step:restore,empty
publish(editor); // @step:publish
`

const without = `
// {{withoutIntro}}
class PostEditor {
  text = ''; // {{publicFields}} // @step:l1-edit
  price = 0; // @step:l1-edit
  audience: Audience = 'Friends'; // @step:l1-edit
}

// {{uiCode}}
class PostScreen {
  private backups: { text: string; price: number; audience: Audience }[] = []; // {{ownStack}}
  constructor(private editor: PostEditor) {}

  onSave(): void {
    const e = this.editor; // {{knowsEveryField}}
    this.backups.push({ text: e.text, price: e.price, audience: e.audience }); // {{copyEach}} // @step:l1-copy
  }

  onUndo(): void {
    const b = this.backups.pop(); // @step:l1-pop
    if (!b) return;
    this.editor.text = b.text; // {{copyBack}} // @step:l1-undo
    this.editor.price = b.price; // @step:l1-undo
    this.editor.audience = b.audience; // {{easyToMiss}} // @step:l1-undo
  }
}

screen.onSave(); // @step:l1-save
editor.price = 300; // {{oops}} // @step:l1-edit
screen.onUndo(); // @step:l1-undo-call
publish(editor); // @step:l1-post
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
class PostSnapshot implements Snapshot {
  constructor(readonly savedAt: string, readonly text: string, readonly price: number,
              readonly audience: Audience, readonly photo: Photo | null) {} // {{newField}} // @step:build-field
}

export class PostEditor {
  // {{asBefore}}
  private photo: Photo | null = null; // {{photoPrivate}} // @step:build-field
  setPhoto(p: Photo | null): void { this.photo = p; } // @step:w-edit
  save(): Snapshot {
    return new PostSnapshot(now(), this.text, this.price, this.audience, this.photo); // {{savesPhoto}} // @step:w-save
  }
  restore(s: Snapshot): void {
    const p = s as PostSnapshot; // @step:w-restore
    this.text = p.text; this.price = p.price; this.audience = p.audience; this.photo = p.photo; // @step:w-restore
  }
}

// {{othersSame}}
export class History { /* … */ } // {{historySame}} // @step:build-same,w-push,w-pop

// {{clientSame}}
history.push(editor.save()); // @step:w-click-save
editor.setPhoto(null); // {{oopsPhoto}} // @step:w-edit
editor.restore(history.pop()!); // {{sameUndo}} // @step:w-undo
publish(editor); // @step:w-publish
// {{withZero}}
`

export const ts: CodeSet = {
  main: { filename: 'post-editor.ts', source: main },
  without: { filename: 'post-editor-without-memento.ts', source: without },
  with: { filename: 'post-editor-photo.ts', source: withPattern },
}

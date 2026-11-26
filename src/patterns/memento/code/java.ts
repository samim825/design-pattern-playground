import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Java: the memento is a nested class with private fields; only its outer class, PostEditor, can read them.

const main = `
import java.util.ArrayDeque;
import java.util.Deque;

enum Audience { PUBLIC, FRIENDS }

// {{originator}}
public class PostEditor {
    private String text = ""; // {{privateFields}} // @step:private
    private int price; // @step:private
    private Audience audience = Audience.FRIENDS; // @step:private

    // {{memento}}
    public static final class Snapshot { // {{opaque}} // @step:sealed
        private final String savedAt, text; // {{onlyEditor}}
        private final int price;
        private final Audience audience;
        private Snapshot(String savedAt, String text, int price, Audience audience) {
            this.savedAt = savedAt; this.text = text; this.price = price; this.audience = audience;
        }
    }

    public void setText(String text) { this.text = text; } // @step:edit
    public void setPrice(int taka) { this.price = taka; } // @step:edit
    public void setAudience(Audience a) { this.audience = a; } // @step:edit

    public Snapshot save() {
        return new Snapshot(now(), text, price, audience); // {{packsItself}} // @step:save
    }

    public void restore(Snapshot s) { // {{onlyEditorOpens}} // @step:restore
        text = s.text; price = s.price; audience = s.audience; // @step:restore
    }
}

// {{caretaker}}
class History {
    private final Deque<PostEditor.Snapshot> stack = new ArrayDeque<>(); // {{neverLooks}}
    void push(PostEditor.Snapshot s) { stack.push(s); } // @step:push
    PostEditor.Snapshot pop() { return stack.poll(); } // {{lastFirst}} // @step:pop,empty
}

// {{client}}
var editor = new PostEditor();
var history = new History();
history.push(editor.save()); // {{saveBeforeRisk}} // @step:click-save
editor.setPrice(300); // {{oops}} // @step:edit
var last = history.pop(); // {{undoButton}} // @step:undo
if (last != null) editor.restore(last); // {{nothingToUndo}} // @step:restore,empty
publish(editor); // @step:publish
`

const without = `
// {{withoutIntro}}
class PostEditor {
    public String text = ""; // {{publicFields}} // @step:l1-edit
    public int price; // @step:l1-edit
    public Audience audience = Audience.FRIENDS; // @step:l1-edit
}

record PostCopy(String text, int price, Audience audience) {}

// {{uiCode}}
class PostScreen {
    private final Deque<PostCopy> backups = new ArrayDeque<>(); // {{ownStack}}
    private final PostEditor editor;
    PostScreen(PostEditor editor) { this.editor = editor; }

    void onSave() {
        var e = editor; // {{knowsEveryField}}
        backups.push(new PostCopy(e.text, e.price, e.audience)); // {{copyEach}} // @step:l1-copy
    }

    void onUndo() {
        var b = backups.poll(); // @step:l1-pop
        if (b == null) return;
        editor.text = b.text(); // {{copyBack}} // @step:l1-undo
        editor.price = b.price(); // @step:l1-undo
        editor.audience = b.audience(); // {{easyToMiss}} // @step:l1-undo
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
public class PostEditor {
    // {{asBefore}}
    private Photo photo; // {{photoPrivate}} // @step:build-field
    public void setPhoto(Photo p) { this.photo = p; } // @step:w-edit

    public static final class Snapshot {
        private final Photo photo; // {{newField}} // @step:build-field
        /* … */
    }

    public Snapshot save() {
        return new Snapshot(now(), text, price, audience, photo); // {{savesPhoto}} // @step:w-save
    }
    public void restore(Snapshot s) {
        text = s.text; price = s.price; audience = s.audience; photo = s.photo; // @step:w-restore
    }
}

// {{othersSame}}
class History { /* … */ } // {{historySame}} // @step:build-same,w-push,w-pop

// {{clientSame}}
history.push(editor.save()); // @step:w-click-save
editor.setPhoto(null); // {{oopsPhoto}} // @step:w-edit
editor.restore(history.pop()); // {{sameUndo}} // @step:w-undo
publish(editor); // @step:w-publish
// {{withZero}}
`

export const java: CodeSet = {
  main: { filename: 'PostEditor.java', source: main },
  without: { filename: 'PostEditorWithoutMemento.java', source: without },
  with: { filename: 'PostEditorPhoto.java', source: withPattern },
}

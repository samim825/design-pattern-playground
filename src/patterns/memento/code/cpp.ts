import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
#include <optional>
#include <stack>
#include <string>

enum class Audience { Public, Friends };

// {{memento}}
class Snapshot { // {{opaque}} // @step:sealed
    friend class PostEditor; // {{onlyEditor}}
    std::string savedAt, text;
    int price;
    Audience audience;
    Snapshot(std::string at, std::string t, int p, Audience a)
        : savedAt(std::move(at)), text(std::move(t)), price(p), audience(a) {}
};

// {{originator}}
class PostEditor {
    std::string text; // {{privateFields}} // @step:private
    int price = 0; // @step:private
    Audience audience = Audience::Friends; // @step:private
public:
    void setText(std::string t) { text = std::move(t); } // @step:edit
    void setPrice(int taka) { price = taka; } // @step:edit
    void setAudience(Audience a) { audience = a; } // @step:edit

    Snapshot save() const {
        return Snapshot(now(), text, price, audience); // {{packsItself}} // @step:save
    }
    void restore(const Snapshot& s) { // {{onlyEditorOpens}} // @step:restore
        text = s.text; price = s.price; audience = s.audience; // @step:restore
    }
};

// {{caretaker}}
class History {
    std::stack<Snapshot> stack; // {{neverLooks}}
public:
    void push(Snapshot s) { stack.push(std::move(s)); } // @step:push
    std::optional<Snapshot> pop() {
        if (stack.empty()) return std::nullopt; // {{lastFirst}} // @step:pop,empty
        Snapshot s = stack.top(); stack.pop(); return s; // @step:pop
    }
};

// {{client}}
PostEditor editor;
History history;
history.push(editor.save()); // {{saveBeforeRisk}} // @step:click-save
editor.setPrice(300); // {{oops}} // @step:edit
auto last = history.pop(); // {{undoButton}} // @step:undo
if (last) editor.restore(*last); // {{nothingToUndo}} // @step:restore,empty
publish(editor); // @step:publish
`

const without = `
// {{withoutIntro}}
struct PostEditor {
    std::string text; // {{publicFields}} // @step:l1-edit
    int price = 0; // @step:l1-edit
    Audience audience = Audience::Friends; // @step:l1-edit
};

// {{uiCode}}
class PostScreen {
    PostEditor& editor;
    std::stack<PostEditor> backups; // {{ownStack}}
public:
    explicit PostScreen(PostEditor& e) : editor(e) {}
    void onSave() {
        const PostEditor& e = editor; // {{knowsEveryField}}
        backups.push(PostEditor{e.text, e.price, e.audience}); // {{copyEach}} // @step:l1-copy
    }
    void onUndo() {
        if (backups.empty()) return; // @step:l1-pop
        PostEditor b = backups.top(); backups.pop(); // @step:l1-pop
        editor.text = b.text; // {{copyBack}} // @step:l1-undo
        editor.price = b.price; // @step:l1-undo
        editor.audience = b.audience; // {{easyToMiss}} // @step:l1-undo
    }
};

screen.onSave(); // @step:l1-save
editor.price = 300; // {{oops}} // @step:l1-edit
screen.onUndo(); // @step:l1-undo-call
publish(editor); // @step:l1-post
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
class Snapshot {
    friend class PostEditor;
    /* … */
    std::optional<Photo> photo; // {{newField}} // @step:build-field
};

class PostEditor {
    // {{asBefore}}
    std::optional<Photo> photo; // {{photoPrivate}} // @step:build-field
public:
    void setPhoto(std::optional<Photo> p) { photo = std::move(p); } // @step:w-edit
    Snapshot save() const {
        return Snapshot(now(), text, price, audience, photo); // {{savesPhoto}} // @step:w-save
    }
    void restore(const Snapshot& s) {
        text = s.text; price = s.price; audience = s.audience; photo = s.photo; // @step:w-restore
    }
};

// {{othersSame}}
class History { /* … */ }; // {{historySame}} // @step:build-same,w-push,w-pop

// {{clientSame}}
history.push(editor.save()); // @step:w-click-save
editor.setPhoto(std::nullopt); // {{oopsPhoto}} // @step:w-edit
if (auto last = history.pop()) editor.restore(*last); // {{sameUndo}} // @step:w-undo
publish(editor); // @step:w-publish
// {{withZero}}
`

export const cpp: CodeSet = {
  main: { filename: 'post_editor.cpp', source: main },
  without: { filename: 'post_editor_without_memento.cpp', source: without },
  with: { filename: 'post_editor_photo.cpp', source: withPattern },
}

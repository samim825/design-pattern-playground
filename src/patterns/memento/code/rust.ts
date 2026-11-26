import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Rust: privacy is per module. Snapshot is a pub struct with private fields inside mod post, so History
// (outside the module) can own and move snapshots but can't read or change what is inside them.

const main = `
mod post {
    #[derive(Clone, Copy, PartialEq)]
    pub enum Audience { Public, Friends }

    // {{memento}}
    pub struct Snapshot { // {{opaque}} // @step:sealed
        saved_at: String,
        text: String, // {{onlyEditor}}
        price: u32,
        audience: Audience,
    }

    // {{originator}}
    pub struct PostEditor {
        text: String, // {{privateFields}} // @step:private
        price: u32, // @step:private
        audience: Audience, // @step:private
    }

    impl PostEditor {
        pub fn set_text(&mut self, text: &str) { self.text = text.into() } // @step:edit
        pub fn set_price(&mut self, taka: u32) { self.price = taka } // @step:edit
        pub fn set_audience(&mut self, a: Audience) { self.audience = a } // @step:edit

        pub fn save(&self) -> Snapshot {
            Snapshot { saved_at: now(), text: self.text.clone(), price: self.price, audience: self.audience } // {{packsItself}} // @step:save
        }

        pub fn restore(&mut self, s: Snapshot) { // {{onlyEditorOpens}} // @step:restore
            (self.text, self.price, self.audience) = (s.text, s.price, s.audience); // @step:restore
        }
    }
}

// {{caretaker}}
#[derive(Default)]
struct History { stack: Vec<post::Snapshot> } // {{neverLooks}}

impl History {
    fn push(&mut self, s: post::Snapshot) { self.stack.push(s) } // @step:push
    fn pop(&mut self) -> Option<post::Snapshot> { self.stack.pop() } // {{lastFirst}} // @step:pop,empty
}

// {{client}}
let mut editor = post::PostEditor::new();
let mut history = History::default();
history.push(editor.save()); // {{saveBeforeRisk}} // @step:click-save
editor.set_price(300); // {{oops}} // @step:edit
let last = history.pop(); // {{undoButton}} // @step:undo
if let Some(s) = last { editor.restore(s) } // {{nothingToUndo}} // @step:restore,empty
publish(&editor); // @step:publish
`

const without = `
// {{withoutIntro}}
pub struct PostEditor {
    pub text: String, // {{publicFields}} // @step:l1-edit
    pub price: u32, // @step:l1-edit
    pub audience: Audience, // @step:l1-edit
}

// {{uiCode}}
pub struct PostScreen {
    backups: Vec<(String, u32, Audience)>, // {{ownStack}}
}

impl PostScreen {
    pub fn on_save(&mut self, e: &PostEditor) { // {{knowsEveryField}}
        self.backups.push((e.text.clone(), e.price, e.audience)); // {{copyEach}} // @step:l1-copy
    }

    pub fn on_undo(&mut self, editor: &mut PostEditor) {
        let Some((text, price, audience)) = self.backups.pop() else { return }; // @step:l1-pop
        editor.text = text; // {{copyBack}} // @step:l1-undo
        editor.price = price; // @step:l1-undo
        editor.audience = audience; // {{easyToMiss}} // @step:l1-undo
    }
}

screen.on_save(&editor); // @step:l1-save
editor.price = 300; // {{oops}} // @step:l1-edit
screen.on_undo(&mut editor); // @step:l1-undo-call
publish(&editor); // @step:l1-post
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
mod post {
    pub struct Snapshot {
        saved_at: String, text: String, price: u32, audience: Audience,
        photo: Option<Photo>, // {{newField}} // @step:build-field
    }

    pub struct PostEditor {
        // {{asBefore}}
        photo: Option<Photo>, // {{photoPrivate}} // @step:build-field
    }

    impl PostEditor {
        pub fn set_photo(&mut self, p: Option<Photo>) { self.photo = p } // @step:w-edit
        pub fn save(&self) -> Snapshot {
            Snapshot { saved_at: now(), text: self.text.clone(), price: self.price, audience: self.audience, photo: self.photo.clone() } // {{savesPhoto}} // @step:w-save
        }
        pub fn restore(&mut self, s: Snapshot) {
            (self.text, self.price, self.audience, self.photo) = (s.text, s.price, s.audience, s.photo); // @step:w-restore
        }
    }
}

// {{othersSame}}
struct History { /* … */ } // {{historySame}} // @step:build-same,w-push,w-pop

// {{clientSame}}
history.push(editor.save()); // @step:w-click-save
editor.set_photo(None); // {{oopsPhoto}} // @step:w-edit
if let Some(s) = history.pop() { editor.restore(s) } // {{sameUndo}} // @step:w-undo
publish(&editor); // @step:w-publish
// {{withZero}}
`

export const rust: CodeSet = {
  main: { filename: 'post_editor.rs', source: main },
  without: { filename: 'post_editor_without_memento.rs', source: without },
  with: { filename: 'post_editor_photo.rs', source: withPattern },
}

import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// PHP has no friend classes: PostSnapshot is immutable (readonly) and History only type-hints the empty
// Snapshot interface, so keeping its fields to PostEditor is by convention.

const main = `
<?php
enum Audience { case Public; case Friends; }

// {{memento}}
interface Snapshot {} // {{opaque}} // @step:sealed

final readonly class PostSnapshot implements Snapshot // {{onlyEditor}}
{
    public function __construct(
        public string $savedAt,
        public string $text,
        public int $price,
        public Audience $audience,
    ) {}
}

// {{originator}}
final class PostEditor
{
    private string $text = ''; // {{privateFields}} // @step:private
    private int $price = 0; // @step:private
    private Audience $audience = Audience::Friends; // @step:private

    public function setText(string $text): void { $this->text = $text; } // @step:edit
    public function setPrice(int $taka): void { $this->price = $taka; } // @step:edit
    public function setAudience(Audience $a): void { $this->audience = $a; } // @step:edit

    public function save(): Snapshot
    {
        return new PostSnapshot(now(), $this->text, $this->price, $this->audience); // {{packsItself}} // @step:save
    }

    public function restore(Snapshot $s): void // {{onlyEditorOpens}} // @step:restore
    {
        [$this->text, $this->price, $this->audience] = [$s->text, $s->price, $s->audience]; // @step:restore
    }
}

// {{caretaker}}
final class History
{
    private array $stack = []; // {{neverLooks}}
    public function push(Snapshot $s): void { $this->stack[] = $s; } // @step:push
    public function pop(): ?Snapshot { return array_pop($this->stack); } // {{lastFirst}} // @step:pop,empty
}

// {{client}}
$editor = new PostEditor();
$history = new History();
$history->push($editor->save()); // {{saveBeforeRisk}} // @step:click-save
$editor->setPrice(300); // {{oops}} // @step:edit
$last = $history->pop(); // {{undoButton}} // @step:undo
if ($last !== null) $editor->restore($last); // {{nothingToUndo}} // @step:restore,empty
publish($editor); // @step:publish
`

const without = `
<?php
// {{withoutIntro}}
final class PostEditor
{
    public string $text = ''; // {{publicFields}} // @step:l1-edit
    public int $price = 0; // @step:l1-edit
    public Audience $audience = Audience::Friends; // @step:l1-edit
}

// {{uiCode}}
final class PostScreen
{
    private array $backups = []; // {{ownStack}}
    public function __construct(private PostEditor $editor) {}

    public function onSave(): void
    {
        $e = $this->editor; // {{knowsEveryField}}
        $this->backups[] = ['text' => $e->text, 'price' => $e->price, 'audience' => $e->audience]; // {{copyEach}} // @step:l1-copy
    }

    public function onUndo(): void
    {
        $b = array_pop($this->backups); // @step:l1-pop
        if ($b === null) return;
        $this->editor->text = $b['text']; // {{copyBack}} // @step:l1-undo
        $this->editor->price = $b['price']; // @step:l1-undo
        $this->editor->audience = $b['audience']; // {{easyToMiss}} // @step:l1-undo
    }
}

$screen->onSave(); // @step:l1-save
$editor->price = 300; // {{oops}} // @step:l1-edit
$screen->onUndo(); // @step:l1-undo-call
publish($editor); // @step:l1-post
// {{withoutNext}}
`

const withPattern = `
<?php
// {{withAdd}}
final readonly class PostSnapshot implements Snapshot
{
    public function __construct(
        public string $savedAt, public string $text, public int $price, public Audience $audience,
        public ?Photo $photo, // {{newField}} // @step:build-field
    ) {}
}

final class PostEditor
{
    // {{asBefore}}
    private ?Photo $photo = null; // {{photoPrivate}} // @step:build-field
    public function setPhoto(?Photo $p): void { $this->photo = $p; } // @step:w-edit

    public function save(): Snapshot
    {
        return new PostSnapshot(now(), $this->text, $this->price, $this->audience, $this->photo); // {{savesPhoto}} // @step:w-save
    }

    public function restore(Snapshot $s): void
    {
        [$this->text, $this->price, $this->audience, $this->photo] = [$s->text, $s->price, $s->audience, $s->photo]; // @step:w-restore
    }
}

// {{othersSame}}
final class History { /* … */ } // {{historySame}} // @step:build-same,w-push,w-pop

// {{clientSame}}
$history->push($editor->save()); // @step:w-click-save
$editor->setPhoto(null); // {{oopsPhoto}} // @step:w-edit
$editor->restore($history->pop()); // {{sameUndo}} // @step:w-undo
publish($editor); // @step:w-publish
// {{withZero}}
`

export const php: CodeSet = {
  main: { filename: 'PostEditor.php', source: main },
  without: { filename: 'PostEditorWithoutMemento.php', source: without },
  with: { filename: 'PostEditorPhoto.php', source: withPattern },
}

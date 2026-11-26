import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// C#: History sees only the ISnapshot interface; the real snapshot is a private record nested in PostEditor.

const main = `
public enum Audience { Public, Friends }

// {{memento}}
public interface ISnapshot { string SavedAt { get; } } // {{opaque}} // @step:sealed

// {{originator}}
public sealed class PostEditor
{
    private string _text = ""; // {{privateFields}} // @step:private
    private decimal _price; // @step:private
    private Audience _audience = Audience.Friends; // @step:private

    private sealed record PostSnapshot(string SavedAt, string Text, decimal Price, Audience Audience) // {{onlyEditor}}
        : ISnapshot;

    public void SetText(string text) => _text = text; // @step:edit
    public void SetPrice(decimal taka) => _price = taka; // @step:edit
    public void SetAudience(Audience a) => _audience = a; // @step:edit

    public ISnapshot Save() =>
        new PostSnapshot(Now(), _text, _price, _audience); // {{packsItself}} // @step:save

    public void Restore(ISnapshot s)
    {
        var p = (PostSnapshot)s; // {{onlyEditorOpens}} // @step:restore
        (_text, _price, _audience) = (p.Text, p.Price, p.Audience); // @step:restore
    }
}

// {{caretaker}}
public sealed class History
{
    private readonly Stack<ISnapshot> _stack = new(); // {{neverLooks}}
    public void Push(ISnapshot s) => _stack.Push(s); // @step:push
    public ISnapshot? Pop() => _stack.TryPop(out var s) ? s : null; // {{lastFirst}} // @step:pop,empty
}

// {{client}}
var editor = new PostEditor();
var history = new History();
history.Push(editor.Save()); // {{saveBeforeRisk}} // @step:click-save
editor.SetPrice(300m); // {{oops}} // @step:edit
var last = history.Pop(); // {{undoButton}} // @step:undo
if (last is not null) editor.Restore(last); // {{nothingToUndo}} // @step:restore,empty
Publish(editor); // @step:publish
`

const without = `
// {{withoutIntro}}
public class PostEditor
{
    public string Text = ""; // {{publicFields}} // @step:l1-edit
    public decimal Price; // @step:l1-edit
    public Audience Audience = Audience.Friends; // @step:l1-edit
}

// {{uiCode}}
public class PostScreen(PostEditor editor)
{
    private readonly Stack<(string Text, decimal Price, Audience Audience)> _backups = new(); // {{ownStack}}

    public void OnSave()
    {
        var e = editor; // {{knowsEveryField}}
        _backups.Push((e.Text, e.Price, e.Audience)); // {{copyEach}} // @step:l1-copy
    }

    public void OnUndo()
    {
        if (!_backups.TryPop(out var b)) return; // @step:l1-pop
        editor.Text = b.Text; // {{copyBack}} // @step:l1-undo
        editor.Price = b.Price; // @step:l1-undo
        editor.Audience = b.Audience; // {{easyToMiss}} // @step:l1-undo
    }
}

screen.OnSave(); // @step:l1-save
editor.Price = 300m; // {{oops}} // @step:l1-edit
screen.OnUndo(); // @step:l1-undo-call
Publish(editor); // @step:l1-post
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
public sealed class PostEditor
{
    // {{asBefore}}
    private Photo? _photo; // {{photoPrivate}} // @step:build-field
    public void SetPhoto(Photo? p) => _photo = p; // @step:w-edit

    private sealed record PostSnapshot(string SavedAt, string Text, decimal Price,
        Audience Audience, Photo? Photo) : ISnapshot; // {{newField}} // @step:build-field

    public ISnapshot Save() =>
        new PostSnapshot(Now(), _text, _price, _audience, _photo); // {{savesPhoto}} // @step:w-save

    public void Restore(ISnapshot s)
    {
        var p = (PostSnapshot)s; // @step:w-restore
        (_text, _price, _audience, _photo) = (p.Text, p.Price, p.Audience, p.Photo); // @step:w-restore
    }
}

// {{othersSame}}
public sealed class History { /* … */ } // {{historySame}} // @step:build-same,w-push,w-pop

// {{clientSame}}
history.Push(editor.Save()); // @step:w-click-save
editor.SetPhoto(null); // {{oopsPhoto}} // @step:w-edit
editor.Restore(history.Pop()!); // {{sameUndo}} // @step:w-undo
Publish(editor); // @step:w-publish
// {{withZero}}
`

export const csharp: CodeSet = {
  main: { filename: 'PostEditor.cs', source: main },
  without: { filename: 'PostEditorWithoutMemento.cs', source: without },
  with: { filename: 'PostEditorPhoto.cs', source: withPattern },
}

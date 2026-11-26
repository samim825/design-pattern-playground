import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Ruby: Data.define makes the snapshot immutable, and private_constant hides the class name outside
// PostEditor; its readers stay callable, so not looking inside is by convention.

const main = `
# {{originator}}
class PostEditor
  # {{memento}}
  Snapshot = Data.define(:saved_at, :text, :price, :audience) # {{opaque}} # @step:sealed
  private_constant :Snapshot # {{onlyEditor}}

  def initialize
    @text = "" # {{privateFields}} # @step:private
    @price = 0 # @step:private
    @audience = :friends # @step:private
  end

  def text=(text) = @text = text # @step:edit
  def price=(taka) = @price = taka # @step:edit
  def audience=(a) = @audience = a # @step:edit

  def save
    Snapshot.new(saved_at: now, text: @text, price: @price, audience: @audience) # {{packsItself}} # @step:save
  end

  def restore(s) # {{onlyEditorOpens}} # @step:restore
    @text, @price, @audience = s.text, s.price, s.audience # @step:restore
  end
end

# {{caretaker}}
class History
  def initialize = @stack = [] # {{neverLooks}}
  def push(s) = @stack.push(s) # @step:push
  def pop = @stack.pop # {{lastFirst}} # @step:pop,empty
end

# {{client}}
editor = PostEditor.new
history = History.new
history.push(editor.save) # {{saveBeforeRisk}} # @step:click-save
editor.price = 300 # {{oops}} # @step:edit
last = history.pop # {{undoButton}} # @step:undo
editor.restore(last) if last # {{nothingToUndo}} # @step:restore,empty
publish(editor) # @step:publish
`

const without = `
# {{withoutIntro}}
class PostEditor
  attr_accessor :text, :price, :audience # {{publicFields}} # @step:l1-edit
end

# {{uiCode}}
class PostScreen
  def initialize(editor)
    @editor = editor
    @backups = [] # {{ownStack}}
  end

  def on_save
    e = @editor # {{knowsEveryField}}
    @backups.push({ text: e.text, price: e.price, audience: e.audience }) # {{copyEach}} # @step:l1-copy
  end

  def on_undo
    b = @backups.pop or return # @step:l1-pop
    @editor.text = b[:text] # {{copyBack}} # @step:l1-undo
    @editor.price = b[:price] # @step:l1-undo
    @editor.audience = b[:audience] # {{easyToMiss}} # @step:l1-undo
  end
end

screen.on_save # @step:l1-save
editor.price = 300 # {{oops}} # @step:l1-edit
screen.on_undo # @step:l1-undo-call
publish(editor) # @step:l1-post
# {{withoutNext}}
`

const withPattern = `
# {{withAdd}}
class PostEditor
  Snapshot = Data.define(:saved_at, :text, :price, :audience, :photo) # {{newField}} # @step:build-field
  private_constant :Snapshot

  # {{asBefore}}
  def photo=(p) = @photo = p # {{photoPrivate}} # @step:build-field,w-edit

  def save
    Snapshot.new(saved_at: now, text: @text, price: @price, audience: @audience, photo: @photo) # {{savesPhoto}} # @step:w-save
  end

  def restore(s)
    @text, @price, @audience, @photo = s.text, s.price, s.audience, s.photo # @step:w-restore
  end
end

# {{othersSame}}
class History; end # {{historySame}} # @step:build-same,w-push,w-pop

# {{clientSame}}
history.push(editor.save) # @step:w-click-save
editor.photo = nil # {{oopsPhoto}} # @step:w-edit
editor.restore(history.pop) # {{sameUndo}} # @step:w-undo
publish(editor) # @step:w-publish
# {{withZero}}
`

export const ruby: CodeSet = {
  main: { filename: 'post_editor.rb', source: main },
  without: { filename: 'post_editor_without_memento.rb', source: without },
  with: { filename: 'post_editor_photo.rb', source: withPattern },
}

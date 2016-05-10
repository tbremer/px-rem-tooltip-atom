'use babel';

let dispose = null;
const SCOPE_REGEX = /css|sass/i;
const TYPE_REGEX = /(\d+(px|rem))/ig;

function debounce(func = ()  => {}, duration = 50) {
  let timer = null;
  return function(...args) {
    const context = this;
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(context, args)
    }, duration);
  }
}

function change(event) {
  if (dispose) {
    dispose.dispose();
    dispose = null;
  }

  const {cursor} = event;
  const [scope] = cursor.getScopeDescriptor().scopes

  if (!(SCOPE_REGEX.test(scope))) return;
  const Editor = atom.workspace.getActiveTextEditor();
  const Text = Editor.lineTextForScreenRow(cursor.getScreenRow());

  if (!(TYPE_REGEX.test(Text))) return;

  const View = atom.views.getView(Editor);
  const Node = View.shadowRoot.querySelector('.cursor-line .source');
  const ToolTipOptions = {
    placement: 'auto right',
    trigger: 'manual'
  };

  if (!(Node)) return;

  const numbers = [];

  for (let match of Text.match(TYPE_REGEX)) {
    switch (true) {
      case /px/.test(match):
        numbers.push(`${parseInt(match, 10) / 16}rem;`);
        break;
      default:
        numbers.push(`${parseInt(match, 10) * 16}px;`);
    }
  }

  ToolTipOptions.title = numbers.join(' ');

  dispose = atom.tooltips.add(Node, ToolTipOptions);
}

export default {
  activate() {
    atom.workspace.observeTextEditors(editor => {
      editor.observeCursors(cursor => cursor.onDidChangePosition(debounce(change)))
    });
  }
}
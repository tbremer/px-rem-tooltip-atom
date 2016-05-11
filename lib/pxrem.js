'use babel';

let dispose = null;
const SCOPE_REGEX = /css|sass/i;
const TYPE_REGEX = /\.?\d+(?:px|rem)/ig;

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
  const multiplier = atom.config.get('px-rem-tooltip.fontSize');
  const numbers = [];

  for (let match of Text.match(TYPE_REGEX)) {
    let number;

    if (/px/.test(match)) {
      number = Number(match.replace(/px/, ''));
      numbers.push(`${number / multiplier}rem;`);
    } else {
      number = Number(match.replace(/rem/, ''));
      numbers.push(`${number * multiplier}px;`);
    }
  }

  ToolTipOptions.title = numbers.join(' ');

  dispose = atom.tooltips.add(Node, ToolTipOptions);
}

export default {
  config: {
    fontSize: {
      type: 'integer',
      default: 16
    }
  },

  activate() {
    atom.workspace.observeTextEditors(editor => {
      editor.observeCursors(cursor => cursor.onDidChangePosition(debounce(change)))
    });
  }
}

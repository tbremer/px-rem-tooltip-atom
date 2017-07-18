'use babel';

const SCOPE_REGEX = /css|sass/i;
const TYPE_REGEX = /([\d.]+)(?:px|rem)/ig;
let dispose = null;

function regexInArray (reg, arr) {
  for (const item of arr) {
    if (reg.test(item)) return true;
  }

  return false;
}

function debounce(func = () => {}, duration = 50) {
  let timer = null;

  return function debounced (...args) {
    const context = this; //eslint-disable-line

    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(context, args);
    }, duration);
  };
}

function change(event) {
  if (dispose) dispose = dispose.dispose();

  const { cursor } = event;
  const scopes = cursor.getScopeDescriptor().scopes;

  if (!regexInArray(SCOPE_REGEX, scopes)) return;
  const Editor = atom.workspace.getActiveTextEditor();

  if (!Editor) return;

  const Text = Editor.lineTextForScreenRow(cursor.getScreenRow());

  if (!(TYPE_REGEX.test(Text))) return;
  const followCursor = atom.config.get('px-rem-tooltip.followCursor');
  const View = atom.views.getView(Editor);
  const selector = followCursor ? '.cursors .cursor' : '.cursor-line .syntax--source';
  const Node = View.querySelector(selector);
  const placement = followCursor ? 'auto bottom' : 'auto right';
  const ToolTipOptions = {
    placement,
    trigger: 'manual'
  };

  if (!(Node)) return;
  const multiplier = atom.config.get('px-rem-tooltip.fontSize');
  const numbers = [];

  for (const match of Text.match(TYPE_REGEX)) {
    let number;

    if (/px/.test(match)) {
      number = Number(match.replace(/px/, ''));
      numbers.push(`${number / multiplier}rem;`);
    }
    else {
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
    },
    followCursor: {
      type: 'boolean',
      default: false
    }
  },

  activate() {
    const { workspace } = atom;
    const { paneContainer } = workspace.getCenter();

    paneContainer.observeActivePaneItem(editor => {
      if (dispose) {
        dispose = dispose.dispose();

        return;
      }

      if (!editor || !('getCursors' in editor)) return;

      const [ cursor ] = editor.getCursors();

      return change({ cursor });
    });

    workspace.observeTextEditors(editor => {
      editor.observeCursors(cursor => cursor.onDidChangePosition(debounce(change)));
    });
  }
};

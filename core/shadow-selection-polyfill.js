// see https://github.com/GoogleChromeLabs/shadow-selection-polyfill/issues/11
const SUPPORTS_SHADOW_SELECTION =
  typeof window.ShadowRoot.prototype.getSelection === 'function';
const SUPPORTS_BEFORE_INPUT =
  typeof window.InputEvent.prototype.getTargetRanges === 'function';
const IS_FIREFOX =
  window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

let processing = false;

// eslint-disable-next-line import/prefer-default-export
export class ShadowSelection {
  constructor() {
    this.ranges = [];
  }

  get rangeCount() {
    return this.ranges.length;
  }

  getRangeAt(index) {
    return this.ranges[index];
  }

  addRange(range) {
    this.ranges.push(range);
    if (!processing) {
      const windowSel = window.getSelection();
      windowSel.removeAllRanges();
      windowSel.addRange(range);
    }
  }

  removeAllRanges() {
    this.ranges = [];
  }

  // todo: implement remaining `Selection` methods and properties.
}

function getActiveElement() {
  let active = document.activeElement;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (active && active.shadowRoot && active.shadowRoot.activeElement) {
      active = active.shadowRoot.activeElement;
    } else {
      break;
    }
  }

  return active;
}

if (IS_FIREFOX && !SUPPORTS_SHADOW_SELECTION) {
  window.ShadowRoot.prototype.getSelection = function getSelection() {
    return document.getSelection();
  };
}

if (!IS_FIREFOX && !SUPPORTS_SHADOW_SELECTION && SUPPORTS_BEFORE_INPUT) {
  const selection = new ShadowSelection();

  window.ShadowRoot.prototype.getSelection = function getSelection() {
    return selection;
  };

  window.addEventListener(
    'selectionchange',
    () => {
      if (!processing) {
        processing = true;

        const active = getActiveElement();

        if (active && active.getAttribute('contenteditable') === 'true') {
          document.execCommand('indent');
        } else {
          selection.removeAllRanges();
        }

        processing = false;
      }
    },
    true,
  );

  window.addEventListener(
    'beforeinput',
    event => {
      if (processing) {
        const ranges = event.getTargetRanges();
        const range = ranges[0];

        const newRange = new Range();

        newRange.setStart(range.startContainer, range.startOffset);
        newRange.setEnd(range.endContainer, range.endOffset);

        selection.removeAllRanges();
        selection.addRange(newRange);

        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );

  window.addEventListener(
    'selectstart',
    () => {
      selection.removeAllRanges();
    },
    true,
  );
}

import { useLayoutEffect, useRef, useState } from 'react';

function format(raw) {
  if (!raw) return '';
  const [intPart, decPart] = raw.split('.');
  const intFormatted = intPart ? Number(intPart).toLocaleString('en-US') : '';
  return decPart !== undefined ? `${intFormatted}.${decPart}` : intFormatted;
}

// Allow only digits and at most one decimal point.
const VALID = /^\d*\.?\d*$/;

// Controlled-input helper: stores the raw numeric string (e.g. "1000000")
// while displaying it grouped (e.g. "1,000,000"). Caret is restored after
// each render so commas inserted during formatting don't shift the cursor.
export function useGroupedNumberInput(initial = '') {
  const [value, setValue] = useState(initial);
  const inputRef = useRef(null);
  const targetDigitsBeforeCaret = useRef(null);

  useLayoutEffect(() => {
    const target = targetDigitsBeforeCaret.current;
    targetDigitsBeforeCaret.current = null;
    if (target == null || !inputRef.current) return;

    const formatted = format(value);
    let pos = 0;
    let count = 0;
    while (pos < formatted.length && count < target) {
      if (formatted[pos] !== ',') count++;
      pos++;
    }
    inputRef.current.setSelectionRange(pos, pos);
  }, [value]);

  const onChange = (e) => {
    const next = e.target.value;
    const caret = e.target.selectionStart ?? next.length;
    const stripped = next.replace(/,/g, '');
    if (stripped !== '' && !VALID.test(stripped)) return;
    targetDigitsBeforeCaret.current = next.slice(0, caret).replace(/,/g, '').length;
    setValue(stripped);
  };

  return {
    value,
    setValue,
    inputProps: {
      ref: inputRef,
      type: 'text',
      inputMode: 'decimal',
      value: format(value),
      onChange,
    },
  };
}

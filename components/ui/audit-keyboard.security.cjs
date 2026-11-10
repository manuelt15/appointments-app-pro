/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node CommonJS test harness. */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('../../node_modules/typescript')
const jsx = require('../../node_modules/react/jsx-runtime')

function colorPicker() {
  const code = ts.transpileModule(fs.readFileSync('components/ui/color-picker.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const loadedModule = { exports: {} }
  vm.runInNewContext(code, { module: loadedModule, exports: loadedModule.exports, require: name => {
    if (name === 'react/jsx-runtime') return jsx
    if (name === 'lucide-react') return { Check: () => null }
    throw new Error(name)
  } })
  return loadedModule.exports.ColorPicker
}

test('radio group exposes one tab stop and arrow/Home/End selection', () => {
  const colors = ['#6366f1', '#0070f3', '#10b981']
  const selected = []; const focused = []
  const view = colorPicker()({ colors, value: colors[1], label: 'Color', onChange: color => selected.push(color) })
  const buttons = view.props.children
  assert.deepEqual(buttons.map(button => button.props.tabIndex), [-1, 0, -1])
  const controls = buttons.map((_, i) => ({ focus: () => focused.push(i) }))
  for (const [key, index, target] of [['ArrowRight', 1, 2], ['ArrowLeft', 0, 2], ['Home', 2, 0], ['End', 0, 2], ['ArrowDown', 2, 0], ['ArrowUp', 0, 2]]) {
    let prevented = false
    buttons[index].props.onKeyDown({ key, preventDefault() { prevented = true }, currentTarget: { parentElement: { querySelectorAll: () => controls } } })
    assert.equal(prevented, true)
    assert.equal(selected.at(-1), colors[target])
    assert.equal(focused.at(-1), target)
  }
})

test('week picker retains native day buttons rather than an incomplete ARIA grid', () => {
  const source = fs.readFileSync('components/calendar/WeekPicker.tsx', 'utf8')
  assert.doesNotMatch(source, /role="(?:grid|gridcell|row|columnheader)"|aria-selected=/)
  assert.match(source, /role="group" aria-label="Weeks"/)
  assert.match(source, /aria-pressed=\{selected\}/)
  assert.match(source, /onClick=\{\(\) => pick\(day\)\}/)
})

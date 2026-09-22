const test = require('node:test');
const assert = require('node:assert');
const chrono = require('chrono-node');

function parseQuickAddText(text) {
  let isTask = false;
  let priority = 'none';
  let dueDate = null;
  let cleanText = text;

  if (/^\/task\b/i.test(cleanText)) {
    isTask = true;
    cleanText = cleanText.replace(/^\/task\s*/i, '').trim();
  } else if (/^\/note\b/i.test(cleanText)) {
    isTask = false;
    cleanText = cleanText.replace(/^\/note\s*/i, '').trim();
  }

  const priMatch = cleanText.match(/[!#](high|medium|low|h|m|l)\b/i);
  if (priMatch) {
    const p = priMatch[1].toLowerCase();
    priority = p === 'h' ? 'high' : p === 'm' ? 'medium' : p === 'l' ? 'low' : p;
    cleanText = cleanText.replace(priMatch[0], '').trim();
    isTask = true;
  }

  try {
    const results = chrono.parse(cleanText);
    if (results && results.length > 0) {
      const d = results[0].start.date();
      dueDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      cleanText = cleanText.replace(results[0].text, '').replace(/\s+/g, ' ').trim();
      isTask = true;
    }
  } catch (e) {}

  if (dueDate || priority !== 'none') isTask = true;
  return { text: cleanText, isTask, priority, dueDate };
}

test('NLP — Quick Add parsing detects task flag and priority', (t) => {
  const res1 = parseQuickAddText('/task Review architecture document !high');
  assert.strictEqual(res1.isTask, true);
  assert.strictEqual(res1.priority, 'high');
  assert.strictEqual(res1.text, 'Review architecture document');

  const res2 = parseQuickAddText('/note Brainstorming session notes');
  assert.strictEqual(res2.isTask, false);
  assert.strictEqual(res2.priority, 'none');
  assert.strictEqual(res2.text, 'Brainstorming session notes');
});

test('NLP — Chrono extracts dates from natural phrases', (t) => {
  const res = parseQuickAddText('Team lunch tomorrow at 1pm !low');
  assert.strictEqual(res.isTask, true);
  assert.strictEqual(res.priority, 'low');
  assert.ok(res.dueDate);
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(res.dueDate));
  assert.strictEqual(res.text, 'Team lunch');
});

const test = require('node:test');
const assert = require('node:assert');
const CalendarService = require('../src/main/calendar');

test('CalendarService — parseICS unfolded lines, dates, and meeting links', (t) => {
  const sampleICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
BEGIN:VEVENT
DTSTART:20260325T140000Z
DTEND:20260325T150000Z
SUMMARY:Production Launch Architecture Sync
DESCRIPTION:Join meeting link: https://zoom.us/j/9876543210\\nLet's 
 review final checklist
LOCATION:Online Zoom Room
END:VEVENT
BEGIN:VEVENT
DTSTART:20260401
SUMMARY:All-Day Company Hackathon
DESCRIPTION:Annual engineering build day
END:VEVENT
END:VCALENDAR`;

  const events = CalendarService.parseICS(sampleICS);
  assert.strictEqual(events.length, 2);

  // Event 1
  assert.strictEqual(events[0].summary, 'Production Launch Architecture Sync');
  assert.strictEqual(events[0].date, '2026-03-25');
  assert.strictEqual(events[0].time, '14:00');
  assert.strictEqual(events[0].meetingLink, 'https://zoom.us/j/9876543210');

  // Event 2 (All Day)
  assert.strictEqual(events[1].summary, 'All-Day Company Hackathon');
  assert.strictEqual(events[1].date, '2026-04-01');
  assert.strictEqual(events[1].time, undefined);
});

test('CalendarService — Empty or malformed input returns empty array', (t) => {
  assert.deepStrictEqual(CalendarService.parseICS(''), []);
  assert.deepStrictEqual(CalendarService.parseICS(null), []);
  assert.deepStrictEqual(CalendarService.parseICS('SOME_GARBAGE_TEXT_WITHOUT_VEVENT'), []);
});

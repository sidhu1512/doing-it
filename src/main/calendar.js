const https = require('https');
const http = require('http');

/**
 * CalendarService — RFC 5545 iCalendar fetcher and parser
 */
class CalendarService {
  static fetchIcs(icsUrl, timeoutMs = 10000) {
    if (!icsUrl || typeof icsUrl !== 'string' || !/^https?:\/\//i.test(icsUrl)) {
      return Promise.resolve([]);
    }

    return new Promise((resolve) => {
      const client = icsUrl.startsWith('https') ? https : http;
      let req;

      try {
        req = client.get(icsUrl, { timeout: timeoutMs }, (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            // Handle HTTP redirects
            return CalendarService.fetchIcs(res.headers.location, timeoutMs).then(resolve);
          }

          if (res.statusCode && res.statusCode !== 200) {
            console.error(`[CalendarService] HTTP error: status ${res.statusCode}`);
            resolve([]);
            return;
          }

          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            try {
              const events = CalendarService.parseICS(data);
              resolve(events);
            } catch (err) {
              console.error('[CalendarService] ICS parsing failed:', err);
              resolve([]);
            }
          });
        });

        req.on('error', (err) => {
          console.error('[CalendarService] Network request failed:', err.message);
          resolve([]);
        });

        req.on('timeout', () => {
          req.destroy();
          console.error('[CalendarService] Request timed out');
          resolve([]);
        });
      } catch (err) {
        console.error('[CalendarService] Connection initialization error:', err);
        resolve([]);
      }
    });
  }

  static parseICS(icsText) {
    if (!icsText || typeof icsText !== 'string') return [];

    // RFC 5545: Unfold lines (lines folded with CRLF + space or tab)
    const unfolded = icsText.replace(/\r?\n[ \t]/g, '');
    const events = [];
    const blocks = unfolded.split('BEGIN:VEVENT');

    for (let i = 1; i < blocks.length; i++) {
      const block = blocks[i].split('END:VEVENT')[0];
      const event = {};

      // SUMMARY
      const summaryMatch = block.match(/SUMMARY(?:;[^:]*)?:(.*)/i);
      if (summaryMatch) {
        event.summary = summaryMatch[1].trim().replace(/\\,/g, ',').replace(/\\;/g, ';');
      }

      // DTSTART (formats: 20260325, 20260325T090000, 20260325T090000Z)
      const dtStartMatch = block.match(/DTSTART(?:;[^:]*)?:(\d{8}(?:T\d{4,6}Z?)?)/i);
      if (dtStartMatch) {
        const d = dtStartMatch[1];
        event.date = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
        if (d.includes('T') && d.length >= 13) {
          const tIdx = d.indexOf('T');
          event.time = `${d.slice(tIdx + 1, tIdx + 3)}:${d.slice(tIdx + 3, tIdx + 5)}`;
        }
      }

      // DTEND
      const dtEndMatch = block.match(/DTEND(?:;[^:]*)?:(\d{8}(?:T\d{4,6}Z?)?)/i);
      if (dtEndMatch) {
        const d = dtEndMatch[1];
        event.endDate = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
        if (d.includes('T') && d.length >= 13) {
          const tIdx = d.indexOf('T');
          event.endTime = `${d.slice(tIdx + 1, tIdx + 3)}:${d.slice(tIdx + 3, tIdx + 5)}`;
        }
      }

      // DESCRIPTION
      const descMatch = block.match(/DESCRIPTION(?:;[^:]*)?:(.*)/i);
      if (descMatch) {
        event.description = descMatch[1].trim()
          .replace(/\\n/gi, '\n')
          .replace(/\\,/g, ',')
          .replace(/\\;/g, ';');
      }

      // LOCATION
      const locMatch = block.match(/LOCATION(?:;[^:]*)?:(.*)/i);
      if (locMatch) {
        event.location = locMatch[1].trim().replace(/\\,/g, ',').replace(/\\;/g, ';');
      }

      // Meeting link detection (Zoom, Google Meet, Microsoft Teams, Webex)
      const combined = `${event.description || ''} ${event.location || ''} ${block}`;
      const meetingMatch = combined.match(
        /https:\/\/[^\s"'<>]*(?:zoom\.us\/[^\s"'<>]+|teams\.microsoft\.com\/[^\s"'<>]+|meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}|webex\.com\/[^\s"'<>]+)/i
      );
      if (meetingMatch) {
        event.meetingLink = meetingMatch[0];
      }

      if (event.summary && event.date) {
        events.push(event);
      }
    }

    return events;
  }
}

module.exports = CalendarService;

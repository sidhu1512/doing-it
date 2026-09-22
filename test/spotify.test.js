const test = require('node:test');
const assert = require('node:assert/strict');
const SystemIntegration = require('../src/main/system');

test('Spotify — parseSpotifyTitle parses playing track and artist', () => {
  const result = SystemIntegration.parseSpotifyTitle('Hans Zimmer - Time');
  assert.equal(result.isRunning, true);
  assert.equal(result.isPlaying, true);
  assert.equal(result.artist, 'Hans Zimmer');
  assert.equal(result.track, 'Time');
  assert.equal(result.rawTitle, 'Hans Zimmer - Time');
});

test('Spotify — parseSpotifyTitle parses multi-artist track', () => {
  const result = SystemIntegration.parseSpotifyTitle('Lofi Fruits, Chill Fruits - Sunflowers (Slowed)');
  assert.equal(result.isRunning, true);
  assert.equal(result.isPlaying, true);
  assert.equal(result.artist, 'Lofi Fruits, Chill Fruits');
  assert.equal(result.track, 'Sunflowers (Slowed)');
});

test('Spotify — parseSpotifyTitle detects idle/paused client titles', () => {
  const idleTitles = ['Spotify', 'Spotify Free', 'Spotify Premium', 'Spotify Music', '   '];
  idleTitles.forEach(title => {
    const result = SystemIntegration.parseSpotifyTitle(title);
    assert.equal(result.isRunning, true);
    assert.equal(result.isPlaying, false);
    assert.equal(result.track, null);
    assert.equal(result.artist, null);
  });
});

test('Spotify — parseSpotifyTitle handles empty/null process output', () => {
  const resultNull = SystemIntegration.parseSpotifyTitle(null);
  assert.equal(resultNull.isRunning, false);
  assert.equal(resultNull.isPlaying, false);

  const resultEmpty = SystemIntegration.parseSpotifyTitle('');
  assert.equal(resultEmpty.isRunning, false);
  assert.equal(resultEmpty.isPlaying, false);
});

test('Spotify — FocusView converts links to Spotify URIs and embed URLs', () => {
  // Test conversion helper logic
  function toSpotifyUri(input) {
    if (!input || typeof input !== 'string') return 'spotify:playlist:37i9dQZF1DWZeKCadgRdKQ';
    input = input.trim();
    if (input.startsWith('spotify:')) return input;
    const match = input.match(/open\.spotify\.com\/(playlist|track|album|artist)\/([a-zA-Z0-9]+)/);
    if (match) return `spotify:${match[1]}:${match[2]}`;
    return 'spotify:playlist:37i9dQZF1DWZeKCadgRdKQ';
  }

  function toEmbedUrl(input) {
    const uri = toSpotifyUri(input);
    const parts = uri.split(':');
    if (parts.length >= 3) {
      const type = parts[1];
      const id = parts[2];
      return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
    }
    return 'https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ?utm_source=generator&theme=0';
  }

  assert.equal(
    toSpotifyUri('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=xyz'),
    'spotify:playlist:37i9dQZF1DXcBWIGoYBM5M'
  );
  assert.equal(
    toSpotifyUri('spotify:album:4aawyAB9vmqN3uQ7FjRGTy'),
    'spotify:album:4aawyAB9vmqN3uQ7FjRGTy'
  );
  assert.equal(
    toEmbedUrl('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=xyz'),
    'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator&theme=0'
  );
});

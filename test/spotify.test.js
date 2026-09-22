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

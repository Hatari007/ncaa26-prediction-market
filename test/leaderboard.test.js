import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildLeaderboard,
  buildRecentResults,
  buildLeaderboardReport,
} from '../src/leaderboard.js';

const users = [
  { id: 'u1', displayName: 'Ava' },
  { id: 'u2', displayName: 'Ben' },
  { id: 'u3', displayName: 'Cara' },
];

const markets = [
  {
    id: 'm1',
    question: 'Team A wins?',
    pointValue: 1,
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
    ],
    resolvedOptionId: 'yes',
    resolvedAt: '2026-04-09T10:00:00Z',
  },
  {
    id: 'm2',
    question: 'Team B over 20 points?',
    pointValue: 2,
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
    ],
    resolvedOptionId: 'no',
    resolvedAt: '2026-04-10T10:00:00Z',
  },
  {
    id: 'm3',
    question: 'Unresolved market',
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
    ],
    resolvedOptionId: null,
  },
];

const picks = [
  { userId: 'u1', marketId: 'm1', optionId: 'yes' },
  { userId: 'u1', marketId: 'm2', optionId: 'yes' },
  { userId: 'u1', marketId: 'm3', optionId: 'yes' },
  { userId: 'u2', marketId: 'm1', optionId: 'yes' },
  { userId: 'u2', marketId: 'm2', optionId: 'no' },
  { userId: 'u3', marketId: 'm1', optionId: 'no' },
];

test('buildLeaderboard counts resolved markets and weighted points', () => {
  const rows = buildLeaderboard(users, markets, picks);

  assert.equal(rows[0].displayName, 'Ben');
  assert.equal(rows[0].correctPicks, 2);
  assert.equal(rows[0].points, 3);
  assert.equal(rows[0].resolvedParticipated, 2);
  assert.equal(rows[0].accuracy, 100);

  assert.equal(rows[1].displayName, 'Ava');
  assert.equal(rows[1].correctPicks, 1);
  assert.equal(rows[1].points, 1);
  assert.equal(rows[1].resolvedParticipated, 2);
  assert.equal(rows[1].accuracy, 50);
});

test('buildRecentResults returns newest resolved markets first', () => {
  const results = buildRecentResults(markets, picks, { limit: 2 });

  assert.equal(results.length, 2);
  assert.equal(results[0].marketId, 'm2');
  assert.equal(results[1].marketId, 'm1');
  assert.equal(results[0].resolvedOptionLabel, 'No');
  assert.equal(results[0].participantCount, 2);
  assert.equal(results[0].correctPickCount, 1);
});

test('buildLeaderboardReport returns leaderboard and recent sections', () => {
  const report = buildLeaderboardReport(users, markets, picks, { recentLimit: 1 });

  assert.equal(report.leaderboard.length, 3);
  assert.equal(report.recentResults.length, 1);
});

/**
 * Mock data mirrors planned Supabase tables.
 * Replace fetch calls with real Supabase queries when backend is wired.
 */
export const markets = [
  {
    id: 'mkt-1',
    title: 'Will Coach Meme take Akron to the CFP?',
    description: 'Dynasty Year 2 chaos line. Public says no. Sickos say yes.',
    state: 'open',
    options: ['Yes', 'No'],
    closesAt: '2026-09-15T23:00:00Z'
  },
  {
    id: 'mkt-2',
    title: 'First rage-quit stream before Week 5?',
    description: 'Book has this juiced to the moon.',
    state: 'locked',
    options: ['Happens', 'No chance'],
    closesAt: '2026-08-28T00:00:00Z'
  },
  {
    id: 'mkt-3',
    title: 'Will the fake Heisman winner be a punter?',
    description: 'Gameplay sliders are suspicious. You know it, I know it.',
    state: 'resolved',
    resolution: 'No',
    options: ['Yes', 'No'],
    closesAt: '2026-11-10T00:00:00Z'
  }
];

export const leaderboard = [
  { id: 'u1', displayName: 'GridironGandalf', correctPicks: 18, totalPicks: 24 },
  { id: 'u2', displayName: '4VertsOnly', correctPicks: 16, totalPicks: 22 },
  { id: 'u3', displayName: 'PuntGod420', correctPicks: 11, totalPicks: 19 }
];

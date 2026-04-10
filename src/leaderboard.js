/**
 * Leaderboard logic for a prediction market app.
 *
 * Data model expected by these functions:
 * - users: [{ id: string, displayName: string }]
 * - markets: [
 *    {
 *      id: string,
 *      question: string,
 *      options: [{ id: string, label: string }],
 *      resolvedOptionId?: string | null,
 *      resolvedAt?: string | Date | null
 *    }
 *   ]
 * - picks: [{ userId: string, marketId: string, optionId: string }]
 */

/**
 * A market is considered resolved only when it has a resolvedOptionId.
 */
function isResolvedMarket(market) {
  return Boolean(market && market.resolvedOptionId);
}

/**
 * Build a quick lookup table for users by id.
 */
function buildUserLookup(users) {
  const map = new Map();
  for (const user of users) {
    map.set(user.id, user);
  }
  return map;
}

/**
 * Build a quick lookup table for markets by id.
 */
function buildMarketLookup(markets) {
  const map = new Map();
  for (const market of markets) {
    map.set(market.id, market);
  }
  return map;
}

/**
 * Sort helper for leaderboard tie-break rules:
 * 1) more correct picks
 * 2) better accuracy
 * 3) alphabetical display name
 */
function compareLeaderboardRows(a, b) {
  if (b.correctPicks !== a.correctPicks) {
    return b.correctPicks - a.correctPicks;
  }

  if (b.accuracy !== a.accuracy) {
    return b.accuracy - a.accuracy;
  }

  return a.displayName.localeCompare(b.displayName, undefined, {
    sensitivity: 'base',
  });
}

/**
 * Build leaderboard rows from raw picks.
 *
 * Only resolved markets are counted.
 * Each user gets 1 correct point when pick.optionId === market.resolvedOptionId.
 */
function buildLeaderboard(users, markets, picks) {
  const usersById = buildUserLookup(users);
  const marketsById = buildMarketLookup(markets);

  // Start everyone at zero so we can still show users with no resolved participation.
  const statsByUserId = new Map();
  for (const user of users) {
    statsByUserId.set(user.id, {
      userId: user.id,
      displayName: user.displayName,
      correctPicks: 0,
      resolvedParticipated: 0,
      accuracy: 0,
    });
  }

  // Keep query logic intentionally straightforward:
  // 1) iterate picks
  // 2) ignore picks for unresolved markets
  // 3) increment participation and correctness
  for (const pick of picks) {
    const market = marketsById.get(pick.marketId);
    if (!isResolvedMarket(market)) {
      continue;
    }

    const user = usersById.get(pick.userId);
    if (!user) {
      // Defensive guard: skip orphaned picks.
      continue;
    }

    const stats = statsByUserId.get(user.id);
    stats.resolvedParticipated += 1;

    if (pick.optionId === market.resolvedOptionId) {
      stats.correctPicks += 1;
    }
  }

  const rows = Array.from(statsByUserId.values()).map((row) => {
    const accuracy =
      row.resolvedParticipated === 0
        ? 0
        : (row.correctPicks / row.resolvedParticipated) * 100;

    return {
      ...row,
      accuracy,
    };
  });

  rows.sort(compareLeaderboardRows);

  // Assign final rank after sorting.
  rows.forEach((row, index) => {
    row.rank = index + 1;
  });

  return rows;
}

/**
 * Build a recent resolved results section.
 *
 * The section returns the newest resolved markets first and includes
 * a winner label plus high-level participation information.
 */
function buildRecentResults(markets, picks, { limit = 5 } = {}) {
  const picksByMarketId = new Map();
  for (const pick of picks) {
    if (!picksByMarketId.has(pick.marketId)) {
      picksByMarketId.set(pick.marketId, []);
    }
    picksByMarketId.get(pick.marketId).push(pick);
  }

  const resolvedMarkets = markets.filter(isResolvedMarket);

  resolvedMarkets.sort((a, b) => {
    const aTime = new Date(a.resolvedAt || 0).getTime();
    const bTime = new Date(b.resolvedAt || 0).getTime();
    return bTime - aTime;
  });

  return resolvedMarkets.slice(0, limit).map((market) => {
    const marketPicks = picksByMarketId.get(market.id) || [];
    const participants = new Set(marketPicks.map((pick) => pick.userId)).size;
    const correctCount = marketPicks.filter(
      (pick) => pick.optionId === market.resolvedOptionId
    ).length;

    const winningOption = market.options?.find(
      (opt) => opt.id === market.resolvedOptionId
    );

    return {
      marketId: market.id,
      question: market.question,
      resolvedAt: market.resolvedAt || null,
      resolvedOptionId: market.resolvedOptionId,
      resolvedOptionLabel: winningOption?.label || market.resolvedOptionId,
      participantCount: participants,
      correctPickCount: correctCount,
    };
  });
}

/**
 * One convenience method that returns everything needed by a leaderboard page.
 */
function buildLeaderboardReport(users, markets, picks, options = {}) {
  return {
    leaderboard: buildLeaderboard(users, markets, picks),
    recentResults: buildRecentResults(markets, picks, {
      limit: options.recentLimit || 5,
    }),
  };
}

module.exports = {
  buildLeaderboard,
  buildRecentResults,
  buildLeaderboardReport,
  // exported for direct testing
  compareLeaderboardRows,
  isResolvedMarket,
};

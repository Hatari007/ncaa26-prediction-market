(function init() {
  const config = window.APP_CONFIG;
  if (!config?.SUPABASE_URL || !config?.SUPABASE_ANON_KEY) {
    alert('Missing config.js. Copy config.example.js to config.js and fill values.');
    return;
  }

  const supabase = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

  const authStatus = document.getElementById('authStatus');
  const authForm = document.getElementById('authForm');
  const signupBtn = document.getElementById('signupBtn');
  const signoutBtn = document.getElementById('signoutBtn');
  const marketsEl = document.getElementById('markets');
  const leaderboardEl = document.getElementById('leaderboard');
  const adminCard = document.getElementById('adminCard');
  const marketForm = document.getElementById('marketForm');

  let currentUser = null;
  let isAdmin = false;

  function statusText(message) {
    authStatus.innerHTML = `<p class="small">${message}</p>`;
  }

  async function ensureProfile(user) {
    await supabase.from('profiles').upsert({ id: user.id, display_name: user.email }, { onConflict: 'id' });
    const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    isAdmin = !!data?.is_admin;
    adminCard.classList.toggle('hidden', !isAdmin);
  }

  function marketPickButtons(market, myPick) {
    if (market.status !== 'open') return '<p class="small">Market is not open for picks.</p>';

    return `
      <div class="row">
        <button data-pick="A" data-market="${market.id}">${market.option_a}${myPick === 'A' ? ' (Your pick)' : ''}</button>
        <button data-pick="B" data-market="${market.id}">${market.option_b}${myPick === 'B' ? ' (Your pick)' : ''}</button>
      </div>
    `;
  }

  function adminControls(market) {
    if (!isAdmin) return '';
    return `
      <div class="row">
        <button data-lock="${market.id}">Lock</button>
        <button data-open="${market.id}">Open</button>
        <button data-resolve="${market.id}" data-correct="A">Resolve A</button>
        <button data-resolve="${market.id}" data-correct="B">Resolve B</button>
      </div>
    `;
  }

  async function loadMarkets() {
    if (!currentUser) {
      marketsEl.innerHTML = '<p class="small">Sign in to view and pick markets.</p>';
      return;
    }

    const [{ data: markets }, { data: picks }] = await Promise.all([
      supabase.from('markets').select('*').order('created_at', { ascending: false }),
      supabase.from('picks').select('market_id,pick').eq('user_id', currentUser.id)
    ]);

    const pickMap = new Map((picks || []).map((p) => [p.market_id, p.pick]));

    marketsEl.innerHTML = (markets || [])
      .map(
        (market) => `
      <article class="market">
        <h3>${market.title}</h3>
        <p>${market.description || ''}</p>
        <p class="small">Status: ${market.status}</p>
        ${marketPickButtons(market, pickMap.get(market.id))}
        ${adminControls(market)}
      </article>
    `
      )
      .join('');
  }

  async function loadLeaderboard() {
    if (!currentUser) {
      leaderboardEl.innerHTML = '<p class="small">Sign in to view leaderboard.</p>';
      return;
    }

    const { data: resolved } = await supabase.from('markets').select('id,correct_option').eq('status', 'resolved');
    if (!resolved?.length) {
      leaderboardEl.innerHTML = '<p class="small">No resolved markets yet.</p>';
      return;
    }

    const correctByMarket = new Map(resolved.map((m) => [m.id, m.correct_option]));
    const resolvedIds = resolved.map((m) => m.id);

    const { data: picks } = await supabase
      .from('picks')
      .select('user_id,pick,market_id,profiles!inner(display_name)')
      .in('market_id', resolvedIds);

    const scores = new Map();
    (picks || []).forEach((p) => {
      const name = p.profiles?.display_name || p.user_id;
      const current = scores.get(name) || 0;
      const isCorrect = correctByMarket.get(p.market_id) === p.pick;
      scores.set(name, current + (isCorrect ? 1 : 0));
    });

    const rows = [...scores.entries()].sort((a, b) => b[1] - a[1]);
    leaderboardEl.innerHTML = rows.map(([name, score]) => `<p>${name}: ${score}</p>`).join('');
  }

  async function setMarketStatus(id, status, correctOption) {
    const payload = { status, updated_at: new Date().toISOString() };
    if (correctOption) payload.correct_option = correctOption;
    await supabase.from('markets').update(payload).eq('id', id);
    await refresh();
  }

  async function submitPick(marketId, pick) {
    await supabase.from('picks').upsert(
      { market_id: Number(marketId), user_id: currentUser.id, pick },
      { onConflict: 'market_id,user_id' }
    );
    await loadMarkets();
  }

  async function refresh() {
    await Promise.all([loadMarkets(), loadLeaderboard()]);
  }

  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) statusText(`Sign in failed: ${error.message}`);
  });

  signupBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { error } = await supabase.auth.signUp({ email, password });
    statusText(error ? `Sign up failed: ${error.message}` : 'Sign up successful. Check your email settings.');
  });

  signoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
  });

  marketsEl.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.dataset.pick) {
      await submitPick(target.dataset.market, target.dataset.pick);
      return;
    }

    if (target.dataset.lock) await setMarketStatus(Number(target.dataset.lock), 'locked');
    if (target.dataset.open) await setMarketStatus(Number(target.dataset.open), 'open');
    if (target.dataset.resolve) {
      await setMarketStatus(Number(target.dataset.resolve), 'resolved', target.dataset.correct);
    }
  });

  marketForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = {
      title: document.getElementById('marketTitle').value,
      description: document.getElementById('marketDesc').value,
      option_a: document.getElementById('optionA').value,
      option_b: document.getElementById('optionB').value,
      status: 'open',
      created_by: currentUser.id
    };

    await supabase.from('markets').insert(payload);
    marketForm.reset();
    await refresh();
  });

  supabase.auth.onAuthStateChange(async (_, session) => {
    currentUser = session?.user || null;
    signoutBtn.classList.toggle('hidden', !currentUser);

    if (!currentUser) {
      isAdmin = false;
      adminCard.classList.add('hidden');
      statusText('Not signed in.');
      await refresh();
      return;
    }

    await ensureProfile(currentUser);
    statusText(`Signed in as ${currentUser.email}${isAdmin ? ' (admin)' : ''}`);
    await refresh();
  });

  supabase.auth.getSession().then(({ data }) => {
    currentUser = data?.session?.user || null;
    if (!currentUser) {
      statusText('Not signed in.');
      refresh();
    }
  });
})();

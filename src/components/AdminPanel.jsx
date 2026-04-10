import { useMemo, useState } from 'react';

function toLocalInputValue(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n) => `${n}`.padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminPanel({ markets, onCreate, onUpdate, onAddOption, onResolve, busy }) {
  const [newMarket, setNewMarket] = useState({ title: '', description: '', lock_time: '' });
  const editableMarkets = useMemo(() => markets.map((m) => ({ ...m, lock_local: toLocalInputValue(m.lock_time) })), [markets]);

  return (
    <section>
      <h2>Admin Console</h2>
      <p className="muted">Create, tweak, and resolve markets like a benevolent chaos commissioner.</p>

      <div className="admin-card">
        <h3>Create market</h3>
        <div className="form-grid">
          <input
            placeholder="Market title"
            value={newMarket.title}
            onChange={(e) => setNewMarket((prev) => ({ ...prev, title: e.target.value }))}
          />
          <input
            type="datetime-local"
            value={newMarket.lock_time}
            onChange={(e) => setNewMarket((prev) => ({ ...prev, lock_time: e.target.value }))}
          />
          <textarea
            placeholder="Description"
            value={newMarket.description}
            onChange={(e) => setNewMarket((prev) => ({ ...prev, description: e.target.value }))}
          />
          <button
            disabled={busy}
            onClick={async () => {
              await onCreate(newMarket);
              setNewMarket({ title: '', description: '', lock_time: '' });
            }}
          >
            Create market
          </button>
        </div>
      </div>

      {editableMarkets.map((market) => (
        <div className="admin-card" key={market.id}>
          <h3>{market.title}</h3>
          <div className="form-grid">
            <input
              defaultValue={market.title}
              onBlur={(e) => onUpdate(market.id, { title: e.target.value })}
            />
            <input
              defaultValue={market.description}
              onBlur={(e) => onUpdate(market.id, { description: e.target.value })}
            />
            <input
              type="datetime-local"
              defaultValue={market.lock_local}
              onBlur={(e) => onUpdate(market.id, { lock_time: new Date(e.target.value).toISOString() })}
            />
            <AddOptionForm busy={busy} onAdd={(label) => onAddOption(market.id, label)} />
            <ResolveSelect market={market} onResolve={onResolve} busy={busy} />
          </div>
        </div>
      ))}
    </section>
  );
}

function AddOptionForm({ onAdd, busy }) {
  const [label, setLabel] = useState('');

  return (
    <div className="inline-form">
      <input placeholder="New option label" value={label} onChange={(e) => setLabel(e.target.value)} />
      <button
        disabled={busy}
        onClick={async () => {
          if (!label.trim()) return;
          await onAdd(label.trim());
          setLabel('');
        }}
      >
        Add option
      </button>
    </div>
  );
}

function ResolveSelect({ market, onResolve, busy }) {
  return (
    <div className="inline-form">
      <select defaultValue="" onChange={(e) => e.target.value && onResolve(market.id, e.target.value)} disabled={busy || !!market.resolved_option_id}>
        <option value="">Resolve market...</option>
        {market.options.map((option) => (
          <option value={option.id} key={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      {market.resolved_option_id && <span className="muted">Already resolved</span>}
    </div>
  );
}

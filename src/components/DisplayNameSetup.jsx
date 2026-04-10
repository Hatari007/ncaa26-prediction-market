import { useState } from 'react';

export function DisplayNameSetup({ onSave, loading }) {
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = displayName.trim();

    if (trimmed.length < 2) {
      setError('Display name must be at least 2 characters.');
      return;
    }

    if (trimmed.length > 24) {
      setError('Display name must be 24 characters or fewer.');
      return;
    }

    setError('');
    await onSave(trimmed);
  };

  return (
    <div className="center-card">
      <h2>Pick your display name</h2>
      <p>This is how you'll appear on the leaderboard.</p>
      <form onSubmit={handleSubmit} className="form-stack">
        <label>
          Display name
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="BracketBandit"
            maxLength={24}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button disabled={loading}>{loading ? 'Saving...' : 'Save name'}</button>
      </form>
    </div>
  );
}

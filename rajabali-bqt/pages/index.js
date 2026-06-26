import { useState, useEffect, useCallback } from 'react';
import { STORES, ROLES, NET_ORDER, NL_MAP, WEEKS } from '../lib/data';

const ROLE_OPTIONS = Object.entries(ROLES).map(([key, val]) => ({ key, ...val }));

function scoreColor(s) {
  if (s < 2.5) return { bg: '#FEECEC', color: '#991B1B', border: '#FCA5A5' };
  if (s < 3.0) return { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' };
  if (s < 3.5) return { bg: '#FEF9C3', color: '#854D0E', border: '#FDE047' };
  return { bg: '#DCFCE7', color: '#166534', border: '#86EFAC' };
}

function getTrend(scores) {
  const v = scores.filter(s => s !== null && s !== undefined);
  if (v.length < 4) return '→';
  const h = Math.floor(v.length / 2);
  const a1 = v.slice(0, h).reduce((a, x) => a + x, 0) / h;
  const a2 = v.slice(-h).reduce((a, x) => a + x, 0) / h;
  return a2 - a1 > 0.2 ? '↑' : a1 - a2 > 0.2 ? '↓' : '→';
}

function statusLabel(s) {
  return { pending: 'Pending', inprogress: 'In progress', oncourse: 'On course', atrisk: 'At risk' }[s] || 'Pending';
}

function statusStyle(s) {
  const styles = {
    pending:    { bg: '#F3F4F6', color: '#6B7280', border: '#D1D5DB' },
    inprogress: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
    oncourse:   { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
    atrisk:     { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
  };
  return styles[s] || styles.pending;
}

const NET_COLORS = {
  GRG:   { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', accent: '#2563EB' },
  Omala: { bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE', accent: '#7C3AED' },
  TRG:   { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0', accent: '#16A34A' },
  VRG:   { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', accent: '#D97706' },
};

export default function Home() {
  const [role, setRole] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [storeStatus, setStoreStatus] = useState({});
  const [visitLogs, setVisitLogs] = useState([]);
  const [visitTracker, setVisitTracker] = useState({});
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(false);

  const [vStore, setVStore] = useState('');
  const [vDate, setVDate] = useState('');
  const [vWeek, setVWeek] = useState('');
  const [vFocus, setVFocus] = useState('Speed of service');
  const [vNotes, setVNotes] = useState('');
  const [vProgress, setVProgress] = useState('improving');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [filterNet, setFilterNet] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [logFilterStore, setLogFilterStore] = useState('');
  const [logFilterNet, setLogFilterNet] = useState('');

  const currentRole = role ? ROLES[role] : null;

  const visibleStores = currentRole
    ? STORES.filter(s => currentRole.networks.includes(s.network))
    : [];

  const myStores = currentRole?.arlName
    ? visibleStores.filter(s => s.arl === currentRole.arlName)
    : visibleStores;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, visitsRes, trackerRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/visits'),
        fetch('/api/tracker'),
      ]);
      const [statusData, visitsData, trackerData] = await Promise.all([
        statusRes.json(),
        visitsRes.json(),
        trackerRes.json(),
      ]);
      setStoreStatus(statusData);
      setVisitLogs(Array.isArray(visitsData) ? visitsData : []);
      setVisitTracker(trackerData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (role) fetchAll();
  }, [role, fetchAll]);

  async function updateStatus(storeName, field, value) {
    const current = storeStatus[storeName] || { status: 'pending', opsComplete: false, planSubmitted: false };
    const updated = { ...current, [field]: value };
    setStoreStatus(prev => ({ ...prev, [storeName]: updated }));
    await fetch('/api/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_name: storeName,
        status: updated.status,
        ops_complete: updated.opsComplete,
        plan_submitted: updated.planSubmitted,
      }),
    });
  }

  async function cycleStatus(storeName, e) {
    e.stopPropagation();
    const cycle = ['pending', 'inprogress', 'oncourse', 'atrisk'];
    const cur = storeStatus[storeName]?.status || 'pending';
    const next = cycle[(cycle.indexOf(cur) + 1) % 4];
    await updateStatus(storeName, 'status', next);
  }

  async function toggleCheck(storeName, field, e) {
    e.stopPropagation();
    const cur = storeStatus[storeName]?.[field] || false;
    await updateStatus(storeName, field, !cur);
  }

  async function toggleVisitWeek(storeName, week) {
    const current = visitTracker[storeName]?.[week];
    const newVal = !current;
    setVisitTracker(prev => ({
      ...prev,
      [storeName]: { ...(prev[storeName] || {}), [week]: newVal },
    }));
    await fetch('/api/tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store_name: storeName, week_number: week, completed: newVal }),
    });
  }

  async function submitVisit(e) {
    e.preventDefault();
    if (!vStore || !vDate || !vWeek) return;
    setSaving(true);
    const storeData = STORES.find(s => s.store === vStore);
    await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_name: vStore,
        network: storeData?.network || '',
        visit_date: vDate,
        q3_week: parseInt(vWeek),
        focus_area: vFocus,
        coaching_notes: vNotes,
        progress: vProgress,
        logged_by: currentRole?.name || 'Unknown',
      }),
    });
    await toggleVisitWeek(vStore, parseInt(vWeek));
    await fetchAll();
    setVStore(''); setVDate(''); setVWeek(''); setVNotes('');
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (!role) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f0', padding: '2rem' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '2.5rem', width: '100%', maxWidth: 480, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#6B7280', textTransform: 'uppercase', marginBottom: 6 }}>The Rajabali Group</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#111', marginBottom: 4 }}>Q2 Bottom Quartile Tracker</div>
            <div style={{ fontSize: 14, color: '#6B7280' }}>Select your name to continue</div>
          </div>
          {NET_ORDER.map(net => {
            const netRoles = ROLE_OPTIONS.filter(r => r.networks.length === 1 && r.networks[0] === net);
            const nc = NET_COLORS[net];
            return (
              <div key={net} style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: nc.color, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{net} — {NL_MAP[net]}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {netRoles.map(r => (
                    <button key={r.key} onClick={() => setRole(r.key)}
                      style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 14px', textAlign: 'left', fontSize: 14, color: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = nc.accent}
                      onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E7EB'}>
                      <span>{r.name}</span>
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #F3F4F6', paddingTop: '1rem' }}>
            <button onClick={() => setRole('VP')} style={{ width: '100%', background: '#111', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 16px', fontSize: 14, fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Anthony Rodriguez</span>
              <span style={{ fontSize: 11, opacity: 0.7 }}>VP of Operations</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isVP = role === 'VP';
  const isNL = role.startsWith('NL_');
  const isARL = role.startsWith('ARL_');
  const nc = currentRole.networks.length === 1 ? NET_COLORS[currentRole.networks[0]] : { accent: '#111', color: '#111', bg: '#F9FAFB', border: '#E5E7EB' };
  const canEdit = isVP || isNL || isARL;

  const filteredStores = visibleStores.filter(s => {
    if (filterNet && s.network !== filterNet) return false;
    if (filterStatus && (storeStatus[s.store]?.status || 'pending') !== filterStatus) return false;
    if (filterSearch && !s.store.toLowerCase().includes(filterSearch.toLowerCase())) return false;
    return true;
  });

  const filteredLogs = visitLogs.filter(l => {
    if (logFilterStore && l.store_name !== logFilterStore) return false;
    if (logFilterNet && l.network !== logFilterNet) return false;
    if (isARL && l.logged_by !== currentRole.name) return false;
    return true;
  });

  const opsCount = myStores.filter(s => storeStatus[s.store]?.opsComplete).length;
  const planCount = myStores.filter(s => storeStatus[s.store]?.planSubmitted).length;
  const visitTotal = myStores.reduce((a, s) => a + Object.values(visitTracker[s.store] || {}).filter(Boolean).length, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f0' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>BQ Tracker</div>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>Q2 2026</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 13, color: '#374151' }}>{currentRole.name}</div>
            <div style={{ fontSize: 11, background: nc.bg, color: nc.color, border: `1px solid ${nc.border}`, borderRadius: 20, padding: '2px 10px', fontWeight: 500 }}>{currentRole.label}</div>
            <button onClick={() => { setRole(null); setSelectedStore(null); }} style={{ fontSize: 12, color: '#9CA3AF', background: 'none', border: '1px solid #E5E7EB', borderRadius: 6, padding: '4px 10px' }}>Switch</button>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', padding: '0 1.5rem' }}>
          {['dashboard', 'stores', 'visitlog', ...(isVP ? ['alerts'] : [])].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: tab === t ? '#111' : '#6B7280', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #111' : '2px solid transparent', marginBottom: -1 }}>
              {t === 'visitlog' ? 'Visit log' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem' }}>
        {loading && <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem', fontSize: 14 }}>Loading...</div>}

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: '1.5rem' }}>
              {[
                { label: 'BQ stores', value: myStores.length, sub: 'bottom 25% per network' },
                { label: 'DDOA complete', value: `${opsCount} / ${myStores.length}`, sub: 'assessments done' },
                { label: 'Action plans', value: `${planCount} / ${myStores.length}`, sub: 'submitted' },
                { label: 'Q3 visits logged', value: visitTotal, sub: 'across all stores' },
              ].map(m => (
                <div key={m.label} style={{ background: '#fff', borderRadius: 10, padding: '1rem', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 600, color: '#111' }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {NET_ORDER.filter(n => currentRole.networks.includes(n)).map(net => {
              const stores = myStores.filter(s => s.network === net);
              if (stores.length === 0) return null;
              const netAvg = (stores.reduce((a, s) => a + s.avgScore, 0) / stores.length).toFixed(2);
              const nc2 = NET_COLORS[net];
              return (
                <div key={net} style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', border: '1px solid #E5E7EB', borderLeft: `3px solid ${nc2.accent}`, borderRadius: 8, padding: '8px 14px', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{net}</span>
                      <span style={{ fontSize: 11, background: nc2.bg, color: nc2.color, border: `1px solid ${nc2.border}`, borderRadius: 20, padding: '1px 8px', fontWeight: 500 }}>{NL_MAP[net]}</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>{stores.length} BQ stores · avg {netAvg}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {stores.map(s => {
                      const st = storeStatus[s.store] || {};
                      const trend = getTrend(s.weeklyScores);
                      const sc = scoreColor(s.avgScore);
                      const ss = statusStyle(st.status || 'pending');
                      const visitsDone = Object.values(visitTracker[s.store] || {}).filter(Boolean).length;
                      const isSelected = selectedStore === s.store;
                      return (
                        <div key={s.store} onClick={() => setSelectedStore(isSelected ? null : s.store)}
                          style={{ background: '#fff', border: `1px solid ${isSelected ? '#111' : '#E5E7EB'}`, borderRadius: 12, padding: '12px 14px', cursor: 'pointer', transition: 'border-color 0.15s' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{s.store}</div>
                            <span style={{ fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 20, padding: '1px 8px' }}>{s.avgScore.toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
                            <span>{s.arl.split(' ').slice(-1)[0]}</span>
                            <span style={{ color: '#9CA3AF' }}>#{s.networkRank}/{s.networkTotal}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 24, marginBottom: 8 }}>
                            {s.weeklyScores.map((sc2, i) => (
                              <div key={i} style={{ flex: 1, height: Math.max(3, sc2 / 5 * 24), borderRadius: '2px 2px 0 0', background: sc2 < 2.5 ? '#EF4444' : sc2 < 3.0 ? '#F59E0B' : '#22C55E' }} />
                            ))}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <button onClick={e => cycleStatus(s.store, e)} style={{ fontSize: 11, fontWeight: 500, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, borderRadius: 20, padding: '2px 10px', cursor: 'pointer' }}>
                              {statusLabel(st.status || 'pending')}
                            </button>
                            <span style={{ fontSize: 11, color: trend === '↑' ? '#16A34A' : trend === '↓' ? '#DC2626' : '#6B7280', fontWeight: 500 }}>
                              {trend} {visitsDone > 0 ? `· ${visitsDone}/13` : ''}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#6B7280' }} onClick={e => e.stopPropagation()}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                              <input type="checkbox" checked={!!st.opsComplete} onChange={e => toggleCheck(s.store, 'opsComplete', e)} style={{ width: 'auto' }} />
                              DDOA Complete
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                              <input type="checkbox" checked={!!st.planSubmitted} onChange={e => toggleCheck(s.store, 'planSubmitted', e)} style={{ width: 'auto' }} />
                              Plan submitted
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {stores.filter(s => s.store === selectedStore).map(s => (
                    <div key={s.store} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '1.25rem', marginTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 600, color: '#111' }}>{s.store}</div>
                          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{s.network} · NL: {s.nl} · ARL: {s.arl} · Q2 avg: {s.avgScore.toFixed(2)} · Rank #{s.networkRank}/{s.networkTotal}</div>
                        </div>
                        <button onClick={() => setSelectedStore(null)} style={{ background: 'none', border: 'none', fontSize: 18, color: '#9CA3AF', padding: 4 }}>×</button>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Q2 weekly RPS scores</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3, marginBottom: 4 }}>
                        {s.weeklyScores.map((sc2, i) => {
                          const wc = scoreColor(sc2);
                          return (
                            <div key={i} style={{ textAlign: 'center' }}>
                              <div style={{ background: wc.bg, borderRadius: 4, padding: '4px 2px' }}>
                                <div style={{ fontSize: 10, fontWeight: 600, color: wc.color }}>{sc2.toFixed(1)}</div>
                              </div>
                              <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2 }}>{WEEKS[i].replace('WE ', '')}</div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic', marginBottom: '1rem' }}>Week 13 (WE 06/27) pending</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Q3 visit tracker — click to mark completed</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 3 }}>
                        {Array.from({ length: 13 }, (_, i) => i + 1).map(w => {
                          const done = visitTracker[s.store]?.[w];
                          return (
                            <button key={w} onClick={() => toggleVisitWeek(s.store, w)}
                              style={{ aspectRatio: '1', borderRadius: 4, border: `1px solid ${done ? '#86EFAC' : '#E5E7EB'}`, background: done ? '#F0FDF4' : '#fff', color: done ? '#16A34A' : '#9CA3AF', fontSize: 10, fontWeight: done ? 600 : 400, cursor: 'pointer' }}>
                              {done ? '✓' : w}
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ marginTop: '1rem' }}>
                        <button onClick={() => { setTab('visitlog'); setVStore(s.store); }} style={{ fontSize: 12, background: '#111', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', cursor: 'pointer' }}>
                          + Log a visit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* STORES TABLE */}
        {tab === 'stores' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
              {isVP && (
                <select value={filterNet} onChange={e => setFilterNet(e.target.value)} style={{ fontSize: 13, padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', color: '#111' }}>
                  <option value="">All networks</option>
                  {NET_ORDER.map(n => <option key={n}>{n}</option>)}
                </select>
              )}
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ fontSize: 13, padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', color: '#111' }}>
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="inprogress">In progress</option>
                <option value="oncourse">On course</option>
                <option value="atrisk">At risk</option>
              </select>
              <input value={filterSearch} onChange={e => setFilterSearch(e.target.value)} placeholder="Search store…" style={{ fontSize: 13, padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: 8, flex: 1, minWidth: 140, background: '#fff', color: '#111' }} />
            </div>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                    {['Store', 'Network', 'ARL', 'Q2 avg', 'Rank', 'Trend', 'Status', 'DDOA', 'Plan'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStores.sort((a, b) => a.network.localeCompare(b.network) || a.networkRank - b.networkRank).map(s => {
                    const st = storeStatus[s.store] || {};
                    const trend = getTrend(s.weeklyScores);
                    const sc = scoreColor(s.avgScore);
                    const ss = statusStyle(st.status || 'pending');
                    const nc2 = NET_COLORS[s.network];
                    return (
                      <tr key={s.store} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '9px 12px', fontWeight: 500 }}>{s.store}</td>
                        <td style={{ padding: '9px 12px' }}><span style={{ fontSize: 11, background: nc2.bg, color: nc2.color, border: `1px solid ${nc2.border}`, borderRadius: 20, padding: '1px 8px', fontWeight: 500 }}>{s.network}</span></td>
                        <td style={{ padding: '9px 12px', color: '#6B7280', fontSize: 12 }}>{s.arl}</td>
                        <td style={{ padding: '9px 12px' }}><span style={{ fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color, borderRadius: 20, padding: '1px 8px' }}>{s.avgScore.toFixed(2)}</span></td>
                        <td style={{ padding: '9px 12px', color: '#9CA3AF', fontSize: 12 }}>#{s.networkRank}/{s.networkTotal}</td>
                        <td style={{ padding: '9px 12px', fontWeight: 600, color: trend === '↑' ? '#16A34A' : trend === '↓' ? '#DC2626' : '#6B7280' }}>{trend}</td>
                        <td style={{ padding: '9px 12px' }}>
                          <button onClick={e => cycleStatus(s.store, e)} style={{ fontSize: 11, fontWeight: 500, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, borderRadius: 20, padding: '2px 10px', cursor: 'pointer' }}>
                            {statusLabel(st.status || 'pending')}
                          </button>
                        </td>
                        <td style={{ padding: '9px 12px', color: st.opsComplete ? '#16A34A' : '#D1D5DB', fontSize: 16 }}>{st.opsComplete ? '✓' : '—'}</td>
                        <td style={{ padding: '9px 12px', color: st.planSubmitted ? '#16A34A' : '#D1D5DB', fontSize: 16 }}>{st.planSubmitted ? '✓' : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VISIT LOG */}
        {tab === 'visitlog' && (
          <div>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: '1rem' }}>Log a coaching visit</div>
              <form onSubmit={submitVisit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Store</label>
                    <select value={vStore} onChange={e => setVStore(e.target.value)} required style={{ width: '100%', fontSize: 13, padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', color: '#111' }}>
                      <option value="">Select store…</option>
                      {NET_ORDER.filter(n => currentRole.networks.includes(n)).map(net => (
                        <optgroup key={net} label={net}>
                          {myStores.filter(s => s.network === net).map(s => (
                            <option key={s.store} value={s.store}>{s.store}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Visit date</label>
                    <input type="date" value={vDate} onChange={e => setVDate(e.target.value)} required style={{ width: '100%', fontSize: 13, padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', color: '#111' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Q3 week #</label>
                    <select value={vWeek} onChange={e => setVWeek(e.target.value)} required style={{ width: '100%', fontSize: 13, padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', color: '#111' }}>
                      <option value="">Select week…</option>
                      {Array.from({ length: 13 }, (_, i) => i + 1).map(w => <option key={w} value={w}>Week {w}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Focus area</label>
                    <select value={vFocus} onChange={e => setVFocus(e.target.value)} style={{ width: '100%', fontSize: 13, padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', color: '#111' }}>
                      <option>Speed of service</option>
                      <option>Product quality</option>
                      <option>Guest experience</option>
                      <option>Food safety</option>
                      <option>DDOA follow-up</option>
                      <option>Action plan review</option>
                      <option>Team development</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Coaching notes & action taken</label>
                    <textarea value={vNotes} onChange={e => setVNotes(e.target.value)} placeholder="Key observations, actions taken, wins, gaps addressed…" style={{ width: '100%', fontSize: 13, padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: 8, minHeight: 80, resize: 'vertical', background: '#fff', color: '#111', fontFamily: 'inherit' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Progress direction</label>
                    <select value={vProgress} onChange={e => setVProgress(e.target.value)} style={{ width: '100%', fontSize: 13, padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', color: '#111' }}>
                      <option value="improving">↑ Improving</option>
                      <option value="stable">→ Stable</option>
                      <option value="declining">↓ Declining</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button type="submit" disabled={saving} style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    {saving ? 'Saving…' : 'Save visit log'}
                  </button>
                  {saved && <span style={{ fontSize: 13, color: '#16A34A', fontWeight: 500 }}>✓ Saved</span>}
                </div>
              </form>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
              <select value={logFilterStore} onChange={e => setLogFilterStore(e.target.value)} style={{ fontSize: 13, padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', color: '#111' }}>
                <option value="">All stores</option>
                {myStores.map(s => <option key={s.store} value={s.store}>{s.store}</option>)}
              </select>
              {(isVP || isNL) && (
                <select value={logFilterNet} onChange={e => setLogFilterNet(e.target.value)} style={{ fontSize: 13, padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', color: '#111' }}>
                  <option value="">All networks</option>
                  {NET_ORDER.map(n => <option key={n}>{n}</option>)}
                </select>
              )}
            </div>

            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              {filteredLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: '#9CA3AF', fontSize: 13 }}>No visits logged yet.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                      {['Date', 'Store', 'Week', 'Focus', 'Progress', 'Notes', 'Logged by'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map(l => {
                      const pColors = { improving: '#16A34A', stable: '#6B7280', declining: '#DC2626' };
                      const pLabels = { improving: '↑ Improving', stable: '→ Stable', declining: '↓ Declining' };
                      return (
                        <tr key={l.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '9px 12px', whiteSpace: 'nowrap', color: '#6B7280' }}>{l.visit_date ? String(l.visit_date).slice(0, 10) : ''}</td>
                          <td style={{ padding: '9px 12px', fontWeight: 500 }}>{l.store_name}</td>
                          <td style={{ padding: '9px 12px', color: '#6B7280' }}>Wk {l.q3_week}</td>
                          <td style={{ padding: '9px 12px', color: '#6B7280' }}>{l.focus_area}</td>
                          <td style={{ padding: '9px 12px', color: pColors[l.progress] || '#6B7280', fontWeight: 500 }}>{pLabels[l.progress] || l.progress}</td>
                          <td style={{ padding: '9px 12px', color: '#374151', maxWidth: 200 }}>{l.coaching_notes || '—'}</td>
                          <td style={{ padding: '9px 12px', color: '#9CA3AF', fontSize: 12 }}>{l.logged_by}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ALERTS — VP only */}
        {tab === 'alerts' && isVP && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Action needed</div>
            {STORES.filter(s => !storeStatus[s.store]?.opsComplete).map(s => (
              <div key={`ops-${s.store}`} style={{ background: '#fff', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', marginBottom: 6, display: 'flex', gap: 10 }}>
                <span style={{ color: '#D97706', fontSize: 15 }}>⚠</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>DDOA not complete — {s.store}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{s.network} · ARL: {s.arl} · Q2 avg: {s.avgScore.toFixed(2)}</div>
                </div>
              </div>
            ))}
            {STORES.filter(s => !storeStatus[s.store]?.planSubmitted).map(s => (
              <div key={`plan-${s.store}`} style={{ background: '#fff', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', marginBottom: 6, display: 'flex', gap: 10 }}>
                <span style={{ color: '#D97706', fontSize: 15 }}>⚠</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Action plan not submitted — {s.store}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{s.network} · ARL: {s.arl}</div>
                </div>
              </div>
            ))}
            {STORES.filter(s => storeStatus[s.store]?.status === 'atrisk').map(s => (
              <div key={`risk-${s.store}`} style={{ background: '#fff', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 6, display: 'flex', gap: 10 }}>
                <span style={{ color: '#DC2626', fontSize: 15 }}>🚨</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>At-risk status — {s.store}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{s.network} · Immediate attention required</div>
                </div>
              </div>
            ))}
            {STORES.filter(s => Object.values(visitTracker[s.store] || {}).filter(Boolean).length === 0).length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #BFDBFE', borderRadius: 10, padding: '10px 14px', marginBottom: 6, display: 'flex', gap: 10 }}>
                <span style={{ color: '#2563EB', fontSize: 15 }}>ℹ</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{STORES.filter(s => Object.values(visitTracker[s.store] || {}).filter(Boolean).length === 0).length} stores with no Q3 visits logged</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{STORES.filter(s => Object.values(visitTracker[s.store] || {}).filter(Boolean).length === 0).map(s => s.store).join(', ')}</div>
                </div>
              </div>
            )}
            <div style={{ background: '#fff', border: '1px solid #BFDBFE', borderRadius: 10, padding: '10px 14px', marginBottom: 6, display: 'flex', gap: 10 }}>
              <span style={{ color: '#2563EB', fontSize: 15 }}>ℹ</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Week 13 data pending</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>WE 06/27 uploads next week — BQ list will refresh to 13 weeks</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { C } from '../../utils/theme';

export const DENOMINATIONS = [500, 200, 100, 50, 20, 10, 5, 2, 1];

const DENOM_THEME = {
  500: { bg: '#E0F2FE', border: '#38BDF8', color: '#0369A1', label: '₹500 Note', isNote: true },
  200: { bg: '#FEF3C7', border: '#FBBF24', color: '#B45309', label: '₹200 Note', isNote: true },
  100: { bg: '#EDE9FE', border: '#A78BFA', color: '#6D28D9', label: '₹100 Note', isNote: true },
  50:  { bg: '#CCFBF1', border: '#2DD4BF', color: '#0F766E', label: '₹50 Note', isNote: true },
  20:  { bg: '#FFEDD5', border: '#FB923C', color: '#C2410C', label: '₹20 Note', isNote: true },
  10:  { bg: '#F1F5F9', border: '#94A3B8', color: '#475569', label: '₹10 Note/Coin', isNote: true },
  5:   { bg: '#FEF9C3', border: '#FACC15', color: '#854D0E', label: '₹5 Coin/Note', isNote: false },
  2:   { bg: '#F3F4F6', border: '#D1D5DB', color: '#374151', label: '₹2 Coin', isNote: false },
  1:   { bg: '#F3F4F6', border: '#D1D5DB', color: '#374151', label: '₹1 Coin', isNote: false },
};

export const fmtMoney = (v) => `₹${(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function DenominationCounter({ values = {}, onChange, readOnly = false }) {
  const handleCountChange = (denom, count) => {
    if (readOnly) return;
    const sanitized = Math.max(0, parseInt(count, 10) || 0);
    const updated = { ...values, [denom]: sanitized };
    onChange?.(updated);
  };

  const handleQuickAdd = (denom, add) => {
    if (readOnly) return;
    const current = parseInt(values[denom], 10) || 0;
    handleCountChange(denom, current + add);
  };

  const handleClearAll = () => {
    if (readOnly) return;
    const cleared = {};
    DENOMINATIONS.forEach(d => { cleared[d] = 0; });
    onChange?.(cleared);
  };

  const grandTotal = DENOMINATIONS.reduce((sum, d) => sum + (d * (parseInt(values[d], 10) || 0)), 0);
  const totalNotesCount = DENOMINATIONS.reduce((sum, d) => sum + (parseInt(values[d], 10) || 0), 0);

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 18px', background: C.surfaceAlt, borderBottom: `1px solid ${C.border}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>💵</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>Currency Denomination Counter</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>Enter the quantity of each denomination</div>
          </div>
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={handleClearAll}
            style={{
              padding: '4px 10px', fontSize: 11, fontWeight: 700,
              background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5',
              borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s'
            }}
            title="Reset all counts to 0"
          >
            ↺ Clear All
          </button>
        )}
      </div>

      {/* Denominations List / Table */}
      <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 420, overflowY: 'auto' }}>
        {DENOMINATIONS.map((denom) => {
          const cfg = DENOM_THEME[denom] || DENOM_THEME[1];
          const count = values[denom] !== undefined ? values[denom] : 0;
          const subtotal = denom * (parseInt(count, 10) || 0);

          return (
            <div
              key={denom}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr 140px',
                alignItems: 'center',
                gap: 12,
                padding: '8px 12px',
                background: subtotal > 0 ? `${cfg.bg}40` : '#FAFAFA',
                border: `1px solid ${subtotal > 0 ? cfg.border : C.border}`,
                borderRadius: 10,
                transition: 'all 0.15s ease'
              }}
            >
              {/* Denomination Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  minWidth: 54, height: 32, borderRadius: 6,
                  background: cfg.bg, border: `1.5px solid ${cfg.border}`,
                  color: cfg.color, fontWeight: 900, fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  ₹{denom}
                </div>
                <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>
                  {cfg.isNote ? 'Note' : 'Coin'}
                </span>
              </div>

              {/* Count Input + Quick Steppers */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 700 }}>×</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={count === 0 ? '' : count}
                  placeholder="0"
                  readOnly={readOnly}
                  onChange={(e) => handleCountChange(denom, e.target.value)}
                  style={{
                    width: 75,
                    padding: '6px 8px',
                    borderRadius: 8,
                    border: `1.5px solid ${count > 0 ? C.primary : C.border}`,
                    background: readOnly ? '#F3F4F6' : '#FFFFFF',
                    textAlign: 'center',
                    fontSize: 14,
                    fontWeight: 800,
                    color: C.text,
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.select()}
                />

                {!readOnly && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(denom, 1)}
                      style={{
                        padding: '4px 7px', fontSize: 11, fontWeight: 700,
                        background: C.surfaceAlt, border: `1px solid ${C.border}`,
                        borderRadius: 6, cursor: 'pointer'
                      }}
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(denom, 5)}
                      style={{
                        padding: '4px 7px', fontSize: 11, fontWeight: 700,
                        background: C.surfaceAlt, border: `1px solid ${C.border}`,
                        borderRadius: 6, cursor: 'pointer'
                      }}
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(denom, 10)}
                      style={{
                        padding: '4px 7px', fontSize: 11, fontWeight: 700,
                        background: C.surfaceAlt, border: `1px solid ${C.border}`,
                        borderRadius: 6, cursor: 'pointer'
                      }}
                    >
                      +10
                    </button>
                  </div>
                )}
              </div>

              {/* Subtotal */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: subtotal > 0 ? C.primary : C.textMuted }}>
                  {fmtMoney(subtotal)}
                </div>
                {count > 0 && (
                  <div style={{ fontSize: 10, color: C.textLight }}>
                    {count} {count === 1 ? 'unit' : 'units'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px', background: C.primaryBg, borderTop: `1.5px solid ${C.primary}30`
      }}>
        <div>
          <div style={{ fontSize: 11, color: C.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Total Counted Items
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>
            {totalNotesCount} {totalNotesCount === 1 ? 'item' : 'items'}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: C.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Total Amount
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.primary }}>
            {fmtMoney(grandTotal)}
          </div>
        </div>
      </div>
    </div>
  );
}

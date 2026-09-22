import { useState, useRef, useEffect, useCallback } from 'react';
import { C, theme } from '../../utils/theme';

// ── Button ──────────────────────────────────────────────────────────────────
export function Btn({ label, onClick, variant = 'primary', size = 'md', icon, disabled, type = 'button', fullWidth }) {
  const variants = {
    primary:   { bg: C.primary,   color: '#fff', border: C.primary,   hover: C.primaryDark },
    secondary: { bg: C.secondary, color: '#fff', border: C.secondary, hover: '#00695C' },
    danger:    { bg: C.danger,    color: '#fff', border: C.danger,    hover: '#B71C1C' },
    outline:   { bg: 'transparent', color: C.primary,   border: C.primary,   hover: C.primaryBg },
    outlineDanger: { bg: 'transparent', color: C.danger, border: C.danger, hover: C.dangerBg },
    ghost:     { bg: 'transparent', color: C.textMuted, border: C.border, hover: C.surfaceAlt },
    success:   { bg: C.success,   color: '#fff', border: C.success,   hover: '#1B5E20' },
    warning:   { bg: C.warning,   color: '#fff', border: C.warning,   hover: '#BF360C' },
  };
  const v = variants[variant] || variants.primary;
  const sizes = { sm: '5px 10px', md: '7px 14px', lg: '10px 20px' };
  const fontSizes = { sm: theme.fontSize.xs, md: theme.fontSize.sm, lg: theme.fontSize.base };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, justifyContent: 'center',
        padding: sizes[size], fontSize: fontSizes[size], fontWeight: 600, borderRadius: theme.radius.md,
        background: v.bg, color: v.color, border: `1.5px solid ${v.border}`,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1,
        width: fullWidth ? '100%' : undefined, whiteSpace: 'nowrap',
        transition: 'all 0.15s',
      }}
      onMouseOver={e => !disabled && (e.currentTarget.style.background = v.hover)}
      onMouseOut={e => !disabled && (e.currentTarget.style.background = v.bg)}
    >
      {icon && <span style={{ fontSize: 13 }}>{icon}</span>}
      {label}
    </button>
  );
}

// ── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, value, onChange, type = 'text', placeholder, readOnly, required, autoFocus, onKeyDown }) {
  return (
    <div style={{ marginBottom: 10 }}>
      {label && <label style={{ display: 'block', fontSize: theme.fontSize.xs, fontWeight: 600, color: C.textMuted, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}{required && <span style={{ color: C.danger }}> *</span>}</label>}
      <input
        type={type} value={value ?? ''} placeholder={placeholder} readOnly={readOnly} required={required} autoFocus={autoFocus} onKeyDown={onKeyDown}
        onChange={e => onChange && onChange(e.target.value)}
        style={{
          width: '100%', boxSizing: 'border-box', padding: '7px 10px',
          fontSize: theme.fontSize.base, color: C.text, background: readOnly ? C.surfaceAlt : C.surface,
          border: `1.5px solid ${C.border}`, borderRadius: theme.radius.md, outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => !readOnly && (e.target.style.borderColor = C.primary)}
        onBlur={e => (e.target.style.borderColor = C.border)}
      />
    </div>
  );
}

// ── Select (Searchable Dropdown) ─────────────────────────────────────────────
export function Select({ label, value, onChange, options = [], required, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  // Normalize options to { value, label }
  const normalizedOpts = options.map(o =>
    typeof o === 'object' && o !== null ? { value: o.value ?? o, label: o.label ?? o.value ?? String(o) } : { value: o, label: String(o) }
  );

  // Find current selected label
  const selectedOpt = normalizedOpts.find(o => String(o.value) === String(value));
  const displayLabel = selectedOpt ? selectedOpt.label : '';

  // Filter options by search
  const filtered = search
    ? normalizedOpts.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : normalizedOpts;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
        setHighlightIdx(-1);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIdx >= 0 && listRef.current) {
      const item = listRef.current.children[highlightIdx];
      if (item) item.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIdx]);

  const handleSelect = useCallback((opt) => {
    onChange && onChange(opt.value);
    setIsOpen(false);
    setSearch('');
    setHighlightIdx(-1);
  }, [onChange]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIdx >= 0 && highlightIdx < filtered.length) {
        handleSelect(filtered[highlightIdx]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
      setHighlightIdx(-1);
    }
  };

  const toggleOpen = () => {
    setIsOpen(prev => !prev);
    if (isOpen) {
      setSearch('');
      setHighlightIdx(-1);
    }
  };

  // Highlight matching text in option label
  const renderHighlightedLabel = (lbl) => {
    if (!search) return lbl;
    const idx = lbl.toLowerCase().indexOf(search.toLowerCase());
    if (idx === -1) return lbl;
    return (
      <>
        {lbl.slice(0, idx)}
        <span style={{ background: '#FFF9C4', fontWeight: 700, borderRadius: 2, padding: '0 1px' }}>{lbl.slice(idx, idx + search.length)}</span>
        {lbl.slice(idx + search.length)}
      </>
    );
  };

  return (
    <div style={{ marginBottom: 10, position: 'relative' }} ref={containerRef}>
      {label && (
        <label style={{ display: 'block', fontSize: theme.fontSize.xs, fontWeight: 600, color: C.textMuted, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}{required && <span style={{ color: C.danger }}> *</span>}
        </label>
      )}
      {/* Trigger button */}
      <div
        onClick={toggleOpen}
        style={{
          width: '100%', boxSizing: 'border-box', padding: '7px 32px 7px 10px',
          fontSize: theme.fontSize.base, color: displayLabel ? C.text : C.textLight,
          background: C.surface, border: `1.5px solid ${isOpen ? C.primary : C.border}`,
          borderRadius: theme.radius.md, cursor: 'pointer', position: 'relative',
          transition: 'border-color 0.15s', userSelect: 'none',
          minHeight: 36, display: 'flex', alignItems: 'center',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {displayLabel || placeholder || '— Select —'}
        </span>
        {/* Arrow icon */}
        <span style={{
          position: 'absolute', right: 10, top: '50%',
          transform: `translateY(-50%) rotate(${isOpen ? '180deg' : '0deg'})`,
          transition: 'transform 0.2s', fontSize: 12, color: C.textMuted, pointerEvents: 'none',
        }}>▼</span>
      </div>

      {/* Dropdown panel */}
      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
          background: C.surface, border: `1.5px solid ${C.primary}`,
          borderRadius: theme.radius.md, marginTop: 4,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          animation: 'selectSlideDown 0.15s ease-out',
          overflow: 'hidden',
        }}>
          {/* Search input */}
          {normalizedOpts.length > 5 && (
            <div style={{ padding: '8px 8px 4px' }}>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setHighlightIdx(0); }}
                onKeyDown={handleKeyDown}
                placeholder="🔍 Search..."
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '6px 10px',
                  fontSize: theme.fontSize.sm, color: C.text, background: C.surfaceAlt,
                  border: `1.5px solid ${C.border}`, borderRadius: theme.radius.md,
                  outline: 'none',
                }}
                onFocus={e => (e.target.style.borderColor = C.primary)}
                onBlur={e => (e.target.style.borderColor = C.border)}
              />
            </div>
          )}
          {/* Options list */}
          <div ref={listRef} style={{ maxHeight: 220, overflowY: 'auto', padding: '4px 0' }}
            onKeyDown={handleKeyDown} tabIndex={-1}>
            {/* Clear / default option */}
            <div
              onClick={() => { onChange && onChange(''); setIsOpen(false); setSearch(''); }}
              style={{
                padding: '7px 12px', cursor: 'pointer', fontSize: theme.fontSize.sm,
                color: C.textLight, fontStyle: 'italic',
                background: (!value && value !== 0) ? C.primaryBg : 'transparent',
                transition: 'background 0.1s',
              }}
              onMouseOver={e => (e.currentTarget.style.background = C.surfaceAlt)}
              onMouseOut={e => (e.currentTarget.style.background = (!value && value !== 0) ? C.primaryBg : 'transparent')}
            >
              — Select —
            </div>
            {filtered.length === 0 && (
              <div style={{ padding: '12px 12px', textAlign: 'center', color: C.textLight, fontSize: theme.fontSize.sm }}>
                No options found
              </div>
            )}
            {filtered.map((opt, i) => {
              const isSelected = String(opt.value) === String(value);
              const isHighlighted = i === highlightIdx;
              return (
                <div
                  key={`${opt.value}-${i}`}
                  onClick={() => handleSelect(opt)}
                  style={{
                    padding: '7px 12px', cursor: 'pointer', fontSize: theme.fontSize.sm,
                    color: isSelected ? C.primary : C.text,
                    fontWeight: isSelected ? 700 : 400,
                    background: isHighlighted ? C.primaryBg : isSelected ? `${C.primaryBg}88` : 'transparent',
                    transition: 'background 0.1s',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = C.primaryBg; setHighlightIdx(i); }}
                  onMouseOut={e => { e.currentTarget.style.background = isSelected ? `${C.primaryBg}88` : 'transparent'; }}
                >
                  {isSelected && <span style={{ fontSize: 11, color: C.primary }}>✓</span>}
                  <span>{renderHighlightedLabel(opt.label)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Animation keyframe */}
      <style>{`@keyframes selectSlideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

// ── Checkbox ─────────────────────────────────────────────────────────────────
export function Checkbox({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: theme.fontSize.sm, color: checked ? C.primary : C.text, marginBottom: 6 }}>
      <input type='checkbox' checked={!!checked} onChange={e => onChange && onChange(e.target.checked)}
        style={{ width: 15, height: 15, accentColor: C.primary, cursor: 'pointer' }} />
      {label}
    </label>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, title, actions, noPad, style: extraStyle }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: theme.radius.lg, boxShadow: theme.shadow.sm, overflow: 'hidden', ...extraStyle }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt }}>
          <span style={{ fontSize: theme.fontSize.md, fontWeight: 700, color: C.text }}>{title}</span>
          {actions && <div style={{ display: 'flex', gap: 6 }}>{actions}</div>}
        </div>
      )}
      <div style={noPad ? undefined : { padding: 16 }}>{children}</div>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ label, color = 'primary' }) {
  const map = {
    primary: [C.primaryBg, C.primary],
    secondary: [C.secondaryBg, C.secondary],
    success: [C.successBg, C.success],
    danger: [C.dangerBg, C.danger],
    warning: [C.warningBg, C.warning],
    muted: [C.surfaceAlt, C.textMuted],
  };
  const [bg, text] = map[color] || map.primary;
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: theme.radius.full, fontSize: theme.fontSize.xs, fontWeight: 700, background: bg, color: text }}>
      {label}
    </span>
  );
}

// ── Table ──────────────────────────────────────────────────────────────────
export function Table({ columns, data, onRowClick, loading, emptyMsg = 'No data found' }) {
  if (loading) return <div style={{ textAlign: 'center', padding: 32, color: C.textLight }}>Loading...</div>;
  if (!data?.length) return <div style={{ textAlign: 'center', padding: 32, color: C.textLight }}>{emptyMsg}</div>;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.fontSize.sm }}>
        <thead>
          <tr style={{ background: C.surfaceAlt, borderBottom: `2px solid ${C.border}` }}>
            {columns.map(col => (
              <th key={col.key} style={{ padding: '9px 12px', textAlign: col.right ? 'right' : 'left', fontWeight: 700, color: C.textMuted, fontSize: theme.fontSize.xs, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row._id || i}
              onClick={() => onRowClick && onRowClick(row)}
              style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.surfaceAlt, cursor: onRowClick ? 'pointer' : undefined, transition: 'background 0.1s' }}
              onMouseOver={e => onRowClick && (e.currentTarget.style.background = C.primaryBg)}
              onMouseOut={e => (e.currentTarget.style.background = i % 2 === 0 ? C.surface : C.surfaceAlt)}
            >
              {columns.map(col => (
                <td key={col.key} style={{ padding: '8px 12px', textAlign: col.right ? 'right' : 'left', color: col.accent ? C.primary : C.text, fontWeight: col.bold ? 700 : 400 }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 480 }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.surface, borderRadius: theme.radius.xl, width, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: theme.shadow.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: C.surface, zIndex: 1 }}>
          <span style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color: C.text }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: C.textMuted, padding: 4, borderRadius: theme.radius.md }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Section Title ─────────────────────────────────────────────────────────
export function SectionTitle({ children }) {
  return (
    <h2 style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color: C.text, margin: '0 0 16px', paddingBottom: 10, borderBottom: `2px solid ${C.primaryBg}` }}>
      {children}
    </h2>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon, color = C.primary, bg = C.primaryBg }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: theme.radius.lg, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: theme.shadow.sm }}>
      <div style={{ width: 44, height: 44, borderRadius: theme.radius.lg, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0, overflow: 'hidden' }}>
        <div style={{ fontSize: theme.fontSize.xs, color: C.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2, whiteSpace: 'nowrap' }}>{label}</div>
        <div style={{ fontSize: theme.fontSize.lg, fontWeight: 800, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      </div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.primary}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Search Input ──────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.textLight, fontSize: 13 }}>🔍</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px 7px 28px', fontSize: theme.fontSize.sm, color: C.text, background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: theme.radius.md, outline: 'none' }}
        onFocus={e => (e.target.style.borderColor = C.primary)}
        onBlur={e => (e.target.style.borderColor = C.border)}
      />
    </div>
  );
}

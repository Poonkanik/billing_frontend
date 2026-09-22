import { useState } from 'react';
import { C, theme } from '../../utils/theme';
import { Btn, SearchInput, Spinner } from '../common/UI';

export default function MasterList({ items, selected, onSelect, onNew, onSave, onDelete, loading, children, title, nameKey = 'name', extraActions, renderItem, searchValue, onSearchChange, searchPlaceholder, emptyMessage, hasSearched }) {
  const [localSearch, setLocalSearch] = useState('');

  // If external search control is provided, use it; otherwise use local filtering
  const isExternalSearch = typeof onSearchChange === 'function';
  const search = isExternalSearch ? searchValue || '' : localSearch;
  const setSearch = isExternalSearch ? onSearchChange : setLocalSearch;

  // For external search, items are already filtered by the backend
  const filtered = isExternalSearch ? (items || []) : (items?.filter(i => i[nameKey]?.toLowerCase().includes(localSearch.toLowerCase())) || []);

  const showSearchPrompt = isExternalSearch && !hasSearched && !loading;

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left List Panel */}
      <div style={{ width: 240, flexShrink: 0, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', background: C.surface }}>
        <div style={{ padding: '10px 10px 6px', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt }}>
          <div style={{ fontSize: theme.fontSize.xs, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 7 }}>
            {title} {hasSearched !== undefined ? (hasSearched ? <span style={{ color: C.textLight }}>({filtered.length})</span> : '') : <span style={{ color: C.textLight }}>({filtered.length})</span>}
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder={searchPlaceholder || `Search ${title}...`} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? <Spinner /> : showSearchPrompt ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: C.textLight }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.5 }}>🔍</div>
              <div style={{ fontSize: theme.fontSize.xs, fontWeight: 600, lineHeight: 1.5 }}>
                {emptyMessage || 'Search to find records.'}
              </div>
            </div>
          ) : filtered.map((item, i) => (
            <div key={item._id || i}
              onClick={() => onSelect(item)}
              style={{
                padding: '9px 12px', cursor: 'pointer', borderBottom: `1px solid ${C.border}`,
                background: selected?._id === item._id ? C.primaryBg : i % 2 === 0 ? C.surface : C.surfaceAlt,
                borderLeft: `3px solid ${selected?._id === item._id ? C.primary : 'transparent'}`,
                transition: 'all 0.1s',
              }}
              onMouseOver={e => selected?._id !== item._id && (e.currentTarget.style.background = C.primaryBg)}
              onMouseOut={e => selected?._id !== item._id && (e.currentTarget.style.background = i % 2 === 0 ? C.surface : C.surfaceAlt)}
            >
              {renderItem ? renderItem(item, i) : (
                <>
                  <div style={{ fontSize: theme.fontSize.sm, fontWeight: selected?._id === item._id ? 700 : 500, color: selected?._id === item._id ? C.primary : C.text }}>{item[nameKey]}</div>
                  {item.code && <div style={{ fontSize: 10, color: C.textLight, marginTop: 1 }}>Code: {item.code}</div>}
                </>
              )}
            </div>
          ))}
          {!loading && !showSearchPrompt && !filtered.length && (
            <div style={{ textAlign: 'center', padding: 24, color: C.textLight, fontSize: theme.fontSize.xs }}>
              {emptyMessage || `No ${title} found`}
            </div>
          )}
        </div>
      </div>

      {/* Right Detail Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: C.bg }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 6, padding: '10px 16px', background: C.surface, borderBottom: `1px solid ${C.border}`, alignItems: 'center' }}>
          <Btn label='New' icon='📄' variant='primary' size='sm' onClick={onNew} />
          <Btn label='Save' icon='💾' variant='success' size='sm' onClick={onSave} />
          <Btn label='Delete' icon='🗑' variant='outlineDanger' size='sm' onClick={onDelete} disabled={!selected?._id} />
          {extraActions && <div style={{ marginLeft: 'auto' }}>{extraActions}</div>}
        </div>

        {/* Form Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

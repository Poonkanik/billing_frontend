import { C } from '../../utils/theme';

/**
 * DepartmentFilter Component
 * Displays department selector for filtering products
 */
export function DepartmentFilter({ 
  departments, 
  selectedDeptId, 
  onSelectDepartment,
  productCounts 
}) {
  return (
    <div
      style={{
        padding: '8px 8px',
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
        overflowX: 'auto',
      }}
    >
      <div style={{ display: 'flex', gap: 6, minWidth: 'min-content' }}>
        {/* All Products Button */}
        <button
          onClick={() => onSelectDepartment(null)}
          style={{
            padding: '6px 12px',
            borderRadius: 100,
            border: `1.5px solid ${!selectedDeptId ? C.primary : C.border}`,
            background: !selectedDeptId ? C.primary : 'transparent',
            color: !selectedDeptId ? '#fff' : C.textMuted,
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            transition: 'all 0.15s',
          }}
        >
          📦 All
        </button>

        {/* Department Buttons */}
        {departments.map((dept) => {
          const count = productCounts?.[dept._id] || 0;
          const isSeparate = dept.separateInBilling;
          const isActive = selectedDeptId === dept._id;
          return (
            <span key={dept._id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {isSeparate && (
                <span style={{ color: C.border, fontSize: 14, fontWeight: 300, userSelect: 'none' }}>│</span>
              )}
              <button
                onClick={() => onSelectDepartment(dept._id)}
                title={dept.name + (isSeparate ? ' (Separate)' : '')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 100,
                  border: `1.5px solid ${isActive ? (isSeparate ? '#F59E0B' : C.primary) : C.border}`,
                  background: isActive
                    ? (isSeparate ? '#F59E0B' : C.primary)
                    : 'transparent',
                  color: isActive ? '#fff' : C.textMuted,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
              >
                {dept.name}
                {count > 0 && (
                  <span
                    style={{
                      marginLeft: 4,
                      background: isActive
                        ? 'rgba(255,255,255,0.3)'
                        : (isSeparate ? 'rgba(245,158,11,0.12)' : C.primaryBg),
                      padding: '0 4px',
                      borderRadius: 100,
                      fontSize: 10,
                      fontWeight: 800,
                      color: isActive ? '#fff' : (isSeparate ? '#F59E0B' : C.primary),
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default DepartmentFilter;

import React from 'react';

export const DynamicReceiptRenderer = ({ tpl, data, isKot, company }) => {
  if (!tpl || !tpl.fields) return <div style={{ padding: 20 }}>No template found in Settings - Sales Printer. Please configure.</div>;

  const restaurantDetails = (() => {
    try { const s = localStorage.getItem('salesPrinter_restaurant'); if (s) return JSON.parse(s); } catch { }
    return {};
  })();

  const footerText = (() => {
    try { const s = localStorage.getItem('salesPrinter_footer'); if (s !== null) return s; } catch { }
    return 'Thank you! Visit again!';
  })();

  // Theme styles for printing
  const PRINT_THEMES = {
    classic: {
      dividerStyle: { borderTop: '1px dashed #000', margin: '4px 0', width: '100%' },
      dividerBorder: '1px dashed #000',
      headerDecorator: '', footerDecorator: '',
      totalBoxStyle: {},
      footerFontStyle: 'normal',
    },
    modern: {
      dividerStyle: { borderTop: '2px solid #333', margin: '6px 0', width: '100%' },
      dividerBorder: '2px solid #333',
      headerDecorator: '● ', footerDecorator: ' ●',
      totalBoxStyle: { border: '1.5px solid #333', borderRadius: '4px', padding: '6px 8px' },
      footerFontStyle: 'normal',
    },
    elegant: {
      dividerStyle: { borderTop: '3px double #000', margin: '6px 0', width: '100%' },
      dividerBorder: '3px double #000',
      headerDecorator: '★ ', footerDecorator: ' ★',
      totalBoxStyle: { borderTop: '3px double #000', borderBottom: '3px double #000', padding: '4px 0' },
      footerFontStyle: 'italic',
    },
  };
  const savedTheme = (() => {
    try { return localStorage.getItem('salesPrinter_theme') || 'classic'; } catch { return 'classic'; }
  })();
  const ts = PRINT_THEMES[savedTheme] || PRINT_THEMES.classic;

  const headerFields = ['CompanyName', 'Address1', 'BillNo', 'Date', 'Time', 'SalesMan', 'Table'];
  const itemCols = ['ItemName', 'Rate', 'Qty', 'Amount'];
  const getF = (name) => tpl.fields.find(x => x.name === name);

  const getFontSize = (f) => f?.size?.includes('12') ? 16 : f?.size?.includes('10') ? 14 : f?.size?.includes('9') ? 12 : 11;
  const getFontWeight = (f) => f?.size?.includes('BOLD') ? 'bold' : 'normal';

  const renderLine = (fieldNames, vals = {}) => {
    const fields = fieldNames.map(getF).filter(f => f && f.print && !f.discontinue);
    if (!fields.length) return null;
    if (fields.length === 1) {
      const f = fields[0];
      return (
        <div key={f.name} style={{
          textAlign: f.align?.toLowerCase() || 'left',
          fontWeight: getFontWeight(f),
          fontSize: getFontSize(f),
          width: '100%', lineHeight: 1.4,
        }}>
          {(f.text ? f.text + ' ' : '') + (vals[f.name] || '')}
        </div>
      );
    }
    // Multi-field rows: flex with equal space + gap
    return (
      <div style={{ display: 'flex', width: '100%', lineHeight: 1.4, gap: '6px' }}>
        {fields.map((f, idx) => (
          <span key={f.name} style={{
            flex: 1,
            textAlign: idx === fields.length - 1 ? 'right' : (f.align?.toLowerCase() || 'left'),
            fontWeight: getFontWeight(f),
            fontSize: getFontSize(f),
          }}>
            {(f.text ? f.text + ' ' : '') + (vals[f.name] || '')}
          </span>
        ))}
      </div>
    );
  };

  const renderDivider = () => {
    const f = getF('UnderLine');
    if (!f || !f.print || f.discontinue) return null;
    return <div style={ts.dividerStyle}></div>;
  };

  let headerRows = []; let curRow = [];
  headerFields.forEach(name => {
    const f = getF(name);
    if (f && f.print && !f.discontinue) {
      if (name === 'CompanyName' || name === 'Address1') {
        if (curRow.length > 0) { headerRows.push([...curRow]); curRow = []; }
        headerRows.push([name]);
        return;
      }
      curRow.push(name);
      if (f.nextLine || curRow.length >= 2) { headerRows.push([...curRow]); curRow = []; }
    }
  });
  if (curRow.length > 0) headerRows.push(curRow);

  const theItems = (data.items || []).filter(it => it.productName);

  const activeCols = itemCols.filter(col => {
    if (isKot && (col === 'Rate' || col === 'Amount')) return false;
    const f = getF(col); return f && f.print && !f.discontinue;
  });
  const totalColLen = activeCols.reduce((s, col) => s + (getF(col)?.length || 10), 0);

  // Note for duplicate printing
  const isDuplicate = !isKot && data.printCount > 1;

  return (
    <div style={{ padding: '4px 6px', fontFamily: "'Courier New', Courier, monospace", fontSize: 11, background: '#fff', color: '#000', width: '320px', margin: '0 auto', boxSizing: 'border-box' }}>
      {isDuplicate && (
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>
          *** DUPLICATE {data.printCount - 1} ***
        </div>
      )}
      {renderDivider()}
      {headerRows.map((row, i) => (
        <div key={'hr' + i}>
          {renderLine(row, {
            CompanyName: restaurantDetails.name || company?.langName || company?.name || 'Restaurant Name',
            Address1: restaurantDetails.address || company?.address || 'Location',
            BillNo: data.billNo || data.kotNo || '001',
            Date: new Date(data.createdAt || Date.now()).toLocaleDateString('en-GB'),
            Time: new Date(data.createdAt || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
            SalesMan: data.waiter || 'Staff',
            Table: data.table || '-'
          })}
        </div>
      ))}
      {renderDivider()}
      {theItems.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>
          <colgroup>
            {activeCols.map(col => {
              const f = getF(col);
              return <col key={col} style={{ width: `${((f?.length || 10) / totalColLen) * 100}%` }} />;
            })}
          </colgroup>
          <thead>
            <tr style={{ borderBottom: ts.dividerBorder }}>
              {activeCols.map(col => {
                const f = getF(col);
                return (
                  <th key={col} style={{
                    textAlign: f?.align?.toLowerCase() || 'left',
                    fontWeight: getFontWeight(f),
                    fontSize: 11,
                    padding: '1px 2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}>{f?.text || col}</th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {theItems.map((it, i) => (
              <tr key={'it' + i}>
                {activeCols.map(col => {
                  const f = getF(col);
                  const val = col === 'ItemName' ? it.productName
                    : col === 'Rate' ? it.rate
                      : col === 'Qty' ? it.qty
                        : (it.rate * it.qty).toFixed(2);
                  return (
                    <td key={col} style={{
                      textAlign: f?.align?.toLowerCase() || 'left',
                      padding: '0 2px',
                      fontSize: 11,
                      wordBreak: col === 'ItemName' ? 'break-word' : 'normal',
                      whiteSpace: col === 'ItemName' ? 'normal' : 'nowrap',
                    }}>{val}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {renderDivider()}
      {!isKot && (data.cgstTotal > 0 || data.sgstTotal > 0) && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <tbody>
            {[
              ['Sub-Total:', (data.subtotal || 0).toFixed(2)],
              [`CGST${data.gstPct ? ` (${data.gstPct / 2}%)` : ''}:`, (data.cgstTotal || 0).toFixed(2)],
              [`SGST${data.gstPct ? ` (${data.gstPct / 2}%)` : ''}:`, (data.sgstTotal || 0).toFixed(2)],
            ].map(([label, val]) => (
              <tr key={label}>
                <td style={{ textAlign: 'right', padding: '0 2px' }}>{label}</td>
                <td style={{ textAlign: 'right', padding: '0 2px', width: '80px', fontWeight: 600 }}>{val}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!isKot && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 12, borderTop: ts.dividerBorder, marginTop: 2, paddingTop: 2, ...ts.totalBoxStyle }}>
          <span>{ts.headerDecorator}Mode: {data.paymentMode || 'Cash'}</span>
          <span>Total: {(data.netAmount || data.amount || 0).toFixed(2)}{ts.footerDecorator}</span>
        </div>
      )}
      {isKot && (
        <div style={{ borderTop: ts.dividerBorder, marginTop: 2, paddingTop: 2, textAlign: 'center', fontSize: 11, fontWeight: 'bold', ...ts.totalBoxStyle }}>
          {ts.headerDecorator}Total Items: {theItems.length} | Qty: {theItems.reduce((s, x) => s + x.qty, 0)}{ts.footerDecorator}
        </div>
      )}
      {renderDivider()}
      <div style={{ textAlign: 'center', marginTop: 2, fontSize: 10, color: '#444', whiteSpace: 'pre-wrap', fontStyle: ts.footerFontStyle || 'normal' }}>
        {ts.headerDecorator}{footerText}{ts.footerDecorator}
      </div>
    </div>
  );
};

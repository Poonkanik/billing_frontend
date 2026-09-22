import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { C, theme } from '../utils/theme';
import { Input, Select, Checkbox, Card } from '../components/common/UI';

const TABS = ['1. Common', '2. Printing', '3. Sales Printer', '4. Printer Setup'];

export default function OptionsPage() {
  const [tab, setTab] = useState('1. Common');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>
      <div style={{ display: 'flex', background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '0 16px', overflowX: 'auto', gap: 2 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '11px 14px', border: 'none', cursor: 'pointer', fontSize: theme.fontSize.xs, fontWeight: 700,
            background: 'transparent', whiteSpace: 'nowrap', color: tab === t ? C.primary : C.textMuted,
            borderBottom: tab === t ? `2.5px solid ${C.primary}` : '2.5px solid transparent', transition: 'all 0.15s',
          }}>{t}</button>
        ))}
      </div>
      {/* Save banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px', background: '#E3F2FD', borderBottom: '1px solid #BBDEFB' }}>
        <span style={{ fontSize: '11px', color: '#1565C0', fontWeight: 600 }}>Configuration settings are automatically synchronized and persisted</span>
        <button onClick={() => { window.dispatchEvent(new Event('pos_save_options')); alert('Settings saved successfully!'); }}
          style={{ padding: '6px 20px', background: '#1565C0', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
          💾 Save Settings
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {tab === '1. Common' && <Common />}
        {tab === '2. Printing' && <Printing />}
        {tab === '3. Sales Printer' && <SalesPrinterSetup />}
        {tab === '4. Printer Setup' && <PrinterSetup />}
      </div>
    </div>
  );
}

function MultiSelect({ items, selected, onToggle, title }) {
  return (
    <Card title={title}>
      <div style={{ maxHeight: 280, overflowY: 'auto', border: `1px solid ${C.border}`, borderRadius: theme.radius.md }}>
        {items.map(item => (
          <div key={item} onClick={() => onToggle(item)} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', cursor: 'pointer',
            borderBottom: `1px solid ${C.border}`, background: selected.includes(item) ? C.primaryBg : 'transparent',
            transition: 'background 0.1s',
          }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${selected.includes(item) ? C.primary : C.border}`, background: selected.includes(item) ? C.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', flexShrink: 0 }}>
              {selected.includes(item) ? '✓' : ''}
            </div>
            <span style={{ fontSize: theme.fontSize.xs, color: selected.includes(item) ? C.primary : C.text }}>{item}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Common() {
  const billOpts = [
    'Show Customer', 'Show DeliverDate', 'Show Delivertime', 'Show Advance',
    'Show SnoColumn', 'Show CharCodeColumn', 'Show StockColumn', 'Show RateColumn',
    'Show PcsColumn', 'Show ProductDiscountColumn', 'Show TaxAmount', 'Show VatAmount',
    'Show DiscountAmount', 'Show RoundOffAmount', 'Allow Entry Cancel'
  ];
  const cashTypes = [
    'Cash', 'Card', 'CREDIT', 'GooglePay', 'Paytm', 'Phonepe',
    'Upi', 'AmazonPay', 'Complementary', 'Customer', 'Freecharge', 'Wallet'
  ];

  const [selBill, setSelBill] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_options_billing_display');
      return saved ? JSON.parse(saved) : ['Show RateColumn'];
    } catch { return ['Show RateColumn']; }
  });

  const [selCash, setSelCash] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_options_payment_types');
      return saved ? JSON.parse(saved) : ['Cash', 'Card', 'GooglePay', 'Upi'];
    } catch { return ['Cash', 'Card', 'GooglePay', 'Upi']; }
  });

  const [s, setS] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_options_display_grid');
      return saved ? JSON.parse(saved) : {
        gridFont: '10', productWidth: '200', modeType: 'TABLE WISE',
        frameHeight: '300', salesmanAmount: '100', salesmanPercentage: '2',
        kotNo: 'START DAILY ONE', billNo: 'START DAILY ONE', billType: 'NORMAL'
      };
    } catch {
      return {
        gridFont: '10', productWidth: '200', modeType: 'TABLE WISE',
        frameHeight: '300', salesmanAmount: '100', salesmanPercentage: '2',
        kotNo: 'START DAILY ONE', billNo: 'START DAILY ONE', billType: 'NORMAL'
      };
    }
  });

  const [sms, setSms] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_options_sms');
      return saved ? JSON.parse(saved) : { gateway: '', apiKey: '', templateId: '', senderName: '', sendBillSMS: false, sendKotSMS: false };
    } catch {
      return { gateway: '', apiKey: '', templateId: '', senderName: '', sendBillSMS: false, sendKotSMS: false };
    }
  });

  const toggle = (arr, setArr, v, storageKey) => {
    setArr(p => {
      const next = p.includes(v) ? p.filter(x => x !== v) : [...p, v];
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  const setField = (k, v) => {
    setS(p => {
      const next = { ...p, [k]: v };
      localStorage.setItem('pos_options_display_grid', JSON.stringify(next));
      return next;
    });
  };

  const setSmsField = (k, v) => {
    setSms(p => {
      const next = { ...p, [k]: v };
      localStorage.setItem('pos_options_sms', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    const handleSave = () => {
      localStorage.setItem('pos_options_billing_display', JSON.stringify(selBill));
      localStorage.setItem('pos_options_payment_types', JSON.stringify(selCash));
      localStorage.setItem('pos_options_display_grid', JSON.stringify(s));
      localStorage.setItem('pos_options_sms', JSON.stringify(sms));
    };
    window.addEventListener('pos_save_options', handleSave);
    return () => window.removeEventListener('pos_save_options', handleSave);
  }, [selBill, selCash, s, sms]);

  const roundOff = [{ from: 1, to: 49, paisa: 0 }, { from: 50, to: 99, paisa: 100 }];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1100 }}>
      {/* Top Grid: Payment Types & Billing Screen Display */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <MultiSelect
          title='Cash / Payment Types'
          items={cashTypes}
          selected={selCash}
          onToggle={v => toggle(selCash, setSelCash, v, 'pos_options_payment_types')}
        />
        <MultiSelect
          title='Billing Screen Display Options'
          items={billOpts}
          selected={selBill}
          onToggle={v => toggle(selBill, setSelBill, v, 'pos_options_billing_display')}
        />
      </div>

      {/* Middle Grid: Grid & Display + Bill Numbering + Commission */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {/* Grid & Display */}
        <Card title='Grid & Display'>
          <Input label='Grid Font Size' value={s.gridFont} onChange={v => setField('gridFont', v)} />
          <Input label='Product Width' value={s.productWidth} onChange={v => setField('productWidth', v)} />
          <Input label='Frame Height' value={s.frameHeight} onChange={v => setField('frameHeight', v)} />
          <Select label='Mode Type' value={s.modeType} onChange={v => setField('modeType', v)} options={['TABLE WISE', 'COUNTER', 'PARCEL']} />
          <Input label='Salesman Amount' value={s.salesmanAmount} onChange={v => setField('salesmanAmount', v)} />
          <Input label='Salesman %' value={s.salesmanPercentage} onChange={v => setField('salesmanPercentage', v)} />
        </Card>

        {/* Bill Numbering & Round Off */}
        <Card title='Bill Numbering & Round Off'>
          <Select label='KOT Number' value={s.kotNo} onChange={v => setField('kotNo', v)} options={['START DAILY ONE', 'CONTINUE', 'MANUAL']} />
          <Select label='Bill Number' value={s.billNo} onChange={v => setField('billNo', v)} options={['START DAILY ONE', 'CONTINUE', 'MANUAL']} />
          <Select label='Bill Type' value={s.billType} onChange={v => setField('billType', v)} options={['NORMAL', 'ABC ModeWise', 'CashierWise', 'UserWise']} />
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: theme.fontSize.xs, fontWeight: 700, color: C.textMuted, marginBottom: 6, textTransform: 'uppercase' }}>Round Off Rules</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.fontSize.xs }}>
              <thead>
                <tr style={{ background: C.surfaceAlt }}>
                  {['From', 'To', 'Paisa'].map(h => <th key={h} style={{ padding: '5px 8px', textAlign: 'center', color: C.textMuted, fontWeight: 700 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {roundOff.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? C.surface : C.surfaceAlt, borderBottom: `1px solid ${C.border}` }}>
                    {[r.from, r.to, r.paisa].map((v, j) => <td key={j} style={{ padding: '5px 8px', textAlign: 'center', color: C.text }}>{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Commission Rules */}
        <Card title='Commission Models'>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {['Salesman_Amount_Wise', 'Salesman_Mode_Wise', 'Salesman_Item_Wise', 'Salesman_Wise', 'Captain_Amount_Wise', 'Captain_Mode_Wise', 'Captain_Item_Wise'].map(c => (
              <div key={c} style={{ padding: '6px 8px', fontSize: theme.fontSize.xs, color: C.text, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: C.primary, fontSize: 10 }}>●</span>
                <span>{c.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Grid: SMS & Notification Settings */}
      <div style={{ maxWidth: 640 }}>
        <Card title='SMS & Notification Settings'>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label='SMS Gateway URL' value={sms.gateway} onChange={v => setSmsField('gateway', v)} />
            <Input label='API Key' value={sms.apiKey} onChange={v => setSmsField('apiKey', v)} />
            <Input label='Template ID' value={sms.templateId} onChange={v => setSmsField('templateId', v)} />
            <Input label='Sender Name' value={sms.senderName} onChange={v => setSmsField('senderName', v)} />
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
            <Checkbox label='Send Bill SMS to Customer' checked={sms.sendBillSMS} onChange={v => setSmsField('sendBillSMS', v)} />
            <Checkbox label='Send KOT SMS to Kitchen' checked={sms.sendKotSMS} onChange={v => setSmsField('sendKotSMS', v)} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Printing() {
  const LAYOUTS = ['CITIZEN_WINDOWS_NAME_RATE_QTY_AMOUNT', 'CITIZEN_SNO_NAME_QTY_KOT', 'CITIZEN_ORDER_NAME_RATE_QTY', 'EPSON_STANDARD_80MM'];
  const [printers, setPrinters] = useState(['CITIZEN', 'EPSON', 'STAR', 'Generic Network']);
  const [s, setS] = useState({ salesDosPrinter: 'CITIZEN', salesDosSetting: LAYOUTS[0], salesWinPrinter: 'CITIZEN', salesWinSetting: LAYOUTS[0], kotDosPrinter: 'CITIZEN', kotDosSetting: LAYOUTS[1], kotWinPrinter: 'CITIZEN', kotWinSetting: LAYOUTS[1] });
  const [flags, setFlags] = useState({ logoPrinting: false, cashBarcode: false, cashDrawer: true, printProductDiscount: false, printTaxBelow: false });

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.getPrinters) {
      window.electronAPI.getPrinters().then(list => {
        if (list && list.length > 0) {
          setPrinters(list.map(p => p.name));
        }
      }).catch(err => console.error(err));
    }
  }, []);

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['DOS Test Print', 'Windows Test Print', 'Sales Last DOS Print', 'Sales Last Windows Print', 'KOT Last DOS Print', 'KOT Last Windows Print'].map(b => (
          <button key={b} style={{ padding: '7px 14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: theme.radius.md, fontSize: theme.fontSize.xs, fontWeight: 600, cursor: 'pointer', color: C.text }}>{b}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title='Sales Printer Settings'>
          <Select label='Sales DOS Printer' value={s.salesDosPrinter} onChange={v => setS(p => ({ ...p, salesDosPrinter: v }))} options={printers} />
          <Select label='Sales DOS Layout' value={s.salesDosSetting} onChange={v => setS(p => ({ ...p, salesDosSetting: v }))} options={LAYOUTS} />
          <Select label='Sales Windows Printer' value={s.salesWinPrinter} onChange={v => setS(p => ({ ...p, salesWinPrinter: v }))} options={printers} />
          <Select label='Sales Windows Layout' value={s.salesWinSetting} onChange={v => setS(p => ({ ...p, salesWinSetting: v }))} options={LAYOUTS} />
        </Card>
        <Card title='KOT Printer Settings'>
          <Select label='KOT DOS Printer' value={s.kotDosPrinter} onChange={v => setS(p => ({ ...p, kotDosPrinter: v }))} options={printers} />
          <Select label='KOT DOS Layout' value={s.kotDosSetting} onChange={v => setS(p => ({ ...p, kotDosSetting: v }))} options={LAYOUTS} />
          <Select label='KOT Windows Printer' value={s.kotWinPrinter} onChange={v => setS(p => ({ ...p, kotWinPrinter: v }))} options={printers} />
          <Select label='KOT Windows Layout' value={s.kotWinSetting} onChange={v => setS(p => ({ ...p, kotWinSetting: v }))} options={LAYOUTS} />
        </Card>
        <Card title='Print Flags'>
          {Object.entries(flags).map(([k, v]) => <Checkbox key={k} label={k.replace(/([A-Z])/g, ' $1').trim()} checked={v} onChange={nv => setFlags(p => ({ ...p, [k]: nv }))} />)}
        </Card>
        <Card title='Logo / Images'>
          {['Header Image Path', 'Footer Image Path'].map(l => (
            <div key={l} style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: theme.fontSize.xs, fontWeight: 700, color: C.textMuted, marginBottom: 4, textTransform: 'uppercase' }}>{l}</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input style={{ flex: 1, padding: '7px 10px', border: `1.5px solid ${C.border}`, borderRadius: theme.radius.md, fontSize: theme.fontSize.sm, outline: 'none', color: C.text }} />
                <button style={{ padding: '7px 12px', background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: theme.radius.md, cursor: 'pointer', fontSize: 13 }}>📂</button>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function SalesPrinterSetup() {
  const { user } = useAuth();
  const maxTemplates = 99;

  const DEFAULT_FIELDS = [
    { name: 'UnderLine', text: '', size: 'BOLD-8', align: 'CENTER', length: 48, nextLine: true, discontinue: false, print: true },
    { name: 'CompanyName', text: '', size: 'BOLD-12', align: 'CENTER', length: 48, nextLine: true, discontinue: false, print: true },
    { name: 'Address1', text: '', size: 'BOLD-9', align: 'CENTER', length: 48, nextLine: true, discontinue: false, print: true },
    { name: 'BillNo', text: 'Bill No:', size: 'BOLD-9', align: 'LEFT', length: 16, nextLine: false, discontinue: false, print: true },
    { name: 'Date', text: 'Date:', size: 'BOLD-9', align: 'LEFT', length: 16, nextLine: false, discontinue: false, print: true },
    { name: 'Time', text: 'Time:', size: 'BOLD-9', align: 'RIGHT', length: 16, nextLine: true, discontinue: false, print: true },
    { name: 'SalesMan', text: 'Waiter:', size: 'BOLD-9', align: 'LEFT', length: 24, nextLine: false, discontinue: false, print: true },
    { name: 'Table', text: 'Table:', size: 'BOLD-9', align: 'RIGHT', length: 24, nextLine: true, discontinue: false, print: true },
    { name: 'ItemName', text: 'Item', size: 'BOLD-9', align: 'LEFT', length: 20, nextLine: false, discontinue: false, print: true },
    { name: 'Rate', text: 'Price', size: 'BOLD-9', align: 'RIGHT', length: 8, nextLine: false, discontinue: false, print: true },
    { name: 'Qty', text: 'Qty', size: 'BOLD-9', align: 'RIGHT', length: 6, nextLine: false, discontinue: false, print: true },
    { name: 'Amount', text: 'Total', size: 'BOLD-9', align: 'RIGHT', length: 10, nextLine: true, discontinue: false, print: true },
  ];

  // ═══ Template Presets (4 Bill + 4 KOT) ═══
  const PRESET_INFO = {
    standard: { name: 'Standard', emoji: '🧾', desc: 'Classic layout with all essential fields', fontScale: 1, variant: 'normal' },
    compact: { name: 'Compact', emoji: '📋', desc: 'Space-saving condensed layout', fontScale: 0.85, variant: 'compact' },
    detailed: { name: 'Detailed', emoji: '📄', desc: 'Full breakdown with extended info', fontScale: 1.1, variant: 'detailed' },
    professional: { name: 'Professional', emoji: '🏷️', desc: 'Formal structured layout', fontScale: 1.05, variant: 'normal' },
  };

  const adjustFields = (overrides) => DEFAULT_FIELDS.map(f => {
    const o = overrides[f.name];
    return o ? { ...f, ...o } : { ...f };
  });

  const BILL_PRESETS = {
    standard: DEFAULT_FIELDS.map(f => ({ ...f })),
    compact: adjustFields({
      UnderLine: { size: 'BOLD-7', length: 32 },
      CompanyName: { size: 'BOLD-10', length: 32 },
      Address1: { size: 'BOLD-8', length: 32, print: false },
      BillNo: { text: 'Bill:', size: 'BOLD-8', length: 16 },
      Date: { text: '', size: 'BOLD-8', align: 'RIGHT', length: 16 },
      Time: { size: 'BOLD-8', print: false },
      SalesMan: { text: 'W:', size: 'BOLD-8', length: 16 },
      Table: { text: 'T:', size: 'BOLD-8', length: 16 },
      ItemName: { text: 'Item', size: 'BOLD-8', length: 18 },
      Rate: { text: 'Rate', size: 'BOLD-8', length: 6 },
      Qty: { size: 'BOLD-8', length: 4 },
      Amount: { text: 'Amt', size: 'BOLD-8', length: 8 },
    }),
    detailed: adjustFields({
      CompanyName: { size: 'BOLD-14' },
      Address1: { size: 'BOLD-10' },
      BillNo: { text: 'Invoice No:', size: 'BOLD-10', length: 24 },
      Date: { align: 'RIGHT', length: 24 },
      Time: { length: 24 },
      SalesMan: { text: 'Served by:', align: 'RIGHT', length: 24 },
      Table: { text: 'Table No:', size: 'BOLD-10', length: 48 },
      ItemName: { text: 'Description', length: 22 },
      Qty: { align: 'CENTER' },
      Amount: { text: 'Amount' },
    }),
    professional: adjustFields({
      CompanyName: { size: 'BOLD-13' },
      BillNo: { text: 'Bill #', size: 'BOLD-10' },
      SalesMan: { text: 'Staff:' },
      ItemName: { text: 'Particulars' },
      Rate: { text: 'MRP' },
      Qty: { align: 'CENTER' },
      Amount: { text: 'Value' },
    }),
  };

  const KOT_PRESETS = {
    standard: adjustFields({
      Address1: { print: false },
      BillNo: { text: 'KOT No:', size: 'BOLD-10', length: 24 },
      Date: { align: 'RIGHT', length: 24 },
      Time: { length: 24 },
      SalesMan: { align: 'RIGHT', length: 24 },
      Table: { text: 'TABLE:', size: 'BOLD-12', align: 'CENTER', length: 48 },
      ItemName: { size: 'BOLD-10', length: 30 },
      Rate: { print: false },
      Qty: { size: 'BOLD-10', align: 'CENTER', length: 10 },
      Amount: { print: false },
    }),
    compact: adjustFields({
      UnderLine: { size: 'BOLD-7', length: 32 },
      CompanyName: { size: 'BOLD-10', length: 32, print: false },
      Address1: { print: false },
      BillNo: { text: 'KOT:', size: 'BOLD-8', length: 16 },
      Date: { text: '', size: 'BOLD-8', align: 'RIGHT', length: 16 },
      Time: { print: false },
      SalesMan: { print: false },
      Table: { text: 'T:', size: 'BOLD-10', length: 32, align: 'LEFT' },
      ItemName: { size: 'BOLD-9', length: 24 },
      Rate: { print: false },
      Qty: { size: 'BOLD-9', align: 'CENTER', length: 8 },
      Amount: { print: false },
    }),
    detailed: adjustFields({
      CompanyName: { size: 'BOLD-14' },
      Address1: { size: 'BOLD-10' },
      BillNo: { text: 'KOT Order:', size: 'BOLD-10', length: 24 },
      Date: { align: 'RIGHT', length: 24 },
      Time: { length: 24 },
      SalesMan: { text: 'Captain:', align: 'RIGHT', length: 24 },
      Table: { text: 'Table No:', size: 'BOLD-12', align: 'CENTER', length: 48 },
      ItemName: { text: 'Item Name', size: 'BOLD-10', length: 28 },
      Rate: { print: false },
      Qty: { size: 'BOLD-10', align: 'CENTER', length: 10 },
      Amount: { print: false },
    }),
    professional: adjustFields({
      CompanyName: { size: 'BOLD-13' },
      Address1: { print: false },
      BillNo: { text: 'KOT #', size: 'BOLD-10' },
      SalesMan: { text: 'Staff:' },
      Table: { size: 'BOLD-10' },
      ItemName: { size: 'BOLD-10', length: 28 },
      Rate: { print: false },
      Qty: { align: 'CENTER', length: 8 },
      Amount: { print: false },
    }),
  };

  const ONLINE_PRESETS = {
    standard: adjustFields({
      CompanyName: { size: 'BOLD-12' },
      Address1: { print: false },
      BillNo: { text: 'Order ID:', size: 'BOLD-10', length: 24 },
      Date: { align: 'RIGHT', length: 24 },
      Time: { length: 24 },
      SalesMan: { text: 'Platform:', size: 'BOLD-10', length: 24 },
      Table: { text: 'Rider OTP:', size: 'BOLD-10', align: 'RIGHT', length: 24 },
      ItemName: { text: 'Ordered Item', size: 'BOLD-9', length: 20 },
      Rate: { text: 'Price', size: 'BOLD-9', length: 8 },
      Qty: { text: 'Qty', size: 'BOLD-9', length: 6 },
      Amount: { text: 'Total', size: 'BOLD-9', length: 10 },
    }),
    compact: adjustFields({
      UnderLine: { size: 'BOLD-7', length: 32 },
      CompanyName: { size: 'BOLD-10', length: 32 },
      Address1: { print: false },
      BillNo: { text: 'Ord:', size: 'BOLD-8', length: 16 },
      Date: { text: '', size: 'BOLD-8', align: 'RIGHT', length: 16 },
      Time: { print: false },
      SalesMan: { text: 'App:', size: 'BOLD-8', length: 16 },
      Table: { text: 'OTP:', size: 'BOLD-8', length: 16 },
      ItemName: { text: 'Item', size: 'BOLD-8', length: 18 },
      Rate: { text: 'Rate', size: 'BOLD-8', length: 6 },
      Qty: { size: 'BOLD-8', length: 4 },
      Amount: { text: 'Amt', size: 'BOLD-8', length: 8 },
    }),
    detailed: adjustFields({
      CompanyName: { size: 'BOLD-14' },
      Address1: { size: 'BOLD-10', print: true },
      BillNo: { text: 'Online Order #', size: 'BOLD-10', length: 24 },
      Date: { align: 'RIGHT', length: 24 },
      Time: { length: 24 },
      SalesMan: { text: 'Aggregator:', align: 'RIGHT', length: 24 },
      Table: { text: 'Customer / OTP:', size: 'BOLD-10', length: 48 },
      ItemName: { text: 'Item / Instructions', length: 22 },
      Qty: { align: 'CENTER' },
      Amount: { text: 'Amount' },
    }),
    professional: adjustFields({
      CompanyName: { size: 'BOLD-13' },
      Address1: { print: false },
      BillNo: { text: 'Delivery Order #', size: 'BOLD-10' },
      SalesMan: { text: 'Platform:' },
      Table: { text: 'Dispatch OTP:' },
      ItemName: { text: 'Item Details' },
      Rate: { text: 'Price' },
      Qty: { align: 'CENTER' },
      Amount: { text: 'Total' },
    }),
  };

  // ═══ 3 Visual Themes ═══
  const THEME_STYLES = {
    classic: {
      name: 'Classic', emoji: '📜', color: '#2563EB',
      desc: 'Traditional thermal receipt',
      dividerStyle: { borderTop: '1px dashed #000', margin: '4px 0', width: '100%' },
      dividerBorder: '1px dashed #000',
      headerDecorator: '', footerDecorator: '',
      totalBoxStyle: {},
      footerFontStyle: 'normal',
      borderPreview: 'dashed',
    },
    modern: {
      name: 'Modern', emoji: '✨', color: '#E65100',
      desc: 'Clean lines, solid dividers',
      dividerStyle: { borderTop: '2px solid #333', margin: '6px 0', width: '100%' },
      dividerBorder: '2px solid #333',
      headerDecorator: '● ', footerDecorator: ' ●',
      totalBoxStyle: { border: '1.5px solid #333', borderRadius: '4px', padding: '6px 8px' },
      footerFontStyle: 'normal',
      borderPreview: 'solid',
    },
    elegant: {
      name: 'Elegant', emoji: '👑', color: '#6A1B9A',
      desc: 'Double borders, decorative style',
      dividerStyle: { borderTop: '3px double #000', margin: '6px 0', width: '100%' },
      dividerBorder: '3px double #000',
      headerDecorator: '★ ', footerDecorator: ' ★',
      totalBoxStyle: { borderTop: '3px double #000', borderBottom: '3px double #000', padding: '4px 0' },
      footerFontStyle: 'italic',
      borderPreview: 'double',
    },
  };

  const [previewMode, setPreviewMode] = useState('receipt');

  const [receiptTemplates, setReceiptTemplates] = useState(() => {
    try { const s = localStorage.getItem('printTemplates'); if (s) return JSON.parse(s); } catch { }
    return [{ id: 1, name: 'Layout 1', isDefault: true, fields: DEFAULT_FIELDS.map(f => ({ ...f })) }];
  });
  const [kotTemplates, setKotTemplates] = useState(() => {
    try { const s = localStorage.getItem('kotTemplates'); if (s) return JSON.parse(s); } catch { }
    return [{ id: 1, name: 'Layout 1', isDefault: true, fields: DEFAULT_FIELDS.map(f => ({ ...f })) }];
  });
  const [comboTemplates, setComboTemplates] = useState(() => {
    try { const s = localStorage.getItem('comboTemplates'); if (s) return JSON.parse(s); } catch { }
    return [{ id: 1, name: 'Layout 1', isDefault: true, fields: DEFAULT_FIELDS.map(f => ({ ...f })) }];
  });
  const [onlineTemplates, setOnlineTemplates] = useState(() => {
    try { const s = localStorage.getItem('onlineTemplates'); if (s) return JSON.parse(s); } catch { }
    return [{ id: 1, name: 'Layout 1', isDefault: true, fields: DEFAULT_FIELDS.map(f => ({ ...f })) }];
  });
  const [prebookTemplates, setPrebookTemplates] = useState(() => {
    try { const s = localStorage.getItem('prebookTemplates'); if (s) return JSON.parse(s); } catch { }
    return [{ id: 1, name: 'Layout 1', isDefault: true, fields: DEFAULT_FIELDS.map(f => ({ ...f })) }];
  });

  const [activeReceiptId, setActiveReceiptId] = useState(() => {
    try { const s = localStorage.getItem('salesPrinter_activeTemplate'); if (s) return parseInt(s); } catch { }
    return receiptTemplates[0]?.id || 1;
  });
  const [activeKotId, setActiveKotId] = useState(() => {
    try { const s = localStorage.getItem('salesPrinter_activeKotTemplate'); if (s) return parseInt(s); } catch { }
    return kotTemplates[0]?.id || 1;
  });
  const [activeComboId, setActiveComboId] = useState(() => {
    try { const s = localStorage.getItem('salesPrinter_activeComboTemplate'); if (s) return parseInt(s); } catch { }
    return comboTemplates[0]?.id || 1;
  });
  const [activeOnlineId, setActiveOnlineId] = useState(() => {
    try { const s = localStorage.getItem('salesPrinter_activeOnlineTemplate'); if (s) return parseInt(s); } catch { }
    return onlineTemplates[0]?.id || 1;
  });
  const [activePrebookId, setActivePrebookId] = useState(() => {
    try { const s = localStorage.getItem('salesPrinter_activePrebookTemplate'); if (s) return parseInt(s); } catch { }
    return prebookTemplates[0]?.id || 1;
  });
  const [selIdx, setSelIdx] = useState(0);

  const templates = previewMode === 'receipt' ? receiptTemplates : previewMode === 'kot' ? kotTemplates : previewMode === 'combo' ? comboTemplates : previewMode === 'online' ? onlineTemplates : prebookTemplates;
  const setTemplates = (fn) => previewMode === 'receipt' ? setReceiptTemplates(fn) : previewMode === 'kot' ? setKotTemplates(fn) : previewMode === 'combo' ? setComboTemplates(fn) : previewMode === 'online' ? setOnlineTemplates(fn) : setPrebookTemplates(fn);
  const activeId = previewMode === 'receipt' ? activeReceiptId : previewMode === 'kot' ? activeKotId : previewMode === 'combo' ? activeComboId : previewMode === 'online' ? activeOnlineId : activePrebookId;
  const setActiveId = (v) => previewMode === 'receipt' ? setActiveReceiptId(v) : previewMode === 'kot' ? setActiveKotId(v) : previewMode === 'combo' ? setActiveComboId(v) : previewMode === 'online' ? setActiveOnlineId(v) : setActivePrebookId(v);

  // Restaurant / Company details for preview
  const [restaurant, setRestaurant] = useState(() => {
    try { const s = localStorage.getItem('salesPrinter_restaurant'); if (s) return JSON.parse(s); } catch { }
    return { name: '', address: '', gstNo: '' };
  });

  const [billing, setBilling] = useState(() => {
    try { const s = localStorage.getItem('salesPrinter_billing'); if (s) return JSON.parse(s); } catch { }
    return { tableNo: '', invoiceNo: '', billDate: new Date().toISOString().split('T')[0], billTime: new Date().toTimeString().slice(0, 5), waiter: '', customerName: '' };
  });

  const [orderItems, setOrderItems] = useState(() => {
    try { const s = localStorage.getItem('salesPrinter_items'); if (s) return JSON.parse(s); } catch { }
    return [{ description: 'Masala Dosa', price: 80, qty: 2 }, { description: 'Filter Coffee', price: 40, qty: 3 }];
  });

  const [footerText, setFooterText] = useState(() => {
    try { const s = localStorage.getItem('salesPrinter_footer'); if (s) return s; } catch { }
    return 'Thank you! Visit again!';
  });

  const [payment, setPayment] = useState(() => {
    try { const s = localStorage.getItem('salesPrinter_payment'); if (s) return JSON.parse(s); } catch { }
    return { method: 'Cash', taxPct: 5 };
  });

  const [templateVariant, setTemplateVariant] = useState(() => localStorage.getItem('salesPrinter_variant') || 'normal');
  const [selectedPreset, setSelectedPreset] = useState(() => localStorage.getItem('salesPrinter_preset') || 'standard');
  const [templateTheme, setTemplateTheme] = useState(() => localStorage.getItem('salesPrinter_theme') || 'classic');

  const [gstType, setGstType] = useState(() => localStorage.getItem('salesPrinter_gstType') || 'inclusive');

  const [printerWidth, setPrinterWidth] = useState(() => {
    try { const s = localStorage.getItem('salesPrinter_printerWidth'); if (s) return parseInt(s) || 80; } catch { }
    return 80;
  });

  // ── Batched localStorage persist (debounced 300ms) ──────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('printTemplates', JSON.stringify(receiptTemplates));
      localStorage.setItem('kotTemplates', JSON.stringify(kotTemplates));
      localStorage.setItem('comboTemplates', JSON.stringify(comboTemplates));
      localStorage.setItem('onlineTemplates', JSON.stringify(onlineTemplates));
      localStorage.setItem('prebookTemplates', JSON.stringify(prebookTemplates));
      localStorage.setItem('salesPrinter_restaurant', JSON.stringify(restaurant));
      localStorage.setItem('salesPrinter_billing', JSON.stringify(billing));
      localStorage.setItem('salesPrinter_items', JSON.stringify(orderItems));
      localStorage.setItem('salesPrinter_footer', footerText);
      localStorage.setItem('salesPrinter_payment', JSON.stringify(payment));
      localStorage.setItem('salesPrinter_variant', templateVariant);
      localStorage.setItem('salesPrinter_preset', selectedPreset);
      localStorage.setItem('salesPrinter_theme', templateTheme);
      localStorage.setItem('salesPrinter_gstType', gstType);
      localStorage.setItem('salesPrinter_printerWidth', String(printerWidth));
      localStorage.setItem('salesPrinter_activeTemplate', String(activeReceiptId));
      localStorage.setItem('salesPrinter_activeKotTemplate', String(activeKotId));
      localStorage.setItem('salesPrinter_activeComboTemplate', String(activeComboId));
      localStorage.setItem('salesPrinter_activeOnlineTemplate', String(activeOnlineId));
      localStorage.setItem('salesPrinter_activePrebookTemplate', String(activePrebookId));
    }, 300);
    return () => clearTimeout(timer);
  }, [receiptTemplates, kotTemplates, comboTemplates, onlineTemplates, prebookTemplates,
    restaurant, billing, orderItems, footerText, payment, templateVariant, selectedPreset,
    templateTheme, gstType, printerWidth, activeReceiptId, activeKotId, activeComboId,
    activeOnlineId, activePrebookId]);

  const tpl = templates.find(t => t.id === activeId) || templates[0];
  const field = tpl.fields[selIdx] || tpl.fields[0];

  const addTemplate = () => {
    if (templates.length >= maxTemplates) return;
    const newId = Math.max(...templates.map(t => t.id)) + 1;
    setTemplates(p => [...p, { id: newId, name: `Layout ${newId}`, code: `LAYOUT_${newId}`, isDefault: false, fields: DEFAULT_FIELDS.map(f => ({ ...f })) }]);
    setActiveId(newId);
    setSelIdx(0);
  };

  const loadPreset = (presetKey) => {
    const presets = (previewMode === 'kot') ? KOT_PRESETS : (previewMode === 'online') ? ONLINE_PRESETS : BILL_PRESETS;
    const presetFields = presets[presetKey];
    if (presetFields) {
      setTemplates(p => p.map(t => t.id !== activeId ? t : { ...t, fields: presetFields.map(f => ({ ...f })) }));
      setSelectedPreset(presetKey);
      setTemplateVariant(PRESET_INFO[presetKey]?.variant || 'normal');
    }
  };

  const updField = (k, v) => setTemplates(p => p.map(t => t.id !== activeId ? t : { ...t, fields: t.fields.map((f, i) => i !== selIdx ? f : { ...f, [k]: v }) }));

  const addItem = () => setOrderItems(p => [...p, { description: '', price: 0, qty: 1 }]);
  const removeItem = (idx) => setOrderItems(p => p.filter((_, i) => i !== idx));
  const updateItem = (idx, key, val) => setOrderItems(p => p.map((it, i) => i === idx ? { ...it, [key]: val } : it));


  // Calculate totals
  const subtotal = orderItems.reduce((s, it) => s + (it.price * it.qty), 0);
  const taxAmt = subtotal * (payment.taxPct / 100);
  const cgst = taxAmt / 2;
  const sgst = taxAmt / 2;
  const grandTotal = Math.round(subtotal + taxAmt);

  // Fieldset styles
  const fieldsetStyle = {
    border: `2px solid ${C.primary}`,
    borderRadius: 12,
    padding: '16px 18px',
    marginBottom: 16,
    background: C.surface,
    position: 'relative',
  };
  const legendStyle = {
    fontSize: 13,
    fontWeight: 700,
    color: C.primary,
    padding: '0 8px',
    background: C.surface,
  };
  const labelStyle = {
    display: 'block', fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 4,
  };
  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '8px 12px',
    border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13,
    outline: 'none', color: C.text, background: '#fff',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };
  const selectStyle = {
    ...inputStyle, cursor: 'pointer', appearance: 'auto',
  };

  // Radio button component - uses onClick for reliable selection
  const RadioBtn = ({ label, checked, onChange, color = C.primary }) => (
    <div onClick={onChange} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: checked ? color : C.textMuted, marginRight: 16, userSelect: 'none' }}>
      <span style={{
        width: 18, height: 18, borderRadius: '50%', border: `2px solid ${checked ? color : C.border}`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
        background: '#fff',
      }}>
        {checked && <span style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />}
      </span>
      {label}
    </div>
  );

  const now = new Date();
  const displayDate = billing.billDate || now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const displayTime = billing.billTime || now.toTimeString().slice(0, 5);

  return (
    <div style={{ display: 'flex', gap: 24, maxWidth: 1200, minHeight: 600 }}>

      {/* ═══════════ LEFT PANEL — Settings ═══════════ */}
      <div style={{ flex: 1, minWidth: 600, overflowY: 'auto', paddingRight: 16 }}>

        {/* ── Select Template To Edit ── */}
        <div style={{ marginBottom: 16, padding: '16px', background: '#F8F9FA', borderRadius: 8, border: `1.5px solid ${C.border}` }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: C.text, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            🖨️ Template to Edit
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <RadioBtn label='🧾 Billing Template' checked={previewMode === 'receipt'} onChange={() => { setPreviewMode('receipt'); setSelIdx(0); }} color={C.primary} />
            <RadioBtn label='📋 KOT Template' checked={previewMode === 'kot'} onChange={() => { setPreviewMode('kot'); setSelIdx(0); }} color="#E65100" />
            <RadioBtn label='🛵 Online Order Template' checked={previewMode === 'online'} onChange={() => { setPreviewMode('online'); setSelIdx(0); }} color="#059669" />
            <RadioBtn label='📅 Prebook Template' checked={previewMode === 'prebook'} onChange={() => { setPreviewMode('prebook'); setSelIdx(0); }} color="#6A1B9A" />
            {(user?.role === 'root' || user?.name?.toLowerCase() === 'root') && (
              <RadioBtn label='🧾+📋 Combo Template' checked={previewMode === 'combo'} onChange={() => { setPreviewMode('combo'); setSelIdx(0); }} color={C.success} />
            )}
          </div>
        </div>



        {/* ── Template Gallery (4 Templates) ── */}
        <fieldset style={fieldsetStyle}>
          <legend style={legendStyle}>📐 Select Template</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {Object.entries(PRESET_INFO).map(([key, info]) => {
              const isActive = selectedPreset === key;
              const themeColor = THEME_STYLES[templateTheme]?.color || C.primary;
              return (
                <div key={key} onClick={() => loadPreset(key)} style={{
                  border: isActive ? `2.5px solid ${themeColor}` : `1.5px solid ${C.border}`,
                  borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
                  background: isActive ? `${themeColor}0D` : '#fff',
                  transition: 'all 0.2s ease',
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  boxShadow: isActive ? `0 2px 8px ${themeColor}20` : '0 1px 3px rgba(0,0,0,0.04)',
                }}
                  onMouseOver={e => { if (!isActive) { e.currentTarget.style.borderColor = themeColor; e.currentTarget.style.boxShadow = `0 2px 8px ${themeColor}15`; } }}
                  onMouseOut={e => { if (!isActive) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; } }}
                >
                  {/* Mini Receipt Thumbnail */}
                  <div style={{
                    width: 52, minHeight: 68, background: '#FAFAFA', border: '1px solid #e8e8e8',
                    borderRadius: 4, padding: '4px 5px', flexShrink: 0,
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                  }}>
                    {key === 'standard' && <>
                      <div style={{ width: '80%', height: 4, background: '#555', borderRadius: 1, margin: '0 auto 1.5px' }} />
                      <div style={{ width: '55%', height: 2.5, background: '#aaa', borderRadius: 1, margin: '0 auto 2px' }} />
                      <div style={{ borderTop: '0.5px dashed #bbb', margin: '2px 0' }} />
                      <div style={{ display: 'flex', gap: 2, marginBottom: 1.5 }}><div style={{ flex: 2, height: 2.5, background: '#ccc', borderRadius: 1 }} /><div style={{ flex: 1, height: 2.5, background: '#ccc', borderRadius: 1 }} /></div>
                      <div style={{ display: 'flex', gap: 2, marginBottom: 2 }}><div style={{ flex: 1, height: 2.5, background: '#ccc', borderRadius: 1 }} /><div style={{ flex: 1, height: 2.5, background: '#ccc', borderRadius: 1 }} /></div>
                      <div style={{ borderTop: '0.5px dashed #bbb', margin: '2px 0' }} />
                      <div style={{ display: 'flex', gap: 1.5, marginBottom: 1.5 }}><div style={{ flex: 3, height: 2.5, background: '#ddd', borderRadius: 1 }} /><div style={{ flex: 1, height: 2.5, background: '#ddd', borderRadius: 1 }} /><div style={{ flex: 1, height: 2.5, background: '#ddd', borderRadius: 1 }} /></div>
                      <div style={{ display: 'flex', gap: 1.5, marginBottom: 1.5 }}><div style={{ flex: 3, height: 2.5, background: '#ddd', borderRadius: 1 }} /><div style={{ flex: 1, height: 2.5, background: '#ddd', borderRadius: 1 }} /><div style={{ flex: 1, height: 2.5, background: '#ddd', borderRadius: 1 }} /></div>
                      <div style={{ borderTop: '0.5px dashed #bbb', margin: '2px 0' }} />
                      <div style={{ width: '50%', height: 3, background: '#555', borderRadius: 1, marginLeft: 'auto', marginBottom: 2 }} />
                      <div style={{ width: '45%', height: 2, background: '#ccc', borderRadius: 1, margin: '0 auto' }} />
                    </>}
                    {key === 'compact' && <>
                      <div style={{ width: '70%', height: 4, background: '#555', borderRadius: 1, margin: '0 auto 2px' }} />
                      <div style={{ borderTop: '0.5px dashed #bbb', margin: '2px 0' }} />
                      <div style={{ display: 'flex', gap: 2, marginBottom: 2 }}><div style={{ flex: 1, height: 2.5, background: '#ccc', borderRadius: 1 }} /><div style={{ flex: 1, height: 2.5, background: '#ccc', borderRadius: 1 }} /></div>
                      <div style={{ borderTop: '0.5px dashed #bbb', margin: '2px 0' }} />
                      <div style={{ display: 'flex', gap: 2, marginBottom: 1.5 }}><div style={{ flex: 3, height: 2.5, background: '#ddd', borderRadius: 1 }} /><div style={{ flex: 1, height: 2.5, background: '#ddd', borderRadius: 1 }} /></div>
                      <div style={{ display: 'flex', gap: 2, marginBottom: 1.5 }}><div style={{ flex: 3, height: 2.5, background: '#ddd', borderRadius: 1 }} /><div style={{ flex: 1, height: 2.5, background: '#ddd', borderRadius: 1 }} /></div>
                      <div style={{ borderTop: '0.5px dashed #bbb', margin: '2px 0' }} />
                      <div style={{ width: '45%', height: 3, background: '#555', borderRadius: 1, marginLeft: 'auto' }} />
                    </>}
                    {key === 'detailed' && <>
                      <div style={{ width: '90%', height: 5, background: '#444', borderRadius: 1, margin: '0 auto 1px' }} />
                      <div style={{ width: '65%', height: 2.5, background: '#999', borderRadius: 1, margin: '0 auto 1px' }} />
                      <div style={{ width: '45%', height: 2, background: '#bbb', borderRadius: 1, margin: '0 auto 2px' }} />
                      <div style={{ borderTop: '0.5px dashed #bbb', margin: '2px 0' }} />
                      <div style={{ display: 'flex', gap: 2, marginBottom: 1 }}><div style={{ flex: 2, height: 2.5, background: '#ccc', borderRadius: 1 }} /><div style={{ flex: 2, height: 2.5, background: '#ccc', borderRadius: 1 }} /></div>
                      <div style={{ width: '60%', height: 2.5, background: '#ccc', borderRadius: 1, marginBottom: 2 }} />
                      <div style={{ borderTop: '0.5px dashed #bbb', margin: '2px 0' }} />
                      <div style={{ display: 'flex', gap: 1, marginBottom: 1 }}><div style={{ flex: 3, height: 2, background: '#ddd', borderRadius: 1 }} /><div style={{ flex: 1, height: 2, background: '#ddd', borderRadius: 1 }} /><div style={{ flex: 1, height: 2, background: '#ddd', borderRadius: 1 }} /><div style={{ flex: 1, height: 2, background: '#ddd', borderRadius: 1 }} /></div>
                      <div style={{ display: 'flex', gap: 1, marginBottom: 1 }}><div style={{ flex: 3, height: 2, background: '#ddd', borderRadius: 1 }} /><div style={{ flex: 1, height: 2, background: '#ddd', borderRadius: 1 }} /><div style={{ flex: 1, height: 2, background: '#ddd', borderRadius: 1 }} /><div style={{ flex: 1, height: 2, background: '#ddd', borderRadius: 1 }} /></div>
                      <div style={{ borderTop: '0.5px dashed #bbb', margin: '2px 0' }} />
                      <div style={{ display: 'flex', gap: 2, marginBottom: 1 }}><div style={{ flex: 2, height: 2, background: '#ccc', borderRadius: 1 }} /><div style={{ flex: 1, height: 2, background: '#ccc', borderRadius: 1 }} /></div>
                      <div style={{ width: '55%', height: 3, background: '#444', borderRadius: 1, marginLeft: 'auto', marginBottom: 1 }} />
                      <div style={{ width: '40%', height: 2, background: '#ccc', borderRadius: 1, margin: '0 auto' }} />
                    </>}
                    {key === 'professional' && <>
                      <div style={{ width: '85%', height: 5, background: '#444', borderRadius: 1, margin: '0 auto 1px' }} />
                      <div style={{ width: '60%', height: 2.5, background: '#999', borderRadius: 1, margin: '0 auto 2px' }} />
                      <div style={{ borderTop: '0.5px solid #999', margin: '2px 0' }} />
                      <div style={{ display: 'flex', gap: 2, marginBottom: 1 }}><div style={{ flex: 1, height: 2.5, background: '#ccc', borderRadius: 1 }} /><div style={{ flex: 1, height: 2.5, background: '#ccc', borderRadius: 1 }} /><div style={{ flex: 1, height: 2.5, background: '#ccc', borderRadius: 1 }} /></div>
                      <div style={{ display: 'flex', gap: 2, marginBottom: 2 }}><div style={{ flex: 1, height: 2.5, background: '#ccc', borderRadius: 1 }} /><div style={{ flex: 1, height: 2.5, background: '#ccc', borderRadius: 1 }} /></div>
                      <div style={{ borderTop: '0.5px solid #999', margin: '2px 0' }} />
                      <div style={{ display: 'flex', gap: 1, marginBottom: 1 }}><div style={{ flex: 3, height: 2.5, background: '#ddd', borderRadius: 1 }} /><div style={{ flex: 1, height: 2.5, background: '#ddd', borderRadius: 1 }} /><div style={{ flex: 1, height: 2.5, background: '#ddd', borderRadius: 1 }} /></div>
                      <div style={{ display: 'flex', gap: 1, marginBottom: 1 }}><div style={{ flex: 3, height: 2.5, background: '#ddd', borderRadius: 1 }} /><div style={{ flex: 1, height: 2.5, background: '#ddd', borderRadius: 1 }} /><div style={{ flex: 1, height: 2.5, background: '#ddd', borderRadius: 1 }} /></div>
                      <div style={{ borderTop: '0.5px solid #999', margin: '2px 0' }} />
                      <div style={{ width: '50%', height: 3, background: '#444', borderRadius: 1, marginLeft: 'auto', border: '0.5px solid #999' }} />
                      <div style={{ width: '40%', height: 2, background: '#ccc', borderRadius: 1, margin: '2px auto 0' }} />
                    </>}
                  </div>
                  {/* Template Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: isActive ? themeColor : C.text, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 16 }}>{info.emoji}</span> {info.name}
                    </div>
                    <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3, lineHeight: 1.4 }}>
                      {info.desc}
                    </div>
                    {isActive && (
                      <div style={{ marginTop: 5, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#fff', background: themeColor, padding: '2px 8px', borderRadius: 10 }}>
                        ✓ Active
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </fieldset>

        {/* ── Theme Selector (3 Themes) ── */}
        <fieldset style={fieldsetStyle}>
          <legend style={legendStyle}>🎨 Select Theme</legend>
          <div style={{ display: 'flex', gap: 10 }}>
            {Object.entries(THEME_STYLES).map(([key, ts]) => {
              const isActive = templateTheme === key;
              return (
                <div key={key} onClick={() => setTemplateTheme(key)} style={{
                  flex: 1, border: isActive ? `2.5px solid ${ts.color}` : `1.5px solid ${C.border}`,
                  borderRadius: 10, padding: '12px 10px', cursor: 'pointer',
                  background: isActive ? `${ts.color}0D` : '#fff',
                  textAlign: 'center', transition: 'all 0.2s ease',
                  boxShadow: isActive ? `0 2px 8px ${ts.color}20` : '0 1px 3px rgba(0,0,0,0.04)',
                }}
                  onMouseOver={e => { if (!isActive) e.currentTarget.style.borderColor = ts.color; }}
                  onMouseOut={e => { if (!isActive) e.currentTarget.style.borderColor = C.border; }}
                >
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{ts.emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? ts.color : C.text }}>{ts.name}</div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{ts.desc}</div>
                  <div style={{ ...ts.dividerStyle, width: '80%', marginTop: 8, marginLeft: 'auto', marginRight: 'auto' }} />
                  {isActive && <div style={{ fontSize: 9, fontWeight: 700, color: ts.color, marginTop: 6 }}>✓ Selected</div>}
                </div>
              );
            })}
          </div>
        </fieldset>

        {/* ── Printer Width (Thermal) ── */}
        <fieldset style={fieldsetStyle}>
          <legend style={legendStyle}>🖨️ Printer Width</legend>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {[{ value: 58, label: '58mm (Small)' }, { value: 72, label: '72mm (Medium)' }, { value: 80, label: '80mm (Standard)' }].map(pw => (
              <RadioBtn key={pw.value} label={pw.label} checked={printerWidth === pw.value} onChange={() => setPrinterWidth(pw.value)} />
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: C.textMuted, background: '#FFF8E1', padding: '6px 10px', borderRadius: 6, border: '1px solid #FFE082' }}>
            💡 Select paper width for your thermal printer. Most common: <strong>80mm</strong> or <strong>58mm</strong> rolls.
          </div>
        </fieldset>

        {/* ── Header / Footer Image ── */}
        <fieldset style={fieldsetStyle}>
          <legend style={legendStyle}>🖼️ Logo / Images</legend>
          {['Header Image Path', 'Footer Image Path'].map(l => (
            <div key={l} style={{ marginBottom: 10 }}>
              <label style={labelStyle}>{l}</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input style={{ ...inputStyle, flex: 1 }} placeholder={`Select ${l.toLowerCase()}...`} />
                <button style={{ padding: '7px 12px', background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>📂</button>
              </div>
            </div>
          ))}
        </fieldset>

        {/* ── Restaurant Details ── */}
        <fieldset style={fieldsetStyle}>
          <legend style={legendStyle}>Restaurant Details</legend>
          <div style={{ display: 'flex', gap: 20, marginBottom: 16, padding: '10px', background: '#F0F4F8', borderRadius: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Print Restaurant Name & Address?</div>
            <RadioBtn label='Yes' checked={tpl.fields.find(f => f.name === 'CompanyName')?.print !== false} onChange={() => {
              updField('print', true); // Helper logic, properly handled by manual field update
              setTemplates(p => p.map(t => t.id !== activeId ? t : { ...t, fields: t.fields.map(f => (f.name === 'CompanyName' || f.name === 'Address1') ? { ...f, print: true } : f) }));
            }} />
            <RadioBtn label='No' checked={tpl.fields.find(f => f.name === 'CompanyName')?.print === false} onChange={() => {
              setTemplates(p => p.map(t => t.id !== activeId ? t : { ...t, fields: t.fields.map(f => (f.name === 'CompanyName' || f.name === 'Address1') ? { ...f, print: false } : f) }));
            }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Restaurant Name</label>
            <input
              value={restaurant.name} onChange={e => setRestaurant(p => ({ ...p, name: e.target.value }))}
              placeholder='Enter Restaurant Name' style={inputStyle}
              onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primaryBg}`; }}
              onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Restaurant Address</label>
            <textarea
              value={restaurant.address} onChange={e => setRestaurant(p => ({ ...p, address: e.target.value }))}
              placeholder='Restaurant Address...' rows={2}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 50 }}
              onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primaryBg}`; }}
              onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <RadioBtn label='None' checked={gstType === 'none'} onChange={() => setGstType('none')} />
            <RadioBtn label='GST No' checked={gstType === 'inclusive'} onChange={() => setGstType('inclusive')} />
          </div>
          {gstType === 'inclusive' && (
            <div style={{ marginTop: 10 }}>
              <label style={labelStyle}>GST Number</label>
              <input
                value={restaurant.gstNo || ''} onChange={e => setRestaurant(p => ({ ...p, gstNo: e.target.value }))}
                placeholder='e.g. 29AABCT1332L1ZH' style={inputStyle}
                onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primaryBg}`; }}
                onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          )}
        </fieldset>

        {/* ── Word-Like Template Editor ── */}
        <fieldset style={{ ...fieldsetStyle, border: `1px solid ${C.border}`, padding: 0, overflow: 'hidden' }}>
          <div style={{ background: '#F0F4F8', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '8px 12px', gap: 12, flexWrap: 'wrap' }}>

            {/* Field Dropdown */}
            <select value={selIdx} onChange={e => setSelIdx(parseInt(e.target.value))} style={{ ...selectStyle, width: 150, padding: '6px 10px', fontSize: 13, fontWeight: 700, borderRadius: 6 }}>
              {tpl.fields.map((f, i) => <option key={i} value={i}>{f.name}</option>)}
            </select>

            <div style={{ width: 1, height: 24, background: C.border }} />

            {/* Font Control (+ / -) */}
            <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.border}`, borderRadius: 6, background: '#fff', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <button title="Decrease Font Size" onClick={() => {
                const s = field.size || 'BOLD-9';
                let num = parseInt(s.match(/\d+/)?.[0] || '9');
                if (num > 5) num--;
                updField('size', `BOLD-${num}`);
              }} style={{ padding: '6px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 900, fontSize: 14 }}>−</button>

              <div style={{ padding: '6px 4px', minWidth: 28, textAlign: 'center', borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, fontSize: 13, fontWeight: 700, color: C.text }}>
                {(field.size || 'BOLD-9').match(/\d+/)?.[0] || '9'}
              </div>

              <button title="Increase Font Size" onClick={() => {
                const s = field.size || 'BOLD-9';
                let num = parseInt(s.match(/\d+/)?.[0] || '9');
                if (num < 24) num++;
                updField('size', `BOLD-${num}`);
              }} style={{ padding: '6px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 900, fontSize: 14 }}>+</button>
            </div>

            <div style={{ width: 1, height: 24, background: C.border }} />

            {/* Alignment Group */}
            <div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              {[
                { val: 'LEFT', icon: '⇤', title: 'Align Left' },
                { val: 'CENTER', icon: '↔', title: 'Align Center' },
                { val: 'RIGHT', icon: '⇥', title: 'Align Right' }
              ].map(a => (
                <button key={a.val} title={a.title} onClick={() => updField('align', a.val)} style={{
                  padding: '6px 12px', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 900,
                  background: field.align === a.val ? '#E3F2FD' : 'transparent',
                  color: field.align === a.val ? '#1565C0' : C.textMuted,
                  borderRight: a.val === 'RIGHT' ? 'none' : `1px solid ${C.border}`,
                  transition: 'background 0.1s'
                }}>{a.icon}</button>
              ))}
            </div>

            <div style={{ width: 1, height: 24, background: C.border }} />

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: C.text, cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={field.nextLine} onChange={(e) => updField('nextLine', e.target.checked)} style={{ transform: 'scale(1.2)' }} /> Break Line
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: C.text, cursor: 'pointer', userSelect: 'none', paddingLeft: 6 }}>
              <input type="checkbox" checked={field.print} onChange={(e) => updField('print', e.target.checked)} style={{ transform: 'scale(1.2)' }} /> Print
            </label>

          </div>

          {/* Text Content Editor Area */}
          <div style={{ padding: 20, background: '#fff' }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ ...labelStyle, fontSize: 11, color: C.textMuted, textTransform: 'uppercase' }}>Text to Display</label>
                <input value={field.text || ''} onChange={e => updField('text', e.target.value)} placeholder={`Text to show for ${field.name}...`} style={{ ...inputStyle, fontSize: 14, padding: '12px 16px', borderRadius: 8 }} />
              </div>
              <div style={{ width: 140 }}>
                <label style={{ ...labelStyle, fontSize: 11, color: C.textMuted, textTransform: 'uppercase' }}>Max Width (Chars)</label>
                <input type='number' value={field.length} onChange={e => updField('length', parseInt(e.target.value) || 0)} title="Max Width Length (Characters)" style={{ ...inputStyle, fontSize: 14, padding: '12px 16px', borderRadius: 8 }} />
              </div>
            </div>

            {field.name === 'UnderLine' && (
              <div style={{ marginTop: 12, fontSize: 12, color: C.textMuted }}>💡 Edit the dash character (-) or adjust length for the underline divider.</div>
            )}
          </div>
        </fieldset>

        {/* ── Billing Details ── */}
        <fieldset style={fieldsetStyle}>
          <legend style={legendStyle}>Billing Details</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Table No</label>
              <input value={billing.tableNo} onChange={e => setBilling(p => ({ ...p, tableNo: e.target.value }))} placeholder='e.g. 5' style={inputStyle}
                onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primaryBg}`; }}
                onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
            </div>
            <div>
              <label style={labelStyle}>Invoice Number</label>
              <input value={billing.invoiceNo} onChange={e => setBilling(p => ({ ...p, invoiceNo: e.target.value }))} placeholder='e.g. 2104' style={inputStyle}
                onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primaryBg}`; }}
                onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
            </div>
            <div>
              <label style={labelStyle}>Bill Date</label>
              <input type='date' value={billing.billDate} onChange={e => setBilling(p => ({ ...p, billDate: e.target.value }))} style={inputStyle}
                onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primaryBg}`; }}
                onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
            </div>
            <div>
              <label style={labelStyle}>Bill Time</label>
              <input type='time' value={billing.billTime} onChange={e => setBilling(p => ({ ...p, billTime: e.target.value }))} style={inputStyle}
                onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primaryBg}`; }}
                onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={labelStyle}>Waiter / Captain</label>
            <input value={billing.waiter || ''} onChange={e => setBilling(p => ({ ...p, waiter: e.target.value }))} placeholder='Waiter Name' style={inputStyle}
              onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primaryBg}`; }}
              onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
          </div>
        </fieldset>

        {/* ── Customer Details ── */}
        <fieldset style={fieldsetStyle}>
          <legend style={legendStyle}>Customer Details</legend>
          <div>
            <label style={labelStyle}>Customer Name</label>
            <input value={billing.customerName || ''} onChange={e => setBilling(p => ({ ...p, customerName: e.target.value }))} placeholder='Enter Customer Name' style={inputStyle}
              onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primaryBg}`; }}
              onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
          </div>
        </fieldset>

        {/* ── Order Details (Only item name editable) ── */}
        <fieldset style={fieldsetStyle}>
          <legend style={legendStyle}>Order Details (Sample Items)</legend>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8, background: '#FFF8E1', padding: '6px 10px', borderRadius: 6, border: '1px solid #FFE082' }}>
            💡 Only <strong>Item Name</strong> is editable. Rate, Qty & Total are fixed sample data for preview.
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
            <thead>
              <tr style={{ background: C.surfaceAlt }}>
                {['Description', 'Price (₹)', 'Qty', 'Total', 'Action'].map(h => (
                  <th key={h} style={{ padding: '7px 8px', fontSize: 11, fontWeight: 700, color: C.textMuted, textAlign: h === 'Action' ? 'center' : 'left', borderBottom: `1.5px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orderItems.map((it, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '6px 4px' }}>
                    <input value={it.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder='Item name'
                      style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
                      onFocus={e => (e.target.style.borderColor = C.primary)} onBlur={e => (e.target.style.borderColor = C.border)} />
                  </td>
                  <td style={{ padding: '6px 8px', fontSize: 12, fontWeight: 600, color: C.textMuted, textAlign: 'right' }}>
                    ₹{it.price}
                  </td>
                  <td style={{ padding: '6px 8px', fontSize: 12, fontWeight: 600, color: C.textMuted, textAlign: 'center' }}>
                    {it.qty}
                  </td>
                  <td style={{ padding: '6px 8px', fontSize: 12, fontWeight: 700, color: C.text, textAlign: 'right' }}>
                    ₹{(it.price * it.qty).toFixed(2)}
                  </td>
                  <td style={{ padding: '6px 4px', textAlign: 'center', width: 70 }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <button onClick={addItem} style={{
                        width: 26, height: 26, borderRadius: '50%', border: 'none', cursor: 'pointer',
                        background: C.success, color: '#fff', fontSize: 14, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                      }}>+</button>
                      <button onClick={() => removeItem(idx)} disabled={orderItems.length <= 1} style={{
                        width: 26, height: 26, borderRadius: '50%', border: 'none', cursor: orderItems.length <= 1 ? 'not-allowed' : 'pointer',
                        background: orderItems.length <= 1 ? C.border : C.danger, color: '#fff', fontSize: 14, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: orderItems.length <= 1 ? 0.5 : 1, boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                      }}>−</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </fieldset>

        {/* ── Footer Text (Easy to edit) ── */}
        <fieldset style={fieldsetStyle}>
          <legend style={legendStyle}>📝 Receipt Footer</legend>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>
            Edit the footer text below. Use new lines to separate lines on the receipt.
          </div>
          <textarea
            value={footerText} onChange={e => setFooterText(e.target.value)}
            placeholder='Enter footer text for receipt. Press Enter for new line.'
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 60, fontFamily: "'Courier New', Courier, monospace", fontSize: 12 }}
            onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primaryBg}`; }}
            onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}
          />
          <div style={{ marginTop: 6, fontSize: 10, color: C.textLight }}>
            ✅ Footer will appear at the bottom of every receipt. Use <strong>Enter</strong> key for new lines.
          </div>
        </fieldset>

        {/* ── Payment Details ── */}
        <fieldset style={fieldsetStyle}>
          <legend style={legendStyle}>Payment Details</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Payment Method</label>
              <select value={payment.method} onChange={e => setPayment(p => ({ ...p, method: e.target.value }))} style={selectStyle}>
                {['Cash', 'Card', 'UPI', 'GooglePay', 'Paytm', 'Phonepe', 'Credit'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tax %</label>
              <input type='number' value={payment.taxPct} onChange={e => setPayment(p => ({ ...p, taxPct: parseFloat(e.target.value) || 0 }))}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primaryBg}`; }}
                onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
            </div>
          </div>
        </fieldset>


        {/* ── Actions ── */}
        <div style={{ display: 'flex', gap: 10, marginTop: 8, marginBottom: 20 }}>
          <button onClick={() => {
            localStorage.setItem('printTemplates', JSON.stringify(receiptTemplates));
            localStorage.setItem('kotTemplates', JSON.stringify(kotTemplates));
            localStorage.setItem('comboTemplates', JSON.stringify(comboTemplates));
            localStorage.setItem('onlineTemplates', JSON.stringify(onlineTemplates));
            localStorage.setItem('prebookTemplates', JSON.stringify(prebookTemplates));
            localStorage.setItem('salesPrinter_restaurant', JSON.stringify(restaurant));
            localStorage.setItem('salesPrinter_billing', JSON.stringify(billing));
            localStorage.setItem('salesPrinter_items', JSON.stringify(orderItems));
            localStorage.setItem('salesPrinter_footer', footerText);
            localStorage.setItem('salesPrinter_payment', JSON.stringify(payment));
            localStorage.setItem('salesPrinter_variant', templateVariant);
            localStorage.setItem('salesPrinter_gstType', gstType);
            localStorage.setItem('salesPrinter_printerWidth', String(printerWidth));
            localStorage.setItem('salesPrinter_activeTemplate', String(activeReceiptId));
            localStorage.setItem('salesPrinter_activeKotTemplate', String(activeKotId));
            localStorage.setItem('salesPrinter_activeComboTemplate', String(activeComboId));
            localStorage.setItem('salesPrinter_activeOnlineTemplate', String(activeOnlineId));
            localStorage.setItem('salesPrinter_activePrebookTemplate', String(activePrebookId));
            localStorage.setItem('salesPrinter_preset', selectedPreset);
            localStorage.setItem('salesPrinter_theme', templateTheme);
            alert('✅ Layout settings saved successfully!');
          }} style={{
            padding: '10px 28px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700,
            background: C.primary, color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
            transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6,
          }}
            onMouseOver={e => (e.currentTarget.style.background = C.primaryDark)}
            onMouseOut={e => (e.currentTarget.style.background = C.primary)}
          >💾 Save Settings</button>
          <button onClick={() => {
            setRestaurant({ name: '', address: '', gstNo: '' });
            setBilling({ tableNo: '', invoiceNo: '', billDate: new Date().toISOString().split('T')[0], billTime: new Date().toTimeString().slice(0, 5), waiter: '', customerName: '' });
            setOrderItems([{ description: '', price: 0, qty: 1 }]);
            setPayment({ method: 'Cash', taxPct: 5 });
            setTemplateVariant('normal');
            setGstType('inclusive');
          }} style={{
            padding: '10px 28px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700,
            background: C.dangerBg, color: C.danger, border: `1.5px solid ${C.danger}`,
            transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6,
          }}
            onMouseOver={e => (e.currentTarget.style.background = '#FFCDD2')}
            onMouseOut={e => (e.currentTarget.style.background = C.dangerBg)}
          >🗑 Clear</button>
        </div>
      </div>

      {/* ═══════════ RIGHT PANEL — Live Preview ═══════════ */}
      <div style={{ flex: '0 0 400px', position: 'sticky', top: 0, alignSelf: 'flex-start' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          👁️ Live Preview
        </div>



        {/* ── Dynamic Layout Preview ── */}
        <div style={{
          background: '#f8f9fa', border: `2px ${(THEME_STYLES[templateTheme]?.borderPreview || 'dashed')} ${THEME_STYLES[templateTheme]?.color || C.primary}`,
          borderRadius: 12, padding: '20px 0', display: 'flex', justifyContent: 'center',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <div data-preview-area style={{
            background: '#fff', width: `${Math.round(printerWidth * 3.78)}px`, color: '#000',
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: templateVariant === 'compact' ? 10 : templateVariant === 'detailed' ? 13 : 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            padding: templateVariant === 'compact' ? '4px 6px' : templateVariant === 'detailed' ? '12px 14px' : '8px 12px',
            boxSizing: 'border-box', transition: 'all 0.3s ease'
          }}>
            {(() => {
              // Theme styles
              const ts = THEME_STYLES[templateTheme] || THEME_STYLES.classic;
              // Group fields into lines based on `nextLine`
              const headerFields = ['CompanyName', 'Address1', 'BillNo', 'Date', 'Time', 'SalesMan', 'Table'];
              const itemCols = ['ItemName', 'Rate', 'Qty', 'Amount'];

              const getF = (name) => tpl.fields.find(x => x.name === name);

              // Variant-based font scaling
              const vScale = templateVariant === 'compact' ? 0.85 : templateVariant === 'detailed' ? 1.1 : 1;
              const getFontSize = (f) => {
                const s = f?.size || '';
                const m = s.match(/\d+/);
                const num = m ? parseInt(m[0]) : 9;
                const px = num === 12 ? 16 : num === 10 ? 14 : num === 9 ? 12 : Math.round(num * 1.33);
                return Math.max(8, Math.round(px * vScale));
              };
              const getFontWeight = (f) => f?.size?.includes('BOLD') ? 'bold' : 'normal';

              const renderLine = (fieldNames, vals = {}) => {
                const fields = fieldNames.map(getF).filter(f => f && f.print && !f.discontinue);
                if (!fields.length) return null;
                if (fields.length === 1) {
                  const f = fields[0];
                  let text = (f.text ? f.text + ' ' : '') + (vals[f.name] || '');
                  return (
                    <div key={f.name} style={{
                      textAlign: f.align?.toLowerCase() || 'left',
                      fontWeight: getFontWeight(f),
                      fontSize: getFontSize(f),
                      width: '100%', lineHeight: 1.4,
                    }}>
                      {text}
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

              // Group headers into rows based on nextLine
              let headerRows = [];
              let curRow = [];
              headerFields.forEach(name => {
                const f = getF(name);
                if (f && f.print && !f.discontinue) {
                  // CompanyName and Address1 always get their own row
                  if (name === 'CompanyName' || name === 'Address1') {
                    if (curRow.length > 0) { headerRows.push([...curRow]); curRow = []; }
                    headerRows.push([name]);
                    return;
                  }
                  curRow.push(name);
                  // Force new row if nextLine is true OR we hit 2 fields per row
                  if (f.nextLine || curRow.length >= 2) {
                    headerRows.push([...curRow]);
                    curRow = [];
                  }
                }
              });
              if (curRow.length > 0) headerRows.push(curRow);

              const theItems = orderItems.filter(it => it.description);

              // Get active item columns
              const activeCols = itemCols.filter(col => {
                const f = getF(col); return f && f.print && !f.discontinue;
              });
              const totalColLen = activeCols.reduce((s, col) => s + (getF(col)?.length || 10), 0);

              return (
                <>
                  {renderDivider()}

                  {headerRows.map((row, i) => (
                    <div key={'hr' + i}>
                      {renderLine(row, {
                        CompanyName: restaurant.name || 'Restaurant Name',
                        Address1: restaurant.address || 'Address',
                        BillNo: previewMode === 'online' ? (billing.invoiceNo || 'SW-984210') : (billing.invoiceNo || '001'),
                        Date: displayDate,
                        Time: displayTime,
                        SalesMan: previewMode === 'online' ? 'Swiggy/Zomato' : (billing.waiter || 'Staff'),
                        Table: previewMode === 'online' ? 'OTP: 4921' : (billing.tableNo || 'T1')
                      })}
                    </div>
                  ))}

                  {previewMode === 'online' && (
                    <div style={{
                      background: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: 4,
                      padding: '4px 6px', margin: '4px 0', fontSize: 10, lineHeight: 1.3
                    }}>
                      <div><strong>Customer:</strong> {billing.customerName || 'Rahul Sharma (9845123049)'}</div>
                      <div><strong>Address:</strong> Flat 402, Green Valley Apts, Sector 14</div>
                      <div style={{ color: '#D97706', marginTop: 2 }}><strong>Note:</strong> Extra spicy please, do not ring bell</div>
                    </div>
                  )}

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
                                fontSize: getFontSize(f),
                                padding: '2px 2px 4px',
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
                              const val = col === 'ItemName' ? it.description : col === 'Rate' ? it.price : col === 'Qty' ? it.qty : (it.price * it.qty).toFixed(2);
                              return (
                                <td key={col} style={{
                                  textAlign: f?.align?.toLowerCase() || 'left',
                                  padding: '1px 2px',
                                  fontWeight: getFontWeight(f),
                                  fontSize: getFontSize(f),
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

                  {(previewMode === 'receipt' || previewMode === 'combo') && payment.taxPct > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <tbody>
                        {[
                          ['Sub-Total:', subtotal.toFixed(2)],
                          [`CGST (${(payment.taxPct / 2).toFixed(1)}%):`, cgst.toFixed(2)],
                          [`SGST (${(payment.taxPct / 2).toFixed(1)}%):`, sgst.toFixed(2)],
                        ].map(([label, val]) => (
                          <tr key={label}>
                            <td style={{ textAlign: 'right', padding: '0 2px' }}>{label}</td>
                            <td style={{ textAlign: 'right', padding: '0 2px', width: '80px', fontWeight: 600 }}>{val}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {previewMode === 'online' && (
                    <>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                        <tbody>
                          {[
                            ['Sub-Total:', subtotal.toFixed(2)],
                            [`GST (${payment.taxPct}%):`, taxAmt.toFixed(2)],
                            ['Packaging Charge:', '35.00'],
                            ['Delivery Fee:', '40.00'],
                          ].map(([label, val]) => (
                            <tr key={label}>
                              <td style={{ textAlign: 'right', padding: '0 2px' }}>{label}</td>
                              <td style={{ textAlign: 'right', padding: '0 2px', width: '80px', fontWeight: 600 }}>{val}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 12, borderTop: ts.dividerBorder, marginTop: 2, paddingTop: 2, ...ts.totalBoxStyle }}>
                        <span>PAID ONLINE</span>
                        <span>NET: {(grandTotal + 75).toFixed(2)}</span>
                      </div>
                      <div style={{
                        marginTop: 4, background: '#F1F5F9', border: '1px dashed #CBD5E1', borderRadius: 4,
                        padding: '4px 6px', display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 'bold'
                      }}>
                        <span>🛵 Rider: Abdul Rahman</span>
                        <span>OTP: 4921</span>
                      </div>
                    </>
                  )}

                  {(previewMode === 'receipt' || previewMode === 'combo') && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 12, borderTop: ts.dividerBorder, marginTop: 2, paddingTop: 2, ...ts.totalBoxStyle }}>
                      <span>{ts.headerDecorator}Mode: {payment.method}</span>
                      <span>Total: {grandTotal.toFixed(2)}{ts.footerDecorator}</span>
                    </div>
                  )}

                  {(previewMode === 'kot' || previewMode === 'combo') && (
                    <div style={{ borderTop: ts.dividerBorder, marginTop: 2, paddingTop: 2, textAlign: 'center', fontSize: 11, fontWeight: 'bold', ...ts.totalBoxStyle }}>
                      {ts.headerDecorator}Total Items: {theItems.length} | Qty: {theItems.reduce((s, x) => s + x.qty, 0)}{ts.footerDecorator}
                    </div>
                  )}

                  {renderDivider()}
                  <div style={{ textAlign: 'center', marginTop: 2, fontSize: templateVariant === 'compact' ? 9 : 10, color: '#444', whiteSpace: 'pre-line', fontStyle: ts.footerFontStyle || 'normal' }}>
                    {ts.headerDecorator}{footerText || 'Thank you! Visit again!'}{ts.footerDecorator}
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Print Buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={() => {
            const previewEl = document.querySelector('[data-preview-area]');
            if (!previewEl) { alert('Preview not ready'); return; }
            if (window.electronAPI?.printReceipt) {
              const html = `<html><head><style>
                body { margin: 0; padding: 0; background: #fff; }
                #print-content { width: 100%; background: #fff; color: #000; padding: 4px; font-family: 'Courier New', Courier, monospace; font-size: 11px; }
                @media print { body { margin: 0; padding: 0; } #print-content { width: 100%; padding: 0; } }
              </style></head><body><div id="print-content">${previewEl.innerHTML}</div></body></html>`;
              let printerName = '';
              try { const pConf = JSON.parse(localStorage.getItem('printerConfig_sales')); if (pConf?.win) printerName = pConf.win; } catch { }
              window.electronAPI.printReceipt(html, printerName).catch(console.error);
            } else {
              const w = window.open('', '', `width=${Math.round(printerWidth * 3.78) + 40},height=600`);
              if (!w) { alert('Popup blocked! Please allow popups for this site.'); return; }
              w.document.write(`<html><head><style>
                @page { size: ${printerWidth}mm auto; margin: 0; }
                body { margin: 0; padding: 4px; background: #fff; width: ${printerWidth}mm; }
                #print-content { width: 100%; background: #fff; color: #000; padding: 4px; font-family: 'Courier New', Courier, monospace; font-size: 11px; }
                @media print { body { background: #fff; padding: 0; margin: 0; width: ${printerWidth}mm; } #print-content { width: 100%; padding: 0; } }
              </style></head><body><div id="print-content">${previewEl.innerHTML}</div></body></html>`);
              w.document.close(); setTimeout(() => { w.print(); w.close(); }, 500);
            }
          }} style={{
            flex: 1, padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700,
            background: C.primary, color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: '0 2px 8px rgba(37,99,235,0.3)', transition: 'all 0.15s',
          }}
            onMouseOver={e => (e.currentTarget.style.background = C.primaryDark)}
            onMouseOut={e => (e.currentTarget.style.background = C.primary)}
          >🖨️ Test Print</button>
          <button onClick={() => {
            const next = previewMode === 'receipt' ? 'kot' : previewMode === 'kot' ? 'online' : 'receipt';
            setPreviewMode(next);
            setSelIdx(0);
          }} style={{
            flex: 1, padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700,
            background: previewMode === 'online' ? '#ECFDF5' : previewMode === 'kot' ? '#FFF3E0' : C.primaryBg,
            color: previewMode === 'online' ? '#059669' : previewMode === 'kot' ? '#E65100' : C.primary,
            border: `1.5px solid ${previewMode === 'online' ? '#059669' : previewMode === 'kot' ? '#E65100' : C.primary}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s',
          }}>
            {previewMode === 'receipt' ? '📋 Switch to KOT' : previewMode === 'kot' ? '🛵 Switch to Online' : '🧾 Switch to Receipt'}
          </button>
        </div>

        {/* Layout Info */}
        <div style={{
          marginTop: 12, padding: '10px 14px', background: C.primaryBg, borderRadius: 8,
          border: `1px solid ${C.border}`, fontSize: 11, color: C.primary, fontWeight: 600,
        }}>
          💡 Sales printer layout = Bill receipt. Both <strong>Bill Receipt</strong> and <strong>Bill KOT</strong> use the same layout settings. Switch preview to verify both formats.
        </div>
      </div>
    </div>
  );
}

function PrinterSetup() {
  function Block({ title }) {
    const [s, setS] = useState({ type: 'DOS', dos: 'AnyDesk Printer', win: 'AnyDesk Printer', count: '0', gap: '0', autoCutter: false, askPrint: false });
    const [printers, setPrinters] = useState(['AnyDesk Printer', 'CITIZEN', 'EPSON', 'STAR']);

    useEffect(() => {
      if (window.electronAPI && window.electronAPI.getPrinters) {
        window.electronAPI.getPrinters().then(list => {
          if (list && list.length > 0) {
            setPrinters(list.map(p => p.name));
          }
        }).catch(err => console.error(err));
      }
    }, []);

    return (
      <Card title={title}>
        <Select label='Printer Type' value={s.type} onChange={v => setS(p => ({ ...p, type: v }))} options={['DOS', 'Windows', 'Network']} />
        <Select label='DOS Printer Name' value={s.dos} onChange={v => setS(p => ({ ...p, dos: v }))} options={printers} />
        <Select label='Windows Printer Name' value={s.win} onChange={v => setS(p => ({ ...p, win: v }))} options={printers} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Input label='No. of Prints' type='number' value={s.count} onChange={v => setS(p => ({ ...p, count: v }))} />
          <Input label='Gap Lines' type='number' value={s.gap} onChange={v => setS(p => ({ ...p, gap: v }))} />
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <Checkbox label='Auto Cutter' checked={s.autoCutter} onChange={v => setS(p => ({ ...p, autoCutter: v }))} />
          <Checkbox label='Ask Print' checked={s.askPrint} onChange={v => setS(p => ({ ...p, askPrint: v }))} />
        </div>
      </Card>
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 800 }}>
      <Block title='Sales Printer' />
      <Block title='KOT Printer' />
    </div>
  );
}

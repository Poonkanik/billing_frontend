import { Input, Select, Checkbox, Card } from '../common/UI';

export default function PrinterSubForm({ form, onChange }) {
  const set = (k, v) => onChange({ ...form, [k]: v });
  const PRINTERS = ['', 'CITIZEN', 'EPSON', 'STAR', 'Generic'];
  return (
    <Card title='Printer Override (Optional)' style={{ marginTop: 12, maxWidth: 420 }}>
      <Select label='Printer Type' value={form.printerType || ''} onChange={v => set('printerType', v)} options={['DOS', 'Windows', 'Network']} />
      <Select label='DOS Printer Name' value={form.dosPrinterName || ''} onChange={v => set('dosPrinterName', v)} options={PRINTERS.slice(1)} />
      <Select label='Windows Printer Name' value={form.windowsPrinterName || ''} onChange={v => set('windowsPrinterName', v)} options={PRINTERS.slice(1)} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Input label='No. of Prints' type='number' value={form.numberOfPrint || 0} onChange={v => set('numberOfPrint', parseInt(v) || 0)} />
        <Input label='Gap Lines' type='number' value={form.gapLine || 0} onChange={v => set('gapLine', parseInt(v) || 0)} />
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <Checkbox label='Auto Cutter' checked={form.autoCutter || false} onChange={v => set('autoCutter', v)} />
        <Checkbox label='Ask Print' checked={form.askPrint || false} onChange={v => set('askPrint', v)} />
      </div>
    </Card>
  );
}

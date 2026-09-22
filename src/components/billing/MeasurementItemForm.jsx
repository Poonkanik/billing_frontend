import { useState, useEffect } from 'react';
import { C, theme } from '../../utils/theme';
import {
  calculateAmount,
  getAvailableUnits,
  getMeasurementTypeDisplay,
  getUnitDisplay,
  formatMeasurement,
} from '../../utils/measurementHelper';

/**
 * MeasurementItemForm Component
 * Handles adding items with measurement-based calculations
 * Supports KG/GM, Litre/ML, Piece, Box, Packet measurements
 */
export function MeasurementItemForm({ 
  product, 
  onAdd, 
  onClose, 
  userBranchId, 
  getProductRate 
}) {
  const [quantity, setQuantity] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [amount, setAmount] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);

  const measurementType = product.measurementType || 'Piece';
  const baseMeasurement = product.baseMeasurement || 'Piece';
  const pricePerUnit = product.pricePerUnit || product.rate || 0;
  const taxPercent = product.tax || 5;
  const availableUnits = getAvailableUnits(measurementType);

  // Initialize selected unit
  useEffect(() => {
    if (!selectedUnit && availableUnits.length > 0) {
      setSelectedUnit(availableUnits[0]);
    }
  }, [product._id]);

  // Calculate amount when quantity or unit changes
  useEffect(() => {
    if (!quantity || parseFloat(quantity) <= 0 || !selectedUnit) {
      setAmount(0);
      setTax(0);
      setTotal(0);
      return;
    }

    const calc = calculateAmount(
      pricePerUnit,
      parseFloat(quantity),
      selectedUnit,
      measurementType
    );

    const taxAmt = (calc * taxPercent) / 100;
    const totAmt = calc + taxAmt;

    setAmount(calc);
    setTax(taxAmt);
    setTotal(totAmt);
  }, [quantity, selectedUnit, pricePerUnit, taxPercent, measurementType]);

  const handleAddItem = () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      alert('Please enter a quantity');
      return;
    }

    const productRate = getProductRate ? getProductRate(product, userBranchId) : pricePerUnit;

    const item = {
      productCode: product.code,
      productName: product.name,
      rate: productRate,
      qty: parseFloat(quantity),
      amount: amount,
      measurementType: measurementType,
      measurementUnit: selectedUnit,
      baseMeasurement: baseMeasurement,
      pricePerUnit: productRate,
      group: product.groupName || '',
      department: product.departmentName || '',
      barcode: product.barcode || '',
      tax: taxPercent,
      imageUrl: product.imageUrl || '',
    };

    onAdd(item);
    onClose();
  };

  const handleQuickQty = (qty) => {
    setQuantity(String(qty));
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1500,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: C.surface,
          borderRadius: 16,
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: C.primary,
            color: '#fff',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 16 }}>📦 {product.name}</div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 16,
              width: 30,
              height: 30,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>
          {/* Product Code and Barcode */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.textMuted,
                  display: 'block',
                  marginBottom: 4,
                  textTransform: 'uppercase',
                }}
              >
                Code
              </label>
              <div
                style={{
                  padding: '10px 12px',
                  background: C.surfaceAlt,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.text,
                }}
              >
                {product.code}
              </div>
            </div>
            {product.barcode && (
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.textMuted,
                    display: 'block',
                    marginBottom: 4,
                    textTransform: 'uppercase',
                  }}
                >
                  Barcode
                </label>
                <div
                  style={{
                    padding: '10px 12px',
                    background: C.surfaceAlt,
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.textMuted,
                  }}
                >
                  {product.barcode}
                </div>
              </div>
            )}
          </div>

          {/* Price Info */}
          <div
            style={{
              padding: 12,
              background: C.primaryBg,
              borderRadius: 10,
              marginBottom: 16,
              border: `1.5px solid ${C.primary}`,
            }}
          >
            <div style={{ fontSize: 11, color: C.primary, fontWeight: 600, marginBottom: 4 }}>
              PRICE PER {baseMeasurement}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.primary }}>
              ₹{pricePerUnit.toFixed(2)}
            </div>
          </div>

          {/* Measurement Type Display */}
          <div
            style={{
              padding: 12,
              background: C.surfaceAlt,
              borderRadius: 10,
              marginBottom: 16,
              border: `1px solid ${C.border}`,
            }}
          >
            <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, marginBottom: 4 }}>
              {getMeasurementTypeDisplay(measurementType)}
            </div>
            <div style={{ fontSize: 13, color: C.text, fontWeight: 700 }}>
              Available: {availableUnits.map(getUnitDisplay).join(' / ')}
            </div>
          </div>

          {/* Unit Selection */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.textMuted,
                display: 'block',
                marginBottom: 8,
                textTransform: 'uppercase',
              }}
            >
              Select Unit
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {availableUnits.map((unit) => (
                <button
                  key={unit}
                  onClick={() => setSelectedUnit(unit)}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    borderRadius: 8,
                    border: `2px solid ${selectedUnit === unit ? C.primary : C.border}`,
                    background: selectedUnit === unit ? C.primaryBg : C.surface,
                    color: selectedUnit === unit ? C.primary : C.textMuted,
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 12,
                    transition: 'all 0.15s',
                  }}
                >
                  {getUnitDisplay(unit)}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Input */}
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.textMuted,
                display: 'block',
                marginBottom: 6,
                textTransform: 'uppercase',
              }}
            >
              Quantity
            </label>
            <input
              type="number"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity..."
              autoFocus
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                fontSize: 16,
                fontWeight: 700,
                border: `2px solid ${C.border}`,
                borderRadius: 10,
                outline: 'none',
                color: C.text,
                marginBottom: 10,
              }}
              onFocus={(e) => (e.target.style.borderColor = C.primary)}
              onBlur={(e) => (e.target.style.borderColor = C.border)}
            />

            {/* Quick qty buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {[0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 5].map((q) => (
                <button
                  key={q}
                  onClick={() => handleQuickQty(q)}
                  style={{
                    padding: '8px',
                    background: quantity === String(q) ? C.primaryBg : C.surfaceAlt,
                    border: `1px solid ${quantity === String(q) ? C.primary : C.border}`,
                    color: quantity === String(q) ? C.primary : C.textMuted,
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 11,
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Calculation */}
          {quantity && parseFloat(quantity) > 0 && (
            <div
              style={{
                padding: 12,
                background: C.successBg,
                borderRadius: 10,
                marginBottom: 16,
                border: `1.5px solid ${C.success}`,
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: C.success, fontWeight: 700, marginBottom: 2 }}>
                    AMOUNT
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: C.success }}>
                    ₹{amount.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.success, fontWeight: 700, marginBottom: 2 }}>
                    TAX ({taxPercent}%)
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: C.success }}>
                    ₹{tax.toFixed(2)}
                  </div>
                </div>
              </div>
              <div
                style={{
                  borderTop: `1px solid ${C.success}`,
                  paddingTop: 8,
                }}
              >
                <div style={{ fontSize: 10, color: C.success, fontWeight: 700, marginBottom: 2 }}>
                  TOTAL
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.success }}>
                  ₹{total.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Calculation Info */}
          {quantity && parseFloat(quantity) > 0 && (
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 16, padding: 10, background: C.surfaceAlt, borderRadius: 8 }}>
              <strong>{formatMeasurement(quantity, selectedUnit)}</strong> × ₹{pricePerUnit.toFixed(2)} per {getUnitDisplay(baseMeasurement)} = ₹{amount.toFixed(2)}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleAddItem}
              disabled={!quantity || parseFloat(quantity) <= 0}
              style={{
                flex: 1,
                padding: 14,
                background:
                  !quantity || parseFloat(quantity) <= 0 ? C.border : C.success,
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontWeight: 800,
                fontSize: 14,
                cursor:
                  !quantity || parseFloat(quantity) <= 0
                    ? 'not-allowed'
                    : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              ✅ Add to Bill
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: 14,
                background: C.surfaceAlt,
                color: C.text,
                border: `1.5px solid ${C.border}`,
                borderRadius: 10,
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MeasurementItemForm;

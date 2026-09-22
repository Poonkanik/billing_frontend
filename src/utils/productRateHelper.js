// src/utils/productRateHelper.js

/**
 * Hybrid Pricing Resolution Order:
 * 1. Branch-specific rate for the selected sales mode (branchRates[branch].salesModeRates[salesMode])
 * 2. Branch-specific base rate (branchRates[branch].rate)
 * 3. Common rate for the selected sales mode (rates[salesMode])
 * 4. Common base rate (product.rate)
 */

/**
 * Get product rate based on selected sales mode AND branch
 * @param {Object} product - Product object from API
 * @param {String} salesModeId - Selected sales mode ID
 * @param {String} branchId - Current branch ID (optional — null for common pricing)
 * @returns {Object} - { rate, source } where source indicates where the rate came from
 */
export const getProductRateWithSource = (product, salesModeId, branchId = null) => {
  if (!product) return { rate: 0, source: 'none' };

  // ── Step 1 & 2: Check branch-specific rates ──
  if (branchId && product.branchRates && product.branchRates.length > 0) {
    const branchEntry = product.branchRates.find(br => {
      const brId = br.branch?._id || br.branch;
      return brId?.toString() === branchId?.toString();
    });

    if (branchEntry) {
      // Step 1: Branch + SalesMode specific rate
      if (salesModeId && branchEntry.salesModeRates && branchEntry.salesModeRates.length > 0) {
        const smRate = branchEntry.salesModeRates.find(smr => {
          const smId = smr.salesMode?._id || smr.salesMode;
          return smId?.toString() === salesModeId?.toString();
        });
        if (smRate && smRate.rate > 0) {
          return { rate: smRate.rate, source: 'branch_salesmode' };
        }
      }

      // Step 2: Branch base rate
      if (branchEntry.rate > 0) {
        return { rate: branchEntry.rate, source: 'branch' };
      }
    }
  }

  // ── Step 3: Common sales mode rate ──
  if (product.rates && product.rates.length > 0 && salesModeId) {
    const specificRate = product.rates.find(rate => {
      const rateSalesModeId = rate.salesMode?._id || rate.salesMode;
      return rateSalesModeId?.toString() === salesModeId?.toString();
    });
    if (specificRate && specificRate.rate > 0) {
      return { rate: specificRate.rate, source: 'common_salesmode' };
    }
  }

  // ── Step 4: Common base rate ──
  return { rate: product.rate || 0, source: 'common' };
};

/**
 * Get product rate based on selected sales mode AND branch (simple number return)
 * @param {Object} product - Product object from API
 * @param {String} salesModeId - Selected sales mode ID
 * @param {String} branchId - Current branch ID (optional)
 * @returns {Number} - Rate for the product
 */
export const getProductRateBySalesMode = (product, salesModeId, branchId = null) => {
  return getProductRateWithSource(product, salesModeId, branchId).rate;
};

/**
 * Calculate item amount with sales mode rate
 * @param {Object} product - Product object
 * @param {Number} qty - Quantity
 * @param {String} salesModeId - Sales mode ID
 * @param {String} branchId - Branch ID
 * @returns {Number} - Total amount
 */
export const calculateItemAmount = (product, qty, salesModeId, branchId) => {
  const rate = getProductRateBySalesMode(product, salesModeId, branchId);
  return rate * qty;
};

/**
 * Update product list with correct rates based on sales mode and branch
 * @param {Array} products - Original products list
 * @param {String} salesModeId - Selected sales mode ID
 * @param {String} branchId - Current branch ID (optional)
 * @returns {Array} - Products with updated rates
 */
export const updateProductsRatesBySalesMode = (products, salesModeId, branchId = null) => {
  if (!products) return products;
  
  return products.map(product => {
    const { rate, source } = getProductRateWithSource(product, salesModeId, branchId);
    return {
      ...product,
      currentRate: rate,
      rateSource: source,       // 'branch_salesmode' | 'branch' | 'common_salesmode' | 'common'
      originalRate: product.rate // Keep common base rate for reference
    };
  });
};

/**
 * Get branch-specific base rate for a product (ignoring sales mode)
 * @param {Object} product - Product object
 * @param {String} branchId - Branch ID
 * @returns {Number} - Branch base rate or 0 if using common
 */
export const getBranchBaseRate = (product, branchId) => {
  if (!branchId || !product?.branchRates) return 0;
  const branchEntry = product.branchRates.find(br => {
    const brId = br.branch?._id || br.branch;
    return brId?.toString() === branchId?.toString();
  });
  return branchEntry?.rate || 0;
};

/**
 * Get branch-specific sales mode rate
 * @param {Object} product - Product object
 * @param {String} branchId - Branch ID
 * @param {String} salesModeId - Sales mode ID
 * @returns {Number} - Branch sales mode rate or 0 if using common
 */
export const getBranchSalesModeRate = (product, branchId, salesModeId) => {
  if (!branchId || !salesModeId || !product?.branchRates) return 0;
  const branchEntry = product.branchRates.find(br => {
    const brId = br.branch?._id || br.branch;
    return brId?.toString() === branchId?.toString();
  });
  if (!branchEntry?.salesModeRates) return 0;
  const smRate = branchEntry.salesModeRates.find(smr => {
    const smId = smr.salesMode?._id || smr.salesMode;
    return smId?.toString() === salesModeId?.toString();
  });
  return smRate?.rate || 0;
};
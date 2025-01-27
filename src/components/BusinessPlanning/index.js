// src/components/BusinessPlanning/index.js
import { formatCurrency, formatPercentage, formatNumber } from '../../utils/formatting.js';
import { calculateTax, calculateMargin, calculateMonthlyDistribution, getActiveMonths } from '../../utils/calculations.js';
import { StorageKeys, saveToStorage, getFromStorage } from '../../utils/storage.js';

export class BusinessPlanningTool {
    constructor() {
        this.products = [];
        this.nextProductId = 1;
        this.months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        // Load saved data
        const savedData = getFromStorage(StorageKeys.BUSINESS_PLAN);
        if (savedData) {
            this.products = savedData.products;
            this.nextProductId = savedData.nextProductId;
        }
    }

    init() {
        // Add initial product if none exists
        if (this.products.length === 0) {
            this.addProduct();
        }
        this.render();
        this.attachEventListeners();
    }

    addProduct() {
        const product = {
            id: this.nextProductId++,
            name: `Product ${this.products.length + 1}`,
            units: 0,
            price: 0,
            cost: 0,
            startMonth: 0,
            endMonth: 11,
            monthlyOverrides: {}
        };
        this.products.push(product);
        this.saveData();
        this.render();
    }

    deleteProduct(id) {
        this.products = this.products.filter(p => p.id !== id);
        this.saveData();
        this.render();
    }

    updateProduct(id, field, value) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            product[field] = field === 'name' ? value : Number(value);
            if (field === 'units') {
                product.monthlyOverrides = {};
            }
            this.saveData();
            this.render();
        }
    }

    updateMonthlyOverride(productId, month, value) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            const oldValue = product.monthlyOverrides[month] || 
                Math.floor(product.units / getActiveMonths(product.startMonth, product.endMonth).length);
            const difference = oldValue - value;
            product.monthlyOverrides[month] = value;
            
            // Get remaining months in range after the current month
            const remainingMonths = getActiveMonths(product.startMonth, product.endMonth)
                .filter(m => m > month);
            
            if (remainingMonths.length > 0) {
                // Distribute the difference equally among remaining months
                const adjustmentPerMonth = Math.floor(difference / remainingMonths.length);
                let remainder = difference % remainingMonths.length;
                
                remainingMonths.forEach(m => {
                    const currentMonthValue = product.monthlyOverrides[m] || 
                        Math.floor(product.units / getActiveMonths(product.startMonth, product.endMonth).length);
                    let adjustment = adjustmentPerMonth;
                    if (remainder > 0) {
                        adjustment++;
                        remainder--;
                    }
                    product.monthlyOverrides[m] = currentMonthValue + adjustment;
                });
            }
            this.saveData();
            this.render();
        }
    }

    renderProducts() {
        const container = document.getElementById('products');
        if (!container) return;

        container.innerHTML = '';
        this.products.forEach(product => {
            const activeMonths = getActiveMonths(product.startMonth, product.endMonth);
            const defaultMonthlyUnits = Math.floor(product.units / activeMonths.length);
            
            const monthlyData = Array(12).fill(0).map((_, month) => {
                if (activeMonths.includes(month)) {
                    return product.monthlyOverrides[month] || defaultMonthlyUnits;
                }
                return 0;
            });

            const revenue = product.units * product.price;
            const costs = product.units * product.cost;
            const grossProfit = revenue - costs;
            const margin = product.price > 0 ? ((product.price - product.cost) / product.price * 100) : 0;
            const taxRate = parseFloat(document.getElementById('taxRate')?.value) || 25;
            const tax = calculateTax(grossProfit, taxRate);
            const netProfit = grossProfit - tax;

            const productCard = this.createProductCard(product, {
                monthlyData,
                revenue,
                costs,
                grossProfit,
                margin,
                tax,
                netProfit,
                taxRate
            });
            container.appendChild(productCard);
        });
    }

    createProductCard(product, metrics) {
        const card = document.createElement('div');
        card.className = 'card product-card';
        card.innerHTML = `
            <div class="product-header">
                <input type="text" value="${product.name}" 
                    onchange="businessPlanningTool.updateProduct(${product.id}, 'name', this.value)"
                    placeholder="Product Name">
                <button class="button danger" onclick="businessPlanningTool.deleteProduct(${product.id})">Delete</button>
            </div>
            <!-- Product inputs -->
            <div class="input-group">
                <label>Annual Units</label>
                <input type="number" value="${product.units}" 
                    onchange="businessPlanningTool.updateProduct(${product.id}, 'units', this.value)">
            </div>
            <div class="input-group">
                <label>Price per Unit ($)</label>
                <input type="number" value="${product.price}" 
                    onchange="businessPlanningTool.updateProduct(${product.id}, 'price', this.value)">
            </div>
            <div class="input-group">
                <label>Cost per Unit ($)</label>
                <input type="number" value="${product.cost}" 
                    onchange="businessPlanningTool.updateProduct(${product.id}, 'cost', this.value)">
            </div>
            <!-- Month range selectors -->
            ${this.createMonthRangeSelectors(product)}
            <!-- Product summary -->
            ${this.createProductSummary(metrics)}
            <!-- Monthly forecast table -->
            ${this.createMonthlyForecastTable(product, metrics.monthlyData)}
        `;
        return card;
    }

    createMonthRangeSelectors(product) {
        return `
            <div class="input-group">
                <label>Start Month</label>
                <select onchange="businessPlanningTool.updateProduct(${product.id}, 'startMonth', this.value)">
                    ${this.months.map((month, i) => `
                        <option value="${i}" ${product.startMonth === i ? 'selected' : ''}>
                            ${month}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="input-group">
                <label>End Month</label>
                <select onchange="businessPlanningTool.updateProduct(${product.id}, 'endMonth', this.value)">
                    ${this.months.map((month, i) => `
                        <option value="${i}" ${product.endMonth === i ? 'selected' : ''}>
                            ${month}
                        </option>
                    `).join('')}
                </select>
            </div>
        `;
    }

    createProductSummary(metrics) {
        return `
            <div class="summary">
                <h4>Product Summary</h4>
                <p>Annual Revenue: ${formatCurrency(metrics.revenue)}</p>
                <p>Annual Costs: ${formatCurrency(metrics.costs)}</p>
                <p>Gross Profit: ${formatCurrency(metrics.grossProfit)}</p>
                <p>Margin: ${formatPercentage(metrics.margin / 100)}</p>
                <p>Tax (${metrics.taxRate}%): ${formatCurrency(metrics.tax)}</p>
                <p>Net Profit: ${formatCurrency(metrics.netProfit)}</p>
            </div>
        `;
    }

    createMonthlyForecastTable(product, monthlyData) {
        return `
            <div class="monthly-forecast">
                <h4>Monthly Sales Forecast</h4>
                <table class="table">
                    <tr>
                        <th>Month</th>
                        <th>Units</th>
                        <th>Revenue</th>
                        <th>Costs</th>
                        <th>Profit</th>
                    </tr>
                    ${this.months.map((month, i) => {
                        const units = monthlyData[i];
                        const monthRevenue = units * product.price;
                        const monthCosts = units * product.cost;
                        const monthProfit = monthRevenue - monthCosts;
                        return `
                            <tr>
                                <td>${month}</td>
                                <td class="editable-cell" 
                                    onclick="businessPlanningTool.makeEditable(this, ${product.id}, ${i}, ${units})">
                                    ${units}
                                </td>
                                <td>${formatCurrency(monthRevenue)}</td>
                                <td>${formatCurrency(monthCosts)}</td>
                                <td>${formatCurrency(monthProfit)}</td>
                            </tr>
                        `;
                    }).join('')}
                </table>
            </div>
        `;
    }

    makeEditable(cell, productId, month, currentValue) {
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'edit-input';
        input.value = currentValue;
        
        input.onblur = () => {
            const newValue = parseInt(input.value) || 0;
            this.updateMonthlyOverride(productId, month, newValue);
        };

        input.onkeypress = (e) => {
            if (e.key === 'Enter') {
                input.blur();
            }
        };

        cell.innerHTML = '';
        cell.appendChild(input);
        input.focus();
    }

    saveData() {
        saveToStorage(StorageKeys.BUSINESS_PLAN, {
            products: this.products,
            nextProductId: this.nextProductId
        });
    }

    render() {
        const container = document.querySelector('.tool-content');
        if (!container) return;

        container.innerHTML = `
            <h2>Business Planning</h2>
            <div class="tax-rate-container">
                <label for="taxRate">Tax Rate (%)</label>
                <input type="number" id="taxRate" value="25" class="tax-rate-input">
            </div>
            <button class="button add-product-btn">Add New Product Line</button>
            <div id="products"></div>
            <div class="portfolio-summary card"></div>
        `;

        this.renderProducts();
        this.renderPortfolioSummary();
        this.attachEventListeners();
    }

    renderPortfolioSummary() {
        const summary = document.querySelector('.portfolio-summary');
        if (!summary) return;

        const totals = this.calculatePortfolioTotals();
        summary.innerHTML = `
            <h3>Portfolio Summary</h3>
            <div class="grid">
                <div>
                    <h4>Total Revenue</h4>
                    <p>${formatCurrency(totals.revenue)}</p>
                </div>
                <div>
                    <h4>Total Costs</h4>
                    <p>${formatCurrency(totals.costs)}</p>
                </div>
                <div>
                    <h4>Total Gross Profit</h4>
                    <p>${formatCurrency(totals.grossProfit)}</p>
                </div>
                <div>
                    <h4>Average Margin</h4>
                    <p>${formatPercentage(totals.margin / 100)}</p>
                </div>
                <div>
                    <h4>Total Tax</h4>
                    <p>${formatCurrency(totals.tax)}</p>
                </div>
                <div>
                    <h4>Net Profit</h4>
                    <p>${formatCurrency(totals.netProfit)}</p>
                </div>
            </div>
            ${this.createKeyTakeaways(totals)}
        `;
    }

    calculatePortfolioTotals() {
        const taxRate = parseFloat(document.getElementById('taxRate')?.value) || 25;
        
        return this.products.reduce((acc, product) => {
            const revenue = product.units * product.price;
            const costs = product.units * product.cost;
            const profit = revenue - costs;
            
            acc.revenue += revenue;
            acc.costs += costs;
            acc.grossProfit += profit;
            
            return acc;
        }, { 
            revenue: 0, 
            costs: 0, 
            grossProfit: 0 
        });
    }

    createKeyTakeaways(totals) {
        const takeaways = [];
        
        if (totals.revenue > 0) {
            takeaways.push(`Your portfolio's overall gross profit margin is ${formatPercentage(totals.margin / 100)}%`);
            
            if (this.products.length > 1) {
                const bestProduct = this.products.reduce((best, current) => {
                    const currentMargin = calculateMargin(current.price, current.cost);
                    const bestMargin = calculateMargin(best.price, best.cost);
                    return currentMargin > bestMargin ? current : best;
                }, this.products[0]);
                takeaways.push(`${bestProduct.name} has your highest profit margin at ${formatPercentage(calculateMargin(bestProduct.price, bestProduct.cost) / 100)}%`);
            }

            const taxRate = parseFloat(document.getElementById('taxRate')?.value) || 25;
            const taxBurden = calculateTax(totals.grossProfit, taxRate);
            takeaways.push(`Your tax burden of ${formatCurrency(taxBurden)} reduces your gross profit by ${formatPercentage(taxBurden / totals.grossProfit)}%`);
        }
        
        return `
            <div class="key-takeaways mt-3">
                <h4>Key Takeaways</h4>
                <ul>
                    ${takeaways.map(takeaway => `<li>${takeaway}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    attachEventListeners() {
        // Add product button
        const addButton = document.querySelector('.add-product-btn');
        if (addButton) {
            addButton.addEventListener('click', () => this.addProduct
                                       // src/components/BusinessPlanning/index.js
import { formatCurrency, formatPercentage, formatNumber } from '../../utils/formatting.js';
import { calculateTax, calculateMargin, calculateMonthlyDistribution, getActiveMonths } from '../../utils/calculations.js';
import { StorageKeys, saveToStorage, getFromStorage } from '../../utils/storage.js';

export class BusinessPlanningTool {
    constructor() {
        this.products = [];
        this.nextProductId = 1;
        this.months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        // Load saved data
        const savedData = getFromStorage(StorageKeys.BUSINESS_PLAN);
        if (savedData) {
            this.products = savedData.products;
            this.nextProductId = savedData.nextProductId;
        }
    }

    init() {
        // Add initial product if none exists
        if (this.products.length === 0) {
            this.addProduct();
        }
        this.render();
        this.attachEventListeners();
    }

    addProduct() {
        const product = {
            id: this.nextProductId++,
            name: `Product ${this.products.length + 1}`,
            units: 0,
            price: 0,
            cost: 0,
            startMonth: 0,
            endMonth: 11,
            monthlyOverrides: {}
        };
        this.products.push(product);
        this.saveData();
        this.render();
    }

    deleteProduct(id) {
        this.products = this.products.filter(p => p.id !== id);
        this.saveData();
        this.render();
    }

    updateProduct(id, field, value) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            product[field] = field === 'name' ? value : Number(value);
            if (field === 'units') {
                product.monthlyOverrides = {};
            }
            this.saveData();
            this.render();
        }
    }

    updateMonthlyOverride(productId, month, value) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            const oldValue = product.monthlyOverrides[month] || 
                Math.floor(product.units / getActiveMonths(product.startMonth, product.endMonth).length);
            const difference = oldValue - value;
            product.monthlyOverrides[month] = value;
            
            // Get remaining months in range after the current month
            const remainingMonths = getActiveMonths(product.startMonth, product.endMonth)
                .filter(m => m > month);
            
            if (remainingMonths.length > 0) {
                // Distribute the difference equally among remaining months
                const adjustmentPerMonth = Math.floor(difference / remainingMonths.length);
                let remainder = difference % remainingMonths.length;
                
                remainingMonths.forEach(m => {
                    const currentMonthValue = product.monthlyOverrides[m] || 
                        Math.floor(product.units / getActiveMonths(product.startMonth, product.endMonth).length);
                    let adjustment = adjustmentPerMonth;
                    if (remainder > 0) {
                        adjustment++;
                        remainder--;
                    }
                    product.monthlyOverrides[m] = currentMonthValue + adjustment;
                });
            }
            this.saveData();
            this.render();
        }
    }

    renderProducts() {
        const container = document.getElementById('products');
        if (!container) return;

        container.innerHTML = '';
        this.products.forEach(product => {
            const activeMonths = getActiveMonths(product.startMonth, product.endMonth);
            const defaultMonthlyUnits = Math.floor(product.units / activeMonths.length);
            
            const monthlyData = Array(12).fill(0).map((_, month) => {
                if (activeMonths.includes(month)) {
                    return product.monthlyOverrides[month] || defaultMonthlyUnits;
                }
                return 0;
            });

            const revenue = product.units * product.price;
            const costs = product.units * product.cost;
            const grossProfit = revenue - costs;
            const margin = product.price > 0 ? ((product.price - product.cost) / product.price * 100) : 0;
            const taxRate = parseFloat(document.getElementById('taxRate')?.value) || 25;
            const tax = calculateTax(grossProfit, taxRate);
            const netProfit = grossProfit - tax;

            const productCard = this.createProductCard(product, {
                monthlyData,
                revenue,
                costs,
                grossProfit,
                margin,
                tax,
                netProfit,
                taxRate
            });
            container.appendChild(productCard);
        });
    }

    createProductCard(product, metrics) {
        const card = document.createElement('div');
        card.className = 'card product-card';
        card.innerHTML = `
            <div class="product-header">
                <input type="text" value="${product.name}" 
                    onchange="businessPlanningTool.updateProduct(${product.id}, 'name', this.value)"
                    placeholder="Product Name">
                <button class="button danger" onclick="businessPlanningTool.deleteProduct(${product.id})">Delete</button>
            </div>
            <!-- Product inputs -->
            <div class="input-group">
                <label>Annual Units</label>
                <input type="number" value="${product.units}" 
                    onchange="businessPlanningTool.updateProduct(${product.id}, 'units', this.value)">
            </div>
            <div class="input-group">
                <label>Price per Unit ($)</label>
                <input type="number" value="${product.price}" 
                    onchange="businessPlanningTool.updateProduct(${product.id}, 'price', this.value)">
            </div>
            <div class="input-group">
                <label>Cost per Unit ($)</label>
                <input type="number" value="${product.cost}" 
                    onchange="businessPlanningTool.updateProduct(${product.id}, 'cost', this.value)">
            </div>
            <!-- Month range selectors -->
            ${this.createMonthRangeSelectors(product)}
            <!-- Product summary -->
            ${this.createProductSummary(metrics)}
            <!-- Monthly forecast table -->
            ${this.createMonthlyForecastTable(product, metrics.monthlyData)}
        `;
        return card;
    }

    createMonthRangeSelectors(product) {
        return `
            <div class="input-group">
                <label>Start Month</label>
                <select onchange="businessPlanningTool.updateProduct(${product.id}, 'startMonth', this.value)">
                    ${this.months.map((month, i) => `
                        <option value="${i}" ${product.startMonth === i ? 'selected' : ''}>
                            ${month}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="input-group">
                <label>End Month</label>
                <select onchange="businessPlanningTool.updateProduct(${product.id}, 'endMonth', this.value)">
                    ${this.months.map((month, i) => `
                        <option value="${i}" ${product.endMonth === i ? 'selected' : ''}>
                            ${month}
                        </option>
                    `).join('')}
                </select>
            </div>
        `;
    }

    createProductSummary(metrics) {
        return `
            <div class="summary">
                <h4>Product Summary</h4>
                <p>Annual Revenue: ${formatCurrency(metrics.revenue)}</p>
                <p>Annual Costs: ${formatCurrency(metrics.costs)}</p>
                <p>Gross Profit: ${formatCurrency(metrics.grossProfit)}</p>
                <p>Margin: ${formatPercentage(metrics.margin / 100)}</p>
                <p>Tax (${metrics.taxRate}%): ${formatCurrency(metrics.tax)}</p>
                <p>Net Profit: ${formatCurrency(metrics.netProfit)}</p>
            </div>
        `;
    }

    createMonthlyForecastTable(product, monthlyData) {
        return `
            <div class="monthly-forecast">
                <h4>Monthly Sales Forecast</h4>
                <table class="table">
                    <tr>
                        <th>Month</th>
                        <th>Units</th>
                        <th>Revenue</th>
                        <th>Costs</th>
                        <th>Profit</th>
                    </tr>
                    ${this.months.map((month, i) => {
                        const units = monthlyData[i];
                        const monthRevenue = units * product.price;
                        const monthCosts = units * product.cost;
                        const monthProfit = monthRevenue - monthCosts;
                        return `
                            <tr>
                                <td>${month}</td>
                                <td class="editable-cell" 
                                    onclick="businessPlanningTool.makeEditable(this, ${product.id}, ${i}, ${units})">
                                    ${units}
                                </td>
                                <td>${formatCurrency(monthRevenue)}</td>
                                <td>${formatCurrency(monthCosts)}</td>
                                <td>${formatCurrency(monthProfit)}</td>
                            </tr>
                        `;
                    }).join('')}
                </table>
            </div>
        `;
    }

    makeEditable(cell, productId, month, currentValue) {
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'edit-input';
        input.value = currentValue;
        
        input.onblur = () => {
            const newValue = parseInt(input.value) || 0;
            this.updateMonthlyOverride(productId, month, newValue);
        };

        input.onkeypress = (e) => {
            if (e.key === 'Enter') {
                input.blur();
            }
        };

        cell.innerHTML = '';
        cell.appendChild(input);
        input.focus();
    }

    saveData() {
        saveToStorage(StorageKeys.BUSINESS_PLAN, {
            products: this.products,
            nextProductId: this.nextProductId
        });
    }

    render() {
        const container = document.querySelector('.tool-content');
        if (!container) return;

        container.innerHTML = `
            <h2>Business Planning</h2>
            <div class="tax-rate-container">
                <label for="taxRate">Tax Rate (%)</label>
                <input type="number" id="taxRate" value="25" class="tax-rate-input">
            </div>
            <button class="button add-product-btn">Add New Product Line</button>
            <div id="products"></div>
            <div class="portfolio-summary card"></div>
        `;

        this.renderProducts();
        this.renderPortfolioSummary();
        this.attachEventListeners();
    }

    renderPortfolioSummary() {
        const summary = document.querySelector('.portfolio-summary');
        if (!summary) return;

        const totals = this.calculatePortfolioTotals();
        summary.innerHTML = `
            <h3>Portfolio Summary</h3>
            <div class="grid">
                <div>
                    <h4>Total Revenue</h4>
                    <p>${formatCurrency(totals.revenue)}</p>
                </div>
                <div>
                    <h4>Total Costs</h4>
                    <p>${formatCurrency(totals.costs)}</p>
                </div>
                <div>
                    <h4>Total Gross Profit</h4>
                    <p>${formatCurrency(totals.grossProfit)}</p>
                </div>
                <div>
                    <h4>Average Margin</h4>
                    <p>${formatPercentage(totals.margin / 100)}</p>
                </div>
                <div>
                    <h4>Total Tax</h4>
                    <p>${formatCurrency(totals.tax)}</p>
                </div>
                <div>
                    <h4>Net Profit</h4>
                    <p>${formatCurrency(totals.netProfit)}</p>
                </div>
            </div>
            ${this.createKeyTakeaways(totals)}
        `;
    }

    calculatePortfolioTotals() {
        const taxRate = parseFloat(document.getElementById('taxRate')?.value) || 25;
        
        return this.products.reduce((acc, product) => {
            const revenue = product.units * product.price;
            const costs = product.units * product.cost;
            const profit = revenue - costs;
            
            acc.revenue += revenue;
            acc.costs += costs;
            acc.grossProfit += profit;
            
            return acc;
        }, { 
            revenue: 0, 
            costs: 0, 
            grossProfit: 0 
        });
    }

    createKeyTakeaways(totals) {
        const takeaways = [];
        
        if (totals.revenue > 0) {
            takeaways.push(`Your portfolio's overall gross profit margin is ${formatPercentage(totals.margin / 100)}%`);
            
            if (this.products.length > 1) {
                const bestProduct = this.products.reduce((best, current) => {
                    const currentMargin = calculateMargin(current.price, current.cost);
                    const bestMargin = calculateMargin(best.price, best.cost);
                    return currentMargin > bestMargin ? current : best;
                }, this.products[0]);
                takeaways.push(`${bestProduct.name} has your highest profit margin at ${formatPercentage(calculateMargin(bestProduct.price, bestProduct.cost) / 100)}%`);
            }

            const taxRate = parseFloat(document.getElementById('taxRate')?.value) || 25;
            const taxBurden = calculateTax(totals.grossProfit, taxRate);
            takeaways.push(`Your tax burden of ${formatCurrency(taxBurden)} reduces your gross profit by ${formatPercentage(taxBurden / totals.grossProfit)}%`);
        }
        
        return `
            <div class="key-takeaways mt-3">
                <h4>Key Takeaways</h4>
                <ul>
                    ${takeaways.map(takeaway => `<li>${takeaway}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    attachEventListeners() {
        // Add product button
        const addButton = document.querySelector('.add-product-btn');
        if (addButton) {
            addButton.addEventListener('click', () => this.addProduct());
        }

        // Tax rate input
        const taxInput = document.getElementById('taxRate');
        if (taxInput) {
            taxInput.addEventListener('change', () => this.render());
        }
    }
}

// Initialize and export the tool
let businessPlanningTool; // Global instance

export function initializeBusinessPlanningTool() {
    businessPlanningTool = new BusinessPlanningTool();
    // Make it globally available for HTML event handlers
    window.businessPlanningTool = businessPlanningTool;
    businessPlanningTool.init();
}

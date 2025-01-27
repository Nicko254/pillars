// src/main.js
class ToolLoader {
    constructor() {
        this.currentTool = null;
        this.toolCache = new Map();
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(e.target.dataset.tool);
            });
        });

        // Tool cards
        document.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', () => {
                this.handleNavigation(card.dataset.tool);
            });
        });
    }

    handleNavigation(tool) {
        // Update navigation state
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.tool === tool);
        });

        // Load the appropriate tool
        this.loadTool(tool);
    }

    async loadTool(toolName) {
        const mainContent = document.querySelector('.main-content');
        const welcomeSection = document.querySelector('.welcome-section');
        const toolGrid = document.querySelector('.tool-grid');

        // Show loading state
        mainContent.innerHTML = '<div class="loading"></div>';

        try {
            let toolContent;
            
            // Check if tool is cached
            if (this.toolCache.has(toolName)) {
                toolContent = this.toolCache.get(toolName);
            } else {
                // Load tool content
                toolContent = await this.fetchToolContent(toolName);
                this.toolCache.set(toolName, toolContent);
            }

            // Update DOM
            if (toolName === 'dashboard') {
                welcomeSection.style.display = 'block';
                toolGrid.style.display = 'grid';
                mainContent.querySelector('.loading').remove();
            } else {
                welcomeSection.style.display = 'none';
                toolGrid.style.display = 'none';
                mainContent.innerHTML = toolContent;
                this.initializeToolFunctionality(toolName);
            }

        } catch (error) {
            console.error('Error loading tool:', error);
            mainContent.innerHTML = `
                <div class="card">
                    <h2>Error Loading Tool</h2>
                    <p>Sorry, there was a problem loading the tool. Please try again later.</p>
                </div>
            `;
        }
    }

    async fetchToolContent(toolName) {
        // Placeholder for actual tool content loading
        // This will be replaced with actual HTML content
        switch(toolName) {
            case 'plan':
                return this.getBusinessPlanningHTML();
            case 'forecast':
                return this.getForecastingHTML();
            case 'grow':
                return this.getGrowthToolHTML();
            default:
                return '';
        }
    }

    initializeToolFunctionality(toolName) {
        // Initialize tool-specific JavaScript
        switch(toolName) {
            case 'plan':
                this.initializeBusinessPlanning();
                break;
            case 'forecast':
                this.initializeForecasting();
                break;
            case 'grow':
                this.initializeGrowthTool();
                break;
        }
    }

    getBusinessPlanningHTML() {
        return `
            <div class="tool-content">
                <h2>Business Planning</h2>
                <div class="tax-rate-container">
                    <label for="taxRate">Tax Rate (%)</label>
                    <input type="number" id="taxRate" value="25" onchange="updateAll()">
                </div>
                <button class="button" onclick="addProduct()">Add New Product Line</button>
                <div id="products"></div>
                <div class="portfolio-summary card">
                    <!-- Portfolio summary content -->
                </div>
            </div>
        `;
    }

    getForecastingHTML() {
        return `
            <div class="tool-content">
                <div class="grid">
                    <div class="card" onclick="toggleTool('incomeStatementTool')">
                        <h2>Income Statement Forecast</h2>
                        <p>Project your company's future revenues, expenses, and profits.</p>
                    </div>
                    <div class="card" onclick="toggleTool('cashFlowTool')">
                        <h2>Cash Flow Forecast</h2>
                        <p>Predict how much money will come in and go out of your business.</p>
                    </div>
                </div>
                <div id="incomeStatementTool" class="forecast-tool"></div>
                <div id="cashFlowTool" class="forecast-tool"></div>
            </div>
        `;
    }

    getGrowthToolHTML() {
        return `
            <div class="tool-content">
                <div class="grid">
                    <div class="card" data-tool="incomeStatementActualsTool">
                        <h2>Income Statement Actuals</h2>
                        <p>Record and analyze your actual income statement data.</p>
                    </div>
                    <div class="card" data-tool="cashFlowActualsTool">
                        <h2>Cash Flow Actuals</h2>
                        <p>Track your actual cash inflows and outflows.</p>
                    </div>
                    <div class="card" data-tool="summaryTool">
                        <h2>Forecast vs Actuals Summary</h2>
                        <p>Compare your forecasts with actual results.</p>
                    </div>
                </div>
                <!-- Tool content will be loaded here -->
            </div>
        `;
    }

    // Tool initialization methods
    initializeBusinessPlanning() {
        // Initialize business planning functionality
        if (typeof initializeBusinessPlanningTool === 'function') {
            initializeBusinessPlanningTool();
        }
    }

    initializeForecasting() {
        // Initialize forecasting functionality
        if (typeof initializeForecastingTool === 'function') {
            initializeForecastingTool();
        }
    }

    initializeGrowthTool() {
        // Initialize growth tool functionality
        if (typeof initializeGrowthTool === 'function') {
            initializeGrowthTool();
        }
    }
}

// Initialize the tool loader
document.addEventListener('DOMContentLoaded', () => {
    window.toolLoader = new ToolLoader();
});

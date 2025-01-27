import { initializeBusinessPlanningTool } from './components/BusinessPlanning/index.js';

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

    fetchToolContent(toolName) {
        switch(toolName) {
            case 'plan':
                return `<div class="tool-content"></div>`;
            case 'forecast':
                return `<div class="tool-content">Forecasting Tool Coming Soon</div>`;
            case 'grow':
                return `<div class="tool-content">Growth Tool Coming Soon</div>`;
            default:
                return '';
        }
    }

    initializeToolFunctionality(toolName) {
        switch(toolName) {
            case 'plan':
                initializeBusinessPlanningTool();
                break;
            case 'forecast':
                // To be implemented
                break;
            case 'grow':
                // To be implemented
                break;
        }
    }
}

// Initialize the tool loader when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.toolLoader = new ToolLoader();
});

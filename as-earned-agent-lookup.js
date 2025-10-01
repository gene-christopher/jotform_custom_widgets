/**
 * As Earned Agent Lookup Widget V2
 * Properly integrated with JotForm Custom Widget API
 * Handles iframe isolation and form submission correctly
 */

class AsEarnedAgentLookupWidgetV2 {
    constructor() {
        this.isProcessing = false;
        this.agentCode = '';
        this.agentName = '';
        this.init();
    }

    init() {
        console.log('As Earned Agent Lookup Widget V2: Initializing...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupWidget());
        } else {
            this.setupWidget();
        }
    }

    setupWidget() {
        console.log('As Earned Agent Lookup Widget V2: Setting up widget...');
        
        // Setup event listeners for our internal fields
        this.setupEventListeners();
        
        // Setup JotForm integration
        this.setupJotFormIntegration();
    }

    setupEventListeners() {
        const agentCodeInput = document.getElementById('agentCodeInput');
        const loadingDiv = document.getElementById('loading');
        const errorDiv = document.getElementById('error');
        const successDiv = document.getElementById('success');
        
        if (agentCodeInput) {
            agentCodeInput.addEventListener('blur', (e) => {
                if (!this.isProcessing) {
                    this.lookupAgent(e.target.value);
                }
            });
            
            agentCodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !this.isProcessing) {
                    e.preventDefault();
                    this.lookupAgent(e.target.value);
                }
            });
        }
    }

    setupJotFormIntegration() {
        console.log('As Earned Agent Lookup Widget V2: Setting up JotForm integration...');
        
        if (window.JFCustomWidget) {
            console.log('As Earned Agent Lookup Widget V2: JotForm Custom Widget API available');
            
            // Listen for when the widget is ready
            JFCustomWidget.subscribe('ready', () => {
                console.log('As Earned Agent Lookup Widget V2: Widget ready');
            });
            
            // Listen for form submission
            JFCustomWidget.subscribe('submit', () => {
                console.log('As Earned Agent Lookup Widget V2: Form submit triggered');
                this.handleFormSubmit();
            });
            
            // Listen for form reset
            JFCustomWidget.subscribe('reset', () => {
                console.log('As Earned Agent Lookup Widget V2: Form reset triggered');
                this.resetWidget();
            });
            
        } else {
            console.log('As Earned Agent Lookup Widget V2: JotForm Custom Widget API not available - running in test mode');
        }
    }

    handleFormSubmit() {
        console.log('As Earned Agent Lookup Widget V2: Handling form submit');
        console.log('As Earned Agent Lookup Widget V2: Current agent code:', this.agentCode);
        console.log('As Earned Agent Lookup Widget V2: Current agent name:', this.agentName);
        
        // Send the data to JotForm using the Custom Widget API
        if (window.JFCustomWidget) {
            const submitData = {
                'as_earned_AgentCode': this.agentCode,
                'as_earned_AgentName': this.agentName
            };
            
            console.log('As Earned Agent Lookup Widget V2: Sending data to JotForm:', submitData);
            JFCustomWidget.sendSubmit(submitData);
        }
    }

    async lookupAgent(agentCode) {
        if (!agentCode || agentCode.trim() === '') {
            this.clearFields();
            return;
        }

        if (this.isProcessing) {
            console.log('As Earned Agent Lookup Widget V2: Already processing, skipping duplicate request');
            return;
        }

        this.isProcessing = true;
        this.showLoading(true);
        this.showError(false);
        this.showSuccess(false);

        console.log('As Earned Agent Lookup Widget V2: Looking up agent code:', agentCode);

        try {
            const result = await this.makeSecureApiCall(agentCode);
            
            if (result && result.success && result.data) {
                console.log('As Earned Agent Lookup Widget V2: Lookup successful:', result.data);
                this.populateFields(result.data, agentCode);
                this.showSuccess(true);
            } else {
                console.log('As Earned Agent Lookup Widget V2: No data found for agent code:', agentCode);
                this.clearFields();
                this.showError(true);
            }
        } catch (error) {
            console.error('As Earned Agent Lookup Widget V2: Lookup error:', error);
            this.clearFields();
            this.showError(true);
        } finally {
            this.isProcessing = false;
            this.showLoading(false);
        }
    }

    async makeSecureApiCall(agentCode) {
        console.log('As Earned Agent Lookup Widget V2: Making API call for agent code:', agentCode);
        
        try {
            const response = await fetch(CONFIG.proxyEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    as_earned_AgentCode: agentCode
                })
            });

            console.log('As Earned Agent Lookup Widget V2: API response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('As Earned Agent Lookup Widget V2: API error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('As Earned Agent Lookup Widget V2: API response:', result);
            
            // Wrap the result in the expected format if it doesn't have success/data structure
            if (result && !result.hasOwnProperty('success')) {
                console.log('As Earned Agent Lookup Widget V2: Wrapping response in success/data format');
                const wrappedResult = {
                    success: true,
                    data: result.data || result
                };
                console.log('As Earned Agent Lookup Widget V2: Final wrapped result:', wrappedResult);
                return wrappedResult;
            }
            
            return result;
        } catch (error) {
            console.error('As Earned Agent Lookup Widget V2: API call failed:', error);
            throw error;
        }
    }

    populateFields(agentData, agentCode) {
        console.log('As Earned Agent Lookup Widget V2: Starting to populate fields with data:', agentData);
        
        // Store the agent code
        this.agentCode = agentCode;
        
        // Try multiple possible paths for the agent name
        let agentName = null;
        
        const possiblePaths = [
            'data.as_earned_AgentName',
            'as_earned_AgentName',
            'data.agentName',
            'agentName',
            'data.name',
            'name'
        ];
        
        for (const path of possiblePaths) {
            agentName = this.getNestedValue(agentData, path);
            console.log(`As Earned Agent Lookup Widget V2: Trying path '${path}':`, agentName);
            if (agentName) {
                console.log(`As Earned Agent Lookup Widget V2: Found agent name at path '${path}':`, agentName);
                break;
            }
        }
        
        if (agentName) {
            this.agentName = agentName;
            console.log('As Earned Agent Lookup Widget V2: Setting agent name display to:', agentName);
            
            // Update the display field
            const agentNameDisplay = document.getElementById('agentNameDisplay');
            if (agentNameDisplay) {
                agentNameDisplay.value = agentName;
            }
        } else {
            console.log('As Earned Agent Lookup Widget V2: No agent name found in any expected path');
            this.clearFields();
        }
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : null;
        }, obj);
    }

    clearFields() {
        console.log('As Earned Agent Lookup Widget V2: Clearing fields');
        this.agentCode = '';
        this.agentName = '';
        
        const agentNameDisplay = document.getElementById('agentNameDisplay');
        if (agentNameDisplay) {
            agentNameDisplay.value = '';
        }
    }

    resetWidget() {
        console.log('As Earned Agent Lookup Widget V2: Resetting widget');
        this.clearFields();
        
        const agentCodeInput = document.getElementById('agentCodeInput');
        if (agentCodeInput) {
            agentCodeInput.value = '';
        }
        
        this.showError(false);
        this.showSuccess(false);
        this.showLoading(false);
    }

    showLoading(show) {
        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) {
            loadingDiv.style.display = show ? 'block' : 'none';
        }
    }

    showError(show) {
        const errorDiv = document.getElementById('error');
        if (errorDiv) {
            errorDiv.style.display = show ? 'block' : 'none';
        }
    }

    showSuccess(show) {
        const successDiv = document.getElementById('success');
        if (successDiv) {
            successDiv.style.display = show ? 'block' : 'none';
        }
    }
}

// Configuration - NO API KEYS EXPOSED
const CONFIG = {
    // Use a proxy endpoint that handles authentication server-side
    proxyEndpoint: 'https://default3bbdae4643cd41c5868fb316259734.bd.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c047d855f89d41688ffb7de54a581cee/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=KKmAhgBHOwwp0o6ck-F08gyWpiCia6Xdv-WE2MZLUns'
};

// Initialize the widget when the script loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('As Earned Agent Lookup Widget V2: DOM loaded, initializing widget...');
    window.asEarnedAgentLookupWidgetV2 = new AsEarnedAgentLookupWidgetV2();
});

// Also initialize immediately if DOM is already loaded
if (document.readyState !== 'loading') {
    console.log('As Earned Agent Lookup Widget V2: DOM already loaded, initializing widget immediately...');
    window.asEarnedAgentLookupWidgetV2 = new AsEarnedAgentLookupWidgetV2();
}

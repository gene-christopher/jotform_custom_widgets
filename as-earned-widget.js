/**
 * As Earned Agent Lookup Widget
 * Simplified version that only looks up Agent Code and returns Agent Name
 */

class AsEarnedAgentLookupWidget {
    constructor() {
        this.isProcessing = false;
        this.init();
    }

    init() {
        console.log('As Earned Agent Lookup Widget: Initializing...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        console.log('As Earned Agent Lookup Widget: Setting up event listeners...');
        
        const agentCodeField = document.querySelector('input[name="as_earned_AgentCode"]');
        
        if (agentCodeField) {
            console.log('As Earned Agent Lookup Widget: Found as_earned_AgentCode field');
            
            // Listen for blur (tab out) and Enter key
            agentCodeField.addEventListener('blur', (e) => {
                if (!this.isProcessing) {
                    this.lookupAgent(e.target.value);
                }
            });
            
            agentCodeField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !this.isProcessing) {
                    e.preventDefault();
                    this.lookupAgent(e.target.value);
                }
            });
        } else {
            console.log('As Earned Agent Lookup Widget: as_earned_AgentCode field not found');
        }
    }

    async lookupAgent(agentCode) {
        if (!agentCode || agentCode.trim() === '') {
            console.log('As Earned Agent Lookup Widget: Empty agent code, skipping lookup');
            return;
        }

        if (this.isProcessing) {
            console.log('As Earned Agent Lookup Widget: Already processing, skipping duplicate request');
            return;
        }

        this.isProcessing = true;
        console.log('As Earned Agent Lookup Widget: Looking up agent code:', agentCode);

        try {
            const result = await this.makeSecureApiCall(agentCode);
            
            if (result && result.success && result.data) {
                console.log('As Earned Agent Lookup Widget: Lookup successful:', result.data);
                this.populateFormFields(result.data);
            } else {
                console.log('As Earned Agent Lookup Widget: No data found for agent code:', agentCode);
                this.clearFields();
            }
        } catch (error) {
            console.error('As Earned Agent Lookup Widget: Lookup error:', error);
            this.clearFields();
        } finally {
            this.isProcessing = false;
        }
    }

    async makeSecureApiCall(agentCode) {
        console.log('As Earned Agent Lookup Widget: Making API call for agent code:', agentCode);
        
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

            console.log('As Earned Agent Lookup Widget: API response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('As Earned Agent Lookup Widget: API error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('As Earned Agent Lookup Widget: API response:', result);
            console.log('As Earned Agent Lookup Widget: Response structure:', JSON.stringify(result, null, 2));
            console.log('As Earned Agent Lookup Widget: Has success property:', result.hasOwnProperty('success'));
            console.log('As Earned Agent Lookup Widget: Has data property:', result.hasOwnProperty('data'));
            if (result.data) {
                console.log('As Earned Agent Lookup Widget: Data content:', JSON.stringify(result.data, null, 2));
            }
            
            // Wrap the result in the expected format if it doesn't have success/data structure
            if (result && !result.hasOwnProperty('success')) {
                console.log('As Earned Agent Lookup Widget: Wrapping response in success/data format');
                const wrappedResult = {
                    success: true,
                    data: result.data || result
                };
                console.log('As Earned Agent Lookup Widget: Final wrapped result:', wrappedResult);
                return wrappedResult;
            }
            
            return result;
        } catch (error) {
            console.error('As Earned Agent Lookup Widget: API call failed:', error);
            throw error;
        }
    }

    populateFormFields(agentData) {
        console.log('As Earned Agent Lookup Widget: Starting to populate fields with data:', agentData);
        console.log('As Earned Agent Lookup Widget: Full data structure:', JSON.stringify(agentData, null, 2));
        
        // Try multiple possible paths for the agent name
        let agentName = null;
        
        // Try different possible structures
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
            console.log(`As Earned Agent Lookup Widget: Trying path '${path}':`, agentName);
            if (agentName) {
                console.log(`As Earned Agent Lookup Widget: Found agent name at path '${path}':`, agentName);
                break;
            }
        }
        
        if (agentName) {
            console.log('As Earned Agent Lookup Widget: Found agent name:', agentName);
            this.setFieldValue(agentName);
        } else {
            console.log('As Earned Agent Lookup Widget: No agent name found in any expected path');
            console.log('As Earned Agent Lookup Widget: Available keys in data:', agentData ? Object.keys(agentData) : 'No data object');
            if (agentData && agentData.data) {
                console.log('As Earned Agent Lookup Widget: Available keys in data.data:', Object.keys(agentData.data));
            }
            this.clearFields();
        }
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : null;
        }, obj);
    }

    setFieldValue(value) {
        console.log(`As Earned Agent Lookup Widget: Looking for agent name field to set value: ${value}`);
        
        const allInputs = document.querySelectorAll('input, select, textarea');
        let targetField = null;
        
        // Look for fields that might be agent name fields (flexible matching)
        const agentNamePatterns = [
            'agentname',
            'agent_name', 
            'as_earned_agentname',
            'as_earned_agent_name',
            'agentname',
            'agent_name',
            'name',
            'fullname',
            'full_name'
        ];
        
        for (const input of allInputs) {
            if (input.name) {
                const fieldName = input.name.toLowerCase();
                
                // Check if field name contains any agent name patterns
                for (const pattern of agentNamePatterns) {
                    if (fieldName.includes(pattern)) {
                        console.log(`As Earned Agent Lookup Widget: Found potential agent name field: ${input.name}`);
                        targetField = input;
                        break;
                    }
                }
                
                if (targetField) break;
            }
        }
        
        if (targetField) {
            console.log(`As Earned Agent Lookup Widget: Setting field value for ${targetField.name} to: ${value}`);
            this.setFieldValueByType(targetField, value);
        } else {
            console.log('As Earned Agent Lookup Widget: No agent name field found. Available fields:');
            allInputs.forEach((input, index) => {
                console.log(`  ${index + 1}. Name: "${input.name}", ID: "${input.id}", Type: "${input.type}"`);
            });
        }
    }

    setFieldValueByType(field, value) {
        if (field.tagName === 'SELECT') {
            field.value = value;
            // Trigger change event for select fields
            field.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
            field.value = value;
            // Trigger input event for text fields
            field.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    clearFields() {
        console.log('As Earned Agent Lookup Widget: Clearing agent name fields');
        
        const allInputs = document.querySelectorAll('input, select, textarea');
        const agentNamePatterns = [
            'agentname',
            'agent_name', 
            'as_earned_agentname',
            'as_earned_agent_name',
            'agentname',
            'agent_name',
            'name',
            'fullname',
            'full_name'
        ];
        
        for (const input of allInputs) {
            if (input.name) {
                const fieldName = input.name.toLowerCase();
                
                // Check if field name contains any agent name patterns
                for (const pattern of agentNamePatterns) {
                    if (fieldName.includes(pattern)) {
                        console.log(`As Earned Agent Lookup Widget: Clearing field: ${input.name}`);
                        input.value = '';
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                        break;
                    }
                }
            }
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
    console.log('As Earned Agent Lookup Widget: DOM loaded, initializing widget...');
    window.asEarnedAgentLookupWidget = new AsEarnedAgentLookupWidget();
});

// Also initialize immediately if DOM is already loaded
if (document.readyState !== 'loading') {
    console.log('As Earned Agent Lookup Widget: DOM already loaded, initializing widget immediately...');
    window.asEarnedAgentLookupWidget = new AsEarnedAgentLookupWidget();
}

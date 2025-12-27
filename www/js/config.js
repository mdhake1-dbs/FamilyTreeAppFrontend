const CONFIG = {
    API_URL: 'https://familytreeapp.duckdns.org/api',
    
    APP_NAME: 'Family Tree Manager',
    VERSION: '1.0.0',
    SESSION_KEY: 'familytree_token',
    RELATION_TYPES: ['father', 'mother', 'brother', 'sister', 'husband', 'wife'],
    DEBUG: true
};

function debugLog(...args) {
    if (CONFIG.DEBUG) {
        console.log('[FamilyTree]', new Date().toISOString(), ...args);
        
        // Also show alert on device for critical errors
        if (args[0] && typeof args[0] === 'string' && args[0].toLowerCase().includes('error')) {
            if (window.cordova) {
                // Only show alerts for actual errors
                const msg = args.join(' ');
                if (msg.includes('fetch') || msg.includes('connection') || msg.includes('network')) {
                    alert('Debug: ' + msg);
                }
            }
        }
    }
}

// Test connectivity on load
document.addEventListener('DOMContentLoaded', function() {
    debugLog('Testing API connectivity...');
    fetch(CONFIG.API_URL + '/health')
        .then(r => r.json())
        .then(data => {
            debugLog('API test SUCCESS:', data);
        })
        .catch(err => {
            debugLog('API test FAILED:', err.message);
            alert('Connection test failed: ' + err.message + '\nAPI URL: ' + CONFIG.API_URL);
        });
});

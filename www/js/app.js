// Fixed toggle function with overlay
function toggleMobileMenu() {
    const nav = document.getElementById('mobileNav');
    const overlay = document.getElementById('sidebarOverlay');
    
    nav.classList.toggle('hidden');
    overlay.classList.toggle('active');
    
    // Prevent body scroll when menu is open
    if (!nav.classList.contains('hidden')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}
// Family Tree Mobile Application
let authToken = localStorage.getItem('familytree_token');
let currentUser = null;
let editingId = null;
let editingRelationshipId = null;
let editingEventId = null;

// Cordova initialization
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    debugLog('Cordova device ready');
    if (navigator.splashscreen) navigator.splashscreen.hide();
    initializeApp();
}

// Browser fallback
if (!window.cordova) {
    debugLog('Running in browser mode');
    document.addEventListener('DOMContentLoaded', initializeApp);
}

async function initializeApp() {
    setupEventListeners();
    if (authToken) {
        const ok = await checkAuth();
        ok ? (showApp(), showHome()) : showAuth();
    } else {
        showAuth();
    }
}

function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', onLoginSubmit);
    document.getElementById('registerForm').addEventListener('submit', onRegisterSubmit);
    document.getElementById('personForm').addEventListener('submit', onPersonFormSubmit);
    document.getElementById('relationshipForm').addEventListener('submit', onRelationshipFormSubmit);
    document.getElementById('eventForm').addEventListener('submit', onEventFormSubmit);
    document.getElementById('relPerson1').addEventListener('change', handleRelPersonSelectChange);
    document.getElementById('relPerson2').addEventListener('change', handleRelPersonSelectChange);
}


function switchAuthTab(tab) {
    document.getElementById('authMessage').style.display = 'none';
    const forms = {login: document.getElementById('loginForm'), register: document.getElementById('registerForm')};
    const tabs = {login: document.getElementById('tabLogin'), register: document.getElementById('tabRegister')};
    
    Object.values(forms).forEach(f => f.classList.add('hidden'));
    Object.values(tabs).forEach(t => t.classList.remove('active'));
    
    forms[tab].classList.remove('hidden');
    tabs[tab].classList.add('active');
}

async function checkAuth() {
    try {
        const r = await fetch(`${CONFIG.API_URL}/auth/me`, {
            headers: {'Authorization': `Bearer ${authToken}`}
        });
        const res = await r.json();
        if (res.success) {
            currentUser = res.user;
            return true;
        }
        authToken = null;
        localStorage.removeItem('familytree_token');
        return false;
    } catch (err) {
        debugLog('Auth check failed:', err);
        return false;
    }
}

function showAuth() {
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('appScreen').classList.add('hidden');
}

function showApp() {
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.remove('hidden');
    const userName = currentUser.full_name || currentUser.username;
    document.getElementById('mobileUserName').textContent = userName;
}

function showHome() {
    hideAllMainSections();
    document.getElementById('homePage').classList.remove('hidden');
}

function hideAllMainSections() {
    ['homePage', 'profileSection', 'personFormSection', 'peopleSection', 
     'relationshipsSection', 'eventsSection'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById('messageBox').style.display = 'none';
}

async function onLoginSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const r = await fetch(`${CONFIG.API_URL}/auth/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password})
        });
        const res = await r.json();
        
        if (res.success) {
            authToken = res.token;
            currentUser = res.user;
            localStorage.setItem('familytree_token', authToken);
            showApp();
            showHome();
        } else {
            showAuthMessage(res.error, 'error');
        }
    } catch (err) {
        showAuthMessage('Connection error: ' + err.message, 'error');
    }
}

async function onRegisterSubmit(e) {
    e.preventDefault();
    const data = {
        username: document.getElementById('regUsername').value,
        password: document.getElementById('regPassword').value,
        email: document.getElementById('regEmail').value,
        full_name: document.getElementById('regFullName').value
    };
    
    try {
        const r = await fetch(`${CONFIG.API_URL}/auth/register`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const res = await r.json();
        
        if (res.success) {
            showAuthMessage('Registration successful. Please login.', 'success');
            setTimeout(() => {
                switchAuthTab('login');
                document.getElementById('loginUsername').value = data.username;
            }, 1000);
        } else {
            showAuthMessage(res.error, 'error');
        }
    } catch (err) {
        showAuthMessage('Connection error: ' + err.message, 'error');
    }
}

async function logout() {
    try {
        await fetch(`${CONFIG.API_URL}/auth/logout`, {
            method: 'POST',
            headers: {'Authorization': `Bearer ${authToken}`}
        });
    } catch (e) {}
    
    authToken = null;
    currentUser = null;
    localStorage.removeItem('familytree_token');
    showAuth();
}

function showAuthMessage(message, type) {
    const m = document.getElementById('authMessage');
    m.textContent = message;
    m.className = 'message ' + (type === 'error' ? 'error' : 'success');
    m.style.display = 'block';
    setTimeout(() => m.style.display = 'none', 4000);
}

function showMessage(msg, type) {
    const box = document.getElementById('messageBox');
    box.textContent = msg;
    box.className = 'message ' + (type === 'error' ? 'error' : 'success');
    box.style.display = 'block';
    window.scrollTo({top: 0, behavior: 'smooth'});
    setTimeout(() => box.style.display = 'none', 4000);
}

function toggleProfile() {
    const el = document.getElementById('profileSection');
    if (el.classList.contains('hidden')) {
        document.getElementById('profileFullName').value = currentUser.full_name || '';
        document.getElementById('profileEmail').value = currentUser.email || '';
        document.getElementById('profilePassword').value = '';
        hideAllMainSections();
        el.classList.remove('hidden');
    } else {
        el.classList.add('hidden');
        showHome();
    }
}

async function saveProfile() {
    const data = {
        full_name: document.getElementById('profileFullName').value,
        email: document.getElementById('profileEmail').value,
        password: document.getElementById('profilePassword').value
    };
    const pm = document.getElementById('profileMsg');
    
    try {
        const r = await fetch(`${CONFIG.API_URL}/auth/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });
        const res = await r.json();
        
        if (res.success) {
            currentUser = res.user;
            const userName = currentUser.full_name || currentUser.username;
            document.getElementById('mobileUserName').textContent = userName;
            pm.textContent = 'Profile updated';
            pm.className = 'message success';
            pm.style.display = 'block';
            setTimeout(() => {
                pm.style.display = 'none';
                toggleProfile();
            }, 2000);
        } else {
            pm.textContent = res.error || 'Error';
            pm.className = 'message error';
            pm.style.display = 'block';
        }
    } catch (err) {
        pm.textContent = 'Connection error: ' + err.message;
        pm.className = 'message error';
        pm.style.display = 'block';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function escapeJs(str) {
    if (!str) return '';
    return String(str).replace(/'/g, "\\'");
}

// ===== PEOPLE MANAGEMENT =====
function showAddPerson() {
    hideAllMainSections();
    document.getElementById('personFormSection').classList.remove('hidden');
    document.getElementById('formTitle').textContent = 'Add New Person';
    document.getElementById('submitBtn').textContent = 'Add Person';
    resetForm();
}

function showPeople() {
    hideAllMainSections();
    document.getElementById('peopleSection').classList.remove('hidden');
    loadPeople();
}

function toggleDeathDate() {
    const status = document.getElementById('lifeStatus').value;
    const group = document.getElementById('deathDateGroup');
    if (status === 'deceased') {
        group.classList.remove('hidden');
    } else {
        group.classList.add('hidden');
        document.getElementById('deathDate').value = '';
    }
}

async function onPersonFormSubmit(e) {
    e.preventDefault();
    const status = document.getElementById('lifeStatus').value;
    
    const personData = {
        given_name: document.getElementById('givenName').value,
        family_name: document.getElementById('familyName').value,
        gender: document.getElementById('gender').value,
        birth_date: document.getElementById('birthDate').value || null,
        death_date: status === 'deceased' ? document.getElementById('deathDate').value || null : null,
        birth_place: document.getElementById('birthPlace').value,
        bio: document.getElementById('bio').value,
        relation: ''
    };
    
    const hiddenId = document.getElementById('personId').value;
    const idToUse = editingId || (hiddenId ? parseInt(hiddenId, 10) : null);
    
    if (idToUse) {
        await updatePerson(idToUse, personData);
    } else {
        await createPerson(personData);
    }
}

async function createPerson(personData) {
    try {
        const r = await fetch(`${CONFIG.API_URL}/people`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(personData)
        });
        const res = await r.json();
        
        if (res.success) {
            showMessage('Person added successfully', 'success');
            resetForm();
            showPeople();
        } else {
            showMessage('Error: ' + res.error, 'error');
        }
    } catch (err) {
        showMessage('Connection error: ' + err.message, 'error');
    }
}

async function loadPeople() {
    const container = document.getElementById('peopleList');
    container.innerHTML = '<div class="loading">Loading people...</div>';
    
    try {
        const r = await fetch(`${CONFIG.API_URL}/people`, {
            headers: {'Authorization': `Bearer ${authToken}`}
        });
        const res = await r.json();
        
        if (res.success) {
            displayPeople(res.data);
        } else {
            if (r.status === 401) logout();
            container.innerHTML = `<div class="message error">${res.error}</div>`;
        }
    } catch (err) {
        container.innerHTML = `<div class="message error">Connection error: ${err.message}</div>`;
    }
}

function displayPeople(people) {
    const container = document.getElementById('peopleList');
    
    if (!people || people.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:2rem;color:#666;">No people found. Click "Add Person" to create one.</div>';
        return;
    }
    
    let html = '';
    people.forEach(p => {
        const name = `${p.given_name} ${p.family_name}`;
        const birthDate = p.birth_date ? new Date(p.birth_date).toLocaleDateString() : 'N/A';
        
        html += `
            <div class="list-item">
                <div class="list-item-header">
                    <div class="list-item-title">${escapeHtml(name)}</div>
                </div>
                <div class="list-item-details">
                    <div><strong>Birth:</strong> ${birthDate}</div>
                    <div><strong>Place:</strong> ${escapeHtml(p.birth_place || 'N/A')}</div>
                    <div><strong>Gender:</strong> ${escapeHtml(p.gender || 'N/A')}</div>
                </div>
                <div class="list-item-actions">
                    <button class="btn-primary btn-sm" onclick="editPerson(${p.id})">Edit</button>
                    <button class="btn-delete btn-sm" onclick="deletePerson(${p.id}, '${escapeJs(name)}')">Delete</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function editPerson(id) {
    try {
        const r = await fetch(`${CONFIG.API_URL}/people/${id}`, {
            headers: {'Authorization': `Bearer ${authToken}`}
        });
        const res = await r.json();
        
        if (res.success) {
            const p = res.data;
            editingId = id;
            
            hideAllMainSections();
            document.getElementById('personFormSection').classList.remove('hidden');
            document.getElementById('formTitle').textContent = 'Edit Person';
            document.getElementById('submitBtn').textContent = 'Update Person';
            document.getElementById('personId').value = id;
            document.getElementById('givenName').value = p.given_name || '';
            document.getElementById('familyName').value = p.family_name || '';
            document.getElementById('gender').value = p.gender || '';
            document.getElementById('birthDate').value = p.birth_date ? p.birth_date.substring(0, 10) : '';
            document.getElementById('birthPlace').value = p.birth_place || '';
            document.getElementById('bio').value = p.bio || '';
            
            if (p.death_date) {
                document.getElementById('lifeStatus').value = 'deceased';
                document.getElementById('deathDate').value = p.death_date.substring(0, 10);
            } else {
                document.getElementById('lifeStatus').value = 'alive';
                document.getElementById('deathDate').value = '';
            }
            toggleDeathDate();
            window.scrollTo({top: 0, behavior: 'smooth'});
        } else {
            showMessage('Error: ' + res.error, 'error');
        }
    } catch (err) {
        showMessage('Connection error: ' + err.message, 'error');
    }
}

async function updatePerson(id, personData) {
    try {
        const r = await fetch(`${CONFIG.API_URL}/people/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(personData)
        });
        const res = await r.json();
        
        if (res.success) {
            showMessage('Person updated successfully', 'success');
            resetForm();
            showPeople();
        } else {
            showMessage('Error: ' + res.error, 'error');
        }
    } catch (err) {
        showMessage('Connection error: ' + err.message, 'error');
    }
}

async function deletePerson(id, name) {
    if (!confirm(`Delete ${name}?`)) return;
    
    try {
        const r = await fetch(`${CONFIG.API_URL}/people/${id}`, {
            method: 'DELETE',
            headers: {'Authorization': `Bearer ${authToken}`}
        });
        const res = await r.json();
        
        if (res.success) {
            showMessage('Person deleted successfully', 'success');
            loadPeople();
        } else {
            showMessage('Error: ' + res.error, 'error');
        }
    } catch (err) {
        showMessage('Connection error: ' + err.message, 'error');
    }
}

function resetForm() {
    editingId = null;
    document.getElementById('personForm').reset();
    document.getElementById('formTitle').textContent = 'Add New Person';
    document.getElementById('submitBtn').textContent = 'Add Person';
    document.getElementById('personId').value = '';
    document.getElementById('lifeStatus').value = 'alive';
    toggleDeathDate();
}

function cancelAddEdit() {
    resetForm();
    showHome();
}

// ===== RELATIONSHIPS =====
function showAddRelationship() {
    hideAllMainSections();
    document.getElementById('relationshipsSection').classList.remove('hidden');
    document.getElementById('relationshipForm').classList.remove('hidden');
    document.getElementById('relationshipsList').classList.add('hidden');
    fillRelationTypes();
    loadPeopleOptionsForRelationships();
    resetRelationshipForm();
}

function showViewRelationships() {
    hideAllMainSections();
    document.getElementById('relationshipsSection').classList.remove('hidden');
    document.getElementById('relationshipForm').classList.add('hidden');
    document.getElementById('relationshipsList').classList.remove('hidden');
    loadRelationships();
}

function fillRelationTypes() {
    const sel = document.getElementById('relType');
    sel.innerHTML = '<option value="">Select relation...</option>';
    CONFIG.RELATION_TYPES.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t.charAt(0).toUpperCase() + t.slice(1);
        sel.appendChild(opt);
    });
}

async function loadPeopleOptionsForRelationships() {
    try {
        const r = await fetch(`${CONFIG.API_URL}/people`, {
            headers: {'Authorization': `Bearer ${authToken}`}
        });
        const res = await r.json();
        
        if (!res.success) {
            showRelMessage(res.error || 'Failed to load people', 'error');
            return;
        }
        
        const people = res.data || [];
        fillPersonSelect('relPerson1', people);
        fillPersonSelect('relPerson2', people);
    } catch (err) {
        showRelMessage('Connection error: ' + err.message, 'error');
    }
}

function fillPersonSelect(selectId, people) {
    const sel = document.getElementById(selectId);
    sel.innerHTML = '<option value="">Select person...</option>';
    people.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.given_name} ${p.family_name}`;
        sel.appendChild(opt);
    });
}

function handleRelPersonSelectChange(event) {
    // Future: could add "Add new person" option here
}

async function onRelationshipFormSubmit(e) {
    e.preventDefault();
    const person1_id = parseInt(document.getElementById('relPerson1').value || '0', 10);
    const person2_id = parseInt(document.getElementById('relPerson2').value || '0', 10);
    const type = document.getElementById('relType').value;
    
    if (!person1_id || !person2_id || !type) {
        showRelMessage('All fields are required', 'error');
        return;
    }
    
    const payload = {person1_id, person2_id, type, details: ''};
    
    if (editingRelationshipId) {
        await updateRelationship(editingRelationshipId, payload);
    } else {
        await createRelationship(payload);
    }
}

async function createRelationship(payload) {
    try {
        const r = await fetch(`${CONFIG.API_URL}/relationships`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(payload)
        });
        const res = await r.json();
        
        if (res.success) {
            showRelMessage('Relationship added successfully', 'success');
            resetRelationshipForm();
            loadRelationships();
        } else {
            showRelMessage(res.error || 'Error creating relationship', 'error');
        }
    } catch (err) {
        showRelMessage('Connection error: ' + err.message, 'error');
    }
}

async function updateRelationship(id, payload) {
    try {
        const r = await fetch(`${CONFIG.API_URL}/relationships/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(payload)
        });
        const res = await r.json();
        
        if (res.success) {
            showRelMessage('Relationship updated successfully', 'success');
            resetRelationshipForm();
            loadRelationships();
        } else {
            showRelMessage(res.error || 'Error updating relationship', 'error');
        }
    } catch (err) {
        showRelMessage('Connection error: ' + err.message, 'error');
    }
}

async function loadRelationships() {
    const container = document.getElementById('relationshipsList');
    container.innerHTML = '<div class="loading">Loading relationships...</div>';
    
    try {
        const r = await fetch(`${CONFIG.API_URL}/relationships`, {
            headers: {'Authorization': `Bearer ${authToken}`}
        });
        const res = await r.json();
        
        if (!res.success) {
            container.innerHTML = `<div class="message error">${res.error || 'Error loading relationships'}</div>`;
            return;
        }
        
        displayRelationships(res.data || []);
    } catch (err) {
        container.innerHTML = `<div class="message error">Connection error: ${err.message}</div>`;
    }
}

function displayRelationships(rels) {
    const container = document.getElementById('relationshipsList');
    
    if (!rels.length) {
        container.innerHTML = '<div style="text-align:center;padding:2rem;color:#666;">No relationships found.</div>';
        return;
    }
    
    let html = '';
    rels.forEach(r => {
        const relType = (r.type || '').charAt(0).toUpperCase() + (r.type || '').slice(1);
        
        html += `
            <div class="list-item">
                <div class="list-item-header">
                    <div class="list-item-title">${escapeHtml(r.person1_name || '')}</div>
                </div>
                <div class="list-item-details">
                    <div><strong>${relType}</strong> of ${escapeHtml(r.person2_name || '')}</div>
                </div>
                <div class="list-item-actions">
                    <button class="btn-delete btn-sm" onclick="deleteRelationship(${r.id})">Delete</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function deleteRelationship(id) {
    if (!confirm('Delete this relationship?')) return;
    
    try {
        const r = await fetch(`${CONFIG.API_URL}/relationships/${id}`, {
            method: 'DELETE',
            headers: {'Authorization': `Bearer ${authToken}`}
        });
        const res = await r.json();
        
        if (res.success) {
            showRelMessage('Relationship deleted successfully', 'success');
            loadRelationships();
        } else {
            showRelMessage(res.error || 'Error deleting relationship', 'error');
        }
    } catch (err) {
        showRelMessage('Connection error: ' + err.message, 'error');
    }
}

function resetRelationshipForm() {
    editingRelationshipId = null;
    document.getElementById('relationshipForm').reset();
    document.getElementById('relationshipId').value = '';
    document.getElementById('relSubmitBtn').textContent = 'Add Relationship';
}

function showRelMessage(msg, type) {
    const box = document.getElementById('relMessage');
    box.textContent = msg;
    box.className = 'message ' + (type === 'error' ? 'error' : 'success');
    box.style.display = 'block';
    window.scrollTo({top: 0, behavior: 'smooth'});
    setTimeout(() => box.style.display = 'none', 4000);
}

// ===== EVENTS =====
function showAddEvent() {
    hideAllMainSections();
    document.getElementById('eventsSection').classList.remove('hidden');
    document.getElementById('eventForm').classList.remove('hidden');
    document.getElementById('eventsList').classList.add('hidden');
    loadPeopleOptionsForEvents();
    resetEventForm();
}

function showViewEvents() {
    hideAllMainSections();
    document.getElementById('eventsSection').classList.remove('hidden');
    document.getElementById('eventForm').classList.add('hidden');
    document.getElementById('eventsList').classList.remove('hidden');
    loadEvents();
}

async function loadPeopleOptionsForEvents() {
    try {
        const r = await fetch(`${CONFIG.API_URL}/people`, {
            headers: {'Authorization': `Bearer ${authToken}`}
        });
        const res = await r.json();
        
        if (!res.success) {
            showEventMessage(res.error || 'Failed to load people', 'error');
            return;
        }
        
        const people = res.data || [];
        const sel = document.getElementById('eventPerson');
        sel.innerHTML = '<option value="">Select person...</option>';
        people.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.given_name} ${p.family_name}`;
            sel.appendChild(opt);
        });
    } catch (err) {
        showEventMessage('Connection error: ' + err.message, 'error');
    }
}

async function onEventFormSubmit(e) {
    e.preventDefault();
    const person_id = parseInt(document.getElementById('eventPerson').value || '0', 10);
    const title = document.getElementById('eventTitle').value;
    const event_date = document.getElementById('eventDate').value || null;
    const place = document.getElementById('eventPlace').value;
    const description = document.getElementById('eventDescription').value;
    
    if (!person_id || !title) {
        showEventMessage('Person and title are required', 'error');
        return;
    }
    
    const payload = {created_by: person_id, title, event_date, place, description};
    
    if (editingEventId) {
        await updateEvent(editingEventId, payload);
    } else {
        await createEvent(payload);
    }
}

async function createEvent(payload) {
    try {
        const r = await fetch(`${CONFIG.API_URL}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(payload)
        });
        const res = await r.json();
        
        if (res.success) {
            showEventMessage('Event added successfully', 'success');
            resetEventForm();
            loadEvents();
        } else {
            showEventMessage(res.error || 'Error creating event', 'error');
        }
    } catch (err) {
        showEventMessage('Connection error: ' + err.message, 'error');
    }
}

async function updateEvent(id, payload) {
    try {
        const r = await fetch(`${CONFIG.API_URL}/events/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(payload)
        });
        const res = await r.json();
        
        if (res.success) {
            showEventMessage('Event updated successfully', 'success');
            resetEventForm();
            loadEvents();
        } else {
            showEventMessage(res.error || 'Error updating event', 'error');
        }
    } catch (err) {
        showEventMessage('Connection error: ' + err.message, 'error');
    }
}

async function loadEvents() {
    const container = document.getElementById('eventsList');
    container.innerHTML = '<div class="loading">Loading events...</div>';
    
    try {
        const r = await fetch(`${CONFIG.API_URL}/events`, {
            headers: {'Authorization': `Bearer ${authToken}`}
        });
        const res = await r.json();
        
        if (!res.success) {
            container.innerHTML = `<div class="message error">${res.error || 'Error loading events'}</div>`;
            return;
        }
        
        displayEvents(res.data || []);
    } catch (err) {
        container.innerHTML = `<div class="message error">Connection error: ${err.message}</div>`;
    }
}

function displayEvents(events) {
    const container = document.getElementById('eventsList');
    
    if (!events.length) {
        container.innerHTML = '<div style="text-align:center;padding:2rem;color:#666;">No events found.</div>';
        return;
    }
    
    let html = '';
    events.forEach(ev => {
        const dateText = ev.event_date ? new Date(ev.event_date).toLocaleDateString() : '-';
        
        html += `
            <div class="list-item">
                <div class="list-item-header">
                    <div class="list-item-title">${escapeHtml(ev.title || '')}</div>
                </div>
                <div class="list-item-details">
                    <div><strong>Person:</strong> ${escapeHtml(ev.person_name || '')}</div>
                    <div><strong>Date:</strong> ${dateText}</div>
                    ${ev.place ? `<div><strong>Place:</strong> ${escapeHtml(ev.place)}</div>` : ''}
                    ${ev.description ? `<div>${escapeHtml(ev.description)}</div>` : ''}
                </div>
                <div class="list-item-actions">
                    <button class="btn-delete btn-sm" onclick="deleteEvent(${ev.id})">Delete</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function deleteEvent(id) {
    if (!confirm('Delete this event?')) return;
    
    try {
        const r = await fetch(`${CONFIG.API_URL}/events/${id}`, {
            method: 'DELETE',
            headers: {'Authorization': `Bearer ${authToken}`}
        });
        const res = await r.json();
        
        if (res.success) {
            showEventMessage('Event deleted successfully', 'success');
            loadEvents();
        } else {
            showEventMessage(res.error || 'Error deleting event', 'error');
        }
    } catch (err) {
        showEventMessage('Connection error: ' + err.message, 'error');
    }
}

function resetEventForm() {
    editingEventId = null;
    document.getElementById('eventForm').reset();
    document.getElementById('eventId').value = '';
    document.getElementById('eventSubmitBtn').textContent = 'Add Event';
}

function showEventMessage(msg, type) {
    const box = document.getElementById('eventMessage');
    box.textContent = msg;
    box.className = 'message ' + (type === 'error' ? 'error' : 'success');
    box.style.display = 'block';
    window.scrollTo({top: 0, behavior: 'smooth'});
    setTimeout(() => box.style.display = 'none', 4000);
}

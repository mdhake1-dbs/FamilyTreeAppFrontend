// Family Tree Mobile Application - Production Ready
let authToken = localStorage.getItem('familytree_token');
let currentUser = null;
let editingId = null;
let editingRelationshipId = null;
let editingEventId = null;

// Cordova initialization
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    if (navigator.splashscreen) navigator.splashscreen.hide();
    initializeApp();
}

// Browser fallback
if (!window.cordova) {
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

// ===== CONFIRMATION MODAL =====
function showConfirmModal(message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const messageEl = document.getElementById('confirmMessage');
    const yesBtn = document.getElementById('confirmYes');
    const noBtn = document.getElementById('confirmNo');
    
    messageEl.textContent = message;
    modal.style.display = 'flex';
    
    // Remove old listeners and add new ones
    const newYesBtn = yesBtn.cloneNode(true);
    const newNoBtn = noBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
    noBtn.parentNode.replaceChild(newNoBtn, noBtn);
    
    document.getElementById('confirmYes').onclick = () => {
        modal.style.display = 'none';
        onConfirm();
    };
    
    document.getElementById('confirmNo').onclick = () => {
        modal.style.display = 'none';
    };
}

// ===== AUTH =====
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
    [
      "homePage",
      "profileSection",
      "personFormSection",
      "peopleSection",
      "relationshipsSection",
      "eventsSection",
      "personFormSectionView",
      "relationshipsSectionView",
    ].forEach((id) => {
      document.getElementById(id).classList.add("hidden");
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const res = await r.json();

        if (!res.success) {
            showAuthMessage(res.error, 'error');
            return;
        }

        authToken = res.token;
        localStorage.setItem('familytree_token', authToken);

        const meResp = await fetch(`${CONFIG.API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const meData = await meResp.json();

        if (meData.success) {
            currentUser = meData.user;
            if (currentUser.profile_photo) {
                document.getElementById('profileAvatar').src = imageUrl(currentUser.profile_photo);
            }
        }

        showApp();
        showHome();

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

// ===== PROFILE =====
function toggleProfile() {
    const el = document.getElementById('profileSection');
    if (el.classList.contains('hidden')) {
        document.getElementById('profileFullName').value = currentUser.full_name || '';
        document.getElementById('profileEmail').value = currentUser.email || '';
        document.getElementById('profilePassword').value = '';
        if (currentUser.profile_photo) {
            document.getElementById('profileAvatar').src = imageUrl(currentUser.profile_photo);
        }
        hideAllMainSections();
        el.classList.remove('hidden');
    } else {
        el.classList.add('hidden');
        showHome();
    }
}

function toggleMobileMenu() {
    const nav = document.getElementById('mobileNav');
    const overlay = document.getElementById('sidebarOverlay');
    
    nav.classList.toggle('hidden');
    overlay.classList.toggle('active');
    
    if (!nav.classList.contains('hidden')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

async function updateProfile() {
    const data = {
        full_name: document.getElementById('profileFullName').value,
        email: document.getElementById('profileEmail').value,
        password: document.getElementById('profilePassword').value || undefined
    };
    
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
            showMessage('Profile updated successfully', 'success');
            setTimeout(() => toggleProfile(), 1500);
        } else {
            showMessage(res.error || 'Error updating profile', 'error');
        }
    } catch (err) {
        showMessage('Connection error: ' + err.message, 'error');
    }
}

function imageUrl(path) {
    if (!path) return 'img/avatar.png';
    return CONFIG.API_URL.replace('/api', '') + '/' + path + '?t=' + Date.now();
}

function takePhoto(callback) {
    if (!navigator.camera) {
        alert('Camera not available');
        return;
    }
    navigator.camera.getPicture(
        uri => callback(uri),
        err => alert('Camera error'),
        {
            quality: 70,
            targetWidth: 1024,
            targetHeight: 1024,
            destinationType: Camera.DestinationType.FILE_URI,
            encodingType: Camera.EncodingType.JPEG,
            correctOrientation: true
        }
    );
}

function uploadImage(base64, endpoint, callback) {
    if (!base64 || !base64.startsWith('data:image/')) {
        console.error('uploadImage called with invalid data:', base64);
        return;
    }

    const blob = dataURItoBlob(base64);
    const formData = new FormData();
    formData.append('photo', blob, 'photo.jpg');

    fetch(CONFIG.API_URL + endpoint, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${authToken}`
        },
        body: formData
    })
    .then(res => res.json())
    .then(data => callback && callback(data))
    .catch(err => console.error('Upload failed', err));
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// ===== PEOPLE MANAGEMENT =====
function showAddPerson() {
    hideAllMainSections();
    document.getElementById('personFormSection').classList.remove('hidden');
    document.getElementById('personFormTitle').textContent = 'Add New Person';
    document.getElementById('submitBtn').textContent = 'Add Person';
    document.getElementById('deletePersonBtn').classList.add('hidden');
    
    editingId = null;
    document.getElementById('personForm').reset();
    document.getElementById('personId').value = '';
    document.getElementById('personAvatar').src = 'img/avatar.png';
    document.getElementById('deathDateGroup').classList.add('hidden');
    
    window.newPersonPhotoUri = null;
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
        birth_place: document.getElementById("birthPlace").value,

        birth_lat: document.getElementById("birthLat").value || null,
        birth_lng: document.getElementById("birthLng").value || null,
        bio: document.getElementById('bio').value,
        relation: ''
    };
    
    if (editingId) {
        await updatePerson(editingId, personData);
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
            const newPersonId = res.id;
            
            if (window.newPersonPhotoUri) {
                uploadImage(window.newPersonPhotoUri, `/people/${newPersonId}/photo`, (photoRes) => {
                    showMessage('Person added with photo', 'success');
                    resetPersonForm();
                    showPeople();
                });
            } else {
                showMessage('Person added successfully', 'success');
                resetPersonForm();
                showPeople();
            }
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
    container.innerHTML = '';

    if (!people || people.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👤</div>
                <h3>No Family Members</h3>
                <p>Start by adding your first family member</p>
                <button onclick="showAddPerson()" class="btn-primary">
                    Add First Person
                </button>
            </div>
        `;
        return;
    }

    people.forEach(p => {
      const birthDate = p.birth_date
        ? new Date(p.birth_date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "Birth date not set";

      const card = document.createElement("div");
      card.className = "person-card";
      card.innerHTML = `
            <div class="person-avatar">
                <img src="${imageUrl(p.photo)}" 
                     alt="${escapeHtml(p.given_name)}"
                     onerror="this.src='img/avatar.png'"
                     class="person-avatar-img">
            </div>
            <div class="person-info">
                <h3 class="person-name">
                    ${escapeHtml(p.given_name)} ${escapeHtml(p.family_name)}
                </h3>
                <p class="person-birth">${birthDate}</p>
                <div class="person-meta">
                    <span class="person-gender">${
                      p.gender || "Not specified"
                    }</span>
                    ${
                      p.death_date
                        ? '<span class="person-status deceased">Deceased</span>'
                        : '<span class="person-status alive">Alive</span>'
                    }
                </div>
            </div>
            <div class="person-actions">
                <button class="btn-icon" onclick="event.stopPropagation(); viewPerson(${
                  p
                })" title="View">👁</button>
            </div>
        `;

      // card.onclick = () => editPerson(p.id);
      card.onclick = () => viewPerson(p);
      container.appendChild(card);
    });
}
async function viewPerson(p){
    console.log(p);
    
    const container = document.getElementById("personFormSectionView");
    document.getElementById("peopleSection").classList.add("hidden");
    container.classList.remove("hidden");
   container.innerHTML = "";
 

     const item = document.createElement("div");
     item.className = "person-card";
     item.innerHTML = `
      <div class="person-avatar">
                <img src="${imageUrl(p.photo)}" 
                     alt="${escapeHtml(p.given_name)}"
                     onerror="this.src='img/avatar.png'"
                     class="person-avatar-img">
            </div>
            <div class="person-info" style="flex: 1;">
                <h3 class="person-name">${escapeHtml(
                  p.given_name || ""
                )} ${escapeHtml(p.family_name || "")} - ${escapeHtml(
       p.gender || ""
     )}</h3>
 ${
   p.birth_date &&
   `<p class="person-birth">Birth date : ${escapeHtml(p.birth_date)}</p>`
 }
 ${
   p.death_date
     ? `<p class="person-birth">Death date : ${escapeHtml(
         p.death_date || ""
       )}</p>`
     : ""
 }

                ${
                  p.birth_place
                    ? `<p class="person-birth" style="margin-top: 0.25rem;">Birth place 📍: ${escapeHtml(
                        p.birth_place
                      )}</p>`
                    : ""
                }
                ${
                  p.bio
                    ? `<p class="person-birth" style="margin-top: 0.25rem; font-size: 0.85rem;">About <strong>${
                        p.given_name
                      }</strong> : ${escapeHtml(p.bio)}</p>`
                    : ""
                }
            </div>
            <div class="person-actions">
                <button class="btn-icon" onclick=editPerson(${
                  p.id
                }) title="Edit">📝</button>
                
            </div>
        `;
     container.appendChild(item);
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
            document.getElementById('personFormTitle').textContent = 'Edit Person';
            document.getElementById('submitBtn').textContent = 'Update Person';
            document.getElementById('deletePersonBtn').classList.remove('hidden');
            
            document.getElementById('personId').value = p.id;
            document.getElementById('givenName').value = p.given_name || '';
            document.getElementById('familyName').value = p.family_name || '';
            document.getElementById('gender').value = p.gender || '';
            document.getElementById('lifeStatus').value = p.death_date ? 'deceased' : 'alive';
            document.getElementById('birthDate').value = p.birth_date ? p.birth_date.substring(0, 10) : '';
            document.getElementById('deathDate').value = p.death_date ? p.death_date.substring(0, 10) : '';
            document.getElementById('birthPlace').value = p.birth_place || '';
            document.getElementById('bio').value = p.bio || '';
            document.getElementById('personAvatar').src = imageUrl(p.photo);
            
            if (p.death_date) {
                document.getElementById('deathDateGroup').classList.remove('hidden');
            } else {
                document.getElementById('deathDateGroup').classList.add('hidden');
            }
            
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
            if (window.newPersonPhotoUri) {
                uploadImage(window.newPersonPhotoUri, `/people/${id}/photo`, () => {
                    showMessage('Person updated with photo', 'success');
                    resetPersonForm();
                    showPeople();
                });
            } else {
                showMessage('Person updated successfully', 'success');
                resetPersonForm();
                showPeople();
            }
        } else {
            showMessage('Error: ' + res.error, 'error');
        }
    } catch (err) {
        showMessage('Connection error: ' + err.message, 'error');
    }
}

async function deletePerson(id) {
    showConfirmModal('Delete this person? This will also delete all their relationships and events.', async () => {
        try {
            const r = await fetch(`${CONFIG.API_URL}/people/${id}`, {
                method: 'DELETE',
                headers: {'Authorization': `Bearer ${authToken}`}
            });
            const res = await r.json();
            
            if (res.success) {
                showMessage('Person deleted successfully', 'success');
                resetPersonForm();
                showPeople();
            } else {
                showMessage('Error: ' + res.error, 'error');
            }
        } catch (err) {
            showMessage('Connection error: ' + err.message, 'error');
        }
    });
}

function resetPersonForm() {
    editingId = null;
    window.newPersonPhotoUri = null;
    document.getElementById('personForm').reset();
    document.getElementById('personId').value = '';
    document.getElementById('personAvatar').src = 'img/avatar.png';
}

function cancelAddEdit() {
    resetPersonForm();
    showHome();
}

// ===== RELATIONSHIPS =====
function showAddRelationship() {
    hideAllMainSections();
    document.getElementById('relationshipsSection').classList.remove('hidden');
    document.getElementById('relationshipFormTitle').textContent = 'Add Relationship';
    document.getElementById('relSubmitBtn').textContent = 'Add Relationship';
    
    // Show form, hide list
    document.getElementById('relationshipForm').style.display = 'block';
    document.getElementById('relationshipsList').style.display = 'none';
    
    fillRelationTypes();
    loadPeopleOptionsForRelationships();
    resetRelationshipForm();
}

function showViewRelationships() {
    hideAllMainSections();
    document.getElementById('relationshipsSection').classList.remove('hidden');
    document.getElementById("relationshipFormTitle").innerText="List Relationships";
    // Hide form, show list
    document.getElementById('relationshipForm').style.display = 'none';
    document.getElementById('relationshipsList').style.display = 'block';
    
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

function handleRelPersonSelectChange(event) {
    const person1Select = document.getElementById('relPerson1');
    const person2Select = document.getElementById('relPerson2');
    const person1Id = person1Select.value;
    const person2Id = person2Select.value;
    
    if (person1Id && person2Id && person1Id === person2Id) {
        showRelMessage('A person cannot have a relationship with themselves', 'error');
        if (event.target.id === 'relPerson1') {
            person2Select.value = '';
        } else {
            person1Select.value = '';
        }
    }
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
        const person1Select = document.getElementById('relPerson1');
        const person2Select = document.getElementById('relPerson2');
        
        person1Select.innerHTML = '<option value="">Select person...</option>';
        people.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.given_name} ${p.family_name}`;
            person1Select.appendChild(opt);
        });
        
        person2Select.innerHTML = '<option value="">Select person...</option>';
        people.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.given_name} ${p.family_name}`;
            person2Select.appendChild(opt);
        });
    } catch (err) {
        showRelMessage('Connection error: ' + err.message, 'error');
    }
}

function showRelMessage(msg, type) {
    const box = document.getElementById('relMessage');
    box.textContent = msg;
    box.className = 'message ' + (type === 'error' ? 'error' : 'success');
    box.style.display = 'block';
    window.scrollTo({top: 0, behavior: 'smooth'});
    setTimeout(() => box.style.display = 'none', 4000);
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
            setTimeout(() => showViewRelationships(), 1000);
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
            setTimeout(() => showViewRelationships(), 1000);
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
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔗</div>
                <h3>No Relationships</h3>
                <p>Add relationships between family members</p>
                <button onclick="showAddRelationship()" class="btn-primary">Add Relationship</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    rels.forEach(r => {
        const relType = (r.type || '').charAt(0).toUpperCase() + (r.type || '').slice(1);
        
        const item = document.createElement('div');
        item.className = 'person-card';
        item.innerHTML = `
            <div class="person-info" style="flex: 1;">
                <h3 class="person-name">${escapeHtml(r.person1_name || '')}</h3>
                <p class="person-birth"><strong>${relType}</strong> of ${escapeHtml(r.person2_name || '')}</p>
            </div>
            <div class="person-actions">
                <button class="btn-icon" onclick="editRelationship(${r.id})" title="Edit">📝</button>
                <button class="btn-icon" onclick="deleteRelationship(${r.id})" title="Delete" style="color: var(--danger);">🗑️</button>
            </div>
        `;
        container.appendChild(item);
    });
}

async function editRelationship(id) {
    try {
        const r = await fetch(`${CONFIG.API_URL}/relationships/${id}`, {
            headers: {'Authorization': `Bearer ${authToken}`}
        });
        const res = await r.json();
        
        if (res.success) {
            const rel = res.data;
            editingRelationshipId = id;
            
            hideAllMainSections();
            document.getElementById('relationshipsSection').classList.remove('hidden');
            document.getElementById('relationshipFormTitle').textContent = 'Edit Relationship';
            document.getElementById('relSubmitBtn').textContent = 'Update Relationship';
            
            document.getElementById('relationshipForm').style.display = 'block';
            document.getElementById('relationshipsList').style.display = 'none';
            
            await loadPeopleOptionsForRelationships();
            await fillRelationTypes();
            
            document.getElementById('relationshipId').value = rel.id;
            document.getElementById('relPerson1').value = rel.person1_id;
            document.getElementById('relPerson2').value = rel.person2_id;
            document.getElementById('relType').value = rel.type;
            
            window.scrollTo({top: 0, behavior: 'smooth'});
        } else {
            showRelMessage('Error: ' + res.error, 'error');
        }
    } catch (err) {
        showRelMessage('Connection error: ' + err.message, 'error');
    }
}

async function deleteRelationship(id) {
    showConfirmModal('Delete this relationship?', async () => {
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
    });
}

function resetRelationshipForm() {
    editingRelationshipId = null;
    document.getElementById('relationshipForm').reset();
    document.getElementById('relationshipId').value = '';
    document.getElementById('relSubmitBtn').textContent = 'Add Relationship';
}

// ===== EVENTS =====
function showAddEvent() {
    hideAllMainSections();
    document.getElementById('eventsSection').classList.remove('hidden');
    document.getElementById('eventFormTitle').textContent = 'Add Event';
    document.getElementById('eventSubmitBtn').textContent = 'Add Event';
    
    document.getElementById('eventForm').style.display = 'block';
    document.getElementById('eventsList').style.display = 'none';
    
    loadPeopleOptionsForEvents();
    resetEventForm();
}

function showViewEvents() {
    hideAllMainSections();
    document.getElementById('eventsSection').classList.remove('hidden');
    
    document.getElementById('eventForm').style.display = 'none';
    document.getElementById('eventsList').style.display = 'block';
    
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
    
    const payload = {created_by: person_id, title, event_date, place: document.getElementById("eventPlace").value,

  place_lat: document.getElementById("eventLat").value || null,
  place_lng: document.getElementById("eventLng").value || null, description
  };
    
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
            setTimeout(() => showViewEvents(), 1000);
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
            setTimeout(() => showViewEvents(), 1000);
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
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <h3>No Events</h3>
                <p>Add family events and milestones</p>
                <button onclick="showAddEvent()" class="btn-primary">Add Event</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    events.forEach(ev => {
        const dateText = ev.event_date ? new Date(ev.event_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'Date not set';
        
        const item = document.createElement('div');
        item.className = 'person-card';
        item.innerHTML = `
            <div class="person-info" style="flex: 1;">
                <h3 class="person-name">${escapeHtml(ev.title || '')}</h3>
                <p class="person-birth">${escapeHtml(ev.person_name || '')} • ${dateText}</p>
                ${ev.place ? `<p class="person-birth" style="margin-top: 0.25rem;">📍 ${escapeHtml(ev.place)}</p>` : ''}
                ${ev.description ? `<p class="person-birth" style="margin-top: 0.25rem; font-size: 0.85rem;">${escapeHtml(ev.description)}</p>` : ''}
            </div>
            <div class="person-actions">
                <button class="btn-icon" onclick="editEvent(${ev.id})" title="Edit">📝</button>
                <button class="btn-icon" onclick="deleteEvent(${ev.id})" title="Delete" style="color: var(--danger);">🗑️</button>
            </div>
        `;
        container.appendChild(item);
    });
}

async function editEvent(id) {
    console.log(id);
    try {
        const r = await fetch(`${CONFIG.API_URL}/events/${id}`, {
            headers: {'Authorization': `Bearer ${authToken}`}
        });
        
        const res = await r.json();
        console.log("res",res);
        
        if (res.success) {
            const ev = res.data;
            editingEventId = id;
            
            hideAllMainSections();
            document.getElementById('eventsSection').classList.remove('hidden');
            document.getElementById('eventFormTitle').textContent = 'Edit Event';
            document.getElementById('eventSubmitBtn').textContent = 'Update Event';
            
            document.getElementById('eventForm').style.display = 'block';
            document.getElementById('eventsList').style.display = 'none';
            
            await loadPeopleOptionsForEvents();
            
            document.getElementById('eventId').value = ev.id;
            document.getElementById('eventPerson').value = ev.created_by;
            document.getElementById('eventTitle').value = ev.title || '';
            document.getElementById('eventDate').value = ev.event_date ? ev.event_date.substring(0, 10) : '';
            document.getElementById('eventPlace').value = ev.place || '';
            document.getElementById('eventDescription').value = ev.description || '';
            
            window.scrollTo({top: 0, behavior: 'smooth'});
        } else {
            showEventMessage('Error: ' + res.error, 'error');
        }
    } catch (err) {
        showEventMessage('Connection error: ' + err.message, 'error');
    }
}

async function deleteEvent(id) {
    showConfirmModal('Delete this event?', async () => {
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
    });
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

// ===== UTILITY =====
function dataURItoBlob(data) {
    if (data instanceof Blob) {
        return data;
    }

    if (!data.startsWith('data:')) {
        throw new Error('Expected Base64 data URL, got: ' + data.substring(0, 30));
    }

    const parts = data.split(',');
    const mime = parts[0].match(/:(.*?);/)[1];
    const byteString = atob(parts[1]);

    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mime });
}

function getCurrentLocation(successCb, errorCb) {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      successCb({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      });
    },
    err => {
      alert("Unable to fetch location");
      if (errorCb) errorCb(err);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000
    }
  );
}

//Marked for Delete in next version
/*
async function reverseGeocode(lat, lng) {
    console.log(lat,lng);
    
  const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=73b098a774db45189daa3c4202618e68`;
  const r = await fetch(url);
  const j = await r.json();
  return (
    `${j.features[0].properties.county} | ${j.features[0].properties.city} | ${j.features[0].properties.country}` ||
    `${lat}, ${lng}`
  );
}
*/

//Old Version for Safety
/*
async function fillBirthPlaceFromGPS() {
  getCurrentLocation(async ({ lat, lng }) => {
    const address = await reverseGeocode(lat, lng);

    document.getElementById("birthPlace").value = address;
    document.getElementById("birthLat").value = lat;
    document.getElementById("birthLng").value = lng;
  });
}
*/

function fillBirthPlaceFromGPS() {
  getCurrentLocation(({ lat, lng }) => {
    const digipin = encodeDIGIPIN(lat, lng);

    const latEl = document.getElementById("birthLat");
    const lngEl = document.getElementById("birthLng");
    const placeEl = document.getElementById("birthPlace");
    const dpEl = document.getElementById("birthDigipin");

    if (latEl) latEl.value = lat;
    if (lngEl) lngEl.value = lng;
    if (placeEl) placeEl.value = `DIGIPIN: ${digipin}`;
    if (dpEl) dpEl.value = digipin;
    
  });
}

//Old Function
/*
async function fillEventPlaceFromGPS() {
  getCurrentLocation(async ({ lat, lng }) => {
    const address = await reverseGeocode(lat, lng);

    document.getElementById("eventPlace").value = address;
    document.getElementById("eventLat").value = lat;
    document.getElementById("eventLng").value = lng;
  });
}
*/

function fillEventPlaceFromGPS() {
  getCurrentLocation(({ lat, lng }) => {
    const digipin = encodeDIGIPIN(lat, lng);
    
    const latEl = document.getElementById("eventLat");
    const lngEl = document.getElementById("eventLng");
    const placeEl = document.getElementById("eventPlace");
    const dpEl = document.getElementById("eventDigipin");

    if (latEl) latEl.value = lat;
    if (lngEl) lngEl.value = lng;
    if (placeEl) placeEl.value = `DIGIPIN: ${digipin}`;
    if (dpEl) dpEl.value = digipin;
    
  });
}


/* New Updates for Galery Picker */

function pickImage(options, callback) {
    if (!navigator.camera) {
        alert('Camera plugin not available');
        return;
    }

    const getImage = (sourceType) => {
        navigator.camera.getPicture(
            uri => callback(uri),
            err => {
                if (err !== 'No Image Selected') {
                    alert('Image error: ' + err);
                }
            },
            {
                quality: options.quality || 70,
                targetWidth: options.targetWidth || 1024,
                targetHeight: options.targetHeight || 1024,
                destinationType: Camera.DestinationType.FILE_URI,
                sourceType: sourceType,
                encodingType: Camera.EncodingType.JPEG,
                correctOrientation: true
            }
        );
    };

    // Ask user Camera or Gallery
    if (navigator.notification) {
        navigator.notification.confirm(
            'Choose image source',
            btn => {
                if (btn === 1) getImage(Camera.PictureSourceType.CAMERA);
                if (btn === 2) getImage(Camera.PictureSourceType.PHOTOLIBRARY);
            },
            'Photo',
            ['Camera', 'Gallery']
        );
    } else {
        // Browser fallback
        getImage(Camera.PictureSourceType.PHOTOLIBRARY);
    }
}

function fileUriToBase64(fileUri, callback) {
    window.resolveLocalFileSystemURL(fileUri, entry => {
        entry.file(file => {
            const reader = new FileReader();
            reader.onloadend = () => callback(reader.result);
            reader.readAsDataURL(file);
        });
    });
}

function changeProfilePhoto() {
    pickImage({}, imageURI => {
        fileUriToBase64(imageURI, base64 => {
            document.getElementById('profileAvatar').src = base64;

            uploadImage(base64, '/users/profile-photo', res => {
                console.log('Profile photo updated', res);
            });
        });
    });
}

function changePersonPhoto() {
    pickImage({}, imageURI => {
        fileUriToBase64(imageURI, base64 => {
            window.newPersonPhotoUri = base64;
            document.getElementById('personAvatar').src = base64;
        });
    });
}

/*Update for Geolocation Plugin */

const DIGIPIN_CHARS = "23456789CFGHJMPQRVWX";

function encodeDIGIPIN(lat, lng, precision = 10) {
  let minLat = -90, maxLat = 90;
  let minLng = -180, maxLng = 180;
  let pin = "";
  let even = true;

  for (let i = 0; i < precision; i++) {
    if (even) {
      const mid = (minLng + maxLng) / 2;
      if (lng >= mid) {
        pin += DIGIPIN_CHARS[1];
        minLng = mid;
      } else {
        pin += DIGIPIN_CHARS[0];
        maxLng = mid;
      }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat >= mid) {
        pin += DIGIPIN_CHARS[1];
        minLat = mid;
      } else {
        pin += DIGIPIN_CHARS[0];
        maxLat = mid;
      }
    }
    even = !even;
  }

  return pin;
}

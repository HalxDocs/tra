// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDMNC-oVXg6eCxirQgBIaIAzJijUgBLeP4",
  authDomain: "jw-ministry-tracker.firebaseapp.com",
  projectId: "jw-ministry-tracker",
  storageBucket: "jw-ministry-tracker.firebasestorage.app",
  messagingSenderId: "920829084379",
  appId: "1:920829084379:web:afce3269d46113c398c2fe",
  measurementId: "G-RM916N5WTX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Application State
let currentUser = null;
let currentSection = 'contacts';
let isOnline = navigator.onLine;
let deferredPrompt;

// Data Storage Classes
class DataManager {
    constructor() {
        this.contacts = JSON.parse(localStorage.getItem('jw_contacts') || '[]');
        this.pioneerRecords = JSON.parse(localStorage.getItem('jw_pioneer_records') || '[]');
        this.publisherRecords = JSON.parse(localStorage.getItem('jw_publisher_records') || '[]');
    }

    saveToLocal() {
        localStorage.setItem('jw_contacts', JSON.stringify(this.contacts));
        localStorage.setItem('jw_pioneer_records', JSON.stringify(this.pioneerRecords));
        localStorage.setItem('jw_publisher_records', JSON.stringify(this.publisherRecords));
    }

    // Contacts Management
    addContact(contact) {
        contact.id = Date.now().toString();
        contact.createdAt = new Date().toISOString();
        this.contacts.push(contact);
        this.saveToLocal();
        if (isOnline && currentUser) {
            this.syncContactToFirebase(contact);
        }
        return contact;
    }

    updateContact(id, updatedContact) {
        const index = this.contacts.findIndex(c => c.id === id);
        if (index !== -1) {
            this.contacts[index] = { ...this.contacts[index], ...updatedContact };
            this.saveToLocal();
            if (isOnline && currentUser) {
                this.syncContactToFirebase(this.contacts[index]);
            }
        }
    }

    deleteContact(id) {
        this.contacts = this.contacts.filter(c => c.id !== id);
        this.saveToLocal();
        if (isOnline && currentUser) {
            db.collection('users').doc(currentUser.uid).collection('contacts').doc(id).delete();
        }
    }

    getContacts(searchTerm = '') {
        if (!searchTerm) return this.contacts;
        return this.contacts.filter(contact =>
            contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.address.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Pioneer Records Management
    addPioneerRecord(record) {
        record.id = Date.now().toString();
        record.createdAt = new Date().toISOString();
        this.pioneerRecords.push(record);
        this.saveToLocal();
        if (isOnline && currentUser) {
            this.syncPioneerRecordToFirebase(record);
        }
        return record;
    }

    updatePioneerRecord(id, updatedRecord) {
        const index = this.pioneerRecords.findIndex(r => r.id === id);
        if (index !== -1) {
            this.pioneerRecords[index] = { ...this.pioneerRecords[index], ...updatedRecord };
            this.saveToLocal();
            if (isOnline && currentUser) {
                this.syncPioneerRecordToFirebase(this.pioneerRecords[index]);
            }
        }
    }

    deletePioneerRecord(id) {
        this.pioneerRecords = this.pioneerRecords.filter(r => r.id !== id);
        this.saveToLocal();
        if (isOnline && currentUser) {
            db.collection('users').doc(currentUser.uid).collection('pioneerRecords').doc(id).delete();
        }
    }

    getPioneerRecords(searchTerm = '') {
        if (!searchTerm) return this.pioneerRecords;
        return this.pioneerRecords.filter(record =>
            record.date.includes(searchTerm) ||
            (record.notes && record.notes.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }

    // Publisher Records Management
    addPublisherRecord(record) {
        record.id = Date.now().toString();
        record.createdAt = new Date().toISOString();
        this.publisherRecords.push(record);
        this.saveToLocal();
        if (isOnline && currentUser) {
            this.syncPublisherRecordToFirebase(record);
        }
        return record;
    }

    updatePublisherRecord(id, updatedRecord) {
        const index = this.publisherRecords.findIndex(r => r.id === id);
        if (index !== -1) {
            this.publisherRecords[index] = { ...this.publisherRecords[index], ...updatedRecord };
            this.saveToLocal();
            if (isOnline && currentUser) {
                this.syncPublisherRecordToFirebase(this.publisherRecords[index]);
            }
        }
    }

    deletePublisherRecord(id) {
        this.publisherRecords = this.publisherRecords.filter(r => r.id !== id);
        this.saveToLocal();
        if (isOnline && currentUser) {
            db.collection('users').doc(currentUser.uid).collection('publisherRecords').doc(id).delete();
        }
    }

    getPublisherRecords(searchTerm = '') {
        if (!searchTerm) return this.publisherRecords;
        return this.publisherRecords.filter(record =>
            record.date.includes(searchTerm) ||
            (record.notes && record.notes.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }

    // Firebase Sync Methods
    async syncContactToFirebase(contact) {
        try {
            await db.collection('users').doc(currentUser.uid).collection('contacts').doc(contact.id).set(contact);
        } catch (error) {
            console.error('Error syncing contact:', error);
        }
    }

    async syncPioneerRecordToFirebase(record) {
        try {
            await db.collection('users').doc(currentUser.uid).collection('pioneerRecords').doc(record.id).set(record);
        } catch (error) {
            console.error('Error syncing pioneer record:', error);
        }
    }

    async syncPublisherRecordToFirebase(record) {
        try {
            await db.collection('users').doc(currentUser.uid).collection('publisherRecords').doc(record.id).set(record);
        } catch (error) {
            console.error('Error syncing publisher record:', error);
        }
    }

    // Statistics
    getPioneerStats(month = null, year = null) {
        let records = this.pioneerRecords;
        
        if (month && year) {
            records = records.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate.getMonth() === month && recordDate.getFullYear() === year;
            });
        }

        const totalHours = records.reduce((sum, record) => {
            const hours = parseFloat(record.hours || 0);
            const minutes = parseFloat(record.minutes || 0);
            return sum + hours + (minutes / 60);
        }, 0);

        const totalStudies = records.reduce((sum, record) => sum + parseInt(record.studies || 0), 0);
        const totalReturnVisits = records.reduce((sum, record) => sum + parseInt(record.returnVisits || 0), 0);

        return {
            totalHours: Math.round(totalHours * 100) / 100,
            totalStudies,
            totalReturnVisits,
            recordCount: records.length
        };
    }

    getPublisherStats(month = null, year = null) {
        let records = this.publisherRecords;
        
        if (month && year) {
            records = records.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate.getMonth() === month && recordDate.getFullYear() === year;
            });
        }

        const totalStudies = records.reduce((sum, record) => sum + parseInt(record.studies || 0), 0);
        const participatedDays = records.filter(record => record.participated === 'yes').length;

        return {
            totalStudies,
            participatedDays,
            recordCount: records.length
        };
    }
}

// Initialize Data Manager
const dataManager = new DataManager();

// Authentication Functions
class AuthManager {
    static async signUp(email, password) {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async signIn(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await auth.signInWithPopup(provider);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async signOut() {
        try {
            await auth.signOut();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async continueAsGuest() {
        try {
            const result = await auth.signInAnonymously();
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// UI Management
class UIManager {
    static showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('hidden');
        });

        // Show selected section
        document.getElementById(`${sectionName}-section`).classList.remove('hidden');

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        currentSection = sectionName;
        this.refreshCurrentSection();
    }

    static refreshCurrentSection() {
        switch (currentSection) {
            case 'contacts':
                this.renderContacts();
                break;
            case 'pioneer':
                this.renderPioneerRecords();
                break;
            case 'publisher':
                this.renderPublisherRecords();
                break;
        }
    }

    static showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    }

    static hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
        // Reset forms
        const form = document.querySelector(`#${modalId} form`);
        if (form) form.reset();
    }

    static showMessage(message, type = 'info') {
        const messageEl = document.getElementById('auth-message');
        messageEl.textContent = message;
        messageEl.className = `auth-message ${type}`;
        messageEl.style.display = 'block';
        
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }

    static renderContacts(searchTerm = '') {
        const contactsList = document.getElementById('contacts-list');
        const contacts = dataManager.getContacts(searchTerm);

        if (contacts.length === 0) {
            contactsList.innerHTML = '<div class="empty-state">No contacts found. Add your first contact!</div>';
            return;
        }

        contactsList.innerHTML = contacts.map(contact => `
            <div class="contact-item" data-id="${contact.id}">
                <div class="contact-info">
                    <h3 class="contact-name">${contact.name}</h3>
                    <p class="contact-details">
                        ${contact.phone ? `📞 ${contact.phone}` : ''}
                        ${contact.address ? `📍 ${contact.address}` : ''}
                    </p>
                    ${contact.publication ? `<p class="contact-publication">📖 ${contact.publication}</p>` : ''}
                    ${contact.date ? `<p class="contact-return-visit">🗓 Return Visit: ${contact.date} ${contact.time || ''}</p>` : ''}
                    <p class="contact-status status-${contact.status || 'pending'}">${this.getStatusText(contact.status)}</p>
                    ${contact.notes ? `<p class="contact-notes">${contact.notes}</p>` : ''}
                </div>
                <div class="contact-actions">
                    <button class="edit-btn" onclick="editContact('${contact.id}')">✏️</button>
                    <button class="delete-btn" onclick="deleteContact('${contact.id}')">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    static renderPioneerRecords(searchTerm = '') {
        const pioneerList = document.getElementById('pioneer-list');
        const records = dataManager.getPioneerRecords(searchTerm);

        if (records.length === 0) {
            pioneerList.innerHTML = '<div class="empty-state">No pioneer records found. Add your first record!</div>';
            return;
        }

        pioneerList.innerHTML = records.map(record => `
            <div class="record-item" data-id="${record.id}">
                <div class="record-info">
                    <h3 class="record-date">${new Date(record.date).toLocaleDateString()}</h3>
                    <div class="record-details">
                        <span class="record-hours">⏰ ${record.hours}h ${record.minutes || 0}m</span>
                        <span class="record-studies">📚 ${record.studies || 0} studies</span>
                        <span class="record-visits">🏠 ${record.returnVisits || 0} return visits</span>
                    </div>
                    ${record.notes ? `<p class="record-notes">${record.notes}</p>` : ''}
                </div>
                <div class="record-actions">
                    <button class="edit-btn" onclick="editPioneerRecord('${record.id}')">✏️</button>
                    <button class="delete-btn" onclick="deletePioneerRecord('${record.id}')">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    static renderPublisherRecords(searchTerm = '') {
        const publisherList = document.getElementById('publisher-list');
        const records = dataManager.getPublisherRecords(searchTerm);

        if (records.length === 0) {
            publisherList.innerHTML = '<div class="empty-state">No publisher records found. Add your first record!</div>';
            return;
        }

        publisherList.innerHTML = records.map(record => `
            <div class="record-item" data-id="${record.id}">
                <div class="record-info">
                    <h3 class="record-date">${new Date(record.date).toLocaleDateString()}</h3>
                    <div class="record-details">
                        <span class="record-studies">📚 ${record.studies || 0} studies</span>
                        <span class="record-participation ${record.participated === 'yes' ? 'participated' : 'not-participated'}">
                            ${record.participated === 'yes' ? '✅ Participated' : '❌ Did not participate'}
                        </span>
                    </div>
                    ${record.notes ? `<p class="record-notes">${record.notes}</p>` : ''}
                </div>
                <div class="record-actions">
                    <button class="edit-btn" onclick="editPublisherRecord('${record.id}')">✏️</button>
                    <button class="delete-btn" onclick="deletePublisherRecord('${record.id}')">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    static getStatusText(status) {
        switch (status) {
            case 'completed': return '✅ Completed';
            case 'not-interested': return '❌ Not Interested';
            default: return '⏳ Pending';
        }
    }

    static renderStats(type, stats) {
        const container = document.getElementById('stats-container');
        
        if (type === 'pioneer') {
            container.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>Total Hours</h3>
                        <p class="stat-value">${stats.totalHours}</p>
                    </div>
                    <div class="stat-card">
                        <h3>Bible Studies</h3>
                        <p class="stat-value">${stats.totalStudies}</p>
                    </div>
                    <div class="stat-card">
                        <h3>Return Visits</h3>
                        <p class="stat-value">${stats.totalReturnVisits}</p>
                    </div>
                    <div class="stat-card">
                        <h3>Days Recorded</h3>
                        <p class="stat-value">${stats.recordCount}</p>
                    </div>
                </div>
            `;
        } else if (type === 'publisher') {
            container.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>Bible Studies</h3>
                        <p class="stat-value">${stats.totalStudies}</p>
                    </div>
                    <div class="stat-card">
                        <h3>Days Participated</h3>
                        <p class="stat-value">${stats.participatedDays}</p>
                    </div>
                    <div class="stat-card">
                        <h3>Total Days</h3>
                        <p class="stat-value">${stats.recordCount}</p>
                    </div>
                </div>
            `;
        }
    }
}

// Event Handlers
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.currentTarget.getAttribute('data-section');
            UIManager.showSection(section);
        });
    });

    // Search functionality
    document.getElementById('contact-search').addEventListener('input', (e) => {
        UIManager.renderContacts(e.target.value);
    });

    document.getElementById('pioneer-search').addEventListener('input', (e) => {
        UIManager.renderPioneerRecords(e.target.value);
    });

    document.getElementById('publisher-search').addEventListener('input', (e) => {
        UIManager.renderPublisherRecords(e.target.value);
    });

    // Modal controls
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            UIManager.hideModal(modal.id);
        });
    });

    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            UIManager.hideModal(modal.id);
        });
    });

    // Add buttons
    document.getElementById('add-contact-btn').addEventListener('click', () => {
        document.getElementById('contact-modal-title').textContent = 'Add New Contact';
        document.getElementById('contact-form').removeAttribute('data-edit-id');
        UIManager.showModal('contact-modal');
    });

    document.getElementById('add-pioneer-btn').addEventListener('click', () => {
        document.getElementById('pioneer-modal-title').textContent = 'Add Pioneer Record';
        document.getElementById('pioneer-form').removeAttribute('data-edit-id');
        // Set today's date as default
        document.getElementById('pioneer-date').value = new Date().toISOString().split('T')[0];
        UIManager.showModal('pioneer-modal');
    });

    document.getElementById('add-publisher-btn').addEventListener('click', () => {
        document.getElementById('publisher-modal-title').textContent = 'Add Publisher Record';
        document.getElementById('publisher-form').removeAttribute('data-edit-id');
        // Set today's date as default
        document.getElementById('publisher-date').value = new Date().toISOString().split('T')[0];
        UIManager.showModal('publisher-modal');
    });

    // Stats buttons
    document.getElementById('pioneer-stats-btn').addEventListener('click', () => {
        const currentDate = new Date();
        const stats = dataManager.getPioneerStats(currentDate.getMonth(), currentDate.getFullYear());
        document.getElementById('stats-modal-title').textContent = 'Pioneer Statistics - Current Month';
        UIManager.renderStats('pioneer', stats);
        UIManager.showModal('stats-modal');
    });

    document.getElementById('publisher-stats-btn').addEventListener('click', () => {
        const currentDate = new Date();
        const stats = dataManager.getPublisherStats(currentDate.getMonth(), currentDate.getFullYear());
        document.getElementById('stats-modal-title').textContent = 'Publisher Statistics - Current Month';
        UIManager.renderStats('publisher', stats);
        UIManager.showModal('stats-modal');
    });

    // WhatsApp sharing
    document.getElementById('share-whatsapp-btn').addEventListener('click', shareViaWhatsApp);

    // Form submissions
    document.getElementById('contact-form').addEventListener('submit', handleContactSubmit);
    document.getElementById('pioneer-form').addEventListener('submit', handlePioneerSubmit);
    document.getElementById('publisher-form').addEventListener('submit', handlePublisherSubmit);

    // Auth event listeners
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('signup-btn').addEventListener('click', handleSignup);
    document.getElementById('google-auth-btn').addEventListener('click', handleGoogleAuth);
    document.getElementById('guest-btn').addEventListener('click', handleGuestLogin);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
}

// CRUD Operations
function editContact(id) {
    const contact = dataManager.contacts.find(c => c.id === id);
    if (!contact) return;

    document.getElementById('contact-name').value = contact.name || '';
    document.getElementById('contact-phone').value = contact.phone || '';
    document.getElementById('contact-address').value = contact.address || '';
    document.getElementById('contact-publication').value = contact.publication || '';
    document.getElementById('contact-date').value = contact.date || '';
    document.getElementById('contact-time').value = contact.time || '';
    document.getElementById('contact-status').value = contact.status || 'pending';
    document.getElementById('contact-notes').value = contact.notes || '';
    
    document.getElementById('contact-modal-title').textContent = 'Edit Contact';
    document.getElementById('contact-form').setAttribute('data-edit-id', id);
    UIManager.showModal('contact-modal');
}

function deleteContact(id) {
    if (confirm('Are you sure you want to delete this contact?')) {
        dataManager.deleteContact(id);
        UIManager.renderContacts();
    }
}

function editPioneerRecord(id) {
    const record = dataManager.pioneerRecords.find(r => r.id === id);
    if (!record) return;

    document.getElementById('pioneer-date').value = record.date || '';
    document.getElementById('pioneer-hours').value = record.hours || '';
    document.getElementById('pioneer-minutes').value = record.minutes || '';
    document.getElementById('pioneer-studies').value = record.studies || '';
    document.getElementById('pioneer-return-visits').value = record.returnVisits || '';
    document.getElementById('pioneer-notes').value = record.notes || '';
    
    document.getElementById('pioneer-modal-title').textContent = 'Edit Pioneer Record';
    document.getElementById('pioneer-form').setAttribute('data-edit-id', id);
    UIManager.showModal('pioneer-modal');
}

function deletePioneerRecord(id) {
    if (confirm('Are you sure you want to delete this record?')) {
        dataManager.deletePioneerRecord(id);
        UIManager.renderPioneerRecords();
    }
}

function editPublisherRecord(id) {
    const record = dataManager.publisherRecords.find(r => r.id === id);
    if (!record) return;

    document.getElementById('publisher-date').value = record.date || '';
    document.getElementById('publisher-studies').value = record.studies || '';
    document.getElementById('publisher-participated').value = record.participated || 'yes';
    document.getElementById('publisher-notes').value = record.notes || '';
    
    document.getElementById('publisher-modal-title').textContent = 'Edit Publisher Record';
    document.getElementById('publisher-form').setAttribute('data-edit-id', id);
    UIManager.showModal('publisher-modal');
}

function deletePublisherRecord(id) {
    if (confirm('Are you sure you want to delete this record?')) {
        dataManager.deletePublisherRecord(id);
        UIManager.renderPublisherRecords();
    }
}

// Form Handlers
function handleContactSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('contact-name').value,
        phone: document.getElementById('contact-phone').value,
        address: document.getElementById('contact-address').value,
        publication: document.getElementById('contact-publication').value,
        date: document.getElementById('contact-date').value,
        time: document.getElementById('contact-time').value,
        status: document.getElementById('contact-status').value,
        notes: document.getElementById('contact-notes').value
    };

    const editId = e.target.getAttribute('data-edit-id');
    
    if (editId) {
        dataManager.updateContact(editId, formData);
    } else {
        dataManager.addContact(formData);
    }

    UIManager.hideModal('contact-modal');
    UIManager.renderContacts();
}

function handlePioneerSubmit(e) {
    e.preventDefault();
    
    const formData = {
        date: document.getElementById('pioneer-date').value,
        hours: document.getElementById('pioneer-hours').value,
        minutes: document.getElementById('pioneer-minutes').value,
        studies: document.getElementById('pioneer-studies').value,
        returnVisits: document.getElementById('pioneer-return-visits').value,
        notes: document.getElementById('pioneer-notes').value
    };

    const editId = e.target.getAttribute('data-edit-id');
    
    if (editId) {
        dataManager.updatePioneerRecord(editId, formData);
    } else {
        dataManager.addPioneerRecord(formData);
    }

    UIManager.hideModal('pioneer-modal');
    UIManager.renderPioneerRecords();
}

function handlePublisherSubmit(e) {
    e.preventDefault();
    
    const formData = {
        date: document.getElementById('publisher-date').value,
        studies: document.getElementById('publisher-studies').value,
        participated: document.getElementById('publisher-participated').value,
        notes: document.getElementById('publisher-notes').value
    };

    const editId = e.target.getAttribute('data-edit-id');
    
    if (editId) {
        dataManager.updatePublisherRecord(editId, formData);
    } else {
        dataManager.addPublisherRecord(formData);
    }

    UIManager.hideModal('publisher-modal');
    UIManager.renderPublisherRecords();
}

// Authentication Handlers
async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        UIManager.showMessage('Please enter both email and password', 'error');
        return;
    }

    const result = await AuthManager.signIn(email, password);
    if (!result.success) {
        UIManager.showMessage(result.error, 'error');
    }
}

async function handleSignup() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        UIManager.showMessage('Please enter both email and password', 'error');
        return;
    }

    const result = await AuthManager.signUp(email, password);
    if (!result.success) {
        UIManager.showMessage(result.error, 'error');
    }
}

async function handleGoogleAuth() {
    const result = await AuthManager.signInWithGoogle();
    if (!result.success) {
        UIManager.showMessage(result.error, 'error');
    }
}

async function handleGuestLogin() {
    const result = await AuthManager.continueAsGuest();
    if (!result.success) {
        UIManager.showMessage(result.error, 'error');
    }
}

async function handleLogout() {
    const result = await AuthManager.signOut();
    if (result.success) {
        currentUser = null;
        showAuthSection();
    }
}

// Utility Functions
function shareViaWhatsApp() {
    const statsType = document.getElementById('stats-modal-title').textContent.includes('Pioneer') ? 'pioneer' : 'publisher';
    const currentDate = new Date();
    const stats = statsType === 'pioneer' 
        ? dataManager.getPioneerStats(currentDate.getMonth(), currentDate.getFullYear())
        : dataManager.getPublisherStats(currentDate.getMonth(), currentDate.getFullYear());

    let message = `📊 Monthly Ministry Report - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}\n\n`;
    
    if (statsType === 'pioneer') {
        message += `⏰ Total Hours: ${stats.totalHours}\n`;
        message += `📚 Bible Studies: ${stats.totalStudies}\n`;
        message += `🏠 Return Visits: ${stats.totalReturnVisits}\n`;
        message += `📅 Days Recorded: ${stats.recordCount}`;
    } else {
        message += `📚 Bible Studies: ${stats.totalStudies}\n`;
        message += `✅ Days Participated: ${stats.participatedDays}\n`;
        message += `📅 Total Days: ${stats.recordCount}`;
    }



const whatsappURL = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');
}

function showAuthSection() {
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('app-section').classList.add('hidden');
}

function showAppSection(user) {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    
    // Update user info
    if (user) {
        currentUser = user;
        document.getElementById('user-name').textContent = user.displayName || 'Anonymous User';
        document.getElementById('user-avatar').src = user.photoURL || 'https://via.placeholder.com/40';
    }
    
    // Load initial section
    UIManager.showSection(currentSection);
}

// Firebase Auth State Listener
auth.onAuthStateChanged((user) => {
    if (user) {
        showAppSection(user);
        if (isOnline) {
            syncDataFromFirebase();
        }
    } else {
        showAuthSection();
    }
});

// Data Sync Functions
async function syncDataFromFirebase() {
    if (!currentUser) return;
    
    try {
        // Sync contacts
        const contactsSnapshot = await db.collection('users').doc(currentUser.uid).collection('contacts').get();
        const firebaseContacts = contactsSnapshot.docs.map(doc => doc.data());
        dataManager.contacts = mergeArrays(dataManager.contacts, firebaseContacts, 'createdAt');
        
        // Sync pioneer records
        const pioneerSnapshot = await db.collection('users').doc(currentUser.uid).collection('pioneerRecords').get();
        const firebasePioneerRecords = pioneerSnapshot.docs.map(doc => doc.data());
        dataManager.pioneerRecords = mergeArrays(dataManager.pioneerRecords, firebasePioneerRecords, 'createdAt');
        
        // Sync publisher records
        const publisherSnapshot = await db.collection('users').doc(currentUser.uid).collection('publisherRecords').get();
        const firebasePublisherRecords = publisherSnapshot.docs.map(doc => doc.data());
        dataManager.publisherRecords = mergeArrays(dataManager.publisherRecords, firebasePublisherRecords, 'createdAt');
        
        // Save merged data to local storage
        dataManager.saveToLocal();
        UIManager.refreshCurrentSection();
    } catch (error) {
        console.error('Error syncing data from Firebase:', error);
    }
}

function mergeArrays(localArray, firebaseArray, sortField) {
    const merged = [...localArray];
    const localIds = localArray.map(item => item.id);
    
    firebaseArray.forEach(firebaseItem => {
        if (!localIds.includes(firebaseItem.id)) {
            merged.push(firebaseItem);
        } else {
            const localItem = localArray.find(item => item.id === firebaseItem.id);
            const firebaseDate = new Date(firebaseItem[sortField] || 0);
            const localDate = new Date(localItem[sortField] || 0);
            
            if (firebaseDate > localDate) {
                const index = merged.findIndex(item => item.id === firebaseItem.id);
                merged[index] = firebaseItem;
            }
        }
    });
    
    return merged.sort((a, b) => {
        const dateA = new Date(a[sortField] || 0);
        const dateB = new Date(b[sortField] || 0);
        return dateB - dateA;
    });
}

// Network Status Detection
window.addEventListener('online', () => {
    isOnline = true;
    if (currentUser) {
        syncDataFromFirebase();
    }
});

window.addEventListener('offline', () => {
    isOnline = false;
});

// PWA Installation
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button if not already installed
    if (!window.matchMedia('(display-mode: standalone)').matches) {
        const installBtn = document.createElement('button');
        installBtn.textContent = 'Install App';
        installBtn.className = 'install-btn';
        installBtn.addEventListener('click', () => {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                deferredPrompt = null;
            });
        });
        document.body.appendChild(installBtn);
    }
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    
    // Check if user is already logged in
    auth.onAuthStateChanged((user) => {
        if (user) {
            showAppSection(user);
        } else {
            showAuthSection();
        }
    });
});

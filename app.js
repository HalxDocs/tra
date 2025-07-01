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

// Global variables
let currentUser = null;
let editingContactId = null;
let editingPioneerRecordId = null;
let editingPublisherRecordId = null;

// DOM Elements
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const googleAuthBtn = document.getElementById('google-auth-btn');
const guestBtn = document.getElementById('guest-btn');
const authMessage = document.getElementById('auth-message');
const logoutBtn = document.getElementById('logout-btn');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');

// Navigation
const navBtns = document.querySelectorAll('.nav-btn');
const contentSections = document.querySelectorAll('.content-section');

// Contacts
const contactsList = document.getElementById('contacts-list');
const addContactBtn = document.getElementById('add-contact-btn');
const contactModal = document.getElementById('contact-modal');
const contactForm = document.getElementById('contact-form');
const contactSearch = document.getElementById('contact-search');

// Pioneer
const pioneerList = document.getElementById('pioneer-list');
const addPioneerBtn = document.getElementById('add-pioneer-btn');
const pioneerModal = document.getElementById('pioneer-modal');
const pioneerForm = document.getElementById('pioneer-form');
const pioneerStatsBtn = document.getElementById('pioneer-stats-btn');
const pioneerSearch = document.getElementById('pioneer-search');

// Publisher
const publisherList = document.getElementById('publisher-list');
const addPublisherBtn = document.getElementById('add-publisher-btn');
const publisherModal = document.getElementById('publisher-modal');
const publisherForm = document.getElementById('publisher-form');
const publisherStatsBtn = document.getElementById('publisher-stats-btn');
const publisherSearch = document.getElementById('publisher-search');

// Stats Modal
const statsModal = document.getElementById('stats-modal');
const statsContainer = document.getElementById('stats-container');
const shareWhatsAppBtn = document.getElementById('share-whatsapp-btn');

// Auth State Observer
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        showApp();
        updateUserInfo();
        loadAllData();
    } else {
        currentUser = null;
        showAuth();
    }
});

// Authentication Functions
function showAuth() {
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
}

function showApp() {
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
}

function updateUserInfo() {
    if (currentUser) {
        userName.textContent = currentUser.displayName || currentUser.email || 'Guest User';
        userAvatar.src = currentUser.photoURL || 'https://via.placeholder.com/40x40?text=U';
        userAvatar.alt = currentUser.displayName || 'User Avatar';
    }
}

function showAuthMessage(message, isError = false) {
    authMessage.textContent = message;
    authMessage.className = `auth-message ${isError ? 'error' : 'success'}`;
    setTimeout(() => {
        authMessage.textContent = '';
        authMessage.className = 'auth-message';
    }, 5000);
}

// Auth Event Listeners
loginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showAuthMessage('Please enter both email and password', true);
        return;
    }

    try {
        await auth.signInWithEmailAndPassword(email, password);
        showAuthMessage('Login successful!');
    } catch (error) {
        showAuthMessage(error.message, true);
    }
});

signupBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showAuthMessage('Please enter both email and password', true);
        return;
    }

    if (password.length < 6) {
        showAuthMessage('Password must be at least 6 characters long', true);
        return;
    }

    try {
        await auth.createUserWithEmailAndPassword(email, password);
        showAuthMessage('Account created successfully!');
    } catch (error) {
        showAuthMessage(error.message, true);
    }
});

googleAuthBtn.addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
        showAuthMessage('Google login successful!');
    } catch (error) {
        showAuthMessage(error.message, true);
    }
});

guestBtn.addEventListener('click', async () => {
    try {
        await auth.signInAnonymously();
        showAuthMessage('Logged in as guest!');
    } catch (error) {
        showAuthMessage(error.message, true);
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await auth.signOut();
        showAuthMessage('Logged out successfully!');
    } catch (error) {
        showAuthMessage(error.message, true);
    }
});

// Navigation
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const section = btn.dataset.section;
        
        // Update active nav button
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show corresponding section
        contentSections.forEach(s => s.classList.add('hidden'));
        document.getElementById(`${section}-section`).classList.remove('hidden');
        
        // Load data for the section
        if (section === 'contacts') loadContacts();
        else if (section === 'pioneer') loadPioneerRecords();
        else if (section === 'publisher') loadPublisherRecords();
    });
});

// Utility Functions
function getUserRef() {
    return db.collection('users').doc(currentUser.uid);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

function formatTime(time) {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Contacts Functions
async function loadContacts() {
    if (!currentUser) return;
    
    try {
        const snapshot = await getUserRef().collection('contacts').orderBy('name').get();
        displayContacts(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
    } catch (error) {
        console.error('Error loading contacts:', error);
    }
}

function displayContacts(contacts) {
    contactsList.innerHTML = '';
    
    if (contacts.length === 0) {
        contactsList.innerHTML = '<div class="empty-state">No contacts found. Add your first contact!</div>';
        return;
    }
    
    contacts.forEach(contact => {
        const contactCard = document.createElement('div');
        contactCard.className = 'contact-card';
        contactCard.innerHTML = `
            <div class="contact-info">
                <h3>${contact.name}</h3>
                <p><i class="fas fa-phone"></i> ${contact.phone || 'No phone'}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${contact.address || 'No address'}</p>
                <p><i class="fas fa-book"></i> ${contact.publication || 'No publication'}</p>
                ${contact.returnDate ? `<p><i class="fas fa-calendar"></i> Return Visit: ${formatDate(contact.returnDate)} ${contact.returnTime ? 'at ' + formatTime(contact.returnTime) : ''}</p>` : ''}
                <p><i class="fas fa-flag"></i> Status: <span class="status status-${contact.status || 'pending'}">${contact.status || 'pending'}</span></p>
                ${contact.notes ? `<p><i class="fas fa-sticky-note"></i> ${contact.notes}</p>` : ''}
            </div>
            <div class="contact-actions">
                <button onclick="editContact('${contact.id}')" class="edit-btn"><i class="fas fa-edit"></i></button>
                <button onclick="deleteContact('${contact.id}')" class="delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        `;
        contactsList.appendChild(contactCard);
    });
}

async function saveContact(contactData) {
    if (!currentUser) return;
    
    try {
        if (editingContactId) {
            await getUserRef().collection('contacts').doc(editingContactId).update({
                ...contactData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            await getUserRef().collection('contacts').add({
                ...contactData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        loadContacts();
    } catch (error) {
        console.error('Error saving contact:', error);
        alert('Error saving contact. Please try again.');
    }
}

async function deleteContact(contactId) {
    if (!currentUser || !confirm('Are you sure you want to delete this contact?')) return;
    
    try {
        await getUserRef().collection('contacts').doc(contactId).delete();
        loadContacts();
    } catch (error) {
        console.error('Error deleting contact:', error);
        alert('Error deleting contact. Please try again.');
    }
}

function editContact(contactId) {
    editingContactId = contactId;
    
    getUserRef().collection('contacts').doc(contactId).get().then(doc => {
        if (doc.exists) {
            const contact = doc.data();
            document.getElementById('contact-modal-title').textContent = 'Edit Contact';
            document.getElementById('contact-name').value = contact.name || '';
            document.getElementById('contact-phone').value = contact.phone || '';
            document.getElementById('contact-address').value = contact.address || '';
            document.getElementById('contact-publication').value = contact.publication || '';
            document.getElementById('contact-date').value = contact.returnDate || '';
            document.getElementById('contact-time').value = contact.returnTime || '';
            document.getElementById('contact-status').value = contact.status || 'pending';
            document.getElementById('contact-notes').value = contact.notes || '';
            contactModal.classList.remove('hidden');
        }
    });
}

// Pioneer Functions
async function loadPioneerRecords() {
    if (!currentUser) return;
    
    try {
        const snapshot = await getUserRef().collection('pioneerRecords').orderBy('date', 'desc').get();
        displayPioneerRecords(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
    } catch (error) {
        console.error('Error loading pioneer records:', error);
    }
}

function displayPioneerRecords(records) {
    pioneerList.innerHTML = '';
    
    if (records.length === 0) {
        pioneerList.innerHTML = '<div class="empty-state">No pioneer records found. Add your first record!</div>';
        return;
    }
    
    records.forEach(record => {
        const recordCard = document.createElement('div');
        recordCard.className = 'record-card';
        recordCard.innerHTML = `
            <div class="record-info">
                <h3>${formatDate(record.date)}</h3>
                <p><i class="fas fa-clock"></i> Hours: ${record.hours || 0}${record.minutes ? `.${Math.round(record.minutes/60*100)}` : ''}</p>
                <p><i class="fas fa-book"></i> Bible Studies: ${record.studies || 0}</p>
                <p><i class="fas fa-redo"></i> Return Visits: ${record.returnVisits || 0}</p>
                ${record.notes ? `<p><i class="fas fa-sticky-note"></i> ${record.notes}</p>` : ''}
            </div>
            <div class="record-actions">
                <button onclick="editPioneerRecord('${record.id}')" class="edit-btn"><i class="fas fa-edit"></i></button>
                <button onclick="deletePioneerRecord('${record.id}')" class="delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        `;
        pioneerList.appendChild(recordCard);
    });
}

async function savePioneerRecord(recordData) {
    if (!currentUser) return;
    
    try {
        if (editingPioneerRecordId) {
            await getUserRef().collection('pioneerRecords').doc(editingPioneerRecordId).update({
                ...recordData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            await getUserRef().collection('pioneerRecords').add({
                ...recordData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        loadPioneerRecords();
    } catch (error) {
        console.error('Error saving pioneer record:', error);
        alert('Error saving record. Please try again.');
    }
}

async function deletePioneerRecord(recordId) {
    if (!currentUser || !confirm('Are you sure you want to delete this record?')) return;
    
    try {
        await getUserRef().collection('pioneerRecords').doc(recordId).delete();
        loadPioneerRecords();
    } catch (error) {
        console.error('Error deleting pioneer record:', error);
        alert('Error deleting record. Please try again.');
    }
}

function editPioneerRecord(recordId) {
    editingPioneerRecordId = recordId;
    
    getUserRef().collection('pioneerRecords').doc(recordId).get().then(doc => {
        if (doc.exists) {
            const record = doc.data();
            document.getElementById('pioneer-modal-title').textContent = 'Edit Pioneer Record';
            document.getElementById('pioneer-date').value = record.date || '';
            document.getElementById('pioneer-hours').value = record.hours || '';
            document.getElementById('pioneer-minutes').value = record.minutes || '';
            document.getElementById('pioneer-studies').value = record.studies || '';
            document.getElementById('pioneer-return-visits').value = record.returnVisits || '';
            document.getElementById('pioneer-notes').value = record.notes || '';
            pioneerModal.classList.remove('hidden');
        }
    });
}

// Publisher Functions
async function loadPublisherRecords() {
    if (!currentUser) return;
    
    try {
        const snapshot = await getUserRef().collection('publisherRecords').orderBy('date', 'desc').get();
        displayPublisherRecords(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
    } catch (error) {
        console.error('Error loading publisher records:', error);
    }
}

function displayPublisherRecords(records) {
    publisherList.innerHTML = '';
    
    if (records.length === 0) {
        publisherList.innerHTML = '<div class="empty-state">No publisher records found. Add your first record!</div>';
        return;
    }
    
    records.forEach(record => {
        const recordCard = document.createElement('div');
        recordCard.className = 'record-card';
        recordCard.innerHTML = `
            <div class="record-info">
                <h3>${formatDate(record.date)}</h3>
                <p><i class="fas fa-book"></i> Bible Studies: ${record.studies || 0}</p>
                <p><i class="fas fa-user-check"></i> Participated: <span class="status status-${record.participated}">${record.participated}</span></p>
                ${record.notes ? `<p><i class="fas fa-sticky-note"></i> ${record.notes}</p>` : ''}
            </div>
            <div class="record-actions">
                <button onclick="editPublisherRecord('${record.id}')" class="edit-btn"><i class="fas fa-edit"></i></button>
                <button onclick="deletePublisherRecord('${record.id}')" class="delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        `;
        publisherList.appendChild(recordCard);
    });
}

async function savePublisherRecord(recordData) {
    if (!currentUser) return;
    
    try {
        if (editingPublisherRecordId) {
            await getUserRef().collection('publisherRecords').doc(editingPublisherRecordId).update({
                ...recordData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            await getUserRef().collection('publisherRecords').add({
                ...recordData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        loadPublisherRecords();
    } catch (error) {
        console.error('Error saving publisher record:', error);
        alert('Error saving record. Please try again.');
    }
}

async function deletePublisherRecord(recordId) {
    if (!currentUser || !confirm('Are you sure you want to delete this record?')) return;
    
    try {
        await getUserRef().collection('publisherRecords').doc(recordId).delete();
        loadPublisherRecords();
    } catch (error) {
        console.error('Error deleting publisher record:', error);
        alert('Error deleting record. Please try again.');
    }
}

function editPublisherRecord(recordId) {
    editingPublisherRecordId = recordId;
    
    getUserRef().collection('publisherRecords').doc(recordId).get().then(doc => {
        if (doc.exists) {
            const record = doc.data();
            document.getElementById('publisher-modal-title').textContent = 'Edit Publisher Record';
            document.getElementById('publisher-date').value = record.date || '';
            document.getElementById('publisher-studies').value = record.studies || '';
            document.getElementById('publisher-participated').value = record.participated || 'yes';
            document.getElementById('publisher-notes').value = record.notes || '';
            publisherModal.classList.remove('hidden');
        }
    });
}

// Statistics Functions
async function showPioneerStats() {
    if (!currentUser) return;
    
    try {
        const snapshot = await getUserRef().collection('pioneerRecords').get();
        const records = snapshot.docs.map(doc => doc.data());
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyRecords = records.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
        });
        
        const totalHours = monthlyRecords.reduce((sum, record) => {
            const hours = parseFloat(record.hours || 0);
            const minutes = parseFloat(record.minutes || 0);
            return sum + hours + (minutes / 60);
        }, 0);
        
        const totalStudies = monthlyRecords.reduce((sum, record) => sum + parseInt(record.studies || 0), 0);
        const totalReturnVisits = monthlyRecords.reduce((sum, record) => sum + parseInt(record.returnVisits || 0), 0);
        
        const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        document.getElementById('stats-modal-title').textContent = `Pioneer Stats - ${monthName}`;
        statsContainer.innerHTML = `
            <div class="stat-item">
                <h3>Total Hours</h3>
                <p class="stat-value">${totalHours.toFixed(1)}</p>
            </div>
            <div class="stat-item">
                <h3>Bible Studies</h3>
                <p class="stat-value">${totalStudies}</p>
            </div>
            <div class="stat-item">
                <h3>Return Visits</h3>
                <p class="stat-value">${totalReturnVisits}</p>
            </div>
            <div class="stat-item">
                <h3>Days in Service</h3>
                <p class="stat-value">${monthlyRecords.length}</p>
            </div>
        `;
        
        statsModal.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading pioneer stats:', error);
        alert('Error loading statistics. Please try again.');
    }
}

async function showPublisherStats() {
    if (!currentUser) return;
    
    try {
        const snapshot = await getUserRef().collection('publisherRecords').get();
        const records = snapshot.docs.map(doc => doc.data());
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyRecords = records.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
        });
        
        const totalStudies = monthlyRecords.reduce((sum, record) => sum + parseInt(record.studies || 0), 0);
        const participatedCount = monthlyRecords.filter(record => record.participated === 'yes').length;
        
        const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        document.getElementById('stats-modal-title').textContent = `Publisher Stats - ${monthName}`;
        statsContainer.innerHTML = `
            <div class="stat-item">
                <h3>Bible Studies</h3>
                <p class="stat-value">${totalStudies}</p>
            </div>
            <div class="stat-item">
                <h3>Days Participated</h3>
                <p class="stat-value">${participatedCount}</p>
            </div>
            <div class="stat-item">
                <h3>Total Records</h3>
                <p class="stat-value">${monthlyRecords.length}</p>
            </div>
        `;
        
        statsModal.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading publisher stats:', error);
        alert('Error loading statistics. Please try again.');
    }
}

// Load all data when user logs in
async function loadAllData() {
    loadContacts();
    loadPioneerRecords();
    loadPublisherRecords();
}

// Event Listeners for modals and forms
addContactBtn.addEventListener('click', () => {
    editingContactId = null;
    document.getElementById('contact-modal-title').textContent = 'Add New Contact';
    contactForm.reset();
    contactModal.classList.remove('hidden');
});

addPioneerBtn.addEventListener('click', () => {
    editingPioneerRecordId = null;
    document.getElementById('pioneer-modal-title').textContent = 'Add Pioneer Record';
    pioneerForm.reset();
    pioneerModal.classList.remove('hidden');
});

addPublisherBtn.addEventListener('click', () => {
    editingPublisherRecordId = null;
    document.getElementById('publisher-modal-title').textContent = 'Add Publisher Record';
    publisherForm.reset();
    publisherModal.classList.remove('hidden');
});

pioneerStatsBtn.addEventListener('click', showPioneerStats);
publisherStatsBtn.addEventListener('click', showPublisherStats);

// Form submissions
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const contactData = {
        name: document.getElementById('contact-name').value.trim(),
        phone: document.getElementById('contact-phone').value.trim(),
        address: document.getElementById('contact-address').value.trim(),
        publication: document.getElementById('contact-publication').value.trim(),
        returnDate: document.getElementById('contact-date').value,
        returnTime: document.getElementById('contact-time').value,
        status: document.getElementById('contact-status').value,
        notes: document.getElementById('contact-notes').value.trim()
    };
    
    if (!contactData.name) {
        alert('Please enter a name for the contact.');
        return;
    }
    
    saveContact(contactData);
    contactModal.classList.add('hidden');
    editingContactId = null;
});

pioneerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const recordData = {
        date: document.getElementById('pioneer-date').value,
        hours: parseFloat(document.getElementById('pioneer-hours').value) || 0,
        minutes: parseInt(document.getElementById('pioneer-minutes').value) || 0,
        studies: parseInt(document.getElementById('pioneer-studies').value) || 0,
        returnVisits: parseInt(document.getElementById('pioneer-return-visits').value) || 0,
        notes: document.getElementById('pioneer-notes').value.trim()
    };
    
    if (!recordData.date) {
        alert('Please select a date for the record.');
        return;
    }
    
    savePioneerRecord(recordData);
    pioneerModal.classList.add('hidden');
    editingPioneerRecordId = null;
});

publisherForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const recordData = {
        date: document.getElementById('publisher-date').value,
        studies: parseInt(document.getElementById('publisher-studies').value) || 0,
        participated: document.getElementById('publisher-participated').value,
        notes: document.getElementById('publisher-notes').value.trim()
    };
    
    if (!recordData.date) {
        alert('Please select a date for the record.');
        return;
    }
    
    savePublisherRecord(recordData);
    publisherModal.classList.add('hidden');
    editingPublisherRecordId = null;
});

// Close modals
document.querySelectorAll('.close-btn, .cancel-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) {
            modal.classList.add('hidden');
            editingContactId = null;
            editingPioneerRecordId = null;
            editingPublisherRecordId = null;
        }
    });
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.add('hidden');
        editingContactId = null;
        editingPioneerRecordId = null;
        editingPublisherRecordId = null;
    }
});

// Search functionality
contactSearch.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const contactCards = document.querySelectorAll('.contact-card');
    
    contactCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
});

pioneerSearch.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const recordCards = document.querySelectorAll('#pioneer-list .record-card');
    
    recordCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
});

publisherSearch.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const recordCards = document.querySelectorAll('#publisher-list .record-card');
    
    recordCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
});

// WhatsApp sharing
shareWhatsAppBtn.addEventListener('click', () => {
    const statsText = statsContainer.textContent.replace(/\s+/g, ' ').trim();
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(statsText)}`;
    window.open(whatsappUrl, '_blank');
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Set default date to today for forms
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('pioneer-date').value = today;
    document.getElementById('publisher-date').value = today;
});

console.log('JW Ministry Assistant loaded successfully!');

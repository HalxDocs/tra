// Firebase configuration
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

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// DOM Elements
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const googleAuthBtn = document.getElementById('google-auth-btn');
const guestBtn = document.getElementById('guest-btn');
const logoutBtn = document.getElementById('logout-btn');
const authMessage = document.getElementById('auth-message');
const userName = document.getElementById('user-name');
const userAvatar = document.getElementById('user-avatar');

// Navigation
const navBtns = document.querySelectorAll('.nav-btn');
const contentSections = document.querySelectorAll('.content-section');

// Modals
const contactModal = document.getElementById('contact-modal');
const pioneerModal = document.getElementById('pioneer-modal');
const publisherModal = document.getElementById('publisher-modal');
const statsModal = document.getElementById('stats-modal');
const closeBtns = document.querySelectorAll('.close-btn, .cancel-btn');

// Buttons
const addContactBtn = document.getElementById('add-contact-btn');
const addPioneerBtn = document.getElementById('add-pioneer-btn');
const addPublisherBtn = document.getElementById('add-publisher-btn');
const pioneerStatsBtn = document.getElementById('pioneer-stats-btn');
const publisherStatsBtn = document.getElementById('publisher-stats-btn');
const shareWhatsappBtn = document.getElementById('share-whatsapp-btn');

// Forms
const contactForm = document.getElementById('contact-form');
const pioneerForm = document.getElementById('pioneer-form');
const publisherForm = document.getElementById('publisher-form');

// Lists
const contactsList = document.getElementById('contacts-list');
const pioneerList = document.getElementById('pioneer-list');
const publisherList = document.getElementById('publisher-list');

// Search
const contactSearch = document.getElementById('contact-search');
const pioneerSearch = document.getElementById('pioneer-search');
const publisherSearch = document.getElementById('publisher-search');

// State variables
let currentUser = null;
let currentSection = 'contacts';
let editingId = null;

// Initialize the app
function initApp() {
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            currentUser = user;
            showAppSection();
            updateUserInfo(user);
            loadData();
            
            // Check if the app was launched from an install prompt
            window.addEventListener('appinstalled', () => {
                console.log('App was installed');
            });
            
            // Show install prompt if not already installed
            let deferredPrompt;
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                
                // Show custom install button or prompt
                setTimeout(() => {
                    if (window.matchMedia('(display-mode: browser)').matches) {
                        if (confirm('Would you like to install JW Ministry Assistant for easier access?')) {
                            deferredPrompt.prompt();
                            deferredPrompt.userChoice.then(choiceResult => {
                                if (choiceResult.outcome === 'accepted') {
                                    console.log('User accepted install');
                                } else {
                                    console.log('User declined install');
                                }
                                deferredPrompt = null;
                            });
                        }
                    }
                }, 3000);
            });
        } else {
            // User is signed out
            currentUser = null;
            showAuthSection();
        }
    });
}

// Show authentication section
function showAuthSection() {
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
}

// Show app section
function showAppSection() {
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
}

// Update user info in the header
function updateUserInfo(user) {
    userName.textContent = user.displayName || user.email || 'Guest';
    if (user.photoURL) {
        userAvatar.src = user.photoURL;
    } else {
        userAvatar.src = 'https://via.placeholder.com/40';
    }
}

// Load data for the current user
function loadData() {
    if (!currentUser) return;
    
    if (currentSection === 'contacts') {
        loadContacts();
    } else if (currentSection === 'pioneer') {
        loadPioneerRecords();
    } else if (currentSection === 'publisher') {
        loadPublisherRecords();
    }
}

// Load contacts from Firestore
function loadContacts() {
    contactsList.innerHTML = '<div class="loading">Loading contacts...</div>';
    
    db.collection('contacts')
        .where('userId', '==', currentUser.uid)
        .orderBy('name')
        .get()
        .then(querySnapshot => {
            contactsList.innerHTML = '';
            
            if (querySnapshot.empty) {
                contactsList.innerHTML = '<div class="empty">No contacts found. Add your first contact!</div>';
                return;
            }
            
            querySnapshot.forEach(doc => {
                const contact = doc.data();
                renderContact(doc.id, contact);
            });
        })
        .catch(error => {
            console.error('Error loading contacts: ', error);
            contactsList.innerHTML = '<div class="error">Error loading contacts. Please try again.</div>';
            
            // Try to load from cache if offline
            if (error.code === 'unavailable') {
                loadContactsFromCache();
            }
        });
}

// Load contacts from cache (offline)
function loadContactsFromCache() {
    db.collection('contacts')
        .where('userId', '==', currentUser.uid)
        .orderBy('name')
        .get({ source: 'cache' })
        .then(querySnapshot => {
            contactsList.innerHTML = '';
            
            if (querySnapshot.empty) {
                contactsList.innerHTML = '<div class="empty">No cached contacts found. You appear to be offline.</div>';
                return;
            }
            
            querySnapshot.forEach(doc => {
                const contact = doc.data();
                renderContact(doc.id, contact);
            });
            
            contactsList.innerHTML += '<div class="offline-notice">Showing cached data (offline mode)</div>';
        })
        .catch(error => {
            console.error('Error loading cached contacts: ', error);
            contactsList.innerHTML = '<div class="error">Error loading contacts. You appear to be offline.</div>';
        });
}

// Render a contact item
function renderContact(id, contact) {
    const contactEl = document.createElement('div');
    contactEl.className = 'contact-item';
    contactEl.dataset.id = id;
    
    const statusClass = contact.status === 'completed' ? 'completed' : 
                      contact.status === 'not-interested' ? 'not-interested' : 'pending';
    
    const returnVisitInfo = contact.returnVisitDate ? 
        `<div class="return-visit ${statusClass}">
            <strong>Return Visit:</strong> ${formatDate(contact.returnVisitDate)} at ${contact.returnVisitTime || '--:--'}
            <span class="status-badge">${contact.status}</span>
        </div>` : '';
    
    contactEl.innerHTML = `
        <div class="contact-header">
            <h3>${contact.name}</h3>
            <div class="contact-actions">
                <button class="edit-btn" data-id="${id}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" data-id="${id}"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="contact-details">
            <div><i class="fas fa-phone"></i> ${contact.phone || 'No phone'}</div>
            <div><i class="fas fa-map-marker-alt"></i> ${contact.address || 'No address'}</div>
            ${returnVisitInfo}
            <div class="contact-notes">${contact.notes || 'No additional notes'}</div>
        </div>
    `;
    
    contactsList.appendChild(contactEl);
    
    // Add event listeners to action buttons
    contactEl.querySelector('.edit-btn').addEventListener('click', () => editContact(id));
    contactEl.querySelector('.delete-btn').addEventListener('click', () => deleteContact(id));
}

// Load pioneer records
function loadPioneerRecords() {
    pioneerList.innerHTML = '<div class="loading">Loading pioneer records...</div>';
    
    db.collection('pioneerRecords')
        .where('userId', '==', currentUser.uid)
        .orderBy('date', 'desc')
        .get()
        .then(querySnapshot => {
            pioneerList.innerHTML = '';
            
            if (querySnapshot.empty) {
                pioneerList.innerHTML = '<div class="empty">No pioneer records found. Add your first record!</div>';
                return;
            }
            
            querySnapshot.forEach(doc => {
                const record = doc.data();
                renderPioneerRecord(doc.id, record);
            });
        })
        .catch(error => {
            console.error('Error loading pioneer records: ', error);
            pioneerList.innerHTML = '<div class="error">Error loading records. Please try again.</div>';
            
            if (error.code === 'unavailable') {
                loadPioneerRecordsFromCache();
            }
        });
}

// Load pioneer records from cache (offline)
function loadPioneerRecordsFromCache() {
    db.collection('pioneerRecords')
        .where('userId', '==', currentUser.uid)
        .orderBy('date', 'desc')
        .get({ source: 'cache' })
        .then(querySnapshot => {
            pioneerList.innerHTML = '';
            
            if (querySnapshot.empty) {
                pioneerList.innerHTML = '<div class="empty">No cached pioneer records found. You appear to be offline.</div>';
                return;
            }
            
            querySnapshot.forEach(doc => {
                const record = doc.data();
                renderPioneerRecord(doc.id, record);
            });
            
            pioneerList.innerHTML += '<div class="offline-notice">Showing cached data (offline mode)</div>';
        })
        .catch(error => {
            console.error('Error loading cached pioneer records: ', error);
            pioneerList.innerHTML = '<div class="error">Error loading records. You appear to be offline.</div>';
        });
}

// Render a pioneer record
function renderPioneerRecord(id, record) {
    const recordEl = document.createElement('div');
    recordEl.className = 'record-item';
    recordEl.dataset.id = id;
    
    const minutesDisplay = record.minutes ? `${record.minutes} minutes` : '';
    
    recordEl.innerHTML = `
        <div class="record-header">
            <h3>${formatDate(record.date)}</h3>
            <div class="record-actions">
                <button class="edit-btn" data-id="${id}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" data-id="${id}"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="record-details">
            <div><i class="fas fa-clock"></i> <strong>Time:</strong> ${record.hours} hours ${minutesDisplay}</div>
            <div><i class="fas fa-book"></i> <strong>Studies:</strong> ${record.studies || 0}</div>
            <div><i class="fas fa-undo"></i> <strong>Return Visits:</strong> ${record.returnVisits || 0}</div>
            <div class="record-notes">${record.notes || 'No additional notes'}</div>
        </div>
    `;
    
    pioneerList.appendChild(recordEl);
    
    // Add event listeners to action buttons
    recordEl.querySelector('.edit-btn').addEventListener('click', () => editPioneerRecord(id));
    recordEl.querySelector('.delete-btn').addEventListener('click', () => deletePioneerRecord(id));
}

// Load publisher records
function loadPublisherRecords() {
    publisherList.innerHTML = '<div class="loading">Loading publisher records...</div>';
    
    db.collection('publisherRecords')
        .where('userId', '==', currentUser.uid)
        .orderBy('date', 'desc')
        .get()
        .then(querySnapshot => {
            publisherList.innerHTML = '';
            
            if (querySnapshot.empty) {
                publisherList.innerHTML = '<div class="empty">No publisher records found. Add your first record!</div>';
                return;
            }
            
            querySnapshot.forEach(doc => {
                const record = doc.data();
                renderPublisherRecord(doc.id, record);
            });
        })
        .catch(error => {
            console.error('Error loading publisher records: ', error);
            publisherList.innerHTML = '<div class="error">Error loading records. Please try again.</div>';
            
            if (error.code === 'unavailable') {
                loadPublisherRecordsFromCache();
            }
        });
}

// Load publisher records from cache (offline)
function loadPublisherRecordsFromCache() {
    db.collection('publisherRecords')
        .where('userId', '==', currentUser.uid)
        .orderBy('date', 'desc')
        .get({ source: 'cache' })
        .then(querySnapshot => {
            publisherList.innerHTML = '';
            
            if (querySnapshot.empty) {
                publisherList.innerHTML = '<div class="empty">No cached publisher records found. You appear to be offline.</div>';
                return;
            }
            
            querySnapshot.forEach(doc => {
                const record = doc.data();
                renderPublisherRecord(doc.id, record);
            });
            
            publisherList.innerHTML += '<div class="offline-notice">Showing cached data (offline mode)</div>';
        })
        .catch(error => {
            console.error('Error loading cached publisher records: ', error);
            publisherList.innerHTML = '<div class="error">Error loading records. You appear to be offline.</div>';
        });
}

// Render a publisher record
function renderPublisherRecord(id, record) {
    const recordEl = document.createElement('div');
    recordEl.className = 'record-item';
    recordEl.dataset.id = id;
    
    const participatedClass = record.participated === 'yes' ? 'participated-yes' : 'participated-no';
    
    recordEl.innerHTML = `
        <div class="record-header">
            <h3>${formatDate(record.date)}</h3>
            <div class="record-actions">
                <button class="edit-btn" data-id="${id}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" data-id="${id}"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="record-details">
            <div><i class="fas fa-book"></i> <strong>Studies:</strong> ${record.studies || 0}</div>
            <div class="${participatedClass}">
                <i class="fas fa-check-circle"></i> <strong>Participated:</strong> ${record.participated === 'yes' ? 'Yes' : 'No'}
            </div>
            <div class="record-notes">${record.notes || 'No additional notes'}</div>
        </div>
    `;
    
    publisherList.appendChild(recordEl);
    
    // Add event listeners to action buttons
    recordEl.querySelector('.edit-btn').addEventListener('click', () => editPublisherRecord(id));
    recordEl.querySelector('.delete-btn').addEventListener('click', () => deletePublisherRecord(id));
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '';
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Show modal
function showModal(modal) {
    modal.classList.remove('hidden');
}

// Hide modal
function hideModal(modal) {
    modal.classList.add('hidden');
    editingId = null;
}

// Reset form
function resetForm(form) {
    form.reset();
    editingId = null;
}

// Add a new contact
function addContact() {
    document.getElementById('contact-modal-title').textContent = 'Add New Contact';
    resetForm(contactForm);
    showModal(contactModal);
}

// Edit contact
function editContact(id) {
    editingId = id;
    
    db.collection('contacts').doc(id).get()
        .then(doc => {
            if (doc.exists) {
                const contact = doc.data();
                document.getElementById('contact-modal-title').textContent = 'Edit Contact';
                document.getElementById('contact-name').value = contact.name || '';
                document.getElementById('contact-phone').value = contact.phone || '';
                document.getElementById('contact-address').value = contact.address || '';
                document.getElementById('contact-publication').value = contact.publication || '';
                document.getElementById('contact-date').value = contact.returnVisitDate || '';
                document.getElementById('contact-time').value = contact.returnVisitTime || '';
                document.getElementById('contact-status').value = contact.status || 'pending';
                document.getElementById('contact-notes').value = contact.notes || '';
                
                showModal(contactModal);
            }
        })
        .catch(error => {
            console.error('Error getting contact: ', error);
            authMessage.textContent = 'Error loading contact. Please try again.';
        });
}

// Save contact
function saveContact(e) {
    e.preventDefault();
    
    const contact = {
        userId: currentUser.uid,
        name: document.getElementById('contact-name').value,
        phone: document.getElementById('contact-phone').value,
        address: document.getElementById('contact-address').value,
        publication: document.getElementById('contact-publication').value,
        returnVisitDate: document.getElementById('contact-date').value,
        returnVisitTime: document.getElementById('contact-time').value,
        status: document.getElementById('contact-status').value,
        notes: document.getElementById('contact-notes').value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (editingId) {
        // Update existing contact
        db.collection('contacts').doc(editingId).update(contact)
            .then(() => {
                hideModal(contactModal);
                loadContacts();
            })
            .catch(error => {
                console.error('Error updating contact: ', error);
                authMessage.textContent = 'Error updating contact. Please try again.';
                
                // Try to save to cache if offline
                if (error.code === 'unavailable') {
                    db.collection('contacts').doc(editingId).update(contact)
                        .then(() => {
                            hideModal(contactModal);
                            loadContactsFromCache();
                        });
                }
            });
    } else {
        // Add new contact
        contact.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        
        db.collection('contacts').add(contact)
            .then(() => {
                hideModal(contactModal);
                loadContacts();
            })
            .catch(error => {
                console.error('Error adding contact: ', error);
                authMessage.textContent = 'Error adding contact. Please try again.';
                
                // Try to save to cache if offline
                if (error.code === 'unavailable') {
                    db.collection('contacts').add(contact)
                        .then(() => {
                            hideModal(contactModal);
                            loadContactsFromCache();
                        });
                }
            });
    }
}

// Delete contact
function deleteContact(id) {
    if (confirm('Are you sure you want to delete this contact?')) {
        db.collection('contacts').doc(id).delete()
            .then(() => {
                loadContacts();
            })
            .catch(error => {
                console.error('Error deleting contact: ', error);
                authMessage.textContent = 'Error deleting contact. Please try again.';
                
                // Try to delete from cache if offline
                if (error.code === 'unavailable') {
                    db.collection('contacts').doc(id).delete()
                        .then(() => {
                            loadContactsFromCache();
                        });
                }
            });
    }
}

// Add a new pioneer record
function addPioneerRecord() {
    document.getElementById('pioneer-modal-title').textContent = 'Add Pioneer Record';
    document.getElementById('pioneer-date').valueAsDate = new Date();
    resetForm(pioneerForm);
    showModal(pioneerModal);
}

// Edit pioneer record
function editPioneerRecord(id) {
    editingId = id;
    
    db.collection('pioneerRecords').doc(id).get()
        .then(doc => {
            if (doc.exists) {
                const record = doc.data();
                document.getElementById('pioneer-modal-title').textContent = 'Edit Pioneer Record';
                document.getElementById('pioneer-date').value = record.date || '';
                document.getElementById('pioneer-hours').value = record.hours || 0;
                document.getElementById('pioneer-minutes').value = record.minutes || 0;
                document.getElementById('pioneer-studies').value = record.studies || 0;
                document.getElementById('pioneer-return-visits').value = record.returnVisits || 0;
                document.getElementById('pioneer-notes').value = record.notes || '';
                
                showModal(pioneerModal);
            }
        })
        .catch(error => {
            console.error('Error getting pioneer record: ', error);
            authMessage.textContent = 'Error loading record. Please try again.';
        });
}

// Save pioneer record
function savePioneerRecord(e) {
    e.preventDefault();
    
    const record = {
        userId: currentUser.uid,
        date: document.getElementById('pioneer-date').value,
        hours: parseFloat(document.getElementById('pioneer-hours').value) || 0,
        minutes: parseInt(document.getElementById('pioneer-minutes').value) || 0,
        studies: parseInt(document.getElementById('pioneer-studies').value) || 0,
        returnVisits: parseInt(document.getElementById('pioneer-return-visits').value) || 0,
        notes: document.getElementById('pioneer-notes').value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (editingId) {
        // Update existing record
        db.collection('pioneerRecords').doc(editingId).update(record)
            .then(() => {
                hideModal(pioneerModal);
                loadPioneerRecords();
            })
            .catch(error => {
                console.error('Error updating pioneer record: ', error);
                authMessage.textContent = 'Error updating record. Please try again.';
                
                if (error.code === 'unavailable') {
                    db.collection('pioneerRecords').doc(editingId).update(record)
                        .then(() => {
                            hideModal(pioneerModal);
                            loadPioneerRecordsFromCache();
                        });
                }
            });
    } else {
        // Add new record
        record.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        
        db.collection('pioneerRecords').add(record)
            .then(() => {
                hideModal(pioneerModal);
                loadPioneerRecords();
            })
            .catch(error => {
                console.error('Error adding pioneer record: ', error);
                authMessage.textContent = 'Error adding record. Please try again.';
                
                if (error.code === 'unavailable') {
                    db.collection('pioneerRecords').add(record)
                        .then(() => {
                            hideModal(pioneerModal);
                            loadPioneerRecordsFromCache();
                        });
                }
            });
    }
}

// Delete pioneer record
function deletePioneerRecord(id) {
    if (confirm('Are you sure you want to delete this pioneer record?')) {
        db.collection('pioneerRecords').doc(id).delete()
            .then(() => {
                loadPioneerRecords();
            })
            .catch(error => {
                console.error('Error deleting pioneer record: ', error);
                authMessage.textContent = 'Error deleting record. Please try again.';
                
                if (error.code === 'unavailable') {
                    db.collection('pioneerRecords').doc(id).delete()
                        .then(() => {
                            loadPioneerRecordsFromCache();
                        });
                }
            });
    }
}

// Add a new publisher record
function addPublisherRecord() {
    document.getElementById('publisher-modal-title').textContent = 'Add Publisher Record';
    document.getElementById('publisher-date').valueAsDate = new Date();
    resetForm(publisherForm);
    showModal(publisherModal);
}

// Edit publisher record
function editPublisherRecord(id) {
    editingId = id;
    
    db.collection('publisherRecords').doc(id).get()
        .then(doc => {
            if (doc.exists) {
                const record = doc.data();
                document.getElementById('publisher-modal-title').textContent = 'Edit Publisher Record';
                document.getElementById('publisher-date').value = record.date || '';
                document.getElementById('publisher-studies').value = record.studies || 0;
                document.getElementById('publisher-participated').value = record.participated || 'yes';
                document.getElementById('publisher-notes').value = record.notes || '';
                
                showModal(publisherModal);
            }
        })
        .catch(error => {
            console.error('Error getting publisher record: ', error);
            authMessage.textContent = 'Error loading record. Please try again.';
        });
}

// Save publisher record
function savePublisherRecord(e) {
    e.preventDefault();
    
    const record = {
        userId: currentUser.uid,
        date: document.getElementById('publisher-date').value,
        studies: parseInt(document.getElementById('publisher-studies').value) || 0,
        participated: document.getElementById('publisher-participated').value,
        notes: document.getElementById('publisher-notes').value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (editingId) {
        // Update existing record
        db.collection('publisherRecords').doc(editingId).update(record)
            .then(() => {
                hideModal(publisherModal);
                loadPublisherRecords();
            })
            .catch(error => {
                console.error('Error updating publisher record: ', error);
                authMessage.textContent = 'Error updating record. Please try again.';
                
                if (error.code === 'unavailable') {
                    db.collection('publisherRecords').doc(editingId).update(record)
                        .then(() => {
                            hideModal(publisherModal);
                            loadPublisherRecordsFromCache();
                        });
                }
            });
    } else {
        // Add new record
        record.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        
        db.collection('publisherRecords').add(record)
            .then(() => {
                hideModal(publisherModal);
                loadPublisherRecords();
            })
            .catch(error => {
                console.error('Error adding publisher record: ', error);
                authMessage.textContent = 'Error adding record. Please try again.';
                
                if (error.code === 'unavailable') {
                    db.collection('publisherRecords').add(record)
                        .then(() => {
                            hideModal(publisherModal);
                            loadPublisherRecordsFromCache();
                        });
                }
            });
    }
}

// Delete publisher record
function deletePublisherRecord(id) {
    if (confirm('Are you sure you want to delete this publisher record?')) {
        db.collection('publisherRecords').doc(id).delete()
            .then(() => {
                loadPublisherRecords();
            })
            .catch(error => {
                console.error('Error deleting publisher record: ', error);
                authMessage.textContent = 'Error deleting record. Please try again.';
                
                if (error.code === 'unavailable') {
                    db.collection('publisherRecords').doc(id).delete()
                        .then(() => {
                            loadPublisherRecordsFromCache();
                        });
                }
            });
    }
}

// Show pioneer stats
function showPioneerStats() {
    document.getElementById('stats-modal-title').textContent = 'Pioneer Monthly Statistics';
    const statsContainer = document.getElementById('stats-container');
    statsContainer.innerHTML = '<div class="loading">Loading statistics...</div>';
    
    // Get current month and year
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // Calculate start and end dates for the month
    const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
    const endDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-31`;
    
    db.collection('pioneerRecords')
        .where('userId', '==', currentUser.uid)
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .get()
        .then(querySnapshot => {
            statsContainer.innerHTML = '';
            
            if (querySnapshot.empty) {
                statsContainer.innerHTML = '<div class="empty">No records found for this month.</div>';
                return;
            }
            
            let totalHours = 0;
            let totalMinutes = 0;
            let totalStudies = 0;
            let totalReturnVisits = 0;
            let daysReported = 0;
            
            querySnapshot.forEach(doc => {
                const record = doc.data();
                totalHours += parseFloat(record.hours) || 0;
                totalMinutes += parseInt(record.minutes) || 0;
                totalStudies += parseInt(record.studies) || 0;
                totalReturnVisits += parseInt(record.returnVisits) || 0;
                daysReported++;
            });
            
            // Convert minutes to hours
            totalHours += Math.floor(totalMinutes / 60);
            totalMinutes = totalMinutes % 60;
            
            const avgHours = (totalHours + (totalMinutes / 60)) / daysReported;
            
            statsContainer.innerHTML = `
                <div class="stats-summary">
                    <h3>${new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                    <div class="stats-row">
                        <div class="stats-item">
                            <div class="stats-value">${daysReported}</div>
                            <div class="stats-label">Days Reported</div>
                        </div>
                        <div class="stats-item">
                            <div class="stats-value">${totalHours.toFixed(1)}</div>
                            <div class="stats-label">Total Hours</div>
                        </div>
                    </div>
                    <div class="stats-row">
                        <div class="stats-item">
                            <div class="stats-value">${avgHours.toFixed(1)}</div>
                            <div class="stats-label">Avg Hours/Day</div>
                        </div>
                        <div class="stats-item">
                            <div class="stats-value">${totalStudies}</div>
                            <div class="stats-label">Bible Studies</div>
                        </div>
                    </div>
                    <div class="stats-row">
                        <div class="stats-item">
                            <div class="stats-value">${totalReturnVisits}</div>
                            <div class="stats-label">Return Visits</div>
                        </div>
                    </div>
                </div>
            `;
            
            showModal(statsModal);
        })
        .catch(error => {
            console.error('Error loading pioneer stats: ', error);
            statsContainer.innerHTML = '<div class="error">Error loading statistics. Please try again.</div>';
            
            if (error.code === 'unavailable') {
                loadPioneerStatsFromCache(currentYear, currentMonth);
            }
        });
}

// Load pioneer stats from cache (offline)
function loadPioneerStatsFromCache(year, month) {
    const statsContainer = document.getElementById('stats-container');
    statsContainer.innerHTML = '<div class="loading">Loading cached statistics...</div>';
    
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    
    db.collection('pioneerRecords')
        .where('userId', '==', currentUser.uid)
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .get({ source: 'cache' })
        .then(querySnapshot => {
            statsContainer.innerHTML = '';
            
            if (querySnapshot.empty) {
                statsContainer.innerHTML = '<div class="empty">No cached records found for this month.</div>';
                return;
            }
            
            let totalHours = 0;
            let totalMinutes = 0;
            let totalStudies = 0;
            let totalReturnVisits = 0;
            let daysReported = 0;
            
            querySnapshot.forEach(doc => {
                const record = doc.data();
                totalHours += parseFloat(record.hours) || 0;
                totalMinutes += parseInt(record.minutes) || 0;
                totalStudies += parseInt(record.studies) || 0;
                totalReturnVisits += parseInt(record.returnVisits) || 0;
                daysReported++;
            });
            
            // Convert minutes to hours
            totalHours += Math.floor(totalMinutes / 60);
            totalMinutes = totalMinutes % 60;
            
            const avgHours = (totalHours + (totalMinutes / 60)) / daysReported;
            
            statsContainer.innerHTML = `
                <div class="stats-summary">
                    <h3>${new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })} (Offline)</h3>
                    <div class="stats-row">
                        <div class="stats-item">
                            <div class="stats-value">${daysReported}</div>
                            <div class="stats-label">Days Reported</div>
                        </div>
                        <div class="stats-item">
                            <div class="stats-value">${totalHours.toFixed(1)}</div>
                            <div class="stats-label">Total Hours</div>
                        </div>
                    </div>
                    <div class="stats-row">
                        <div class="stats-item">
                            <div class="stats-value">${avgHours.toFixed(1)}</div>
                            <div class="stats-label">Avg Hours/Day</div>
                        </div>
                        <div class="stats-item">
                            <div class="stats-value">${totalStudies}</div>
                            <div class="stats-label">Bible Studies</div>
                        </div>
                    </div>
                    <div class="stats-row">
                        <div class="stats-item">
                            <div class="stats-value">${totalReturnVisits}</div>
                            <div class="stats-label">Return Visits</div>
                        </div>
                    </div>
                    <div class="offline-notice">Showing cached data (offline mode)</div>
                </div>
            `;
            
            showModal(statsModal);
        })
        .catch(error => {
            console.error('Error loading cached pioneer stats: ', error);
            statsContainer.innerHTML = '<div class="error">Error loading statistics. You appear to be offline.</div>';
        });
}

// Show publisher stats
function showPublisherStats() {
    document.getElementById('stats-modal-title').textContent = 'Publisher Monthly Statistics';
    const statsContainer = document.getElementById('stats-container');
    statsContainer.innerHTML = '<div class="loading">Loading statistics...</div>';
    
    // Get current month and year
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // Calculate start and end dates for the month
    const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
    const endDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-31`;
    
    db.collection('publisherRecords')
        .where('userId', '==', currentUser.uid)
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .get()
        .then(querySnapshot => {
            statsContainer.innerHTML = '';
            
            if (querySnapshot.empty) {
                statsContainer.innerHTML = '<div class="empty">No records found for this month.</div>';
                return;
            }
            
            let totalStudies = 0;
            let daysParticipated = 0;
            let daysReported = 0;
            
            querySnapshot.forEach(doc => {
                const record = doc.data();
                totalStudies += parseInt(record.studies) || 0;
                if (record.participated === 'yes') daysParticipated++;
                daysReported++;
            });
            
            const participationRate = (daysParticipated / daysReported) * 100;
            
            statsContainer.innerHTML = `
                <div class="stats-summary">
                    <h3>${new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                    <div class="stats-row">
                        <div class="stats-item">
                            <div class="stats-value">${daysReported}</div>
                            <div class="stats-label">Days Reported</div>
                        </div>
                        <div class="stats-item">
                            <div class="stats-value">${daysParticipated}</div>
                            <div class="stats-label">Days Participated</div>
                        </div>
                    </div>
                    <div class="stats-row">
                        <div class="stats-item">
                            <div class="stats-value">${participationRate.toFixed(0)}%</div>
                            <div class="stats-label">Participation Rate</div>
                        </div>
                        <div class="stats-item">
                            <div class="stats-value">${totalStudies}</div>
                            <div class="stats-label">Bible Studies</div>
                        </div>
                    </div>
                </div>
            `;
            
            showModal(statsModal);
        })
        .catch(error => {
            console.error('Error loading publisher stats: ', error);
            statsContainer.innerHTML = '<div class="error">Error loading statistics. Please try again.</div>';
            
            if (error.code === 'unavailable') {
                loadPublisherStatsFromCache(currentYear, currentMonth);
            }
        });
}

// Load publisher stats from cache (offline)
function loadPublisherStatsFromCache(year, month) {
    const statsContainer = document.getElementById('stats-container');
    statsContainer.innerHTML = '<div class="loading">Loading cached statistics...</div>';
    
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    
    db.collection('publisherRecords')
        .where('userId', '==', currentUser.uid)
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .get({ source: 'cache' })
        .then(querySnapshot => {
            statsContainer.innerHTML = '';
            
            if (querySnapshot.empty) {
                statsContainer.innerHTML = '<div class="empty">No cached records found for this month.</div>';
                return;
            }
            
            let totalStudies = 0;
            let daysParticipated = 0;
            let daysReported = 0;
            
            querySnapshot.forEach(doc => {
                const record = doc.data();
                totalStudies += parseInt(record.studies) || 0;
                if (record.participated === 'yes') daysParticipated++;
                daysReported++;
            });
            
            const participationRate = (daysParticipated / daysReported) * 100;
            
            statsContainer.innerHTML = `
                <div class="stats-summary">
                    <h3>${new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })} (Offline)</h3>
                    <div class="stats-row">
                        <div class="stats-item">
                            <div class="stats-value">${daysReported}</div>
                            <div class="stats-label">Days Reported</div>
                        </div>
                        <div class="stats-item">
                            <div class="stats-value">${daysParticipated}</div>
                            <div class="stats-label">Days Participated</div>
                        </div>
                    </div>
                    <div class="stats-row">
                        <div class="stats-item">
                            <div class="stats-value">${participationRate.toFixed(0)}%</div>
                            <div class="stats-label">Participation Rate</div>
                        </div>
                        <div class="stats-item">
                            <div class="stats-value">${totalStudies}</div>
                            <div class="stats-label">Bible Studies</div>
                        </div>
                    </div>
                    <div class="offline-notice">Showing cached data (offline mode)</div>
                </div>
            `;
            
            showModal(statsModal);
        })
        .catch(error => {
            console.error('Error loading cached publisher stats: ', error);
            statsContainer.innerHTML = '<div class="error">Error loading statistics. You appear to be offline.</div>';
        });
}

// Share stats via WhatsApp
function shareStatsViaWhatsApp() {
    const statsTitle = document.getElementById('stats-modal-title').textContent;
    const statsElements = document.querySelectorAll('.stats-summary .stats-value, .stats-summary .stats-label');
    
    let statsText = `${statsTitle}\n\n`;
    
    for (let i = 0; i < statsElements.length; i += 2) {
        if (statsElements[i + 1]) {
            statsText += `${statsElements[i].textContent} ${statsElements[i + 1].textContent}\n`;
        }
    }
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(statsText)}`;
    window.open(whatsappUrl, '_blank');
}

// Search contacts
function searchContacts() {
    const searchTerm = contactSearch.value.toLowerCase();
    const contactItems = document.querySelectorAll('.contact-item');
    
    contactItems.forEach(item => {
        const name = item.querySelector('h3').textContent.toLowerCase();
        const details = item.querySelector('.contact-details').textContent.toLowerCase();
        
        if (name.includes(searchTerm) || details.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Search pioneer records
function searchPioneerRecords() {
    const searchTerm = pioneerSearch.value.toLowerCase();
    const recordItems = document.querySelectorAll('#pioneer-list .record-item');
    
    recordItems.forEach(item => {
        const date = item.querySelector('h3').textContent.toLowerCase();
        const details = item.querySelector('.record-details').textContent.toLowerCase();
        
        if (date.includes(searchTerm) || details.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Search publisher records
function searchPublisherRecords() {
    const searchTerm = publisherSearch.value.toLowerCase();
    const recordItems = document.querySelectorAll('#publisher-list .record-item');
    
    recordItems.forEach(item => {
        const date = item.querySelector('h3').textContent.toLowerCase();
        const details = item.querySelector('.record-details').textContent.toLowerCase();
        
        if (date.includes(searchTerm) || details.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Switch section
function switchSection(section) {
    currentSection = section;
    
    // Update active nav button
    navBtns.forEach(btn => {
        if (btn.dataset.section === section) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Show the corresponding content section
    contentSections.forEach(content => {
        if (content.id === `${section}-section`) {
            content.classList.remove('hidden');
        } else {
            content.classList.add('hidden');
        }
    });
    
    // Load data for the section
    loadData();
}

// Sign in with email/password
function signIn(email, password) {
    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            // Signed in
            currentUser = userCredential.user;
            showAppSection();
            updateUserInfo(currentUser);
            loadData();
        })
        .catch(error => {
            console.error('Error signing in: ', error);
            authMessage.textContent = error.message;
        });
}

// Sign up with email/password
function signUp(email, password) {
    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            // Signed up
            currentUser = userCredential.user;
            showAppSection();
            updateUserInfo(currentUser);
            loadData();
        })
        .catch(error => {
            console.error('Error signing up: ', error);
            authMessage.textContent = error.message;
        });
}

// Sign in with Google
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(result => {
            // Signed in with Google
            currentUser = result.user;
            showAppSection();
            updateUserInfo(currentUser);
            loadData();
        })
        .catch(error => {
            console.error('Error signing in with Google: ', error);
            authMessage.textContent = error.message;
        });
}

// Sign out
function signOut() {
    auth.signOut()
        .then(() => {
            currentUser = null;
            showAuthSection();
        })
        .catch(error => {
            console.error('Error signing out: ', error);
            authMessage.textContent = error.message;
        });
}

// Continue as guest
function continueAsGuest() {
    currentUser = {
        uid: 'guest',
        email: 'guest@example.com',
        displayName: 'Guest',
        isAnonymous: true
    };
    
    showAppSection();
    updateUserInfo(currentUser);
    loadData();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', initApp);

// Authentication
loginBtn.addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (email && password) {
        signIn(email, password);
    } else {
        authMessage.textContent = 'Please enter both email and password.';
    }
});

signupBtn.addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (email && password) {
        signUp(email, password);
    } else {
        authMessage.textContent = 'Please enter both email and password.';
    }
});

googleAuthBtn.addEventListener('click', signInWithGoogle);
guestBtn.addEventListener('click', continueAsGuest);
logoutBtn.addEventListener('click', signOut);

// Navigation
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        switchSection(btn.dataset.section);
    });
});

// Modals
addContactBtn.addEventListener('click', addContact);
addPioneerBtn.addEventListener('click', addPioneerRecord);
addPublisherBtn.addEventListener('click', addPublisherRecord);
pioneerStatsBtn.addEventListener('click', showPioneerStats);
publisherStatsBtn.addEventListener('click', showPublisherStats);
shareWhatsappBtn.addEventListener('click', shareStatsViaWhatsApp);

// Forms
contactForm.addEventListener('submit', saveContact);
pioneerForm.addEventListener('submit', savePioneerRecord);
publisherForm.addEventListener('submit', savePublisherRecord);

// Close modals
closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        hideModal(modal);
    });
});

// Click outside modal to close
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        hideModal(e.target);
    }
});

// Search
contactSearch.addEventListener('input', searchContacts);
pioneerSearch.addEventListener('input', searchPioneerRecords);
publisherSearch.addEventListener('input', searchPublisherRecords);

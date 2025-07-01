// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

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

// Section navigation
const navBtns = document.querySelectorAll('.nav-btn');
const contentSections = document.querySelectorAll('.content-section');

// Contact elements
const contactsSection = document.getElementById('contacts-section');
const addContactBtn = document.getElementById('add-contact-btn');
const contactSearch = document.getElementById('contact-search');
const contactsList = document.getElementById('contacts-list');
const contactModal = document.getElementById('contact-modal');
const contactForm = document.getElementById('contact-form');

// Pioneer elements
const pioneerSection = document.getElementById('pioneer-section');
const addPioneerBtn = document.getElementById('add-pioneer-btn');
const pioneerSearch = document.getElementById('pioneer-search');
const pioneerList = document.getElementById('pioneer-list');
const pioneerModal = document.getElementById('pioneer-modal');
const pioneerForm = document.getElementById('pioneer-form');
const pioneerStatsBtn = document.getElementById('pioneer-stats-btn');

// Publisher elements
const publisherSection = document.getElementById('publisher-section');
const addPublisherBtn = document.getElementById('add-publisher-btn');
const publisherSearch = document.getElementById('publisher-search');
const publisherList = document.getElementById('publisher-list');
const publisherModal = document.getElementById('publisher-modal');
const publisherForm = document.getElementById('publisher-form');
const publisherStatsBtn = document.getElementById('publisher-stats-btn');

// Stats modal
const statsModal = document.getElementById('stats-modal');
const statsContainer = document.getElementById('stats-container');
const shareWhatsappBtn = document.getElementById('share-whatsapp-btn');

// Close buttons
const closeBtns = document.querySelectorAll('.close-btn');
const cancelBtns = document.querySelectorAll('.cancel-btn');

// Notification elements
const notification = document.createElement('div');
notification.className = 'notification hidden';
document.body.appendChild(notification);

// Current user and data
let currentUser = null;
let currentSection = 'contacts';
let contacts = [];
let pioneerRecords = [];
let publisherRecords = [];
let editingId = null;

// Initialize the app
function initApp() {
    // Check auth state
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            currentUser = user;
            showAppSection();
            loadUserData();
        } else {
            // No user is signed in
            currentUser = null;
            showAuthSection();
        }
    });

    // Set up event listeners
    setupEventListeners();
}

// Set up all event listeners
function setupEventListeners() {
    // Auth buttons
    loginBtn.addEventListener('click', handleLogin);
    signupBtn.addEventListener('click', handleSignup);
    googleAuthBtn.addEventListener('click', handleGoogleAuth);
    guestBtn.addEventListener('click', handleGuestAuth);
    logoutBtn.addEventListener('click', handleLogout);

    // Navigation buttons
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            showSection(section);
        });
    });

    // Add buttons
    addContactBtn.addEventListener('click', () => showModal('contact'));
    addPioneerBtn.addEventListener('click', () => showModal('pioneer'));
    addPublisherBtn.addEventListener('click', () => showModal('publisher'));

    // Form submissions
    contactForm.addEventListener('submit', handleContactSubmit);
    pioneerForm.addEventListener('submit', handlePioneerSubmit);
    publisherForm.addEventListener('submit', handlePublisherSubmit);

    // Search functionality
    contactSearch.addEventListener('input', () => filterContacts(contactSearch.value));
    pioneerSearch.addEventListener('input', () => filterPioneerRecords(pioneerSearch.value));
    publisherSearch.addEventListener('input', () => filterPublisherRecords(publisherSearch.value));

    // Stats buttons
    pioneerStatsBtn.addEventListener('click', () => showStats('pioneer'));
    publisherStatsBtn.addEventListener('click', () => showStats('publisher'));
    shareWhatsappBtn.addEventListener('click', shareStatsViaWhatsApp);

    // Close modals
    closeBtns.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    cancelBtns.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
}

// Auth handlers
async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        showNotification('Login successful!', 'success');
        authMessage.textContent = '';
    } catch (error) {
        showNotification(error.message, 'error');
        authMessage.textContent = error.message;
        authMessage.style.color = 'red';
    }
}

async function handleSignup() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await auth.createUserWithEmailAndPassword(email, password);
        showNotification('Account created successfully!', 'success');
        authMessage.textContent = '';
    } catch (error) {
        showNotification(error.message, 'error');
        authMessage.textContent = error.message;
        authMessage.style.color = 'red';
    }
}

async function handleGoogleAuth() {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    try {
        await auth.signInWithPopup(provider);
        showNotification('Google login successful!', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
        authMessage.textContent = error.message;
        authMessage.style.color = 'red';
    }
}

function handleGuestAuth() {
    // Sign in anonymously
    auth.signInAnonymously()
        .then(() => {
            showNotification('Guest session started', 'success');
            authMessage.textContent = '';
        })
        .catch(error => {
            showNotification(error.message, 'error');
            authMessage.textContent = error.message;
            authMessage.style.color = 'red';
        });
}

function handleLogout() {
    auth.signOut()
        .then(() => {
            showNotification('Logged out successfully', 'success');
        })
        .catch(error => {
            showNotification(error.message, 'error');
        });
}

// UI functions
function showAuthSection() {
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
}

function showAppSection() {
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');

    // Update user info
    if (currentUser) {
        userName.textContent = currentUser.displayName || currentUser.email || 'Guest User';
        
        if (currentUser.photoURL) {
            userAvatar.src = currentUser.photoURL;
            userAvatar.style.display = 'block';
        } else {
            userAvatar.style.display = 'none';
        }
    }
}

function showSection(section) {
    // Update active nav button
    navBtns.forEach(btn => {
        if (btn.dataset.section === section) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Show the selected section
    contentSections.forEach(sec => {
        if (sec.id === `${section}-section`) {
            sec.classList.remove('hidden');
            currentSection = section;
        } else {
            sec.classList.add('hidden');
        }
    });
}

function showModal(type) {
    editingId = null;
    
    switch (type) {
        case 'contact':
            document.getElementById('contact-modal-title').textContent = 'Add New Contact';
            contactForm.reset();
            contactModal.classList.remove('hidden');
            break;
        case 'pioneer':
            document.getElementById('pioneer-modal-title').textContent = 'Add Pioneer Record';
            pioneerForm.reset();
            document.getElementById('pioneer-date').valueAsDate = new Date();
            pioneerModal.classList.remove('hidden');
            break;
        case 'publisher':
            document.getElementById('publisher-modal-title').textContent = 'Add Publisher Record';
            publisherForm.reset();
            document.getElementById('publisher-date').valueAsDate = new Date();
            publisherModal.classList.remove('hidden');
            break;
    }
}

function showEditModal(type, id) {
    editingId = id;
    
    switch (type) {
        case 'contact':
            const contact = contacts.find(c => c.id === id);
            if (contact) {
                document.getElementById('contact-modal-title').textContent = 'Edit Contact';
                document.getElementById('contact-name').value = contact.name;
                document.getElementById('contact-phone').value = contact.phone || '';
                document.getElementById('contact-address').value = contact.address || '';
                document.getElementById('contact-publication').value = contact.publication || '';
                document.getElementById('contact-date').value = contact.visitDate || '';
                document.getElementById('contact-time').value = contact.visitTime || '';
                document.getElementById('contact-status').value = contact.status || 'pending';
                document.getElementById('contact-notes').value = contact.notes || '';
                contactModal.classList.remove('hidden');
            }
            break;
        case 'pioneer':
            const pioneerRecord = pioneerRecords.find(r => r.id === id);
            if (pioneerRecord) {
                document.getElementById('pioneer-modal-title').textContent = 'Edit Pioneer Record';
                document.getElementById('pioneer-date').value = pioneerRecord.date;
                document.getElementById('pioneer-hours').value = pioneerRecord.hours;
                document.getElementById('pioneer-minutes').value = pioneerRecord.minutes || 0;
                document.getElementById('pioneer-studies').value = pioneerRecord.studies || 0;
                document.getElementById('pioneer-return-visits').value = pioneerRecord.returnVisits || 0;
                document.getElementById('pioneer-notes').value = pioneerRecord.notes || '';
                pioneerModal.classList.remove('hidden');
            }
            break;
        case 'publisher':
            const publisherRecord = publisherRecords.find(r => r.id === id);
            if (publisherRecord) {
                document.getElementById('publisher-modal-title').textContent = 'Edit Publisher Record';
                document.getElementById('publisher-date').value = publisherRecord.date;
                document.getElementById('publisher-studies').value = publisherRecord.studies || 0;
                document.getElementById('publisher-participated').value = publisherRecord.participated ? 'yes' : 'no';
                document.getElementById('publisher-notes').value = publisherRecord.notes || '';
                publisherModal.classList.remove('hidden');
            }
            break;
    }
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
}

function showNotification(message, type) {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// Data handling functions
function loadUserData() {
    if (!currentUser) return;

    const userId = currentUser.uid;
    
    // Load contacts
    db.collection('users').doc(userId).collection('contacts')
        .orderBy('name')
        .onSnapshot(snapshot => {
            contacts = [];
            snapshot.forEach(doc => {
                contacts.push({ id: doc.id, ...doc.data() });
            });
            renderContacts();
        }, error => {
            console.error("Error loading contacts: ", error);
        });

    // Load pioneer records
    db.collection('users').doc(userId).collection('pioneerRecords')
        .orderBy('date', 'desc')
        .onSnapshot(snapshot => {
            pioneerRecords = [];
            snapshot.forEach(doc => {
                pioneerRecords.push({ id: doc.id, ...doc.data() });
            });
            renderPioneerRecords();
        }, error => {
            console.error("Error loading pioneer records: ", error);
        });

    // Load publisher records
    db.collection('users').doc(userId).collection('publisherRecords')
        .orderBy('date', 'desc')
        .onSnapshot(snapshot => {
            publisherRecords = [];
            snapshot.forEach(doc => {
                publisherRecords.push({ id: doc.id, ...doc.data() });
            });
            renderPublisherRecords();
        }, error => {
            console.error("Error loading publisher records: ", error);
        });
}

// Form handlers
function handleContactSubmit(e) {
    e.preventDefault();
    
    const contactData = {
        name: document.getElementById('contact-name').value,
        phone: document.getElementById('contact-phone').value,
        address: document.getElementById('contact-address').value,
        publication: document.getElementById('contact-publication').value,
        visitDate: document.getElementById('contact-date').value,
        visitTime: document.getElementById('contact-time').value,
        status: document.getElementById('contact-status').value,
        notes: document.getElementById('contact-notes').value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const userId = currentUser.uid;
    
    if (editingId) {
        // Update existing contact
        db.collection('users').doc(userId).collection('contacts').doc(editingId)
            .update(contactData)
            .then(() => {
                showNotification('Contact updated successfully!', 'success');
                closeModal();
            })
            .catch(error => {
                showNotification('Error updating contact: ' + error.message, 'error');
                console.error("Error updating contact: ", error);
            });
    } else {
        // Add new contact
        db.collection('users').doc(userId).collection('contacts')
            .add(contactData)
            .then(() => {
                showNotification('Contact added successfully!', 'success');
                closeModal();
            })
            .catch(error => {
                showNotification('Error adding contact: ' + error.message, 'error');
                console.error("Error adding contact: ", error);
            });
    }
}

function handlePioneerSubmit(e) {
    e.preventDefault();
    
    const pioneerData = {
        date: document.getElementById('pioneer-date').value,
        hours: parseFloat(document.getElementById('pioneer-hours').value),
        minutes: parseInt(document.getElementById('pioneer-minutes').value) || 0,
        studies: parseInt(document.getElementById('pioneer-studies').value) || 0,
        returnVisits: parseInt(document.getElementById('pioneer-return-visits').value) || 0,
        notes: document.getElementById('pioneer-notes').value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const userId = currentUser.uid;
    
    if (editingId) {
        // Update existing record
        db.collection('users').doc(userId).collection('pioneerRecords').doc(editingId)
            .update(pioneerData)
            .then(() => {
                showNotification('Pioneer record updated successfully!', 'success');
                closeModal();
            })
            .catch(error => {
                showNotification('Error updating pioneer record: ' + error.message, 'error');
                console.error("Error updating pioneer record: ", error);
            });
    } else {
        // Add new record
        db.collection('users').doc(userId).collection('pioneerRecords')
            .add(pioneerData)
            .then(() => {
                showNotification('Pioneer record added successfully!', 'success');
                closeModal();
            })
            .catch(error => {
                showNotification('Error adding pioneer record: ' + error.message, 'error');
                console.error("Error adding pioneer record: ", error);
            });
    }
}

function handlePublisherSubmit(e) {
    e.preventDefault();
    
    const publisherData = {
        date: document.getElementById('publisher-date').value,
        studies: parseInt(document.getElementById('publisher-studies').value) || 0,
        participated: document.getElementById('publisher-participated').value === 'yes',
        notes: document.getElementById('publisher-notes').value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const userId = currentUser.uid;
    
    if (editingId) {
        // Update existing record
        db.collection('users').doc(userId).collection('publisherRecords').doc(editingId)
            .update(publisherData)
            .then(() => {
                showNotification('Publisher record updated successfully!', 'success');
                closeModal();
            })
            .catch(error => {
                showNotification('Error updating publisher record: ' + error.message, 'error');
                console.error("Error updating publisher record: ", error);
            });
    } else {
        // Add new record
        db.collection('users').doc(userId).collection('publisherRecords')
            .add(publisherData)
            .then(() => {
                showNotification('Publisher record added successfully!', 'success');
                closeModal();
            })
            .catch(error => {
                showNotification('Error adding publisher record: ' + error.message, 'error');
                console.error("Error adding publisher record: ", error);
            });
    }
}

// Render functions
function renderContacts(filteredContacts = null) {
    const dataToRender = filteredContacts || contacts;
    
    if (dataToRender.length === 0) {
        contactsList.innerHTML = '<p class="no-data">No contacts found. Add your first contact!</p>';
        return;
    }

    contactsList.innerHTML = '';
    
    dataToRender.forEach(contact => {
        const contactEl = document.createElement('div');
        contactEl.className = 'contact-item';
        contactEl.innerHTML = `
            <div class="contact-info">
                <h3>${contact.name}</h3>
                ${contact.phone ? `<p><i class="fas fa-phone"></i> ${contact.phone}</p>` : ''}
                ${contact.address ? `<p><i class="fas fa-map-marker-alt"></i> ${contact.address}</p>` : ''}
                ${contact.publication ? `<p><i class="fas fa-book"></i> ${contact.publication}</p>` : ''}
                ${contact.visitDate ? `<p><i class="far fa-calendar-alt"></i> ${formatDate(contact.visitDate)} ${contact.visitTime ? `at ${contact.visitTime}` : ''}</p>` : ''}
                ${contact.status ? `<p class="status ${contact.status}"><i class="fas fa-circle"></i> ${formatStatus(contact.status)}</p>` : ''}
                ${contact.notes ? `<p class="notes"><i class="fas fa-sticky-note"></i> ${contact.notes}</p>` : ''}
            </div>
            <div class="contact-actions">
                <button class="edit-btn" data-id="${contact.id}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" data-id="${contact.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        contactsList.appendChild(contactEl);
    });

    // Add event listeners to action buttons
    document.querySelectorAll('.contact-actions .edit-btn').forEach(btn => {
        btn.addEventListener('click', () => showEditModal('contact', btn.dataset.id));
    });

    document.querySelectorAll('.contact-actions .delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteRecord('contact', btn.dataset.id));
    });
}

function renderPioneerRecords(filteredRecords = null) {
    const dataToRender = filteredRecords || pioneerRecords;
    
    if (dataToRender.length === 0) {
        pioneerList.innerHTML = '<p class="no-data">No pioneer records found. Add your first record!</p>';
        return;
    }

    pioneerList.innerHTML = '';
    
    dataToRender.forEach(record => {
        const totalMinutes = (record.hours * 60) + (record.minutes || 0);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        const recordEl = document.createElement('div');
        recordEl.className = 'record-item';
        recordEl.innerHTML = `
            <div class="record-info">
                <h3>${formatDate(record.date)}</h3>
                <p><i class="fas fa-clock"></i> Time: ${hours}h ${minutes}m</p>
                ${record.studies ? `<p><i class="fas fa-book-open"></i> Studies: ${record.studies}</p>` : ''}
                ${record.returnVisits ? `<p><i class="fas fa-undo"></i> Return Visits: ${record.returnVisits}</p>` : ''}
                ${record.notes ? `<p class="notes"><i class="fas fa-sticky-note"></i> ${record.notes}</p>` : ''}
            </div>
            <div class="record-actions">
                <button class="edit-btn" data-id="${record.id}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" data-id="${record.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        pioneerList.appendChild(recordEl);
    });

    // Add event listeners to action buttons
    document.querySelectorAll('.record-actions .edit-btn').forEach(btn => {
        btn.addEventListener('click', () => showEditModal('pioneer', btn.dataset.id));
    });

    document.querySelectorAll('.record-actions .delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteRecord('pioneer', btn.dataset.id));
    });
}

function renderPublisherRecords(filteredRecords = null) {
    const dataToRender = filteredRecords || publisherRecords;
    
    if (dataToRender.length === 0) {
        publisherList.innerHTML = '<p class="no-data">No publisher records found. Add your first record!</p>';
        return;
    }

    publisherList.innerHTML = '';
    
    dataToRender.forEach(record => {
        const recordEl = document.createElement('div');
        recordEl.className = 'record-item';
        recordEl.innerHTML = `
            <div class="record-info">
                <h3>${formatDate(record.date)}</h3>
                <p><i class="fas fa-check-circle"></i> Participated: ${record.participated ? 'Yes' : 'No'}</p>
                ${record.studies ? `<p><i class="fas fa-book-open"></i> Studies: ${record.studies}</p>` : ''}
                ${record.notes ? `<p class="notes"><i class="fas fa-sticky-note"></i> ${record.notes}</p>` : ''}
            </div>
            <div class="record-actions">
                <button class="edit-btn" data-id="${record.id}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" data-id="${record.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        publisherList.appendChild(recordEl);
    });

    // Add event listeners to action buttons
    document.querySelectorAll('.record-actions .edit-btn').forEach(btn => {
        btn.addEventListener('click', () => showEditModal('publisher', btn.dataset.id));
    });

    document.querySelectorAll('.record-actions .delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteRecord('publisher', btn.dataset.id));
    });
}

// Filter functions
function filterContacts(searchTerm) {
    if (!searchTerm) {
        renderContacts();
        return;
    }
    
    const filtered = contacts.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.phone && contact.phone.includes(searchTerm)) ||
        (contact.address && contact.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contact.publication && contact.publication.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    renderContacts(filtered);
}

function filterPioneerRecords(searchTerm) {
    if (!searchTerm) {
        renderPioneerRecords();
        return;
    }
    
    const filtered = pioneerRecords.filter(record => 
        formatDate(record.date).includes(searchTerm) ||
        (record.notes && record.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    renderPioneerRecords(filtered);
}

function filterPublisherRecords(searchTerm) {
    if (!searchTerm) {
        renderPublisherRecords();
        return;
    }
    
    const filtered = publisherRecords.filter(record => 
        formatDate(record.date).includes(searchTerm) ||
        (record.notes && record.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    renderPublisherRecords(filtered);
}

// Delete record
function deleteRecord(type, id) {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    const userId = currentUser.uid;
    let collectionName = '';
    
    switch (type) {
        case 'contact':
            collectionName = 'contacts';
            break;
        case 'pioneer':
            collectionName = 'pioneerRecords';
            break;
        case 'publisher':
            collectionName = 'publisherRecords';
            break;
    }
    
    db.collection('users').doc(userId).collection(collectionName).doc(id).delete()
        .then(() => {
            showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} record deleted`, 'success');
        })
        .catch(error => {
            showNotification(`Error deleting ${type} record: ${error.message}`, 'error');
            console.error(`Error deleting ${type} record: `, error);
        });
}

// Stats functions
function showStats(type) {
    const records = type === 'pioneer' ? pioneerRecords : publisherRecords;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Filter records for current month
    const monthlyRecords = records.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });
    
    // Calculate stats
    let statsHTML = '';
    
    if (type === 'pioneer') {
        let totalHours = 0;
        let totalMinutes = 0;
        let totalStudies = 0;
        let totalReturnVisits = 0;
        let daysInService = 0;
        
        monthlyRecords.forEach(record => {
            totalHours += record.hours || 0;
            totalMinutes += record.minutes || 0;
            totalStudies += record.studies || 0;
            totalReturnVisits += record.returnVisits || 0;
            daysInService++;
        });
        
        // Convert extra minutes to hours
        totalHours += Math.floor(totalMinutes / 60);
        totalMinutes = totalMinutes % 60;
        
        statsHTML = `
            <h3>Pioneer Statistics for ${currentDate.toLocaleString('default', { month: 'long' })} ${currentYear}</h3>
            <div class="stat-item">
                <span class="stat-label">Total Hours:</span>
                <span class="stat-value">${totalHours}h ${totalMinutes}m</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Average Daily Hours:</span>
                <span class="stat-value">${daysInService > 0 ? (totalHours / daysInService).toFixed(1) : 0}h</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Bible Studies:</span>
                <span class="stat-value">${totalStudies}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Return Visits:</span>
                <span class="stat-value">${totalReturnVisits}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Days in Service:</span>
                <span class="stat-value">${daysInService}</span>
            </div>
        `;
    } else {
        let totalStudies = 0;
        let daysParticipated = 0;
        let totalDays = monthlyRecords.length;
        
        monthlyRecords.forEach(record => {
            totalStudies += record.studies || 0;
            if (record.participated) daysParticipated++;
        });
        
        statsHTML = `
            <h3>Publisher Statistics for ${currentDate.toLocaleString('default', { month: 'long' })} ${currentYear}</h3>
            <div class="stat-item">
                <span class="stat-label">Bible Studies:</span>
                <span class="stat-value">${totalStudies}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Days Participated:</span>
                <span class="stat-value">${daysParticipated} of ${totalDays}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Participation Rate:</span>
                <span class="stat-value">${totalDays > 0 ? Math.round((daysParticipated / totalDays) * 100) : 0}%</span>
            </div>
        `;
    }
    
    document.getElementById('stats-modal-title').textContent = `${type === 'pioneer' ? 'Pioneer' : 'Publisher'} Statistics`;
    statsContainer.innerHTML = statsHTML;
    statsModal.classList.remove('hidden');
}

function shareStatsViaWhatsApp() {
    const statsText = statsContainer.innerText;
    const shareText = `My Ministry Statistics:\n\n${statsText}\n\nShared via JW Ministry Assistant`;
    const encodedText = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatStatus(status) {
    const statusMap = {
        'pending': 'Pending',
        'completed': 'Completed',
        'not-interested': 'Not Interested'
    };
    
    return statusMap[status] || status;
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

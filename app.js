// app.js
document.addEventListener('DOMContentLoaded', function() {
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

    // Section Navigation
    const navBtns = document.querySelectorAll('.nav-btn');
    const contentSections = document.querySelectorAll('.content-section');

    // Contacts Section
    const contactsSection = document.getElementById('contacts-section');
    const addContactBtn = document.getElementById('add-contact-btn');
    const contactSearch = document.getElementById('contact-search');
    const contactSearchBtn = document.getElementById('contact-search-btn');
    const contactsList = document.getElementById('contacts-list');

    // Pioneer Section
    const pioneerSection = document.getElementById('pioneer-section');
    const addPioneerBtn = document.getElementById('add-pioneer-btn');
    const pioneerSearch = document.getElementById('pioneer-search');
    const pioneerSearchBtn = document.getElementById('pioneer-search-btn');
    const pioneerList = document.getElementById('pioneer-list');
    const pioneerStatsBtn = document.getElementById('pioneer-stats-btn');

    // Publisher Section
    const publisherSection = document.getElementById('publisher-section');
    const addPublisherBtn = document.getElementById('add-publisher-btn');
    const publisherSearch = document.getElementById('publisher-search');
    const publisherSearchBtn = document.getElementById('publisher-search-btn');
    const publisherList = document.getElementById('publisher-list');
    const publisherStatsBtn = document.getElementById('publisher-stats-btn');

    // Modals
    const contactModal = document.getElementById('contact-modal');
    const pioneerModal = document.getElementById('pioneer-modal');
    const publisherModal = document.getElementById('publisher-modal');
    const statsModal = document.getElementById('stats-modal');
    const closeBtns = document.querySelectorAll('.close-btn');
    const cancelBtns = document.querySelectorAll('.cancel-btn');

    // Form Elements
    const contactForm = document.getElementById('contact-form');
    const pioneerForm = document.getElementById('pioneer-form');
    const publisherForm = document.getElementById('publisher-form');

    // State Variables
    let currentUser = null;
    let currentSection = 'contacts';
    let editingContactId = null;
    let editingPioneerId = null;
    let editingPublisherId = null;
    let statsType = 'pioneer';

    // Initialize the app
    init();

    function init() {
        setupEventListeners();
        checkAuthState();
    }

    function setupEventListeners() {
        // Auth Event Listeners
        loginBtn.addEventListener('click', handleLogin);
        signupBtn.addEventListener('click', handleSignup);
        googleAuthBtn.addEventListener('click', handleGoogleAuth);
        guestBtn.addEventListener('click', handleGuestAuth);
        logoutBtn.addEventListener('click', handleLogout);

        // Navigation Event Listeners
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.getAttribute('data-section');
                switchSection(section);
            });
        });

        // Modal Event Listeners
        addContactBtn.addEventListener('click', () => openModal('contact'));
        addPioneerBtn.addEventListener('click', () => openModal('pioneer'));
        addPublisherBtn.addEventListener('click', () => openModal('publisher'));

        pioneerStatsBtn.addEventListener('click', () => {
            statsType = 'pioneer';
            openModal('stats');
            loadStats();
        });

        publisherStatsBtn.addEventListener('click', () => {
            statsType = 'publisher';
            openModal('stats');
            loadStats();
        });

        closeBtns.forEach(btn => {
            btn.addEventListener('click', closeModal);
        });

        cancelBtns.forEach(btn => {
            btn.addEventListener('click', closeModal);
        });

        // Form Event Listeners
        contactForm.addEventListener('submit', handleContactSubmit);
        pioneerForm.addEventListener('submit', handlePioneerSubmit);
        publisherForm.addEventListener('submit', handlePublisherSubmit);

        // Search Event Listeners
        contactSearchBtn.addEventListener('click', () => searchContacts(contactSearch.value));
        contactSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchContacts(contactSearch.value);
        });

        pioneerSearchBtn.addEventListener('click', () => searchPioneerRecords(pioneerSearch.value));
        pioneerSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchPioneerRecords(pioneerSearch.value);
        });

        publisherSearchBtn.addEventListener('click', () => searchPublisherRecords(publisherSearch.value));
        publisherSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchPublisherRecords(publisherSearch.value);
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                closeModal();
            }
        });
    }

    // Authentication Functions
    function checkAuthState() {
        auth.onAuthStateChanged(user => {
            if (user) {
                currentUser = user;
                showAppSection();
                loadUserData();
                loadSectionData(currentSection);
            } else {
                currentUser = null;
                showAuthSection();
            }
        });
    }

    function handleLogin() {
        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            showAuthMessage('Please enter both email and password', 'error');
            return;
        }

        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                showAuthMessage('Login successful!', 'success');
            })
            .catch(error => {
                showAuthMessage(error.message, 'error');
            });
    }

    function handleSignup() {
        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            showAuthMessage('Please enter both email and password', 'error');
            return;
        }

        auth.createUserWithEmailAndPassword(email, password)
            .then(() => {
                showAuthMessage('Account created successfully!', 'success');
            })
            .catch(error => {
                showAuthMessage(error.message, 'error');
            });
    }

    function handleGoogleAuth() {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
            .then(() => {
                showAuthMessage('Google authentication successful!', 'success');
            })
            .catch(error => {
                showAuthMessage(error.message, 'error');
            });
    }

    function handleGuestAuth() {
        auth.signInAnonymously()
            .then(() => {
                showAuthMessage('Guest session started', 'success');
            })
            .catch(error => {
                showAuthMessage(error.message, 'error');
            });
    }

    function handleLogout() {
        auth.signOut()
            .then(() => {
                resetForms();
                editingContactId = null;
                editingPioneerId = null;
                editingPublisherId = null;
            })
            .catch(error => {
                console.error('Logout error:', error);
            });
    }

    function showAuthMessage(message, type) {
        authMessage.textContent = message;
        authMessage.className = 'auth-message';
        authMessage.classList.add(type);
        setTimeout(() => {
            authMessage.textContent = '';
            authMessage.className = 'auth-message';
        }, 5000);
    }

    // UI Functions
    function showAuthSection() {
        authSection.classList.remove('hidden');
        appSection.classList.add('hidden');
        resetForms();
    }

    function showAppSection() {
        authSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        resetForms();
    }

    function loadUserData() {
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

    function switchSection(section) {
        // Update active nav button
        navBtns.forEach(btn => {
            if (btn.getAttribute('data-section') === section) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Hide all sections and show the selected one
        contentSections.forEach(sec => {
            if (sec.id === `${section}-section`) {
                sec.classList.remove('hidden');
            } else {
                sec.classList.add('hidden');
            }
        });

        currentSection = section;
        loadSectionData(section);
    }

    function loadSectionData(section) {
        if (!currentUser) return;

        switch (section) {
            case 'contacts':
                loadContacts();
                break;
            case 'pioneer':
                loadPioneerRecords();
                break;
            case 'publisher':
                loadPublisherRecords();
                break;
        }
    }

    // Modal Functions
    function openModal(type) {
        if (!currentUser) {
            showAuthMessage('Please sign in to perform this action', 'error');
            return;
        }

        switch (type) {
            case 'contact':
                document.getElementById('contact-modal-title').textContent = 
                    editingContactId ? 'Edit Contact' : 'Add New Contact';
                contactModal.classList.remove('hidden');
                break;
            case 'pioneer':
                document.getElementById('pioneer-modal-title').textContent = 
                    editingPioneerId ? 'Edit Pioneer Record' : 'Add Pioneer Record';
                pioneerModal.classList.remove('hidden');
                break;
            case 'publisher':
                document.getElementById('publisher-modal-title').textContent = 
                    editingPublisherId ? 'Edit Publisher Record' : 'Add Publisher Record';
                publisherModal.classList.remove('hidden');
                break;
            case 'stats':
                statsModal.classList.remove('hidden');
                break;
        }
    }

    function closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
        resetForms();
        editingContactId = null;
        editingPioneerId = null;
        editingPublisherId = null;
    }

    function resetForms() {
        contactForm.reset();
        pioneerForm.reset();
        publisherForm.reset();
    }

    // Contacts Functions
    function loadContacts() {
        if (!currentUser) return;

        const userId = currentUser.uid;
        contactsList.innerHTML = '<div class="loading">Loading contacts...</div>';

        db.collection('contacts')
            .where('userId', '==', userId)
            .orderBy('name')
            .get()
            .then(querySnapshot => {
                contactsList.innerHTML = '';
                
                if (querySnapshot.empty) {
                    contactsList.innerHTML = '<div class="empty-message">No contacts found. Add your first contact!</div>';
                    return;
                }

                querySnapshot.forEach(doc => {
                    const contact = doc.data();
                    renderContact(doc.id, contact);
                });
            })
            .catch(error => {
                console.error('Error loading contacts:', error);
                contactsList.innerHTML = '<div class="error-message">Error loading contacts. Please try again.</div>';
            });
    }

    function renderContact(id, contact) {
        const contactElement = document.createElement('div');
        contactElement.className = 'contact-item';
        contactElement.innerHTML = `
            <div class="contact-info">
                <h3>${contact.name}</h3>
                ${contact.phone ? `<p><i class="fas fa-phone"></i> ${contact.phone}</p>` : ''}
                ${contact.address ? `<p><i class="fas fa-map-marker-alt"></i> ${contact.address}</p>` : ''}
                ${contact.publication ? `<p><i class="fas fa-book"></i> ${contact.publication}</p>` : ''}
                ${contact.date ? `<p><i class="far fa-calendar-alt"></i> Next Visit: ${formatDate(contact.date)} at ${contact.time || '--:--'}</p>` : ''}
                ${contact.status ? `<p class="status ${contact.status}"><i class="fas fa-circle"></i> ${formatStatus(contact.status)}</p>` : ''}
                ${contact.notes ? `<p class="notes"><i class="fas fa-sticky-note"></i> ${contact.notes}</p>` : ''}
            </div>
            <div class="contact-actions">
                <button class="edit-btn" data-id="${id}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" data-id="${id}"><i class="fas fa-trash"></i></button>
            </div>
        `;

        contactsList.appendChild(contactElement);

        // Add event listeners to the buttons
        contactElement.querySelector('.edit-btn').addEventListener('click', () => editContact(id));
        contactElement.querySelector('.delete-btn').addEventListener('click', () => deleteContact(id));
    }

    function editContact(id) {
        db.collection('contacts').doc(id).get()
            .then(doc => {
                if (doc.exists) {
                    const contact = doc.data();
                    editingContactId = id;

                    // Fill the form with contact data
                    document.getElementById('contact-name').value = contact.name || '';
                    document.getElementById('contact-phone').value = contact.phone || '';
                    document.getElementById('contact-address').value = contact.address || '';
                    document.getElementById('contact-publication').value = contact.publication || '';
                    document.getElementById('contact-date').value = contact.date || '';
                    document.getElementById('contact-time').value = contact.time || '';
                    document.getElementById('contact-status').value = contact.status || 'pending';
                    document.getElementById('contact-notes').value = contact.notes || '';

                    openModal('contact');
                }
            })
            .catch(error => {
                console.error('Error getting contact:', error);
            });
    }

    function deleteContact(id) {
        if (confirm('Are you sure you want to delete this contact?')) {
            db.collection('contacts').doc(id).delete()
                .then(() => {
                    loadContacts();
                })
                .catch(error => {
                    console.error('Error deleting contact:', error);
                });
        }
    }

    function searchContacts(query) {
        if (!query) {
            loadContacts();
            return;
        }

        const userId = currentUser.uid;
        contactsList.innerHTML = '<div class="loading">Searching contacts...</div>';

        db.collection('contacts')
            .where('userId', '==', userId)
            .orderBy('name')
            .get()
            .then(querySnapshot => {
                contactsList.innerHTML = '';
                let found = false;

                querySnapshot.forEach(doc => {
                    const contact = doc.data();
                    const searchStr = `${contact.name} ${contact.phone} ${contact.address} ${contact.publication} ${contact.notes}`.toLowerCase();
                    
                    if (searchStr.includes(query.toLowerCase())) {
                        renderContact(doc.id, contact);
                        found = true;
                    }
                });

                if (!found) {
                    contactsList.innerHTML = '<div class="empty-message">No contacts match your search.</div>';
                }
            })
            .catch(error => {
                console.error('Error searching contacts:', error);
                contactsList.innerHTML = '<div class="error-message">Error searching contacts. Please try again.</div>';
            });
    }

    function handleContactSubmit(e) {
        e.preventDefault();

        const contactData = {
            userId: currentUser.uid,
            name: document.getElementById('contact-name').value,
            phone: document.getElementById('contact-phone').value,
            address: document.getElementById('contact-address').value,
            publication: document.getElementById('contact-publication').value,
            date: document.getElementById('contact-date').value,
            time: document.getElementById('contact-time').value,
            status: document.getElementById('contact-status').value,
            notes: document.getElementById('contact-notes').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (editingContactId) {
            // Update existing contact
            db.collection('contacts').doc(editingContactId).update(contactData)
                .then(() => {
                    loadContacts();
                    closeModal();
                })
                .catch(error => {
                    console.error('Error updating contact:', error);
                });
        } else {
            // Add new contact
            db.collection('contacts').add(contactData)
                .then(() => {
                    loadContacts();
                    closeModal();
                })
                .catch(error => {
                    console.error('Error adding contact:', error);
                });
        }
    }

    // Pioneer Functions
    function loadPioneerRecords() {
        if (!currentUser) return;

        const userId = currentUser.uid;
        pioneerList.innerHTML = '<div class="loading">Loading pioneer records...</div>';

        db.collection('pioneerRecords')
            .where('userId', '==', userId)
            .orderBy('date', 'desc')
            .get()
            .then(querySnapshot => {
                pioneerList.innerHTML = '';
                
                if (querySnapshot.empty) {
                    pioneerList.innerHTML = '<div class="empty-message">No pioneer records found. Add your first record!</div>';
                    return;
                }

                querySnapshot.forEach(doc => {
                    const record = doc.data();
                    renderPioneerRecord(doc.id, record);
                });
            })
            .catch(error => {
                console.error('Error loading pioneer records:', error);
                pioneerList.innerHTML = '<div class="error-message">Error loading pioneer records. Please try again.</div>';
            });
    }

    function renderPioneerRecord(id, record) {
        const recordElement = document.createElement('div');
        recordElement.className = 'record-item';
        recordElement.innerHTML = `
            <div class="record-info">
                <h3>${formatDate(record.date)}</h3>
                <p><i class="fas fa-clock"></i> Time: ${record.hours || 0} hours ${record.minutes || 0} minutes</p>
                ${record.studies ? `<p><i class="fas fa-book-open"></i> Bible Studies: ${record.studies}</p>` : ''}
                ${record.returnVisits ? `<p><i class="fas fa-home"></i> Return Visits: ${record.returnVisits}</p>` : ''}
                ${record.notes ? `<p class="notes"><i class="fas fa-sticky-note"></i> ${record.notes}</p>` : ''}
            </div>
            <div class="record-actions">
                <button class="edit-btn" data-id="${id}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" data-id="${id}"><i class="fas fa-trash"></i></button>
            </div>
        `;

        pioneerList.appendChild(recordElement);

        // Add event listeners to the buttons
        recordElement.querySelector('.edit-btn').addEventListener('click', () => editPioneerRecord(id));
        recordElement.querySelector('.delete-btn').addEventListener('click', () => deletePioneerRecord(id));
    }

    function editPioneerRecord(id) {
        db.collection('pioneerRecords').doc(id).get()
            .then(doc => {
                if (doc.exists) {
                    const record = doc.data();
                    editingPioneerId = id;

                    // Fill the form with record data
                    document.getElementById('pioneer-date').value = record.date || '';
                    document.getElementById('pioneer-hours').value = record.hours || 0;
                    document.getElementById('pioneer-minutes').value = record.minutes || 0;
                    document.getElementById('pioneer-studies').value = record.studies || 0;
                    document.getElementById('pioneer-return-visits').value = record.returnVisits || 0;
                    document.getElementById('pioneer-notes').value = record.notes || '';

                    openModal('pioneer');
                }
            })
            .catch(error => {
                console.error('Error getting pioneer record:', error);
            });
    }

    function deletePioneerRecord(id) {
        if (confirm('Are you sure you want to delete this pioneer record?')) {
            db.collection('pioneerRecords').doc(id).delete()
                .then(() => {
                    loadPioneerRecords();
                })
                .catch(error => {
                    console.error('Error deleting pioneer record:', error);
                });
        }
    }

    function searchPioneerRecords(query) {
        if (!query) {
            loadPioneerRecords();
            return;
        }

        const userId = currentUser.uid;
        pioneerList.innerHTML = '<div class="loading">Searching pioneer records...</div>';

        db.collection('pioneerRecords')
            .where('userId', '==', userId)
            .orderBy('date', 'desc')
            .get()
            .then(querySnapshot => {
                pioneerList.innerHTML = '';
                let found = false;

                querySnapshot.forEach(doc => {
                    const record = doc.data();
                    const searchStr = `${formatDate(record.date)} ${record.hours} ${record.minutes} ${record.studies} ${record.returnVisits} ${record.notes}`.toLowerCase();
                    
                    if (searchStr.includes(query.toLowerCase())) {
                        renderPioneerRecord(doc.id, record);
                        found = true;
                    }
                });

                if (!found) {
                    pioneerList.innerHTML = '<div class="empty-message">No pioneer records match your search.</div>';
                }
            })
            .catch(error => {
                console.error('Error searching pioneer records:', error);
                pioneerList.innerHTML = '<div class="error-message">Error searching pioneer records. Please try again.</div>';
            });
    }

    function handlePioneerSubmit(e) {
        e.preventDefault();

        const pioneerData = {
            userId: currentUser.uid,
            date: document.getElementById('pioneer-date').value,
            hours: parseFloat(document.getElementById('pioneer-hours').value) || 0,
            minutes: parseInt(document.getElementById('pioneer-minutes').value) || 0,
            studies: parseInt(document.getElementById('pioneer-studies').value) || 0,
            returnVisits: parseInt(document.getElementById('pioneer-return-visits').value) || 0,
            notes: document.getElementById('pioneer-notes').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (editingPioneerId) {
            // Update existing record
            db.collection('pioneerRecords').doc(editingPioneerId).update(pioneerData)
                .then(() => {
                    loadPioneerRecords();
                    closeModal();
                })
                .catch(error => {
                    console.error('Error updating pioneer record:', error);
                });
        } else {
            // Add new record
            db.collection('pioneerRecords').add(pioneerData)
                .then(() => {
                    loadPioneerRecords();
                    closeModal();
                })
                .catch(error => {
                    console.error('Error adding pioneer record:', error);
                });
        }
    }

    // Publisher Functions
    function loadPublisherRecords() {
        if (!currentUser) return;

        const userId = currentUser.uid;
        publisherList.innerHTML = '<div class="loading">Loading publisher records...</div>';

        db.collection('publisherRecords')
            .where('userId', '==', userId)
            .orderBy('date', 'desc')
            .get()
            .then(querySnapshot => {
                publisherList.innerHTML = '';
                
                if (querySnapshot.empty) {
                    publisherList.innerHTML = '<div class="empty-message">No publisher records found. Add your first record!</div>';
                    return;
                }

                querySnapshot.forEach(doc => {
                    const record = doc.data();
                    renderPublisherRecord(doc.id, record);
                });
            })
            .catch(error => {
                console.error('Error loading publisher records:', error);
                publisherList.innerHTML = '<div class="error-message">Error loading publisher records. Please try again.</div>';
            });
    }

    function renderPublisherRecord(id, record) {
        const recordElement = document.createElement('div');
        recordElement.className = 'record-item';
        recordElement.innerHTML = `
            <div class="record-info">
                <h3>${formatDate(record.date)}</h3>
                <p><i class="fas ${record.participated === 'yes' ? 'fa-check-circle success' : 'fa-times-circle error'}"></i> 
                Participated: ${record.participated === 'yes' ? 'Yes' : 'No'}</p>
                ${record.studies ? `<p><i class="fas fa-book-open"></i> Bible Studies: ${record.studies}</p>` : ''}
                ${record.notes ? `<p class="notes"><i class="fas fa-sticky-note"></i> ${record.notes}</p>` : ''}
            </div>
            <div class="record-actions">
                <button class="edit-btn" data-id="${id}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" data-id="${id}"><i class="fas fa-trash"></i></button>
            </div>
        `;

        publisherList.appendChild(recordElement);

        // Add event listeners to the buttons
        recordElement.querySelector('.edit-btn').addEventListener('click', () => editPublisherRecord(id));
        recordElement.querySelector('.delete-btn').addEventListener('click', () => deletePublisherRecord(id));
    }

    function editPublisherRecord(id) {
        db.collection('publisherRecords').doc(id).get()
            .then(doc => {
                if (doc.exists) {
                    const record = doc.data();
                    editingPublisherId = id;

                    // Fill the form with record data
                    document.getElementById('publisher-date').value = record.date || '';
                    document.getElementById('publisher-studies').value = record.studies || 0;
                    document.getElementById('publisher-participated').value = record.participated || 'yes';
                    document.getElementById('publisher-notes').value = record.notes || '';

                    openModal('publisher');
                }
            })
            .catch(error => {
                console.error('Error getting publisher record:', error);
            });
    }

    function deletePublisherRecord(id) {
        if (confirm('Are you sure you want to delete this publisher record?')) {
            db.collection('publisherRecords').doc(id).delete()
                .then(() => {
                    loadPublisherRecords();
                })
                .catch(error => {
                    console.error('Error deleting publisher record:', error);
                });
        }
    }

    function searchPublisherRecords(query) {
        if (!query) {
            loadPublisherRecords();
            return;
        }

        const userId = currentUser.uid;
        publisherList.innerHTML = '<div class="loading">Searching publisher records...</div>';

        db.collection('publisherRecords')
            .where('userId', '==', userId)
            .orderBy('date', 'desc')
            .get()
            .then(querySnapshot => {
                publisherList.innerHTML = '';
                let found = false;

                querySnapshot.forEach(doc => {
                    const record = doc.data();
                    const searchStr = `${formatDate(record.date)} ${record.studies} ${record.participated} ${record.notes}`.toLowerCase();
                    
                    if (searchStr.includes(query.toLowerCase())) {
                        renderPublisherRecord(doc.id, record);
                        found = true;
                    }
                });

                if (!found) {
                    publisherList.innerHTML = '<div class="empty-message">No publisher records match your search.</div>';
                }
            })
            .catch(error => {
                console.error('Error searching publisher records:', error);
                publisherList.innerHTML = '<div class="error-message">Error searching publisher records. Please try again.</div>';
            });
    }

    function handlePublisherSubmit(e) {
        e.preventDefault();

        const publisherData = {
            userId: currentUser.uid,
            date: document.getElementById('publisher-date').value,
            studies: parseInt(document.getElementById('publisher-studies').value) || 0,
            participated: document.getElementById('publisher-participated').value,
            notes: document.getElementById('publisher-notes').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (editingPublisherId) {
            // Update existing record
            db.collection('publisherRecords').doc(editingPublisherId).update(publisherData)
                .then(() => {
                    loadPublisherRecords();
                    closeModal();
                })
                .catch(error => {
                    console.error('Error updating publisher record:', error);
                });
        } else {
            // Add new record
            db.collection('publisherRecords').add(publisherData)
                .then(() => {
                    loadPublisherRecords();
                    closeModal();
                })
                .catch(error => {
                    console.error('Error adding publisher record:', error);
                });
        }
    }

    // Stats Functions
    function loadStats() {
        const userId = currentUser.uid;
        const statsContainer = document.getElementById('stats-container');
        statsContainer.innerHTML = '<div class="loading">Loading statistics...</div>';

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const collectionName = statsType === 'pioneer' ? 'pioneerRecords' : 'publisherRecords';
        const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
        const endDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-31`;

        db.collection(collectionName)
            .where('userId', '==', userId)
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .get()
            .then(querySnapshot => {
                statsContainer.innerHTML = '';
                
                if (querySnapshot.empty) {
                    statsContainer.innerHTML = `<div class="empty-message">No ${statsType} records found for this month.</div>`;
                    return;
                }

                let totalHours = 0;
                let totalMinutes = 0;
                let totalStudies = 0;
                let totalReturnVisits = 0;
                let participationDays = 0;
                const daysParticipated = [];

                querySnapshot.forEach(doc => {
                    const record = doc.data();
                    
                    if (statsType === 'pioneer') {
                        totalHours += parseFloat(record.hours) || 0;
                        totalMinutes += parseInt(record.minutes) || 0;
                        totalStudies += parseInt(record.studies) || 0;
                        totalReturnVisits += parseInt(record.returnVisits) || 0;
                    } else {
                        if (record.participated === 'yes') {
                            participationDays++;
                            daysParticipated.push(formatDate(record.date));
                        }
                        totalStudies += parseInt(record.studies) || 0;
                    }
                });

                // Convert excess minutes to hours
                totalHours += Math.floor(totalMinutes / 60);
                totalMinutes = totalMinutes % 60;

                const statsElement = document.createElement('div');
                statsElement.className = 'stats-content';
                
                if (statsType === 'pioneer') {
                    statsElement.innerHTML = `
                        <h3>${new Date().toLocaleString('default', { month: 'long' })} ${currentYear} Pioneer Report</h3>
                        <div class="stat-item">
                            <span class="stat-label">Total Time:</span>
                            <span class="stat-value">${totalHours} hours ${totalMinutes} minutes</span>
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
                            <span class="stat-label">Days Reported:</span>
                            <span class="stat-value">${querySnapshot.size}</span>
                        </div>
                    `;
                } else {
                    statsElement.innerHTML = `
                        <h3>${new Date().toLocaleString('default', { month: 'long' })} ${currentYear} Publisher Report</h3>
                        <div class="stat-item">
                            <span class="stat-label">Days Participated:</span>
                            <span class="stat-value">${participationDays}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Bible Studies:</span>
                            <span class="stat-value">${totalStudies}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Days Reported:</span>
                            <span class="stat-value">${querySnapshot.size}</span>
                        </div>
                        ${daysParticipated.length > 0 ? `
                        <div class="stat-item">
                            <span class="stat-label">Days:</span>
                            <span class="stat-value">${daysParticipated.join(', ')}</span>
                        </div>
                        ` : ''}
                    `;
                }

                statsContainer.appendChild(statsElement);
            })
            .catch(error => {
                console.error('Error loading statistics:', error);
                statsContainer.innerHTML = '<div class="error-message">Error loading statistics. Please try again.</div>';
            });
    }

    // Utility Functions
    function formatDate(dateString) {
        if (!dateString) return 'No date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function formatStatus(status) {
        const statusMap = {
            'pending': 'Pending',
            'completed': 'Completed',
            'not-interested': 'Not Interested'
        };
        return statusMap[status] || status;
    }
});
// JW Ministry Assistant - Complete JavaScript Implementation
// Note: This version uses in-memory storage for Claude demo
// For production use, replace 'memoryStorage' with 'localStorage'

class MemoryStorage {
    constructor() {
        this.data = {};
    }
    
    setItem(key, value) {
        this.data[key] = value;
    }
    
    getItem(key) {
        return this.data[key] || null;
    }
    
    removeItem(key) {
        delete this.data[key];
    }
    
    clear() {
        this.data = {};
    }
}

// For production, replace this line with: const storage = localStorage;
const storage = new MemoryStorage();

class JWMinistryApp {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'contacts';
        this.contacts = [];
        this.pioneerRecords = [];
        this.publisherRecords = [];
        this.editingIndex = -1;
        this.editingType = '';
        
        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
        this.checkAuth();
    }

    // Authentication Methods
    checkAuth() {
        const savedUser = storage.getItem('jw_current_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showApp();
        } else {
            this.showAuth();
        }
    }

    login(email, password) {
        // Simple authentication simulation
        if (email && password) {
            this.currentUser = {
                email: email,
                name: email.split('@')[0],
                avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=007bff&color=fff`
            };
            storage.setItem('jw_current_user', JSON.stringify(this.currentUser));
            this.showApp();
            return true;
        }
        return false;
    }

    signup(email, password) {
        // Simple signup simulation
        return this.login(email, password);
    }

    loginAsGuest() {
        this.currentUser = {
            email: 'guest@local',
            name: 'Guest User',
            avatar: `https://ui-avatars.com/api/?name=Guest&background=6c757d&color=fff`
        };
        storage.setItem('jw_current_user', JSON.stringify(this.currentUser));
        this.showApp();
    }

    logout() {
        this.currentUser = null;
        storage.removeItem('jw_current_user');
        this.showAuth();
    }

    showAuth() {
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('app-section').classList.add('hidden');
    }

    showApp() {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('app-section').classList.remove('hidden');
        
        if (this.currentUser) {
            document.getElementById('user-name').textContent = this.currentUser.name;
            document.getElementById('user-avatar').src = this.currentUser.avatar;
        }
        
        this.loadSection(this.currentSection);
    }

    // Data Management
    loadData() {
        const contactsData = storage.getItem('jw_contacts');
        if (contactsData) {
            this.contacts = JSON.parse(contactsData);
        }

        const pioneerData = storage.getItem('jw_pioneer_records');
        if (pioneerData) {
            this.pioneerRecords = JSON.parse(pioneerData);
        }

        const publisherData = storage.getItem('jw_publisher_records');
        if (publisherData) {
            this.publisherRecords = JSON.parse(publisherData);
        }
    }

    saveData() {
        storage.setItem('jw_contacts', JSON.stringify(this.contacts));
        storage.setItem('jw_pioneer_records', JSON.stringify(this.pioneerRecords));
        storage.setItem('jw_publisher_records', JSON.stringify(this.publisherRecords));
    }

    // Contact Management
    addContact(contactData) {
        const contact = {
            id: Date.now().toString(),
            name: contactData.name,
            phone: contactData.phone,
            address: contactData.address,
            publication: contactData.publication,
            returnVisitDate: contactData.returnVisitDate,
            returnVisitTime: contactData.returnVisitTime,
            status: contactData.status,
            notes: contactData.notes,
            createdAt: new Date().toISOString()
        };

        if (this.editingIndex >= 0) {
            this.contacts[this.editingIndex] = { ...contact, id: this.contacts[this.editingIndex].id };
        } else {
            this.contacts.push(contact);
        }

        this.saveData();
        this.renderContacts();
        this.closeModal('contact-modal');
        this.resetForm('contact-form');
        this.editingIndex = -1;
    }

    editContact(index) {
        const contact = this.contacts[index];
        this.editingIndex = index;
        
        document.getElementById('contact-name').value = contact.name || '';
        document.getElementById('contact-phone').value = contact.phone || '';
        document.getElementById('contact-address').value = contact.address || '';
        document.getElementById('contact-publication').value = contact.publication || '';
        document.getElementById('contact-date').value = contact.returnVisitDate || '';
        document.getElementById('contact-time').value = contact.returnVisitTime || '';
        document.getElementById('contact-status').value = contact.status || 'pending';
        document.getElementById('contact-notes').value = contact.notes || '';
        
        document.getElementById('contact-modal-title').textContent = 'Edit Contact';
        this.showModal('contact-modal');
    }

    deleteContact(index) {
        if (confirm('Are you sure you want to delete this contact?')) {
            this.contacts.splice(index, 1);
            this.saveData();
            this.renderContacts();
        }
    }

    renderContacts() {
        const container = document.getElementById('contacts-list');
        const searchTerm = document.getElementById('contact-search').value.toLowerCase();
        
        const filteredContacts = this.contacts.filter(contact =>
            contact.name.toLowerCase().includes(searchTerm) ||
            contact.phone.includes(searchTerm) ||
            contact.address.toLowerCase().includes(searchTerm)
        );

        if (filteredContacts.length === 0) {
            container.innerHTML = '<div class="empty-state">No contacts found</div>';
            return;
        }

        container.innerHTML = filteredContacts.map((contact, index) => {
            const originalIndex = this.contacts.indexOf(contact);
            const statusClass = contact.status === 'completed' ? 'completed' : 
                               contact.status === 'not-interested' ? 'not-interested' : 'pending';
            
            return `
                <div class="contact-card">
                    <div class="contact-header">
                        <h3>${contact.name}</h3>
                        <div class="contact-actions">
                            <button onclick="app.editContact(${originalIndex})" class="edit-btn">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="app.deleteContact(${originalIndex})" class="delete-btn">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="contact-details">
                        ${contact.phone ? `<p><i class="fas fa-phone"></i> ${contact.phone}</p>` : ''}
                        ${contact.address ? `<p><i class="fas fa-map-marker-alt"></i> ${contact.address}</p>` : ''}
                        ${contact.publication ? `<p><i class="fas fa-book"></i> ${contact.publication}</p>` : ''}
                        ${contact.returnVisitDate ? `<p><i class="fas fa-calendar"></i> ${contact.returnVisitDate} ${contact.returnVisitTime || ''}</p>` : ''}
                        <p class="status ${statusClass}">
                            <i class="fas fa-circle"></i> ${contact.status || 'pending'}
                        </p>
                        ${contact.notes ? `<p class="notes"><i class="fas fa-sticky-note"></i> ${contact.notes}</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Pioneer Record Management
    addPioneerRecord(recordData) {
        const record = {
            id: Date.now().toString(),
            date: recordData.date,
            hours: parseFloat(recordData.hours || 0),
            minutes: parseInt(recordData.minutes || 0),
            studies: parseInt(recordData.studies || 0),
            returnVisits: parseInt(recordData.returnVisits || 0),
            notes: recordData.notes,
            createdAt: new Date().toISOString()
        };

        if (this.editingIndex >= 0) {
            this.pioneerRecords[this.editingIndex] = { ...record, id: this.pioneerRecords[this.editingIndex].id };
        } else {
            this.pioneerRecords.push(record);
        }

        this.saveData();
        this.renderPioneerRecords();
        this.closeModal('pioneer-modal');
        this.resetForm('pioneer-form');
        this.editingIndex = -1;
    }

    editPioneerRecord(index) {
        const record = this.pioneerRecords[index];
        this.editingIndex = index;
        
        document.getElementById('pioneer-date').value = record.date || '';
        document.getElementById('pioneer-hours').value = record.hours || '';
        document.getElementById('pioneer-minutes').value = record.minutes || '';
        document.getElementById('pioneer-studies').value = record.studies || '';
        document.getElementById('pioneer-return-visits').value = record.returnVisits || '';
        document.getElementById('pioneer-notes').value = record.notes || '';
        
        document.getElementById('pioneer-modal-title').textContent = 'Edit Pioneer Record';
        this.showModal('pioneer-modal');
    }

    deletePioneerRecord(index) {
        if (confirm('Are you sure you want to delete this record?')) {
            this.pioneerRecords.splice(index, 1);
            this.saveData();
            this.renderPioneerRecords();
        }
    }

    renderPioneerRecords() {
        const container = document.getElementById('pioneer-list');
        const searchTerm = document.getElementById('pioneer-search').value.toLowerCase();
        
        const filteredRecords = this.pioneerRecords.filter(record =>
            record.date.includes(searchTerm) ||
            record.notes.toLowerCase().includes(searchTerm)
        );

        if (filteredRecords.length === 0) {
            container.innerHTML = '<div class="empty-state">No pioneer records found</div>';
            return;
        }

        container.innerHTML = filteredRecords.map((record, index) => {
            const originalIndex = this.pioneerRecords.indexOf(record);
            const totalMinutes = (record.hours * 60) + record.minutes;
            const displayHours = Math.floor(totalMinutes / 60);
            const displayMinutes = totalMinutes % 60;
            
            return `
                <div class="record-card">
                    <div class="record-header">
                        <h3>${record.date}</h3>
                        <div class="record-actions">
                            <button onclick="app.editPioneerRecord(${originalIndex})" class="edit-btn">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="app.deletePioneerRecord(${originalIndex})" class="delete-btn">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="record-details">
                        <p><i class="fas fa-clock"></i> ${displayHours}h ${displayMinutes}m</p>
                        <p><i class="fas fa-book-open"></i> ${record.studies} Bible Studies</p>
                        <p><i class="fas fa-redo"></i> ${record.returnVisits} Return Visits</p>
                        ${record.notes ? `<p class="notes"><i class="fas fa-sticky-note"></i> ${record.notes}</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Publisher Record Management
    addPublisherRecord(recordData) {
        const record = {
            id: Date.now().toString(),
            date: recordData.date,
            studies: parseInt(recordData.studies || 0),
            participated: recordData.participated === 'yes',
            notes: recordData.notes,
            createdAt: new Date().toISOString()
        };

        if (this.editingIndex >= 0) {
            this.publisherRecords[this.editingIndex] = { ...record, id: this.publisherRecords[this.editingIndex].id };
        } else {
            this.publisherRecords.push(record);
        }

        this.saveData();
        this.renderPublisherRecords();
        this.closeModal('publisher-modal');
        this.resetForm('publisher-form');
        this.editingIndex = -1;
    }

    editPublisherRecord(index) {
        const record = this.publisherRecords[index];
        this.editingIndex = index;
        
        document.getElementById('publisher-date').value = record.date || '';
        document.getElementById('publisher-studies').value = record.studies || '';
        document.getElementById('publisher-participated').value = record.participated ? 'yes' : 'no';
        document.getElementById('publisher-notes').value = record.notes || '';
        
        document.getElementById('publisher-modal-title').textContent = 'Edit Publisher Record';
        this.showModal('publisher-modal');
    }

    deletePublisherRecord(index) {
        if (confirm('Are you sure you want to delete this record?')) {
            this.publisherRecords.splice(index, 1);
            this.saveData();
            this.renderPublisherRecords();
        }
    }

    renderPublisherRecords() {
        const container = document.getElementById('publisher-list');
        const searchTerm = document.getElementById('publisher-search').value.toLowerCase();
        
        const filteredRecords = this.publisherRecords.filter(record =>
            record.date.includes(searchTerm) ||
            record.notes.toLowerCase().includes(searchTerm)
        );

        if (filteredRecords.length === 0) {
            container.innerHTML = '<div class="empty-state">No publisher records found</div>';
            return;
        }

        container.innerHTML = filteredRecords.map((record, index) => {
            const originalIndex = this.publisherRecords.indexOf(record);
            
            return `
                <div class="record-card">
                    <div class="record-header">
                        <h3>${record.date}</h3>
                        <div class="record-actions">
                            <button onclick="app.editPublisherRecord(${originalIndex})" class="edit-btn">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="app.deletePublisherRecord(${originalIndex})" class="delete-btn">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="record-details">
                        <p><i class="fas fa-book-open"></i> ${record.studies} Bible Studies</p>
                        <p><i class="fas fa-user-check"></i> Participated: ${record.participated ? 'Yes' : 'No'}</p>
                        ${record.notes ? `<p class="notes"><i class="fas fa-sticky-note"></i> ${record.notes}</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Statistics
    showStats(type) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        let records, title;
        if (type === 'pioneer') {
            records = this.pioneerRecords;
            title = 'Pioneer Statistics';
        } else {
            records = this.publisherRecords;
            title = 'Publisher Statistics';
        }

        const monthlyRecords = records.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
        });

        document.getElementById('stats-modal-title').textContent = title;
        
        let statsHTML = `<div class="stats-grid">`;
        
        if (type === 'pioneer') {
            const totalHours = monthlyRecords.reduce((total, record) => 
                total + (record.hours * 60) + record.minutes, 0);
            const displayHours = Math.floor(totalHours / 60);
            const displayMinutes = totalHours % 60;
            const totalStudies = monthlyRecords.reduce((total, record) => total + record.studies, 0);
            const totalReturnVisits = monthlyRecords.reduce((total, record) => total + record.returnVisits, 0);
            
            statsHTML += `
                <div class="stat-card">
                    <div class="stat-value">${displayHours}h ${displayMinutes}m</div>
                    <div class="stat-label">Total Hours</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${totalStudies}</div>
                    <div class="stat-label">Bible Studies</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${totalReturnVisits}</div>
                    <div class="stat-label">Return Visits</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${monthlyRecords.length}</div>
                    <div class="stat-label">Days in Service</div>
                </div>
            `;
        } else {
            const totalStudies = monthlyRecords.reduce((total, record) => total + record.studies, 0);
            const participationDays = monthlyRecords.filter(record => record.participated).length;
            
            statsHTML += `
                <div class="stat-card">
                    <div class="stat-value">${totalStudies}</div>
                    <div class="stat-label">Bible Studies</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${participationDays}</div>
                    <div class="stat-label">Days Participated</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${monthlyRecords.length}</div>
                    <div class="stat-label">Total Records</div>
                </div>
            `;
        }
        
        statsHTML += `</div>`;
        
        document.getElementById('stats-container').innerHTML = statsHTML;
        this.showModal('stats-modal');
    }

    shareStats() {
        const statsText = document.getElementById('stats-container').textContent;
        const shareText = `JW Ministry Report\n\n${statsText}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Ministry Report',
                text: shareText
            });
        } else {
            // Fallback for WhatsApp
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
            window.open(whatsappUrl, '_blank');
        }
    }

    // UI Management
    loadSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Remove active class from all nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected section
        document.getElementById(`${sectionName}-section`).classList.remove('hidden');
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
        
        this.currentSection = sectionName;
        
        // Load appropriate data
        switch(sectionName) {
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

    showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }

    resetForm(formId) {
        document.getElementById(formId).reset();
    }

    showMessage(message, type = 'info') {
        const messageEl = document.getElementById('auth-message');
        messageEl.textContent = message;
        messageEl.className = `auth-message ${type}`;
        setTimeout(() => {
            messageEl.textContent = '';
            messageEl.className = 'auth-message';
        }, 3000);
    }

    // Event Binding
    bindEvents() {
        // Auth events
        document.getElementById('login-btn').addEventListener('click', () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (this.login(email, password)) {
                this.showMessage('Login successful!', 'success');
            } else {
                this.showMessage('Please enter valid credentials', 'error');
            }
        });

        document.getElementById('signup-btn').addEventListener('click', () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (this.signup(email, password)) {
                this.showMessage('Account created successfully!', 'success');
            } else {
                this.showMessage('Please enter valid credentials', 'error');
            }
        });

        document.getElementById('guest-btn').addEventListener('click', () => {
            this.loginAsGuest();
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Navigation events
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.loadSection(btn.dataset.section);
            });
        });

        // Modal events
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.closeModal(modal.id);
                this.editingIndex = -1;
            });
        });

        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.closeModal(modal.id);
                this.editingIndex = -1;
            });
        });

        // Add buttons
        document.getElementById('add-contact-btn').addEventListener('click', () => {
            this.editingIndex = -1;
            document.getElementById('contact-modal-title').textContent = 'Add New Contact';
            this.resetForm('contact-form');
            this.showModal('contact-modal');
        });

        document.getElementById('add-pioneer-btn').addEventListener('click', () => {
            this.editingIndex = -1;
            document.getElementById('pioneer-modal-title').textContent = 'Add Pioneer Record';
            this.resetForm('pioneer-form');
            this.showModal('pioneer-modal');
        });

        document.getElementById('add-publisher-btn').addEventListener('click', () => {
            this.editingIndex = -1;
            document.getElementById('publisher-modal-title').textContent = 'Add Publisher Record';
            this.resetForm('publisher-form');
            this.showModal('publisher-modal');
        });

        // Stats buttons
        document.getElementById('pioneer-stats-btn').addEventListener('click', () => {
            this.showStats('pioneer');
        });

        document.getElementById('publisher-stats-btn').addEventListener('click', () => {
            this.showStats('publisher');
        });

        document.getElementById('share-whatsapp-btn').addEventListener('click', () => {
            this.shareStats();
        });

        // Search events
        document.getElementById('contact-search').addEventListener('input', () => {
            this.renderContacts();
        });

        document.getElementById('pioneer-search').addEventListener('input', () => {
            this.renderPioneerRecords();
        });

        document.getElementById('publisher-search').addEventListener('input', () => {
            this.renderPublisherRecords();
        });

        // Form submissions
        document.getElementById('contact-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const contactData = {
                name: formData.get('contact-name') || document.getElementById('contact-name').value,
                phone: formData.get('contact-phone') || document.getElementById('contact-phone').value,
                address: formData.get('contact-address') || document.getElementById('contact-address').value,
                publication: formData.get('contact-publication') || document.getElementById('contact-publication').value,
                returnVisitDate: formData.get('contact-date') || document.getElementById('contact-date').value,
                returnVisitTime: formData.get('contact-time') || document.getElementById('contact-time').value,
                status: formData.get('contact-status') || document.getElementById('contact-status').value,
                notes: formData.get('contact-notes') || document.getElementById('contact-notes').value
            };
            this.addContact(contactData);
        });

        document.getElementById('pioneer-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const recordData = {
                date: formData.get('pioneer-date') || document.getElementById('pioneer-date').value,
                hours: formData.get('pioneer-hours') || document.getElementById('pioneer-hours').value,
                minutes: formData.get('pioneer-minutes') || document.getElementById('pioneer-minutes').value,
                studies: formData.get('pioneer-studies') || document.getElementById('pioneer-studies').value,
                returnVisits: formData.get('pioneer-return-visits') || document.getElementById('pioneer-return-visits').value,
                notes: formData.get('pioneer-notes') || document.getElementById('pioneer-notes').value
            };
            this.addPioneerRecord(recordData);
        });

        document.getElementById('publisher-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const recordData = {
                date: formData.get('publisher-date') || document.getElementById('publisher-date').value,
                studies: formData.get('publisher-studies') || document.getElementById('publisher-studies').value,
                participated: formData.get('publisher-participated') || document.getElementById('publisher-participated').value,
                notes: formData.get('publisher-notes') || document.getElementById('publisher-notes').value
            };
            this.addPublisherRecord(recordData);
        });

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
                this.editingIndex = -1;
            }
        });
    }
}

// Initialize the app
const app = new JWMinistryApp();

// Service Worker for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

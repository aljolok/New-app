// Wait for Firebase services to be attached to the window object
const checkFirebase = setInterval(() => {
    if (window.firebaseServices) {
        clearInterval(checkFirebase);
        main();
    }
}, 100);

function main() {
    // --- Destructure all needed functions from the global object ---
    const { 
        initializeApp, getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInAnonymously, signOut,
        getFirestore, collection, doc, addDoc, deleteDoc, onSnapshot, orderBy, query, serverTimestamp,
    } = window.firebaseServices;

    // --- App Setup ---
    const appContainer = document.getElementById('app-container');
    const modalContainer = document.getElementById('modal-container');
    let app, auth, db;

    const state = { user: null, expenses: [], categories: [], currentPage: 'daily', isEditing: null, unsubscribe: [] };
    
    function setState(newState) {
        Object.assign(state, newState);
        render();
    }

    // --- UTILS ---
    const formatCurrency = (amount) => new Intl.NumberFormat('ar-AE', { style: 'currency', currency: 'AED' }).format(amount || 0);
    const escapeHTML = (str) => str ? String(str).replace(/[&<>'"]/g, tag => ({'&':'&','<':'<','>':'>',"'":''','"':'"'}[tag]||tag)) : '';

    // --- UI RENDERING ---
    function createAuthScreen() { return `<div class="screen active" id="auth-screen"><div class="auth-card"><div class="logo"><i data-lucide="wallet"></i></div><h1>المصروفات الذكية</h1><p>تتبع نفقاتك بسهولة وأناقة.</p><div class="auth-buttons"><button id="google-signin-btn" class="btn btn-primary"><i data-lucide="log-in"></i><span>تسجيل الدخول بـ Google</span></button><button id="anon-signin-btn" class="btn btn-secondary"><i data-lucide="user-x"></i><span>التصفح كمجهول</span></button></div></div></div>`; }
    function createMainAppShell({ user, currentPage }) {
        const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xOCAyMHYtMWMwLTIuMi0xLjgtNC00LTRoLTRjLTIuMiAwLTQgMS44LTQgNHYxIi8+PGNpcmNsZSBjeD0iMTIiIGN5PSI3IiByPSI0Ii8+PC9zdmc+";
        return `<div class="screen active" id="main-app"><header class="app-header"><div class="user-profile"><img id="user-avatar" src="${user.photoURL || defaultAvatar}"><div><h2>${user.isAnonymous ? 'مستخدم مجهول' : (user.displayName || 'مستخدم جديد')}</h2></div></div></header><main id="main-content"></main><nav class="app-nav"><button class="nav-btn ${currentPage === 'daily' ? 'active' : ''}" data-page="daily"><i data-lucide="calendar-day"></i><span>يومي</span></button><button class="nav-btn ${currentPage === 'monthly' ? 'active' : ''}" data-page="monthly"><i data-lucide="bar-chart-3"></i><span>شهري</span></button><button id="fab-add-expense" class="nav-fab"><i data-lucide="plus"></i></button><button class="nav-btn ${currentPage === 'categories' ? 'active' : ''}" data-page="categories"><i data-lucide="tags"></i><span>فئات</span></button><button id="logout-btn" class="nav-btn"><i data-lucide="log-out"></i><span>خروج</span></button></nav></div>`;
    }
    function createDailyPage({ expenses, categories }) {
        const today = new Date().toISOString().slice(0, 10);
        const dailyExpenses = expenses.filter(e => e.date === today);
        const total = dailyExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const expensesHTML = dailyExpenses.length > 0
            ? dailyExpenses.map(exp => `<div class="expense-item" data-id="${exp.id}"><div class="item-icon" style="background-color: ${(categories.find(c => c.id === exp.categoryId) || {}).color || '#ccc'};"><i data-lucide="${(categories.find(c => c.id === exp.categoryId) || {}).icon || 'tag'}"></i></div><div class="item-details"><p class="item-name">${escapeHTML(exp.name)}</p><p class="item-category">${escapeHTML((categories.find(c => c.id === exp.categoryId) || {}).name || 'غير محدد')}</p></div><p class="item-amount">${formatCurrency(exp.amount)}</p><div class="item-actions"><button class="btn-icon delete-expense"><i data-lucide="trash-2"></i></button></div></div>`).join('')
            : `<p class="empty-state">لا توجد مصروفات مسجلة اليوم.</p>`;
        return `<div class="page"><div class="card"><h3><i data-lucide="sun"></i>مصروفات اليوم</h3><p class="amount">${formatCurrency(total)}</p></div><div class="item-list">${expensesHTML}</div></div>`;
    }
    function createCategoriesPage({ categories }) {
        const categoriesHTML = categories.length > 0 ? categories.map(cat => `<div class="category-item" data-id="${cat.id}"><div class="item-icon" style="background-color: ${cat.color};"><i data-lucide="${cat.icon || 'tag'}"></i></div><div class="item-details"><p class="item-name">${escapeHTML(cat.name)}</p></div><div class="item-actions"><button class="btn-icon delete-category"><i data-lucide="trash-2"></i></button></div></div>`).join('') : `<p class="empty-state">لا توجد فئات مخصصة.</p>`;
        return `<div class="page"><div class="card"><h3><i data-lucide="tags"></i>إدارة الفئات</h3><div class="form-group"><label>اسم الفئة</label><input type="text" id="new-category-name" placeholder="مثال: تعليم"></div><div class="form-group"><label>اللون</label><input type="color" id="new-category-color" value="#8b5cf6"></div><button id="add-category-btn" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">إضافة فئة</button></div><div class="item-list">${categoriesHTML}</div></div>`;
    }
    
    function renderPageContent(container, appState) {
        container.innerHTML = '';
        if (appState.currentPage === 'daily') container.innerHTML = createDailyPage(appState);
        else if (appState.currentPage === 'categories') container.innerHTML = createCategoriesPage(appState);
        else container.innerHTML = `<div class="page"><p class="empty-state">صفحة ${appState.currentPage} (قيد الإنشاء)</p></div>`;
    }

    function toggleModal(show, content = '') {
        modalContainer.innerHTML = show ? `<div class="modal-backdrop"><div class="modal">${content}</div></div>` : '';
        setTimeout(() => modalContainer.querySelector('.modal-backdrop')?.classList.add('active'), 10);
        if(show) lucide.createIcons();
    }

    function render() {
        if (!state.user) {
            appContainer.innerHTML = createAuthScreen();
        } else {
            if (!document.getElementById('main-app')) {
                appContainer.innerHTML = createMainAppShell(state);
            }
            renderPageContent(document.getElementById('main-content'), state);
        }
        lucide.createIcons();
        setupEventListeners();
    }

    // --- EVENT LISTENERS & LOGIC ---
    function setupEventListeners() {
        const eventTarget = document.getElementById('auth-screen') || document.getElementById('main-app') || document;
        eventTarget.addEventListener('click', e => {
            const targetBtn = e.target.closest('button');
            if (!targetBtn) return;
            if (targetBtn.id === 'google-signin-btn') signInWithPopup(auth, new GoogleAuthProvider());
            else if (targetBtn.id === 'anon-signin-btn') signInAnonymously(auth);
            else if (targetBtn.id === 'logout-btn') signOut(auth);
            else if (targetBtn.dataset.page) setState({ currentPage: targetBtn.dataset.page });
            else if (targetBtn.id === 'fab-add-expense') {
                const categoryOptions = state.categories.map(c => `<option value="${c.id}">${escapeHTML(c.name)}</option>`).join('');
                toggleModal(true, `<h3>إضافة مصروف</h3><div class="form-group"><label>الاسم</label><input id="expense-name"></div><div class="form-group"><label>المبلغ</label><input id="expense-amount" type="number"></div><div class="form-group"><label>الفئة</label><select id="expense-category">${categoryOptions}</select></div><div class="modal-actions"><button id="save-expense-btn" class="btn btn-primary">حفظ</button><button class="btn btn-secondary modal-cancel">إلغاء</button></div>`);
            }
            else if (targetBtn.id === 'add-category-btn') {
                const name = document.getElementById('new-category-name').value.trim();
                const color = document.getElementById('new-category-color').value;
                if(name) addDoc(collection(db, 'users', state.user.uid, 'categories'), { name, color, icon: 'tag' });
            }
            else if(targetBtn.classList.contains('delete-expense')) deleteDoc(doc(db, 'users', state.user.uid, 'expenses', targetBtn.closest('.expense-item').dataset.id));
            else if(targetBtn.classList.contains('delete-category')) deleteDoc(doc(db, 'users', state.user.uid, 'categories', targetBtn.closest('.category-item').dataset.id));
        });

        modalContainer.addEventListener('click', e => {
            if (e.target.closest('.modal-cancel') || e.target.classList.contains('modal-backdrop')) toggleModal(false);
            else if (e.target.id === 'save-expense-btn') {
                const name = document.getElementById('expense-name').value.trim();
                const amount = parseFloat(document.getElementById('expense-amount').value);
                const categoryId = document.getElementById('expense-category').value;
                if (!name || isNaN(amount) || !categoryId) return alert("يرجى ملء جميع الحقول");
                addDoc(collection(db, 'users', state.user.uid, 'expenses'), { name, amount, categoryId, createdAt: serverTimestamp(), date: new Date().toISOString().slice(0, 10) });
                toggleModal(false);
            }
        });
    }

    // --- APP INITIALIZATION ---
    function init() {
        appContainer.innerHTML = `<div class="screen active"><div class="spinner"></div><p>جاري التحميل...</p></div>`;
        try {
            app = initializeApp(window.firebaseServices.firebaseConfig);
            auth = getAuth(app);
            db = getFirestore(app);

            onAuthStateChanged(auth, user => {
                if (state.unsubscribe.length > 0) state.unsubscribe.forEach(unsub => unsub());
                
                if (user) {
                    const expensesQuery = query(collection(db, 'users', user.uid, 'expenses'), orderBy('createdAt', 'desc'));
                    const categoriesQuery = query(collection(db, 'users', user.uid, 'categories'));
                    
                    const unsubExpenses = onSnapshot(expensesQuery, snap => setState({ expenses: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) }));
                    const unsubCategories = onSnapshot(categoriesQuery, snap => {
                        const cats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        if (cats.length === 0 && !user.isAnonymous) {
                            [{ name: 'طعام', color: '#ef4444', icon: 'utensils' }, { name: 'مواصلات', color: '#3b82f6', icon: 'car' }].forEach(cat => addDoc(collection(db, 'users', user.uid, 'categories'), cat));
                        }
                        setState({ categories: cats });
                    });
                    
                    state.unsubscribe = [unsubExpenses, unsubCategories];
                    setState({ user });
                } else {
                    setState({ user: null, expenses: [], categories: [] });
                }
            });
        } catch (e) {
            appContainer.innerHTML = `<div class="screen active"><p>حدث خطأ فادح.</p></div>`;
            console.error(e);
        }
    }
    init();
                                                                                                                                                                                                                                                    }

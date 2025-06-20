// js/ui.js

// دوال التحكم في المودال
const expenseModal = document.getElementById('expense-modal');
const closeModalButtons = document.querySelectorAll('.close-button');
const addExpenseFab = document.getElementById('add-expense-fab'); // زر FAB

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// *جديد: جعل هذه الدوال متاحة عالمياً إذا لزم الأمر*
window.openModal = openModal;
window.closeModal = closeModal;

// *جديد: وظائف منتقي التاريخ*
const displayDateSpan = document.getElementById('display-date');
const prevDateBtn = document.querySelector('.prev-date');
const nextDateBtn = document.querySelector('.next-date');
const hiddenExpenseDateInput = document.getElementById('expense-date');

let selectedDate = new Date();

function updateDateSpinner() {
    const today = new Date();
    today.setHours(0,0,0,0); // لضمان مقارنة التواريخ فقط بدون الأوقات

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    yesterday.setHours(0,0,0,0);

    let displayString;
    const currentSelectedDate = new Date(selectedDate); // نسخة لتجنب التعديل المباشر
    currentSelectedDate.setHours(0,0,0,0);

    if (currentSelectedDate.getTime() === today.getTime()) {
        displayString = 'اليوم';
    } else if (currentSelectedDate.getTime() === yesterday.getTime()) {
        displayString = 'أمس';
    } else {
        displayString = new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(selectedDate);
    }

    displayDateSpan.style.opacity = 0;
    setTimeout(() => {
        displayDateSpan.textContent = displayString;
        displayDateSpan.style.opacity = 1;
    }, 100);

    hiddenExpenseDateInput.value = selectedDate.toISOString().split('T')[0];

    // تعطيل زر التالي إذا كان التاريخ هو اليوم
    if (selectedDate.toDateString() === today.toDateString()) {
        nextDateBtn.disabled = true;
        nextDateBtn.style.opacity = 0.5;
        nextDateBtn.style.cursor = 'not-allowed';
    } else {
        nextDateBtn.disabled = false;
        nextDateBtn.style.opacity = 1;
        nextDateBtn.style.cursor = 'pointer';
    }
}

function resetDateSpinner() {
    selectedDate = new Date();
    updateDateSpinner();
}

// *جديد: جعل resetDateSpinner متاحة عالمياً*
window.resetDateSpinner = resetDateSpinner;


// أحداث النقر على أسهم التاريخ
prevDateBtn.addEventListener('click', () => {
    selectedDate.setDate(selectedDate.getDate() - 1);
    updateDateSpinner();
});

nextDateBtn.addEventListener('click', () => {
    const today = new Date();
    today.setHours(0,0,0,0); // مقارنة باليوم الحالي فقط

    const currentSelectedDate = new Date(selectedDate);
    currentSelectedDate.setHours(0,0,0,0);

    if (currentSelectedDate.getTime() < today.getTime()) {
        selectedDate.setDate(selectedDate.getDate() + 1);
        updateDateSpinner();
    }
});

// تهيئة منتقي التاريخ عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', updateDateSpinner);

// *جديد: وظيفة للتحكم في عرض الأقسام*
const dailyView = document.getElementById('daily-view');
const monthlyView = document.getElementById('monthly-view');
const categoriesView = document.getElementById('categories-view');

const navDailyBtn = document.getElementById('nav-daily');
const navMonthlyBtn = document.getElementById('nav-monthly');

function showSection(sectionId) {
    dailyView.style.display = 'none';
    monthlyView.style.display = 'none';
    categoriesView.style.display = 'none';

    document.querySelectorAll('.bottom-nav button').forEach(btn => btn.classList.remove('active'));

    switch (sectionId) {
        case 'daily':
            dailyView.style.display = 'block';
            navDailyBtn.classList.add('active');
            break;
        case 'monthly':
            monthlyView.style.display = 'block';
            navMonthlyBtn.classList.add('active');
            break;
        case 'categories':
            categoriesView.style.display = 'block';
            // navCategoriesBtn.classList.add('active');
            break;
        default:
            dailyView.style.display = 'block';
            navDailyBtn.classList.add('active');
    }
}

// ربط المستمعين عند تحميل DOM
document.addEventListener('DOMContentLoaded', () => {
    // إغلاق المودال عند النقر خارج المحتوى
    if (expenseModal) {
        window.addEventListener('click', (event) => {
            if (event.target == expenseModal) {
                closeModal('expense-modal');
            }
        });
    }

    // إغلاق المودال عند النقر على زر الإغلاق
    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            closeModal(button.closest('.modal').id);
        });
    });

    // فتح مودال إضافة المصروف عند النقر على FAB
    if (addExpenseFab) {
        addExpenseFab.addEventListener('click', () => {
            openModal('expense-modal');
        });
    }

    // إضافة مستمعين لأزرار التنقل
    if (navDailyBtn) {
        navDailyBtn.addEventListener('click', () => showSection('daily'));
    }
    if (navMonthlyBtn) {
        navMonthlyBtn.addEventListener('click', () => showSection('monthly'));
    }
    // if (navCategoriesBtn) {
    //     navCategoriesBtn.addEventListener('click', () => showSection('categories'));
    // }

    // عرض القسم اليومي عند التحميل الأولي
    showSection('daily');
});


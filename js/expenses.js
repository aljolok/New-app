// js/expenses.js

// وصول آمن إلى المتغيرات الشاملة (auth, db, showLoading, إلخ)
// والتي يجب أن تكون قد تم تعريفها في main.js
// تأكد من أن هذه الملفات يتم تحميلها بعد main.js

let currentUserId = null;

// وظيفة لتحديث معرف المستخدم، يتم استدعاؤها من main.js
function setExpensesUserId(userId) {
    currentUserId = userId;
    if (userId) {
        getExpenses();
    } else {
        dailyExpensesList.innerHTML = '';
    }
}

// عناصر DOM - يجب الوصول إليها بعد تحميل DOM
let expenseForm;
let expenseNameInput;
let expenseAmountInput;
let expenseDateInput;
let expenseCategorySelect;
let dailyExpensesList;

// انتظر تحميل الـ DOM قبل محاولة الوصول إلى العناصر وإضافة المستمعين
document.addEventListener('DOMContentLoaded', () => {
    expenseForm = document.getElementById('expense-form');
    expenseNameInput = document.getElementById('expense-name');
    expenseAmountInput = document.getElementById('expense-amount');
    expenseDateInput = document.getElementById('expense-date');
    expenseCategorySelect = document.getElementById('expense-category');
    dailyExpensesList = document.getElementById('daily-expenses-list');

    // إضافة مستمع الحدث بعد أن يتم تحديد expenseForm
    if (expenseForm) {
        expenseForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!currentUserId) {
                alert('يجب تسجيل الدخول لإضافة مصروف.');
                return;
            }

            const name = expenseNameInput.value.trim();
            const amount = parseFloat(expenseAmountInput.value);
            const date = expenseDateInput.value;
            const category = expenseCategorySelect.value;

            if (!name || isNaN(amount) || amount <= 0 || !date || !category) {
                alert('الرجاء تعبئة جميع الحقول بشكل صحيح.');
                return;
            }

            try {
                await db.collection('expenses').add({
                    userId: currentUserId,
                    name,
                    amount,
                    date,
                    category,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                alert('تم إضافة المصروف بنجاح!');
                expenseForm.reset();
                if (typeof closeModal !== 'undefined') { // تحقق من وجود الدالة
                    closeModal('expense-modal');
                }
                if (typeof resetDateSpinner !== 'undefined') { // تحقق من وجود الدالة
                    resetDateSpinner();
                }
            } catch (error) {
                console.error('Error adding expense:', error);
                alert('حدث خطأ أثناء إضافة المصروف: ' + error.message);
            }
        });
    }
});


// جلب وعرض المصروفات
function getExpenses() {
    if (!currentUserId || !db) { // التأكد من وجود db أيضاً
        console.warn('No user ID or DB instance available to fetch expenses.');
        return;
    }

    db.collection('expenses')
        .where('userId', '==', currentUserId)
        .orderBy('date', 'desc')
        .onSnapshot((snapshot) => {
            let expenses = [];
            snapshot.forEach((doc) => {
                expenses.push({ id: doc.id, ...doc.data() });
            });
            if (dailyExpensesList) { // تحقق من وجود العنصر
                displayExpenses(expenses);
            }
        }, (error) => {
            console.error('Error getting expenses:', error);
            alert('حدث خطأ أثناء جلب المصروفات: ' + error.message);
        });
}

// وظيفة لعرض المصروفات في DOM
function displayExpenses(expenses) {
    dailyExpensesList.innerHTML = '';

    if (expenses.length === 0) {
        dailyExpensesList.innerHTML = '<li style="text-align: center; color: #888;">لا توجد مصروفات لعرضها بعد.</li>';
        return;
    }

    expenses.forEach(expense => {
        const li = document.createElement('li');
        li.dataset.id = expense.id;

        const expenseDate = new Date(expense.date + 'T00:00:00');
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        let displayDate = expense.date;
        if (expenseDate.toDateString() === today.toDateString()) {
            displayDate = 'اليوم';
        } else if (expenseDate.toDateString() === yesterday.toDateString()) {
            displayDate = 'أمس';
        } else {
            displayDate = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }).format(expenseDate);
        }

        li.innerHTML = `
            <div>
                <strong>${expense.name}</strong> - <span>${expense.amount.toFixed(2)} ر.س</span>
                <br>
                <small>${expense.category} | ${displayDate}</small>
            </div>
            <div>
                <button class="edit-expense-btn" data-id="${expense.id}" style="background-color: #ffc107; margin-left: 5px;">تعديل</button>
                <button class="delete-expense-btn" data-id="${expense.id}" style="background-color: #dc3545;">حذف</button>
            </div>
        `;
        dailyExpensesList.appendChild(li);
    });

    // إعادة ربط مستمعات الأحداث للأزرار بعد إعادة رسم القائمة
    // attachExpenseButtonListeners(); // سيتم تعريفها في الخطوة القادمة للحذف والتعديل
}

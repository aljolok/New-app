// js/main.js

// إعدادات Firebase الخاصة بك
const firebaseConfig = {
    apiKey: "AIzaSyCD6TOeIO7g6RGp89YtA1maduwMfyTE1VQ",
    authDomain: "my-expenses-81714.firebaseapp.com",
    projectId: "my-expenses-81714",
    storageBucket: "my-expenses-81714.firebasestorage.app",
    messagingSenderId: "672207051964",
    appId: "1:672207051964:web:b6e0cedc143bd06fd584b9",
    measurementId: "G-YBTY3QD4YQ"
};

// تهيئة Firebase
// يجب أن يتم التأكد من تحميل firebase-app.js قبل هذا السطر
const app = firebase.initializeApp(firebaseConfig);

// الحصول على مثيلات لخدمات Firebase وجعلها عامة (global)
// لكي تكون متاحة في جميع ملفات JS الأخرى
const auth = firebase.auth(app);
const db = firebase.firestore(app);

// تمكين استمرارية Firestore دون اتصال بالإنترنت
db.enablePersistence()
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn('Firestore persistence failed: Multiple tabs open or browser does not support.');
        } else if (err.code == 'unimplemented') {
            console.warn('Firestore persistence not supported on this browser.');
        }
    });

// *** دوال إظهار/إخفاء الشاشات (ابقِها هنا أو انقلها إلى ui.js إذا كانت UI فقط) ***
// أفضل أن تبقى هنا لأنها تتحكم في تدفق التطبيق بناءً على حالة Firebase
const loadingSpinner = document.getElementById('loading-spinner');
const authScreen = document.getElementById('auth-screen');
const mainAppScreen = document.getElementById('main-app-screen');

function showLoading() {
    loadingSpinner.style.display = 'block';
    authScreen.style.display = 'none';
    mainAppScreen.style.display = 'none';
}

function showAuthScreen() {
    loadingSpinner.style.display = 'none';
    authScreen.style.display = 'flex';
    mainAppScreen.style.display = 'none';
}

function showMainAppScreen() {
    loadingSpinner.style.display = 'none';
    authScreen.style.display = 'none';
    mainAppScreen.style.display = 'flex';
}

// عرض شاشة التحميل في البداية عند تحميل main.js
showLoading();

// *** ربط حالة المصادقة بوظائف جلب البيانات (الآن بعد أن أصبحت الدالات متاحة) ***
// يتم استدعاء هذا الجزء بعد أن تكون جميع ملفات الـ JS قد تم تحميلها
// وبعد أن تكون setExpensesUserId متاحة من expenses.js
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('User logged in:', user.uid);
            showMainAppScreen();
            if (typeof setExpensesUserId !== 'undefined') { // تحقق من وجود الدالة
                setExpensesUserId(user.uid);
            }
            // if (typeof setCategoriesUserId !== 'undefined') {
            //     setCategoriesUserId(user.uid);
            // }
        } else {
            console.log('User logged out');
            showAuthScreen();
            if (typeof setExpensesUserId !== 'undefined') { // تحقق من وجود الدالة
                setExpensesUserId(null);
            }
            // if (typeof setCategoriesUserId !== 'undefined') {
            //     setCategoriesUserId(null);
            // }
        }
    });
});

// js/auth.js

// الوصول إلى العناصر بعد تحميل الـ DOM
// هذه المتغيرات ستحصل على قيمتها عندما يتم تحميل main.js و ui.js بالكامل
let googleSignInBtn;
let anonymousSignInBtn;
let signOutBtn;

// انتظر تحميل الـ DOM قبل محاولة الوصول إلى العناصر
document.addEventListener('DOMContentLoaded', () => {
    googleSignInBtn = document.getElementById('google-signin-btn');
    anonymousSignInBtn = document.getElementById('anonymous-signin-btn');
    signOutBtn = document.getElementById('signout-btn');

    // وظيفة تسجيل الدخول باستخدام جوجل
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', async () => {
            showLoading(); // هذه الدالة يجب أن تكون معرفة عالمياً في main.js
            const provider = new firebase.auth.GoogleAuthProvider();
            try {
                await auth.signInWithPopup(provider);
            } catch (error) {
                console.error("Google Sign-in Error:", error.message);
                alert('خطأ في تسجيل الدخول باستخدام جوجل: ' + error.message);
                showAuthScreen(); // هذه الدالة يجب أن تكون معرفة عالمياً في main.js
            }
        });
    }

    // وظيفة تسجيل الدخول كمجهول
    if (anonymousSignInBtn) {
        anonymousSignInBtn.addEventListener('click', async () => {
            showLoading();
            try {
                await auth.signInAnonymously();
            } catch (error) {
                console.error("Anonymous Sign-in Error:", error.message);
                alert('خطأ في تسجيل الدخول كمجهول: ' + error.message);
                showAuthScreen();
            }
        });
    }

    // وظيفة تسجيل الخروج
    if (signOutBtn) {
        signOutBtn.addEventListener('click', async () => {
            showLoading();
            try {
                await auth.signOut();
            } catch (error) {
                console.error("Sign-out Error:", error.message);
                alert('خطأ في تسجيل الخروج: ' + error.message);
                showMainAppScreen();
            }
        });
    }
});

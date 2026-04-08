/**
 * VITALHUB SUPREME - Firebase Initialization Script
 * ===================================================
 * This script runs ONCE to:
 *   1. Verify Firebase Auth and Firestore are reachable
 *   2. Create the admin user's metadata document (if missing)
 *   3. Set up the "meta/stats" global counter
 *   4. Validate that Firestore security rules are in effect
 *
 * HOW TO USE:
 *   Open your browser console at http://localhost:3000
 *   and run: initVitalHubFirebase()
 *
 * Or include this script once in index.html, then call the function.
 */

const VITALHUB_ADMIN_EMAIL = 'carpinterovictor1@gmail.com';

async function initVitalHubFirebase() {
    console.group('🔥 VitalHub Firebase Initialization');
    const results = [];

    // ── 1. Verify Firebase is loaded ───────────────────────
    try {
        if (typeof firebase === 'undefined') throw new Error('Firebase SDK not loaded');
        if (typeof auth === 'undefined') throw new Error('firebase-config.js not loaded');
        results.push({ step: 'Firebase SDK',  status: '✅ OK' });
    } catch (e) {
        results.push({ step: 'Firebase SDK', status: '❌ ' + e.message });
        console.table(results);
        console.groupEnd();
        return;
    }

    // ── 2. Verify Firestore is reachable ───────────────────
    try {
        await db.collection('_healthcheck').doc('ping').set({
            ts: firebase.firestore.FieldValue.serverTimestamp()
        });
        await db.collection('_healthcheck').doc('ping').delete();
        results.push({ step: 'Firestore Connection', status: '✅ OK' });
    } catch (e) {
        results.push({ step: 'Firestore Connection', status: '⚠️ ' + e.message });
    }

    // ── 3. Verify Auth is reachable ────────────────────────
    try {
        const methods = await auth.fetchSignInMethodsForEmail('check@vitalhub.test');
        results.push({ step: 'Firebase Auth', status: '✅ OK' });
    } catch (e) {
        // If error is "invalid email", Auth is working; other errors mean config issue
        const ok = e.code === 'auth/invalid-email' || e.code === 'auth/invalid-credential';
        results.push({ step: 'Firebase Auth', status: ok ? '✅ OK' : '⚠️ ' + e.message });
    }

    // ── 4. Set up global meta/stats counter ────────────────
    try {
        const metaRef = db.collection('meta').doc('stats');
        const snap = await metaRef.get();
        if (!snap.exists) {
            await metaRef.set({ userCount: 0, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
            results.push({ step: 'Meta/Stats doc', status: '✅ Created' });
        } else {
            results.push({ step: 'Meta/Stats doc', status: '✅ Already exists' });
        }
    } catch (e) {
        results.push({ step: 'Meta/Stats doc', status: '⚠️ ' + e.message });
    }

    // ── 5. Verify current user (if logged in) ──────────────
    const user = auth.currentUser;
    if (user) {
        results.push({ step: 'Current User', status: `✅ ${user.email}` });

        // If this is the admin, ensure admin flag is set in Firestore
        if (user.email === VITALHUB_ADMIN_EMAIL) {
            try {
                await db.collection('users').doc(user.uid).set(
                    { isAdmin: true, adminSince: firebase.firestore.FieldValue.serverTimestamp() },
                    { merge: true }
                );
                results.push({ step: 'Admin Role', status: '✅ Admin privileges confirmed' });
            } catch (e) {
                results.push({ step: 'Admin Role', status: '⚠️ ' + e.message });
            }
        }

        // ── 6. Test security rules (write own data) ────────
        try {
            const testRef = db.collection('metrics').doc(user.uid);
            await testRef.set({ _init_test: true }, { merge: true });
            await testRef.update({ _init_test: firebase.firestore.FieldValue.delete() });
            results.push({ step: 'Security Rules (own write)', status: '✅ Allowed correctly' });
        } catch (e) {
            results.push({ step: 'Security Rules (own write)', status: '❌ ' + e.message });
        }

        // ── 7. Test presence system ────────────────────────
        try {
            await db.collection('presence').doc(user.uid).set({
                name: user.displayName || 'Test',
                email: user.email,
                online: true,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
            results.push({ step: 'Presence System', status: '✅ Working' });
        } catch (e) {
            results.push({ step: 'Presence System', status: '⚠️ ' + e.message });
        }

    } else {
        results.push({ step: 'Current User', status: '⚠️ Not logged in (log in to test rules)' });
    }

    // ── Print Report ───────────────────────────────────────
    console.table(results);
    console.log('\n📋 VitalHub Firebase Setup Report:');
    results.forEach(r => console.log(`  ${r.status}  ${r.step}`));

    const allOk = results.every(r => r.status.startsWith('✅'));
    if (allOk) {
        console.log('\n🎉 Todo listo. VitalHub Firebase está configurado correctamente.');
    } else {
        console.warn('\n⚠️ Algunos pasos requieren atención. Revisa los errores arriba.');
    }

    console.groupEnd();
    return results;
}

/**
 * REALTIME DATABASE INITIALIZATION
 * Compatible with database.rules.json
 * Call this after enabling Realtime Database in Firebase Console.
 */
async function initRealtimeDatabase(databaseURL) {
    console.group('📡 Realtime Database Initialization');

    if (!databaseURL) {
        console.error('❌ Provide your databaseURL: initRealtimeDatabase("https://YOUR_PROJECT.firebaseio.com")');
        console.groupEnd();
        return;
    }

    try {
        // Add RTDB to existing Firebase app (if not already added)
        if (!firebase.apps[0].options.databaseURL) {
            console.warn('⚠️ databaseURL not in firebase-config.js. Add it manually to enable RTDB presence.');
        }
        const rtdb = firebase.database();
        const user = auth.currentUser;

        if (!user) {
            console.warn('⚠️ Log in first to test RTDB rules.');
            console.groupEnd();
            return;
        }

        // Test write to presence node
        const presenceRef = rtdb.ref(`presence/${user.uid}`);
        await presenceRef.set({
            name: user.displayName || 'Test',
            email: user.email,
            online: true,
            lastSeen: Date.now()
        });

        // Set up onDisconnect (auto-mark offline on close)
        await presenceRef.onDisconnect().update({ online: false, lastSeen: Date.now() });

        console.log('✅ Realtime Database presence system configured');
        console.log('✅ onDisconnect hook set — user will auto-go offline');
        console.log(`✅ Presence path: presence/${user.uid}`);

    } catch (e) {
        console.error('❌ RTDB Error:', e.message);
        if (e.code === 'PERMISSION_DENIED') {
            console.error('   → Make sure database.rules.json is deployed in Firebase Console');
        }
    }

    console.groupEnd();
}

console.log('🔥 firebase-init.js loaded. Run initVitalHubFirebase() in the browser console to verify setup.');

//backend/registrationStorage.js

const REGISTRATION_DB = "flama-registration-db";
const REGISTRATION_STORE = "files";

function openRegistrationDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(REGISTRATION_DB, 1);

        request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains(REGISTRATION_STORE)) {
                db.createObjectStore(REGISTRATION_STORE);
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveRegistrationFile(key, file) {
    const db = await openRegistrationDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            REGISTRATION_STORE,
            "readwrite"
        );

        transaction.objectStore(REGISTRATION_STORE).put(file, key);

        transaction.oncomplete = () => {
            db.close();
            resolve();
        };

        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };
    });
}

async function getRegistrationFile(key) {
    const db = await openRegistrationDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            REGISTRATION_STORE,
            "readonly"
        );

        const request = transaction
            .objectStore(REGISTRATION_STORE)
            .get(key);

        request.onsuccess = () => {
            db.close();
            resolve(request.result || null);
        };

        request.onerror = () => {
            db.close();
            reject(request.error);
        };
    });
}

async function clearRegistrationFiles() {
    const db = await openRegistrationDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            REGISTRATION_STORE,
            "readwrite"
        );

        transaction.objectStore(REGISTRATION_STORE).clear();

        transaction.oncomplete = () => {
            db.close();
            resolve();
        };

        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };
    });
}
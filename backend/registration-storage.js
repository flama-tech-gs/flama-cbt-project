//backend/registrationStorage.js



const REGISTRATION_KEY = "schoolRegistration";

const REGISTRATION_DB = "flama-registration-db";
const REGISTRATION_STORE = "files";

// ==========================================
// REGISTRATION DATA
// ==========================================

function getRegistration() {
    try {
        return JSON.parse(
            localStorage.getItem(REGISTRATION_KEY) || "{}"
        );
    } catch (error) {
        console.error("Unable to read registration data:", error);
        return {};
    }
}

function saveRegistration(key, value) {
    if (!key) {
        throw new Error("A registration key is required.");
    }

    const registration = getRegistration();

    registration[key] = value;

    // Keep the Step 3 plan and Step 4 plan in sync.
    if (key === "plan") {
        registration.selectedPlan = {
            ...value,
            planId: value.planId || value.id || "",
            id: value.id || value.planId || "",
            key: value.key || value.name || ""
        };
    }

    localStorage.setItem(
        REGISTRATION_KEY,
        JSON.stringify(registration)
    );

    return registration;
}

// ==========================================
// INDEXEDDB FILE STORAGE
// ==========================================

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

        transaction.onabort = () => {
            db.close();
            reject(transaction.error || new Error("File save was cancelled."));
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
            const file = request.result || null;
            db.close();
            resolve(file);
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

        transaction.onabort = () => {
            db.close();
            reject(transaction.error || new Error("File clearing was cancelled."));
        };
    });
}

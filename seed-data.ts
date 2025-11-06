// FIX: Import `doc` from `firebase/firestore` to resolve reference error.
import { Firestore, collection, writeBatch, getDocs, doc } from 'firebase/firestore';
import { 
    MOCK_TEACHERS,
    MOCK_STUDENTS,
    MOCK_EVENTS,
    MOCK_NOTICES,
    MOCK_FINANCIAL_ENTRIES,
    MOCK_MISC_INCOMES,
    MOCK_GENERAL_EXPENSES,
    MOCK_TASKS,
} from './mock-data';

// Helper function to seed a single collection
const seedCollection = async (db: Firestore, collectionName: string, data: any[]) => {
    // Check if collection is already populated to prevent duplicates
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    if (!snapshot.empty) {
        console.log(`Collection "${collectionName}" already has data. Skipping seed.`);
        return;
    }
    
    const batch = writeBatch(db);
    data.forEach(item => {
        // IMPORTANT: We do not store passwords in Firestore. Passwords are handled by Firebase Auth.
        const { password, ...restOfItem } = item;
        const docRef = doc(collectionRef, item.id); // Use the mock ID for consistency
        batch.set(docRef, restOfItem);
    });
    await batch.commit();
    console.log(`Successfully seeded "${collectionName}" collection.`);
};

// Main function to seed all collections
export const seedDatabase = async (db: Firestore) => {
    console.log('Starting database seed process...');
    
    // NOTE: You must create users in Firebase Authentication MANUALLY
    // using the email/password from MOCK_TEACHERS. This script only seeds Firestore data.
    
    await seedCollection(db, 'teachers', MOCK_TEACHERS);
    await seedCollection(db, 'students', MOCK_STUDENTS);
    await seedCollection(db, 'events', MOCK_EVENTS);
    await seedCollection(db, 'notices', MOCK_NOTICES);
    await seedCollection(db, 'financialEntries', MOCK_FINANCIAL_ENTRIES);
    await seedCollection(db, 'miscIncomes', MOCK_MISC_INCOMES);
    await seedCollection(db, 'generalExpenses', MOCK_GENERAL_EXPENSES);
    await seedCollection(db, 'tasks', MOCK_TASKS);

    console.log('Database seed process complete!');
};
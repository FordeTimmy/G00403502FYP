import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

export const createOrUpdateUser = async (uid, email, data = {}) => {
    try {
        const db = getFirestore();
        const userRef = doc(db, "users", uid);
        
        await setDoc(userRef, {
            email,
            ...data
        }, { merge: true });
        
        return true;
    } catch (error) {
        console.error(`Error creating/updating user: ${error}`);
        throw error;
    }
};

export const getUserProfile = async (uid) => {
    try {
        const db = getFirestore();
        const userRef = doc(db, "users", uid);
        const docSnap = await getDoc(userRef);
        
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        console.error(`Error fetching user profile: ${error}`);
        throw error;
    }
};

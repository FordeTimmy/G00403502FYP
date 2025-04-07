import { auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

export const checkSession = async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");

    try {
        const response = await fetch("http://localhost:5000/api/verify-token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`  // Use JWT instead of Firebase token
            }
        });

        if (!response.ok) {
            localStorage.removeItem("token");
            throw new Error("Session expired");
        }

        return await response.json();
    } catch (error) {
        localStorage.removeItem("token");
        throw error;
    }
};

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    return { user, loading };
};

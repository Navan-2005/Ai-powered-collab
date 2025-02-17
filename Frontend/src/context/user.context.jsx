import { createContext, useState, useEffect } from 'react';
import axios from '../config/axios';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await axios.get('/user/profile', {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setUser(res.data);
                } catch (error) {
                    console.log("Error fetching user:", error);
                    setUser(null);
                }
            }
        };

        fetchUser();
    }, []);  // Runs only once when the app loads

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

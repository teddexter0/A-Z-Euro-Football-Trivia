import '../styles/globals.css';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

export const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = signed out

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading: user === undefined }}>
      <Component {...pageProps} />
    </AuthContext.Provider>
  );
}

export default MyApp;

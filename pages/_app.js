import Head from 'next/head';
import '../styles/globals.css';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { AuthContext } from '../lib/auth';

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = signed out

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading: user === undefined }}>
      <Head>
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🧠%3C/text%3E%3C/svg%3E" />
      </Head>
      <Component {...pageProps} />
    </AuthContext.Provider>
  );
}

export default MyApp;

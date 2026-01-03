import React, { createContext, useState, useEffect, useCallback } from 'react';
import { auth, db } from '../config/firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setError(null);
      try {
        if (currentUser) {
          // User is logged in, fetch their role from Firestore
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUser(currentUser);
            setRole(userData.role);
          } else {
            // User doc doesn't exist, log them out
            await signOut(auth);
            setUser(null);
            setRole(null);
            setError('User profile not found.');
          }
        } else {
          // User is logged out
          setUser(null);
          setRole(null);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setError(err.message);
        setUser(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sign up function
  const signup = useCallback(async (email, password, selectedRole) => {
    setError(null);
    setLoading(true);
    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      console.log('User created with UID:', uid);

      // Save user role in Firestore
      const userDocRef = doc(db, 'users', uid);
      await setDoc(userDocRef, {
        role: selectedRole,
        email: email,
        full_name: '',  // Add full_name field
        displayName: '',
        createdAt: new Date(),
      });

      console.log('User document saved to Firestore');

      setUser(userCredential.user);
      setRole(selectedRole);
      return { success: true, uid };
    } catch (err) {
      console.error('Signup error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      // Provide more specific error messages
      let displayError = err.message;
      if (err.code === 'permission-denied') {
        displayError = 'Permission denied. Check your Firestore security rules.';
      } else if (err.code === 'auth/email-already-in-use') {
        displayError = 'This email is already registered.';
      } else if (err.code === 'auth/weak-password') {
        displayError = 'Password is too weak. Use at least 6 characters.';
      }
      
      setError(displayError);
      return { success: false, error: displayError };
    } finally {
      setLoading(false);
    }
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      // Authenticate user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      console.log('User authenticated with UID:', uid);

      // Fetch user role from Firestore
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        console.log('User data fetched from Firestore:', userData);
        setUser(userCredential.user);
        setRole(userData.role);
        return { success: true, role: userData.role };
      } else {
        // User doc doesn't exist, log them out
        console.warn('User document not found in Firestore');
        await signOut(auth);
        setUser(null);
        setRole(null);
        const errorMsg = 'User profile not found. Please sign up first.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error code:', err.code);

      let displayError = err.message;
      if (err.code === 'auth/user-not-found') {
        displayError = 'Email not registered. Please sign up first.';
      } else if (err.code === 'auth/wrong-password') {
        displayError = 'Incorrect password.';
      } else if (err.code === 'auth/invalid-email') {
        displayError = 'Invalid email address.';
      }

      setError(displayError);
      return { success: false, error: displayError };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setRole(null);
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    user,
    role,
    loading,
    error,
    signup,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

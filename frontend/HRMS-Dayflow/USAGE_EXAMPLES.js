// Example Usage of AuthContext Hook

import { useAuth } from './context/AuthContext';

// In any component:
const MyComponent = () => {
  const { user, role, loading, error, signup, login, logout } = useAuth();

  // Example 1: Sign up
  const handleSignUp = async () => {
    const result = await signup('user@example.com', 'password123', 'employee');
    if (result.success) {
      console.log('Signed up successfully!');
    } else {
      console.log('Error:', result.error);
    }
  };

  // Example 2: Login
  const handleLogin = async () => {
    const result = await login('user@example.com', 'password123');
    if (result.success) {
      console.log('Logged in as:', result.role);
    } else {
      console.log('Error:', result.error);
    }
  };

  // Example 3: Logout
  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      console.log('Logged out!');
    }
  };

  // Show loading state
  if (loading) return <div>Loading...</div>;

  // Show user info
  if (user) {
    return (
      <div>
        <p>Logged in as: {user.email}</p>
        <p>Role: {role}</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  // Show login form
  return (
    <div>
      <button onClick={handleSignUp}>Sign Up</button>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default MyComponent;

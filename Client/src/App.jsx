import React from 'react'
import { Outlet, Routes, Route, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Login from './components/Login';
import SignUp from './components/SignUp';

const App = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  });

  // Save user to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("currentUser");
    }
  }, [currentUser]);

  // Handle login/register submit
  const handleAuthSubmit = data => {
    const user = {
      email: data.email,
      name: data.name || 'User',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'User')}&background=random`
    }
    setCurrentUser(user);
    navigate('/', { replace: true })
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    navigate('/login', { replace: true })
  }

  const ProtectedLayout = () => {
    return (
      <Layout user={currentUser} onLogout={handleLogout}>
        <Outlet />
      </Layout>
    )
  }

  return (
    <Routes>
      <Route path='/login' element={<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
        <Login onSubmit={handleAuthSubmit} onSwitchMode={() => navigate('/signup')} />
      </div>} />

         <Route path='/signup' element={<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
        <SignUp onSubmit={handleAuthSubmit} onSwitchMode={() => navigate('/login')} />
      </div>} />
      
      

      <Route path="/" element={<Layout />} />
    </Routes>
  );
}

export default App
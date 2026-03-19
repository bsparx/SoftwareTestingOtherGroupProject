import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Dashboard from './Dashboard';
import Landing from './Landing';

const Home = () => {
  const { user } = useContext(AuthContext);

  if (!user) return <Landing />;
  if (user.role === 'Admin') return <Navigate to="/admin" />;
  if (user.role === 'Maintenance') return <Navigate to="/maintenance" />;
  
  return <Dashboard />;
};

export default Home;

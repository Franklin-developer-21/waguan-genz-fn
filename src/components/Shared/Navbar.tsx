import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import { Home, BoxIcon, ChartAreaIcon, PersonStanding } from 'lucide-react';
import type{ RootState, AppDispatch } from '../../store';

const Navbar = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  const handleLogout = () => {
    localStorage.removeItem('token');
    dispatch(logout());
  };

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-around', padding: '10px' }}>
      <Link to="/"><Home /></Link>
      {isAuthenticated && (
        <>
          <Link to="/post"><BoxIcon /></Link>
          <Link to="/chat"><ChartAreaIcon /></Link>
          <Link to="/profile"><PersonStanding /></Link>
          <button onClick={handleLogout}>Logout</button>
        </>
      )}
      {!isAuthenticated && (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
};

export default Navbar;
import { Outlet } from 'react-router';

function AuthLayout() {
  return (
    <div className="auth-container">
      <Outlet />
    </div>
  );
}

export default AuthLayout;

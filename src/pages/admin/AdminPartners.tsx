import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminPartners = () => {
  const navigate = useNavigate();
  useEffect(() => { navigate('/admin/partners-manage', { replace: true }); }, [navigate]);
  return null;
};

export default AdminPartners;

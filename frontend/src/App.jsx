// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardAthlete from './pages/DashboardAthlete';
import DashboardCoach from './pages/DashboardCoach';
import Subscribe from './pages/Subscribe';
import PrivateRoute from './components/PrivateRoute';
import PlanPage from './pages/PlanPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard do atleta */}
        <Route 
          path="/dashboard-athlete" 
          element={
            <PrivateRoute>
              <DashboardAthlete />
            </PrivateRoute>
          }
        />

        {/* Dashboard do coach */}
        <Route 
          path="/dashboard-coach" 
          element={
            <PrivateRoute>
              <DashboardCoach />
            </PrivateRoute>
          }
        />

        {/* Rota para exibir o plano do atleta */}
        <Route path="/plan/:athleteId" element={<PlanPage />} />

        <Route path="/subscribe" element={<Subscribe />} />

        {/* fallback */}
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

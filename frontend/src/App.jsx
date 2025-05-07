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
import Timers from './pages/Timers';
import CalendarPage from './pages/CalendarPage';
import VerifyEmail from './pages/VerifyEmail';

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

        <Route
  path="/timers"
  element={
    <PrivateRoute>
      <Timers />        {/* qualquer atleta logado */}
    </PrivateRoute>
  }
/>
 {/* Calendário (histórico de treinos) */}
         <Route
          path="/calendar"
          element={
            <PrivateRoute>
              <CalendarPage />
            </PrivateRoute>
          }
        />
<Route path="/verify-email" element={<VerifyEmail/>} />
        {/* fallback */}
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

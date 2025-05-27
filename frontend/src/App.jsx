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
import MetricsList from './pages/MetricsList';
import MetricDetail from './pages/MetricDetail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword  from './pages/ResetPassword';
import ProfilePage from './pages/ProfilePage';
import EditProfile from './pages/EditProfile';
import TeamPage from './pages/TeamPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/edit-profile" element={<EditProfile />} />

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
      <Timers />        
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
        +  {/* Calendário – atleta vê o seu, coach vê o do atleta seleccionado */}
  <Route
    path="/calendar/:athleteId?"
    element={<CalendarPage />}
  />
<Route path="/verify-email" element={<VerifyEmail/>} />
<Route path="/metrics" element={<PrivateRoute><MetricsList/></PrivateRoute>} />
<Route path="/metric/:metricId" element={<PrivateRoute><MetricDetail/></PrivateRoute>} />
<Route path="/forgot-password" element={<ForgotPassword/>}/>
<Route path="/reset-password/:token" element={<ResetPassword/>}/>
<Route path="/profile" element={<PrivateRoute><ProfilePage/></PrivateRoute>}/>
<Route  path="/team"  element={<PrivateRoute><TeamPage /></PrivateRoute>}/>
        {/* fallback */}
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

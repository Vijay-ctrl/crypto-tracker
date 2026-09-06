import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import Dashboard from "./pages/Dashboard";
import Markets from "./pages/Markets";
import Portfolio from "./pages/Portfolio";
import Watchlist from "./pages/Watchlist";
import Alerts from "./pages/Alerts";
import CoinDetails from "./pages/CoinDetails";
import Profile from "./pages/Profile";

import "./App.css";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* ========================================
                PUBLIC ROUTES
            ======================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        {/* ========================================
                RESET PASSWORD

                Backend email sends:

                /reset-password?token=TOKEN

                Token is read inside ResetPassword.jsx
                using URLSearchParams.
            ======================================== */}

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />


        {/* ========================================
                PROTECTED ROUTES
            ======================================== */}

        <Route element={<ProtectedRoute />}>

          <Route element={<Layout />}>

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/markets"
              element={<Markets />}
            />

            <Route
              path="/portfolio"
              element={<Portfolio />}
            />

            <Route
              path="/watchlist"
              element={<Watchlist />}
            />

            <Route
              path="/alerts"
              element={<Alerts />}
            />

            <Route
              path="/coin/:id"
              element={<CoinDetails />}
            />

            <Route
              path="/profile"
              element={<Profile />}
            />

          </Route>

        </Route>


        {/* ========================================
                DEFAULT ROUTES
            ======================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
};

export default App;
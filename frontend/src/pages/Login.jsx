import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
   Eye,
   EyeOff,
   Lock,
   Mail,
   Coins,
   AlertCircle,
   LoaderCircle,
} from "lucide-react";

import api from "../services/api";
import { setAuth } from "../auth";

import "./Login.css";

const Login = () => {
   const navigate = useNavigate();

   const [form, setForm] = useState({
      email: "",
      password: "",
   });

   const [showPassword, setShowPassword] =
      useState(false);

   const [error, setError] = useState("");

   const [loading, setLoading] =
      useState(false);

   const handleChange = (e) => {
      const { name, value } = e.target;

      setForm((previous) => ({
         ...previous,
         [name]: value,
      }));

      if (error) {
         setError("");
      }
   };

   const handleSubmit = async (e) => {
      e.preventDefault();

      if (loading) return;

      setError("");

      const email = form.email.trim();

      if (!email || !form.password) {
         setError(
            "Please enter your email and password."
         );
         return;
      }

      setLoading(true);

      try {
         const response = await api.post(
            "/auth/login",
            {
               email,
               password: form.password,
            }
         );

         const { token, user } =
            response.data;

         if (!token || !user) {
            throw new Error(
               "Invalid login response."
            );
         }

         setAuth(token, user);

         navigate("/dashboard", {
            replace: true,
         });
      } catch (error) {
         setError(
            error.response?.data?.message ||
            error.message ||
            "Login failed. Please check your credentials."
         );
      } finally {
         setLoading(false);
      }
   };

   return (
      <main className="auth-page">

         <div
            className="auth-background"
            aria-hidden="true"
         />

         <section className="auth-container">

            {/* Brand */}

            <div className="auth-brand">

               <div className="brand-icon">
                  <Coins size={27} />
               </div>

               <h1>
                  CryptoTracker
               </h1>

               <p>
                  Track the market. Manage your portfolio.
               </p>

            </div>


            {/* Login Card */}

            <div className="auth-card">

               <div className="auth-header">

                  <h2>
                     Welcome back
                  </h2>

                  <p>
                     Sign in to continue to your dashboard.
                  </p>

               </div>


               {/* Error */}

               {error && (

                  <div
                     className="error-message"
                     role="alert"
                  >

                     <AlertCircle size={18} />

                     <span>
                        {error}
                     </span>

                  </div>

               )}


               <form
                  onSubmit={handleSubmit}
                  autoComplete="on"
               >

                  {/* Email */}

                  <div className="form-group">

                     <label htmlFor="login-email">
                        Email address
                     </label>

                     <div className="input-wrapper">

                        <span className="input-icon">
                           <Mail size={19} />
                        </span>

                        <input
                           id="login-email"
                           type="email"
                           name="email"
                           value={form.email}
                           onChange={handleChange}
                           placeholder="you@example.com"
                           autoComplete="email"
                           inputMode="email"
                           disabled={loading}
                           required
                        />

                     </div>

                  </div>


                  {/* Password */}

                  <div className="form-group">

                     <label htmlFor="login-password">
                        Password
                     </label>

                     <div className="input-wrapper password-wrapper">

                        <span className="input-icon">
                           <Lock size={19} />
                        </span>

                        <input
                           id="login-password"
                           type={
                              showPassword
                                 ? "text"
                                 : "password"
                           }
                           name="password"
                           value={form.password}
                           onChange={handleChange}
                           placeholder="Enter your password"
                           autoComplete="current-password"
                           disabled={loading}
                           required
                        />

                        <button
                           type="button"
                           className="password-toggle"
                           onClick={() =>
                              setShowPassword(
                                 (previous) =>
                                    !previous
                              )
                           }
                           disabled={loading}
                           aria-label={
                              showPassword
                                 ? "Hide password"
                                 : "Show password"
                           }
                        >

                           {showPassword ? (
                              <EyeOff size={19} />
                           ) : (
                              <Eye size={19} />
                           )}

                        </button>

                     </div>

                  </div>


                  {/* Submit */}

                  <button
                     className="primary-button"
                     type="submit"
                     disabled={loading}
                  >

                     {loading ? (

                        <>
                           <LoaderCircle
                              size={18}
                              className="button-spinner"
                           />

                           <span>
                              Logging in...
                           </span>
                        </>

                     ) : (

                        "Login"

                     )}

                  </button>

               </form>


               <div className="auth-divider">

                  <span>
                     New to CryptoTracker?
                  </span>

               </div>


               <div className="auth-footer">

                  <Link
                     to="/register"
                     className="create-account-link"
                  >
                     Create an account
                  </Link>

               </div>

            </div>


            <p className="auth-security-text">
               Your account and portfolio information
               are securely protected.
            </p>

         </section>

      </main>
   );
};

export default Login;

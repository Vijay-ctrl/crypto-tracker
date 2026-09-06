import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
   User,
   Mail,
   Lock,
   Eye,
   EyeOff,
   Coins,
   AlertCircle,
   LoaderCircle,
} from "lucide-react";

import api from "../services/api";
import { setAuth } from "../auth";

import "./Register.css";


const Register = () => {
   const navigate = useNavigate();

   const [form, setForm] = useState({
      name: "",
      email: "",
      password: "",
   });

   const [showPassword, setShowPassword] = useState(false);
   const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);


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

      const name = form.name.trim();
      const email = form.email.trim();
      const password = form.password;


      // Name validation
      if (name.length < 2) {
         setError(
            "Please enter a name with at least 2 characters."
         );
         return;
      }


      // Email validation
      if (!email) {
         setError(
            "Please enter your email address."
         );
         return;
      }


      // Password validation
      if (password.length < 6) {
         setError(
            "Password must contain at least 6 characters."
         );
         return;
      }


      setLoading(true);

      try {
         const response = await api.post(
            "/auth/register",
            {
               name,
               email,
               password,
            }
         );

         const { token, user } = response.data;


         if (!token || !user) {
            throw new Error(
               "Invalid registration response."
            );
         }


         // Save authentication
         setAuth(token, user);


         // Redirect after successful registration
         navigate("/dashboard", {
            replace: true,
         });

      } catch (error) {
         setError(
            error.response?.data?.message ||
            error.message ||
            "Registration failed. Please try again."
         );

      } finally {
         setLoading(false);
      }
   };


   return (
      <main className="register-page">

         {/* Background */}
         <div
            className="register-background"
            aria-hidden="true"
         />


         <section className="register-container">

            {/* Brand */}
            <div className="register-brand">

               <div className="register-brand-icon">
                  <Coins
                     size={28}
                     strokeWidth={2.2}
                     aria-hidden="true"
                  />
               </div>

               <h1>CryptoTracker</h1>

               <p>
                  Your personal cryptocurrency dashboard.
               </p>

            </div>


            {/* Register Card */}
            <div className="register-card">

               {/* Header */}
               <div className="register-header">

                  <h2>
                     Create your account
                  </h2>

                  <p>
                     Start tracking your crypto portfolio today.
                  </p>

               </div>


               {/* Error */}
               {error && (
                  <div
                     className="register-error-message"
                     role="alert"
                  >

                     <AlertCircle
                        size={18}
                        strokeWidth={2}
                        aria-hidden="true"
                     />

                     <span>{error}</span>

                  </div>
               )}


               {/* Form */}
               <form
                  onSubmit={handleSubmit}
                  autoComplete="on"
                  noValidate
               >

                  {/* Name */}
                  <div className="register-form-group">

                     <label htmlFor="register-name">
                        Full name
                     </label>

                     <div className="register-input-wrapper">

                        <User
                           className="register-input-icon"
                           size={18}
                           strokeWidth={2}
                           aria-hidden="true"
                        />

                        <input
                           id="register-name"
                           type="text"
                           name="name"
                           value={form.name}
                           onChange={handleChange}
                           placeholder="Enter your name"
                           autoComplete="name"
                           disabled={loading}
                           minLength={2}
                           required
                        />

                     </div>

                  </div>


                  {/* Email */}
                  <div className="register-form-group">

                     <label htmlFor="register-email">
                        Email address
                     </label>

                     <div className="register-input-wrapper">

                        <Mail
                           className="register-input-icon"
                           size={18}
                           strokeWidth={2}
                           aria-hidden="true"
                        />

                        <input
                           id="register-email"
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
                  <div className="register-form-group">

                     <label htmlFor="register-password">
                        Password
                     </label>

                     <div className="register-input-wrapper register-password-wrapper">

                        <Lock
                           className="register-input-icon"
                           size={18}
                           strokeWidth={2}
                           aria-hidden="true"
                        />

                        <input
                           id="register-password"
                           type={
                              showPassword
                                 ? "text"
                                 : "password"
                           }
                           name="password"
                           value={form.password}
                           onChange={handleChange}
                           placeholder="Minimum 6 characters"
                           autoComplete="new-password"
                           disabled={loading}
                           minLength={6}
                           required
                        />

                        <button
                           type="button"
                           className="register-password-toggle"
                           onClick={() =>
                              setShowPassword(
                                 (previous) => !previous
                              )
                           }
                           disabled={loading}
                           aria-label={
                              showPassword
                                 ? "Hide password"
                                 : "Show password"
                           }
                           title={
                              showPassword
                                 ? "Hide password"
                                 : "Show password"
                           }
                        >

                           {showPassword ? (
                              <EyeOff
                                 size={18}
                                 strokeWidth={2}
                                 aria-hidden="true"
                              />
                           ) : (
                              <Eye
                                 size={18}
                                 strokeWidth={2}
                                 aria-hidden="true"
                              />
                           )}

                        </button>

                     </div>

                     <p className="register-password-hint">
                        Use at least 6 characters.
                     </p>

                  </div>


                  {/* Register Button */}
                  <button
                     className="register-primary-button"
                     type="submit"
                     disabled={loading}
                  >

                     {loading ? (
                        <>
                           <LoaderCircle
                              size={18}
                              className="register-spinner"
                              aria-hidden="true"
                           />

                           <span>
                              Creating account...
                           </span>
                        </>
                     ) : (
                        <span>
                           Create Account
                        </span>
                     )}

                  </button>

               </form>


               {/* Footer */}
               <div className="register-footer">

                  <span>
                     Already have an account?
                  </span>

                  <Link to="/login">
                     Login
                  </Link>

               </div>

            </div>


            {/* Security Text */}
            <p className="register-security-text">
               Secure access to your CryptoTracker account
            </p>

         </section>

      </main>
   );
};


export default Register;
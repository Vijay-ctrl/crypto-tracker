import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Coins } from "lucide-react";

import api from "../services/api";
import "./ForgotPassword.css";

const ForgotPassword = () => {
   const [email, setEmail] = useState("");
   const [message, setMessage] = useState("");
   const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);

   const handleSubmit = async (e) => {
      e.preventDefault();

      setMessage("");
      setError("");
      setLoading(true);

      try {
         const response = await api.post(
            "/auth/forgot-password",
            { email }
         );

         setMessage(response.data.message);
      } catch (error) {
         setError(
            error.response?.data?.message ||
            "Unable to send reset link."
         );
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="auth-page">
         <div className="auth-brand">
            <div className="brand-icon">
               <Coins size={28} />
            </div>

            <h1>CryptoTracker</h1>
         </div>

         <div className="auth-card">
            <div className="auth-header">
               <h2>Forgot password?</h2>

               <p>
                  Enter your registered email and we'll
                  send you a password reset link.
               </p>
            </div>

            {message && (
               <div className="success-message">
                  {message}
               </div>
            )}

            {error && (
               <div className="error-message">
                  {error}
               </div>
            )}

            <form onSubmit={handleSubmit}>
               <div className="form-group">
                  <label>Email</label>

                  <div className="input-wrapper">
                     <Mail size={18} />

                     <input
                        type="email"
                        value={email}
                        onChange={(e) =>
                           setEmail(e.target.value)
                        }
                        placeholder="you@example.com"
                        required
                     />
                  </div>
               </div>

               <button
                  className="primary-button"
                  disabled={loading}
               >
                  {loading
                     ? "Sending..."
                     : "Send Reset Link"}
               </button>
            </form>

            <Link
               className="back-link"
               to="/login"
            >
               <ArrowLeft size={16} />
               Back to login
            </Link>
         </div>
      </div>
   );
};

export default ForgotPassword;
import { useState } from "react";

import {
   Link,
   useNavigate,
   useSearchParams,
} from "react-router-dom";

import {
   Lock,
   Eye,
   EyeOff,
   Coins,
   AlertCircle,
   CheckCircle,
   LoaderCircle,
} from "lucide-react";

import api from "../services/api";

import "./ResetPassword.css";


const ResetPassword = () => {

   const [searchParams] =
      useSearchParams();

   const token =
      searchParams.get("token");

   const navigate =
      useNavigate();


   const [password, setPassword] =
      useState("");

   const [
      confirmPassword,
      setConfirmPassword,
   ] = useState("");


   const [
      showPassword,
      setShowPassword,
   ] = useState(false);


   const [
      showConfirm,
      setShowConfirm,
   ] = useState(false);


   const [message, setMessage] =
      useState("");

   const [error, setError] =
      useState("");

   const [loading, setLoading] =
      useState(false);


   // ========================================
   // Password Change
   // ========================================

   const handlePasswordChange = (e) => {

      setPassword(
         e.target.value
      );

      if (error) {
         setError("");
      }

   };


   // ========================================
   // Confirm Password Change
   // ========================================

   const handleConfirmChange = (e) => {

      setConfirmPassword(
         e.target.value
      );

      if (error) {
         setError("");
      }

   };


   // ========================================
   // Submit Reset Password
   // ========================================

   const handleSubmit = async (e) => {

      e.preventDefault();


      if (loading || message) {
         return;
      }


      setError("");
      setMessage("");


      // Check reset token

      if (!token) {

         setError(
            "Invalid password reset link. Please request a new password reset link."
         );

         return;

      }


      // Check password length

      if (password.length < 6) {

         setError(
            "Password must contain at least 6 characters."
         );

         return;

      }


      // Check passwords match

      if (password !== confirmPassword) {

         setError(
            "Passwords do not match."
         );

         return;

      }


      setLoading(true);


      try {

         // Send password and token to backend

         const response =
            await api.post(

               `/auth/reset-password/${encodeURIComponent(token)}`,

               {
                  password,
               }

            );


         setMessage(

            response.data?.message ||

            "Password reset successful."

         );


         // Redirect to login after success

         setTimeout(() => {

            navigate(
               "/login",
               {
                  replace: true,
               }
            );

         }, 2000);


      } catch (error) {

         setError(

            error.response?.data?.message ||

            "Unable to reset password. Please request a new reset link."

         );


      } finally {

         setLoading(false);

      }

   };


   return (

      <main className="auth-page">


         {/* Background */}

         <div
            className="auth-background"
            aria-hidden="true"
         />


         <section className="auth-container">


            {/* ========================================
                BRAND
            ======================================== */}

            <div className="auth-brand">

               <div className="brand-icon">

                  <Coins
                     size={28}
                     aria-hidden="true"
                  />

               </div>


               <h1>
                  CryptoTracker
               </h1>


               <p>
                  Create a new secure password
               </p>

            </div>


            {/* ========================================
                RESET PASSWORD CARD
            ======================================== */}

            <div className="auth-card">


               <div className="auth-header">

                  <h2>
                     Reset password
                  </h2>


                  <p>
                     Enter and confirm your new password below.
                  </p>

               </div>


               {/* ========================================
                   SUCCESS MESSAGE
               ======================================== */}

               {message && (

                  <div
                     className="success-message"
                     role="status"
                  >

                     <CheckCircle
                        size={18}
                        aria-hidden="true"
                     />


                     <div>

                        <span>
                           {message}
                        </span>


                        <small>
                           Redirecting to login...
                        </small>

                     </div>

                  </div>

               )}


               {/* ========================================
                   ERROR MESSAGE
               ======================================== */}

               {error && (

                  <div
                     className="error-message"
                     role="alert"
                  >

                     <AlertCircle
                        size={18}
                        aria-hidden="true"
                     />


                     <span>
                        {error}
                     </span>

                  </div>

               )}


               {/* ========================================
                   FORM
               ======================================== */}

               <form
                  onSubmit={handleSubmit}
                  autoComplete="on"
                  noValidate
               >


                  {/* New Password */}

                  <div className="form-group">

                     <label htmlFor="new-password">

                        New Password

                     </label>


                     <div className="input-wrapper">

                        <Lock
                           size={18}
                           aria-hidden="true"
                        />


                        <input

                           id="new-password"

                           type={
                              showPassword
                                 ? "text"
                                 : "password"
                           }

                           value={password}

                           onChange={
                              handlePasswordChange
                           }

                           placeholder="Minimum 6 characters"

                           autoComplete="new-password"

                           minLength={6}

                           disabled={
                              loading ||
                              Boolean(message)
                           }

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

                           disabled={
                              loading ||
                              Boolean(message)
                           }

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

                              <EyeOff size={18} />

                           ) : (

                              <Eye size={18} />

                           )}

                        </button>

                     </div>

                  </div>


                  {/* Confirm Password */}

                  <div className="form-group">

                     <label htmlFor="confirm-password">

                        Confirm Password

                     </label>


                     <div className="input-wrapper">

                        <Lock
                           size={18}
                           aria-hidden="true"
                        />


                        <input

                           id="confirm-password"

                           type={
                              showConfirm
                                 ? "text"
                                 : "password"
                           }

                           value={confirmPassword}

                           onChange={
                              handleConfirmChange
                           }

                           placeholder="Confirm your password"

                           autoComplete="new-password"

                           disabled={
                              loading ||
                              Boolean(message)
                           }

                           required

                        />


                        <button

                           type="button"

                           className="password-toggle"

                           onClick={() =>
                              setShowConfirm(
                                 (previous) =>
                                    !previous
                              )
                           }

                           disabled={
                              loading ||
                              Boolean(message)
                           }

                           aria-label={
                              showConfirm
                                 ? "Hide password"
                                 : "Show password"
                           }

                           title={
                              showConfirm
                                 ? "Hide password"
                                 : "Show password"
                           }

                        >

                           {showConfirm ? (

                              <EyeOff size={18} />

                           ) : (

                              <Eye size={18} />

                           )}

                        </button>

                     </div>

                  </div>


                  {/* Submit */}

                  <button

                     className="primary-button"

                     type="submit"

                     disabled={
                        loading ||
                        Boolean(message)
                     }

                  >

                     {loading ? (

                        <>

                           <LoaderCircle
                              size={18}
                              className="button-spinner"
                           />

                           <span>
                              Updating...
                           </span>

                        </>

                     ) : (

                        <span>
                           Reset Password
                        </span>

                     )}

                  </button>


               </form>


               {/* ========================================
                   FOOTER
               ======================================== */}

               <div className="auth-footer">

                  <Link to="/login">

                     Back to Login

                  </Link>

               </div>


            </div>


         </section>


      </main>

   );

};


export default ResetPassword;
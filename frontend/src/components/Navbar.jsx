import { useEffect, useState, useRef } from "react";
import {
   Moon,
   Sun,
   LogOut,
   User,
   Coins,
   ChevronDown,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { getUser, clearAuth } from "../auth";
import "./Navbar.css";

const Navbar = () => {
   const navigate = useNavigate();

   const [darkMode, setDarkMode] = useState(
      localStorage.getItem("theme") === "dark"
   );

   const [profileOpen, setProfileOpen] = useState(false);

   const profileRef = useRef(null);

   const user = getUser();

   // Apply theme
   useEffect(() => {
      if (darkMode) {
         document.documentElement.classList.add(
            "dark-theme"
         );

         localStorage.setItem("theme", "dark");
      } else {
         document.documentElement.classList.remove(
            "dark-theme"
         );

         localStorage.setItem("theme", "light");
      }
   }, [darkMode]);

   // Close profile dropdown when clicking outside
   useEffect(() => {
      const handleClickOutside = (event) => {
         if (
            profileRef.current &&
            !profileRef.current.contains(event.target)
         ) {
            setProfileOpen(false);
         }
      };

      document.addEventListener(
         "mousedown",
         handleClickOutside
      );

      return () => {
         document.removeEventListener(
            "mousedown",
            handleClickOutside
         );
      };
   }, []);

   const toggleTheme = () => {
      setDarkMode((previous) => !previous);
   };

   const handleLogout = () => {
      clearAuth();
      navigate("/login");
   };

   const getInitials = () => {
      if (!user?.name) return "U";

      const names = user.name.trim().split(" ");

      if (names.length === 1) {
         return names[0].charAt(0).toUpperCase();
      }

      return (
         names[0].charAt(0) +
         names[names.length - 1].charAt(0)
      ).toUpperCase();
   };

   return (
      <header className="navbar">

         {/* Brand */}
         <button
            className="navbar-brand"
            onClick={() => navigate("/dashboard")}
            aria-label="Go to dashboard"
         >
            <div className="navbar-logo">
               <Coins size={20} />
            </div>

            <span>CryptoTracker</span>
         </button>


         {/* Right Side */}
         <div className="navbar-actions">

            {/* Theme Toggle */}
            <button
               className="theme-toggle"
               onClick={toggleTheme}
               title={
                  darkMode
                     ? "Switch to light mode"
                     : "Switch to dark mode"
               }
               aria-label="Toggle theme"
            >
               {darkMode ? (
                  <Sun size={19} />
               ) : (
                  <Moon size={19} />
               )}
            </button>


            {/* Profile */}
            <div
               className="profile-wrapper"
               ref={profileRef}
            >

               <button
                  className={`profile-trigger ${profileOpen ? "open" : ""
                     }`}
                  onClick={() =>
                     setProfileOpen((previous) => !previous)
                  }
                  aria-label="Open user menu"
                  aria-expanded={profileOpen}
               >

                  <div className="profile-avatar">
                     {getInitials()}
                  </div>

                  <ChevronDown
                     size={16}
                     className="profile-chevron"
                  />

               </button>


               {profileOpen && (

                  <div className="profile-dropdown">

                     <div className="profile-dropdown-header">

                        <div className="profile-dropdown-avatar">
                           {getInitials()}
                        </div>

                        <div className="profile-dropdown-info">

                           <strong>
                              {user?.name || "User"}
                           </strong>

                           <span>
                              {user?.email || "No email available"}
                           </span>

                        </div>

                     </div>


                     <div className="profile-dropdown-divider" />


                     <button
                        className="profile-menu-item"
                        onClick={() => {
                           setProfileOpen(false);
                           navigate("/profile");
                        }}
                     >
                        <User size={17} />
                        View Profile
                     </button>


                     <button
                        className="profile-menu-item logout-menu-item"
                        onClick={handleLogout}
                     >
                        <LogOut size={17} />
                        Logout
                     </button>

                  </div>

               )}

            </div>

         </div>

      </header>
   );
};

export default Navbar;
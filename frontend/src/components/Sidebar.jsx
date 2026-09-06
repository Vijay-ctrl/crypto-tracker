import {
   LayoutDashboard,
   TrendingUp,
   Wallet,
   Star,
   Bell,
   User,
   LogOut,
} from "lucide-react";

import {
   NavLink,
   useNavigate,
} from "react-router-dom";

import { logout } from "../auth";
import "./Sidebar.css";

const Sidebar = () => {
   const navigate = useNavigate();

   const links = [
      {
         name: "Dashboard",
         path: "/dashboard",
         icon: LayoutDashboard,
      },
      {
         name: "Markets",
         path: "/markets",
         icon: TrendingUp,
      },
      {
         name: "Portfolio",
         path: "/portfolio",
         icon: Wallet,
      },
      {
         name: "Watchlist",
         path: "/watchlist",
         icon: Star,
      },
      {
         name: "Alerts",
         path: "/alerts",
         icon: Bell,
      },
      {
         name: "Profile",
         path: "/profile",
         icon: User,
      },
   ];

   const handleLogout = () => {
      logout();
      navigate("/login");
   };

   return (
      <aside className="sidebar">

         {/* LOGO */}
         <div className="sidebar-logo">
            <div className="logo-mark">
               ₿
            </div>

            <span>CryptoTracker</span>
         </div>

         {/* NAVIGATION */}
         <nav className="sidebar-nav">

            <p className="nav-title">
               MENU
            </p>

            <div className="nav-links">
               {links.map((link) => {
                  const Icon = link.icon;

                  return (
                     <NavLink
                        key={link.path}
                        to={link.path}
                        className={({ isActive }) =>
                           `nav-link ${isActive ? "active" : ""}`
                        }
                     >
                        <Icon size={19} />
                        <span>{link.name}</span>
                     </NavLink>
                  );
               })}
            </div>

         </nav>

         {/* LOGOUT FOOTER */}
         <div className="sidebar-footer">
            <button
               className="logout-button"
               onClick={handleLogout}
            >
               <LogOut size={19} />

               <span>
                  Logout
               </span>
            </button>
         </div>

      </aside>
   );
};

export default Sidebar;
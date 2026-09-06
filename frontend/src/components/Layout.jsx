import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = () => {
   return (
      <div className="app-layout">
         <Sidebar />

         <div className="app-main">
            <Navbar />

            <main className="main-content">
               <Outlet />
            </main>
         </div>
      </div>
   );
};

export default Layout;
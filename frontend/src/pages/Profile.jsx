import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { getUser } from "../auth";
import "./Profile.css";

const Profile = () => {
   const user = getUser();

   const name = user?.name || "User";
   const email = user?.email || "No email available";

   const initials = name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");

   return (
      <div className="app">
         <Sidebar />

         <div className="main-area">
            <Navbar />

            <main className="dashboard profile-page">
               <div className="profile-heading">
                  <div>
                     <h1>Profile</h1>

                     <p>
                        Manage your account and view your
                        CryptoTracker profile information.
                     </p>
                  </div>
               </div>

               <section className="profile-hero">
                  <div className="profile-cover">
                     <div className="profile-cover-pattern" />
                  </div>

                  <div className="profile-main-info">
                     <div className="profile-avatar">
                        {initials || "U"}
                     </div>

                     <div className="profile-user-info">
                        <h2>{name}</h2>

                        <p>{email}</p>

                        <span className="profile-badge">
                           Active Account
                        </span>
                     </div>
                  </div>
               </section>

               <div className="profile-content-grid">
                  <section className="profile-info-card">
                     <div className="card-heading">
                        <div>
                           <h3>Account Information</h3>

                           <p>
                              Your personal account details.
                           </p>
                        </div>
                     </div>

                     <div className="profile-details-list">
                        <div className="profile-detail-row">
                           <div className="detail-icon">
                              <span>U</span>
                           </div>

                           <div className="detail-content">
                              <span>Full Name</span>

                              <strong>{name}</strong>
                           </div>
                        </div>

                        <div className="profile-detail-row">
                           <div className="detail-icon">
                              <span>@</span>
                           </div>

                           <div className="detail-content">
                              <span>Email Address</span>

                              <strong>{email}</strong>
                           </div>
                        </div>

                        <div className="profile-detail-row">
                           <div className="detail-icon">
                              <span>✓</span>
                           </div>

                           <div className="detail-content">
                              <span>Account Status</span>

                              <strong className="status-active">
                                 Active
                              </strong>
                           </div>
                        </div>
                     </div>
                  </section>

                  <section className="profile-side-column">
                     <div className="profile-summary-card">
                        <div className="summary-card-icon">
                           ◈
                        </div>

                        <div>
                           <h3>CryptoTracker Account</h3>

                           <p>
                              Your account is ready to track
                              cryptocurrencies and manage your
                              portfolio.
                           </p>
                        </div>
                     </div>

                     <div className="profile-security-card">
                        <div className="security-header">
                           <div>
                              <h3>Account Security</h3>

                              <p>
                                 Keep your account secure.
                              </p>
                           </div>

                           <span className="security-status">
                              Secure
                           </span>
                        </div>

                        <div className="security-line">
                           <span className="security-dot" />

                           <span>
                              Account authentication enabled
                           </span>
                        </div>

                        <div className="security-line">
                           <span className="security-dot" />

                           <span>
                              Your session is currently active
                           </span>
                        </div>
                     </div>
                  </section>
               </div>
            </main>
         </div>
      </div>
   );
};

export default Profile;
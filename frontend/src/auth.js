// ========================================
// Authentication Helpers
// ========================================

const TOKEN_KEY = "token";
const USER_KEY = "user";

// Old token key from previous authentication implementation.
// Kept only so we can remove it safely.
const LEGACY_TOKEN_KEY = "crypto_token";


// ========================================
// Save Authentication
// ========================================

export const setAuth = (token, user) => {
   if (!token) {
      throw new Error("Authentication token is missing.");
   }

   localStorage.setItem(TOKEN_KEY, token);

   if (user) {
      localStorage.setItem(
         USER_KEY,
         JSON.stringify(user)
      );
   }

   // Remove old/duplicate authentication token.
   localStorage.removeItem(LEGACY_TOKEN_KEY);
};


// ========================================
// Get JWT Token
// ========================================

export const getToken = () => {
   return localStorage.getItem(TOKEN_KEY);
};


// ========================================
// Get Logged-in User
// ========================================

export const getUser = () => {
   const storedUser = localStorage.getItem(USER_KEY);

   if (!storedUser) {
      return null;
   }

   try {
      return JSON.parse(storedUser);
   } catch (error) {
      console.error(
         "Unable to parse stored user:",
         error
      );

      return null;
   }
};


// ========================================
// Clear Authentication
// ========================================

export const clearAuth = () => {
   localStorage.removeItem(TOKEN_KEY);
   localStorage.removeItem(USER_KEY);

   // Also remove legacy token.
   localStorage.removeItem(LEGACY_TOKEN_KEY);
};


// ========================================
// Logout
// ========================================

export const logout = () => {
   clearAuth();
};


// ========================================
// Check Authentication
// ========================================

export const isAuthenticated = () => {
   const token = getToken();

   return Boolean(
      token &&
      typeof token === "string" &&
      token.trim()
   );
};
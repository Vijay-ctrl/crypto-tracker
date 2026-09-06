const jwt = require("jsonwebtoken");


/* =========================================================
   AUTH MIDDLEWARE
========================================================= */

const authMiddleware = (
   req,
   res,
   next
) => {

   try {

      /* ====================================================
         CHECK JWT SECRET
      ==================================================== */

      if (!process.env.JWT_SECRET) {

         console.error(
            "JWT_SECRET is not configured in environment variables."
         );

         return res.status(500).json({
            message:
               "Server authentication configuration error",
         });
      }


      /* ====================================================
         GET AUTHORIZATION HEADER
      ==================================================== */

      const authHeader =
         req.headers.authorization;


      /* ====================================================
         CHECK AUTHORIZATION HEADER
      ==================================================== */

      if (
         !authHeader ||
         typeof authHeader !== "string" ||
         !authHeader.startsWith("Bearer ")
      ) {

         return res.status(401).json({
            message:
               "Authentication required",
         });
      }


      /* ====================================================
         EXTRACT TOKEN
      ==================================================== */

      const token =
         authHeader
            .slice(7)
            .trim();


      if (!token) {

         return res.status(401).json({
            message:
               "Authentication token missing",
         });
      }


      /* ====================================================
         VERIFY TOKEN
      ==================================================== */

      const decoded =
         jwt.verify(
            token,
            process.env.JWT_SECRET
         );


      /* ====================================================
         VALIDATE JWT PAYLOAD
         
         Expected payload:
         
         {
            userId: user._id
         }
      ==================================================== */

      if (
         !decoded ||
         !decoded.userId
      ) {

         console.error(
            "JWT payload does not contain userId."
         );

         return res.status(401).json({
            message:
               "Invalid authentication token",
         });
      }


      /* ====================================================
         ATTACH DECODED USER
      ==================================================== */

      req.user = decoded;


      /* ====================================================
         ATTACH USER ID DIRECTLY
         
         Controllers can use either:
         
         req.user.userId
         
         OR
         
         req.userId
      ==================================================== */

      req.userId =
         decoded.userId;


      /* ====================================================
         CONTINUE REQUEST
      ==================================================== */

      next();

   } catch (error) {

      console.error(
         "Authentication error:",
         error.message
      );


      /* ====================================================
         JWT ERROR RESPONSES
      ==================================================== */

      if (
         error.name ===
         "TokenExpiredError"
      ) {

         return res.status(401).json({
            message:
               "Authentication token expired",
         });
      }


      if (
         error.name ===
         "JsonWebTokenError"
      ) {

         return res.status(401).json({
            message:
               "Invalid authentication token",
         });
      }


      /* ====================================================
         GENERIC AUTH ERROR
      ==================================================== */

      return res.status(401).json({
         message:
            "Authentication failed",
      });
   }
};


module.exports =
   authMiddleware;
const express = require("express");

const {
   getAlerts,
   createAlert,
   updateAlert,
   deleteAlert,
} = require("../controllers/alertController");

const authMiddleware =
   require("../middleware/authMiddleware");

const router =
   express.Router();

/* =========================================================
   GET ALL USER ALERTS
   GET /api/alerts
========================================================= */

router.get(
   "/",
   authMiddleware,
   getAlerts
);

/* =========================================================
   CREATE ALERT
   POST /api/alerts
========================================================= */

router.post(
   "/",
   authMiddleware,
   createAlert
);

/* =========================================================
   UPDATE ALERT
   PATCH /api/alerts/:id
========================================================= */

router.patch(
   "/:id",
   authMiddleware,
   updateAlert
);

/* =========================================================
   DELETE ALERT
   DELETE /api/alerts/:id
========================================================= */

router.delete(
   "/:id",
   authMiddleware,
   deleteAlert
);

module.exports = router;
const express = require("express");

const {
   getPortfolio,
   addAsset,
   deleteAsset,
} = require("../controllers/portfolioController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All portfolio routes require authentication
router.use(authMiddleware);

// GET /api/portfolio
router.get("/", getPortfolio);

// POST /api/portfolio
router.post("/", addAsset);

// DELETE /api/portfolio/:id
router.delete("/:id", deleteAsset);

module.exports = router;
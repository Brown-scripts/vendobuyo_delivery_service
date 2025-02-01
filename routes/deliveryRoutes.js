// delivery-service/routes/deliveryRoutes.js
const express = require("express");
const router = express.Router();
const deliveryController = require("../controllers/deliveryController");
const { authenticateAdmin } = require("../middleware/auth")

router.post("/", deliveryController.createDelivery);
router.put("/update-status", deliveryController.updateDeliveryStatus);
router.get("/:trackingNumber", deliveryController.getDeliveryStatus);
router.get("/", authenticateAdmin, deliveryController.getDeliveryStatus);

module.exports = router;

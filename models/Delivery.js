const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    trackingNumber: { type: String, required: true, unique: true },
    deliveryStatus: {
      type: String,
      enum: ["pending", "in_transit", "delivered", "failed", "cancelled"],
      default: "pending",
    },
    deliveryDate: { type: Date },
    notes: { type: String },
    
    // Destination location details
    destination: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      recipientPhoneNumber: { type: String, required: true }
    },

    // Current location of the delivery (can be updated in real-time)
    currentLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Delivery", deliverySchema);

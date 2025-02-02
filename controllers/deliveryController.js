const User = require("../models/User");
const Order = require("../models/Order");
const Delivery = require("../models/Delivery");
const amqp = require("amqplib/callback_api");

// Create a RabbitMQ producer function to send delivery status updates
const sendToQueue = (queue, message) => {
    const rabbitmqURL = process.env.RABBITMQ_URL;
    amqp.connect(rabbitmqURL, (error0, connection) => {
        if (error0) {
            console.error("RabbitMQ connection error:", error0);
            return;
        }
        connection.createChannel((error1, channel) => {
            if (error1) {
                console.error("RabbitMQ channel error:", error1);
                return;
            }

            channel.assertQueue(queue, { durable: true });
            channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
            console.log("Sent message to queue:", message);
        });

        setTimeout(() => connection.close(), 500);
    });
};

// Create a new delivery
exports.createDelivery = async (req, res) => {
    try {
        const { orderId, deliveryDate, notes, destination } = req.body;
        const delivery = new Delivery({
            orderId,
            deliveryDate,
            notes,
            destination,
            deliveryStatus: "pending", // Default status
        });

        await delivery.save();

        // Populate order and user details
        const populatedDelivery = await Delivery.findById(delivery._id)
            .populate({
                path: "orderId",
                populate: { path: "userId", select: "email phone" }
            });

        if (!populatedDelivery.orderId || !populatedDelivery.orderId.userId) {
            return res.status(400).json({ message: "Invalid order or user data" });
        }

        // Prepare message with targetEmail & targetPhone
        const message = {
            deliveryStatus: "pending",
            deliveryDate: deliveryDate,
            deliveryId: delivery._id,
            destination: destination,
            targetEmail: populatedDelivery.orderId.userId.email, // From populated order → user
            targetPhone: populatedDelivery.orderId.userId.phone, // From populated order → user
        };

        sendToQueue("delivery_status_queue", message);

        res.status(201).json({ message: "Delivery created", delivery });
    } catch (err) {
        res.status(500).json({ message: "Failed to create delivery", error: err.message });
    }
};

// Update delivery status and send a message to the queue
exports.updateDeliveryStatus = async (req, res) => {
    try {
        const { deliveryId, status, currentLocation } = req.body;
        const delivery = await Delivery.findById(deliveryId)
            .populate({
                path: "orderId",
                populate: { path: "userId", select: "email phone" }
            });

        if (!delivery) return res.status(404).json({ message: "Delivery not found" });

        // Update the delivery status and current location
        delivery.deliveryStatus = status;
        if (currentLocation) {
            delivery.currentLocation = currentLocation;
        }

        await delivery.save();

        // Prepare message with targetEmail & targetPhone
        const message = {
            deliveryStatus: delivery.deliveryStatus,
            deliveryDate: delivery.deliveryDate,
            deliveryId: delivery._id,
            currentLocation: delivery.currentLocation,
            targetEmail: delivery.orderId.userId.email, // From populated order → user
            targetPhone: delivery.orderId.userId.phone, // From populated order → user
        };

        sendToQueue("delivery_status_queue", message);

        res.status(200).json({ message: "Delivery status updated", delivery });
    } catch (err) {
        res.status(500).json({ message: "Failed to update delivery status", error: err.message });
    }
};

// Get delivery status
exports.getDeliveryStatus = async (req, res) => {
    try {
        const { deliveryId } = req.params;
        const delivery = await Delivery.findById(deliveryId);

        if (!delivery) return res.status(404).json({ message: "Delivery not found" });

        res.status(200).json({ delivery });
    } catch (err) {
        res.status(500).json({ message: "Failed to retrieve delivery status", error: err.message });
    }
};

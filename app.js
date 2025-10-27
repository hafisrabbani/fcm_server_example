import express from "express";
import db from "./db.js";
import cors from "cors";
import fcm from "firebase-admin";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync("./fcm_test_token.json", "utf8"));

const app = express();
app.use(express.json());
app.use(cors());

fcm.initializeApp({
  credential: fcm.credential.cert(serviceAccount),
});


app.post("/save-token", async (req, res) => {
  const { name, fcm_device_token } = req.body;
  if (!name || !fcm_device_token) {
    return res.status(400).send("Missing name or fcm_device_token");
  }
  try {
    await db("users").insert({ name, fcm_device_token });
    res.send("Token saved.");
  } catch (error) {
    res.status(500).send("Error saving token.");
  }
});

app.get("/send-notification/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).send("Missing id");
  }

  try {
    const user = await db("users").where({ id }).first();
    if (!user) {
      return res.status(404).send("User not found");
    }

    const message = {
      notification: {
        title: "Test Notif",
        body: "Notification Body",
      },
      token: user.fcm_device_token,
    };
    await fcm
      .messaging()
      .send(message)
      .then(() => {
        console.log("Notification sent");
      })
      .catch((error) => {
        console.error("Error sending notification:", error);
      });
    res.send("Notification sent");
  } catch (error) {
    res.status(500).send("Error sending notification");
  }
});

app.get("/delete-data/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).send("Missing id");
  }

  try {
    const user = await db("users").where({ id }).first();
    if (!user) {
      return res.status(404).send("User not found");
    }

    await db("users").where({ id }).del();
    res.send("User deleted successfully");
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).send("Error deleting user");
  }
});

app.get("/all-data", async (req, res) => {
  try {
    const data = await db("users").select();
    return res.status(200).json(data);
  } catch (error) {
    console.error("error get all");
    res.status(500).send(error);
  }
});

app.post("/send-notification", async (req, res) => {
  try {
    const { token, title, body, data } = req.body;

    if (!token) return res.status(400).json({ error: "Missing 'token'" });
    if (!title) return res.status(400).json({ error: "Missing 'title'" });
    if (!body) return res.status(400).json({ error: "Missing 'body'" });

    const message = {
      notification: { title, body },
      token,
      ...(data ? { data } : {}),
    };

    const response = await fcm.messaging().send(message);
    console.log("Notification sent:", response);

    res.json({
      success: true,
      message: "Notification sent successfully",
      response,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({
      error: "Failed to send notification",
      detail: error.message,
    });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

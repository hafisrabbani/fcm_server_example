import express from "express";
import db from "./db.js";
import cors from "cors";
import fcm from "firebase-admin";
import serviceAccount from "./fcm_test_token.json" assert { type: "json" };

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
        title: "KONTOL ASU",
        body: "Ini notif Tod",
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

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

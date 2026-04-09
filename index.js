"use strict";

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dns = require("dns");
const urlParser = require("url");

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// MongoDB connection
mongoose.connect(
  "mongodb+srv://guiokgui1_db_user:1234@cluster0.ckvrmuq.mongodb.net/urlshortener?appName=Cluster0"
);

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number,
});

const Url = mongoose.model("Url", urlSchema);

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.post("/api/shorturl", async (req, res) => {
  const originalUrl = req.body.url;

  // Validate URL format
  let hostname;
  try {
    hostname = new URL(originalUrl).hostname;
  } catch (err) {
    return res.json({ error: "invalid url" });
  }

  // DNS lookup validation
  dns.lookup(hostname, async (err) => {
    if (err) {
      return res.json({ error: "invalid url" });
    }

    try {
      // Check if already exists
      let foundUrl = await Url.findOne({ original_url: originalUrl });

      if (foundUrl) {
        return res.json({
          original_url: foundUrl.original_url,
          short_url: foundUrl.short_url,
        });
      }

      // Create new short URL
      const count = await Url.countDocuments();

      const newUrl = new Url({
        original_url: originalUrl,
        short_url: count + 1,
      });

      await newUrl.save();

      res.json({
        original_url: newUrl.original_url,
        short_url: newUrl.short_url,
      });
    } catch (err) {
      res.json({ error: "server error" });
    }
  });
});

// GET: redirect
app.get("/api/shorturl/:short_url", async (req, res) => {
  const shortUrl = Number(req.params.short_url);

  const urlDoc = await Url.findOne({ short_url: shortUrl });

  if (!urlDoc) {
    return res.json({ error: "invalid url" });
  }

  res.redirect(urlDoc.original_url);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

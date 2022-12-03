const express = require("express");
const client = require("mongodb").MongoClient;
const fs = require("fs");
const { Resolver } = require("node:dns");
const multer = require("multer");
// const uuidv4 = require("uuid/v4");

const app = express();
const resolver = new Resolver();
resolver.setServers(["8.8.8.8", "8.8.4.4"]);
const bodyParser = require("body-parser");
const { doesNotMatch } = require("assert");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

const storage = multer.diskStorage({
  // destination: (req, file, cb) => {
  //   cb(null, "./uploads/");
  // },
  filename: (req, file, cb) => {
    const fileName = file.originalname.toLowerCase().split(" ").join("-");
    cb(null, fileName + "-" + Date.now());
  },
});

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

const port = 8082;
const url =
  "mongodb+srv://Harshu:Harshu%4060@cluster0.ednubnx.mongodb.net/test";

const insert = (data) => {
  client.connect(url, async function (err, db) {
    try {
      if (err) throw err;
      const dbo = db.db("Chat").collection("Users");
      await dbo.insertOne(data, function (err, result) {
        if (err) throw err;
        // console.log(result);
        db.close();
      });
    } catch (e) {
      console.log(e);
      db.close();
    }
  });
};

app.post("/createUser", (req, res) => {
  client.connect(url, async function (err, db) {
    try {
      if (err) throw err;
      const dbo = db.db("Chat").collection("Users");
      const query = {
        name: req.body.name.toLowerCase(),
      };
      await dbo.find(query).toArray(function (err, result) {
        if (err) throw err;
        // console.log(result);
        db.close();
        if (result.length === 0) {
          const myobj = { name: req.body.name.toLowerCase(), role: "user" };
          insert(myobj);
          res.send(true);
        } else {
          res.send(false);
        }
      });
    } catch (e) {
      console.log(e);
      db.close();
      res.send(false);
    }
  });
});

app.post("/sendMessage", (req, res) => {
  client.connect(url, function (err, db) {
    try {
      if (err) throw err;
      const date = new Date().toLocaleTimeString("fr-FR", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "numeric",
      });

      dbo = db.db("Chat").collection("Message");
      dbo.deleteMany({
        timestamp: { $lt: Date.now() - 3600000 },
      });
      data = {
        name: req.body.user.toLowerCase(),
        message: req.body.message,
        time: date,
        timestamp: Date.now(),
        type: "t",
      };
      dbo.insertOne(data, function (err, result) {
        if (err) throw err;
        // console.log(result);
        db.close();
        res.send(true);
      });
    } catch (e) {
      console.log(e);
      db.close();
      res.send(false);
    }
  });
});

app.post("/getMessages", async (req, res) => {
  await client.connect(url, function (err, db) {
    try {
      if (err) throw err;
      const dbo = db.db("Chat").collection("Message");
      const mysort = { timestamp: -1 };
      // console.log("size", await dbo.countDocuments());
      dbo.countDocuments().then((number) => {
        // console.log(number);
        let vat = 0;
        if (number > req.body.skip) {
          vat = req.body.skip;
        }
        if (number === req.body.skip) {
          db.close();
          res.send([]);
          return;
        }
        if (number < req.body.skip) {
          db.close();
          res.send("failed");
          return;
        }
        dbo
          .find({})
          .sort(mysort)
          .limit(number - vat)
          .toArray(function (err, result) {
            if (err) throw err;
            db.close();
            res.send(result);
          });
      });
    } catch (e) {
      console.log(e);
      if (db) db.close();
      res.send(false);
    }
  });
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
    }
  },
});
app.post("/uploadphoto", upload.single("file"), (req, res, next) => {
  try {
    // console.log(file);
    var img = fs.readFileSync(req.file.path);
    var encode_image = img.toString("base64");
    // Define a JSONobject for the image attributes for saving to database

    var finalImg = {
      contentType: req.file.mimetype,
      image: new Buffer(encode_image, "base64"),
      filename: req.file.originalname,
    };
    const date = new Date().toLocaleTimeString("fr-FR", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "numeric",
    });
    const data = {
      name: req.body.user.toLowerCase(),
      message: finalImg,
      time: date,
      timestamp: Date.now(),
      type: "i",
    };
    client.connect(url, function (err, db) {
      try {
        if (err) throw err;
        const dbo = db.db("Chat").collection("Message");
        dbo.insertOne(data, (err, result) => {
          console.log(result);

          if (err) return console.log(err);

          console.log("saved to database");
          db.close();
          res.send(true);
        });
      } catch (e) {
        console.log(e);
        db.close();
        res.send(false);
      }
    });
  } catch (e) {
    console.log(e);
    res.send(false);
  }
});

app.listen(port, () => {
  console.log(`App is listening on http://localhost:${port}`);
});

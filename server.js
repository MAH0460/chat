const express = require("express");
const client = require("mongodb").MongoClient;

const app = express();
const bodyParser = require("body-parser");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
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
        console.log(result);
        db.close();
      });
    } catch (e) {
      console.log(e);
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
        console.log(result);
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
      res.send(false);
    }
  });
});

app.post("/sendMessage", (req, res) => {
  try {
    client.connect(url, function (err, db) {
      if (err) throw err;
      const date = new Date();

      dbo = db.db("Chat").collection("Message");
      dbo.deleteMany({
        timestamp: { $lt: Date.now() - 3600000 },
      });
      data = {
        name: req.body.user.toLowerCase(),
        message: req.body.message,
        time: date.getHours() + ":" + date.getMinutes(),
        timestamp: Date.now(),
      };
      dbo.insertOne(data, function (err, result) {
        if (err) throw err;
        console.log(result);
        db.close();
        res.send(true);
      });
    });
  } catch (e) {
    console.log(e);
    res.send(false);
  }
});

app.get("/getMessages", (req, res) => {
  try {
    client.connect(url, function (err, db) {
      if (err) throw err;
      const dbo = db.db("Chat").collection("Message");
      const mysort = { timestamp: 1 };
      dbo
        .find({})
        .sort(mysort)
        .toArray(function (err, result) {
          if (err) throw err;
          db.close();
          res.send(result);
        });
    });
  } catch (e) {
    console.log(e);
    res.send(false);
  }
});

app.listen(port, () => {
  console.log(`App is listening on http://localhost:${port}`);
});

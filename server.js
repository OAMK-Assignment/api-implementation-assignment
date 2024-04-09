const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use(express.json());
const users = [];

app.post("/signup", (req, res) => {
  const { userHandle, password } = req.body;
  if (!userHandle || !password) {
    return res.status(400).send({ message: "Invalid request body" });
  }
  if (userHandle.length < 6 || password.length < 6) {
    return res.status(400).send({
      message: "userHandle and password must be at least 6 characters long",
    });
  }
  users.push({ userHandle, password });
  res.status(201).send({ message: "User registered successfully" });
});

app.post("/login", (req, res) => {
  const { userHandle, password } = req.body;
  if (typeof userHandle !== "string" || typeof password !== "string") {
    return res
      .status(400)
      .json({ message: "User handle and password must be strings" });
  }
  if (!userHandle || !password) {
    return res
      .status(400)
      .json({ message: "User handle and password are required" });
  }

  const unknownFields = Object.keys(req.body).filter(
    (field) => !["userHandle", "password"].includes(field)
  );
  if (unknownFields.length > 0) {
    return res
      .status(400)
      .json({ message: `Unknown field(s): ${unknownFields.join(", ")}` });
  }
  const user = users.find((u) => u.userHandle === userHandle);
  if (user && password === user.password) {
    const token = jwt.sign({ userHandle }, secretKey);
    return res.status(200).json({ jsonWebToken: token });
  } else {
    return res
      .status(401)
      .json({ message: "Unauthorized, incorrect username or password" });
  }
});

const jwt = require("jsonwebtoken");
const secretKey = "somesecretkey";

let highScores = [];

app.post("/high-scores", verifyToken, (req, res) => {
  const { level, userHandle, score, timestamp } = req.body;

  if (!level || !userHandle || !score || !timestamp) {
    return res.status(400).json({
      message: "Level, user handle, Timestam and score are required fields",
    });
  }

  highScores.push({ level, userHandle, score, timestamp });
  res.status(201).json({ message: "High score posted successfully" });
});

function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const token = bearer[1];

    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token" });
      }
      next();
    });
  } else {
    res.status(401).json({ message: "Unauthorized, token is required" });
  }
}

app.get("/high-scores", (req, res) => {
  const { level, page } = req.query;
  const pageNumber = parseInt(page) || 1;
  const pageSize = 20;
  const startPage = (pageNumber - 1) * pageSize;
  const endPage = startPage + pageSize;

  const highScoresLevel = highScores.filter((score) => score.level === level);
  if (highScoresLevel.length === 0) {
    return res.status(200).json([]);
  }

  const sortHighScoreResult = highScoresLevel.sort((a, b) => b.score - a.score);
  const HighScoresPage = sortHighScoreResult.slice(startPage, endPage);
  return res.status(200).json(HighScoresPage);
});

let serverInstance = null;
module.exports = {
  start: function () {
    serverInstance = app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  },
  close: function () {
    serverInstance.close();
  },
};

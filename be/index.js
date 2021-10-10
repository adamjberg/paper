import aws from "aws-sdk";
import { ObjectId } from "mongodb";
import bcrypt from 'bcrypt'; 
import express from "express";
import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import cookieParser from 'cookie-parser';
import { DatabaseMiddleware } from "./middleware/DatabaseMiddleware.js";
import { getEnv } from "./env.js";
import jwt from "jsonwebtoken";
import { AuthMiddleware } from "./middleware/AuthMiddleware.js";
import { AuthRequiredMiddleware } from "./middleware/AuthRequiredMiddleware.js";

const app = express();
const s3 = new aws.S3({ endpoint: "https://sfo3.digitaloceanspaces.com" });

app.use(express.json());
app.use(cookieParser());
app.use(DatabaseMiddleware);
app.use(AuthMiddleware);

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "xyzdigital",
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(
        null,
        `engram/uploads/5fa634ca7fd6d6c5e4eb1fb6/${Date.now().toString()}.jpg`
      );
    },
  }),
});

async function setToken(res, user) {
  const { jwtSecret, production } = getEnv();
  return new Promise((resolve, reject) => {
    jwt.sign(
      {
        user,
      },
      jwtSecret,
      function (err, token) {
        if (err) {
          return reject(err);
        }

        res.cookie("token", token, {
          secure: production,
          httpOnly: true,
          sameSite: false,
        });
        resolve();
      }
    );
  });
}

app.post("/api/login", async function (req, res, next) {
  const { db } = req;
  const { username, password } = req.body;
  const user = await db.collection("users").findOne({
    $or: [{ username }, { email: username }],
  });

  const invalidLoginMessage =
    "You have entered an invalid username or password";

  if (!user) {
    return res.status(400).json({
      errors: [invalidLoginMessage],
    });
  }

  let passwordsMatch = false;

  if (user.hashedPassword) {
    passwordsMatch = await bcrypt.compare(password, user.hashedPassword);
  }

  if (passwordsMatch) {
    await setToken(res, String(user._id));

    res.json({
      success: true,
    });
  } else {
    return res.status(400).json({
      errors: [invalidLoginMessage],
    });
  }
});

app.get("/api/drawings", AuthRequiredMiddleware, async function(req, res, next) {
  const { db, user } = req;

  const drawings = await db.collection("notes").find({
    user: new ObjectId(user),
    type: "drawing",
  }).sort({ createdAt: -1 }).limit(1).toArray();
  const drawing = drawings.length ? drawings[0] : null;

  return res.json({
    data: drawing
  })
});

app.get("/api/drawings/:id", AuthRequiredMiddleware, async function(req, res, next) {
  const { db, user, params: { id } } = req;


  const findOptions = {
    _id: new ObjectId(id),
    user: new ObjectId(user),
    type: "drawing",
  }
  const drawing = await db.collection("notes").findOne(findOptions);

  return res.json({
    data: drawing
  })
});

app.post("/api/drawings", AuthRequiredMiddleware, upload.single("drawing"), async function (req, res, next) {
  const { db, user } = req;
  const drawing = await db.collection("notes").insertOne({
    user: new ObjectId(user),
    type: "drawing",
    url: req.file.location,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  return res.json({
    success: true,
  });
});

app.use(express.static("../vanilla"));
app.get("*", function(req, res, next) {
  res.sendFile(path.resolve("../vanilla/index.html"));
})

app.listen(3001, function () {
  console.log("Server listening on port 3001.");
});

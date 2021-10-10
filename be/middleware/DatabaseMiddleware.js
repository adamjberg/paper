import mongodb from "mongodb";
import { getEnv } from "../env.js";

let db = null;

export async function initializeDb() {
  const { url } = getEnv();
  const client = await mongodb.MongoClient.connect(url);
  db = client.db();

  console.log(`Connected`);
  return db;
}

export async function getDb() {
  if (!db) {
    db = await initializeDb();
  }

  return db;
}

export async function DatabaseMiddleware(req, res, next) {
  req.db = await getDb();
  next();
}

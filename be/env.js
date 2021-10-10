import dotenv from "dotenv";

let env = null;

export function getEnv() {
  if (!env) {
    initializeEnv();
  }

  return env;
}

export function initializeEnv() {
  dotenv.config();
  env = {
    url: readSecret("DB_URL"),
    jwtSecret: readSecret("JWT_SECRET"),
    port: Number(process.env.PORT) || 4000,
    production: process.env.NODE_ENV === "production",
  };
}

function readSecret(secretName) {
  return process.env[secretName];
}

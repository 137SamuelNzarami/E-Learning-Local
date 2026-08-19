import dotenv from "dotenv";
dotenv.config();
export const env = {
  appName: process.env.APP_NAME,
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
  uploadPath: process.env.UPLOAD_PATH,
  corsOrigin: process.env.CORS_ORIGIN,
};
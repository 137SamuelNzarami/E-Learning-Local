import mysql from "mysql2/promise";
import { env } from "./env.js";

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,

  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 4,
  idleTimeout: 60000,
  waitForConnections: true,
  queueLimit: 20,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export default pool;

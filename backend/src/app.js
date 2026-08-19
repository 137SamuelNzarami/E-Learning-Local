import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import corsOptions from "./config/cors.js";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import pool from "./config/database.js";
import logger from "./middlewares/logger.js";
import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";
import router from "./routes/auth.route.js";
import userRoutes from "./routes/user.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import formationRoutes from "./routes/formation.routes.js";
import moduleRoutes from "./routes/module.routes.js";
import chapterRoutes from "./routes/chapter.routes.js";
import lessonRoutes from "./routes/lesson.routes.js";
import videoRoutes from "./routes/video.routes.js";
import documentRoutes from "./routes/document.routes.js";
import quizRoutes from "./routes/quiz.routes.js";
import questionRoutes from "./routes/question.routes.js";
import answerRoutes from "./routes/answer.routes.js";
import enrollmentRoutes from "./routes/enrollment.routes.js";
import ProgressionRoutes from "./routes/progression.routes.js";
import attemptRoutes from "./routes/attempt.routes.js";
import assignmentRoutes from "./routes/assignment.routes.js";
import submissionRoutes from "./routes/submission.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import conversationParticipantRoutes from "./routes/conversation-participant.routes.js";
import messageRoutes from "./routes/message.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import studentAnswerRoutes from "./routes/student-answer.routes.js";
import fileRoutes from "./routes/file.routes.js";

dotenv.config();

const app = express();
app.use(logger);

/**
 * Middlewares globaux
 */
app.use(cors(corsOptions));
app.use(
  helmet({
    // Les médias (vidéos) et documents sont chargés en cross-origin
    // depuis le frontend (localhost:5180) via /api/files.
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(morgan("dev"));

/**
 * Route de test
 */

app.get("/", (req, res) => {
  res.json({
    application: "TUTORE",
    version: "1.0.0",
    status: "API opérationnelle",
  });
});

app.get("/api/test-db", async (req, res) => {
  try {
    const connection = await pool.getConnection();

    await connection.ping();

    connection.release();

    res.json({
      success: true,
      message: "Connexion à la base de données réussie.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Impossible de se connecter à la base de données.",
    });
  }
});

// Route de l'API
app.use("/api/auth", router);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/formations", formationRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/answers", answerRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/progressions", ProgressionRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/conversation-participants", conversationParticipantRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/student-answers", studentAnswerRoutes);

/**
 * Fichiers uploadés (vidéos, documents, soumissions, consignes).
 * Protégés : authentification + contrôle d'accès par ressource.
 */
app.use("/api/files", fileRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

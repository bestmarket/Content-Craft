import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import promptsRouter from "./prompts";
import contentRouter from "./content";
import thumbnailsRouter from "./thumbnails";
import videoModelRouter from "./video-model";
import pdfsRouter from "./pdfs";
import apiKeysRouter from "./api-keys";
import paymentGatewaysRouter from "./payment-gateways";
import featuresRouter from "./features";
import settingsRouter from "./settings";
import chatRouter from "./chat";
import dashboardRouter from "./dashboard";
import seedRouter from "./seed";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(promptsRouter);
router.use(contentRouter);
router.use(thumbnailsRouter);
router.use(videoModelRouter);
router.use(pdfsRouter);
router.use(apiKeysRouter);
router.use(paymentGatewaysRouter);
router.use(featuresRouter);
router.use(settingsRouter);
router.use(chatRouter);
router.use(dashboardRouter);
router.use(seedRouter);

export default router;

import { Router } from "express";
import { PlatformAnalytics } from "../controllers/dashboard.controller.js";
import { verifyAuth } from "../middlewares/verifyAuth.js"
const router = Router();

router.route('/').get(verifyAuth,PlatformAnalytics)
export default router
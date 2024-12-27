import { Router } from "express";
import { verifyAuth } from "../middlewares/verifyAuth.js";
import { allFavourateVideos, toggleLikeStatus } from "../controllers/like.controller.js";
const router = Router();

router.route('/toggle-like-status/:videoId').post(verifyAuth,toggleLikeStatus)
router.route('/all-favourate-videos/:userId').get(verifyAuth,allFavourateVideos)


export default router;
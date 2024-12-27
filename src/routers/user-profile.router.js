import {Router} from "express";
import { getUserInfo } from "../controllers/profile.controller.js";
import { verifyAuth } from "../middlewares/verifyAuth.js";
const router = Router();

router.route('/user-profile/:userId').get(verifyAuth,getUserInfo)
// router.route('/user-likes/:userId').get(verifyAuth,totalLikes)

export default router
import { Router } from "express";
import { addCommnet, deleteComment, editComments } from "../controllers/comment.controller.js";
import { verifyAuth } from "../middlewares/verifyAuth.js";
const router = Router();

router.route('/add-comment/:videoId').post(verifyAuth,addCommnet);
router.route('/c/edit-comment/:commentId').patch(verifyAuth,editComments);
router.route('/c/delete-comment/:commentId').delete(verifyAuth,deleteComment);
export default router;
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyAuth } from "../middlewares/verifyAuth.js";
import { clearWatchHistory, deleteVideo, getVideo, publishVideo, updateVideo, updateViews } from "../controllers/video.controller.js";
const router = Router();

router.route("/upload-video").post(verifyAuth,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "videoFile", maxCount: 1 },
  ]),
  publishVideo
);
router.route('/get-video/:videoId').get(verifyAuth,getVideo);
router.route('/update-video/:videoId').patch(verifyAuth,upload.single('thumbnail'),updateVideo)
router.route('/delete-video/:videoId').delete(verifyAuth,deleteVideo);
router.route('/update-views').patch(verifyAuth,updateViews);
router.route('/clear-watchhistory').put(verifyAuth,clearWatchHistory);

export default router;

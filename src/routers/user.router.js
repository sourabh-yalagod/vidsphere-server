import { Router } from "express";
const router = Router();
import {
  RegisterUser,
  VideosFromSubscription,
  changeAvatar,
  changeCoverImage,
  changePassword,
  deleteUserAccount,
  getUser,
  getUserProfile,
  handleSubscribers,
  loginUser,
  logout,
  newRefreshToken,
  updateAccount,
  watchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyAuth } from "../middlewares/verifyAuth.js";
import { allWatchLaterVideos, removeWatchLaterVideos, watchLatervideos } from "../controllers/video.controller.js";

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  RegisterUser
);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyAuth, logout);
router.route("/change-password").patch(verifyAuth, changePassword);
router.route("/generate-newtokens").get(verifyAuth, newRefreshToken);
router.route("/get-user").get(verifyAuth, getUser);
router.route("/update-account").patch(verifyAuth, updateAccount);
router.route("/change-avatar").patch(verifyAuth ,upload.single('avatar'), changeAvatar);
router.route("/change-coverimage").patch(verifyAuth,upload.single('coverImage'), changeCoverImage);
router.route("/get-user-detail/:userId").get(verifyAuth,getUserProfile);
router.route("/handle-subscribers").post(verifyAuth,handleSubscribers);
router.route("/watch-history/:userId").get(verifyAuth,watchHistory);
router.route("/watch-later").post(verifyAuth,watchLatervideos);
router.route("/remove-watch-later-video").patch(verifyAuth,removeWatchLaterVideos);
router.route("/all-watch-later-videos/:userId").get(verifyAuth,allWatchLaterVideos);
router.route("/delete-user-account/:userId").delete(verifyAuth,deleteUserAccount);
router.route("/subscriptions-status/:userId").get(verifyAuth,VideosFromSubscription);

export default router;

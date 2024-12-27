import { Router } from "express";
import { verifyAuth } from "../middlewares/verifyAuth.js";
import { addVideoToPlaylist, createPlayList, deletePlaylist, deleteVideoFromPlaylist, editPlaylist, getAllPlaylist, videosFromPlaylist } from "../controllers/playList..controller.js";
import {upload} from "../middlewares/multer.middleware.js"
const router = Router()


router.route('/create-playlist').post(verifyAuth,upload.single('thumbnail'),createPlayList)
router.route('/new-video/:videoId/:playlistId').post(verifyAuth,addVideoToPlaylist)
router.route('/delete-video/:videoId/:playlistId').delete(verifyAuth,deleteVideoFromPlaylist)
router.route('/all-play-lists/:userId').get(verifyAuth,getAllPlaylist)
router.route('/delete-playlist/:playlistId').delete(verifyAuth,deletePlaylist)
router.route('/modify-playlist/:playlistId').put(verifyAuth,upload.single('thumbnail'),editPlaylist)
router.route('/all-playlist-videos/:playlistId').get(verifyAuth,videosFromPlaylist)

export default router

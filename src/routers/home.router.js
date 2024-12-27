import { Router } from "express";
import { getAllvideos, getVideoBySearch } from "../controllers/home.controller.js";
const router = Router();

router.route("/").get(getAllvideos);
router.route('/search-video').get(getVideoBySearch);
export default router
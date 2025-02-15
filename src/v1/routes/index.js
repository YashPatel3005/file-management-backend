import express from "express";
import folderRoute from "./folder.route.js";
import fileRoute from "./file.route.js";

const router = express.Router();

router.use("/api/folder", folderRoute);
router.use("/api/file", fileRoute);

export default router;

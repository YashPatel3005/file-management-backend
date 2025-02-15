import express from "express";
import { getSelectedFile, uploadFile } from "../controller/file.controller.js";
import { upload } from "../../middleware/fileUpload.middleware.js";

const router = express.Router();

router.post("/upload", upload.single("file"), uploadFile);

router.get("/:id", getSelectedFile);

export default router;

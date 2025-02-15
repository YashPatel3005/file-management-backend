import express from "express";
import {
  createFolder,
  deleteFolder,
  getFoldersAndFiles,
  getFoldersAndFilesById,
  updateFolder,
} from "../controller/folder.controller.js";
import { folderSchema } from "../../schema/folder.schema.js";
import validateResource from "../../middleware/validateResource.middleware.js";

const router = express.Router();

router.post("/create", validateResource(folderSchema), createFolder);

router.get("/list", getFoldersAndFiles);

router.patch("/update/:id", updateFolder);

router.delete("/delete/:id", deleteFolder);

router.get("/sub-folders/:id", getFoldersAndFilesById);

export default router;

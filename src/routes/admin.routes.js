import { Router } from "express";
import isAuthenticated from "../middlewares/isAuthenticated.middleware.js";
const adminRouter = Router();
import {
  isAdmin,
  createProblemController,
  deleteProblemController,
  updateProblemController,
  getAllProblemsController,
  getInactiveProblemsController,
  createSheetController,
  createSheetSection,
  addProblemsToSection,
  getAllSheets,
  getSheetData
} from "../controllers/admin.controller.js";
import { is } from "zod/locales";

/* verifying if it is admin or not*/
adminRouter.get("/admin/dashboard", isAuthenticated, isAdmin, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the admin dashboard",
  });
})

/*---------Routes for problems*/
adminRouter.post(
  "/create-problem",
  isAuthenticated,
  isAdmin,
  createProblemController,
);
adminRouter.delete(
  "/delete-problem/:slug",
  isAuthenticated,
  isAdmin,
  deleteProblemController,
);
adminRouter.get(
  "/get-all-problems/:page",
  isAuthenticated,
  isAdmin,
  getAllProblemsController,
);
adminRouter.get(
  "/get-inactive-problems",
  isAuthenticated,
  isAdmin,
  getInactiveProblemsController,
);
adminRouter.put(
  "/update-problem/:slug",
  isAuthenticated,
  isAdmin,
  updateProblemController,
);

/*---------Routes for sheets */
adminRouter.post(
  "/create-sheet",
  isAuthenticated,
  isAdmin,
  createSheetController,
);
adminRouter.post(
  "/sheet/:sheetSlug/section/create-subsection",
  isAuthenticated,
  isAdmin,
  createSheetSection,
);
adminRouter.post(
  "/section/:sectionId/add-problems",
  isAuthenticated,
  isAdmin,
  addProblemsToSection,
);

adminRouter.get("/sheet/:slug",isAuthenticated,isAdmin,getSheetData);

adminRouter.get("/get-sheets",isAuthenticated , isAdmin,getAllSheets);
export default adminRouter;

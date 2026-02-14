import ApiResponse from "../utils/ApiResponse.js";
import generateSlug from "../utils/genereateSlug.utils.js";
import asyncHandler from "../utils/AsyncHandler.js";
import { prisma } from "../lib/prisma.js";

/* -------------------- ADMIN CHECK -------------------- */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return res
      .status(403)
      .json(new ApiResponse(403, "Forbidden", "Admin access required"));
  }
  next();
};

/************* Problems Controllers */
/* -------------------- CREATE PROBLEM -------------------- */
const createProblemController = asyncHandler(async (req, res) => {
  const { title, description, difficulty, tags, link, companies } = req.body;

  if (!title || !difficulty) {
    return res
      .status(400)
      .json(new ApiResponse(400, "Title and difficulty are required"));
  }

  let slug = generateSlug(title);

  // prevent slug collision
  const existing = await prisma.problem.findUnique({ where: { slug } });
  if (existing) slug = slug + "-" + Date.now();

  const newProblem = await prisma.problem.create({
    data: {
      title,
      description,
      difficulty,
      tags,
      link,
      slug,
      companies,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newProblem, "Problem created successfully"));
});

/* -------------------- DELETE (SOFT DELETE) -------------------- */
const deleteProblemController = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const problem = await prisma.problem.findFirst({
    where: { slug, isActive: true },
  });

  if (!problem) {
    return res
      .status(404)
      .json(new ApiResponse(404, "Problem not found or already deleted"));
  }

  const deletedProblem = await prisma.problem.update({
    where: { slug },
    data: { isActive: false },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, deletedProblem, "Problem deleted successfully"));
});

/* -------------------- UPDATE PROBLEM -------------------- */
const updateProblemController = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const problem = await prisma.problem.findFirst({
    where: { slug, isActive: true },
  });

  if (!problem) {
    return res.status(404).json(new ApiResponse(404, "Problem not found"));
  }

  const updatedData = {};
  const allowedFields = [
    "title",
    "description",
    "difficulty",
    "tags",
    "link",
    "companies",
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updatedData[field] = req.body[field];
    }
  }

  // handle title → slug change safely
  if (updatedData.title) {
    let newSlug = generateSlug(updatedData.title);

    const existing = await prisma.problem.findUnique({
      where: { slug: newSlug },
    });

    if (existing && existing.slug !== slug) {
      newSlug += "-" + Date.now();
    }

    updatedData.slug = newSlug;
  }

  const updatedProblem = await prisma.problem.update({
    where: { slug },
    data: updatedData,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedProblem, "Problem updated successfully"));
});

/* -------------------- GET ACTIVE PROBLEMS (PUBLIC) -------------------- */
const getAllProblemsController = asyncHandler(async (req, res) => {
  const page = parseInt(req.params.page) || 1;
  const problemsPerPage = parseInt(process.env.PROBLEMS_PER_PAGE) || 10;

  // 1️⃣ Get total count
  const totalProblems = await prisma.problem.count({
    where: { isActive: true },
  });

  const totalPages = Math.ceil(totalProblems / problemsPerPage);

  // If page exceeds totalPages
  if (page > totalPages && totalProblems !== 0) {
    return res.status(404).json(new ApiResponse(404, "Page not found"));
  }

  // 2️⃣ Get paginated data
  const problems = await prisma.problem.findMany({
    skip: (page - 1) * problemsPerPage,
    take: problemsPerPage,
    where: { isActive: true },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        problems,
        pagination: {
          totalProblems,
          totalPages,
          currentPage: page,
          problemsPerPage,
        },
      },
      "Problems fetched successfully",
    ),
  );
});

/* -------------------- GET INACTIVE PROBLEMS (ADMIN) -------------------- */
const getInactiveProblemsController = asyncHandler(async (req, res) => {
  const inActiveProblems = await prisma.problem.findMany({
    where: { isActive: false },
  });

  if (inActiveProblems.length === 0) {
    return res
      .status(404)
      .json(new ApiResponse(404, "No inactive problems found"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        inActiveProblems,
        "Inactive problems fetched successfully",
      ),
    );
});

/* -------------------------------Sheet Controllers------------------------*/

/*-----------------Create Sheet---------*/
const createSheetController = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title) {
    return res
      .status(401)
      .json(
        new ApiResponse(
          401,
          "Invalid Input Fields",
          "Title is required for the sheet",
        ),
      );
  }

  const slug = generateSlug(title);
  const newSheet = await prisma.sheet.create({
    data: {
      title,
      description,
      slug,
    },
  });

  if (!newSheet) {
    return res
      .status(401)
      .json(
        new ApiResponse(
          401,
          "Internal Server Error",
          "Unable to create the sheet at the moment",
        ),
      );
  }

  return res
    .status(201)
    .json(new ApiResponse(201, newSheet, "New Sheet Created Successfully"));
});

/*--------------Adding subsection to the sheet-------------------*/
const createSheetSection = asyncHandler(async (req, res) => {
  const { sheetSlug } = req.params;
  const { title, description } = req.body;
  /*
   firstly we need to find the sheet with the given slug
   then we need to find the last order of the sections that has been created in the sheet
  then create a new section with order + 1
  */

  const sheetFromSlug = await prisma.sheet.findUnique({
    where: {
      slug: sheetSlug,
    },
  });

  if (!sheetFromSlug) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          404,
          "Sheet Not Found",
          "No sheet found with the given slug",
        ),
      );
  }

  // finding the last order of the sections in the sheet
  const lastOrder = await prisma.sheetSection.findFirst({
    where: {
      sheetId: sheetFromSlug.id,
    },
    orderBy: {
      order: "desc",
    },
    select: {
      order: true,
    },
  });

  console.log("Last order of the sections is ", lastOrder);

  // adding 1 to last order
  const curOrder = lastOrder ? lastOrder.order + 1 : 1;

  const newSectionInSheet = await prisma.sheetSection.create({
    data: {
      title,
      description,
      order: curOrder,
      sheetId: sheetFromSlug.id,
    },
  });

  if (!newSectionInSheet) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          "Internal Server Error",
          "Unable to create section in the sheet at the moment",
        ),
      );
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        newSectionInSheet,
        "New Section Created in the Sheet Successfully",
      ),
    );

  // problems here would be an array having slugs of the problems that are supposed to be added in the sheet
});

/*-----------------Adding problems to the section in the sheet-------------------*/
const addProblemsToSection = asyncHandler(async (req, res) => {
  const { sectionId } = req.params;
  const { problems: problemIds } = req.body;

  // ✅ 1. Validate input
  if (!Array.isArray(problemIds) || problemIds.length === 0) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Problems array required"));
  }

  const count = await prisma.$transaction(async (tx) => {
    // ✅ 2. Check section exists
    const section = await tx.sheetSection.findUnique({
      where: { id: sectionId },
      select: { id: true },
    });

    if (!section) throw new Error("Section not found");

    // ✅ 3. Fetch problems
    const problemRecords = await tx.problem.findMany({
      where: {
        id: { in: problemIds },
      },
      select: { id: true },
    });

    if (problemRecords.length !== problemIds.length) {
      throw new Error("Some problem IDs are invalid");
    }

    // ✅ 4. Get last order
    const last = await tx.sectionProblem.findFirst({
      where: { sectionId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    let order = last ? last.order + 1 : 1;

    // ✅ 5. Create mappings
    const mappings = problemRecords.map((p) => ({
      sectionId,
      problemId: p.id,
      order: order++,
    }));

    await tx.sectionProblem.createMany({
      data: mappings,
      skipDuplicates: true,
    });

    return mappings.length;
  });

  return res
    .status(200)
    .json(new ApiResponse(200, count, "Problems added successfully"));
});

/*---------------------Get all the sheets----------------------*/
const getAllSheets = asyncHandler(async (req, res) => {
  try {
    const sheets = await prisma.sheet.findMany({});
    if (!sheets || sheets.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "No sheets found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, sheets, "Sheets fetched successfully"));
  } catch (error) {
    console.log("Error occured while fetching sheets", error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Internal Server Error"));
  }
});

const getSheetData = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  console.log(slug);
  if (!slug)
    return res.status(404).json(new ApiResponse(404, null, "Slug not found"));

  const sheetData = await prisma.sheet.findFirst({
    where: { slug },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          problems: {
            orderBy: { order: "asc" },
            include: {
              problem: true,
            },
          },
        },
      },
    },
  });

  if (!sheetData)
    return res
      .status(500)
      .json(
        new ApiResponse(500, null, "Unable to fetch sheet data at the moement"),
      );

  return res
    .status(200)
    .json(new ApiResponse(200, sheetData, "Fetched sheet data successfully"));

  // return res.status(200).json(slug);
});

/* ------------------------------------------------------------------------ */

export {
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
  getSheetData,
};

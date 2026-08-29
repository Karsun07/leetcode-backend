const express = require('express');
const adminMiddleware = require('../middleware/adminMiddleware');
const userMiddleware = require('../middleware/userMiddleware');
const {createProblem,updateProblem,deleteProblem,getProblemById,getProblemByIdAdmin,getAllProblem,solvedAllProblemByUser,submittedProblem}=require("../controllers/userProblem");
const problemRouter =  express.Router();


// Create
problemRouter.post("/create",adminMiddleware,createProblem);
problemRouter.put("/update/:id", adminMiddleware,updateProblem);
problemRouter.delete("/delete/:id",adminMiddleware,deleteProblem);

// NOTE: these must come before "/:id" or that wildcard route swallows them
problemRouter.get("/user", userMiddleware, solvedAllProblemByUser);
// full problem detail (incl. hiddenTestCases) — only for the admin "Update Problem" form
problemRouter.get("/admin/:id", adminMiddleware, getProblemByIdAdmin);

problemRouter.get("/submittedProblem/:pid",userMiddleware,submittedProblem);
problemRouter.get("/", getAllProblem);

problemRouter.get("/:id",getProblemById);


// fetch
// update
// delete 
module.exports=problemRouter;
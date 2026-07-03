const express = require('express');
const adminMiddleware = require('../middleware/adminMiddleware');
const userMiddleware = require('../middleware/userMiddleware');
const {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,solvedAllProblemByUser,submittedProblem}=require("../controllers/userProblem");
const problemRouter =  express.Router();


// Create
problemRouter.post("/create",adminMiddleware,createProblem);
problemRouter.put("/update/:id", adminMiddleware,updateProblem);
problemRouter.delete("/delete/:id",adminMiddleware,deleteProblem);

// NOTE: these must come before "/:id" or that wildcard route swallows them
problemRouter.get("/user", userMiddleware, solvedAllProblemByUser);

problemRouter.get("/submittedProblem/:pid",userMiddleware,submittedProblem);
problemRouter.get("/", getAllProblem);

problemRouter.get("/:id",getProblemById);


// fetch
// update
// delete 
module.exports=problemRouter;

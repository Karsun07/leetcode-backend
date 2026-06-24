const express = require('express');
const adminMiddleware = require('../middleware/adminMiddleware');
const createProblem=require("../controllers/userProblem");
const problemRouter =  express.Router();


// Create
problemRouter.post("/create",adminMiddleware,createProblem);
// problemRouter.patch("/:id", updateProblem);
// problemRouter.delete("/:id",deleteProblem);


// problemRouter.get("/:id",getProblemById);
// problemRouter.get("/", getAllProblem);
// problemRouter.get("/user", solvedProblemByUser);

// fetch
// update
// delete 
module.exports=problemRouter;

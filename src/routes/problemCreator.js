const express = require('express');
const adminMiddleware = require('../middleware/adminMiddleware');
const {createProblem,updateProblem,deleteProblem}=require("../controllers/userProblem");
const problemRouter =  express.Router();


// Create
problemRouter.post("/create",adminMiddleware,createProblem);
problemRouter.put("/update/:id", adminMiddleware,updateProblem);
problemRouter.delete("/delete/:id",adminMiddleware,deleteProblem);


// problemRouter.get("/:id",getProblemById);
// problemRouter.get("/", getAllProblem);
// problemRouter.get("/user", solvedProblemByUser);

// fetch
// update
// delete 
module.exports=problemRouter;

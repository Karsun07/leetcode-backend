const { getLanguageById ,submitBatch} = require("../utils/problemUtility");

const createProblem=(req,res)=>{
    const {title,description,difficulty,tags,visibleTestCases,hiddenTestCases,
            startCode,refSolution,problemCreator} = req.body;
    try{
        for(const {language,completeCode} of refSolution){

            const languageId=getLanguageById(language);

            const submissions=visibleTestCases.map((input,output)=>({
                    source_code:completeCode,
                    language_id:languageId,
                    stdin:input,
                    expected_output:output                
            }))
            const submitResult=await submitBatch(submissions);

        }
    }
    catch(err){
          console.log(err);
    }
}
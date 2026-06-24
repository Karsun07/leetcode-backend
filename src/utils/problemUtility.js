const axios=require("axios");

const getLanguageById=(lang)=>{
    const language={
        "c++":54,
        "java":62,
        "javascript":"63"
    }
    return language[lang.toLowerCase()];
}

const submitBatch=async (submissions)=>{
  
    const options = {
  method: 'POST',
  url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
  params: {
    base64_encoded: 'true'
  },
  headers: {
    'x-rapidapi-key': '2823e8bad8msh4ade90106d368f4p1ffc72jsnaa1494cfa11a',
    'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
    'Content-Type': 'application/json'
  },
  data: submissions
};

async function FetchData(){
    try{
        const response=await axios.request(options);
        return response.data;
    }
    catch(err){
        console.log(err);
    }
}
    return await fetchData();
}

module.exports = {getLanguageById,submitBatch};



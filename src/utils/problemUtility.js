const axios = require("axios");

const getLanguageById = (lang) => {
    const language = {
        "c++": 54,
        "java": 62,
        "javascript": 63
    }
    return language[lang.toLowerCase()];
}

const submitBatch = async (submissions) => {

    const options = {
        method: 'POST',
        url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
        params: {
            base64_encoded: 'false'
        },
        headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
            'Content-Type': 'application/json'
        },
        data: {submissions}
    };

    async function FetchData() {
        try {
            const response = await axios.request(options);
            return response.data;
        }
        catch (err) {
            console.log(err);
        }
    }
    return await FetchData();
}


async function waiting(timer) {
    return new Promise((resolve) => {
        setTimeout(resolve, timer);
    });
}
const submitToken = async (resultTokens) => {
    const options = {
        method: 'GET',
        url: 'https://judge0-extra-ce.p.rapidapi.com/submissions/batch',
        params: {
            tokens: resultTokens.join(","),
            base64_encoded: 'false',
            fields: '*'
        },
        headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
            'Content-Type': 'application/json'
        }
    };

    async function FetchData() {
        try {
            const response = await axios.request(options);
            return response.data;
        } catch (error) {
            console.error(error);
        }
    }

    // result is this , status id 3 means correct execution, >3 is some error obtained, <3 is in que or something
    // {
    //   "submissions": [
    //     {
    //       "language_id": 46,
    //       "stdout": "hello from Bash\n",
    //       "status_id": 3,
    //       "stderr": null,
    //       "token": "db54881d-bcf5-4c7b-a2e3-d33fe7e25de7"
    //     },
    //     {
    //       "language_id": 71,
    //       "stdout": "hello from Python\n",
    //       "status_id": 3,
    //       "stderr": null,
    //       "token": "ecc52a9b-ea80-4a00-ad50-4ab6cc3bb2a1"
    //     },
    //     {
    //       "language_id": 72,
    //       "stdout": "hello from Ruby\n",
    //       "status_id": 3,
    //       "stderr": null,
    //       "token": "1b35ec3b-5776-48ef-b646-d5522bdeb2cc"
    //     }
    //   ]
    // }
    while (true) {
        const result = await FetchData();
        if (!result || !result.submissions) {
            await waiting(1000);
            continue;
        }
        const isResultObtained = result.submissions.every((k) => k.status_id > 2);
        if (isResultObtained) {
            return result.submissions;
        }

        await waiting(1000);
        // waiting 1s till running it again

    }



}


module.exports = { getLanguageById, submitBatch, submitToken };



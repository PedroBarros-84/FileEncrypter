
const express = require('express');
const app = express();
const multer  = require('multer');
const upload = multer({ dest: 'uploads/'});
const fs = require('fs');
const crypto = require('crypto');


app.listen(7777, () => console.log("Server started at port 7777"))
app.use(express.static('public'));


app.post('/', upload.single('uploadedFile'), async (request, response) => {

    console.log(request.body);
    console.log(request.file);
    
    /* await processFile(request.file.path); */
    await processFile(request.body, request.file);

    console.log("sending file to client");

    try {
        response.download(request.file.path, ("after_" + request.file.originalname), () => {
            console.log("starting delete");
            fs.promises.unlink(request.file.path);  });
    } catch (err) {
        console.log("catched error");
        console.log(err);
    };
        
});


// async functions return a promise that can be awaited for when called
async function processFile(body, file) {

    console.log("processing file");
    
    // fs.readFileSync runs synchronistically and returns a buffer
    // Uint8Array defines array to be of type primitive unsigned 8bit
    var fileAsArray = Uint8Array.from(fs.readFileSync(file.path));

    console.log(body.password);

    console.log((crypto.createHash('sha256').update("foobar").digest('base64')));

    // second argument of writefile can receive Buffer, TypedArray or DataView
    await fs.promises.writeFile(file.path, fileAsArray, (err) => {
        if (err) {
            console.log("process file error");
            console.log(err);
        };
    });

};



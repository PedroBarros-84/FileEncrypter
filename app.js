const express = require('express');
const app = express();
const multer  = require('multer');
const upload = multer({ dest: 'uploads/'});
const fs = require('fs');
const crypto = require('crypto');

app.listen(process.env.PORT || 3000);
/* app.listen(3000, () => console.log("Server started at port 3000")) */
app.use(express.static('public'));


app.post('/', upload.single('uploadedFile'), async (request, response) => {

    console.log(request.body);
    console.log(request.file);
    
    try { await processFile(request.body, request.file); }
    catch (err) { console.log(err) }

    console.log("sending file to client");

    try { response.download(request.file.path, ("after_" + request.file.originalname), () => {
            console.log("starting delete");
            fs.promises.unlink(request.file.path);  }); }
    catch (err) { console.log(err); }
    
});


// async functions return a promise that can be awaited for when called
async function processFile(body, file) {

    console.log("processing file");
    
    // fs.readFileSync runs synchronistically and returns a buffer
    // Uint8Array defines array to be of type primitive unsigned 8bit
    var fileAsArray = Uint8Array.from(fs.readFileSync(file.path));

    // SHA-512 creates a key of 128bytes
    const key = Array.from(crypto.createHash('sha512').update(body.password).digest('hex'));
    console.log(key.length);

    // second argument of writefile can receive TypedArray
    await fs.promises.writeFile(file.path, fileAsArray);

};



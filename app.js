// Heroku server requires environment variable "process.env.PORT" to run on their server
const PORT = process.env.PORT || 3000;

// imports && dependencies
const express = require('express');
const app = express();
const multer  = require('multer');
const upload = multer({ dest: 'uploads/'});
const fs = require('fs');
const crypto = require('crypto');

app.listen(PORT);
console.log("Server started at port 3000");
app.use(express.static('public'));


app.post('/', upload.single('uploadedFile'), async (request, response) => {

    /* console.log(request.body);
    console.log(request.file); */

    const data = {
        password: request.body.password,
        task: request.body.task,
        originalname: request.file.originalname,
        filename: request.file.filename,
        path: request.file.path,
        size: request.file.size
    }

    console.log(data);
    
    try { await processFile(data); }
    catch (err) { console.log(err) }

    console.log("sending file to client");

    // return file immediately after process
    try { response.download(data.path, (data.task + "ed_" + data.originalname), () => {
            console.log("starting delete");
            fs.promises.unlink(data.path);  }); }
    catch (err) { console.log(err); }
    
});



// async functions return a promise that can be awaited for when called
async function processFile(data) {

    console.log("processing file");
    
    // fs.readFileSync runs synchronistically and returns a buffer
    // Uint8Array defines array to be of type primitive unsigned 8bit
    var fileAsArray = Uint8Array.from(fs.readFileSync(data.path));

    // SHA-512 creates a key of 128 hex bytes
    const key = Array.from(crypto.createHash('sha512').update(data.password).digest('hex'))
        .map(element => element.charCodeAt(0));
    
    key.forEach(element => console.log(element, typeof(element)));
    console.log(key.length);

    if (data.task === "encrypt") {
        fileAsArray = encriptFile(fileAsArray, key);
    } else {
        // before decrypting check if file has correct hash for password
        fileAsArray = decryptFile(fileAsArray, key);
    }

    // second argument of writefile can receive TypedArray
    await fs.promises.writeFile(data.path, fileAsArray);

};


function encriptFile(file, key) {

    /* var count = 0;
    var varI = "";
    var varJ = "";
    var realFileI = "";
    var realKeyJ = ""; */

    /* console.log(file[0], file[1], file[2]); */

    // 'i' will iterate through file, 'j' will iterate through hash
    for (let i = 0, j = 0; i < file.length; i++, j++) {
        
        if (j > 127) { j = 0; }

        /* let previousFileI = file[i]; */

        file[i] = (file[i] + key[j] > 255) ? ((file[i] + key[j]) - 256) : (file[i] + key[j]);

        /* if (count < 300) {
            if (i < 10) {varI = "00" + i;}
            else if (i < 100) {varI = "0" + i;}
            else {varI = i;}
            
            if (j < 10) {varJ = "00" + j;}
            else if (j < 100) {varJ = "0" + j;}
            else {varJ = j;}
            
            if (previousFileI < 10) {realFileI = "00" + previousFileI;}
            else if (previousFileI < 100) {realFileI = "0" + previousFileI;}
            else {realFileI = previousFileI;}
            
            if (key[j] < 10) {realKeyJ = "00" + key[j];}
            else if (key[j] < 100) {realKeyJ = "0" + key[j];}
            else {realKeyJ = key[j];}
            
            console.log("file[" + varI + "]: " + realFileI, "  key[" + varJ + "]: " + realKeyJ + "   =   " + file[i]);
            count++;
        } */
    }

    /* console.log(file[0], file[1], file[2]); */

    return file;
}

function decryptFile(file, key) {

    /* var count = 0;
    var varI = "";
    var varJ = "";
    var realFileI = "";
    var realKeyJ = ""; */

    /* console.log(file[0], file[1], file[2]); */

    // 'i' will iterate through file, 'j' will iterate through hash
    for (let i = 0, j = 0; i < file.length; i++, j++) {
        
        if (j > 127) { j = 0; }

        /* let previousFileI = file[i]; */

        file[i] = (file[i] - key[j] < 0) ? (256 - Math.abs(file[i] - key[j])) : (file[i] - key[j]);

        /* if (count < 300) {
            if (i < 10) {varI = "00" + i;}
            else if (i < 100) {varI = "0" + i;}
            else {varI = i;}
            
            if (j < 10) {varJ = "00" + j;}
            else if (j < 100) {varJ = "0" + j;}
            else {varJ = j;}
            
            if (previousFileI < 10) {realFileI = "00" + previousFileI;}
            else if (previousFileI < 100) {realFileI = "0" + previousFileI;}
            else {realFileI = previousFileI;}
            
            if (key[j] < 10) {realKeyJ = "00" + key[j];}
            else if (key[j] < 100) {realKeyJ = "0" + key[j];}
            else {realKeyJ = key[j];}
            
            console.log("file[" + varI + "]: " + realFileI, "  key[" + varJ + "]: " + realKeyJ + "   =   " + file[i]);
            count++;
        } */
    }

    /* console.log(file[0], file[1], file[2]); */

    return file;
}






// check for errors is reading file (disbable required in html and no file will be sent) got to deal with it
// check for errors in writting file
// check for errors in deleting file
// check for user empty password
// sugest strong password

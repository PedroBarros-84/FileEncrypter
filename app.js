// Heroku server requires environment variable "process.env.PORT" to run on their server
const PORT = process.env.PORT || 3000;
const uploadedFilesDir = 'uploads/';

// imports && dependencies
const express = require('express');
const app = express();
const multer  = require('multer');
const multerDest = multer({ dest: uploadedFilesDir});
const fs = require('fs');
const crypto = require('crypto');
const alert = require('alert');

// bound socket to port
app.listen(PORT);
console.log("Server started at port " + PORT);

// declare root directory for static files
app.use(express.static('public'));


app.post('/', multerDest.single('uploadedFile'), async (request, response) => {

    console.log("request.body:", request.body);
    console.log("request.file:", request.file);

    // when user doesn't provide password or file
    if (!request.body.password || !request.file) {
        alert("You have to provide both file and password.");
        response.redirect('..');
        return;
    }

    // file size must not exceed 25mb
    if (request.file.size > 25600000) {
        fs.promises.unlink(request.file.path);
        response.redirect('..');
        return;
    }

    let data = {
        password: request.body.password,
        task: request.body.task,
        originalname: request.file.originalname,
        filename: request.file.filename,
        path: request.file.path,
        size: request.file.size
    }

    console.log("data:", data);

    try { 
        
        // encript or decrypt file
        await processFile(data);

        console.log("sending file to client");

        // return file immediately after process and execute callback function to delete file from filesystem
        response.download(data.path, (data.task + "ed_" + data.originalname), () => {
            console.log("starting delete");
            fs.promises.unlink(data.path);
        });

    } catch (err) {

        console.log(err);
        console.log("Couldn't process file correctly")

    } finally {

        const currentTime = new Date().getTime();

        // search for files in 'uploadedFilesDir' storage and delete files older than 5 minutes
        fs.readdir(uploadedFilesDir, (err, files) => {

            //handling error
            if (err) { return console.log('Unable to scan directory: ' + err); } 

            files.forEach((file) => {

                let filePath = uploadedFilesDir + file;
            
                // get creation time of file
                const fileCreationTime = fs.statSync(filePath).birthtime.getTime();

                // if file is more than 5 minutes old delete it (5 minutes = 300.000ms)
                if (currentTime - fileCreationTime > 300000) {
                    console.log(filePath + "   is more than 5 minutes old");
                    fs.promises.unlink(filePath);
                }
            });

        })
    };
    
});



// function must be async in order to have synchronous functions with keyword 'await'
async function processFile(data) {

    console.log("processing file");
    
    // fs.readFileSync runs synchronistically and returns a buffer
    // Uint8Array defines array to be of type primitive unsigned 8bit
    var fileAsArray = Uint8Array.from(fs.readFileSync(data.path));

    // SHA-512 creates a key of 128 hex bytes
    const passwordHash = Array.from(crypto.createHash('sha512')
                                            .update(data.password)
                                            .digest('hex'))
                                            .map(element => element.charCodeAt(0));
    
    fileAsArray = (data.task === "encrypt") ? 
                    encriptFile(fileAsArray, passwordHash) : 
                    decryptFile(fileAsArray, passwordHash);

    // second argument of writefile must receive a TypedArray
    await fs.promises.writeFile(data.path, fileAsArray);

};



function encriptFile(file, key) {

    // first step
    // 'i' iterates through file and 'j' iterates through hash in combination
    for (let i = 0, j = 0; i < file.length; i++, j++) {
        
        // if 'j' is the last byte in hash, start over
        if (j > 127) { j = 0; }

        // add file byte and hash byte
        file[i] = (file[i] + key[j] > 255) ? ((file[i] + key[j]) - 256) : (file[i] + key[j]);
    }

    // second step
    // fragment file in blocks of 16 bytes and displace them by n columns base on row number
    let i = 0;
    while (i < file.length) {

        // only complete 16 byte length blocks will suffer inner displacement
        if (i + 16 > file.length) break;

        // mix bites within temporary 16byte length block
        let tempBlock = [ file[i]     , file[i + 5] , file[i + 10], file[i + 15],
                          file[i + 4] , file[i + 9] , file[i + 14], file[i + 3] ,
                          file[i + 8] , file[i + 13], file[i + 2] , file[i + 7] ,
                          file[i + 12], file[i + 1] , file[i + 6] , file[i + 11]
                        ];

        // copy temporary block to file
        tempBlock.forEach(e => {file[i] = e; i++});
    }

    return file;
}



function decryptFile(file, key) {

    // first step 
    // fragment file in blocks of 16 bytes and replace them by n columns base on row number
    let i = 0;
    while (i < file.length) {

        // only complete 16 byte length blocks will suffer inner displacement
        if (i + 16 > file.length) break;

        // rearange bytes within temporary 16byte length block
        let tempBlock = [ file[i],      file[i + 13], file[i + 10], file[i + 7]  ,
                          file[i + 4] , file[i + 1] , file[i + 14], file[i + 11] ,
                          file[i + 8] , file[i + 5] , file[i + 2] , file[i + 15] ,
                          file[i + 12], file[i + 9] , file[i + 6] , file[i + 3]
                        ];
        
        // copy temporary block to file
        tempBlock.forEach(e => {file[i] = e; i++});
    }

    // second step
    // 'i' iterates through file and 'j' iterates through hash in combination
    for (let i = 0, j = 0; i < file.length; i++, j++) {
        
        // if 'j' is the last byte in hash, start over
        if (j > 127) { j = 0; }

        // subtract hash byte from file byte
        file[i] = (file[i] - key[j] < 0) ? (256 - Math.abs(file[i] - key[j])) : (file[i] - key[j]);
    }

    return file;
}






// check for errors in reading file (disbable required in html and no file will be sent) got to deal with it
// check for errors in writting file
// check for errors in deleting file
// check for user empty password
// sugest strong password

// do lado do cliente -> quando faz submit, a password é apagada, sava script on submit



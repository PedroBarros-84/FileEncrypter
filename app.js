// Heroku server requires environment variable "process.env.PORT" to run on their server
const PORT = process.env.PORT || 3000;
const uploadedFilesDir = "uploads/";

// imports && dependencies
const express = require("express");
const app = express();
const multer = require("multer");
const multerDest = multer({ dest: uploadedFilesDir });
const fs = require("fs");
const crypto = require("crypto");

// bound socket to port
app.listen(PORT);
console.log("Server started at port " + PORT);

// declare root directory for static files
app.use(express.static("public"));

app.post("/", multerDest.single("uploadedFile"), async (req, res) => {
	// when user doesn't provide password or file
	if (!req.body.password || !req.file) {
		res.redirect("..");
		if (req.file !== undefined) {
			fs.promises.unlink(req.file.path);
		}
		return;
	}

	// file size must not exceed 25mb
	if (req.file.size > 25600000) {
		fs.promises.unlink(req.file.path);
		res.redirect("..");
		return;
	}

	let data = {
		password: req.body.password,
		task: req.body.task,
		originalname: req.file.originalname,
		filename: req.file.filename,
		path: req.file.path,
		size: req.file.size,
	};

	try {
		console.log(`${data.filename}: ${data.task.toUpperCase()}`);

		// encript or decrypt file
		console.time(`${data.filename}: PROCESS ${data.size} bytes in`);
		await processFile(data);
		console.timeEnd(`${data.filename}: PROCESS ${data.size} bytes in`);

		// return file immediately after process and execute callback function to delete file from filesystem
		res.download(
			data.path,
			`${data.task.toUpperCase()}ED - ${data.originalname}`,
			() => {
				fs.promises.unlink(data.path);
				console.log(`${data.filename}: DELETED`);
			}
		);
	} catch (err) {
		console.log(err);
		console.log("Couldn't process file correctly");
	} finally {
		const currentTime = new Date().getTime();

		// search for files in 'uploadedFilesDir' storage and delete files older than 5 minutes
		fs.readdir(uploadedFilesDir, (err, files) => {
			//handling error
			if (err) {
				return console.log("Unable to scan directory: " + err);
			}

			files.forEach((file) => {
				let filePath = uploadedFilesDir + file;

				// get creation time of file
				const fileCreationTime = fs.statSync(filePath).birthtime.getTime();

				// if file is more than 5 minutes old delete it (5 minutes = 300000 ms)
				if (currentTime - fileCreationTime > 300000) {
					fs.promises.unlink(filePath);
				}
			});
		});
	}
});

// process the file into
async function processFile(data) {
	// fs.readFileSync runs synchronistically and returns a buffer
	// Uint8Array defines array to be of type primitive unsigned 8bit
	var fileAsArray = Uint8Array.from(fs.readFileSync(data.path));

	// SHA-512 creates a key of 128 hex bytes
	const passwordHash = Array.from(
		crypto.createHash("sha512").update(data.password).digest("hex")
	).map((element) => element.charCodeAt(0));

	fileAsArray =
		data.task === "encrypt"
			? encriptFile(fileAsArray, passwordHash)
			: decryptFile(fileAsArray, passwordHash);

	// second argument of writefile must receive a TypedArray
	await fs.promises.writeFile(data.path, fileAsArray);
}

function encriptFile(file, key) {
	// first step - 'i' iterates through file and 'j' iterates through hash in combination
	for (let i = 0, j = 0; i < file.length; i++, j++) {
		// if 'j' is the last byte in hash, start over
		if (j > 127) {
			j = 0;
		}

		// add file byte and hash byte
		file[i] =
			file[i] + key[j] > 255 ? file[i] + key[j] - 256 : file[i] + key[j];
	}

	// second step - fragment file in blocks of 16 bytes and displace them by n columns base on row number
	let i = 0;
	while (i < file.length) {
		// only complete 16 byte length blocks will suffer inner displacement
		if (i + 16 > file.length) break;

		// mix bites within temporary 16byte length block
		let tempBlock = [
			file[i],
			file[i + 5],
			file[i + 10],
			file[i + 15],
			file[i + 4],
			file[i + 9],
			file[i + 14],
			file[i + 3],
			file[i + 8],
			file[i + 13],
			file[i + 2],
			file[i + 7],
			file[i + 12],
			file[i + 1],
			file[i + 6],
			file[i + 11],
		];

		// copy temporary block to file
		tempBlock.forEach((e) => {
			file[i] = e;
			i++;
		});
	}

	return file;
}

function decryptFile(file, key) {
	// first step - fragment file in blocks of 16 bytes and replace them by n columns base on row number
	let i = 0;
	while (i < file.length) {
		// only complete 16 byte length blocks will suffer inner displacement
		if (i + 16 > file.length) break;

		// rearange bytes within temporary 16byte length block
		let tempBlock = [
			file[i],
			file[i + 13],
			file[i + 10],
			file[i + 7],
			file[i + 4],
			file[i + 1],
			file[i + 14],
			file[i + 11],
			file[i + 8],
			file[i + 5],
			file[i + 2],
			file[i + 15],
			file[i + 12],
			file[i + 9],
			file[i + 6],
			file[i + 3],
		];

		// copy temporary block to file
		tempBlock.forEach((e) => {
			file[i] = e;
			i++;
		});
	}

	// second step - 'i' iterates through file and 'j' iterates through hash in combination
	for (let i = 0, j = 0; i < file.length; i++, j++) {
		// if 'j' is the last byte in hash, start over
		if (j > 127) {
			j = 0;
		}

		// subtract hash byte from file byte
		file[i] =
			file[i] - key[j] < 0
				? 256 - Math.abs(file[i] - key[j])
				: file[i] - key[j];
	}

	return file;
}

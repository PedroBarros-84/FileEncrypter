function validateSize(file) {
	// get file size in mb
	var fileSize = file.files[0].size / 1024 / 1024;

	// if it exceedes limit, inform user and reset input
	if (fileSize > 25) {
		alert("File size exceeds 25 Mega bytes");
		file.value = file.defaultValue;
	}
}

function validateAndClearPassword() {
	if (document.getElementById("password").value.length === 0) {
		alert("Must provide password");
		return false;
	}

	setTimeout(() => (document.getElementById("password").value = ""), 1000);
	return true;
}

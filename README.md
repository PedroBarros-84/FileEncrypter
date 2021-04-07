# File Encrypter 

### App deployed at: [file-encrypter.herokuapp.com](https://file-encrypter.herokuapp.com)

### Backgroundcd 

Inspired by famous encryption algorithms, I have design my own.  
File processing goes from a basic adding operation between bytes, inspired by the Caesar Cipher substitution, to a more elusive AES approach where permutation take place.  

### Usage

I designed this web app to be simple and easy to use.  
Users can encrypt any file of their choosing on condition they provide a password and the file size is less than 25mb. If the file exceeds the limit size, user will be alerted and file deleted from form.

### Process

Encryption/decryption takes a two step process:

* Substitution based on hash function
* Permutation within defined byte chunks

After process, file is immediately sent to client for download with same file name plus "encrypted_" or "decrypted_" prefix.  
Password is not stored in file. Wrong password will still let the user upload the encrypted file to be processed and returned for download, but without the correct password, returned file will always be corrupted.
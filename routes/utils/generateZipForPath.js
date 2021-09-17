import fs from "fs";
const JSZip = require("jszip");

const deleteFiles = (nameFileZip) =>{
    fs.rmdirSync(`./${nameFileZip}`, {recursive: true});
    fs.rmdirSync(`./${nameFileZip}.zip`, {recursive: true});
}

const addFilesFromDirectoryToZip = (directoryPath = "", zip) => {
    const directoryContents = fs.readdirSync(directoryPath, {
        withFileTypes: true,
    });

    directoryContents.forEach(({ name }) => {
        const path = `${directoryPath}/${name}`;

        if (fs.statSync(path).isFile()) {
            zip.file(`_${path}`, fs.readFileSync(path, "utf-8"));
        }

        if (fs.statSync(path).isDirectory()) {
            addFilesFromDirectoryToZip(path, zip);
        }
    });
};

const generateZipForPath = (directoryPath = "") => {
    return new Promise((resolve, reject)=>{
        const zip = new JSZip();
        addFilesFromDirectoryToZip(directoryPath, zip);
        zip.generateNodeStream({type:'nodebuffer',streamFiles:true})
            .pipe(fs.createWriteStream(directoryPath+'.zip'))
            .on('finish', function () {
                resolve({
                    "idFile": directoryPath
                });
            })
            .on('error', function(error){
                reject({
                    "error": error,
                    "idFile": directoryPath
                });
            });
    })
};

module.exports = {
    generateZipForPath,
    deleteFiles
}
/**
 *  Unit for manipulate and transform images 
 */
const fs = require('fs'),
    path = require('path'),
    mkdirp = require("mkdirp"),
    {nativeImage} = require('electron');
    

/**
 *  Load an image from file to canvas supported image type <HTMLImageElement | ImageBitmap>.
 *  Work quickly then Image.onload.
 *  @param {String} src - path to file
 *  @param {Function} callback_img - callback return <HTMLImageElement | ImageBitmap>
 */
function imageFromFile(src, callback_img) {
    fs.readFile(src, (err, data) => {
        if (err) {
            callback_img(new Image());// no image
            return;
        }
        
        createImageBitmap(new Blob([new Uint8Array(data)])).then(function(result){
            callback_img(result)
        })
        
    })
}


/**
 * Extract and encode image from html-Canvas to nodejs-Buffer.
 * Uses nodejs-NativeImage for image compression, insteadof standart canvas compression
 * @param {Canvas} canvas
 * @param {String} format - png/jpg 
 * @param {Integer} quality  - jpeg quality, between 0 - 100
 * @return {Buffer} - buffer
 */
function canvasToBuffer(canvas, format, quality) {
    if (!canvas.width || !canvas.height) return 0;
    var imageData = canvas.getContext("2d").getImageData(0,0, canvas.width,canvas.height); // Uint8ClampedArray contents RGBA
    var data = imageData.data;
    
    var new_data = new Uint8ClampedArray(data.length);
    // RGBA convert to BRGA
    for (var i=0; i<data.length; i++) 
        new_data[i] = data[i%2? i: i^2];
    
    data = 0; // clean source after copy
    var buffer = Buffer.from(new_data.buffer); // ArrayBuffer -> Buffer
    var image = nativeImage.createFromBuffer(buffer, {width: canvas.width, height:canvas.height});
    buffer = 0; // clean buff
    
    return (format == "jpg"? image.toJPEG(quality): image.toPNG());
}


function canvasToFile(canvas, dest, format, quality, callback_err) {

    // var promise = new Promise(function(resolve, reject) {
    var buffer = canvasToBuffer(canvas, format || "png", quality);
    
    if (!buffer){
        callback_err(new Error("canvas has no data"));
        return;
    }

    // make dir -p
    mkdirp(path.dirname(dest), err => {
        if (err) {
            callback_err(err)
            return;
        } 
        
        fs.writeFile(dest, buffer, (err, info) => {
            if (callback_err) callback_err(err)
        });
        
    })
    
}


// static members
exports.imageFromFile = imageFromFile;
exports.canvasToBuffer = canvasToBuffer;
exports.canvasToFile = canvasToFile;

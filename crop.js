const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const sizeOf = require('image-size');

const stockFolder = './stock';
const templateFolder = './template';
const hasilFolder = './hasil';

// Buat folder 'hasil' jika belum ada
if (!fs.existsSync(hasilFolder)) {
    fs.mkdirSync(hasilFolder);
}

// Fungsi untuk memeriksa apakah file adalah gambar
const isImage = (filePath) => {
    try {
        const dimensions = sizeOf(filePath);
        return dimensions && dimensions.width && dimensions.height;
    } catch (err) {
        return false; // Bukan gambar
    }
};

// Fungsi untuk memotong (crop) gambar stock agar sesuai ukuran template
const cropImage = (image, width, height) => {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Hitung pusat gambar untuk pemotongan
    const cropX = (image.width - width) / 2;
    const cropY = (image.height - height) / 2;

    // Potong bagian tengah gambar sesuai ukuran template
    ctx.drawImage(image, cropX, cropY, width, height, 0, 0, width, height);

    return canvas;
};

// Fungsi untuk menggabungkan satu gambar stock dengan satu template
const mergeImages = async (stockImage, templateImage) => {
    // Buat kanvas berdasarkan ukuran template
    const canvas = createCanvas(templateImage.width, templateImage.height);
    const ctx = canvas.getContext('2d');

    // Crop gambar stock agar sesuai dengan ukuran template
    const croppedStock = cropImage(stockImage, templateImage.width, templateImage.height);

    // Gambar stock yang sudah di-crop terlebih dahulu
    ctx.drawImage(croppedStock, 0, 0);

    // Gambar template di atasnya
    ctx.drawImage(templateImage, 0, 0);

    return canvas.toBuffer('image/png');
};

// Fungsi untuk memproses semua gambar dalam batch
const processBatchImages = async () => {
    const stockFiles = fs.readdirSync(stockFolder).filter(file => isImage(path.join(stockFolder, file)));
    const templateFiles = fs.readdirSync(templateFolder).filter(file => file.endsWith('.png'));

    for (const stockFile of stockFiles) {
        const stockPath = path.join(stockFolder, stockFile);
        const stockImage = await loadImage(stockPath);
        
        for (const templateFile of templateFiles) {
            const templatePath = path.join(templateFolder, templateFile);
            const templateImage = await loadImage(templatePath);
            
            const outputBuffer = await mergeImages(stockImage, templateImage);
            const outputFileName = `crop_${path.parse(stockFile).name}_${path.parse(templateFile).name}.png`;
            const outputPath = path.join(hasilFolder, outputFileName);

            fs.writeFileSync(outputPath, outputBuffer);
            console.log(`File berhasil digabung: ${outputFileName}`);
        }
    }
};

processBatchImages()
    .then(() => console.log('Proses selesai.'))
    .catch(error => console.error('Terjadi kesalahan:', error));

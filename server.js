const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();
const port = 5500;

app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(express.json()); // Thêm middleware để parse JSON
app.use(express.static('public'));
app.use('/images', express.static('images'));

// Đảm bảo thư mục images tồn tại
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

app.get('/download', (req, res) => {
  // Đường dẫn đến file cần tải về
  const filePath = path.join(__dirname,'files', 'UltraViewer.exe');

  // Kiểm tra file có tồn tại không
  if (fs.existsSync(filePath)) {
    // Đặt tên file khi tải về (có thể khác với tên file trên server)
    const fileName = 'UltraViewer.exe';

    // Thiết lập header để trình duyệt hiểu đây là file cần tải về
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Lỗi khi tải file:', err);
        res.status(500).send('Lỗi khi tải file');
      }
    });
  } else {
    res.status(404).send('File không tồn tại');
  }
});

// Route để lưu đoạn text
app.post('/text', (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Text content is required' });
    }
    const texts = JSON.parse(fs.readFileSync(textsFile));
    const newText = {
      content,
      timestamp: new Date().toISOString(),
    };
    texts.push(newText);
    fs.writeFileSync(textsFile, JSON.stringify(texts, null, 2));
    res.json(newText);
  } catch (error) {
    console.error('Error saving text:', error);
    res.status(500).json({ error: 'Server error during text save' });
  }
});


// Đảm bảo file texts.json tồn tại
const textsFile = path.join(__dirname, 'texts.json');
if (!fs.existsSync(textsFile)) {
  fs.writeFileSync(textsFile, JSON.stringify([]));
}

// Cấu hình multer để lưu file ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Route để xử lý upload ảnh
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  res.json({ imageUrl: `/images/${req.file.filename}` });
});


// Route để lấy danh sách ảnh trong thư mục images
app.get('/images', (req, res) => {
  fs.readdir(imagesDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to read images directory' });
    }
    // Lọc chỉ các file ảnh (jpg, png, gif, etc.)
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
    const imageUrls = imageFiles.map(file => `/images/${file}`);
    res.json({ images: imageUrls });
  });
});

// Route để lấy danh sách text
app.get('/texts', (req, res) => {
  try {
    const texts = JSON.parse(fs.readFileSync(textsFile));
    res.json({ texts });
  } catch (error) {
    console.error('Error reading texts:', error);
    res.status(500).json({ error: 'Unable to read texts' });
  }
});

// Route để lưu đoạn text

app.post('/text', (req, res) => {

  try {

    const { content } = req.body;

    if (!content) {

      return res.status(400).json({ error: 'Text content is required' });

    }

    const texts = JSON.parse(fs.readFileSync(textsFile));

    const newText = {

      content,

      timestamp: new Date().toISOString(),

    };

    texts.push(newText);

    fs.writeFileSync(textsFile, JSON.stringify(texts, null, 2));

    res.json(newText);

  } catch (error) {

    console.error('Error saving text:', error);

    res.status(500).json({ error: 'Server error during text save' });

  }
});


// Khởi động server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
import { Router } from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

const router = Router();
const uploadDir = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 PDF 和 Word 文件'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/**
 * Parse resume file content
 */
async function parseResume(filePath, mimetype) {
  if (mimetype === 'application/pdf') {
    // Use pdf-parse
    const pdfParse = (await import('pdf-parse')).default;
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } else if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    // Use mammoth for .docx
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } else if (mimetype === 'application/msword') {
    // For .doc files, return placeholder (handling .doc requires libreoffice)
    return '[.doc 文件格式，建议转换为 .docx 或 PDF 后上传]';
  }
  return '';
}

/**
 * POST /api/upload/resume
 * Upload and parse resume file
 */
router.post('/resume', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传文件' });
    }

    const text = await parseResume(req.file.path, req.file.mimetype);
    const filename = req.file.originalname;

    // Clean up uploaded file after parsing
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      filename,
      text,
      wordCount: text.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: `文件解析失败: ${error.message}` });
  }
});

/**
 * POST /api/upload/jd
 * Accept JD text directly
 */
router.post('/jd', (req, res) => {
  try {
    const { jdText } = req.body;
    if (!jdText || jdText.trim().length < 10) {
      return res.status(400).json({ error: 'JD 内容太短，请输入完整的岗位描述' });
    }
    res.json({
      success: true,
      text: jdText.trim(),
      wordCount: jdText.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

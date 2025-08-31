import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Ensure upload directories exist
const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profile-pictures');
const gameUploadDir = path.join(process.cwd(), 'uploaded_games');
const gameAssetsDir = path.join(process.cwd(), 'public', 'uploads', 'game-assets');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(gameUploadDir)) {
  fs.mkdirSync(gameUploadDir, { recursive: true });
}
if (!fs.existsSync(gameAssetsDir)) {
  fs.mkdirSync(gameAssetsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + crypto.randomUUID();
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `profile-${uniqueSuffix}${extension}`);
  }
});

// File filter for security
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow only specific image types
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  const extension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(extension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
  }
};

// Create multer instance with configuration
export const profilePictureUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file at a time
  }
});

// Utility function to delete old profile picture
export function deleteOldProfilePicture(filename: string | null) {
  if (!filename) return;
  
  const filePath = path.join(uploadDir, filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('Error deleting old profile picture:', error);
    }
  }
}

// Utility function to get profile picture URL
export function getProfilePictureUrl(filename: string | null): string | null {
  if (!filename) return null;
  return `/uploads/profile-pictures/${filename}`;
}

// Default avatar URL for users without profile pictures
export const DEFAULT_AVATAR_URL = '/assets/default-avatar.svg';

// Game file upload configuration
const gameFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, gameUploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + crypto.randomUUID();
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `game-${uniqueSuffix}${extension}`);
  }
});

// Game file filter for security
const gameFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow game file types
  const allowedTypes = [
    'text/html', 'text/javascript', 'application/javascript',
    'text/typescript', 'application/typescript', 'text/tsx',
    'text/jsx', 'application/json', 'text/css', 'text/plain'
  ];
  const allowedExtensions = [
    '.html', '.htm', '.js', '.jsx', '.ts', '.tsx', 
    '.css', '.json', '.txt', '.md'
  ];
  
  const extension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(extension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only HTML, JS, JSX, TS, TSX, CSS, JSON, and text files are allowed.'));
  }
};

// Create multer instance for game files
export const gameFileUpload = multer({
  storage: gameFileStorage,
  fileFilter: gameFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for game files
    files: 5 // Allow multiple files for complex games
  }
});

// Game asset (image) upload configuration
const gameAssetStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, gameAssetsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomUUID();
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `asset-${uniqueSuffix}${extension}`);
  }
});

// Game asset filter (for thumbnails and game images)
const gameAssetFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  
  const extension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(extension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'));
  }
};

// Create multer instance for game assets
export const gameAssetUpload = multer({
  storage: gameAssetStorage,
  fileFilter: gameAssetFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for images
    files: 1
  }
});

// Utility functions for game files
export function deleteGameFile(filename: string | null) {
  if (!filename) return;
  
  const filePath = path.join(gameUploadDir, filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('Error deleting game file:', error);
    }
  }
}

export function getGameFileUrl(filename: string | null): string | null {
  if (!filename) return null;
  return `/uploads/games/${filename}`;
}

export function getGameAssetUrl(filename: string | null): string | null {
  if (!filename) return null;
  return `/uploads/game-assets/${filename}`;
}
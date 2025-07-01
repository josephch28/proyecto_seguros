const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Calcula la raíz del proyecto (dos niveles arriba desde este archivo)
const PROJECT_ROOT = path.resolve(__dirname, '../../');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
console.log('UPLOAD_DIR usado:', UPLOAD_DIR);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['application/pdf'];

// Normalizar rutas para asegurar consistencia
const normalizePath = (filePath) => {
    return filePath.replace(/\\/g, '/');
};

// Asegurar que el directorio de uploads existe
const ensureUploadDir = async (subfolder = '') => {
    try {
        const fullPath = path.join(UPLOAD_DIR, subfolder);
        await fs.access(fullPath);
        console.log('Directorio existe:', fullPath);
    } catch {
        const fullPath = path.join(UPLOAD_DIR, subfolder);
        await fs.mkdir(fullPath, { recursive: true });
        console.log('Directorio creado:', fullPath);
    }
};

// Generar nombre único para el archivo
const generateUniqueFileName = (originalName) => {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName);
    return `${timestamp}-${randomString}${extension}`;
};

// Validar archivo
const validateFile = (file) => {
    if (!file) {
        throw new Error('No se proporcionó ningún archivo');
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`El archivo excede el tamaño máximo permitido de ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new Error('Tipo de archivo no permitido. Solo se aceptan PDFs');
    }
};

// Subir archivo
const uploadFile = async (file, subfolder = '') => {
    try {
        console.log('Iniciando subida de archivo:', {
            originalName: file.originalname,
            subfolder,
            size: file.size
        });

        await ensureUploadDir(subfolder);
        validateFile(file);

        const folderPath = path.join(UPLOAD_DIR, subfolder);
        const fileName = generateUniqueFileName(file.originalname);
        const filePath = path.join(folderPath, fileName);
        const relativePath = normalizePath(path.join(subfolder, fileName));

        console.log('Intentando guardar archivo en:', filePath);
        await fs.writeFile(filePath, file.buffer);
        console.log('Archivo guardado en:', filePath);

        // Verificar que el archivo se escribió correctamente
        try {
            const stats = await fs.stat(filePath);
            console.log('Archivo guardado correctamente:', {
                path: filePath,
                size: stats.size,
                relativePath
            });
        } catch (error) {
            console.error('Error al verificar archivo:', error);
            throw new Error('Error al verificar el archivo subido');
        }

        return {
            fileName,
            filePath: relativePath,
            originalName: file.originalname
        };
    } catch (error) {
        console.error('Error al subir archivo:', error);
        throw error;
    }
};

// Obtener archivo
const getFile = async (filePath) => {
    try {
        const fullPath = path.join(UPLOAD_DIR, filePath);
        console.log('Intentando leer archivo:', {
            originalPath: filePath,
            fullPath: fullPath
        });
        
        const fileBuffer = await fs.readFile(fullPath);
        console.log('Archivo leído correctamente, tamaño:', fileBuffer.length);
        
        return fileBuffer;
    } catch (error) {
        console.error('Error al leer archivo:', error);
        throw error;
    }
};

// Eliminar archivo
const deleteFile = async (filePath) => {
    try {
        const normalizedPath = normalizePath(filePath);
        const fullPath = path.join(UPLOAD_DIR, normalizedPath);
        console.log('Intentando eliminar archivo:', fullPath);
        await fs.unlink(fullPath);
        console.log('Archivo eliminado correctamente');
    } catch (error) {
        console.error('Error al eliminar archivo:', error);
        throw error;
    }
};

// Verificar existencia de archivo
const fileExists = async (filePath) => {
    console.log('=== INICIO fileExists ===');
    console.log('Ruta recibida:', filePath);

    try {
        if (!filePath) {
            console.log('Ruta de archivo no proporcionada');
            return false;
        }

        // Normalizar la ruta para asegurar que use el separador correcto
        const normalizedPath = filePath.replace(/\\/g, '/');
        const fullPath = path.join(UPLOAD_DIR, normalizedPath);

        console.log('Rutas procesadas:', {
            originalPath: filePath,
            normalizedPath: normalizedPath,
            fullPath: fullPath,
            uploadsDir: UPLOAD_DIR
        });

        try {
            console.log('Intentando acceder al archivo...');
            await fs.access(fullPath);
            
            console.log('Archivo accesible, obteniendo estadísticas...');
            const stats = await fs.stat(fullPath);
            
            console.log('Estadísticas del archivo:', {
                path: fullPath,
                size: stats.size,
                lastModified: stats.mtime,
                isFile: stats.isFile()
            });
            
            const isFile = stats.isFile();
            console.log('¿Es un archivo?', isFile);
            
            return isFile;
        } catch (error) {
            console.log('Error al acceder al archivo:', {
                path: fullPath,
                error: error.message,
                code: error.code
            });
            return false;
        }
    } catch (error) {
        console.error('Error general en fileExists:', error);
        return false;
    } finally {
        console.log('=== FIN fileExists ===');
    }
};

class FileStorageService {
    constructor() {
        this.uploadDir = path.join(__dirname, '..', 'uploads');
        this.ensureUploadDir();
    }

    async ensureUploadDir() {
        try {
            await fs.mkdir(this.uploadDir, { recursive: true });
            console.log('\n=== DIRECTORIO DE UPLOADS ===');
            console.log('Directorio creado/verificado:', this.uploadDir);
        } catch (error) {
            console.error('Error al crear directorio de uploads:', error);
            throw error;
        }
    }

    async saveFile(file, subfolder = '') {
        try {
            console.log('\n=== GUARDANDO ARCHIVO ===');
            console.log('Archivo recibido:', {
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size
            });

            const timestamp = Date.now();
            const filename = `${timestamp}-${file.originalname}`;
            const filepath = path.join(this.uploadDir, subfolder, filename);

            console.log('Ruta del archivo:', filepath);

            await fs.mkdir(path.dirname(filepath), { recursive: true });
            await fs.writeFile(filepath, file.buffer);

            // Devolver la ruta relativa para almacenar en la base de datos
            const relativePath = path.join(subfolder, filename).replace(/\\/g, '/');
            console.log('Ruta relativa guardada:', relativePath);

            return relativePath;
        } catch (error) {
            console.error('Error al guardar archivo:', error);
            throw error;
        }
    }

    async getFile(filePath) {
        try {
            console.log('\n=== OBTENIENDO ARCHIVO ===');
            console.log('Ruta solicitada:', filePath);

            // Asegurarse de que la ruta sea relativa al directorio de uploads
            const relativePath = filePath.replace(/^\/+/, '');
            const fullPath = path.join(this.uploadDir, relativePath);

            console.log('Rutas procesadas:', {
                original: filePath,
                relative: relativePath,
                full: fullPath
            });

            const fileExists = await this.fileExists(relativePath);
            if (!fileExists) {
                console.log('Archivo no encontrado');
                throw new Error('Archivo no encontrado');
            }

            const file = await fs.readFile(fullPath);
            console.log('Archivo leído exitosamente');
            return file;
        } catch (error) {
            console.error('Error al obtener archivo:', error);
            throw error;
        }
    }

    async fileExists(filePath) {
        try {
            console.log('\n=== VERIFICANDO EXISTENCIA DE ARCHIVO ===');
            console.log('Ruta recibida:', filePath);

            if (!filePath) {
                console.log('Ruta no proporcionada');
                return false;
            }

            // Asegurarse de que la ruta sea relativa al directorio de uploads
            const relativePath = filePath.replace(/^\/+/, '');
            const fullPath = path.join(this.uploadDir, relativePath);

            console.log('Rutas procesadas:', {
                original: filePath,
                relative: relativePath,
                full: fullPath,
                uploadDir: this.uploadDir
            });

            try {
                // Verificar si el archivo existe
                await fs.access(fullPath);
                const stats = await fs.stat(fullPath);
                
                const exists = stats.isFile();
                console.log('Resultado de verificación:', {
                    exists,
                    isFile: stats.isFile(),
                    size: stats.size,
                    lastModified: stats.mtime,
                    path: fullPath
                });

                if (exists) {
                    // Verificar que el archivo sea legible
                    await fs.readFile(fullPath);
                    console.log('Archivo verificado y legible');
                }

                return exists;
            } catch (error) {
                console.log('Error al verificar archivo:', {
                    message: error.message,
                    code: error.code,
                    path: fullPath
                });
                return false;
            }
        } catch (error) {
            console.error('Error en fileExists:', error);
            return false;
        }
    }
}

module.exports = {
    uploadFile,
    getFile,
    deleteFile,
    fileExists
}; 
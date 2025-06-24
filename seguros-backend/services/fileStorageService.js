const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Configuración
const UPLOAD_DIR = path.join(__dirname, '../uploads');
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

        console.log('Guardando archivo en:', filePath);
        await fs.writeFile(filePath, file.buffer);

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

    async saveFile(file, contratoId, tipo = '') {
        try {
            console.log('\n=== GUARDANDO ARCHIVO ===');
            console.log('Archivo recibido:', {
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                contratoId,
                tipo
            });

            // Crear estructura de carpetas: uploads/contrato_[id]/[tipo]
            const contratoDir = path.join(this.uploadDir, `contrato_${contratoId}`);
            const tipoDir = tipo ? path.join(contratoDir, tipo) : contratoDir;

            // Crear directorios si no existen
            await fs.mkdir(tipoDir, { recursive: true });
            console.log('Directorio creado:', tipoDir);

            const timestamp = Date.now();
            const filename = `${timestamp}-${file.originalname}`;
            const filepath = path.join(tipoDir, filename);

            console.log('Ruta del archivo:', filepath);

            await fs.writeFile(filepath, file.buffer);

            // Devolver la ruta relativa para almacenar en la base de datos
            const relativePath = path.join(`contrato_${contratoId}`, tipo, filename).replace(/\\/g, '/');
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
            console.log('Ruta del archivo:', filePath);

            // Construir la ruta completa
            const fullPath = path.join(this.uploadDir, filePath);
            console.log('Ruta completa:', fullPath);

            // Verificar si el archivo existe
            try {
                await fs.access(fullPath);
            } catch (error) {
                console.error('Archivo no encontrado:', fullPath);
                throw new Error('Archivo no encontrado');
            }

            // Leer el archivo
            const fileBuffer = await fs.readFile(fullPath);
            console.log('Archivo leído correctamente, tamaño:', fileBuffer.length);

            return fileBuffer;
        } catch (error) {
            console.error('Error al obtener archivo:', error);
            throw error;
        }
    }

    async fileExists(filePath) {
        try {
            const fullPath = path.join(this.uploadDir, filePath);
            await fs.access(fullPath);
            return true;
        } catch (error) {
            return false;
        }
    }
}

module.exports = new FileStorageService(); 
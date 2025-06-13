const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/s3Config');

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

const uploadFile = async (file, key) => {
    try {
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype
        });

        await s3Client.send(command);
        return true;
    } catch (error) {
        console.error('Error uploading file to S3:', error);
        throw error;
    }
};

const getSignedDownloadUrl = async (key) => {
    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        });

        // URL válida por 1 hora
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return signedUrl;
    } catch (error) {
        console.error('Error generating signed URL:', error);
        throw error;
    }
};

module.exports = {
    uploadFile,
    getSignedDownloadUrl
}; 
import { S3Client, PutObjectCommand, GetObjectCommand, PutObjectAclCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    },
});

export async function UploadObject(filename, contentType) {

    const key = `uploads/user-uploads/${uuidv4()}-${filename}`;

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command);

    const downloadUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return { uploadUrl, downloadUrl };
}

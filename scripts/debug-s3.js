
require('dotenv').config({ path: '.env.local' });
const { S3Client, CreateMultipartUploadCommand } = require('@aws-sdk/client-s3');

async function testS3() {
    console.log('Checking Environment Variables...');
    const required = ['S3_REGION', 'S3_ENDPOINT', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_BUCKET_NAME'];
    const missing = required.filter(k => !process.env[k]);

    if (missing.length > 0) {
        console.error('Missing Environment Variables:', missing);
        // Don't exit, try anyway to see specific error if possible, but it likely won't work.
        // Actually, bucket name is required.
    } else {
        console.log('All required S3 variables are present.');
    }

    const S3 = new S3Client({
        region: process.env.S3_REGION || "auto",
        endpoint: process.env.S3_ENDPOINT,
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
        },
    });

    const BUCKET_NAME = process.env.S3_BUCKET_NAME;
    if (!BUCKET_NAME) {
        console.error("Missing BUCKET_NAME");
        return;
    }

    console.log(`Attempting to create multipart upload in bucket: ${BUCKET_NAME}`);

    try {
        const command = new CreateMultipartUploadCommand({
            Bucket: BUCKET_NAME,
            Key: `debug-${Date.now()}-test.txt`,
            ContentType: 'text/plain'
        });

        const response = await S3.send(command);
        console.log('Success! UploadId:', response.UploadId);
        console.log('Credentials and Permissions are GOOD locally.');
    } catch (error) {
        console.error('S3 Operation Failed:', error.message);
        if (error.name) console.error('Error Name:', error.name);
        if (error.$metadata) console.error('Metadata:', error.$metadata);
    }
}

testS3();

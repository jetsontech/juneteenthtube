
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const runTest = async (region: string | undefined, endpoint: string | undefined, desc: string) => {
    console.log(`\nTEST: ${desc}`);
    console.log(`INPUT: region='${region}'`);

    const S3 = new S3Client({
        region: region,
        endpoint: endpoint,
        credentials: {
            accessKeyId: "test",
            secretAccessKey: "test",
        },
    });

    const command = new PutObjectCommand({
        Bucket: "test-bucket",
        Key: "test-key",
        ContentType: "video/mp4",
    });

    try {
        await getSignedUrl(S3, command, { expiresIn: 3600 });
        console.log("RESULT: Success");
    } catch (error: unknown) {
        console.log(`RESULT: Error -> ${(error as Error).message}`);
    }
};

async function main() {
    // 1. Literal "auto"
    await runTest("auto", "https://act.r2.cloudflarestorage.com", "Literal 'auto'");

    // 2. The suspected poison string
    await runTest('region+"auto"', "https://act.r2.cloudflarestorage.com", "Poison String 'region+\"auto\"'");

    // 3. Just "us-east-1"
    await runTest("us-east-1", "https://act.r2.cloudflarestorage.com", "Control (us-east-1)");
}

main();

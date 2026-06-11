
const sanitizeEnv_Old = (val: string | undefined) => val ? val.replace(/^['"]|['"]$/g, '').trim().replace(/[\n\r]/g, '') : undefined;
const sanitizeEnv_New = (val: string | undefined) => val ? val.replace(/^['"]+|['"]+$/g, '').trim().replace(/[\n\r]/g, '') : undefined;

const cases = [
    'https://example.com"',
    '"https://example.com"',
    '""https://example.com""',
    "'https://example.com'",
    '"https://example.com',
    'https://example.com',
];

console.log("--- Testing Sanitization Logic ---");
cases.forEach(test => {
    console.log(`\nInput: [${test}]`);
    console.log(`Old Output: [${sanitizeEnv_Old(test)}]`);
    console.log(`New Output: [${sanitizeEnv_New(test)}]`);
});

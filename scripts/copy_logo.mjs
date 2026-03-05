import fs from 'fs';
import path from 'path';

const source = 'C:\\Users\\jetso\\.gemini\\antigravity\\brain\\b99ebafd-3e27-4095-b5a9-903b7367bd9b\\sarembok_logo_1772669281653.png';
const dest = 'c:\\Users\\jetso\\.gemini\\antigravity\\scratch\\juneteenthtube\\public\\sarembok_logo.png';

fs.copyFileSync(source, dest);
console.log('Logo copied to public dir for serving.');

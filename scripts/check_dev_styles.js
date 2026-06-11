const http = require('http');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function run() {
  try {
    console.log("Fetching http://localhost:3000/ ...");
    const home = await fetchUrl("http://localhost:3000/");
    console.log(`Status: ${home.status}`);
    
    // Search for CSS links
    const cssRegex = /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g;
    let match;
    const cssUrls = [];
    while ((match = cssRegex.exec(home.body)) !== null) {
      cssUrls.push(match[1]);
    }
    
    console.log("CSS stylesheets found on homepage:", cssUrls);
    
    for (const cssPath of cssUrls) {
      const fullUrl = cssPath.startsWith('http') ? cssPath : `http://localhost:3000${cssPath}`;
      console.log(`Fetching CSS content from: ${fullUrl}`);
      const cssData = await fetchUrl(fullUrl);
      console.log(`Status: ${cssData.status}`);
      console.log(`Size: ${cssData.body.length} bytes`);
      console.log(`Preview of CSS (first 500 chars):\n${cssData.body.substring(0, 500)}`);
      console.log("------------------------------------------");
    }
  } catch (e) {
    console.error("Failed to check dev styles:", e.message);
  }
}

run();

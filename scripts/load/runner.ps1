$k6 = "C:\Program Files\k6\k6.exe"
$outDir = "C:\Juneteenthtube-Master\scripts\load\results"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function RunTest($script, $vus, $duration, $name) {
    Write-Host "Running $name with $vus VUs for $duration..."
    $outFile = "$outDir\${name}_${vus}vus.json"
    & $k6 run -u $vus -d $duration --summary-export $outFile $script
}

# Homepage
RunTest "scripts\load\homepage.js" 500 "15s" "homepage"
RunTest "scripts\load\homepage.js" 1000 "15s" "homepage"
RunTest "scripts\load\homepage.js" 5000 "15s" "homepage"
RunTest "scripts\load\homepage.js" 10000 "15s" "homepage"

# Watch
RunTest "scripts\load\watch.js" 500 "15s" "watch"
RunTest "scripts\load\watch.js" 1000 "15s" "watch"
RunTest "scripts\load\watch.js" 5000 "15s" "watch"

# Search
RunTest "scripts\load\search.js" 100 "15s" "search"
RunTest "scripts\load\search.js" 500 "15s" "search"
RunTest "scripts\load\search.js" 1000 "15s" "search"

# Uploads
RunTest "scripts\load\upload.js" 50 "15s" "upload"
RunTest "scripts\load\upload.js" 100 "15s" "upload"
RunTest "scripts\load\upload.js" 250 "15s" "upload"

Write-Host "Load testing complete."

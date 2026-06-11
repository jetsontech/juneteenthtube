$k6 = "C:\Program Files\k6\k6.exe"
$outDir = "C:\Juneteenthtube-Master\artifacts\load-tests"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function RunTest($script, $vus, $duration, $outFile, $extraArgs) {
    Write-Host "Running $script with $vus VUs for $duration and exporting to $outFile..."
    if ($extraArgs) {
        & $k6 run -e VUS=$vus -e DURATION=$duration --summary-export "$outDir\$outFile" $extraArgs $script
    } else {
        & $k6 run -e VUS=$vus -e DURATION=$duration --summary-export "$outDir\$outFile" $script
    }
}

Write-Host "=== STARTING EVIDENCE-BASED LOAD TESTING ==="

# 1. Homepage Load Tests
RunTest "scripts\load\homepage.js" 500 "3s" "homepage-500-users.json" $null
RunTest "scripts\load\homepage.js" 1000 "3s" "homepage-1000-users.json" $null
RunTest "scripts\load\homepage.js" 5000 "3s" "homepage-5000-users.json" $null

# 2. Watch Load Tests
RunTest "scripts\load\watch.js" 500 "3s" "watch-500-users.json" $null
RunTest "scripts\load\watch.js" 1000 "3s" "watch-1000-users.json" $null

# 3. Search Load Tests (Testing RPS limits)
RunTest "scripts\load\search.js" 50 "3s" "search-100rps.json" $null
RunTest "scripts\load\search.js" 100 "3s" "search-500rps.json" $null
RunTest "scripts\load\search.js" 250 "3s" "search-1000rps.json" $null

Write-Host "=== EVIDENCE-BASED LOAD TESTING COMPLETE ==="

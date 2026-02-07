# Quick check: Are our logs even in the compiled code?

Write-Host "🔍 Checking if debug logs exist in compiled dist files..." -ForegroundColor Cyan
Write-Host ""

$missing = 0

# Check 1: Token allocation in dist/brain/index.js
Write-Host "✓ Check 1: Token allocation logging in dist/brain/index.js" -ForegroundColor Yellow
try {
    $content = Get-Content "dist\core\brain\index.js" -Raw -ErrorAction Stop
    
    if ($content -match "CODE GENERATION DETECTED") {
        Write-Host "  ✅ Found: 'CODE GENERATION DETECTED'" -ForegroundColor Green
    } else {
        Write-Host "  ❌ MISSING: 'CODE GENERATION DETECTED' not found!" -ForegroundColor Red
        Write-Host "     → brain/index.ts wasn't compiled or logging was removed" -ForegroundColor Yellow
        $missing++
    }
    
    if ($content -match "maxTokens = 3500") {
        Write-Host "  ✅ Found: 'maxTokens = 3500'" -ForegroundColor Green
    } else {
        Write-Host "  ❌ MISSING: Haskell token allocation not found!" -ForegroundColor Red
        $missing++
    }
} catch {
    Write-Host "  ❌ ERROR: Could not read dist/core/brain/index.js" -ForegroundColor Red
    Write-Host "     File may not exist - need to compile TypeScript" -ForegroundColor Yellow
    $missing += 2
}

Write-Host ""

# Check 2: Ollama logging in dist/llm/ollama.js
Write-Host "✓ Check 2: Ollama logging in dist/llm/ollama.js" -ForegroundColor Yellow
try {
    $content = Get-Content "dist/core/llm/ollama.js" -Raw -ErrorAction Stop
    
    if ($content -match "CALLING OLLAMA") {
        Write-Host "  ✅ Found: 'CALLING OLLAMA'" -ForegroundColor Green
    } else {
        Write-Host "  ❌ MISSING: Ollama logging not found!" -ForegroundColor Red
        $missing++
    }
} catch {
    Write-Host "  ❌ ERROR: Could not read dist/core/llm/ollama.js" -ForegroundColor Red
    $missing++
}

Write-Host ""

# Check 3: Threat detection fix in dist/security/threat_detection.js
Write-Host "✓ Check 3: Fenced code detection in dist/security/threat_detection.js" -ForegroundColor Yellow
try {
    $content = Get-Content "dist/security/threat_detection.js" -Raw -ErrorAction Stop
    
    if ($content -match "hasFencedCode") {
        Write-Host "  ✅ Found: 'hasFencedCode'" -ForegroundColor Green
    } else {
        Write-Host "  ❌ MISSING: Fenced code detection not found!" -ForegroundColor Red
        $missing++
    }
} catch {
    Write-Host "  ❌ ERROR: Could not read dist/security/threat_detection.js" -ForegroundColor Red
    $missing++
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📊 SUMMARY" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if ($missing -eq 0) {
    Write-Host "✅ All debug logs present in compiled code" -ForegroundColor Green
    Write-Host "   → Logs should appear when running the app" -ForegroundColor White
    Write-Host "   → If logs still don't show, the code path is different" -ForegroundColor White
} else {
    Write-Host "❌ $missing item(s) missing from compiled code" -ForegroundColor Red
    Write-Host "   → Need to run: npx tsc -p tsconfig.json" -ForegroundColor Yellow
    Write-Host "   → Then restart: npm run dev:electron" -ForegroundColor Yellow
}

Write-Host ""
# Bonus: Check source files exist
Write-Host "🔍 Bonus: Checking source files..." -ForegroundColor Cyan
$srcFiles = @(
    "src\core\brain\index.ts",
    "src\core\llm\ollama.ts",
    "src\security\threat_detection.ts"
)

foreach ($file in $srcFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file MISSING!" -ForegroundColor Red
    }
}

Write-Host ""

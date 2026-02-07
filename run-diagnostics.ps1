# LUMI Diagnostics - Windows PowerShell Version
# Run: .\run-diagnostics.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "🔍 LUMI DIAGNOSTICS" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check 1: TypeScript compiled
Write-Host "✓ Check 1: TypeScript compilation" -ForegroundColor Yellow
if (Test-Path "dist\main.js") {
    Write-Host "  ✅ dist\main.js exists" -ForegroundColor Green
} else {
    Write-Host "  ❌ dist\main.js missing - run: npx tsc -p tsconfig.json" -ForegroundColor Red
    exit 1
}

# Check 2: Token allocation code present
Write-Host ""
Write-Host "✓ Check 2: Token allocation in brain/index.ts" -ForegroundColor Yellow
$indexContent = Get-Content "src\brain\index.ts" -Raw -ErrorAction SilentlyContinue
if ($indexContent -match "if \(lang === 'haskell'\) maxTokens = 3500") {
    Write-Host "  ✅ Haskell token allocation found" -ForegroundColor Green
} else {
    Write-Host "  ❌ Token allocation missing" -ForegroundColor Red
}

# Check 3: Threat detection updated
Write-Host ""
Write-Host "✓ Check 3: Fenced code detection in threat_detection.ts" -ForegroundColor Yellow
$threatContent = Get-Content "src\security\threat_detection.ts" -Raw -ErrorAction SilentlyContinue
if ($threatContent -match "hasFencedCode") {
    Write-Host "  ✅ Fenced code detection added" -ForegroundColor Green
} else {
    Write-Host "  ❌ Fenced code detection missing" -ForegroundColor Red
}

# Check 4: Ollama running
Write-Host ""
Write-Host "✓ Check 4: Ollama availability" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ Ollama is running" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Ollama returned status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  Ollama is not running - start with: ollama serve" -ForegroundColor Yellow
}

# Check 5: RAG integration
Write-Host ""
Write-Host "✓ Check 5: RAG integration has token allocation" -ForegroundColor Yellow
$ragContent = Get-Content "src\brain\brain-rag-integration.ts" -Raw -ErrorAction SilentlyContinue
if ($ragContent -match "if \(languages\.includes\('Haskell'\)\) maxTokens = 3500") {
    Write-Host "  ✅ RAG token allocation found" -ForegroundColor Green
} else {
    Write-Host "  ❌ RAG token allocation missing" -ForegroundColor Red
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "🎯 DIAGNOSTIC COMPLETE" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor White
Write-Host "1. If any ❌ found, apply fixes from LUMI_FIXES_PART2.md"
Write-Host "2. Rebuild: npx tsc -p tsconfig.json"
Write-Host "3. Start: npm run dev:electron"
Write-Host "4. Test: 'Write a Haskell parser using parser combinators'"
Write-Host "5. Watch console for these logs:"
Write-Host "   - 🔥 CODE GENERATION DETECTED"
Write-Host "   - Language detected: haskell"
Write-Host "   - Token allocation: 3500"
Write-Host "   - num_predict value: 3500"
Write-Host ""

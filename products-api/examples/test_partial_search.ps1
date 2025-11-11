# Script para probar búsqueda parcial en Solr

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   Prueba de Búsqueda Parcial" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$API_URL = "http://localhost:8081"

# Verificar API
Write-Host "Verificando API..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$API_URL/healthz" -Method Get -ErrorAction Stop
    Write-Host "✓ API está corriendo" -ForegroundColor Green
} catch {
    Write-Host "✗ API NO está corriendo" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Tests de búsqueda parcial
Write-Host "Probando búsquedas parciales:" -ForegroundColor Yellow
Write-Host ""

# Test 1: Búsqueda de 1 letra
Write-Host "1. Búsqueda: 'p'" -ForegroundColor Cyan
$result1 = Invoke-RestMethod -Uri "$API_URL/products/search?q=p"
Write-Host "   Resultados: $($result1.results.Count)" -ForegroundColor Gray
if ($result1.results.Count -gt 0) {
    Write-Host "   ✓ Encontrados:" -ForegroundColor Green
    $result1.results | ForEach-Object { Write-Host "     - $($_.nombre)" -ForegroundColor Gray }
}
Write-Host ""

# Test 2: Búsqueda de 2 letras
Write-Host "2. Búsqueda: 'pi'" -ForegroundColor Cyan
$result2 = Invoke-RestMethod -Uri "$API_URL/products/search?q=pi"
Write-Host "   Resultados: $($result2.results.Count)" -ForegroundColor Gray
if ($result2.results.Count -gt 0) {
    Write-Host "   ✓ Encontrados:" -ForegroundColor Green
    $result2.results | ForEach-Object { Write-Host "     - $($_.nombre)" -ForegroundColor Gray }
}
Write-Host ""

# Test 3: Búsqueda de 3 letras
Write-Host "3. Búsqueda: 'piz'" -ForegroundColor Cyan
$result3 = Invoke-RestMethod -Uri "$API_URL/products/search?q=piz"
Write-Host "   Resultados: $($result3.results.Count)" -ForegroundColor Gray
if ($result3.results.Count -gt 0) {
    Write-Host "   ✓ Encontrados:" -ForegroundColor Green
    $result3.results | ForEach-Object { Write-Host "     - $($_.nombre)" -ForegroundColor Gray }
}
Write-Host ""

# Test 4: Búsqueda palabra completa
Write-Host "4. Búsqueda: 'pizza'" -ForegroundColor Cyan
$result4 = Invoke-RestMethod -Uri "$API_URL/products/search?q=pizza"
Write-Host "   Resultados: $($result4.results.Count)" -ForegroundColor Gray
if ($result4.results.Count -gt 0) {
    Write-Host "   ✓ Encontrados:" -ForegroundColor Green
    $result4.results | ForEach-Object { Write-Host "     - $($_.nombre)" -ForegroundColor Gray }
}
Write-Host ""

# Test 5: Búsqueda por término en medio
Write-Host "5. Búsqueda: 'zza' (medio de 'pizza')" -ForegroundColor Cyan
$result5 = Invoke-RestMethod -Uri "$API_URL/products/search?q=zza"
Write-Host "   Resultados: $($result5.results.Count)" -ForegroundColor Gray
if ($result5.results.Count -gt 0) {
    Write-Host "   ✓ Encontrados:" -ForegroundColor Green
    $result5.results | ForEach-Object { Write-Host "     - $($_.nombre)" -ForegroundColor Gray }
}
Write-Host ""

# Test 6: Búsqueda por tag
Write-Host "6. Búsqueda: 'que' (parte de 'queso')" -ForegroundColor Cyan
$result6 = Invoke-RestMethod -Uri "$API_URL/products/search?q=que"
Write-Host "   Resultados: $($result6.results.Count)" -ForegroundColor Gray
if ($result6.results.Count -gt 0) {
    Write-Host "   ✓ Encontrados:" -ForegroundColor Green
    $result6.results | ForEach-Object { Write-Host "     - $($_.nombre) (tags: $($_.tags -join ', '))" -ForegroundColor Gray }
}
Write-Host ""

# Resumen
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   Resumen" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$allPassed = $true

if ($result2.results.Count -gt 0) {
    Write-Host "✓ Búsqueda parcial 'pi' funciona" -ForegroundColor Green
} else {
    Write-Host "✗ Búsqueda parcial 'pi' NO funciona" -ForegroundColor Red
    $allPassed = $false
}

if ($result3.results.Count -gt 0) {
    Write-Host "✓ Búsqueda parcial 'piz' funciona" -ForegroundColor Green
} else {
    Write-Host "✗ Búsqueda parcial 'piz' NO funciona" -ForegroundColor Red
    $allPassed = $false
}

if ($result5.results.Count -gt 0) {
    Write-Host "✓ Búsqueda en medio 'zza' funciona" -ForegroundColor Green
} else {
    Write-Host "✗ Búsqueda en medio 'zza' NO funciona" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""
if ($allPassed) {
    Write-Host "🎉 ¡Todas las búsquedas parciales funcionan!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Algunas búsquedas no funcionaron" -ForegroundColor Yellow
    Write-Host "Asegúrate de haber reiniciado la API después de los cambios" -ForegroundColor Yellow
}
Write-Host ""
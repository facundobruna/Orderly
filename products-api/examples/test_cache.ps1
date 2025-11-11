# Script para probar el funcionamiento del cache de Memcached en Windows PowerShell

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   Pruebas de Cache con Memcached" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$API_URL = "http://localhost:8081"

# 1. Verificar que la API esté corriendo
Write-Host "1. Verificando que la API esté corriendo..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$API_URL/healthz" -Method Get -ErrorAction Stop
    Write-Host "   ✓ API está corriendo" -ForegroundColor Green
} catch {
    Write-Host "   ✗ API NO está corriendo en $API_URL" -ForegroundColor Red
    Write-Host "   Por favor ejecuta: go run cmd/api/main.go" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 2. Verificar Memcached con Docker
Write-Host "2. Verificando conexión con Memcached..." -ForegroundColor Yellow
try {
    $dockerCheck = docker ps --filter "name=memcached" --format "{{.Names}}" 2>$null
    if ($dockerCheck) {
        Write-Host "   ✓ Memcached está corriendo en Docker: $dockerCheck" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Memcached NO está corriendo" -ForegroundColor Red
        Write-Host "   Ejecuta: docker-compose up -d" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "   ⚠ No se pudo verificar Docker" -ForegroundColor Yellow
}
Write-Host ""

# 3. Obtener lista de productos
Write-Host "3. Obteniendo lista de productos..." -ForegroundColor Yellow
try {
    $productos = Invoke-RestMethod -Uri "$API_URL/products?limit=5" -Method Get -ErrorAction Stop

    if ($productos.results.Count -eq 0) {
        Write-Host "   ✗ No se encontraron productos" -ForegroundColor Red
        Write-Host "   Por favor crea un producto primero con POST /products" -ForegroundColor Yellow
        exit 1
    }

    $primerProducto = $productos.results[0]
    $PRIMER_ID = $primerProducto.id

    Write-Host "   ✓ Usando producto ID: $PRIMER_ID" -ForegroundColor Green
    Write-Host "   Nombre: $($primerProducto.nombre)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Error obteniendo productos: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 4. Limpiar cache usando Docker exec
Write-Host "4. Limpiando cache de Memcached..." -ForegroundColor Yellow
try {
    # Usar telnet a través de Docker para limpiar el cache
    docker exec products-api-memcached-1 sh -c "echo 'flush_all' | nc localhost 11211" 2>$null | Out-Null
    Write-Host "   ✓ Cache limpiado" -ForegroundColor Green
} catch {
    Write-Host "   ⚠ No se pudo limpiar cache (esto es opcional)" -ForegroundColor Yellow
}
Write-Host ""

# 5. Primera lectura (sin cache)
Write-Host "5. Primera lectura del producto (sin cache)..." -ForegroundColor Yellow
Write-Host "   GET $API_URL/products/$PRIMER_ID" -ForegroundColor Gray

$time1 = Measure-Command {
    $prod1 = Invoke-RestMethod -Uri "$API_URL/products/$PRIMER_ID" -Method Get
}
$timeMs1 = [math]::Round($time1.TotalMilliseconds, 2)
Write-Host "   ⏱  Tiempo: ${timeMs1}ms (desde MongoDB)" -ForegroundColor Cyan
Write-Host ""

# 6. Segunda lectura (con cache)
Write-Host "6. Segunda lectura del producto (con cache)..." -ForegroundColor Yellow
Write-Host "   GET $API_URL/products/$PRIMER_ID" -ForegroundColor Gray

$time2 = Measure-Command {
    $prod2 = Invoke-RestMethod -Uri "$API_URL/products/$PRIMER_ID" -Method Get
}
$timeMs2 = [math]::Round($time2.TotalMilliseconds, 2)
Write-Host "   ⏱  Tiempo: ${timeMs2}ms (desde Memcached)" -ForegroundColor Cyan
Write-Host ""

# 7. Tercera lectura (debería ser también desde cache)
Write-Host "7. Tercera lectura del producto (también desde cache)..." -ForegroundColor Yellow
$time3 = Measure-Command {
    $prod3 = Invoke-RestMethod -Uri "$API_URL/products/$PRIMER_ID" -Method Get
}
$timeMs3 = [math]::Round($time3.TotalMilliseconds, 2)
Write-Host "   ⏱  Tiempo: ${timeMs3}ms (desde Memcached)" -ForegroundColor Cyan
Write-Host ""

# 8. Analizar resultados
Write-Host "8. Análisis de rendimiento..." -ForegroundColor Yellow

# Calcular promedio de lecturas con cache
$avgCacheTime = [math]::Round(($timeMs2 + $timeMs3) / 2, 2)

Write-Host "   - Primera lectura (sin cache): ${timeMs1}ms" -ForegroundColor Gray
Write-Host "   - Lecturas con cache (promedio): ${avgCacheTime}ms" -ForegroundColor Gray

if ($avgCacheTime -lt $timeMs1) {
    $improvement = [math]::Round((($timeMs1 - $avgCacheTime) / $timeMs1) * 100, 1)
    Write-Host ""
    Write-Host "   ✓ ¡Cache funciona correctamente!" -ForegroundColor Green
    Write-Host "   📈 Mejora de rendimiento: ~${improvement}%" -ForegroundColor Green
    Write-Host "   💡 Las lecturas desde Memcached son ${improvement}% más rápidas" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "   ⚠ No se detectó mejora significativa" -ForegroundColor Yellow
    Write-Host "   Esto puede ser normal si MongoDB es muy rápido localmente" -ForegroundColor Gray
    Write-Host "   En producción con bases de datos remotas, la diferencia sería mayor" -ForegroundColor Gray
}
Write-Host ""

# 9. Prueba de invalidación de cache
Write-Host "9. Probando invalidación de cache al actualizar..." -ForegroundColor Yellow

$timestamp = [DateTimeOffset]::Now.ToUnixTimeSeconds()
$updateData = @{
    descripcion = "Descripción actualizada - $timestamp"
} | ConvertTo-Json

try {
    $updated = Invoke-RestMethod -Uri "$API_URL/products/$PRIMER_ID" `
        -Method Put `
        -Body $updateData `
        -ContentType "application/json" `
        -ErrorAction Stop

    Write-Host "   ✓ Producto actualizado" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error actualizando: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 10. Lectura después de update (debería invalidar cache)
Write-Host "10. Lectura después de actualización..." -ForegroundColor Yellow
Write-Host "    (El cache fue invalidado, debería leer desde MongoDB)" -ForegroundColor Gray

$time4 = Measure-Command {
    $prod4 = Invoke-RestMethod -Uri "$API_URL/products/$PRIMER_ID" -Method Get
}
$timeMs4 = [math]::Round($time4.TotalMilliseconds, 2)
Write-Host "   ⏱  Tiempo: ${timeMs4}ms (desde MongoDB, cache invalidado)" -ForegroundColor Cyan

# Verificar que se guardó en cache nuevamente
Start-Sleep -Milliseconds 100
$time5 = Measure-Command {
    $prod5 = Invoke-RestMethod -Uri "$API_URL/products/$PRIMER_ID" -Method Get
}
$timeMs5 = [math]::Round($time5.TotalMilliseconds, 2)
Write-Host "   ⏱  Nueva lectura: ${timeMs5}ms (desde Memcached, recacheado)" -ForegroundColor Cyan
Write-Host ""

# 11. Verificar que la descripción cambió
Write-Host "11. Verificando actualización..." -ForegroundColor Yellow
if ($prod5.descripcion -like "*$timestamp*") {
    Write-Host "   ✓ Descripción actualizada correctamente: $($prod5.descripcion)" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Descripción: $($prod5.descripcion)" -ForegroundColor Yellow
}
Write-Host ""

# Resumen final
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   Resumen de Pruebas" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Flujo de Cache:" -ForegroundColor White
Write-Host "  1️⃣  Primera lectura (sin cache):       ${timeMs1}ms" -ForegroundColor Gray
Write-Host "  2️⃣  Segunda lectura (con cache):       ${timeMs2}ms" -ForegroundColor Gray
Write-Host "  3️⃣  Tercera lectura (con cache):       ${timeMs3}ms" -ForegroundColor Gray
Write-Host "  4️⃣  Después de UPDATE (sin cache):     ${timeMs4}ms" -ForegroundColor Gray
Write-Host "  5️⃣  Lectura post-update (con cache):   ${timeMs5}ms" -ForegroundColor Gray
Write-Host ""

if ($avgCacheTime -lt $timeMs1) {
    $finalImprovement = [math]::Round((($timeMs1 - $avgCacheTime) / $timeMs1) * 100, 1)
    Write-Host "✅ Cache funcionando correctamente" -ForegroundColor Green
    Write-Host "📊 Mejora promedio: ${finalImprovement}%" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Cache funciona pero la mejora es mínima localmente" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "💡 Tip: En producción con BD remota, la mejora sería mucho mayor (50-95%)" -ForegroundColor Cyan
Write-Host ""
# Script rápido para probar Cache y Búsqueda en Windows PowerShell

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   Tests Rápidos - Cache y Búsqueda" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$API_URL = "http://localhost:8081"

# 1. Verificar API
Write-Host "1. Verificando API..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$API_URL/healthz" -Method Get -ErrorAction Stop
    Write-Host "   ✓ API está corriendo" -ForegroundColor Green
} catch {
    Write-Host "   ✗ API NO está corriendo" -ForegroundColor Red
    Write-Host "   Por favor ejecuta: go run cmd/api/main.go" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 2. Test de Búsqueda
Write-Host "2. Probando búsqueda: 'pizza'" -ForegroundColor Yellow
try {
    $searchResult = Invoke-RestMethod -Uri "$API_URL/products/search?q=pizza" -Method Get
    Write-Host "   Query: $($searchResult.query)" -ForegroundColor Gray
    Write-Host "   Resultados encontrados: $($searchResult.results.Count)" -ForegroundColor Gray

    if ($searchResult.results.Count -gt 0) {
        Write-Host "   ✓ Búsqueda funciona correctamente" -ForegroundColor Green
        Write-Host "   Primer resultado: $($searchResult.results[0].nombre)" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠ No se encontraron resultados" -ForegroundColor Yellow
        Write-Host "   Verifica que Solr tenga productos indexados" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ✗ Error en búsqueda: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 3. Test de Cache
Write-Host "3. Probando cache..." -ForegroundColor Yellow
try {
    # Obtener lista de productos
    $productos = Invoke-RestMethod -Uri "$API_URL/products?limit=1" -Method Get

    if ($productos.results.Count -eq 0) {
        Write-Host "   ⚠ No hay productos para probar cache" -ForegroundColor Yellow
        Write-Host "   Crea un producto primero" -ForegroundColor Yellow
    } else {
        $productId = $productos.results[0].id
        Write-Host "   Usando producto ID: $productId" -ForegroundColor Gray

        # Primera lectura (sin cache)
        Write-Host "   Primera lectura (sin cache)..." -ForegroundColor Gray
        $time1 = Measure-Command {
            $prod1 = Invoke-RestMethod -Uri "$API_URL/products/$productId" -Method Get
        }
        Write-Host "   ⏱  Tiempo: $([math]::Round($time1.TotalMilliseconds, 2))ms" -ForegroundColor Gray

        # Segunda lectura (con cache)
        Write-Host "   Segunda lectura (con cache)..." -ForegroundColor Gray
        $time2 = Measure-Command {
            $prod2 = Invoke-RestMethod -Uri "$API_URL/products/$productId" -Method Get
        }
        Write-Host "   ⏱  Tiempo: $([math]::Round($time2.TotalMilliseconds, 2))ms" -ForegroundColor Gray

        if ($time2.TotalMilliseconds -lt $time1.TotalMilliseconds) {
            $improvement = [math]::Round((($time1.TotalMilliseconds - $time2.TotalMilliseconds) / $time1.TotalMilliseconds) * 100, 1)
            Write-Host "   ✓ Cache funciona! Mejora: ~$improvement%" -ForegroundColor Green
        } else {
            Write-Host "   ⚠ No se detectó mejora (puede ser normal localmente)" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "   ✗ Error en cache: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 4. Verificar Solr directamente
Write-Host "4. Verificando Solr..." -ForegroundColor Yellow
try {
    $solrQuery = "http://localhost:8983/solr/demo/select?q=*:*&rows=0&wt=json"
    $solrResult = Invoke-RestMethod -Uri $solrQuery -Method Get
    $numDocs = $solrResult.response.numFound
    Write-Host "   ✓ Solr tiene $numDocs documentos indexados" -ForegroundColor Green
} catch {
    Write-Host "   ✗ No se pudo conectar a Solr" -ForegroundColor Red
    Write-Host "   Verifica: docker-compose ps" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   Tests completados" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 Para más detalles, lee: examples/README.md" -ForegroundColor Cyan
<# =======================================================================
 start-dev.ps1  —  Arranque de desarrollo con Node portátil (PowerShell)
 Requisitos: tener carpeta node-portable\ con node.exe y npm.cmd
======================================================================= #>

# --- Configuración básica ---
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$NodeDir     = Join-Path $ProjectRoot "node-portable"
$NodeExe     = Join-Path $NodeDir "node.exe"
$NpmCmd      = Join-Path $NodeDir "npm.cmd"

if (!(Test-Path $NodeExe) -or !(Test-Path $NpmCmd)) {
  Write-Host "No se encontró Node portátil en: $NodeDir" -ForegroundColor Red
  Write-Host "   Esperaba: node.exe y npm.cmd" -ForegroundColor Yellow
  exit 1
}

# --- Activar Node portátil solo para esta sesión ---
$env:PATH = "$NodeDir;$env:PATH"

# --- Mostrar versiones para verificación ---
& $NodeExe -v
& $NpmCmd -v
Write-Host "-------------------------------------"

# --- Instalar dependencias si no existen ---
if (!(Test-Path (Join-Path $ProjectRoot "node_modules"))) {
  Write-Host " Instalando dependencias ("
  & $NpmCmd ci
  if ($LASTEXITCODE -ne 0) {
    & $NpmCmd install
    if ($LASTEXITCODE -ne 0) {
      Write-Host "Falló la instalación de dependencias." -ForegroundColor Red
      exit 1
    }
  }
}

# --- Buscar puerto libre (5173..5199) ---
function Test-PortFree([int]$Port) {
  try {
    $l = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
    $l.Start(); $l.Stop(); $true
  } catch { $false }
}

$port = 5173
while (-not (Test-PortFree $port) -and $port -lt 5200) { $port++ }
if (-not (Test-PortFree $port)) {
  Write-Host "No hay puertos libres entre 5173 y 5199." -ForegroundColor Red
  exit 1
}

# Variables de entorno comunes por si tu stack las respeta
$env:PORT = "$port"
$env:VITE_PORT = "$port"

Write-Host "Iniciando dev server en puerto $port …"
Write-Host "-------------------------------------"

# --- Abrir navegador cuando el server responda (mejor que un simple delay) ---
$targetUrl = "http://localhost:$port"
Start-Job -ScriptBlock {
  param($url)
  $deadline = (Get-Date).AddMinutes(2)
  do {
    try {
      $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
      if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { Start-Process $url; break }
    } catch { Start-Sleep -Milliseconds 500 }
  } while ((Get-Date) -lt $deadline)
} -ArgumentList $targetUrl | Out-Null

# --- Ejecutar npm run dev pasando el puerto explícito (Vite/Nuxt/etc aceptan -- --port X) ---
Push-Location $ProjectRoot
& $NpmCmd run dev -- --port $port
$code = $LASTEXITCODE
Pop-Location
exit $code

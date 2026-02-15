# AI Brain Database Setup Script
# Run this to set up the PostgreSQL database

$env:PGPASSWORD = "Rebel2022$"
$PSQL = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

Write-Host "🧠 AI Brain Database Setup" -ForegroundColor Cyan
Write-Host "=" * 50

# Step 1: Create database
Write-Host "`n1️⃣ Creating database 'aibrain'..." -ForegroundColor Yellow
$createDbResult = & $PSQL -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'aibrain'" 2>&1

if ($createDbResult -match "1") {
    Write-Host "   ✅ Database 'aibrain' already exists" -ForegroundColor Green
}
else {
    & $PSQL -U postgres -c "CREATE DATABASE aibrain" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Database 'aibrain' created successfully" -ForegroundColor Green
    }
    else {
        Write-Host "   ❌ Failed to create database" -ForegroundColor Red
        exit 1
    }
}

# Step 2: Enable uuid-ossp extension (pgvector not available)
Write-Host "`n2️⃣ Enabling uuid-ossp extension..." -ForegroundColor Yellow
& $PSQL -U postgres -d aibrain -c "CREATE EXTENSION IF NOT EXISTS ""uuid-ossp"";" 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ uuid-ossp extension enabled" -ForegroundColor Green
}
else {
    Write-Host "   ❌ Failed to enable uuid-ossp" -ForegroundColor Red
}

# Step 3: Load schema
Write-Host "`n3️⃣ Loading database schema..." -ForegroundColor Yellow
& $PSQL -U postgres -d aibrain -f "src\db\schema-no-vector.sql" 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Schema loaded successfully" -ForegroundColor Green
}
else {
    Write-Host "   ⚠️  Schema may have already been loaded" -ForegroundColor Yellow
}

# Step 4: Verify setup
Write-Host "`n4️⃣ Verifying setup..." -ForegroundColor Yellow
$tableCount = & $PSQL -U postgres -d aibrain -tc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
Write-Host "   ✅ Tables created: $tableCount" -ForegroundColor Green

# Check for default user
$userCheck = & $PSQL -U postgres -d aibrain -tc "SELECT COUNT(*) FROM users WHERE username = 'default_user';"
if ($userCheck -match "1") {
    Write-Host "   ✅ Default user exists" -ForegroundColor Green
}
else {
    Write-Host "   ⚠️  Default user will be created on first run" -ForegroundColor Yellow
}

Write-Host "`n" + "=" * 50
Write-Host "✅ Database setup complete!" -ForegroundColor Green
Write-Host "`nConnection string for .env file:" -ForegroundColor Cyan
Write-Host "DATABASE_URL=postgresql://postgres:Rebel2022$@localhost:5432/aibrain" -ForegroundColor White
Write-Host "`n" + "=" * 50

# Clean up
$env:PGPASSWORD = ""

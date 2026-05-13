$token = $env:GITHUB_TOKEN  # Defina a variável de ambiente GITHUB_TOKEN antes de executar
$repoName = "sobreiro"

Write-Host "Verificando se o Git está instalado..."
$gitPath = "C:\Program Files\Git\cmd\git.exe"
if (-Not (Test-Path $gitPath)) {
    Write-Host "Git não encontrado em $gitPath. Por favor, adicione o Git ao seu PATH."
    exit
}

Write-Host "Criando repositório no GitHub..."
$headers = @{
    "Authorization" = "token $token"
    "Accept" = "application/vnd.github.v3+json"
}

$userResp = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers
$username = $userResp.login
Write-Host "Autenticado como: $username"

$body = @{
    "name" = $repoName
    "private" = $true
} | ConvertTo-Json

try {
    $repoResp = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Headers $headers -Body $body
    Write-Host "Repositório '$repoName' criado com sucesso no GitHub!"
} catch {
    Write-Host "Aviso: O repositório já existe ou houve um erro ao criar. (Ignorando se já existir)"
}

Write-Host "Inicializando o repositório Git local..."
& $gitPath init
& $gitPath config user.name "$username"
& $gitPath config user.email "$username@users.noreply.github.com"
& $gitPath add .
& $gitPath commit -m "Commit inicial do projeto Sobreiro"

Write-Host "Configurando o remote e enviando (push) para o GitHub..."
$remoteUrl = "https://$token@github.com/$username/$repoName.git"
& $gitPath remote remove origin 2>$null
& $gitPath remote add origin $remoteUrl
& $gitPath branch -M main
& $gitPath push -u origin main

Write-Host "========================================="
Write-Host "Pronto! O código foi enviado para o GitHub."
Write-Host "Você pode acessar o repositório em: https://github.com/$username/$repoName"
Write-Host "========================================="

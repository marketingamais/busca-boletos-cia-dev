$json = Get-Content 'C:\Users\Designer Amais\.gemini\antigravity\brain\10fd9857-817b-490e-8f5f-b25f0734cbde\.system_generated\steps\48\content.md' -Raw
$start = $json.IndexOf('{')
if ($start -ge 0) {
    $json = $json.Substring($start)
    $obj = $json | ConvertFrom-Json
    $obj.paths.'/api/v3/Auth/login'.post.responses.'200'.schema | ConvertTo-Json -Depth 4 | Out-File 'd:\VIBE CODDING\CLAUDE CODE\BOLETO CIA - Copia\login_response_ref.txt'
    $obj.definitions.'Models.Integration.SponteWebApi.Controllers.AuthResponseDto' | ConvertTo-Json -Depth 4 | Out-File 'd:\VIBE CODDING\CLAUDE CODE\BOLETO CIA - Copia\login_response_def.txt'
}

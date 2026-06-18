$json = Get-Content 'C:\Users\Designer Amais\.gemini\antigravity\brain\10fd9857-817b-490e-8f5f-b25f0734cbde\.system_generated\steps\48\content.md' -Raw
$start = $json.IndexOf('{')
if ($start -ge 0) {
    $json = $json.Substring($start)
    $obj = $json | ConvertFrom-Json
    $obj.paths.'/api/v3/ContasReceber'.get.parameters | ConvertTo-Json -Depth 2 | Out-File 'd:\VIBE CODDING\CLAUDE CODE\BOLETO CIA - Copia\params.txt'
    $obj.definitions | ConvertTo-Json -Depth 4 | Out-File 'd:\VIBE CODDING\CLAUDE CODE\BOLETO CIA - Copia\defs.txt'
}

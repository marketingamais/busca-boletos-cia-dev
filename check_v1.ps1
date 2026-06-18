$json = Get-Content 'C:\Users\Designer Amais\.gemini\antigravity\brain\10fd9857-817b-490e-8f5f-b25f0734cbde\.system_generated\steps\27\content.md' -Raw
$start = $json.IndexOf('{')
if ($start -ge 0) {
    $json = $json.Substring($start)
    $obj = $json | ConvertFrom-Json
    $obj.paths.'/api/students'.get.parameters | ConvertTo-Json -Depth 2 | Out-File 'd:\VIBE CODDING\CLAUDE CODE\BOLETO CIA - Copia\params_students_v1.txt'
    $obj.paths.'/api/receivables'.post.parameters | ConvertTo-Json -Depth 4 | Out-File 'd:\VIBE CODDING\CLAUDE CODE\BOLETO CIA - Copia\params_receivables_v1.txt'
}

$json = Get-Content 'C:\Users\Designer Amais\.gemini\antigravity\brain\10fd9857-817b-490e-8f5f-b25f0734cbde\.system_generated\steps\48\content.md' -Raw
$start = $json.IndexOf('{')
if ($start -ge 0) {
    $json = $json.Substring($start)
    $obj = $json | ConvertFrom-Json
    $cpfParams = @()
    foreach ($path in $obj.paths.psobject.properties) {
        $pathName = $path.Name
        foreach ($method in $path.Value.psobject.properties) {
            $params = $method.Value.parameters
            if ($params) {
                foreach ($p in $params) {
                    if ($p.name -match 'cpf' -or $p.name -match 'Cpf' -or $p.name -match 'CPF') {
                        $cpfParams += "$pathName - $($p.name)"
                    }
                }
            }
        }
    }
    $cpfParams | Out-File 'd:\VIBE CODDING\CLAUDE CODE\BOLETO CIA - Copia\cpf_params.txt'
}

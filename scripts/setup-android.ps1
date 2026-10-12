param([string]$JavaHome = 'C:\Program Files\Java\jdk-17')

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$projectRoot = Split-Path -Parent $PSScriptRoot
$sdkRoot = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$env:ANDROID_AVD_HOME = Join-Path $env:USERPROFILE '.android\avd'
New-Item -ItemType Directory -Force -Path $env:ANDROID_AVD_HOME | Out-Null
$env:JAVA_HOME = $JavaHome
$ErrorActionPreference = 'Continue'
$javaVersion = & (Join-Path $JavaHome 'bin\java.exe') -version 2>&1 | Out-String
$javaExitCode = $LASTEXITCODE
$ErrorActionPreference = 'Stop'
if ($javaExitCode -ne 0) { throw 'Unable to run Java.' }
if ($javaVersion -notmatch 'version "17(?:\.|"|-)') { throw 'This project requires JDK 17.' }
# Google's batch launcher misreads the original Java 17 release as version 17 < 170.
$env:SKIP_JDK_VERSION_CHECK = '1'
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$manager = Join-Path $sdkRoot 'cmdline-tools\latest\bin\sdkmanager.bat'
if (!(Test-Path -LiteralPath $manager)) {
    $archive = Join-Path $env:TEMP 'ipongoal-commandlinetools-15859902.zip'
    $staging = Join-Path $env:TEMP ('ipongoal-android-tools-' + [guid]::NewGuid().ToString('N'))
    Write-Host 'Downloading Android command-line tools...'
    & curl.exe --fail --location --retry 3 --output $archive 'https://dl.google.com/android/repository/commandlinetools-win-15859902_latest.zip'
    if ($LASTEXITCODE -ne 0) { throw 'Command-line tools download failed.' }
    if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne '90ae805d20434428bffcb699c290860f19bb5f66a67e6b330067e3de801fb04a') { throw 'Command-line tools checksum mismatch.' }
    Expand-Archive -LiteralPath $archive -DestinationPath $staging
    New-Item -ItemType Directory -Force -Path (Join-Path $sdkRoot 'cmdline-tools') | Out-Null
    Move-Item -LiteralPath (Join-Path $staging 'cmdline-tools') -Destination (Join-Path $sdkRoot 'cmdline-tools\latest')
}
Write-Host 'Installing SDK, emulator, native build tools, and Android 36 system image...'
$licenseLog = Join-Path $env:TEMP 'ipongoal-sdk-licenses.log'
1..30 | ForEach-Object { 'y' } | & $manager "--sdk_root=$sdkRoot" '--licenses' > $licenseLog
if ($LASTEXITCODE -ne 0) { throw 'SDK license setup failed.' }
& $manager "--sdk_root=$sdkRoot" 'platform-tools' 'platforms;android-36' 'build-tools;36.0.0' 'ndk;27.1.12297006' 'cmake;3.30.5' 'emulator' 'system-images;android-36;google_apis;x86_64'
if ($LASTEXITCODE -ne 0) { throw 'SDK package installation failed.' }
$emulator = Join-Path $sdkRoot 'emulator\emulator.exe'
$avds = & $emulator -list-avds
if ($avds -notcontains 'IponGoal_API_36') {
    'no' | & (Join-Path $sdkRoot 'cmdline-tools\latest\bin\avdmanager.bat') create avd --name IponGoal_API_36 --package 'system-images;android-36;google_apis;x86_64' --device pixel
    if ($LASTEXITCODE -ne 0) { throw 'AVD creation failed.' }
}
[Environment]::SetEnvironmentVariable('ANDROID_HOME', $sdkRoot, 'User')
[Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT', $sdkRoot, 'User')
[Environment]::SetEnvironmentVariable('ANDROID_AVD_HOME', $env:ANDROID_AVD_HOME, 'User')
[Environment]::SetEnvironmentVariable('JAVA_HOME', $env:JAVA_HOME, 'User')
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
$entries = @($userPath -split ';' | Where-Object { $_ })
foreach ($entry in @("$sdkRoot\platform-tools", "$sdkRoot\emulator", "$sdkRoot\cmdline-tools\latest\bin", "$env:JAVA_HOME\bin")) {
    if ($entries -notcontains $entry) { $entries += $entry }
}
[Environment]::SetEnvironmentVariable('Path', ($entries -join ';'), 'User')
$sdkProperty = $sdkRoot.Replace('\', '/')
Set-Content -LiteralPath (Join-Path $projectRoot 'android\local.properties') -Value "sdk.dir=$sdkProperty" -Encoding ASCII
& $emulator -list-avds
& $emulator -accel-check
Write-Host 'Android command-line setup complete. Open a new terminal for updated environment variables.'

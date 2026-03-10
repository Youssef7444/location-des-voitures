param(
  [string]$BaseUrl = "http://127.0.0.1:8000/api"
)

$ErrorActionPreference = "Stop"

function Assert($cond, $msg) {
  if (-not $cond) {
    throw $msg
  }
}

function To-JsonBody($obj) {
  return ($obj | ConvertTo-Json -Depth 12)
}

$baseHeaders = @{
  Accept = "application/json"
  "X-Requested-With" = "XMLHttpRequest"
  "Content-Type" = "application/json"
}

function Invoke-Api {
  param(
    [string]$Method,
    [string]$Path,
    [object]$Body = $null,
    [hashtable]$Headers = @{}
  )

  $uri = "$BaseUrl$Path"
  $mergedHeaders = @{}

  foreach ($k in $baseHeaders.Keys) {
    $mergedHeaders[$k] = $baseHeaders[$k]
  }

  foreach ($k in $Headers.Keys) {
    $mergedHeaders[$k] = $Headers[$k]
  }

  try {
    if ($null -eq $Body) {
      return Invoke-RestMethod -Uri $uri -Method $Method -Headers $mergedHeaders
    }

    return Invoke-RestMethod -Uri $uri -Method $Method -Headers $mergedHeaders -Body (To-JsonBody $Body)
  }
  catch {
    $resp = $_.Exception.Response

    if ($resp) {
      $statusCode = 0
      try { $statusCode = [int]$resp.StatusCode } catch {}

      $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
      $raw = $reader.ReadToEnd()
      $reader.Close()

      $message = $null

      try {
        $parsed = $raw | ConvertFrom-Json
        $message = $parsed.message

        if (-not $message -and $parsed.errors) {
          $message = ($parsed.errors | ConvertTo-Json -Depth 6)
        }
      }
      catch {
        $message = $raw
      }

      if (-not $message) {
        $message = "Unknown error"
      }

      if ($message.Length -gt 350) {
        $message = $message.Substring(0, 350) + "..."
      }

      throw "ERROR [$Method $Path] => HTTP $statusCode $message"
    }

    throw $_
  }
}

function Login([string]$email, [string]$password) {
  $res = Invoke-Api -Method "POST" -Path "/auth/login" -Body @{
    email = $email
    password = $password
  }

  Assert ($res.token) "Token missing for $email"
  return $res.token
}

function AuthHeader([string]$token) {
  return @{ Authorization = "Bearer $token" }
}

$stamp = Get-Date -Format "yyyyMMddHHmmss"
$rand = Get-Random -Minimum 100 -Maximum 999
$suffix = "$stamp$rand"

$adminEmail = "admin_$suffix@test.com"
$companyEmail = "company_$suffix@test.com"
$clientEmail = "client_$suffix@test.com"
$password = "password123"

Write-Host "1) Health check..."
$apiRoot = $BaseUrl -replace "/api$", ""
$apiReachable = $false

try {
  Invoke-RestMethod -Uri "$apiRoot/health" -Method GET -Headers @{ Accept = "application/json" } -TimeoutSec 5 | Out-Null
  $apiReachable = $true
  Write-Host "Health OK"
}
catch {
  try {
    Invoke-RestMethod -Uri "$BaseUrl/cars?per_page=1" -Method GET -Headers @{ Accept = "application/json" } -TimeoutSec 5 | Out-Null
    $apiReachable = $true
    Write-Host "API reachable (health endpoint not available)."
  }
  catch {
    throw "API unreachable at $BaseUrl. Start backend first: cd .\backend ; php artisan serve --host=127.0.0.1 --port=8000. If you use another port, run script with -BaseUrl."
  }
}

Write-Host "2) Register users..."
$adminReg = Invoke-Api -Method "POST" -Path "/auth/register" -Body @{
  name = "Admin Demo"
  email = $adminEmail
  password = $password
  password_confirmation = $password
  role = "admin"
}

$companyReg = Invoke-Api -Method "POST" -Path "/auth/register" -Body @{
  name = "Company Demo"
  email = $companyEmail
  password = $password
  password_confirmation = $password
  role = "company"
}

$clientReg = Invoke-Api -Method "POST" -Path "/auth/register" -Body @{
  name = "Client Demo"
  email = $clientEmail
  password = $password
  password_confirmation = $password
  role = "client"
}

$adminUserId = $adminReg.user.id
$companyUserId = $companyReg.user.id
$clientUserId = $clientReg.user.id

Assert ($adminUserId -and $companyUserId -and $clientUserId) "Missing user ids after register"

Write-Host "3) Login users..."
$adminToken = Login -email $adminEmail -password $password
$companyToken = Login -email $companyEmail -password $password
$clientToken = Login -email $clientEmail -password $password

Write-Host "4) /api/user/profile..."
$profile = Invoke-Api -Method "GET" -Path "/user/profile" -Headers (AuthHeader $clientToken)
Assert ($profile.id -eq $clientUserId) "Profile id mismatch"

Write-Host "5) Admin creates category + company profile..."
$categoryName = "DemoCat_$suffix"
$category = Invoke-Api -Method "POST" -Path "/admin/categories" -Body @{
  name = $categoryName
  description = "Demo category"
  icon = "icon.png"
} -Headers (AuthHeader $adminToken)

$categoryId = $category.category.id
Assert ($categoryId) "Category ID missing"

$company = Invoke-Api -Method "POST" -Path "/admin/companies" -Body @{
  user_id = $companyUserId
  name = "Demo Company $suffix"
  address = "Casablanca"
  city = "Casablanca"
  description = "Demo company profile"
  status = "approved"
} -Headers (AuthHeader $adminToken)

$companyId = $company.company.id
Assert ($companyId) "Company ID missing"

Write-Host "6) Company creates car..."
$brand = "DemoBrand_$suffix"
$licensePlate = "DM-$suffix"

$car = Invoke-Api -Method "POST" -Path "/company/cars" -Body @{
  company_id = $companyId
  category_id = $categoryId
  brand = $brand
  model = "DemoModel"
  year = [int](Get-Date).Year
  color = "white"
  license_plate = $licensePlate
  mileage = 1000
  fuel_type = "gasoline"
  transmission = "manual"
  seats = 5
  doors = 4
  price_per_day = 300
  discount_percent = 0
  available = $true
  description = "Demo car"
} -Headers (AuthHeader $companyToken)

$carId = $car.car.id
Assert ($carId) "Car ID missing"
Write-Host "carId cree: $carId"

Write-Host "7) Public cars + cars/search..."
$cars = Invoke-Api -Method "GET" -Path "/cars?per_page=5"
Assert (($cars.data | Measure-Object).Count -ge 1) "cars endpoint returned no data"

$search = Invoke-Api -Method "GET" -Path "/cars/search?query=$licensePlate&per_page=20"
$searchIds = @($search.data | ForEach-Object { $_.id })
Write-Host ("IDs retournes par search: " + ($searchIds -join ", "))
Assert ($searchIds -contains $carId) "cars/search did not return created car"

Write-Host "8) Client creates reservation..."
$startDate = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
$endDate = (Get-Date).AddDays(3).ToString("yyyy-MM-dd")

$reservation = Invoke-Api -Method "POST" -Path "/reservations" -Body @{
  user_id = $clientUserId
  car_id = $carId
  start_date = $startDate
  end_date = $endDate
  total_days = 2
  total_price = 600
  status = "pending"
  payment_method = "cash"
  payment_status = "pending"
} -Headers (AuthHeader $clientToken)

$reservationId = $reservation.reservation.id
Assert ($reservationId) "Reservation ID missing"

Write-Host "9) /api/user/reservations..."
$userReservations = Invoke-Api -Method "GET" -Path "/user/reservations" -Headers (AuthHeader $clientToken)
$userReservationIds = @($userReservations.data | ForEach-Object { $_.id })
Assert ($userReservationIds -contains $reservationId) "user/reservations does not contain created reservation"

Write-Host "10) Client creates review + public car reviews..."
$review = Invoke-Api -Method "POST" -Path "/reviews" -Body @{
  user_id = $clientUserId
  car_id = $carId
  reservation_id = $reservationId
  rating = 5
  comment = "Excellent"
} -Headers (AuthHeader $clientToken)

$reviewId = $review.review.id
Assert ($reviewId) "Review ID missing"

$carReviews = Invoke-Api -Method "GET" -Path "/cars/$carId/reviews"
$carReviewIds = @($carReviews.data | ForEach-Object { $_.id })
Assert ($carReviewIds -contains $reviewId) "cars/{id}/reviews does not contain created review"

Write-Host "11) Client creates completed payment..."
$payment = Invoke-Api -Method "POST" -Path "/payments" -Body @{
  reservation_id = $reservationId
  amount = 600
  payment_method = "cash"
  transaction_id = "TXN-$suffix"
  status = "completed"
} -Headers (AuthHeader $clientToken)

$paymentId = $payment.payment.id
Assert ($paymentId) "Payment ID missing"

Write-Host "12) /api/company/stats..."
$stats = Invoke-Api -Method "GET" -Path "/company/stats" -Headers (AuthHeader $companyToken)
Assert ($stats.scope -eq "company") "company/stats scope is not company"
Assert ([int]$stats.total_payments -ge 1) "company/stats total_payments < 1"
Assert ([decimal]$stats.total_revenue -ge 600) "company/stats total_revenue < 600"

Write-Host ""
Write-Host "DEMO READY CHECK: PASS" -ForegroundColor Green
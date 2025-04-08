@echo off
echo Creating directory structure for RFP Management System...

:: Create root directory
mkdir rfp-management-system
cd rfp-management-system

:: Create public directory
mkdir public
mkdir public\assets
mkdir public\assets\images

:: Create src directory and its subdirectories
mkdir src
mkdir src\api
mkdir src\components
mkdir src\hooks
mkdir src\pages
mkdir src\store
mkdir src\utils
mkdir src\types
mkdir src\styles

:: Create component subdirectories
mkdir src\components\common
mkdir src\components\common\Button
mkdir src\components\common\Card
mkdir src\components\common\Dropdown
mkdir src\components\common\Modal
mkdir src\components\common\Notification
mkdir src\components\common\Spinner
mkdir src\components\common\Tooltip

mkdir src\components\documents
mkdir src\components\documents\DocumentCard
mkdir src\components\documents\DocumentGrid
mkdir src\components\documents\DocumentList
mkdir src\components\documents\DocumentPreview
mkdir src\components\documents\DocumentUpload
mkdir src\components\documents\VersionHistory

mkdir src\components\search
mkdir src\components\search\FilterPanel
mkdir src\components\search\SearchBar
mkdir src\components\search\SearchResults
mkdir src\components\search\SavedSearches

mkdir src\components\analytics
mkdir src\components\analytics\AnalyticsCard
mkdir src\components\analytics\BarChart
mkdir src\components\analytics\LineChart
mkdir src\components\analytics\PieChart
mkdir src\components\analytics\DataTable

mkdir src\components\layout
mkdir src\components\layout\AppLayout
mkdir src\components\layout\Sidebar
mkdir src\components\layout\Header
mkdir src\components\layout\Footer
mkdir src\components\layout\PageHeader
mkdir src\components\layout\ContentCard

mkdir src\components\auth
mkdir src\components\auth\LoginForm
mkdir src\components\auth\SignupForm
mkdir src\components\auth\ProfileMenu

:: Create API subdirectories
mkdir src\api\client
mkdir src\api\documents
mkdir src\api\search
mkdir src\api\analytics
mkdir src\api\users
mkdir src\api\taxonomy

:: Create store subdirectories
mkdir src\store\slices
mkdir src\store\queries

:: Create pages subdirectories
mkdir src\pages\Dashboard
mkdir src\pages\Documents
mkdir src\pages\Search
mkdir src\pages\Analytics
mkdir src\pages\Admin
mkdir src\pages\Settings
mkdir src\pages\Auth

:: Create types subdirectories
mkdir src\types\document
mkdir src\types\user
mkdir src\types\search
mkdir src\types\analytics

echo.
echo Directory structure created successfully!
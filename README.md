# Somerville Crash Analysis Dashboard

A comprehensive traffic incident data management system for analyzing crash data in Somerville. This application provides a modern web interface for loading, viewing, and managing traffic incident records.

## Features

- **Data Import**: Load traffic incident data from CSV files into the system
- **Incident Viewer**: Browse and search through incident records with pagination
- **Metrics Dashboard**: View comprehensive statistics after data import
- **Responsive Design**: Modern, mobile-friendly interface built with React and Tailwind CSS

## Tech Stack

- **Backend**: Laravel (PHP)
- **Frontend**: React with Tailwind CSS
- **Database**: MySQL/PostgreSQL (configurable)
- **Icons**: Lucide React

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **PHP** >= 8.1
- **Composer** (PHP dependency manager)
- **Node.js** >= 16.x and npm
- **MySQL** or **PostgreSQL** database server

### Installing PHP

**macOS (using Homebrew):**
```bash
brew install php@8.1
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install php8.1 php8.1-cli php8.1-mbstring php8.1-xml php8.1-mysql php8.1-pgsql
```

**Windows:**
Download from [windows.php.net](https://windows.php.net/download/)

### Installing Composer

**macOS/Linux:**
```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

**Windows:**
Download the installer from [getcomposer.org](https://getcomposer.org/download/)

Verify installation:
```bash
composer --version
```

### Installing Node.js

Download from [nodejs.org](https://nodejs.org/) or use a version manager like nvm:

```bash
# Using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 16
nvm use 16
```

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd somerville-crash-analysis
```

### 2. Install PHP Dependencies

```bash
composer install
```

This will install all required Laravel packages and dependencies.

### 3. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit the `.env` file with your database credentials:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=somerville_crash_db
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

### 4. Bootstrap the Application

Run the setup command to initialize the application:

```bash
composer run setup
```

This command will:
- Generate the application key
- Run database migrations
- Seed initial data (if applicable)
- Clear and optimize caches

### 5. Install Frontend Dependencies

```bash
npm install
```

## Running the Application

### Development Server

To start the development server with hot-reloading:

```bash
composer run dev
```

This command will:
- Start the Laravel development server (typically on `http://localhost:8000`)
- Start the Vite development server for frontend assets
- Enable hot module replacement for frontend changes

The application should now be accessible at `http://localhost:8000`

### Alternative: Run Services Separately

If you prefer to run the backend and frontend separately:

**Terminal 1 - Laravel Backend:**
```bash
php artisan serve
```

**Terminal 2 - Vite Frontend:**
```bash
npm run dev
```

## Usage

### Loading Data

1. Navigate to the **Load Data** tab in the dashboard
2. Click the **Load Data** button
3. The system will process and import all traffic incident records
4. Upon completion, you'll see metrics showing:
   - Number of light conditions
   - Number of weather conditions
   - Number of road surfaces
   - Number of traffic control devices
   - Number of intersection types
   - Number of road types
   - Number of collision types
   - Number of event locations
   - Total number of incidents loaded

### Viewing Incidents

1. Navigate to the **View Incidents** tab
2. Browse through the paginated incident records (20 per page)
3. Use the pagination controls to navigate between pages
4. Click **Refresh** to reload the latest data

## API Endpoints

### Load Data
```
POST /api/v1/load
```
Processes and imports traffic incident data into the system.

**Response:**
```json
{
    "success": true,
    "message": "Data loaded successfully",
    "counts": {
        "light_conditions": 7,
        "weather_conditions": 9,
        "road_surfaces": 9,
        "traffic_control_devices": 8,
        "intersection_types": 9,
        "road_types": 5,
        "collision_types": 8,
        "event_locations": 7,
        "incidents": 1000
    }
}
```

### Get Incidents
```
GET /api/v1/incidents
```
Retrieves all incident records from the database.

**Response:**
```json
{
    "success": true,
    "data": [...]
}
```

## Project Structure

```
somerville-crash-analysis/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       └── Api/
│   ├── Models/
│   └── Services/
├── database/
│   ├── migrations/
│   └── seeders/
├── resources/
│   ├── js/
│   │   ├── components/
│   │   │   └── SomervilleCrashDashboard.jsx
│   │   └── app.jsx
│   └── views/
├── routes/
│   ├── api.php
│   └── web.php
├── public/
├── composer.json
├── package.json
└── README.md
```

## Development

### Running Tests

```bash
php artisan test
```

### Code Style

Format PHP code:
```bash
./vendor/bin/pint
```

Format JavaScript/React code:
```bash
npm run lint
```

### Database Migrations

Create a new migration:
```bash
php artisan make:migration create_incidents_table
```

Run migrations:
```bash
php artisan migrate
```

Rollback migrations:
```bash
php artisan migrate:rollback
```

## Troubleshooting

### Port Already in Use

If port 8000 is already in use, specify a different port:
```bash
php artisan serve --port=8080
```

### Permission Issues

If you encounter permission errors:
```bash
chmod -R 775 storage bootstrap/cache
```

### Database Connection Failed

Ensure your database server is running and credentials in `.env` are correct:
```bash
# MySQL
mysql -u your_username -p

# PostgreSQL
psql -U your_username
```

### Composer Memory Issues

If composer runs out of memory:
```bash
COMPOSER_MEMORY_LIMIT=-1 composer install
```

## Production Deployment

### Build Frontend Assets

```bash
npm run build
```

### Optimize Laravel

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Set Permissions

```bash
chmod -R 755 storage bootstrap/cache
```

### Configure Web Server

Ensure your web server (Apache/Nginx) points to the `public` directory.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or contributions, please open an issue on the repository.

## Acknowledgments

- Traffic incident data provided by Somerville Department of Transportation
- Built with Laravel, React, and Tailwind CSS
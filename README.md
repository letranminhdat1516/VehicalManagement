# Vehicle Rental Management System

A full-stack vehicle rental management system built with Next.js, TypeScript, and Supabase.

## 🏗 Architecture

The project follows Clean Architecture principles with clear separation of concerns:

```
go-mall-rental/
├── app/                          # Next.js App Router pages
│   ├── login/                   # Login page
│   ├── dashboard/               # Dashboard with stats
│   ├── vehicles/                # Vehicles CRUD
│   ├── rentals/                 # Rentals management
│   └── branches/                # Branch management (Admin only)
├── src/
│   ├── types/                   # TypeScript type definitions
│   │   └── index.ts            # All interfaces and types
│   ├── services/                # Business logic layer
│   │   ├── authService.ts      # Authentication
│   │   ├── vehicleService.ts   # Vehicle operations
│   │   ├── rentalService.ts    # Rental operations
│   │   ├── branchService.ts    # Branch operations
│   │   └── statsService.ts     # Dashboard statistics
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts          # Authentication hook
│   │   ├── useVehicles.ts      # Vehicles data hook
│   │   ├── useRentals.ts       # Rentals data hook
│   │   └── useStats.ts         # Statistics hook
│   ├── components/              # Reusable UI components
│   │   ├── DashboardLayout.tsx # Main layout wrapper
│   │   ├── Navbar.tsx          # Navigation bar
│   │   └── StatsGrid.tsx       # Statistics display
│   ├── lib/                     # Third-party integrations
│   │   ├── supabaseClient.ts   # Supabase client
│   │   └── supabaseAdmin.ts    # Supabase admin client
│   └── middleware.ts            # Route protection
└── public/                      # Static assets
```

See [STRUCTURE.md](STRUCTURE.md) for detailed documentation.

## ✨ Features

### 🔐 Authentication & Authorization
- Secure login with Supabase Auth
- Role-based access control (ADMIN, GUARD)
- Protected routes with middleware
- Session management

### 📊 Dashboard
- Real-time statistics
- Total vehicles count
- Available/Rented/Maintenance status
- Rentals today/this month
- Total revenue tracking
- Role-based data filtering

### 🚗 Vehicle Management
- Full CRUD operations (Create, Read, Update, Delete)
- Vehicle types: CAR, MOTORCYCLE, TRUCK, VAN
- Status management: AVAILABLE, RENTED, MAINTENANCE
- Branch-based filtering for GUARD users
- Admin can manage all vehicles

### 📝 Rental Management
- Create new rentals
- Automatic vehicle status updates
- Complete rental with amount calculation
- Cancel rentals
- Customer information tracking
- Branch-based filtering

### 🏢 Branch Management (Admin Only)
- Create and manage branches
- Assign vehicles to branches
- Guard users restricted to their branch

## 🎯 User Roles

### ADMIN
- Full access to all features
- View all vehicles and rentals across branches
- Manage branches
- CRUD operations on vehicles
- Complete system overview

### GUARD
- Access to branch-specific data
- View vehicles in their branch
- Create and manage rentals
- Update vehicle status
- Limited to assigned branch

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd go-mall-rental
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## 🗄 Database Schema

### Tables

#### app_users
- id (uuid, primary key)
- email (text)
- full_name (text)
- role (enum: ADMIN, GUARD, USER)
- branch_id (uuid, foreign key)
- created_at, updated_at

#### vehicles
- id (uuid, primary key)
- code (text, unique)
- type (enum: CAR, MOTORCYCLE, TRUCK, VAN)
- brand, model, year
- plate_number (text)
- status (enum: AVAILABLE, RENTED, MAINTENANCE)
- branch_id (uuid, foreign key)
- daily_rate (numeric)
- created_at, updated_at

#### rentals
- id (uuid, primary key)
- vehicle_id (uuid, foreign key)
- customer_name, customer_phone, customer_id_number
- start_date, end_date
- daily_rate, total_amount
- status (enum: ACTIVE, COMPLETED, CANCELLED)
- guard_id (uuid, foreign key to app_users)
- branch_id (uuid, foreign key)
- notes (text)
- created_at, updated_at

#### branches
- id (uuid, primary key)
- name (text)
- address, phone
- created_at, updated_at

## 🔧 Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Inline CSS (can be migrated to Tailwind)
- **State Management**: React Hooks

## 📁 Code Organization

### Services Layer
All business logic is encapsulated in service files:
- Clean separation from UI components
- Reusable across the application
- Easy to test and maintain
- Consistent error handling

### Hooks Layer
Custom hooks provide:
- Data fetching and caching
- State management
- API integration
- Reusable logic

### Components Layer
UI components are:
- Modular and reusable
- Separated from business logic
- Easy to maintain and test

## 🛡 Security Features

- Role-based access control
- Protected API routes
- Client-side route guards
- Server-side authentication checks
- SQL injection prevention (via Supabase)

## 🎨 UI Features

- Responsive design
- Loading states
- Error handling
- Form validation
- Status badges with colors
- Interactive tables
- Modal forms

## 📈 Future Enhancements

- [ ] Row Level Security (RLS) policies
- [ ] Advanced filtering and search
- [ ] Pagination
- [ ] Export to Excel
- [ ] Email notifications
- [ ] Audit logs
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Mobile app
- [ ] Reports and analytics

## 📚 Documentation

- [STRUCTURE.md](STRUCTURE.md) - Detailed folder structure and architecture
- Database schema in Supabase dashboard
- API documentation in service files

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.


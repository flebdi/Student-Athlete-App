# Student Athlete App

The **Student Athlete App** is a specialized smart-scheduling platform designed to help student-athletes balance the rigorous demands of collegiate sports and academics. It acts as a central hub for managing practices, games, classes, assignments, and recovery.

## 🚀 Features

- **Unified Weekly Calendar**: Integrates academic and athletic schedules into a single, color-coded view using `react-big-calendar`.
- **Smart Auto-Scheduling**: "Find Study Time" algorithms that identify gaps between practices and classes to suggest optimal study blocks.
- **Conflict Detection**: Real-time alerts for overlapping events (e.g., a rescheduled practice conflicting with a lab).
- **Template Management**: Create reusable day templates (e.g., "Away Game Day", "Heavy Training Day") to quickly populate schedules.
- **Recovery Logic**: Context-aware recommendations for recovery based on sleep, travel, and training load.
- **Constraint-Based Settings**: User-defined rules for sleep windows, meal buffers, and travel times.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: [Prisma](https://www.prisma.io/)
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React
- **Calendar**: React Big Calendar

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL database (Local or hosted)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/flebdi/Student-Athlete-App.git
   cd Student-Athlete-App
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory and add your database connection string:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/student_athlete_db?schema=public"
   # Add NEXTAUTH_SECRET and other keys as needed
   ```

4. **Database Setup**
   Push the Prisma schema to your database:
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Run the application**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

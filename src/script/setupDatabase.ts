// scripts/setupDatabase.ts
import { connectDatabase } from '../config/database';

async function setupDatabase() {
  try {
    console.log('Setting up database...\n');

    // Connect to database
    await connectDatabase();
    console.log('✅ Database connection established');

    console.log('\nDatabase setup completed successfully!');
    console.log('Next steps:');
    console.log('1. Run: npm run init-rbac');
    console.log('2. Run: npm run test-registration');
    console.log('3. Start server: npm run dev');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

// Run the setup
setupDatabase()
  .then(() => {
    console.log('Database setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database setup failed:', error);
    process.exit(1);
  });

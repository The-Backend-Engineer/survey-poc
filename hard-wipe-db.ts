import mongoose from 'mongoose';
import { config } from 'dotenv';
import { createSpinner } from 'nanospinner';

config(); // Load environment variables

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database';

async function clearDatabase() {
  const connectSpinner = createSpinner('Connecting to database...').start();
  
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    connectSpinner.success({ text: 'Connected to database' });

    const collectionsSpinner = createSpinner('Getting all collections...').start();

      // Check if mongoose.connection and mongoose.connection.db are defined
      if (!mongoose.connection || !mongoose.connection.db) {
          throw new Error('Database connection is not established.');
      }
    
    
    // Get all collections
    const collections = await mongoose.connection.db.collections();
    collectionsSpinner.success({ text: `Found ${collections.length} collections` });

    if (collections.length === 0) {
      console.log('ℹ️  No collections to clean');
      await mongoose.connection.close();
      return;
    }

    // Drop each collection
    const dropSpinner = createSpinner('Dropping collections...').start();
    
    for (const collection of collections) {
      dropSpinner.update({ text: `Dropping collection: ${collection.collectionName}` });
      await collection.drop();
    }

    dropSpinner.success({ text: `Successfully dropped ${collections.length} collections` });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const currentSpinner = createSpinner().error({ text: `Error cleaning database: ${errorMessage}` });
    console.error('Full error:', error);
  } finally {
    // Close the connection
    if (mongoose.connection.readyState !== 0) {
      const disconnectSpinner = createSpinner('Closing database connection...').start();
      await mongoose.connection.close();
      disconnectSpinner.success({ text: 'Database connection closed' });
    }
  }
}

// Execute the cleanup
clearDatabase().then(() => {
  console.log('\n✨ Database cleanup complete');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
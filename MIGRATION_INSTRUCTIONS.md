# Database Migration Instructions

## Problem
The booking management feature requires additional columns in the database tables that don't currently exist. This is causing the "Failed to create request" error.

## Solution
Run the migration script to add the missing columns.

## Steps to Fix

### Option 1: Using MySQL Command Line
```bash
mysql -u root -p velorent < backend/config/migrate-database.sql
```

### Option 2: Using phpMyAdmin or MySQL Workbench
1. Open phpMyAdmin or MySQL Workbench
2. Select the `velorent` database
3. Go to the SQL tab
4. Copy and paste the contents of `backend/config/migrate-database.sql`
5. Execute the SQL

### Option 3: Using Node.js Script
```bash
cd backend
node -e "const mysql = require('mysql2'); const fs = require('fs'); const sql = fs.readFileSync('config/migrate-database.sql', 'utf8'); const connection = mysql.createConnection({host: 'localhost', user: 'root', password: '', database: 'velorent', multipleStatements: true}); connection.query(sql, (err) => { if(err) console.error('Error:', err.message); else console.log('Migration successful!'); connection.end(); });"
```

## What the Migration Does

1. **Adds missing columns to `requests` table:**
   - `new_start_date` - For reschedule requests
   - `new_end_date` - For reschedule requests
   - `new_rent_time` - For reschedule requests
   - `computed_fee` - Fee calculated based on policies
   - `company_response` - Response from company

2. **Updates `company_policies` table:**
   - Adds `reschedule_terms`, `cancellation_terms`, `refund_terms`
   - Adds `allow_reschedule`, `allow_cancellation`, `allow_refund`
   - Adds fee-related columns (`reschedule_free_days`, `reschedule_fee_percentage`, etc.)
   - Copies data from old column names to new ones

3. **Updates `notifications` table:**
   - Adds `type` column
   - Adds `related_request_id` and `related_booking_id` columns
   - Adds indexes for better performance

## After Migration

After running the migration:
1. Restart your backend server
2. Try submitting a request again
3. The error should be resolved

## Troubleshooting

If you get errors about columns already existing:
- The migration has already been run
- You can safely ignore those errors
- The script will continue with other changes

If you get foreign key errors:
- Make sure all referenced tables exist
- Check that the `bookings` and `companies` tables have the correct structure

## Verification

After migration, verify the tables have the correct structure:
```bash
cd backend
node check-tables.js
```

This will show you all the columns in each table.


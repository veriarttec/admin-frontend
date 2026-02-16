# Test Data for Admin Portal Feature Testing

## Database Setup Complete ✅

All test data has been successfully created in the database. You can now test the individual test report approval/rejection feature.

## Login Credentials

### Admin Portal (adminside)
- **Super Admin**: `admin@artpriv.com` / `admin123`
- **Support**: `support@artpriv.com` / `admin123`  
- **Viewer**: `viewer@artpriv.com` / `admin123`

### Banks (for reference)
- **LifeSpring Fertility Bank**: `lifespring@test.com` / `bank123`
- **Nova Reproductive Health**: `nova@test.com` / `bank123`

### Donors (for reference)
- **Karan Parashar**: `karan.parashar@test.com` / `donor123` (3 pending, 2 approved tests)
- **Priya Sharma**: `priya.sharma@test.com` / `donor123` (3 pending, 2 approved tests)
- **Amit Kumar**: `amit.kumar@test.com` / `donor123` (3 pending, 2 approved tests)

## Test Data Summary

- **3 Admins** with different role levels
- **2 Banks** (verified and subscribed)
- **3 Donors** with tests_pending=True
- **15 Test Reports** total:
  - 9 pending (ready for approval/rejection)
  - 6 already approved

## How to Test the Feature

1. **Start the Admin Backend**:
   ```bash
   cd d:\Work\adminside\backend
   uvicorn main:app --reload --port 8001
   ```

2. **Start the Admin Frontend**:
   ```bash
   cd d:\Work\adminside
   npm run dev
   ```

3. **Login to Admin Portal**:
   - Go to http://localhost:3000 (or your admin frontend port)
   - Login with: `admin@artpriv.com` / `admin123`

4. **Navigate to Test Reports**:
   - Go to Donors section
   - Click on "Karan Parashar" (or any donor)
   - Scroll to "Test Reports" section

5. **Test the Feature**:
   - Each test report shows its current status (pending/approved/rejected)
   - Pending reports have individual "Approve" and "Reject" buttons
   - Click "Approve" to approve a single test report
   - Click "Reject" to reject a single test report
   - "Approve All" and "Reject All" buttons still work for bulk operations
   - After approving/rejecting, refresh to see updated status

## Test Reports for Karan Parashar

| Test Type | Test Name | Status |
|-----------|-----------|--------|
| hiv_type_1 | HIV Type 1 Test | ⏳ Pending |
| hiv_type_2 | HIV Type 2 Test | ⏳ Pending |
| hepatitis_b | Hepatitis B Test | ⏳ Pending |
| hepatitis_c | Hepatitis C Test | ✅ Approved |
| syphilis | Syphilis Test | ✅ Approved |

## Database Connection

The backend is already configured to connect to your Supabase database:
- URL: `https://fcehapobuodabivgjoqg.supabase.co`
- Database: PostgreSQL via Supabase

## What Was Created

### Database Changes:
1. Added `status`, `reviewed_at`, `reviewed_by`, and `review_notes` columns to `test_reports` table

### Backend API Endpoints:
- `PUT /api/admin/donors/{donor_id}/tests/{report_id}/approve` - Approve individual test report
- `PUT /api/admin/donors/{donor_id}/tests/{report_id}/reject` - Reject individual test report

### Frontend Changes:
- Individual approve/reject buttons for each test report
- Status badges showing pending/approved/rejected
- Reviewer information display
- Review notes display

## Troubleshooting

If you encounter any issues:

1. **Backend won't start**: Check if port 8001 is available or if the database connection is working
2. **Can't login**: Verify you're using the correct credentials
3. **Test reports don't show**: Refresh the page after loading the donor details
4. **Buttons don't work**: Check browser console for errors and ensure backend is running

## Next Steps

After testing this feature, you can:
- Test approving all reports for a donor
- Test rejecting individual reports
- Verify that when all reports are approved, the donor's `tests_pending` flag is cleared
- Test with different admin roles (super_admin, support, viewer)

# One-Time Rating Implementation Guide

## Overview
This implementation prevents users from rating the same product or destination more than once. The system enforces this at both the client-side and database level.

## Changes Made

### 1. **RatingModal Component** (`src/components/RatingModal.tsx`)
- Added `isAlreadyRated` prop to the component
- When `isAlreadyRated` is true:
  - Shows an alert message: "You can only rate each item once"
  - Displays why rating is disabled
  - Shows a "Close" button instead of "Submit Rating"
  - Rating UI (stars and comment input) is hidden

### 2. **Rating Utilities** (`src/lib/ratingUtils.ts`) - NEW FILE
- Created two helper functions:
  - `hasUserRatedDestination(destinationId, userId)` - Checks if user has rated a destination
  - `hasUserRatedProduct(productId, userId)` - Checks if user has rated a product
- These functions query Supabase to check for existing ratings

### 3. **Updated Pages & Sections**
All the following files have been updated with the same pattern:

#### **Pages:**
- `src/pages/ProfilePage.tsx` - 3 rating implementations (destinations + products)
- `src/pages/DestinationsPage.tsx` - 2 rating implementations
- `src/pages/ProductsPage.tsx` - 2 rating implementations

#### **Sections:**
- `src/sections/homepage_topdestinationssection.tsx` - 1 rating implementation
- `src/sections/homepage_productsection.tsx` - 1 rating implementation

#### Implementation Pattern:
1. Added state variable: `const [alreadyRated, setAlreadyRated] = useState(false);`
2. Modified `onRate` handlers to be async and check for existing ratings:
   ```typescript
   onRate={async () => {
     if (!user) {
       toast.error('You must be signed in to rate.');
       return;
     }
     const hasRated = await hasUserRatedDestination(itemId, user.id);
     setAlreadyRated(hasRated);
     setRatingTarget({ id: itemId, name: itemName });
   }}
   ```
3. Added `isAlreadyRated` prop to RatingModal components

### 4. **Database Constraints** (`src/DB_TableReference/migration_one_time_ratings.sql`)
Added unique constraints to prevent duplicate ratings at the database level:
- `destination_ratings`: unique constraint on `(destination_id, user_id)`
- `product_ratings`: unique constraint on `(product_id, user_id)`

## How It Works

### User Flow:
1. User clicks "Rate" button on a product or destination
2. System checks database for existing rating from this user for this item
3. **If rating exists:**
   - Modal shows "Already Rated" message
   - Submit button is hidden
   - User can only close the modal
4. **If no rating exists:**
   - Normal rating interface is shown
   - User can select stars and write comment
   - User can submit the rating
   - After submission, the database constraint ensures no duplicates

### Error Handling:
- Database constraint prevents duplicate inserts if somehow one is submitted
- Toast notifications inform users of status
- Both client-side (UI) and database-level (constraint) protections

## Database Migration
To apply the unique constraints, run this SQL in your Supabase dashboard:

```sql
ALTER TABLE destination_ratings ADD CONSTRAINT unique_destination_ratings_per_user 
  UNIQUE (destination_id, user_id);

ALTER TABLE product_ratings ADD CONSTRAINT unique_product_ratings_per_user 
  UNIQUE (product_id, user_id);
```

## Files Modified:
1. ✅ `src/components/RatingModal.tsx` - Added UI for already-rated state
2. ✅ `src/lib/ratingUtils.ts` - NEW: Rating check utilities
3. ✅ `src/pages/ProfilePage.tsx` - Added rating checks
4. ✅ `src/pages/DestinationsPage.tsx` - Added rating checks
5. ✅ `src/pages/ProductsPage.tsx` - Added rating checks
6. ✅ `src/sections/homepage_topdestinationssection.tsx` - Added rating checks
7. ✅ `src/sections/homepage_productsection.tsx` - Added rating checks
8. ✅ `src/DB_TableReference/migration_one_time_ratings.sql` - NEW: Database constraints

## Benefits
- ✅ One rating per user per item (enforced)
- ✅ Clear user feedback when already rated
- ✅ Protection at both UI and database levels
- ✅ Prevents accidental duplicate submissions
- ✅ Improves data integrity

## Testing Checklist
- [ ] Try rating a destination - should work on first attempt
- [ ] Try rating the same destination again - should show "Already Rated" message
- [ ] Try rating different destinations - should all work
- [ ] Try rating a product - should work on first attempt
- [ ] Try rating the same product again - should show "Already Rated" message
- [ ] Try rating different products - should all work
- [ ] Test in ProfilePage, DestinationsPage, ProductsPage, and home sections
- [ ] Test database constraint by trying direct insert with duplicate (should fail)

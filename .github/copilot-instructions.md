# Copilot Instructions for intranetoficialHSL

This document guides AI agents on working effectively with this codebase.

## Project Overview

This is a React-based intranet system for HSL, built with TypeScript and Firebase. The system manages teachers, students, classes, and administrative tasks for an educational institution.

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Firebase (Authentication + Firestore)
- **State Management**: React useState + Firebase real-time listeners
- **UI Components**: Located in `/components`

### Key Components

- `App.tsx`: Main application container with auth and data management
- `components/*.tsx`: Feature-specific components (Dashboard, Schedule, etc.)
- `types.ts`: TypeScript interfaces defining core data models
- `firebaseConfig.ts`: Firebase configuration and initialization

## Data Models

Core entities (defined in `types.ts`):
- `User/Teacher`: Staff member profiles with role-based access
- `Student`: Student records with progress tracking
- `ClassEvent`: Scheduled classes and sessions
- `FinancialEntry`: Student payments and financial records
- `Notice`: Internal communications with reactions/comments

## Development Workflows

1. **Local Development**:
   ```bash
   npm install
   npm run dev
   ```

2. **Firebase Integration**:
   - Auth flows use Firebase Authentication
   - Data operations use Firestore collections matching type names
   - Real-time updates via `onSnapshot` listeners

3. **Component Patterns**:
   - Components receive data and handlers via props
   - Use TypeScript interfaces from `types.ts`
   - Mutations handled through Firebase operations

## Common Operations

### Adding New Features

1. Define types in `types.ts`
2. Create component in `/components`
3. Add route/view in `App.tsx`'s `renderActiveView`
4. Implement Firebase operations in `App.tsx`

### Data Operations

```typescript
// Collection access pattern
const collection = 'collectionName';
const q = query(collection(db, collection));
onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Update state
});

// CRUD operations
await setDoc(doc(collection(db, collection)), newItem);
await updateDoc(doc(db, collection, id), updates);
await deleteDoc(doc(db, collection, id));
```

## Best Practices

1. Always use TypeScript interfaces from `types.ts`
2. Implement real-time updates using Firebase listeners
3. Handle authentication state in component lifecycle
4. Keep Firebase operations centralized in `App.tsx`
5. Use proper role-based access control via `user.role`
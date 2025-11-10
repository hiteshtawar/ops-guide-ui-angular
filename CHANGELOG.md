# Changelog - ops-guide-ui-angular

## Updates from ops-guide-ui (React)

This document tracks the major changes ported from the React version (ops-guide-ui) to this Angular version.

### Date: November 10, 2025

## Major Changes

### 1. **API Request Format Simplification**
- **Before**: Complex request structure with `user_id`, `context`, `environment`
- **After**: Simplified to `{ query, userId, taskId? }`
- The new format is cleaner and matches the backend expectations

### 2. **Step Organization - Step Groups**
- **Before**: Steps were a flat array `Step[]`
- **After**: Steps organized into groups:
  - `prechecks`: Pre-execution validation steps
  - `procedure`: Main execution steps
  - `postchecks`: Post-execution verification steps
  - `rollback`: Rollback/recovery steps
- This provides better organization and visual separation of different phases

### 3. **Task Selector Feature** ⭐ NEW
- Added interactive task selector when classification fails (taskId === 'UNKNOWN')
- Fetches available tasks from `/api/v1/tasks` endpoint
- Displays task options with descriptions
- Allows manual task selection when AI cannot determine the intent
- UI shows original query and list of available tasks

### 4. **API Endpoints Updated**
- **Process Endpoint**: Remains `/api/v1/process` (unchanged)
- **Execute Step**: Changed from `/v1/steps/execute` to `/api/v1/execute-step`
- **New Endpoint**: `/api/v1/tasks` - Fetches available tasks

### 5. **Step Execution Request Format**
- **Before**: Complex with `requestId`, `stepIndex`, `stepName`, `extractedEntities`, etc.
- **After**: Simplified to:
  ```typescript
  {
    taskId: string
    stepNumber: number
    entities: Record<string, string | null>
    userId: string
    authToken: string
  }
  ```

### 6. **Authentication Token Updated**
- Updated to new JWT token with extended expiration
- Token includes roles: `production_support`, `support_admin`

### 7. **Enhanced Step Display**
- Steps now show HTTP method and path inline with description
- Example: "Validate order GET /api/orders/{orderId}"
- Better visual context for what each step does

### 8. **Step Group Visual Styling**
- Each step group has a colored border and header
- Groups are visually separated for better UX
- Step group headers: Pre-checks, Procedure, Post-checks, Rollback

### 9. **Auto-Execution Logic**
- Auto-executes first auto-executable step in `prechecks` group
- After successful completion, auto-executes next auto-executable step in same group
- Does not auto-jump between groups (requires manual execution)

## Files Modified

### Core Application Files
1. **src/app/models/types.ts**
   - Added `StepGroups` interface
   - Updated `ClassificationResponse.steps` to use `StepGroups`
   - Simplified `ApiRequest` interface
   - Updated `StepExecutionRequest` interface
   - Added `AvailableTask` interface

2. **src/app/services/api.service.ts**
   - Updated authentication token
   - Simplified request headers
   - Changed step execution endpoint
   - Added `getAvailableTasks()` method
   - Removed idempotency key logic

3. **src/app/app.component.ts**
   - Added task selector state management
   - Added `availableTasks`, `showTaskSelector`, `originalQuery` properties
   - Added `fetchAvailableTasks()` method
   - Added `handleTaskSelection()` method
   - Updated `onSubmit()` to handle UNKNOWN taskId
   - Updated `executeStep()` to support step groups
   - Updated `getStepId()` to include step group
   - Added `renderStepGroup()` helper method

4. **src/app/app.component.html**
   - Added task selector UI section
   - Restructured step rendering to support groups
   - Added separate sections for prechecks, procedure, postchecks, rollback
   - Updated step display to show method and path inline
   - Changed "Steps" to "Runbook Steps"

5. **src/app/app.component.css**
   - Added task selector styles (`.task-selector-*`)
   - Added step group styles (`.step-group`, `.step-group-header`)
   - Added `.step-name-with-api` styles for inline method/path display
   - Enhanced hover effects for task options

## Breaking Changes

### Backend Compatibility
- ⚠️ The new request/response formats require backend API version that supports:
  - Step groups in response
  - `/api/v1/tasks` endpoint
  - `/api/v1/execute-step` endpoint
  - Simplified request format

### Data Migration
- Any existing code that expects flat `steps` array will break
- Update to use `steps.prechecks`, `steps.procedure`, etc.

## Testing Checklist

- [ ] Test normal query classification
- [ ] Test UNKNOWN task classification (task selector appears)
- [ ] Test manual task selection from task selector
- [ ] Test step execution in prechecks group
- [ ] Test step execution in procedure group
- [ ] Test step execution in postchecks group
- [ ] Test step execution in rollback group
- [ ] Test auto-execution of steps within same group
- [ ] Test that steps don't auto-execute across groups
- [ ] Verify error handling for failed steps
- [ ] Test responsive design on mobile devices

## Rollback Plan

If issues occur, the previous version can be restored by:
1. Reverting the git commit
2. Or manually reverting each file to its previous state

## Future Enhancements

- Add ability to manually trigger step execution
- Add ability to skip steps
- Add step execution history/logs
- Add ability to retry failed steps
- Add step dependencies visualization
- Add progress indicators for long-running steps

## Notes

- All changes maintain backward compatibility with Angular 13.3
- No new dependencies added
- Uses existing RxJS patterns for async operations
- Maintains the same clean, minimalist UI design


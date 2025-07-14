// Spell-specific filter functions
// Generic functions are now available in @/components/generic-list/filterFunctions

// Note: For most spell columns, you can now use the generic functions directly:
// - createArrayIdFilter('schoolId') for schoolIds column
// - createArrayIdFilter('descriptorId') for descriptorIds column
// - createArrayIdFilter('componentId') for componentIds column
// - createArrayIdFilter('sourceBookId') for sourceBookInfo column
// - createArrayIdFilter('classId') for levelMapping column
// - createEqualsFilter() for baseLevel column
// - createContainsFilter() for name column

// If you need spell-specific filter logic in the future, add it here
export const spellFilterFns = {
    // Example of spell-specific filter (if needed):
    // customSpellFilter: (row: any, columnId: string, filterValue: any) => {
    //     // Spell-specific logic here
    // }
}; 

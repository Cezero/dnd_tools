# Documentation Status

*Status tracking for all system components based on Prisma schema models, Zod validation schemas, static data systems, backend implementations, and frontend components.*

## Component Status Overview

### **Class System**
- **Status**: ✅ Complete
- **Schema Models**: `Class`, `SpellcastingProgression`, `SpellcastingSlot`, `SpellcastingLink`, `ClassSourceMap`, `SpellLevelMap`
- **Zod Schemas**: `class.ts`, `spellcasting.ts`
- **Static Data**: `ClassData.ts`
- **Backend Files**: `backend/src/features/class/` (classService.ts, classController.ts, classRoutes.ts, types.ts)
- **Frontend Files**: `frontend/src/features/class/` (ClassEdit.tsx, ClassList.tsx, ClassDisplay.tsx, ClassApi.ts, tabs/), `frontend/src/lib/ClassProgression.ts`, `frontend/src/lib/ClassProgressionTable.tsx`
- **Description**: Character classes, spellcasting progression, and class-specific spell mappings
- **Documentation Files**: 
  - `shared/docs/class-system/README.md` - Overview and navigation
  - `shared/docs/class-system/database-schema.md` - Prisma schema documentation
  - `shared/docs/class-system/validation-schemas.md` - Zod validation schemas
  - `shared/docs/class-system/static-data.md` - Static data and enums
  - `shared/docs/class-system/backend-implementation.md` - Backend services and API
  - `shared/docs/class-system/frontend-components.md` - Frontend React components
  - `shared/docs/class-system/spellcasting-system.md` - Spellcasting mechanics
  - `shared/docs/class-system/class-progression.md` - Progression calculations
  - `shared/docs/class-system/feature-integration.md` - Feature system integration

### **Feature System**
- **Status**: ✅ Complete
- **Schema Models**: `Feature`, `FeatureProgression`, `FeatureModifier`, `FeatureFormulaParams`, `FeatureModifierCondition`, `FeatureSpecialEffect`, `FeatureChoice`, `FeaturePrerequisite`
- **Zod Schemas**: `feature.ts`
- **Static Data**: `FeatureData.ts`, `FormulaDefinitions.ts`
- **Backend Files**: `backend/src/features/featureSystem/` (featureSystemService.ts, featureSystemController.ts, featureSystemRoutes.ts, types.ts)
- **Frontend Files**: `frontend/src/components/feature-system/` (FeatureEdit.tsx, FeatureDetail.tsx, FeatureProgressionDetailEdit.tsx, FeatureSystemApi.ts)
- **Description**: Class features, racial features, feat features, and their progression
- **Documentation Files**: 
  - `shared/docs/feature-system/README.md` - Overview and navigation
  - `shared/docs/feature-system/database-schema.md` - Prisma schema documentation
  - `shared/docs/feature-system/validation-schemas.md` - Zod validation schemas
  - `shared/docs/feature-system/static-data.md` - Static data and enums
  - `shared/docs/feature-system/backend-implementation.md` - Backend services and API
  - `shared/docs/feature-system/frontend-components.md` - Frontend React components
  - `shared/docs/feature-system/formula-system.md` - Mathematical formula system

### **Spell System**
- **Status**: ❌ Not Documented
- **Schema Models**: `Spell`, `SpellDescriptorMap`, `SpellSchoolMap`, `SpellSourceMap`, `SpellSubschoolMap`, `SpellComponentMap`
- **Zod Schemas**: `spell.ts`
- **Static Data**: `SpellData.ts`
- **Backend Files**: `backend/src/features/spell/` (spellService.ts, spellController.ts, spellRoutes.ts, types.ts)
- **Frontend Files**: `frontend/src/features/spell/` (SpellEdit.tsx, SpellList.tsx, SpellDetail.tsx, SpellApi.ts), `frontend/src/components/spell-progression/` (SpellProgressionEditor.tsx, SpellSlotGrid.tsx)
- **Description**: Spell definitions, components, schools, descriptors, and source mappings

### **Skill System**
- **Status**: ✅ Complete
- **Schema Models**: `Skill`
- **Zod Schemas**: `skill.ts`
- **Static Data**: `SkillData.ts`
- **Backend Files**: `backend/src/features/skill/` (skillService.ts, skillController.ts, skillRoutes.ts, types.ts)
- **Frontend Files**: `frontend/src/features/skill/` (SkillEdit.tsx, SkillList.tsx, SkillDetail.tsx, SkillApi.ts)
- **Description**: Skill definitions and mechanics
- **Documentation Files**: 
  - `shared/docs/skill-system/README.md` - Overview and navigation
  - `shared/docs/skill-system/database-schema.md` - Prisma schema documentation
  - `shared/docs/skill-system/validation-schemas.md` - Zod validation schemas
  - `shared/docs/skill-system/static-data.md` - Static data and enums
  - `shared/docs/skill-system/backend-implementation.md` - Backend services and API
  - `shared/docs/skill-system/frontend-components.md` - Frontend React components

### **Feat System**
- **Status**: ✅ Complete
- **Schema Models**: `Feat`, `FeatBenefitMap`, `FeatPrerequisiteMap`
- **Zod Schemas**: `feat.ts`
- **Static Data**: `FeatData.ts`
- **Backend Files**: `backend/src/features/feat/` (featService.ts, featController.ts, featRoutes.ts, types.ts)
- **Frontend Files**: `frontend/src/features/feat/` (FeatEdit.tsx, FeatList.tsx, FeatDetail.tsx, FeatApi.ts, FeatPrereqEdit.tsx, FeatBenefitEdit.tsx)
- **Description**: Feat definitions, benefits, and prerequisites
- **Documentation Files**: 
  - `shared/docs/feat-system/README.md` - Overview and navigation
  - `shared/docs/feat-system/database-schema.md` - Prisma schema documentation
  - `shared/docs/feat-system/validation-schemas.md` - Zod validation schemas
  - `shared/docs/feat-system/static-data.md` - Static data and enums
  - `shared/docs/feat-system/backend-implementation.md` - Backend services and API
  - `shared/docs/feat-system/frontend-components.md` - Frontend React components

### **Race System**
- **Status**: ✅ Complete
- **Schema Models**: `Race`, `RaceSourceMap`
- **Zod Schemas**: `race.ts`
- **Static Data**: N/A
- **Backend Files**: `backend/src/features/race/` (raceService.ts, raceController.ts, raceRoutes.ts, types.ts)
- **Frontend Files**: `frontend/src/features/race/` (RaceEdit.tsx, RaceList.tsx, RaceDisplay.tsx, RaceDetail.tsx, RaceApi.ts, tabs/)
- **Description**: Race definitions and source mappings
- **Documentation Files**: 
  - `shared/docs/race-system/README.md` - Overview and navigation
  - `shared/docs/race-system/database-schema.md` - Prisma schema documentation
  - `shared/docs/race-system/validation-schemas.md` - Zod validation schemas
  - `shared/docs/race-system/static-data.md` - Static data and enums
  - `shared/docs/race-system/backend-implementation.md` - Backend services and API
  - `shared/docs/race-system/frontend-components.md` - Frontend React components
  - `shared/docs/race-system/architecture-principles.md` - System architecture and design principles

### **Equipment System**
- **Status**: 🔄 Implementation Documentation Complete
- **Schema Models**: `Item`, `ItemType`, `Armor`, `Weapon`, `ItemProperty`, `ItemPropertyAppliesTo`, `ItemPropertyIncompatibility`, `ItemTemplate`, `ItemTemplateProperty`, `CharacterItem`, `CharacterItemProperty`
- **Zod Schemas**: `item.ts`
- **Static Data**: `ItemData.ts`
- **Backend Files**: `backend/src/features/item/` (itemService.ts, itemController.ts, itemRoutes.ts, types.ts)
- **Frontend Files**: `frontend/src/features/item/` (ItemEdit.tsx, ItemList.tsx, ItemDetail.tsx, ItemApi.ts, utils.ts)
- **Description**: Items, weapons, armor, properties, and character equipment
- **Documentation Files**: 
  - `shared/docs/equipment-system/README.md` - Overview and navigation
  - `shared/docs/equipment-system/database-schema.md` - Prisma schema documentation
  - `shared/docs/equipment-system/validation-schemas.md` - Zod validation schemas
  - `shared/docs/equipment-system/static-data.md` - Static data and enums
  - `shared/docs/equipment-system/backend-implementation.md` - Backend services and API
  - `shared/docs/equipment-system/frontend-components.md` - Frontend React components
  - `shared/docs/equipment-system/documentation-improvements-plan.md` - Documentation progress tracking

### **Reference Data System**
- **Status**: ❌ Not Documented
- **Schema Models**: `SourceBook`, `ReferenceTable`, `ReferenceTableColumn`, `ReferenceTableRow`, `ReferenceTableCell`
- **Zod Schemas**: `sourcebook.ts`, `referencetables.ts`
- **Static Data**: `SourceData.ts`
- **Backend Files**: `backend/src/features/referencetables/` (referenceTableService.ts, referenceTableController.ts, referenceTableRoutes.ts, types.ts)
- **Frontend Files**: `frontend/src/features/admin/features/reference-table-management/`
- **Description**: Source books, reference tables, and static game data

### **Character Management System**
- **Status**: ✅ Complete
- **Schema Models**: `UserCharacter`, `UserCharacterAbilityScore`, `CharacterAdvancement`, `AdvancementSkill`, `AdvancementFeat`, `AdvancementSpell`, `CharacterFeatureChoice`, `CharacterSpellPreparation`, `SpellPreparationMetamagic`
- **Zod Schemas**: `character.ts`
- **Static Data**: `AbilityScoreData.ts`, `AlignmentData.ts`, `CharacterTypeData.ts`, `ProgressionTypeData.ts`
- **Backend Files**: `backend/src/features/character/` (characterService.ts, characterController.ts, characterRoutes.ts, types.ts)
- **Frontend Files**: `frontend/src/features/character/` (CharacterEdit.tsx, CharacterList.tsx, CharacterApi.ts, tabs/), `frontend/src/lib/characterUtils.ts`
- **Description**: Character data, advancement, skills, feats, spells, and choices
- **Documentation Files**: 
  - `shared/docs/character-management/README.md` - Overview and navigation
  - `shared/docs/character-management/database-schema.md` - Prisma schema documentation
  - `shared/docs/character-management/validation-schemas.md` - Zod validation schemas
  - `shared/docs/character-management/static-data.md` - Static data and enums
  - `shared/docs/character-management/backend-implementation.md` - Backend services and API
  - `shared/docs/character-management/frontend-components.md` - Frontend React components

### **Character Calculation System**
- **Status**: ❌ Not Documented
- **Schema Models**: N/A (Uses existing character models)
- **Zod Schemas**: N/A
- **Static Data**: N/A
- **Backend Files**: `backend/src/features/characterCalculation/` (characterCalculationService.ts, characterCalculationController.ts, characterCalculationRoutes.ts)
- **Frontend Files**: N/A (Calculations handled in character tabs and lib utilities)
- **Description**: Character calculations, modifiers, and derived statistics

### **Authentication System**
- **Status**: ✅ Complete
- **Schema Models**: `User`
- **Zod Schemas**: `auth.ts`
- **Static Data**: N/A
- **Backend Files**: `backend/src/features/auth/` (authService.ts, authController.ts, authRoutes.ts, types.ts)
- **Frontend Files**: `frontend/src/components/auth/` (AuthProvider.tsx, LoginPage.tsx, RegisterPage.tsx, AuthApi.ts, ProtectedRoute.tsx)
- **Description**: User authentication, registration, login, JWT tokens, and authorization
- **Documentation Files**: 
  - `shared/docs/user-management/README.md` - Overview and navigation
  - `shared/docs/user-management/database-schema.md` - Prisma schema documentation
  - `shared/docs/user-management/validation-schemas.md` - Zod validation schemas
  - `shared/docs/user-management/backend-implementation.md` - Backend services and API
  - `shared/docs/user-management/frontend-components.md` - Frontend React components

### **User Profile System**
- **Status**: ✅ Complete
- **Schema Models**: `User` (profile-related fields)
- **Zod Schemas**: `auth.ts` (UserProfileSchema)
- **Static Data**: N/A
- **Backend Files**: `backend/src/features/userProfile/` (userProfileService.ts, userProfileController.ts, userProfileRoutes.ts, types.ts)
- **Frontend Files**: `frontend/src/components/profile/` (ProfilePage.tsx, UserProfileApi.ts)
- **Description**: User profile management, preferences, and settings
- **Documentation Files**: 
  - `shared/docs/user-management/README.md` - Overview and navigation
  - `shared/docs/user-management/database-schema.md` - Prisma schema documentation
  - `shared/docs/user-management/validation-schemas.md` - Zod validation schemas
  - `shared/docs/user-management/backend-implementation.md` - Backend services and API
  - `shared/docs/user-management/frontend-components.md` - Frontend React components

### **Dice Configuration System**
- **Status**: ❌ Not Documented
- **Schema Models**: `DiceBoxAdminConfig`, `UserDiceConfigOverride`
- **Zod Schemas**: `diceBox.ts`
- **Static Data**: `DiceData.ts`
- **Backend Files**: `backend/src/features/diceBox/` (diceBoxService.ts, diceBoxController.ts, diceBoxRoutes.ts, types.ts)
- **Frontend Files**: `frontend/src/components/dice-box/` (DiceBoxProvider.tsx, DiceBoxManager.ts, DiceButton.tsx, DiceResultRenderer.tsx, DiceBoxService.ts, types.ts), `frontend/src/features/admin/features/dice-configuration/`, `frontend/src/features/admin/features/dice-testing/`
- **Description**: Dice physics configuration, user preferences, and dice theme settings

### **Ability Score System**
- **Status**: ❌ Not Documented
- **Schema Models**: N/A (Referenced in UserCharacterAbilityScore)
- **Zod Schemas**: N/A
- **Static Data**: `AbilityData.ts`
- **Backend Files**: N/A (Calculations handled in characterCalculation feature)
- **Frontend Files**: N/A (Handled in character tabs and lib utilities)
- **Description**: Ability scores, modifiers, point buy calculations, and saving throws

### **Common Game Data System**
- **Status**: ❌ Not Documented
- **Schema Models**: N/A (Reference data)
- **Zod Schemas**: N/A
- **Static Data**: `CommonData.ts`
- **Backend Files**: N/A (Reference data only)
- **Frontend Files**: N/A (Used throughout frontend components)
- **Description**: RPG dice, currency, alignments, sizes, languages, editions, and casting types

### **Formatting System**
- **Status**: ❌ Not Documented
- **Schema Models**: N/A (Display and formatting utilities)
- **Zod Schemas**: N/A
- **Static Data**: `FormatterData.ts`
- **Backend Files**: N/A (Frontend utilities only)
- **Frontend Files**: `frontend/src/lib/formatters/` (formatter-registry.ts, display-strategies.ts, calculators.ts, grouping-strategies.ts, progression-generators.ts), `frontend/src/lib/formatterUtils.ts`
- **Description**: Display types, breakdown components, transition points, and formatting utilities

### **Common Validation System**
- **Status**: ❌ Not Documented
- **Schema Models**: N/A (Utility schemas)
- **Zod Schemas**: `common.ts`, `query.ts`
- **Static Data**: N/A
- **Backend Files**: N/A (Shared validation utilities)
- **Frontend Files**: `frontend/src/hooks/useZodValidation.ts`
- **Description**: Common validation patterns, schema builders, pagination, and query transformations

### **Utility System**
- **Status**: ❌ Not Documented
- **Schema Models**: N/A (Utility functions)
- **Zod Schemas**: N/A
- **Static Data**: `GenericList.ts`, `types.ts`
- **Backend Files**: N/A (Frontend utilities only)
- **Frontend Files**: `frontend/src/utils/` (color-scheme.ts, formulaParamUtils.ts, colors.ts)
- **Description**: Generic utilities, type definitions, pagination limits, and filter types

## Frontend-Specific Systems

### **Dice Box System**
- **Status**: ✅ Fully Documented
- **Documentation**: `shared/docs/dice-box-system/` (README.md, database-schema.md, validation-schemas.md, static-data.md, backend-implementation.md, frontend-components.md, admin-interface.md)
- **Frontend Files**: `frontend/src/components/dice-box/` (DiceBoxProvider.tsx, DiceBoxManager.ts, DiceButton.tsx, DiceResultRenderer.tsx, DiceBoxService.ts, types.ts)
- **Backend Files**: `backend/src/features/diceBox/` (diceBoxController.ts, diceBoxService.ts, diceBoxRoutes.ts)
- **Database Models**: `backend/prisma/schema.prisma` (DiceBoxAdminConfig, UserDiceConfigOverride)
- **Description**: 3D dice rolling interface, physics simulation, theme management, and dice result display

### **Generic List System**
- **Status**: ❌ Not Documented
- **Frontend Files**: `frontend/src/components/generic-list/` (GenericList.tsx, ListSelectionDialog.tsx, ColumnHeaderContextMenu.tsx, FilterSubmenu.tsx, usePersistantTableState.tsx, types.ts)
- **Description**: Reusable data table component with filtering, sorting, column management, and persistent state

### **Log Panel System**
- **Status**: ✅ Fully Documented
- **Documentation**: `shared/docs/application-overview/log-panel.md` - Global logging system component
- **Frontend Files**: `frontend/src/components/log-panel/` (LogPanel.tsx, LogPanelProvider.tsx, LogEntry.tsx, LogPanelHooks.ts, types.ts)
- **Description**: Application logging interface, log entry display, and log management utilities

### **Form System**
- **Status**: ❌ Not Documented
- **Frontend Files**: `frontend/src/components/forms/` (ValidatedForm.tsx, FormComponents.tsx, ValidatedFormHooks.ts, SliderControl.tsx)
- **Description**: Form validation, form components, and form state management with Zod integration

### **Navigation System**
- **Status**: ❌ Not Documented
- **Frontend Files**: `frontend/src/components/sidebar/` (MainSidebar.tsx), `frontend/src/components/navbar/` (NavBar.tsx, themeToggle.tsx)
- **Description**: Application navigation, sidebar menu, navbar, and theme switching

### **Toast Notification System**
- **Status**: ✅ Fully Documented
- **Documentation**: `shared/docs/application-overview/toast.md` - Global notification system component
- **Frontend Files**: `frontend/src/components/toast/` (ToastProvider.tsx, GenericToast.tsx, useToast.ts)
- **Description**: User notification system, toast messages, and notification management

### **Markdown System**
- **Status**: ❌ Not Documented
- **Frontend Files**: `frontend/src/components/markdown/` (MarkdownEditor.tsx, ProcessMarkdown.tsx, types.ts)
- **Description**: Markdown rendering, editing, and processing utilities

### **Widget System**
- **Status**: ❌ Not Documented
- **Frontend Files**: `frontend/src/components/widgets/` (ColorPicker.tsx)
- **Description**: Reusable UI widgets and specialized input components

### **Admin System**
- **Status**: ❌ Not Documented
- **Frontend Files**: `frontend/src/features/admin/` (AdminConfig.ts, AdminDashboardPage.tsx, features/dice-configuration/, features/reference-table-management/, features/feature-system/, features/dice-testing/)
- **Description**: Administrative interface, configuration management, and system administration tools

### **API Service System**
- **Status**: ❌ Not Documented
- **Frontend Files**: `frontend/src/services/` (Api.ts, types.ts)
- **Description**: HTTP client, API service layer, and request/response handling

### **Language Service System**
- **Status**: ❌ Not Documented
- **Frontend Files**: `frontend/src/lib/LanguageService.ts`
- **Description**: Character language management based on race and class features, automatic language grants, bonus language calculations, and language choice systems

### **Table Resolution System**
- **Status**: ❌ Not Documented
- **Frontend Files**: `frontend/src/lib/TableResolution.ts`
- **Description**: Reference table data resolution and table lookup utilities

### **Error Boundary System**
- **Status**: ❌ Not Documented
- **Frontend Files**: `frontend/src/lib/ErrorBoundary.tsx`
- **Description**: React error boundaries, error handling, and error recovery

## Backend Infrastructure Systems

### **Validated Router System**
- **Status**: ❌ Not Documented
- **Backend Files**: `backend/src/lib/buildValidatedRouter.ts`, `backend/src/lib/types.ts`
- **Description**: Type-safe Express router with Zod validation for params, query, body, and headers

### **Authentication Middleware System**
- **Status**: ❌ Not Documented
- **Backend Files**: `backend/src/middleware/authMiddleware.ts`, `backend/src/middleware/requireAuthExcept.ts`, `backend/src/middleware/types.ts`
- **Description**: JWT authentication middleware, admin authorization, and flexible auth requirements

### **Error Handling System**
- **Status**: ❌ Not Documented
- **Backend Files**: `backend/src/middleware/errorMiddleware.ts`, `backend/src/errors/` (BaseError.ts, UnauthorizedError.ts, ForbiddenError.ts)
- **Description**: Centralized error handling, custom error classes, and error response formatting

### **Configuration Management System**
- **Status**: ❌ Not Documented
- **Backend Files**: `backend/src/config/index.ts`, `backend/src/config/README.md`
- **Description**: Environment variable validation, application configuration, and startup validation

### **Validated Types System**
- **Status**: ❌ Not Documented
- **Backend Files**: `backend/src/util/validated-types.ts`
- **Description**: TypeScript utility types for Zod-validated Express requests (params, query, body combinations)

### **Formula Parameter Transformation System**
- **Status**: ❌ Not Documented
- **Backend Files**: `backend/src/utils/formulaParamTransformers.ts`
- **Description**: Database-to-application data transformation for formula parameters (arrays ↔ strings)

### **Authentication Library System**
- **Status**: ❌ Not Documented
- **Backend Files**: `backend/src/lib/auth.ts`
- **Description**: Authentication utility functions and JWT token management

## Documentation Status Legend

- ❌ **Not Documented**: No documentation exists
- 🔄 **In Progress**: Documentation partially complete
- ✅ **Complete**: Full documentation with schema, validation, and examples
- 📝 **Needs Update**: Documentation exists but needs revision

## Component Categories

### **Core Game Systems**
- Class System
- Feature System
- Spell System
- Skill System
- Feat System
- Race System
- Equipment System
- Ability Score System

### **Data Management Systems**
- Reference Data System
- Character Management System
- Character Calculation System
- Common Game Data System

### **User Interface Systems**
- Authentication System
- User Profile System
- Dice Configuration System
- Formatting System

### **Utility Systems**
- Common Validation System
- Utility System

### **Frontend-Specific Systems**
- Dice Box System
- Generic List System
- Log Panel System
- Form System
- Navigation System
- Toast Notification System
- Markdown System
- Widget System
- Admin System
- API Service System
- Language Service System
- Table Resolution System
- Error Boundary System

### **Backend Infrastructure Systems**
- Validated Router System
- Authentication Middleware System
- Error Handling System
- Configuration Management System
- Validated Types System
- Formula Parameter Transformation System
- Authentication Library System

## Next Steps

1. **Prioritize Components**: Determine which components to document first
2. **Create Structure**: Establish consistent documentation format for each component
3. **Schema Documentation**: Document Prisma models and relationships
4. **Validation Rules**: Document business logic and validation
5. **API Documentation**: Document endpoints and usage
6. **Examples**: Provide practical usage examples
7. **Integration**: Document cross-component relationships

## Notes

- All components are based on actual Prisma schema models, Zod validation schemas, static data systems, backend implementations, and frontend components
- Each component may have multiple related models, schemas, data files, backend services, and frontend components
- Cross-component relationships need to be documented
- Static data integration should be included where relevant
- Common validation patterns are shared across multiple components
- Some systems exist primarily in static data without corresponding database models
- Backend features follow consistent patterns: Service, Controller, Routes, and Types files
- Backend infrastructure systems provide foundational functionality used across all features
- Frontend systems include both feature-specific components and reusable UI systems
- Frontend components follow React patterns with providers, hooks, and context management

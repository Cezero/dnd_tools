import jsPDF from 'jspdf';

import { registerArchivoNarrowFonts } from '@/assets/fonts/registerArchivoNarrow';
import { RaceApi } from '@/features/race/RaceApi';
import type { CharacterWithAllDetailsResponse, DnDClass, Race } from '@shared/schema';
import { AbilityId, ABILITY_MAP, ALIGNMENT_MAP, SIZE_MAP, SKILL_LIST } from '@shared/static-data';

import type { CalculatedCharacterStats } from './characterStatsCalculator';
import { calculateCharacterStats } from './characterStatsCalculator';

/**
 * Generate a PDF character sheet for a character matching the D&D 3.5 character sheet format
 */
export async function generateCharacterPdf(
    character: CharacterWithAllDetailsResponse,
    classDetailsMap: Map<number, DnDClass>
): Promise<void> {
    // Fetch full race object if we need sizeId
    let fullRace: Race | null = null;
    if (character.race?.id) {
        try {
            fullRace = await RaceApi.getRaceById(undefined, { id: character.race.id });
        } catch (error) {
            console.warn('Failed to fetch full race data:', error);
        }
    }

    // Calculate all stats
    const stats = calculateCharacterStats(character, classDetailsMap);

    // Create PDF (US Letter size: 8.5 x 11 inches = 612 x 792 points)
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter'
    });

    // Register ArchivoNarrow fonts
    registerArchivoNarrowFonts(doc);

    const pageWidth = 612;
    const pageHeight = 792;
    const margin = 36;
    const contentWidth = pageWidth - (margin * 2);

    // Helper function to format ability modifier
    const formatModifier = (mod: number): string => {
        return mod >= 0 ? `+${mod}` : `${mod}`;
    };

    // Helper function to format height
    const formatHeight = (inches: number | null | undefined): string => {
        if (!inches) return '';
        const feet = Math.floor(inches / 12);
        const remainingInches = inches % 12;
        return `${feet}' ${remainingInches}"`;
    };

    // Helper function to get alignment abbreviation
    const getAlignmentAbbr = (alignmentId: number | null | undefined): string => {
        if (!alignmentId) return '';
        const alignment = ALIGNMENT_MAP[alignmentId as keyof typeof ALIGNMENT_MAP];
        return alignment?.abbreviation ?? '';
    };

    // Helper function to draw a field in the character sheet format:
    // Value (8pt sans-serif), line (2px below), label (4pt ALL CAPS below line)
    const drawField = (x: number, y: number, width: number, value: string, label: string): number => {
        // Value text (8pt sans-serif)
        doc.setFontSize(8);
        doc.setFont('ArchivoNarrow', 'normal');
        doc.text(value || '', x, y);

        // Line (2px below value)
        const lineY = y + 2;
        doc.setLineWidth(0.5);
        doc.line(x, lineY, x + width, lineY);

        // Label (4pt ALL CAPS, below line)
        const labelY = lineY + 5;
        doc.setFontSize(4);
        doc.setFont('ArchivoNarrow', 'normal');
        doc.text(label.toUpperCase(), x, labelY);

        // Return the bottom Y position
        return labelY + 3;
    };

    // Format class abbreviations with forward slash (e.g., "War/Wiz")
    const formatClassAbbreviations = (): string => {
        const abbreviations: string[] = [];
        for (const classLevel of stats.classLevels) {
            const classDetails = classDetailsMap.get(classLevel.classId);
            if (classDetails?.abbreviation) {
                abbreviations.push(classDetails.abbreviation);
            }
        }
        return abbreviations.join('/');
    };

    // Format levels matching class order (e.g., "1/1" for War 1/Wiz 1)
    const formatLevels = (): string => {
        const levels: string[] = [];
        for (const classLevel of stats.classLevels) {
            levels.push(classLevel.level.toString());
        }
        return levels.join('/');
    };

    // ============================================================================
    // TOP SECTION - Character Identification (Three Lines)
    // ============================================================================
    let yPos = margin;
    const fieldHeight = 12; // Height of each field (value + line + label) - reduced for tighter spacing
    const fieldSpacing = 5; // Spacing between fields horizontally

    // Calculate field widths for even distribution
    const line1FieldWidth = (contentWidth - (fieldSpacing * 2)) / 3; // 3 fields on line 1
    const line2FieldWidth = (contentWidth - (fieldSpacing * 5)) / 6; // 6 fields on line 2
    const line3FieldWidth = (contentWidth - (fieldSpacing * 6)) / 7; // 7 fields on line 3

    // LINE 1: Character Name, Player Name, Region
    let xPos = margin;
    const line1Y = yPos;
    drawField(xPos, line1Y, line1FieldWidth, character.name || '', 'CHARACTER NAME');
    xPos += line1FieldWidth + fieldSpacing;

    // Player Name (not in character data, leave blank)
    drawField(xPos, line1Y, line1FieldWidth, '', 'PLAYER NAME');
    xPos += line1FieldWidth + fieldSpacing;

    // Region (not in character data, leave blank)
    drawField(xPos, line1Y, line1FieldWidth, '', 'REGION');

    // LINE 2: Class, Race, Size, Gender, Alignment, Deity
    const line2Y = line1Y + fieldHeight + 2; // Space between lines - tighter spacing
    xPos = margin;

    // Class (abbreviated with forward slash)
    const classAbbr = formatClassAbbreviations();
    drawField(xPos, line2Y, line2FieldWidth, classAbbr, 'CLASS');
    xPos += line2FieldWidth + fieldSpacing;

    // Race
    drawField(xPos, line2Y, line2FieldWidth, character.race?.name || '', 'RACE');
    xPos += line2FieldWidth + fieldSpacing;

    // Size (from full race object, if available)
    const sizeAbbr = fullRace?.sizeId ? SIZE_MAP[fullRace.sizeId as keyof typeof SIZE_MAP]?.abbreviation || '' : '';
    drawField(xPos, line2Y, line2FieldWidth, sizeAbbr, 'SIZE');
    xPos += line2FieldWidth + fieldSpacing;

    // Gender
    drawField(xPos, line2Y, line2FieldWidth, character.gender || '', 'GENDER');
    xPos += line2FieldWidth + fieldSpacing;

    // Alignment (two character abbreviation)
    const alignmentAbbr = getAlignmentAbbr(character.alignmentId);
    drawField(xPos, line2Y, line2FieldWidth, alignmentAbbr, 'ALIGNMENT');
    xPos += line2FieldWidth + fieldSpacing;

    // Deity
    drawField(xPos, line2Y, line2FieldWidth, character.deity?.name || '', 'DEITY');

    // LINE 3: Level, Type, Age, Height, Weight, Eyes, Hair
    const line3Y = line2Y + fieldHeight + 2; // Space between lines - tighter spacing
    xPos = margin;

    // Level (matching class order)
    const levels = formatLevels();
    drawField(xPos, line3Y, line3FieldWidth, levels, 'LEVEL');
    xPos += line3FieldWidth + fieldSpacing;

    // Type (Humanoid (race) - not implemented yet, leave blank)
    drawField(xPos, line3Y, line3FieldWidth, '', 'TYPE');
    xPos += line3FieldWidth + fieldSpacing;

    // Age
    drawField(xPos, line3Y, line3FieldWidth, character.age?.toString() || '', 'AGE');
    xPos += line3FieldWidth + fieldSpacing;

    // Height
    const heightStr = formatHeight(character.height);
    drawField(xPos, line3Y, line3FieldWidth, heightStr, 'HEIGHT');
    xPos += line3FieldWidth + fieldSpacing;

    // Weight
    const weightStr = character.weight ? `${character.weight} lb.` : '';
    drawField(xPos, line3Y, line3FieldWidth, weightStr, 'WEIGHT');
    xPos += line3FieldWidth + fieldSpacing;

    // Eyes
    drawField(xPos, line3Y, line3FieldWidth, character.eyes || '', 'EYES');
    xPos += line3FieldWidth + fieldSpacing;

    // Hair
    drawField(xPos, line3Y, line3FieldWidth, character.hair || '', 'HAIR');

    // Update yPos for main content area
    yPos = line3Y + fieldHeight + 1;

    // ============================================================================
    // MAIN CONTENT AREA - Three Column Layout
    // ============================================================================

    // ============================================================================
    // LEFT COLUMN - Ability Scores and Combat Stats
    // ============================================================================
    const leftColX = margin;
    let abilityGridY = yPos;

    // Ability Scores Section - Table format with 5 columns
    const abilityOrder = [AbilityId.Strength, AbilityId.Dexterity, AbilityId.Constitution, AbilityId.Intelligence, AbilityId.Wisdom, AbilityId.Charisma];
    const abilityBoxWidth = 26;
    const valueBoxWidth = 25;
    const rowHeight = 18; // Height of each ability row
    const headerHeight = 24; // Height for column headers (increased for word-wrapped labels)
    const abilityBoxSpacingX = 2; // 2px space between boxes vertically
    const rowSpacing = 3; // 3px space between rows

    // Helper function to draw word-wrapped labels
    const drawLabel = (x: number, y: number, width: number, words: string[], centerY?: number): void => {
        doc.setFontSize(4);
        doc.setFont('ArchivoNarrow', 'normal');
        const centerX = x + width / 2;

        if (words.length === 1) {
            // Single word - center vertically if centerY provided, otherwise use y + 2.5
            const labelY = centerY !== undefined ? centerY + 2 : y + 2;
            doc.text(words[0], centerX, labelY, { align: 'center' });
        } else if (words.length === 2) {
            // Two words - first at y, second at y + 4
            doc.text(words[0], centerX, y, { align: 'center' });
            doc.text(words[1], centerX, y + 4, { align: 'center' });
        } else {
            // Three or more words - each on a new line (y, y + 4, y + 8, etc.)
            words.forEach((word, index) => {
                doc.text(word, centerX, y + index * 4, { align: 'center' });
            });
        }
    };

    // Column headers with word wrapping
    const headerY = abilityGridY;
    let headerX = leftColX;

    // Column 1: ABILITY NAME (single line, centered vertically with other headers)
    drawLabel(headerX, headerY, abilityBoxWidth, ['ABILITY NAME'], headerY);
    headerX += abilityBoxWidth + abilityBoxSpacingX;

    // Column 2: ABILITY SCORE (word-wrapped, centered)
    drawLabel(headerX, headerY, valueBoxWidth, ['ABILITY', 'SCORE']);
    headerX += valueBoxWidth + abilityBoxSpacingX;

    // Column 3: ABILITY MODIFIER (word-wrapped, centered)
    drawLabel(headerX, headerY, valueBoxWidth, ['ABILITY', 'MODIFIER']);
    headerX += valueBoxWidth + abilityBoxSpacingX;

    // Column 4: TEMP SCORE (word-wrapped, centered)
    drawLabel(headerX, headerY, valueBoxWidth, ['TEMP', 'SCORE']);
    headerX += valueBoxWidth + abilityBoxSpacingX;

    // Column 5: TEMP MODIFIER (word-wrapped, centered)
    drawLabel(headerX, headerY, valueBoxWidth, ['TEMP', 'MODIFIER']);

    // Move down to start the grid below the headers (keep original spacing)
    abilityGridY += headerHeight;

    // Helper to draw black box with white text (ability name)
    const drawAbilityNameBox = (x: number, y: number, width: number, height: number, abbr: string, fullName: string): void => {
        // Draw black box
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(1);
        doc.setFillColor(0, 0, 0);
        doc.rect(x, y - height, width, height, 'FD');

        // White text - abbreviation (shifted down 3px total)
        doc.setFontSize(7);
        doc.setFont('ArchivoNarrow', 'bold');
        doc.setTextColor(255, 255, 255);
        let abbrY = y - height + 9; // Shifted down 3px from original 6
        if (!fullName) {
            abbrY += 2;
        }
        doc.text(abbr, x + width / 2, abbrY, { align: 'center' });

        // White text - full name in 4pt (shifted down 3px total)
        doc.setFontSize(4);
        doc.setFont('ArchivoNarrow', 'normal');
        const nameY = y - height + 15; // Shifted down 3px from original 12
        doc.text(fullName.toUpperCase(), x + width / 2, nameY, { align: 'center' });

        // Reset text color
        doc.setTextColor(0, 0, 0);
    };

    // Helper to draw white box with border (ability score/modifier)
    const drawScoreBox = (x: number, y: number, width: number, height: number, value: string): void => {
        // Draw white box with border
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(1);
        doc.setFillColor(255, 255, 255);
        doc.rect(x, y - height, width, height, 'FD');

        // Black text
        doc.setFontSize(8);
        doc.setFont('ArchivoNarrow', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(value, x + width / 2, y - height / 2 + 3, { align: 'center' });
    };

    // Helper to draw empty box with dotted border (temp score/modifier)
    const drawTempBox = (x: number, y: number, width: number, height: number): void => {
        // Draw dotted border box
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        // jsPDF doesn't have native dotted lines, so we'll use a dashed pattern
        doc.setLineDashPattern([1, 1], 0);
        doc.setFillColor(255, 255, 255);
        doc.rect(x, y - height, width, height, 'FD');
        doc.setLineDashPattern([], 0); // Reset to solid
    };

    const drawHeaderBox = (x: number, y: number, width: number, height: number, label: string, value: string): void => {
        const boxHeaderHeight = 6;
        // Draw black box
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(1);
        doc.setFillColor(0, 0, 0);
        doc.rect(x, y, width, boxHeaderHeight, 'FD');

        // White text - full name in 3pt (shifted down 3px total)
        doc.setFontSize(3);
        doc.setFont('ArchivoNarrow', 'normal');
        doc.setTextColor(255, 255, 255);
        const nameY = y + 4;
        doc.text(label.toUpperCase(), x + width / 2, nameY, { align: 'center' });

        // draw white box with border
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(1);
        doc.setFillColor(255, 255, 255);
        doc.rect(x, y + boxHeaderHeight, width, height - boxHeaderHeight, 'FD');

        // Black text
        doc.setFontSize(8);
        doc.setFont('ArchivoNarrow', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(value, x + width / 2, y + boxHeaderHeight + 3 + ((height - boxHeaderHeight) / 2), { align: 'center' });
    };

    type WeaponInfo = {
        name: string | null;
        totalAttackBonus: number | null;
        damage: string | null;
        critical: string | null;
        range: string | null;
        weight: string | null;
        type: string | null;
        size: string | null;
        specialProperties: string | null;
    };

    const drawWeaponBox = (x: number, y: number, label: string, weaponInfo?: WeaponInfo): void => {
        const labelHeaderHeight = 12;
        const rowHeight = 18;
        const firstRowColumnWidths = [120, 60, 60, 40]; // 280px total
        const secondRowColumnWidths = [30, 30, 40, 50, 130]; // 280px total

        const weaponName = weaponInfo ? weaponInfo.name ?? '' : '';
        const totalAttackBonus = weaponInfo ? weaponInfo.totalAttackBonus?.toString() ?? '' : '';
        const damage = weaponInfo ? weaponInfo.damage ?? '' : '';
        const critical = weaponInfo ? weaponInfo.critical ?? '' : '';
        const range = weaponInfo ? weaponInfo.range ?? '' : '';
        const weight = weaponInfo ? weaponInfo.weight ?? '' : '';
        const type = weaponInfo ? weaponInfo.type ?? '' : '';
        const size = weaponInfo ? weaponInfo.size ?? '' : '';
        const specialProperties = weaponInfo ? weaponInfo.specialProperties ?? '' : '';

        // Helper to sum first N elements of an array
        const sumFirst = (arr: number[], count: number): number => {
            return arr.slice(0, count).reduce((sum, val) => sum + val, 0);
        };

        // Draw black box
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(1);
        doc.setFillColor(0, 0, 0);
        doc.rect(x, y, firstRowColumnWidths[0], labelHeaderHeight, 'FD');

        // White text - full name in 7pt (shifted down 4px total)
        doc.setFontSize(7);
        doc.setFont('ArchivoNarrow', 'bold');
        doc.setTextColor(255, 255, 255);
        const nameY = y + 8;
        doc.text(label.toUpperCase(), x + firstRowColumnWidths[0] / 2, nameY, { align: 'center' });

        // draw white box with border
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(1);
        doc.setFillColor(255, 255, 255);
        doc.rect(x, y + labelHeaderHeight, firstRowColumnWidths[0], rowHeight - 6, 'FD');

        // Black text
        doc.setFontSize(8);
        doc.setFont('ArchivoNarrow', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(weaponName, x + firstRowColumnWidths[0] / 2, y + labelHeaderHeight + 8, { align: 'center' });

        const firstRowY = y + 6;
        drawHeaderBox(x + sumFirst(firstRowColumnWidths, 1), firstRowY, firstRowColumnWidths[1], rowHeight, 'TOTAL ATTACK BONUS', totalAttackBonus);
        drawHeaderBox(x + sumFirst(firstRowColumnWidths, 2), firstRowY, firstRowColumnWidths[2], rowHeight, 'DAMAGE', damage);
        drawHeaderBox(x + sumFirst(firstRowColumnWidths, 3), firstRowY, firstRowColumnWidths[3], rowHeight, 'CRITICAL', critical);

        const secondRowY = y + 6 + rowHeight;
        drawHeaderBox(x + sumFirst(secondRowColumnWidths, 0), secondRowY, secondRowColumnWidths[0], rowHeight, 'RANGE', range);
        drawHeaderBox(x + sumFirst(secondRowColumnWidths, 1), secondRowY, secondRowColumnWidths[1], rowHeight, 'WEIGHT', weight);
        drawHeaderBox(x + sumFirst(secondRowColumnWidths, 2), secondRowY, secondRowColumnWidths[2], rowHeight, 'TYPE', type);
        drawHeaderBox(x + sumFirst(secondRowColumnWidths, 3), secondRowY, secondRowColumnWidths[3], rowHeight, 'SIZE', size);
        drawHeaderBox(x + sumFirst(secondRowColumnWidths, 4), secondRowY, secondRowColumnWidths[4], rowHeight, 'SPECIAL PROPERTIES', specialProperties);

        const ammoRowY = y + 11 + rowHeight + rowHeight;
        let ammoRowX = x + firstRowColumnWidths[0] + 4;
        doc.setFontSize(5);
        doc.setFont('ArchivoNarrow', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text('AMMUNITION', ammoRowX, ammoRowY);
        ammoRowX += 30;
        for (let i = 0; i < 20; i++) {
            doc.text('O', ammoRowX + i * 4, ammoRowY);
        }
    };

    // Draw each ability row
    for (const abilityId of abilityOrder) {
        const ability = stats.abilityScores.find(a => a.abilityId === abilityId);
        if (!ability) continue;

        const abilityData = ABILITY_MAP[abilityId];
        if (!abilityData) continue;

        let colX = leftColX;

        // Column 1: Ability Name (black box with white text)
        drawAbilityNameBox(colX, abilityGridY, abilityBoxWidth, rowHeight, abilityData.abbreviation, abilityData.name);
        colX += abilityBoxWidth + abilityBoxSpacingX + 2; // Add 2px gap after ability name column

        // Column 2: Ability Score (white box with border)
        drawScoreBox(colX, abilityGridY, valueBoxWidth, rowHeight, ability.score.toString());
        colX += valueBoxWidth + abilityBoxSpacingX;

        // Column 3: Ability Modifier (white box with border)
        drawScoreBox(colX, abilityGridY, valueBoxWidth, rowHeight, formatModifier(ability.modifier));
        colX += valueBoxWidth + abilityBoxSpacingX;

        // Column 4: Temp Score (empty dotted box)
        drawTempBox(colX, abilityGridY, valueBoxWidth, rowHeight);
        colX += valueBoxWidth + abilityBoxSpacingX;

        // Column 5: Temp Modifier (empty dotted box)
        drawTempBox(colX, abilityGridY, valueBoxWidth, rowHeight);

        abilityGridY += rowHeight + rowSpacing;
    }

    // HP and AC Section - to the right of ability grid, starting at STR row
    // Calculate right edge of ability grid: sum of all column widths + spacing between them + 2px gap after ability name
    const abilityGridWidth = abilityBoxWidth + ((valueBoxWidth + abilityBoxSpacingX) * 4) + 2; // Add 2px gap after ability name column
    const hpStartX = leftColX + abilityGridWidth + 6; // Right edge of ability grid + 6px gap
    //const hpStartY = yPos + headerHeight; // Same Y as first ability row (STR)
    const hpHeaderY = yPos;
    const hpStartY = hpHeaderY + headerHeight;
    const hpBoxSpacing = 4; // 4px spacing between HP row boxes

    // Column headers for HP section
    //const hpHeaderY = hpStartY - rowHeight - 4; // Same as ability grid headers
    let hpX = hpStartX;

    // HP black box label (no label above, it's in the box)
    // HP white box label
    hpX += abilityBoxWidth + hpBoxSpacing; // Skip HP black box width
    const totalBoxWidth = 35; // Define here for label positioning
    drawLabel(hpX, hpHeaderY, totalBoxWidth, ['TOTAL']);
    hpX += totalBoxWidth + hpBoxSpacing;

    // Calculate remaining width for WOUNDS, NONLETHAL DAMAGE, and SPEED boxes
    // Available width = page width - margin - hpStartX - (HP box + TOTAL box + spacing)
    const hpBoxWidth = abilityBoxWidth;
    // totalBoxWidth already defined above for label positioning
    const usedWidth = hpBoxWidth + hpBoxSpacing + totalBoxWidth + hpBoxSpacing;
    const availableWidth = pageWidth - margin - hpStartX - usedWidth;
    // Keep WOUNDS and NONLETHAL at their current size, shrink SPEED as needed
    const woundsWidth = Math.floor(availableWidth / 3); // Keep current size
    const nonlethalWidth = Math.floor(availableWidth / 3); // Keep current size
    const remainingForSpeed = availableWidth - woundsWidth - nonlethalWidth - (hpBoxSpacing * 2); // 2 gaps between 3 boxes
    const speedWidth = remainingForSpeed; // SPEED box shrinks to fit

    // WOUNDS label
    drawLabel(hpX, hpHeaderY, woundsWidth, ['WOUNDS']);
    hpX += woundsWidth + hpBoxSpacing;

    // NONLETHAL DAMAGE label (single line)
    drawLabel(hpX, hpHeaderY, nonlethalWidth, ['NONLETHAL DAMAGE']);
    hpX += nonlethalWidth + hpBoxSpacing;

    // SPEED label
    drawLabel(hpX, hpHeaderY, speedWidth, ['SPEED']);

    // Draw HP section boxes at STR row level
    hpX = hpStartX;

    // HP black box (same style as ability name boxes)
    drawAbilityNameBox(hpX, hpStartY, hpBoxWidth, rowHeight, 'HP', 'HIT POINTS');
    hpX += hpBoxWidth + hpBoxSpacing;

    // TOTAL white box with hit points (10px bigger)
    drawScoreBox(hpX, hpStartY, totalBoxWidth, rowHeight, stats.combatStats.hitPoints.toString());
    hpX += totalBoxWidth + hpBoxSpacing;

    // WOUNDS empty box with solid border
    drawScoreBox(hpX, hpStartY, woundsWidth, rowHeight, ''); // Empty box with solid border
    hpX += woundsWidth + hpBoxSpacing;

    // NONLETHAL DAMAGE empty box with solid border
    drawScoreBox(hpX, hpStartY, nonlethalWidth, rowHeight, ''); // Empty box with solid border
    hpX += nonlethalWidth + hpBoxSpacing;

    // SPEED box with speed value and solid border
    drawScoreBox(hpX, hpStartY, speedWidth, rowHeight, `${stats.combatStats.speed} ft.`);

    // AC Row - directly beneath HP row, aligned with DEX row
    // Calculate AC row Y position: should align with DEX row (second ability row)
    // DEX row is at: yPos + headerHeight + rowHeight + rowSpacing
    const acRowY = yPos + headerHeight + rowHeight + rowSpacing;
    const acBoxWidth = valueBoxWidth;
    const acBoxSpacing = 3; // Larger spacing to accommodate '+' symbols
    const acBoxTextSpacing = 2;

    // Calculate shieldBonusRightEdge for later use (right edge of shield bonus box from AC row)
    let shieldBonusRightEdge: number;

    // AC row starts at same X as HP row
    let acX = hpStartX;

    // AC black box (same style as HP box)
    drawAbilityNameBox(acX, acRowY, hpBoxWidth, rowHeight, 'AC', 'ARMOR CLASS');
    acX += hpBoxWidth + acBoxSpacing + 1;

    // Total AC white box
    const acStats = stats.combatStats.armorClass;
    drawScoreBox(acX, acRowY, acBoxWidth, rowHeight, acStats.total.toString());
    acX += acBoxWidth + acBoxTextSpacing;

    // '=' text (not in a box)
    doc.setFontSize(8);
    doc.setFont('ArchivoNarrow', 'normal');
    doc.text('=', acX, acRowY - rowHeight / 2 + 3);
    acX += 8; // Small space for '='

    // '10' text (not in a box)
    doc.text('10', acX, acRowY - rowHeight / 2 + 3);
    acX += 11; // Small space for '10'

    // '+' text
    doc.text('+', acX, acRowY - rowHeight / 2 + 3);
    acX += acBoxSpacing + acBoxTextSpacing;

    // Armor bonus white box
    drawScoreBox(acX, acRowY, acBoxWidth, rowHeight, acStats.armor.toString());
    acX += acBoxWidth + acBoxSpacing - acBoxTextSpacing;

    // '+' text
    doc.text('+', acX, acRowY - rowHeight / 2 + 3);
    acX += acBoxSpacing + acBoxTextSpacing;

    // Shield bonus white box
    const shieldBonusX = acX; // Save X position for alignment
    drawScoreBox(acX, acRowY, acBoxWidth, rowHeight, acStats.shield.toString());
    shieldBonusRightEdge = shieldBonusX + acBoxWidth; // Right edge of shield bonus box
    acX += acBoxWidth + acBoxSpacing - acBoxTextSpacing;

    // '+' text
    doc.text('+', acX, acRowY - rowHeight / 2 + 3);
    acX += acBoxSpacing + acBoxTextSpacing;

    // Dex modifier white box
    drawScoreBox(acX, acRowY, acBoxWidth, rowHeight, formatModifier(acStats.dex));
    acX += acBoxWidth + acBoxSpacing - acBoxTextSpacing;

    // '+' text
    doc.text('+', acX, acRowY - rowHeight / 2 + 3);
    acX += acBoxSpacing + acBoxTextSpacing;

    // Size modifier white box
    drawScoreBox(acX, acRowY, acBoxWidth, rowHeight, formatModifier(acStats.size));
    acX += acBoxWidth + acBoxSpacing - acBoxTextSpacing;

    // '+' text
    doc.text('+', acX, acRowY - rowHeight / 2 + 3);
    acX += acBoxSpacing + acBoxTextSpacing;

    // Natural armor white box
    drawScoreBox(acX, acRowY, acBoxWidth, rowHeight, acStats.natural.toString());
    acX += acBoxWidth + acBoxSpacing - acBoxTextSpacing;

    // '+' text
    doc.text('+', acX, acRowY - rowHeight / 2 + 3);
    acX += acBoxSpacing + acBoxTextSpacing;

    // Deflection bonus white box
    drawScoreBox(acX, acRowY, acBoxWidth, rowHeight, acStats.deflection.toString());
    acX += acBoxWidth + acBoxSpacing - acBoxTextSpacing;

    // '+' text
    doc.text('+', acX, acRowY - rowHeight / 2 + 3);
    acX += acBoxSpacing + acBoxTextSpacing;

    // Misc bonus white box
    drawScoreBox(acX, acRowY, acBoxWidth, rowHeight, acStats.misc.toString());
    acX += acBoxWidth + acBoxSpacing - acBoxTextSpacing;
    acX += acBoxSpacing + acBoxTextSpacing; // Skip '+'
    acX += acBoxSpacing - 3; // Gap after MISC (no '+' here) - reduced by 3px

    // Armor Check Penalty box (same size as other bonus boxes)
    drawScoreBox(acX, acRowY, acBoxWidth, rowHeight, ''); // Empty for now
    acX += acBoxWidth + acBoxSpacing + 3; // Increased gap by 3px

    // Damage Reduction box (uses remaining space)
    const damageReductionWidth = pageWidth - margin - acX;
    drawScoreBox(acX, acRowY, damageReductionWidth, rowHeight, ''); // Empty for now

    // Column labels beneath the boxes (4pt font, ALL CAPS, word-wrapped)
    const acLabelY = acRowY + 5; // 5px below the boxes
    let labelX = hpStartX + 1;

    // AC label (no label, it's in the box)
    labelX += hpBoxWidth + acBoxSpacing + 1;

    // TOTAL label (single word, no wrapping needed)
    drawLabel(labelX, acLabelY, acBoxWidth, ['TOTAL']);
    labelX += acBoxWidth + acBoxTextSpacing;

    // Skip '=' and '10' labels
    labelX += 8 + 11 + acBoxSpacing + acBoxTextSpacing; // Space for '=' and '10' and '+'

    // ARMOR BONUS label (word-wrapped)
    drawLabel(labelX, acLabelY, acBoxWidth, ['ARMOR', 'BONUS']);
    labelX += acBoxWidth + acBoxSpacing - acBoxTextSpacing;
    labelX += acBoxSpacing + acBoxTextSpacing; // Skip '+'

    // SHIELD BONUS label (word-wrapped)
    drawLabel(labelX, acLabelY, acBoxWidth, ['SHIELD', 'BONUS']);
    labelX += acBoxWidth + acBoxSpacing - acBoxTextSpacing;
    labelX += acBoxSpacing + acBoxTextSpacing; // Skip '+'

    // DEX MODIFIER label (word-wrapped)
    drawLabel(labelX, acLabelY, acBoxWidth, ['DEX', 'MODIFIER']);
    labelX += acBoxWidth + acBoxSpacing - acBoxTextSpacing;
    labelX += acBoxSpacing + acBoxTextSpacing; // Skip '+'

    // SIZE MODIFIER label (word-wrapped)
    drawLabel(labelX, acLabelY, acBoxWidth, ['SIZE', 'MODIFIER']);
    labelX += acBoxWidth + acBoxSpacing - acBoxTextSpacing;
    labelX += acBoxSpacing + acBoxTextSpacing; // Skip '+'

    // NATURAL ARMOR label (word-wrapped)
    drawLabel(labelX, acLabelY, acBoxWidth, ['NATURAL', 'ARMOR']);
    labelX += acBoxWidth + acBoxSpacing - acBoxTextSpacing;
    labelX += acBoxSpacing + acBoxTextSpacing; // Skip '+'

    // DEFLECT BONUS label (word-wrapped)
    drawLabel(labelX, acLabelY, acBoxWidth, ['DEFLECT', 'BONUS']);
    labelX += acBoxWidth + acBoxSpacing - acBoxTextSpacing;
    labelX += acBoxSpacing + acBoxTextSpacing; // Skip '+'

    // MISC BONUS label (word-wrapped)
    drawLabel(labelX, acLabelY, acBoxWidth, ['MISC', 'BONUS']);
    labelX += acBoxWidth + acBoxSpacing - acBoxTextSpacing;
    labelX += acBoxSpacing + acBoxTextSpacing; // Skip '+'
    labelX += acBoxSpacing - 3; // Gap after MISC (no '+' here) - reduced by 2px

    // ARMOR CHECK PENALTY label (3 lines, each word on new line)
    drawLabel(labelX, acLabelY, acBoxWidth, ['ARMOR', 'CHECK', 'PENALTY']);
    labelX += acBoxWidth + acBoxSpacing + 3; // Increased gap by 3px

    // DAMAGE REDUCTION label (single line, not word-wrapped)
    drawLabel(labelX, acLabelY, damageReductionWidth, ['DAMAGE REDUCTION']);

    // Touch AC and Flat-Footed AC Row
    // Calculate Y position - below AC row with space for 3-line label (10px for label + spacing)
    const touchAcRowY = acRowY + rowHeight + 13; // Space for labels below AC row

    let touchAcX = hpStartX;

    // TOUCH black box
    const touchBoxWidth = abilityBoxWidth;
    drawAbilityNameBox(touchAcX, touchAcRowY, touchBoxWidth, rowHeight, 'TOUCH', 'ARMOR CLASS');
    touchAcX += touchBoxWidth + hpBoxSpacing;

    // Touch AC white box
    drawScoreBox(touchAcX, touchAcRowY, acBoxWidth, rowHeight, stats.combatStats.touchAC.toString());
    touchAcX += acBoxWidth + hpBoxSpacing;

    // FLAT-FOOTED black box (definitely wider)
    const flatFootedBoxWidth = 49; // Wider to fit "FLAT-FOOTED"
    drawAbilityNameBox(touchAcX, touchAcRowY, flatFootedBoxWidth, rowHeight, 'FLAT-FOOTED', 'ARMOR CLASS');
    touchAcX += flatFootedBoxWidth + hpBoxSpacing;

    // Flat-footed AC white box - calculate width to align with SHIELD BONUS right edge
    const flatFootedAcWidth = shieldBonusRightEdge - touchAcX;
    drawScoreBox(touchAcX, touchAcRowY, flatFootedAcWidth, rowHeight, stats.combatStats.flatFootedAC.toString());

    // Initiative Row - below TOUCH/FLAT-FOOTED row
    const initiativeRowY = touchAcRowY + rowHeight + rowSpacing;
    let initX = hpStartX;

    // INITIATIVE black box (same width as TOUCH box)
    const initiativeBoxWidth = 55;
    drawAbilityNameBox(initX, initiativeRowY, initiativeBoxWidth, rowHeight, 'INITIATIVE', '');
    initX += initiativeBoxWidth + hpBoxSpacing;

    // Total Initiative white box
    const initWhiteBoxWidth = acBoxWidth - 4;
    const initiativeTotal = stats.combatStats.initiative.total;
    drawScoreBox(initX, initiativeRowY, initWhiteBoxWidth, rowHeight, formatModifier(initiativeTotal));
    initX += initWhiteBoxWidth + acBoxTextSpacing;

    // '=' text (not in a box)
    doc.setFontSize(8);
    doc.setFont('ArchivoNarrow', 'normal');
    doc.text('=', initX, initiativeRowY - rowHeight / 2 + 3);
    initX += 6; // Small space for '='

    // Dex modifier white box
    const dexMod = stats.abilityScores.find(a => a.abilityId === AbilityId.Dexterity)?.modifier ?? 0;
    drawScoreBox(initX, initiativeRowY, initWhiteBoxWidth, rowHeight, formatModifier(dexMod));
    initX += initWhiteBoxWidth + acBoxSpacing - 1;

    // '+' text
    doc.text('+', initX, initiativeRowY - rowHeight / 2 + 3);
    initX += acBoxSpacing + acBoxTextSpacing;

    // Misc bonus white box
    const initiativeMisc = stats.combatStats.initiative.misc;
    drawScoreBox(initX, initiativeRowY, initWhiteBoxWidth, rowHeight, formatModifier(initiativeMisc));

    // Labels beneath the boxes (4pt font, ALL CAPS, word-wrapped)
    const initiativeLabelY = initiativeRowY + 5; // 5px below the boxes
    let initLabelX = hpStartX;

    // INITIATIVE label (no label, it's in the box)
    initLabelX += initiativeBoxWidth + hpBoxSpacing;

    // TOTAL label (single word, no wrapping needed)
    drawLabel(initLabelX, initiativeLabelY, initWhiteBoxWidth, ['TOTAL']);
    initLabelX += initWhiteBoxWidth;

    // Skip '=' label
    initLabelX += 6 + acBoxTextSpacing; // Space for '=' and '+'

    // DEX MODIFIER label (word-wrapped)
    drawLabel(initLabelX, initiativeLabelY, initWhiteBoxWidth, ['DEX', 'MODIFIER']);
    initLabelX += initWhiteBoxWidth + acBoxSpacing + acBoxTextSpacing + acBoxTextSpacing; // Skip '+'

    // MISC BONUS label (word-wrapped)
    drawLabel(initLabelX, initiativeLabelY, initWhiteBoxWidth, ['MISC', 'BONUS']);

    // Base Attack Row - Y position same as CHA row (last ability row)
    const baseAttackRowY = yPos + headerHeight + (rowHeight + rowSpacing) * 5;
    let baseAttackX = hpStartX;

    // BASE ATTACK black box (same width as INITIATIVE box)
    drawAbilityNameBox(baseAttackX, baseAttackRowY, initiativeBoxWidth, rowHeight, 'BASE ATTACK', '');
    baseAttackX += initiativeBoxWidth + hpBoxSpacing;

    // Base Attack Bonus white box - spans from TOTAL to end of DEX MODIFIER
    // TOTAL box starts at: hpStartX + initiativeBoxWidth + hpBoxSpacing
    // DEX MODIFIER box ends at: TOTAL start + initWhiteBoxWidth + acBoxTextSpacing + 6 + initWhiteBoxWidth
    const baseAttackBoxStartX = hpStartX + initiativeBoxWidth + hpBoxSpacing;
    const baseAttackBoxEndX = baseAttackBoxStartX + initWhiteBoxWidth + acBoxTextSpacing + 6 + initWhiteBoxWidth;
    const baseAttackBoxWidth = baseAttackBoxEndX - baseAttackBoxStartX;
    drawScoreBox(baseAttackBoxStartX, baseAttackRowY, baseAttackBoxWidth, rowHeight, stats.combatStats.baseAttackBonus);

    // Empty dotted box next to BASE ATTACK (spaced and sized same as MISC BONUS from INITIATIVE line)
    const baseAttackDottedBoxX = baseAttackBoxEndX + acBoxSpacing + acBoxSpacing + 1; // Same spacing as MISC BONUS
    drawTempBox(baseAttackDottedBoxX, baseAttackRowY, initWhiteBoxWidth, rowHeight);

    // Saving Throws Section - starts at leftmost X, below ability section
    // Calculate Y position: after CHA row (last ability row) with space for headers
    // CHA row ends at: yPos + headerHeight + ((rowHeight + rowSpacing) * 5) + 9
    const savingThrowsHeaderY = yPos + headerHeight + ((rowHeight + rowSpacing) * 5) + 9;
    const savingThrowsStartY = savingThrowsHeaderY + headerHeight;
    const savingThrowsBoxWidth = initiativeBoxWidth - 8; // Same width as INITIATIVE and BASE ATTACK black boxes
    const savingThrowsWhiteBoxWidth = initWhiteBoxWidth; // narrow white box

    // Column headers
    let savingThrowsHeaderX = leftColX;
    drawLabel(savingThrowsHeaderX, savingThrowsHeaderY, savingThrowsBoxWidth, ['SAVING THROWS']);
    savingThrowsHeaderX += savingThrowsBoxWidth + hpBoxSpacing;

    drawLabel(savingThrowsHeaderX, savingThrowsHeaderY, valueBoxWidth, ['TOTAL']);
    savingThrowsHeaderX += valueBoxWidth + acBoxTextSpacing;

    // Skip '=' space
    savingThrowsHeaderX += 4 + acBoxTextSpacing;

    drawLabel(savingThrowsHeaderX, savingThrowsHeaderY, savingThrowsWhiteBoxWidth, ['BASE', 'SAVE']);
    savingThrowsHeaderX += savingThrowsWhiteBoxWidth + 7; // Skip '+'

    drawLabel(savingThrowsHeaderX, savingThrowsHeaderY, savingThrowsWhiteBoxWidth, ['ABILITY', 'MODIFIER']);
    savingThrowsHeaderX += savingThrowsWhiteBoxWidth + 7; // Skip '+'

    drawLabel(savingThrowsHeaderX, savingThrowsHeaderY, savingThrowsWhiteBoxWidth, ['MISC', 'BONUS']);
    savingThrowsHeaderX += savingThrowsWhiteBoxWidth + 7; // Skip '+'

    drawLabel(savingThrowsHeaderX, savingThrowsHeaderY, savingThrowsWhiteBoxWidth, ['TEMP', 'MODIFIER']);

    // Draw three rows: FORTITUDE, REFLEX, WILL
    const savingThrows = [
        { name: 'CONSTITUTION', abbr: 'FORTITUDE', data: stats.savingThrows.fortitude },
        { name: 'DEXTERITY', abbr: 'REFLEX', data: stats.savingThrows.reflex },
        { name: 'WISDOM', abbr: 'WILL', data: stats.savingThrows.will }
    ];

    savingThrows.forEach((save, index) => {
        const saveRowY = savingThrowsStartY + index * (rowHeight + rowSpacing);
        let saveX = leftColX;

        // Black box for saving throw name
        drawAbilityNameBox(saveX, saveRowY, savingThrowsBoxWidth, rowHeight, save.abbr, save.name);
        saveX += savingThrowsBoxWidth + hpBoxSpacing;

        // TOTAL white box
        drawScoreBox(saveX, saveRowY, valueBoxWidth, rowHeight, formatModifier(save.data.total));
        saveX += valueBoxWidth + acBoxTextSpacing;

        // '=' text
        doc.setFontSize(8);
        doc.setFont('ArchivoNarrow', 'normal');
        doc.text('=', saveX, saveRowY - rowHeight / 2 + 3);
        saveX += 6; // Small space for '='

        // BASE SAVE white box
        drawScoreBox(saveX, saveRowY, savingThrowsWhiteBoxWidth, rowHeight, formatModifier(save.data.base));
        saveX += savingThrowsWhiteBoxWidth + acBoxSpacing - 1;

        // '+' text
        doc.text('+', saveX, saveRowY - rowHeight / 2 + 3);
        saveX += acBoxSpacing + acBoxTextSpacing;

        // ABILITY MODIFIER white box
        drawScoreBox(saveX, saveRowY, savingThrowsWhiteBoxWidth, rowHeight, formatModifier(save.data.abilityMod));
        saveX += savingThrowsWhiteBoxWidth + acBoxSpacing - 1;

        // '+' text
        doc.text('+', saveX, saveRowY - rowHeight / 2 + 3);
        saveX += acBoxSpacing + acBoxTextSpacing;

        // MISC BONUS white box
        drawScoreBox(saveX, saveRowY, savingThrowsWhiteBoxWidth, rowHeight, formatModifier(save.data.misc));
        saveX += savingThrowsWhiteBoxWidth + acBoxSpacing - 1;

        // '+' text
        doc.text('+', saveX, saveRowY - rowHeight / 2 + 3);
        saveX += acBoxSpacing + acBoxTextSpacing;

        // TEMP MODIFIER dotted box
        drawTempBox(saveX, saveRowY, savingThrowsWhiteBoxWidth, rowHeight);
    });

    // Grapple Row - beneath saving throws
    // Calculate Y position: after last saving throw row (WILL)
    const grappleRowY = savingThrowsStartY + (rowHeight + rowSpacing) * 2 + rowHeight + (rowSpacing * 3); // wider gap after saving throws
    let grappleX = leftColX;

    // Calculate grapple values
    // Grapple = BAB + STR modifier + Special Size Modifier
    // Parse BAB from string (e.g., "+8/+3" -> 8)
    const babString = stats.combatStats.baseAttackBonus;
    const firstBab = parseInt(babString.split('/')[0].replace(/[^-\d]/g, ''), 10) || 0;
    const strMod = stats.abilityScores.find(a => a.abilityId === AbilityId.Strength)?.modifier ?? 0;

    // Special Size Modifier for grapple (from SIZE_MAP)
    const sizeMod = fullRace?.sizeId ? (SIZE_MAP[fullRace.sizeId as keyof typeof SIZE_MAP]?.grappleModifier ?? 0) : 0;
    const grappleMisc = 0; // Misc bonus not calculated yet
    const grappleTotal = firstBab + strMod + sizeMod + grappleMisc;

    // GRAPPLE black box
    drawAbilityNameBox(grappleX, grappleRowY, savingThrowsBoxWidth, rowHeight, 'GRAPPLE', 'MODIFIER');
    grappleX += savingThrowsBoxWidth + hpBoxSpacing;

    // TOTAL white box
    drawScoreBox(grappleX, grappleRowY, valueBoxWidth, rowHeight, formatModifier(grappleTotal));
    grappleX += valueBoxWidth + acBoxTextSpacing;

    // '=' text
    doc.setFontSize(8);
    doc.setFont('ArchivoNarrow', 'normal');
    doc.text('=', grappleX, grappleRowY - rowHeight / 2 + 3);
    grappleX += 6; // Small space for '='

    // BASE ATTACK white box
    drawScoreBox(grappleX, grappleRowY, savingThrowsWhiteBoxWidth, rowHeight, formatModifier(firstBab));
    grappleX += savingThrowsWhiteBoxWidth + acBoxSpacing - 1;

    // '+' text
    doc.text('+', grappleX, grappleRowY - rowHeight / 2 + 3);
    grappleX += acBoxSpacing + acBoxTextSpacing;

    // STR MODIFIER white box
    drawScoreBox(grappleX, grappleRowY, savingThrowsWhiteBoxWidth, rowHeight, formatModifier(strMod));
    grappleX += savingThrowsWhiteBoxWidth + acBoxSpacing - 1;

    // '+' text
    doc.text('+', grappleX, grappleRowY - rowHeight / 2 + 3);
    grappleX += acBoxSpacing + acBoxTextSpacing;

    // SIZE MODIFIER white box
    drawScoreBox(grappleX, grappleRowY, savingThrowsWhiteBoxWidth, rowHeight, formatModifier(sizeMod));
    grappleX += savingThrowsWhiteBoxWidth + acBoxSpacing - 1;

    // '+' text
    doc.text('+', grappleX, grappleRowY - rowHeight / 2 + 3);
    grappleX += acBoxSpacing + acBoxTextSpacing;

    // MISC BONUS white box
    drawScoreBox(grappleX, grappleRowY, savingThrowsWhiteBoxWidth, rowHeight, formatModifier(grappleMisc));

    // Labels beneath the boxes (4pt font, ALL CAPS, word-wrapped)
    const grappleLabelY = grappleRowY + 5; // 5px below the boxes
    let grappleLabelX = leftColX;

    // GRAPPLE label (no label, it's in the box)
    grappleLabelX += savingThrowsBoxWidth + hpBoxSpacing;

    // TOTAL label
    drawLabel(grappleLabelX, grappleLabelY, valueBoxWidth, ['TOTAL']);
    grappleLabelX += valueBoxWidth + acBoxTextSpacing;

    // Skip '=' label
    grappleLabelX += 4 + acBoxTextSpacing;

    // BASE ATTACK label (word-wrapped)
    drawLabel(grappleLabelX, grappleLabelY, savingThrowsWhiteBoxWidth, ['BASE', 'ATTACK']);
    grappleLabelX += savingThrowsWhiteBoxWidth + 7;

    // STR MODIFIER label (word-wrapped)
    drawLabel(grappleLabelX, grappleLabelY, savingThrowsWhiteBoxWidth, ['STR', 'MODIFIER']);
    grappleLabelX += savingThrowsWhiteBoxWidth + 7;

    // SIZE MODIFIER label (word-wrapped)
    drawLabel(grappleLabelX, grappleLabelY, savingThrowsWhiteBoxWidth, ['SIZE', 'MODIFIER']);
    grappleLabelX += savingThrowsWhiteBoxWidth + 7;

    // MISC BONUS label (word-wrapped)
    drawLabel(grappleLabelX, grappleLabelY, savingThrowsWhiteBoxWidth, ['MISC', 'BONUS']);

    // Conditional Modifiers Box - to the right of saving throws and grapple sections
    // Calculate the right edge of the grapple section
    const grappleSectionRightEdge = grappleX + savingThrowsWhiteBoxWidth;
    const conditionalModifiersStartX = grappleSectionRightEdge + 4; // 4px gap after grapple section
    const conditionalModifiersWidth = shieldBonusRightEdge - conditionalModifiersStartX;
    const conditionalModifiersHeaderHeight = 8; // Narrow black row at top
    const conditionalModifiersHeaderY = savingThrowsHeaderY - 4;
    const conditionalModifiersBottomY = grappleLabelY + 12; // Bottom of grapple labels
    const conditionalModifiersHeight = conditionalModifiersBottomY - (conditionalModifiersHeaderY + conditionalModifiersHeaderHeight);

    // Draw narrow black header row
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.setFillColor(0, 0, 0);
    doc.rect(conditionalModifiersStartX, conditionalModifiersHeaderY, conditionalModifiersWidth, conditionalModifiersHeaderHeight, 'FD');

    // White text in header
    doc.setFontSize(4);
    doc.setFont('ArchivoNarrow', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text('CONDITIONAL MODIFIERS', conditionalModifiersStartX + conditionalModifiersWidth / 2, conditionalModifiersHeaderY + 5.5, { align: 'center' });
    doc.setTextColor(0, 0, 0); // Reset text color

    // Draw main box (white with border)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.setFillColor(255, 255, 255);
    doc.rect(conditionalModifiersStartX, conditionalModifiersHeaderY + conditionalModifiersHeaderHeight, conditionalModifiersWidth, conditionalModifiersHeight - conditionalModifiersHeaderHeight, 'FD');

    // Spell Resistance / Arcane Spell Failure / Action Points Row
    // Starting at leftColX, 4px below conditionalModifiersBottomY
    const spellResistanceRowY = conditionalModifiersBottomY + 15;
    let spellResistanceX = leftColX;

    // SPELL RESISTANCE black box
    const spellResistanceBoxWidth = 64;
    const spellResistanceValue = (character as { spellResistance?: number }).spellResistance ?? 0;
    drawAbilityNameBox(spellResistanceX, spellResistanceRowY, spellResistanceBoxWidth, rowHeight, 'SPELL RESISTANCE', '');
    spellResistanceX += spellResistanceBoxWidth + abilityBoxSpacingX;

    // Spell Resistance value white box
    drawScoreBox(spellResistanceX, spellResistanceRowY, valueBoxWidth, rowHeight, spellResistanceValue > 0 ? spellResistanceValue.toString() : '');
    spellResistanceX += valueBoxWidth + abilityBoxSpacingX * 2; // Extra spacing between groups

    // ARCANE SPELL FAILURE black box
    const arcaneSpellFailureBoxWidth = 74;
    const arcaneSpellFailureValue = (character as { arcaneSpellFailure?: number }).arcaneSpellFailure ?? 0;
    drawAbilityNameBox(spellResistanceX, spellResistanceRowY, arcaneSpellFailureBoxWidth, rowHeight, 'ARCANE SPELL FAILURE', '');
    spellResistanceX += arcaneSpellFailureBoxWidth + abilityBoxSpacingX;

    // Arcane Spell Failure value white box
    drawScoreBox(spellResistanceX, spellResistanceRowY, valueBoxWidth, rowHeight, arcaneSpellFailureValue > 0 ? `${arcaneSpellFailureValue}%` : '');
    spellResistanceX += valueBoxWidth + abilityBoxSpacingX * 2; // Extra spacing between groups

    // ACTION POINTS black box
    const actionPointsBoxWidth = 52;
    const actionPointsValue = (character as { actionPoints?: number }).actionPoints ?? 0;
    drawAbilityNameBox(spellResistanceX, spellResistanceRowY, actionPointsBoxWidth, rowHeight, 'ACTION POINTS', '');
    spellResistanceX += actionPointsBoxWidth + abilityBoxSpacingX;

    // Action Points value white box
    drawScoreBox(spellResistanceX, spellResistanceRowY, valueBoxWidth, rowHeight, actionPointsValue > 0 ? actionPointsValue.toString() : '');

    // Melee and Ranged Attack Rows - below spell resistance row
    const attackHeaderY = spellResistanceRowY + 9;
    const attackStartY = attackHeaderY + headerHeight;
    const attackBoxWidth = spellResistanceBoxWidth; // Same width as saving throw black boxes
    const attackWhiteBoxWidth = valueBoxWidth; // Same width as other white boxes
    const attackTotalBoxWidth = 50;

    // Header row
    let attackHeaderX = leftColX;
    attackHeaderX += attackBoxWidth + hpBoxSpacing; // Skip MELEE/RANGED black box width

    drawLabel(attackHeaderX, attackHeaderY, attackTotalBoxWidth, ['TOTAL']);
    attackHeaderX += attackTotalBoxWidth + acBoxTextSpacing;

    // Skip '=' space
    attackHeaderX += 4 + acBoxTextSpacing;

    drawLabel(attackHeaderX, attackHeaderY, attackWhiteBoxWidth, ['BASE', 'ATTACK']);
    attackHeaderX += attackWhiteBoxWidth + 7; // Skip '+'

    drawLabel(attackHeaderX, attackHeaderY, attackWhiteBoxWidth, ['ABILITY', 'MODIFIER']);
    attackHeaderX += attackWhiteBoxWidth + 7; // Skip '+'

    drawLabel(attackHeaderX, attackHeaderY, attackWhiteBoxWidth, ['SIZE', 'MODIFIER']);
    attackHeaderX += attackWhiteBoxWidth + 7; // Skip '+'

    drawLabel(attackHeaderX, attackHeaderY, attackWhiteBoxWidth, ['MISC', 'BONUS']);
    attackHeaderX += attackWhiteBoxWidth + 7; // Skip '+'

    drawLabel(attackHeaderX, attackHeaderY, attackWhiteBoxWidth, ['TEMP', 'MODIFIER']);

    // Calculate attack values (reuse variables from grapple section if available, otherwise calculate)
    // Note: These may already be calculated in the grapple section, but we'll recalculate here for clarity
    const attackBabString = stats.combatStats.baseAttackBonus;
    const attackFirstBab = parseInt(attackBabString.split('/')[0].replace(/[^-\d]/g, ''), 10) || 0;
    const attackStrMod = stats.abilityScores.find(a => a.abilityId === AbilityId.Strength)?.modifier ?? 0;
    const attackDexMod = stats.abilityScores.find(a => a.abilityId === AbilityId.Dexterity)?.modifier ?? 0;
    const attackSizeMod = fullRace?.sizeId ? (SIZE_MAP[fullRace.sizeId as keyof typeof SIZE_MAP]?.sizeModifier ?? 0) : 0;
    const meleeMisc = 0; // Misc bonus not calculated yet
    const rangedMisc = 0; // Misc bonus not calculated yet

    const meleeTotal = attackFirstBab + attackStrMod + attackSizeMod + meleeMisc;
    const rangedTotal = attackFirstBab + attackDexMod + attackSizeMod + rangedMisc;

    // MELEE row
    const meleeRowY = attackStartY;
    let meleeX = leftColX;

    // MELEE black box
    drawAbilityNameBox(meleeX, meleeRowY, attackBoxWidth, rowHeight, 'MELEE', 'attack bonus');
    meleeX += attackBoxWidth + hpBoxSpacing;

    // TOTAL white box
    drawScoreBox(meleeX, meleeRowY, attackTotalBoxWidth, rowHeight, formatModifier(meleeTotal));
    meleeX += attackTotalBoxWidth + acBoxTextSpacing;

    // '=' text
    doc.setFontSize(8);
    doc.setFont('ArchivoNarrow', 'normal');
    doc.text('=', meleeX, meleeRowY - rowHeight / 2 + 3);
    meleeX += 6; // Small space for '='

    // BASE ATTACK white box
    drawScoreBox(meleeX, meleeRowY, attackWhiteBoxWidth, rowHeight, formatModifier(attackFirstBab));
    meleeX += attackWhiteBoxWidth + acBoxSpacing - 1;

    // '+' text
    doc.text('+', meleeX, meleeRowY - rowHeight / 2 + 3);
    meleeX += acBoxSpacing + acBoxTextSpacing;

    // ABILITY MODIFIER white box (STR)
    drawScoreBox(meleeX, meleeRowY, attackWhiteBoxWidth, rowHeight, formatModifier(attackStrMod));
    meleeX += attackWhiteBoxWidth + acBoxSpacing - 1;

    // '+' text
    doc.text('+', meleeX, meleeRowY - rowHeight / 2 + 3);
    meleeX += acBoxSpacing + acBoxTextSpacing;

    // SIZE MODIFIER white box
    drawScoreBox(meleeX, meleeRowY, attackWhiteBoxWidth, rowHeight, formatModifier(attackSizeMod));
    meleeX += attackWhiteBoxWidth + acBoxSpacing - 1;

    // '+' text
    doc.text('+', meleeX, meleeRowY - rowHeight / 2 + 3);
    meleeX += acBoxSpacing + acBoxTextSpacing;

    // MISC BONUS white box
    drawScoreBox(meleeX, meleeRowY, attackWhiteBoxWidth, rowHeight, formatModifier(meleeMisc));
    meleeX += attackWhiteBoxWidth + acBoxSpacing - 1;

    // '+' text
    doc.text('+', meleeX, meleeRowY - rowHeight / 2 + 3);
    meleeX += acBoxSpacing + acBoxTextSpacing;

    // TEMP MODIFIER dotted box
    drawTempBox(meleeX, meleeRowY, attackWhiteBoxWidth, rowHeight);

    // RANGED row
    const rangedRowY = meleeRowY + rowHeight + rowSpacing;
    let rangedX = leftColX;

    // RANGED black box
    drawAbilityNameBox(rangedX, rangedRowY, attackBoxWidth, rowHeight, 'RANGED', 'attack bonus');
    rangedX += attackBoxWidth + hpBoxSpacing;

    // TOTAL white box
    drawScoreBox(rangedX, rangedRowY, attackTotalBoxWidth, rowHeight, formatModifier(rangedTotal));
    rangedX += attackTotalBoxWidth + acBoxTextSpacing;

    // '=' text
    doc.text('=', rangedX, rangedRowY - rowHeight / 2 + 3);
    rangedX += 6; // Small space for '='

    // BASE ATTACK white box
    drawScoreBox(rangedX, rangedRowY, attackWhiteBoxWidth, rowHeight, formatModifier(attackFirstBab));
    rangedX += attackWhiteBoxWidth + acBoxSpacing - 1;

    // '+' text
    doc.text('+', rangedX, rangedRowY - rowHeight / 2 + 3);
    rangedX += acBoxSpacing + acBoxTextSpacing;

    // ABILITY MODIFIER white box (DEX)
    drawScoreBox(rangedX, rangedRowY, attackWhiteBoxWidth, rowHeight, formatModifier(attackDexMod));
    rangedX += attackWhiteBoxWidth + acBoxSpacing - 1;

    // '+' text
    doc.text('+', rangedX, rangedRowY - rowHeight / 2 + 3);
    rangedX += acBoxSpacing + acBoxTextSpacing;

    // SIZE MODIFIER white box
    drawScoreBox(rangedX, rangedRowY, attackWhiteBoxWidth, rowHeight, formatModifier(attackSizeMod));
    rangedX += attackWhiteBoxWidth + acBoxSpacing - 1;

    // '+' text
    doc.text('+', rangedX, rangedRowY - rowHeight / 2 + 3);
    rangedX += acBoxSpacing + acBoxTextSpacing;

    // MISC BONUS white box
    drawScoreBox(rangedX, rangedRowY, attackWhiteBoxWidth, rowHeight, formatModifier(rangedMisc));
    rangedX += attackWhiteBoxWidth + acBoxSpacing - 1;

    // '+' text
    doc.text('+', rangedX, rangedRowY - rowHeight / 2 + 3);
    rangedX += acBoxSpacing + acBoxTextSpacing;

    // TEMP MODIFIER dotted box
    drawTempBox(rangedX, rangedRowY, attackWhiteBoxWidth, rowHeight);

    const weaponBoxStartX = leftColX;
    const weaponBoxStartY = rangedRowY + 10;

    for (let i = 0; i < 7; i++) {
        drawWeaponBox(weaponBoxStartX, weaponBoxStartY + i * 50, 'ATTACK ' + (i + 1), null);
    }

    // Save PDF
    const filename = `${character.name.replace(/[^a-z0-9]/gi, '_')}_CharacterSheet.pdf`;
    doc.save(filename);
}

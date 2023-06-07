import React from 'react';
import Icon from '@mdi/react';
import {mdiDiceD4Outline, mdiDiceD6Outline, mdiDiceD8Outline, mdiDiceD10Outline, mdiDiceD12Outline, mdiDiceD20Outline} from '@mdi/js';

export function displayRollBreakdown({rollData, original}) {
	console.log("in displayRollBreakdown: rollData: ", rollData, " original: ", original);
	if(!rollData) {return;}
	const {roll} = rollData;
	console.log("in displayRollBreakdown: roll: ", roll);
	return (
		<div>
			<div className='roll-original'>{original}</div>
			<span className='breakdown'>
				{roll.map((term, index) => breakdownTerm(term, index))}
			</span>
		</div>
	);
}

function breakdownTerm(term, index) {
	if(term.constant) {
		return <span key={index} className='breakdown-constant'> {term.constant} </span>;
	}
	else if(term.operator) {
		return <span key={index} className='breakdown-operator'> {term.operator} </span>;
	}
	else {
		console.log(term.synthesizedRolls);
		const polyhedronSpan = determinePolyhedronClasses(term.diceTerm.die.sides);
		if(term.synthesizedRolls.length <= 1) {
			return (
				<span key={'term' + index}>
					{polyhedronSpan}{breakdownDiceTerm(term)}
				</span>
			);
		}
		else {
			return (
				<span key={'term' + index}>
					{polyhedronSpan}({breakdownDiceTerm(term)})
				</span>
			 );
		}
	}
}

function dieClasses(term, dieIndex) {
	let classList = ['breakdown-die'];
	if(term.explosions && term.explosions[dieIndex]) {
		classList.push('breakdown-exploded');
	}
	else if(term.allRolls[dieIndex] === term.diceTerm.die.sides) {
		classList.push('breakdown-critical-hit');
	}
	if(term.rerolls && term.rerolls[dieIndex]) {
		classList.push('breakdown-rerolled');
	}
	if(term.synthesizedRolls[dieIndex] === 1) {
		classList.push('breakdown-critical-miss');
	}
	if(!term.keep[dieIndex]) {
		classList.push('breakdown-dropped');
	}
	return classList.join(' ');
}

function breakdownDiceTerm(term) {
	return term.synthesizedRolls.map((die, index) => {
		const classList = dieClasses(term, index);
		const dieSpan = <span key={index} className={classList}> {die} </span>;
		const elementArr = [dieSpan];
		if(index < term.synthesizedRolls.length - 1) {
			elementArr.push(<span key={'plus' + index} className='breakdown-operator'>&nbsp;+&nbsp;</span>);
		}
		return elementArr;
	});
}

function determinePolyhedronClasses(sides) {
	switch(sides) {
		case 4:
			return "<Icon path={mdiDiceD4Outline} size={1} />";
		case 6:
			return "<Icon path={mdiDiceD6Outline} size={1} />";
		case 8:
			return "<Icon path={mdiDiceD8Outline} size={1} />";
		case 10:
			return "<Icon path={mdiDiceD10Outline} size={1} />";
		case 12:
			return "<Icon path={mdiDiceD12Outline} size={1} />";
		case 20:
			return "<Icon path={mdiDiceD20Outline} size={1} />";
		case 100:
			return "flaticon-dodecahedron-1 poly polyhedron-d100";
		default:
			return "flaticon-dodecahedron-2 poly polyhedron-dn";
	}
}
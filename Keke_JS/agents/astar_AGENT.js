// BABA IS Y'ALL SOLVER - BLANK TEMPLATE
// Version 1.0
// Code by Milk 

"use strict";

//get imports (NODEJS)
var simjs = require('../js/simulation')					//access the game states and simulation
var astar = require('../js/astar')

let possActions = ["space", "right", "up", "left", "down"];



// NEXT ITERATION STEP FOR SOLVING
function iterSolve(init_state) {
  // PERFORM ITERATIVE CALCULATIONS HERE //

	
	// return a sequence of actions or empty list
	return [];
}



function initsearchGrid(state){
	// initialize grid of the same size as map
	// 1 = empty (pass-through)
	// 0 = walls (not pass-through or kill the player)

	const numOfRows = state.obj_map.length
	const numOfColumns = state.obj_map[0].length
	const grid = new Array(numOfRows).fill(1).map(() => new Array(numOfColumns).fill(1));

	// set borders = walls
	grid[0] = new Array(numOfColumns).fill(0)				// top
	grid[numOfRows-1] = new Array(numOfColumns).fill(0)		// bottom
	for (let i = 1; i < numOfRows-1; i++) {
		grid[i][0] = 0										// left
		grid[i][numOfColumns-1] = 0							// right
	}

	// keywords, stop-objects, push-objects = walls
	for (let object of state.unoverlaps) {
		grid[object.y][object.x] = 0
	}
	// kill-objects = walls
	for (let object of state.killers) {
		grid[object.y][object.x] = 0
	}
	// sink-objects = walls
	for (let object of state.sinkers) {
		grid[object.y][object.x] = 0
	}

	// only if melt trait exists: hot-objects are walls
	const rules = parseRules(state.rules)
	const hasMeltRule = checkRuleExists('melt', rules)
	if (hasMeltRule) {
		// state.featured: all objects that are either melt or hot
		for (let object of state.featured) {
			if (object.feature === 'hot') {
				grid[object.y][object.x] = 0
			}
		}
	}

	// make sure players are not 'walls' (might be redundant)
	const players = state.players
	for (let player of players) {
		grid[player.y][player.x] = 1
	}

	return grid
}


function parseRules(rulesStr) {
	const rules = []
	for (const rule of rulesStr) {
		// A rule is a string like "baba-is-melt"
		const splitRule = rule.split('-')
		rules.push({
			object: splitRule[0],
			trait: splitRule[2]
		})
	}
	return rules
}


function checkRuleExists(rule, rules) {
	for (let rule of rules) {
		if (rule.trait === 'melt') {
			return true
		}
	}
	return false
}


function initAstar(state){
	const searchGrid = initsearchGrid(state)

	const players = state.players
	const goals = state.winnables



	// debug
	console.log("\n### MAP ####")
	for (let row of state.orig_map) {
		console.log(row + " ")
	}
	console.log("\n### SEARCH GRID ###")
	for (let row of searchGrid) {
		console.log(row + " ")
	}
	console.log("\n### PLAYERS ###")
	for (let player of players) {
		console.log("(" + player.x  + "," + player.y + ")")
	}
	console.log("\n### WINNABLES ###")
	for (let goal of goals) {
		console.log("(" + goal.x  + "," + goal.y + ")")
	}
}



// VISIBLE FUNCTION FOR OTHER JS FILES (NODEJS)
module.exports = {
	step : function(init_state){return iterSolve(init_state)},		// iterative step function (returns solution as list of steps from poss_actions or empty list)
	init : function(init_state){initAstar(init_state)},				// initializing function here
	best_sol : function(){return [];}								//returns closest solution in case of timeout
}





// required: map or grid
// initialize all nodes with infinite/unknown weight
	// initialize empty closed list
	// initialize open list with all nodes
	// start position of players
	// win positions
	// search for each player & win position

	
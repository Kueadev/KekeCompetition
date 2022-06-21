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
	const grid = new Array(numOfRows).fill(1).map(() => new Array(numOfColumns).fill(1))

	// set borders = walls
	grid[0] = new Array(numOfColumns).fill(0)				// top
	grid[numOfRows-1] = new Array(numOfColumns).fill(0)		// bottom
	for (let i = 1; i < numOfRows-1; i++) {
		grid[i][0] = 0										// left
		grid[i][numOfColumns-1] = 0							// right
	}

	// unoverlaps = keywords, stop-objects, push-objects
	for (let object of state.unoverlaps) {
		grid[object.y][object.x] = 0
	}
	// kill-objects
	for (let object of state.killers) {
		grid[object.y][object.x] = 0
	}
	// sink-objects
	for (let object of state.sinkers) {
		grid[object.y][object.x] = 0
	}

	// only if melt trait exists: hot-objects aren't pass-through
	const hasMeltRule = checkRuleExists('melt', parseRules(state.rules))
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


function parseRules(strRules) {
	const rules = []
	for (const rule of strRules) {
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


function convertResultToActions(astarResult) {
	const actions = []

	for (let node of astarResult) {
		// horizontal move
		if (node.x === node.parent.x) {
			if (node.y > node.parent.y) {
				actions.push('right')
			} else {
				actions.push('left')
			}
		} else {
		// vertical move
			if (node.x > node.parent.x) {
				actions.push('down')
			} else {
				actions.push('up')
			}
		}
	}

	return actions
}


function startAstar(state){
	const searchGrid = initsearchGrid(state)

	const graph = new astar.Graph(searchGrid)

	const players = state.players
	const goals = state.winnables

	// initialize array to store  path of GridNodes
	let astarResult = []
	// initialize array to store final path as actions
	let actions = []

	for (let player of players) {
		for (let goal of goals) {
			const start = graph.grid[player.y][player.x]
			const end = graph.grid[goal.y][goal.x]
			// returns a list of GridNodes
			astarResult = astar.astar.search(graph, start, end)
			actions = convertResultToActions(astarResult)
			
			// stop if a solution has been found
			if (actions != []) {
				break
			}
		}
	}

	
	

	// debug prints
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
	console.log("\n### GOALS ###")
	for (let goal of goals) {
		console.log("(" + goal.x  + "," + goal.y + ")")
	}
	console.log("\n### ASTAR RESULT ###")
	console.log(astarResult)

	console.log("\n### ACTIONS ###")
	console.log(actions)
}



// VISIBLE FUNCTION FOR OTHER JS FILES (NODEJS)
module.exports = {
	step : function(init_state){return iterSolve(init_state)},		// iterative step function (returns solution as list of steps from poss_actions or empty list)
	init : function(init_state){startAstar(init_state)},			// initializing function here
	best_sol : function(){return [];}								//returns closest solution in case of timeout
}
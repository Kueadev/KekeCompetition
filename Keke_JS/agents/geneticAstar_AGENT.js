// BABA IS Y'ALL SOLVER - DFS TEMPLATE
// Version 1.0
// Code by Sarah

"use strict";

// deep copies objects
var cloneDeep = require('lodash.clonedeep');

// get imports (NODEJS)
const simjs = require('../js/simulation');
var astar = require('../js/astar');

const possActions = ['space', 'right', 'up', 'left', 'down'];

const generations = []

// Runs (or amount of creatures) in a generation
const RUNS = 100

// Max amount of steps a creature takes
const STEPS = 50




function initSearchGrid(state){
	// initialize grid of the same size as map
	// 1 = empty (pass-through)
	// 0 = walls (not pass-through or kill the player)

	const numOfRows = state.obj_map.length
	const numOfColumns = state.obj_map[0].length
	const grid = new Array(numOfRows).fill(1).map(() => new Array(numOfColumns).fill(1))

	// set borders = walls
	grid[0] = new Array(numOfColumns).fill(0)				      // top
	grid[numOfRows-1] = new Array(numOfColumns).fill(0)		// bottom
	for (let i = 1; i < numOfRows-1; i++) {
		grid[i][0] = 0										                  // left
		grid[i][numOfColumns-1] = 0							            // right
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
		if (state.featured.length > 0) {
			for (let object of state.featured) {
				if (object.feature === 'hot') {
					grid[object.y][object.x] = 0
				}
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


function checkRuleExists(checkRule, rules) {
	for (let rule of rules) {
		if (rule.trait === checkRule) {
			return true
		}
	}
	return false
}


function convertPathToActions(astarResult) {
	const actions = []

	// the x and y coordinates are reversed in the Grid datastructure
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
	const searchGrid = initSearchGrid(state)

	const graph = new astar.Graph(searchGrid)

	const players = state.players
	const goals = state.winnables

	// initialize array to store  path of GridNodes
	let astarResult = []
	// initialize array to store final path as possActions
	let actions = []

	for (let player of players) {
		for (let goal of goals) {
			const start = graph.grid[player.y][player.x]
			const end = graph.grid[goal.y][goal.x]
			// returns a list of GridNodes
			astarResult = astar.astar.search(graph, start, end)
			actions = convertPathToActions(astarResult)
			
			// stop if a solution has been found
			if (actions != []) {
				break
			}
		}
	}
  if (actions.length > 0) {
    console.log("Astar Result:\n" + actions)
  } else {
    console.log("Astar no result...")
  }
  
	return actions
}




function isOppositeAction(action1, action2) {
  if (action1 === "right" && action2 === "left" || action1 === "left" && action2 === "right" ||
  action1 === "up" && action2 === "down" || action1 === "down" && action2 === "up") return true;
  return false
}

class Creature {
  constructor() {
    this.diedAt = STEPS // Init to "infinity"
    this.actions = []
    this.fitness = {
      peakFitness: 0,
      atPosition: 0
    }
    this.score = 0
    this.fitnessHistory = []
  }

  addRandomActions(amount) {
    for (let i = 0; i < amount; i++) this.addAction();
    return this
  }
  
  addAction(action = possActions[Math.floor(Math.random() * possActions.length)]) {
    if (action === 'space') action = possActions[Math.floor(Math.random() * possActions.length)];
    this.actions.push(action)
    return this
  }

  optimizeGenesForParenthood() {
    // Make actions random past the position of peak fitness, to not give bad traits to child
    for (let i = this.fitness.atPosition + 1; i < this.actions.length; i++) {
      this.actions[i] = possActions[Math.floor(Math.random() * possActions.length)]
    }

    return this
  }  

  evaluateOverallFitness() {
    // Combine fitness history to a single overall fitness
    this.fitness = this.fitnessHistory.reduce((result, currentValue, index) => {
      return result.peakFitness <= currentValue ? {peakFitness: currentValue, atPosition: index} : result
    }, {peakFitness: 0, atPosition: undefined})

    // Fitness by avoiding useless back-and-forths
    this.score = this.fitness.peakFitness + (36 / this.actions.reduce((result, a) => {
      if (isOppositeAction(a, result.lastAction)) result.total++;
      result.lastAction = a
      return result
    }, {lastAction: "", total: 1}).total)


    return this
  }

  evaluateStateFitness(state) {
    let tempFitness = 0

    // Fitness by (naive / aerial) proximity
    const samples = []
    for (const player of state.players) {
      for (const winnable of state.winnables) {
        samples.push(Math.abs(player.x - winnable.x) + Math.abs(player.y - winnable.y))
      }
    }
    let average = (samples.reduce((a, b) => a + b, 0) / samples.length);
    if (average) {
      tempFitness += (150 / average) - 6
      //console.log(tempFitness) 
    }

    // Fitness by survival

    tempFitness += this.diedAt

    // Fitness by favorable rules
    const rules = []
    for (const rule of state.rules) {
      // A rule is a string like "baba-is-melt"
      const splitRule = rule.split('-')
      rules.push({
        object: splitRule[0],
        trait: splitRule[2]
      })
    }

    // good
    let winRules = 0
    let youRules = 0

    // bad
    let stopRules = 0
    let sinkRules = 0
    let killRules = 0
    let hotRules = 0
    let meltRules = 0

    for (const rule of rules) {
      switch(rule.trait) {
        case "win": winRules++; break;
        case "you": youRules++; break;
        case "stop": stopRules++; break;
        case "sink": sinkRules++; break;
        case "kill": killRules++; break;
        case "hot": hotRules++; break;
        case "melt": meltRules++; break;
        default: break;
      }
    }

    if (winRules) {
      tempFitness += 25
      tempFitness += (winRules - 1)
    }

    if (youRules) {
      tempFitness += 25
      tempFitness += (youRules - 1)
    }

    if (!stopRules) {
      tempFitness += 15
    } else {
      tempFitness += 3 / stopRules
    }

    if (!sinkRules) {
      tempFitness += 8
    } else {
      tempFitness += 3 / sinkRules
    }

    if (!killRules) {
      tempFitness += 10
    } else {
      tempFitness += 4 / killRules
    }

    if ((!hotRules) || (!meltRules)) {
      tempFitness += 10
    } else {
      tempFitness += 4 / hotRules
    }

    this.fitnessHistory.push(Math.floor(tempFitness))
    
    return this
  } 

  breed(secondCreature) {
    /* Given two creatures A, B with actions like:
    A.actions: ["left", "right", "pass"]
    B.actions: ["right", "right", "down", "pass", "pass"]
    The first three elements will be combined, as both creatures have an action for it.
    B, however, has two additional actions. These will be bred with random elements 
    */
    
    // for the the actions both have
    let combineCounter = 0

    // for combination with randomness
    //let randomCombineCounter = 0
    //let secondCreatureIsLonger = true

    if (this.actions.length >= secondCreature.actions.length) {
      combineCounter = secondCreature.actions.length
      //randomCombineCounter = this.actions.length - secondCreature.actions.length
      //secondCreatureIsLonger = false
    } else {
      combineCounter = this.actions.length
      //randomCombineCounter = secondCreature.actions.length - this.actions.length
    }

    const offspring = new Creature()

    for (let i = 0; i < combineCounter; i++) {
      if (Math.random() < 0.5) {
        offspring.actions.push(secondCreature.actions[i])
      } else {
        offspring.actions.push(this.actions[i])
      }
    }

    // for (let i = 0; i < randomCombineCounter; i++) {
    //   if (randomCombineCounter % 2 === 0) {
    //     if (secondCreatureIsLonger) {
    //       offspring.actions.push(secondCreature.actions[i])
    //     } else {
    //       offspring.actions.push(this.actions[i])
    //     }
    //   } else {
    //     offspring.actions.push(possActions[Math.floor(Math.random() * possActions.length)])
    //   }
    // }

    return offspring
  }

  mutate(n = 1) {
    // mutate n-many genes
    for (let i = 0; i < n; i++) {
      const k = Math.floor(Math.random() * this.actions.length)
      const j = Math.floor(Math.random() * possActions.length)
      this.actions[k] = possActions[j]
    }
    return this
  }
}

class Generation {
  constructor() {
    this.selectionPool = []
    this.creatures = []
    this.runsCompleted = 0
  }

  evaluateCreatures() {
    this.creatures.forEach((creature) => creature.evaluateOverallFitness().optimizeGenesForParenthood())
    return this
  } 

  createSelectionPool() {
    
    this.creatures.forEach((creature) => {
      // Add creature n times to mating pool, where n is the creature's fitness rating 
      for (let i = 0; i < creature.score; i++) {
        this.selectionPool.push(creature)
      }
    })

    return this
  }

  breedCreatures() {
    const children = []
    let creature1, creature2, child
    for (let i = 0; i < RUNS; i++) {
      //console.log(this.selectionPool)
      creature1 = this.selectionPool[Math.floor(Math.random() * this.selectionPool.length)]
      creature2 = this.selectionPool[Math.floor(Math.random() * this.selectionPool.length)]
      child = creature1.breed(creature2).mutate()
      children.push(child)
    }
    return children
  }
}

function prepareNextGeneration() {
  generations.push(new Generation())
  const nextGeneration = generations[generations.length - 1]
  const prevGeneration = generations[generations.length - 2]
  prevGeneration.evaluateCreatures().createSelectionPool()
  nextGeneration.creatures = prevGeneration.breedCreatures()
}

function runCreature(state, generation) {
  const creature = generation.creatures[generation.runsCompleted]
  let move
  for (let i = 0; i < creature.actions.length; i++) {
    move = simjs.nextMove(creature.actions[i], state)
    if (!move.next_state.players.length) {
      creature.diedAt = i
      creature.evaluateStateFitness(move.next_state)
      break
    }
    creature.evaluateStateFitness(move.next_state)
    if (move.won) break;
  }
  return {
    finalState: move.next_state,
    isWin: move.won,
    creature: creature
  }
}


// NEXT ITERATION STEP FOR SOLVING
function iter(initState) {
  // PERFORM ITERATIVE CALCULATIONS HERE //

  // before solving with the genetic algorithm, search for a direct path
  // using the astar algorithm
  if (generations.length === 1) {
    const state = cloneDeep(initState)
    const res = startAstar(state)
    if (res.length !== 0) return res;
  }


  const currentGen = generations[generations.length - 1]
  while (currentGen.runsCompleted < RUNS) {
    // Hard copy of the state
    const state = cloneDeep(initState)
    const runInformation = runCreature(state, currentGen)
    if (runInformation.isWin) return runInformation.creature.actions;
    currentGen.runsCompleted += 1
  }

  prepareNextGeneration()

  // return a sequence of actions or empty list
  return [];
}

// eslint-disable-next-line no-unused-vars
function initStack(initState) {
  generations.length = 0
  generations.push(new Generation())
  for (let i = 0; i < RUNS; i++) {
    generations[0].creatures.push(new Creature().addRandomActions(STEPS))
  }
}

// VISIBLE FUNCTION FOR OTHER JS FILES (NODEJS)
module.exports = {
  step(initState) { return iter(initState); },
  init(initState) { initStack(initState); },
  best_sol() { return generations[generations.length - 1].creatures[0].actions; }
};
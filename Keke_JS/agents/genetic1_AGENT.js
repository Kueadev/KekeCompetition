"use strict";

// deep copies objects
var cloneDeep = require('lodash.clonedeep');

// get imports (NODEJS)
const simjs = require('../js/simulation');

const possActions = ['space', 'right', 'up', 'left', 'down'];

const generations = []

// Runs (or amount of creatures) in a generation
const RUNS = 100

// Max amount of steps a creature takes
const STEPS = 50


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
      // Add creature n times to mating pool, where n is the creature's fitness rating.
      for (let i = 0; i < creature.score; i++) {
        this.selectionPool.push(creature)
      }
    })

    return this
  }

  breedCreatures() {
    // Choose creatures from selection pool and breed them.
    const children = []
    let creature1, creature2, child
    for (let i = 0; i < RUNS; i++) {
      creature1 = this.selectionPool[Math.floor(Math.random() * this.selectionPool.length)]
      creature2 = this.selectionPool[Math.floor(Math.random() * this.selectionPool.length)]
      child = creature1.breed(creature2).mutate()
      children.push(child)
    }
    return children
  }
}

function prepareNextGeneration() {
  // Create next generation
  generations.push(new Generation())
  const nextGeneration = generations[generations.length - 1]
  const prevGeneration = generations[generations.length - 2]

  // Breeding process
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


// This function is called for every generation.
function nextGeneration(initState) {
  // Determine current generation.
  const currentGen = generations[generations.length - 1]

  while (currentGen.runsCompleted < RUNS) {
    // Hard copy of the state
    const state = cloneDeep(initState)

    // Run a creature and check if successful
    const runInformation = runCreature(state, currentGen)
    if (runInformation.isWin) return runInformation.creature.actions;
    currentGen.runsCompleted += 1
  }

  prepareNextGeneration()

  // return a sequence of actions if successful or empty list if unsuccessful.
  return [];
}

// eslint-disable-next-line no-unused-vars
function initStack(initState) {
  // Here we initialize our agent before running.
  // We reset the generations array, in case it's not empty from running the previous level.
  // We add the first generation to the array. Further generations will be added on demand during iteration.
  generations.length = 0
  generations.push(new Generation())
  // We add our creatures whose genetic makeup is completely random to the first generation.
  for (let i = 0; i < RUNS; i++) {
    generations[0].creatures.push(new Creature().addRandomActions(STEPS))
  }
}

// These functions are exported, so that the simulator can access our agent.
module.exports = {
  step(initState) { return nextGeneration(initState); },
  init(initState) { initStack(initState); },
  best_sol() { return generations[generations.length - 1].creatures[0].actions; }
};
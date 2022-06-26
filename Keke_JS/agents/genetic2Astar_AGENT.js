"use strict";

// get imports (local)
const simjs = require('../js/simulation');
const Generation = require('../js/generation')
const Creature = require('../js/creature')
const astar = require('../js/astarKeke')

// deep copies objects
var cloneDeep = require('lodash.clonedeep');

const generations = []

// Runs (or amount of creatures) in a generation
const RUNS = 100

// Max amount of steps a creature takes
const STEPS = 80


function prepareNextGeneration() {
  // Create next generation
  generations.push(new Generation(RUNS))
  const nextGeneration = generations[generations.length - 1]
  const prevGeneration = generations[generations.length - 2]

  // Breeding process
  prevGeneration.evaluateCreatures().createProbabilityPool()
  nextGeneration.creatures = prevGeneration.breedCreaturesUsingProbabilityPool()
}

function runCreature(state, generation) {
  const creature = generation.creatures[generation.runsCompleted]
  let move
  for (let i = 0; i < creature.actions.length; i++) {
    move = simjs.nextMove(creature.actions[i], state)

    // Check if no actors left. 
    if (!move.next_state.players.length) {
      // Try to find a path using the Astar algorithm just before dying
      let path = astar(state)
      if (path.length) {
        const revisedActions = creature.actions.slice(0, i).concat(path)
        creature.actions = revisedActions
        return {
          isWin: true,
          creature: creature,
          solutionLength: i + path.length
        }
      }

      // die
      creature.diedAt = i
      creature.evaluateStateFitness(move.next_state)
      break
    }

    creature.evaluateStateFitness(move.next_state)

    if (move.won) return {
      isWin: true,
      creature: creature,
      solutionLength: i + 1
    };

    // Check if there's a rule change. If yes, apply Astar.
    if (state.rules.sort().join(',') !== move.next_state.rules.sort().join(',')) {
      let path = astar(move.next_state)
      if (path.length) {
        const revisedActions = creature.actions.slice(0, i + 1).concat(path)
        creature.actions = revisedActions
        return {
          isWin: true,
          creature: creature,
          solutionLength: i + 1 + path.length
        }
      }
    }

  }
  return {
    isWin: false,
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
    if (runInformation.isWin) return runInformation.creature.actions.slice(0, runInformation.solutionLength);
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
  generations.push(new Generation(RUNS))
  // We add our creatures whose genetic makeup is completely random to the first generation.
  for (let i = 0; i < RUNS; i++) {
    generations[0].creatures.push(new Creature(STEPS).addRandomActions(STEPS))
  }
}

// These functions are exported, so that the simulator can access our agent.
module.exports = {
  step(initState) { return nextGeneration(initState); },
  init(initState) { initStack(initState); },
  best_sol() { return generations[generations.length - 1].creatures[0].actions; }
};
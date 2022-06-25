"use strict";

class Generation {
    constructor(RUNS) {
      this.runs = RUNS
			this.creatures = []
      this.runsCompleted = 0

			// Either use selection or probability pool, not both.
      this.selectionPool = []
			this.probabilityPool = []
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

		createProbabilityPool() {
			// Calculate array sum (normalizer) and fill probabilities array with odds of being selected for breeding.
			const normalizer = this.creatures.reduce((sum, creature) => sum + creature.score, 0)
      this.creatures.forEach((creature) => this.probabilityPool.push(creature.score / normalizer))
      return this
    }
  
    breedCreaturesUsingSelectionPool() {
      // Choose creatures from selection pool and breed them.
      const children = []
      let creature1, creature2, child
      for (let i = 0; i < this.runs; i++) {
        creature1 = this.selectionPool[Math.floor(Math.random() * this.selectionPool.length)]
        creature2 = this.selectionPool[Math.floor(Math.random() * this.selectionPool.length)]
        child = creature1.breed(creature2).mutate()
        children.push(child)
      }
      return children
    }

		breedCreaturesUsingProbabilityPool() {
			const helper = (result, currentValue, index) => {
				if (result.index === -1 && result.total + currentValue >= result.randomValue) result.index = index;
				return { randomValue: result.randomValue, total: result.total + currentValue, index: result.index }
			}

			const helperInit = (randomNumber) => { return { randomValue: randomNumber, total: 0, index: -1 } }

      // Choose creatures from selection pool and breed them.
      const children = []
      let creature1, creature2, child
      for (let i = 0; i < this.runs; i++) {
        creature1 = this.creatures[this.probabilityPool.reduce(helper, helperInit(Math.random())).index]
        creature2 = this.creatures[this.probabilityPool.reduce(helper, helperInit(Math.random())).index]
        child = creature1.breed(creature2).mutate()
        children.push(child)
      }
      return children
    }


}

module.exports = Generation

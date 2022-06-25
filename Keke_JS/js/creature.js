'use strict';

const possActions = ['space', 'right', 'up', 'left', 'down'];

class Creature {
    constructor(STEPS) {
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
        if (this.isOppositeAction(a, result.lastAction)) result.total++;
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
  
      const offspring = new Creature(this.STEPS)
  
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

    isOppositeAction(action1, action2) {
        if (action1 === "right" && action2 === "left" || action1 === "left" && action2 === "right" ||
        action1 === "up" && action2 === "down" || action1 === "down" && action2 === "up") return true;
        return false
      }
}


module.exports = Creature


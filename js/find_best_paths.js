var factors20 = {2: 2, 5: 1};

function findBestPaths() {
  for(let i = 21; i <= 10000; i++) {
    if(i == 160) {
      console.log("debug here");
    }
    approximations[i] = findFactorApprox(i);
    if(approximations[i] !== null) {
      updateLowerApprox(i);
    }
  }
}

function updateLowerApprox(value) {
  let approx = approximations[value];
  let approxCost = approx.cost;
  if(approx.operation instanceof Multiply || approx.operation instanceof Factor) {
    // See if rerolling this die improves the value of a lower die
    let lowerValue = value - 1;
    while(lowerValue > 20) {
      let lowerApprox = approximations[lowerValue];
      let primeFactors = lowerApprox === null ? getPrimeFactors(lowerValue) : lowerApprox.primeFactors;
      let cost = approxCost * (1 + expectedRerolls(value, lowerValue));
      if(lowerApprox === null || cost < lowerApprox.cost || floatEquals(cost, lowerApprox.cost)) {
        approximations[lowerValue] = new DieApprox(lowerValue, primeFactors, new Reroll(value, lowerValue));
      } else {
        break;
      }
      lowerValue -= 1;
    }
  } else {
    // Go back and see if factoring this die lowers the cost of a lower die.
    let allFactors = getAllFactors(value, approx.primeFactors);
    for(let factor of allFactors) {
      if(factor > 20) {
        let lowerApprox = approximations[factor];
        let primeFactors = lowerApprox === null ? getPrimeFactors(factor) : lowerApprox.primeFactors;
        if(lowerApprox == null || approxCost < lowerApprox.cost) {
          approximations[factor] = new DieApprox(factor, primeFactors, new Factor(value));
        }
      }
    }
  }
}

function findFactorApprox(value) {
  let primeFactors = getPrimeFactors(value);
  let allFactors = getAllFactors(value, primeFactors);
  let factorPairs = getFactorPairs(value, allFactors);
  
  let bestApprox = null;
  // Get approximations by multiplying lower dice
  for(let pair of factorPairs) {
    let approx1 = approximations[pair[0]];
    let approx2 = approximations[pair[1]];
    if(approx1 === null || approx2 === null) {
      return null;
    }
    let cost = approx1.cost + approx2.cost;
    if(bestApprox === null || cost < bestApprox.cost) {
      bestApprox = new DieApprox(value, primeFactors, new Multiply(approx1.value, approx2.value));
    }
  }
  return bestApprox;
}

function getPrimeFactors(value) {
  let factors = {};
  for(var i = 2; i <= value; i++) {
    while(value % i == 0) {
      if(factors.hasOwnProperty(i)) {
        factors[i]++;
      } else {
        factors[i] = 1;
      }
      value /= i;
    }
  }
  return factors;
}

function getAllFactors(value, primeFactors) {
  primeFactors = primeFactorsToList(primeFactors);
  if(primeFactors.length < 2) {
    return new Set();
  }
  let allFactors = new Set([1, primeFactors[0]]);
  for(let i = 1; i < primeFactors.length; i++) {
    let newFactors = new Set();
    let set2 = new Set([1, primeFactors[i]]);
    for(let f1 of allFactors) {
      for(let f2 of set2) {
        newFactors.add(f1 * f2);
      }
    }
    allFactors = newFactors;
  }
  allFactors.delete(1);
  allFactors.delete(value);
  return allFactors;
}

function getFactorPairs(value, allFactors) {
  let factorList = Array.from(allFactors).sort((a, b) => a - b);
  let factorPairs = {};
  for(let factor of factorList) {
    let partner = Math.floor(value / factor);
    if(factorPairs.hasOwnProperty(partner)) {
      break;
    }
    factorPairs[factor] = partner;
  }
  let pairList = [];
  for(let k in factorPairs) {
    pairList.push([k, factorPairs[k]]);
  }
  return pairList;
}

function primeFactorsToList(primeFactors) {
  let list = [];
  for(let k in primeFactors) {
    for(let i = 0; i < primeFactors[k]; i++) {
      list.push(k);
    }
  }
  return list;
}

function getCost(die, operations) {
  let cost = 1;
  for(let operation of operations) {
    let code = operation.shift();
    let targetDie
  }
}

function expectedRerolls(actualDie, targetDie) {
  return (actualDie - targetDie) / targetDie;
}

function floatEquals(f1, f2) {
  return Math.abs(f1 - f2) < 0.00001;
}

function printApproximations() {
  let output = [];
  output.push("const approximations = {");
  for(let i = 1; i <= 10000; i++) {
    let approx = approximations[i];
    if(approx === null || approx === undefined) {
      console.log(i);
    }
    let opstring = "new Identity()";
    if(approx.operation instanceof Multiply) {
      opstring = `new Multiply(${approx.operation.approx1}, ${approx.operation.approx2})`;
    } else if(approx.operation instanceof Factor) {
      opstring = `new Factor(${approx.operation.source}, ${approx.operation.target})`;
    } else if(approx.operation instanceof Reroll) {
      opstring = `new Reroll(${approx.operation.source}, ${approx.operation.target})`;
    }
    output.push(`  ${i}: new DieApprox(${i}, ${JSON.stringify(approx.primeFactors)}, ${opstring}),`)
  }
  output.push("}");
  
  let link = document.createElement("a");
  let file = new Blob([output.join("\n")], { type: 'text/plain' });
  link.href = URL.createObjectURL(file);
  link.download = "approximations.txt";
  link.click();
  URL.revokeObjectURL(link.href);
}

class DieApprox {
  constructor(value, primeFactors, operation) {
    this.value = value;
    this.primeFactors = primeFactors;
    this.operation = operation;
  }
  
  get cost() {
    return this.operation.cost;
  }
}

class Reroll {
  constructor(source, target) {
    this.source = source;
    this.target = target;
  }
  
  get cost() {
    return (1 + expectedRerolls(this.source, this.target)) * approximations[this.source].cost;
  }
}

class Factor {
  constructor(source, target) {
    this.source = source;
    this.target = target;
  }
  
  get cost() {
    return approximations[this.source].cost;
  }
}

class Multiply {
  constructor(approx1, approx2) {
    this.approx1 = approx1;
    this.approx2 = approx2;
  }
  
  get cost() {
    return approximations[this.approx1].cost + approximations[this.approx2].cost;
  }
}

class Identity {
  get cost() {
    return 1;
  }
}

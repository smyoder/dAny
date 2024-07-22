let factors = [2, 4, 5, 10, 20];
let goodFactors = {};
for(let multo = 2; multo < 12; multo++) {
  let numFactors = Math.pow(5, multo);
  for(let i = 0; i < numFactors; i++) {
    let product = 1;
    let bigIdx = i;
    for(let j = 0; j < multo; j++) {
      product *= factors[bigIdx % 5];
      if(product > 1000000) {
        break;
      }
      bigIdx = Math.floor(bigIdx / 5);
    }
    if(product > 1000000) {
      continue;
    }
    if(!goodFactors.hasOwnProperty(product)) {
      goodFactors[product] = multo;
    }
  }
  console.log(multo);
}
console.log(goodFactors);

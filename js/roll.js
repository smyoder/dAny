function rollButtonClicked() {
  let parseTree = parseRoll();
  let output = [];
  try {
    let [dom, value] = processValueNode(parseTree, output, false);
    let outputContainer = document.getElementById("rollOutput");
    let displayContainer = document.getElementById("rollDisplay");
    while (outputContainer.hasChildNodes()) {
      outputContainer.removeChild(outputContainer.firstChild);
    }
    while (displayContainer.hasChildNodes()) {
      displayContainer.removeChild(displayContainer.firstChild);
    }
    let outputDiv = document.createElement("div");
    outputDiv.innerHTML = output.join("");
    outputContainer.appendChild(outputDiv);
    let valueDiv = document.createElement("div");
    valueDiv.innerHTML = `${value}`;
    outputContainer.appendChild(valueDiv);
    
    displayContainer.appendChild(dom);
  } catch(e) {
    if(e != "errorShown") {
      throw e;
    }
  }
}

function processValueNode(valueNode, output) {
  let value = 0;
  let minus = false;
  let dom = null;
  let parentDOM = document.createElement("div");
  
  for(let child of valueNode.children) {
    let nextValue = 0;
    let div = document.createElement("div");
    switch(child.type) {
      case "die":
        [dom, nextValue] = processDieNode(child, output);
        nextValue++;
        div.appendChild(dom);
        parentDOM.appendChild(div);
        break;
      case "operator":
        minus = child.value == '-';
        output.push(` ${child.value} `);
        div.style.fontSize = "30px";
        div.innerHTML = child.value;
        parentDOM.appendChild(div);
        nextValue = 0;
        break;
      case "number":
        output.push(child.value);
        nextValue = child.value;
        div.style.fontSize = "30px";
        div.innerHTML = nextValue;
        parentDOM.appendChild(div);
        break;
    }
    value += minus ? -nextValue : nextValue;
  }
  return [parentDOM, value];
}

function processDieNode(node, output) {
  if(node.children[1].value > 10000 || node.children[1].value < 1) {
    alert("The value of the die must be greater than zero and less than ten thousand one");
    throw "errorShown";
  }
  let value = 0;
  let parentDOM = document.createElement("div");
  let div = document.createElement("div");
  let [dom, roll] = d20Approx(node.children[1].value);
  output.push(`[${roll + 1}`);
  value += roll;
  div.appendChild(dom);
  parentDOM.appendChild(div);
  for(let i = 1; i < node.children[0].value; i++) {
    div = document.createElement("div");
    div.style.fontSize = "30px";
    div.innerHTML = "+";
    parentDOM.appendChild(div);
    div = document.createElement("div");
    [dom, roll] = d20Approx(node.children[1].value);
    output.push(`, ${roll + 1}`);
    value += roll + 1;
    div.appendChild(dom);
    parentDOM.appendChild(div);
  }
  output.push("]");
  return [parentDOM, value];
}

function d20Approx(die, parentDOM) {
  if(die == 20) {
    let value = randInt(die);
    return [makeD20DOM(value), value];
  } else {
    let approx = approximations[die];
    if(approx.operation instanceof Multiply) {
      let [dom1, value1] = d20Approx(approx.operation.approx1);
      let [dom2, value2] = d20Approx(approx.operation.approx2);
      let value = value1 * approx.operation.approx2 + value2;
      let multiplyDOM = makeMultiplyDOM(dom1, dom2, approx.value, value);
      return [multiplyDOM, value];
    } else if(approx.operation instanceof Factor) {
      let [dom, value] = d20Approx(approx.operation.source);
      let myValue = value % die;
      let factorDOM = makeFactorDOM(dom, approx.value, myValue);
      return [factorDOM, myValue];
    } else if(approx.operation instanceof Reroll) {
      let doms = [];
      let values = [];
      let [dom, value] = d20Approx(approx.operation.source);
      while(value >= die) {
        doms.push(dom);
        values.push(value);
        [dom, value] = d20Approx(approx.operation.source);
      }
      doms.push(dom);
      values.push(value);
      let rerollDOM = makeRerollDOM(doms, approx.value, values);
      return [rerollDOM, value];
    }
  }
}

function randInt(max) {
  return Math.floor(Math.random() * max);
}

function makeMultiplyDOM(child1, child2, die, value) {
  let dom = document.getElementById("multiply-template").cloneNode(true);
  dom.id = "";
  let factorTitle = dom.querySelector(".operation-title");
  factorTitle.innerHTML += ` (D${die})`;
  let arguments = dom.querySelectorAll(".argument");
  arguments[0].appendChild(child1);
  arguments[2].appendChild(child2);
  arguments[4].innerHTML = value + 1;
  return dom;
}

function makeFactorDOM(child, die, value) {
  let dom = document.getElementById("factor-template").cloneNode(true);
  dom.id = "";
  let factorTitle = dom.querySelector(".operation-title");
  factorTitle.innerHTML += ` (D${die})`;
  let arguments = dom.querySelectorAll(".argument");
  arguments[0].appendChild(child);
  arguments[2].innerHTML = value + 1;
  return dom;
}

function makeRerollDOM(children, die, values) {
  let dom = document.getElementById("reroll-template").cloneNode(true);
  dom.id = "";
  let factorTitle = dom.querySelector(".operation-title");
  factorTitle.innerHTML += ` (D${die})`;
  
  let innerOp = dom.querySelector(".inner-operation");
  dom.removeChild(innerOp);
  for(let i = 0; i < children.length - 1; i++) {
    let copyOp = innerOp.cloneNode(true);
    let arguments = copyOp.querySelectorAll(".argument");
    arguments[0].appendChild(children[i]);
    arguments[2].innerHTML = values[i] + 1;
    arguments[2].style.textDecoration = "line-through";
    arguments[2].style.color = "red";
    dom.appendChild(copyOp);
  }
  let copyOp = innerOp.cloneNode(true);
  let arguments = copyOp.querySelectorAll(".argument");
  arguments[0].appendChild(children[children.length - 1]);
  arguments[2].innerHTML = values[values.length - 1] + 1;
  dom.appendChild(copyOp);
  
  return dom;
}

function makeD20DOM(value) {
  let dom = document.getElementById("d20-template").cloneNode(true);
  dom.querySelector("span").innerHTML = value + 1;
  return dom;
}
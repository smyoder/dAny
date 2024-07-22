function parseRoll() {
  parseTree = null;
  let roll = document.getElementById("rollInput").value;
  let root = new ParseTree("roll");
  let idx = parseWhitespace(roll, 0);
  if(roll.substring(idx) == "") {
    alert("A roll value must be entered.");
    return;
  }
  let child = null;
  idx = parseValue(roll, idx, root);
  parseWhitespace(roll, idx);
  if(idx < roll.length) {
    showError(roll, idx, "Invalid character");
  }
  parseTree = root;
  return root;
}

function parseValue(roll, idx, parent) {
  if(isDigit(getChar(roll, idx))) {
    idx = parseDie(roll, idx, parent);
    idx = parseWhitespace(roll, idx);
    if(idx < roll.length) {
      let c = getChar(roll, idx);
      if(isOperator(c)) {
        parent.addChild(new ParseTree("operator", c));
        idx++;
        idx = parseWhitespace(roll, idx);
        idx = parseValue(roll, idx, parent);
      }
    }
  } else {
    showError(roll, idx, "A number was expected.");
  }
  return idx;
}

function parseDie(roll, idx, parent) {
  let die = new ParseTree("die");
  idx = parseNumber(roll, idx, die);
  if(idx < roll.length && getChar(roll, idx).toLowerCase() == "d") {
    idx++;
    parent.addChild(die);
    idx = parseNumber(roll, idx, die);
  } else {
    parent.addChild(die.children[0]);
  }
  idx = parseWhitespace(roll, idx);
  return idx;
}

function parseNumber(roll, idx, parent) {
  let number = new ParseTree("number", 0);
  parent.addChild(number);
  while(idx < roll.length) {
    let c = getChar(roll, idx);
    if(!isDigit(c))
    {
      break;
    }
    number.addDigit(c);
    idx++;
  }
  return idx;
}

function parseWhitespace(roll, idx) {
  while(idx < roll.length && isWhitespace(roll[idx])) {
    idx++;
  }
  return idx;
}

function getChar(roll, idx) {
  if(idx >= roll.length) {
    showError(roll, roll.length, "Additional input was expected.");
  }
  return roll[idx];
}

function toDigit(c) {
  return c.charCodeAt(0) - 48;
}

function isDigit(c) {
  return /\d/.test(c);;
}

function isWhitespace(c) {
  return /\s/.test(c);
}

function isOperator(c) {
  return /[+-]/.test(c);
}

function showError(roll, idx, msg) {
  alert(`${msg}:\n ${roll.substring(0, idx)}[${roll[idx]}]${roll.substring(idx + 1)}`);
  throw "errorShown";
}

class ParseTree {
  constructor(type, value) {
    this.parent = null;
    this.children = [];
    this.type = type;
    if(value !== undefined) {
      this.value = value;
    }
  }
  
  addChild(child) {
    child.parent = this;
    this.children.push(child);
  }
  
  addDigit(c) {
    this.value = this.value * 10 + toDigit(c);
  }
}
function createArray(length) {
  return Array(length).fill(0);
}

function createOrderedArray(startNumber, size, step = 1) {
  return createArray(size).map((_, index) => startNumber + (index * step));
}

function copyObject(object) {
  return JSON.parse(JSON.stringify(object));
}

function fixNumber(number) {
  return Number(number.toFixed(2));
}

export { createArray, createOrderedArray, copyObject, fixNumber };

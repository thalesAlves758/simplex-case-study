import data from './data.json' with { type: 'json' };

import { createArray, copyObject } from "./utils.js";
import { buildInitialMatrix, getPivotsIndexes, scaleMatrix } from './matrixUtils.js';

const {
  matrix,
  artificialVariablesIndexes,
  coefficientsIndexes,
  columnLabelIndex,
  independentTermsColumnIndex,
  lineLabelIndex,
  slackVariablesIndexes,
  zLineIndex
} = buildInitialMatrix(data);

const updatedMatrix = getMatrixWithNewZLine({ matrix, zLineIndex, artificialVariablesIndexes, lineLabelIndex, columnLabelIndex });

// first phase
let resultMatrix = updatedMatrix;

while (hasArtificialLine(resultMatrix, columnLabelIndex)) {
  let { pivotColumnIndex, pivotLineIndex } = getPivotsIndexes({
    matrix: resultMatrix,
    columnLabelIndex,
    lineLabelIndex,
    zLineIndex: resultMatrix.length - 1,
    independentTermsColumnIndex
  });

  resultMatrix = scaleMatrix({
    matrix: resultMatrix,
    columnLabelIndex,
    independentTermsColumnIndex,
    lineLabelIndex,
    pivotColumnIndex,
    pivotLineIndex
  });
}

resultMatrix = removeTwoPhasesLinesAndColumns(resultMatrix, columnLabelIndex, artificialVariablesIndexes);

// second phase
while (hasNegativeTermInZLine(resultMatrix, zLineIndex, columnLabelIndex, independentTermsColumnIndex)) {
  let { pivotColumnIndex, pivotLineIndex } = getPivotsIndexes({
    matrix: resultMatrix,
    columnLabelIndex,
    lineLabelIndex,
    zLineIndex,
    independentTermsColumnIndex
  });

  resultMatrix = scaleMatrix({
    matrix: resultMatrix,
    columnLabelIndex,
    independentTermsColumnIndex,
    lineLabelIndex,
    pivotColumnIndex,
    pivotLineIndex
  });
}

console.table(resultMatrix);

function getMatrixWithNewZLine({ matrix, zLineIndex, artificialVariablesIndexes, lineLabelIndex, columnLabelIndex }) {
  const matrixCopy = copyObject(matrix);

  const newZLine = createArray(matrix[zLineIndex].length);

  newZLine[columnLabelIndex] = "z'";

  matrix.forEach((matrixLine, index) => {
    if (index === lineLabelIndex || index === zLineIndex || !isArtificialLine(matrixLine, columnLabelIndex)) return;

    matrixLine.forEach((matrixLineItem, lineItemIndex) => {
      let isArtificialVariable = artificialVariablesIndexes.includes(lineItemIndex);

      if (lineItemIndex === columnLabelIndex || isArtificialVariable) return;

      newZLine[lineItemIndex] -= matrixLineItem;
    });
  });

  matrixCopy.push(newZLine);

  return matrixCopy;
}

function hasArtificialLine(matrix, columnLabelIndex) {
  return matrix.some(line => isArtificialLine(line, columnLabelIndex));
}

function isArtificialLine(line, columnLabelIndex) {
  return line[columnLabelIndex].startsWith('a');
}

function removeTwoPhasesLinesAndColumns(matrix, columnLabelIndex, artificialVariablesIndexes) {
  let matrixCopy = copyObject(matrix);

  matrixCopy = matrixCopy.filter(line => line[columnLabelIndex] !== "z'");

  return matrixCopy.map(line =>
    line.filter((_, columnIndex) => !artificialVariablesIndexes.includes(columnIndex))
  );
}

function hasNegativeTermInZLine(matrix, zLineIndex, columnLabelIndex, independentTermsColumnIndex) {
  return matrix[zLineIndex].some((lineItem, columnIndex) =>
    columnIndex !== columnLabelIndex && columnIndex !== independentTermsColumnIndex && lineItem < 0
  );
}

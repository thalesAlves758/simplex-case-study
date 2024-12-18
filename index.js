import data from './data.json' with { type: 'json' };

import { createArray, copyObject } from "./utils.js";
import { buildInitialMatrix } from './matrixUtils.js';

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

console.table(updatedMatrix);

function getMatrixWithNewZLine({ matrix, zLineIndex, artificialVariablesIndexes, lineLabelIndex, columnLabelIndex }) {
  const matrixCopy = copyObject(matrix);

  const newZLine = createArray(matrix[zLineIndex].length);

  newZLine[columnLabelIndex] = "Z'";

  matrix.forEach((matrixLine, index) => {
    let isArtificalLine = matrixLine[columnLabelIndex].startsWith('a');

    if (index === lineLabelIndex || index === zLineIndex || !isArtificalLine) return;

    matrixLine.forEach((matrixLineItem, lineItemIndex) => {
      let isArtificialVariable = artificialVariablesIndexes.includes(lineItemIndex);

      if (lineItemIndex === columnLabelIndex || isArtificialVariable) return;

      newZLine[lineItemIndex] -= matrixLineItem;
    });
  });

  matrixCopy.push(newZLine);

  return matrixCopy;
}

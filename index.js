import data from './data.json' with { type: 'json' };

import { createArray, copyObject, renderTable } from "./utils.js";
import { buildInitialMatrix, getPivotsIndexes, scaleMatrix } from './matrixUtils.js';

// utiliza função de construir matriz inicial
const {
  matrix,
  artificialVariablesIndexes,
  columnLabelIndex,
  independentTermsColumnIndex,
  lineLabelIndex,
  zLineIndex
} = buildInitialMatrix(data);

renderTable(matrix, lineLabelIndex, columnLabelIndex, 'Quadro inicial');

// adiciona a linha do z'
const updatedMatrix = getMatrixWithNewZLine({ matrix, zLineIndex, artificialVariablesIndexes, lineLabelIndex, columnLabelIndex });

renderTable(updatedMatrix, lineLabelIndex, columnLabelIndex, 'Após adição de nova linha Z', {
  lineIndexes: [updatedMatrix.length - 1],
  lineBgHighlight: "yellow"
});

// first phase
let notFoundAvailableSolution = false;
let resultMatrix = updatedMatrix;

// enquanto houver linhas artificiais
while (hasArtificialLine(resultMatrix, columnLabelIndex)) {
  // obtém os indices da linha e da coluna pivô
  let { pivotColumnIndex, pivotLineIndex } = getPivotsIndexes({
    matrix: resultMatrix,
    columnLabelIndex,
    lineLabelIndex,
    zLineIndex: resultMatrix.length - 1,
    independentTermsColumnIndex
  });

  if (pivotColumnIndex === null || pivotLineIndex === null) {
    notFoundAvailableSolution = true;
    break;
  }

  renderTable(resultMatrix, lineLabelIndex, columnLabelIndex, 'Linha/Coluna Pivô escolhidas', {
    lineIndexes: [pivotLineIndex],
    columnIndexes: [pivotColumnIndex],
  });

  // escalona matriz passando os indices recebidos
  resultMatrix = scaleMatrix({
    matrix: resultMatrix,
    columnLabelIndex,
    independentTermsColumnIndex,
    lineLabelIndex,
    pivotColumnIndex,
    pivotLineIndex
  });

  renderTable(resultMatrix, lineLabelIndex, columnLabelIndex, 'Após escalonamento', {
    lineIndexes: [pivotLineIndex],
    columnBgHighlight: "green",
    columnIndexes: [pivotColumnIndex],
    lineBgHighlight: "green"
  });
}

if (notFoundAvailableSolution) {
  renderTable(resultMatrix, lineLabelIndex, columnLabelIndex, 'Não foi encontrada uma solução viável', {
    lineIndexes: [pivotLineIndex],
    columnIndexes: [pivotColumnIndex],
  });
  throw 'Não foi encontrada uma solução viável';
}

renderTable(resultMatrix, lineLabelIndex, columnLabelIndex, `Linhas/Colunas a serem removidas (após 1ª fase)`, {
  lineIndexes: [resultMatrix.length - 1],
  columnBgHighlight: "red",
  columnIndexes: artificialVariablesIndexes,
  lineBgHighlight: "red"
});

resultMatrix = removeTwoPhasesLinesAndColumns(resultMatrix, columnLabelIndex, artificialVariablesIndexes);

renderTable(resultMatrix, lineLabelIndex, columnLabelIndex, `Resultado da remoção`);

let currentIndependentTermColumnIndex = resultMatrix[lineLabelIndex].indexOf('b');

// second phase
while (hasNegativeTermInZLine(resultMatrix, zLineIndex, columnLabelIndex, independentTermsColumnIndex)) {
  // obtém os indices da linha e da coluna pivô
  let { pivotColumnIndex, pivotLineIndex } = getPivotsIndexes({
    matrix: resultMatrix,
    columnLabelIndex,
    lineLabelIndex,
    zLineIndex,
    independentTermsColumnIndex: currentIndependentTermColumnIndex  
  });

  if (pivotColumnIndex === null || pivotLineIndex === null) {
    notFoundAvailableSolution = true;
    break;
  }

  renderTable(resultMatrix, lineLabelIndex, columnLabelIndex, 'Linha/Coluna Pivô escolhidas', {
    lineIndexes: [pivotLineIndex],
    columnIndexes: [pivotColumnIndex],
  });

  // escalona matriz passando os indices recebidos
  resultMatrix = scaleMatrix({
    matrix: resultMatrix,
    columnLabelIndex,
    independentTermsColumnIndex: currentIndependentTermColumnIndex,
    lineLabelIndex,
    pivotColumnIndex,
    pivotLineIndex,
  });

  renderTable(resultMatrix, lineLabelIndex, columnLabelIndex, 'Após escalonamento', {
    lineIndexes: [pivotLineIndex],
    columnBgHighlight: "green",
    columnIndexes: [pivotColumnIndex],
    lineBgHighlight: "green"
  });
}

if (notFoundAvailableSolution) {
  renderTable(resultMatrix, lineLabelIndex, columnLabelIndex, 'Não foi encontrada uma solução viável', {
    lineIndexes: [pivotLineIndex],
    columnIndexes: [pivotColumnIndex],
  });

  throw 'Não foi encontrada uma solução viável';
}

renderTable(resultMatrix, lineLabelIndex, columnLabelIndex, 'Tabela final');

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

import { copyObject, createArray, createOrderedArray, fixNumber } from "./utils.js";

function buildInitialMatrix(data) {
  const { inputConsumption, availability, lucrativity, preorders } = data;

  const inputConsumptionKeys = Object.keys(inputConsumption);
  const preordersKeys = Object.keys(preorders);

  const baseLabel = ['base'];
  const variablesLabels = Object.keys(lucrativity);
  const artificialVariablesLabels = createArray(preordersKeys.length);
  const slackVariablesLabels = createArray(inputConsumptionKeys.length + preordersKeys.length);
  const variablesCount = variablesLabels.length;
  const independentTermsLabel = ['b'];

  const coefficientsLines = [];
  const slackVariablesLines = [];
  const artificialVariablesLines = [];
  const independentTerms = [];
  const basicVariablesLines = [];
  const zLine = [];

  variablesLabels.forEach(lucrativityKey => {
    zLine.push(-lucrativity[lucrativityKey]);
  });

  inputConsumptionKeys.forEach((consumptionKey, index) => {
    let coefficientsline = createArray(variablesCount);

    Object.keys(inputConsumption[consumptionKey]).forEach(variableConsumptionKey => {
      let lineVariableIndex = variablesLabels.indexOf(variableConsumptionKey);

      coefficientsline[lineVariableIndex] = inputConsumption[consumptionKey][variableConsumptionKey];
    });

    let slackVariablesLine = createArray(slackVariablesLabels.length);
    slackVariablesLine[index] = 1;
    slackVariablesLabels[index] = `f${index + 1}`;
    basicVariablesLines.push([slackVariablesLabels[index]]);

    zLine.push(0);

    coefficientsLines.push(coefficientsline);
    slackVariablesLines.push(slackVariablesLine);
    artificialVariablesLines.push(createArray(artificialVariablesLabels.length));
    independentTerms.push([availability[consumptionKey]]);
  });

  preordersKeys.forEach((preorderKey, index) => {
    let coefficientsline = createArray(variablesCount);
    let coefficientsLineIndex = variablesLabels.indexOf(preorderKey);
    coefficientsline[coefficientsLineIndex] = 1;

    let slackVariablesLine = createArray(slackVariablesLabels.length);
    slackVariablesLine[inputConsumptionKeys.length + index] = -1;
    slackVariablesLabels[inputConsumptionKeys.length + index] = `f${inputConsumptionKeys.length + index + 1}`;
    zLine.push(0);

    let artificialVariablesLine = createArray(artificialVariablesLabels.length);
    artificialVariablesLine[index] = 1;
    artificialVariablesLabels[index] = `a${index + 1}`;
    basicVariablesLines.push([artificialVariablesLabels[index]]);
    zLine.push(0);

    coefficientsLines.push(coefficientsline);
    slackVariablesLines.push(slackVariablesLine);
    artificialVariablesLines.push(artificialVariablesLine);
    independentTerms.push([preorders[preorderKey]]);
  });

  zLine.push(0);

  setHeader(coefficientsLines, variablesLabels);
  setHeader(slackVariablesLines, slackVariablesLabels);
  setHeader(artificialVariablesLines, artificialVariablesLabels);
  setHeader(independentTerms, independentTermsLabel);
  setHeader(basicVariablesLines, baseLabel);

  const finalMatrix = joinMatrixes(basicVariablesLines, coefficientsLines, slackVariablesLines, artificialVariablesLines, independentTerms);
  finalMatrix.push(['z', ...zLine]);

  return {
    matrix: finalMatrix,
    columnLabelIndex: 0,
    lineLabelIndex: 0,
    independentTermsColumnIndex: finalMatrix[0].length - 1,
    zLineIndex: finalMatrix.length - 1,
    coefficientsIndexes: createOrderedArray(baseLabel.length, variablesLabels.length),
    slackVariablesIndexes: createOrderedArray((baseLabel.length + variablesLabels.length), slackVariablesLabels.length),
    artificialVariablesIndexes: createOrderedArray((baseLabel.length + variablesLabels.length + slackVariablesLabels.length), artificialVariablesLabels.length)
  };
}

function joinMatrixes(...matrixes) {
  return matrixes.reduce((result, matrixToAdd) => {
    matrixToAdd.forEach((line, lineIndex) => {
      if (!result[lineIndex]?.length) {
        result[lineIndex] = line;
        return;
      }

      result[lineIndex] = result[lineIndex].concat(line);
    });

    return result;
  }, []);
}

function setHeader(matrix, headerLine) {
  matrix.unshift(headerLine);
}

function getPivotsIndexes({ matrix, lineLabelIndex, columnLabelIndex, zLineIndex, independentTermsColumnIndex }) {
  const matrixCopy = copyObject(matrix);

  const pivotColumnIndex = getPivotColumnIndex(matrixCopy[zLineIndex], columnLabelIndex, independentTermsColumnIndex);
  const pivotLineIndex = getPivotLineIndex(matrixCopy, lineLabelIndex, independentTermsColumnIndex, pivotColumnIndex, columnLabelIndex);

  return {
    pivotColumnIndex,
    pivotLineIndex
  };
}

function getPivotColumnIndex(zLine, columnLabelIndex, independentTermsColumnIndex) {
  return zLine.reduce((negativeTermIndex, currentTerm, index) => {
    if (index === columnLabelIndex || index === independentTermsColumnIndex || currentTerm >= 0) {
      return negativeTermIndex;
    }

    return (!negativeTermIndex || currentTerm < zLine[negativeTermIndex]) ? index : negativeTermIndex;
  }, null);
}

function getPivotLineIndex(matrix, lineLabelIndex, independentTermsColumnIndex, pivotColumnIndex, columnLabelIndex) {
  let lowerProductionFactor;

  return matrix.reduce((pivotLineIndex, line, index) => {
    if (index === lineLabelIndex || isZLine(line, columnLabelIndex)) {
      return pivotLineIndex;
    }

    let lineIndependentTerm = line[independentTermsColumnIndex];

    if (lineIndependentTerm < 0) {
      return pivotLineIndex;
    }

    let productionFactor = lineIndependentTerm / line[pivotColumnIndex];

    if (productionFactor >= lowerProductionFactor) {
      return pivotLineIndex;
    }

    lowerProductionFactor = productionFactor;
    return index;
  }, null);
}

function scaleMatrix({ matrix, pivotColumnIndex, pivotLineIndex, lineLabelIndex, columnLabelIndex, independentTermsColumnIndex }) {
  let matrixCopy = copyObject(matrix);

  matrixCopy[pivotLineIndex] = matrixCopy[pivotLineIndex].map((lineItem, index, line) => {
    if (index === columnLabelIndex) {
      return lineItem;
    }

    return lineItem / line[pivotColumnIndex];
  });

  matrixCopy = matrixCopy.map((line, lineIndex) => {
    if (lineIndex === lineLabelIndex || lineIndex === pivotLineIndex) {
      return line;
    }

    let oldLinePivotValue = line[pivotColumnIndex];

    return line.map((lineItem, columnIndex) => {
      if (columnIndex === columnLabelIndex) {
        return lineItem;
      }

      return fixNumber(lineItem - (oldLinePivotValue * matrixCopy[pivotLineIndex][columnIndex]));
    });
  });

  matrixCopy[pivotLineIndex][columnLabelIndex] = matrixCopy[lineLabelIndex][pivotColumnIndex];

  return matrixCopy;
}

function isZLine(line, columnLabelIndex) {
  return line[columnLabelIndex].toLowerCase().startsWith('z');
}

export { buildInitialMatrix, getPivotsIndexes, scaleMatrix };

import data from './data.json' with { type: 'json' };

const result = buildInitialMatrix(data);

console.table(result.matrix);

function buildInitialMatrix(data) {
  const { inputConsumption, availability, lucrativity, preorders } = data;

  const inputConsumptionKeys = Object.keys(inputConsumption);
  const preordersKeys = Object.keys(preorders);

  const baseLabel = ['base'];
  const variablesLabels = Object.keys(lucrativity);
  const artificialVariablesLabels = createArray(preordersKeys.length);
  const slackVariablesLabes = createArray(inputConsumptionKeys.length + preordersKeys.length);
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

  inputConsumptionKeys.forEach((consumptionKey, index, consumptionsList) => {
    let coefficientsline = createArray(variablesCount);

    Object.keys(inputConsumption[consumptionKey]).forEach(variableConsumptionKey => {
      let lineVariableIndex = variablesLabels.indexOf(variableConsumptionKey);

      coefficientsline[lineVariableIndex] = inputConsumption[consumptionKey][variableConsumptionKey];
    });

    let slackVariablesLine = createArray(slackVariablesLabes.length);
    slackVariablesLine[index] = 1;
    slackVariablesLabes[index] = `f${index + 1}`;
    basicVariablesLines.push([slackVariablesLabes[index]]);

    zLine.push(0);

    coefficientsLines.push(coefficientsline);
    slackVariablesLines.push(slackVariablesLine);
    artificialVariablesLines.push(createArray(artificialVariablesLabels.length));
    independentTerms.push([availability[consumptionKey]]);
  });

  preordersKeys.forEach((preorderKey, index, preordersList) => {
    let coefficientsline = createArray(variablesCount);
    let coefficientsLineIndex = variablesLabels.indexOf(preorderKey);
    coefficientsline[coefficientsLineIndex] = 1;

    let slackVariablesLine = createArray(slackVariablesLabes.length);
    slackVariablesLine[inputConsumptionKeys.length + index] = -1;
    slackVariablesLabes[inputConsumptionKeys.length + index] = `f${inputConsumptionKeys.length + index + 1}`;
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
  setHeader(slackVariablesLines, slackVariablesLabes);
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
    slackVariablesIndexes: createOrderedArray((baseLabel.length + variablesLabels.length), slackVariablesLabes.length),
    artificialVariablesIndexes: createOrderedArray((baseLabel.length + variablesLabels.length + slackVariablesLabes.length), artificialVariablesLabels.length)
  };
}

function createOrderedArray(startNumber, size, step = 1) {
  return createArray(size).map((_, index) => startNumber + (index * step));
}

function createArray(length) {
  return Array(length).fill(0);
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

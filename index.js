import data from './data.json' with { type: 'json' };

const result = buildInitialTable(data);

console.log(result);

function buildInitialTable(data) {
  const { inputConsumption, availability, lucrativity, preorders } = data;

  const inputConsumptionKeys = Object.keys(inputConsumption);
  const preordersKeys = Object.keys(preorders);

  const variablesLabels = Object.keys(lucrativity);
  const artificialVariablesLabels = createArray(preordersKeys.length);
  const slackVariablesLabes = createArray(inputConsumptionKeys.length + preordersKeys.length);
  const variablesCount = variablesLabels.length;

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

    let slackVariablesLine = createArray(consumptionsList.length);
    slackVariablesLine[index] = 1;
    slackVariablesLabes[index] = `f${index + 1}`;
    basicVariablesLines.push([slackVariablesLabes[index]]);

    zLine.push(0);

    coefficientsLines.push(coefficientsline);
    slackVariablesLines.push(slackVariablesLine);
    artificialVariablesLines.push([]);
    independentTerms.push([availability[consumptionKey]]);
  });

  preordersKeys.forEach((preorderKey, index, preordersList) => {
    let coefficientsline = createArray(variablesCount);
    let coefficientsLineIndex = variablesLabels.indexOf(preorderKey);
    coefficientsline[coefficientsLineIndex] = 1;

    let slackVariablesLine = createArray(inputConsumptionKeys.length + preordersList.length);
    slackVariablesLine[inputConsumptionKeys.length + index] = -1;
    slackVariablesLabes[inputConsumptionKeys.length + index] = `f${inputConsumptionKeys.length + index + 1}`;
    zLine.push(0);

    let artificialVariablesLine = createArray(preordersList.length);
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
  setHeader(independentTerms, ['b']);
  setHeader(basicVariablesLines, ['base']);

  const finalMatrix = joinMatrixes(basicVariablesLines, coefficientsLines, slackVariablesLines, artificialVariablesLines, independentTerms);
  finalMatrix.push(['z', ...zLine]);

  return {
    matrix: finalMatrix,
    columnLabelIndex: 0,
    lineLabelIndex: 0,
    independentTermsColumnIndex: finalMatrix[0].length - 1,
    zLineIndex: finalMatrix.length - 1,
    coefficientsIndexes: createOrderedArray(basicVariablesLines[0].length, variablesLabels.length),
    slackVariablesIndexes: createOrderedArray((basicVariablesLines[0].length + variablesLabels.length), slackVariablesLabes.length),
    artificialVariablesIndexes: createOrderedArray((basicVariablesLines[0].length + variablesLabels.length + slackVariablesLabes.length), artificialVariablesLabels.length)
  };
}

function createOrderedArray(startNumber, size, step = 1) {
  return createArray(size).map((_, index) => startNumber + (index * step));
}

function createArray(length) {
  return Array(length).fill();
}

function fillMatrix(matrix, value = 0) {
  const linesLength = matrix.reduce((length, line) => (line.length > length ? line.length : length), 0);

  return matrix.map(line => {
    return Array(linesLength).fill(value).map((_, index) => line[index] ?? value);
  });
}

function joinMatrixes(...matrixes) {
  return matrixes.reduce((result, matrixToAdd) => {
    let filledMatrix = fillMatrix(matrixToAdd);

    filledMatrix.forEach((line, lineIndex) => {
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

import data from './data.json' with { type: 'json' };

console.log(buildInitialTable(data));

function buildInitialTable(data) {
  const { inputConsumption, availability, lucrativity, preorders } = data;

  const variablesLabels = Object.keys(lucrativity);
  const variablesCount = variablesLabels.length;

  const coefficientsLines = [];
  const slackVariablesLines = [];
  const artificialVariablesLines = [];
  const independentTerms = [];

  Object.keys(inputConsumption).forEach((consumptionKey, index, consumptionsList) => {
    let coefficientsline = createArray(variablesCount);

    Object.keys(inputConsumption[consumptionKey]).forEach(variableConsumptionKey => {
      let lineVariableIndex = variablesLabels.indexOf(variableConsumptionKey);

      coefficientsline[lineVariableIndex] = inputConsumption[consumptionKey][variableConsumptionKey];
    });

    let slackVariablesLine = createArray(consumptionsList.length);
    slackVariablesLine[index] = 1;

    coefficientsLines.push(coefficientsline);
    slackVariablesLines.push(slackVariablesLine);
    artificialVariablesLines.push([]);
    independentTerms.push([availability[consumptionKey]]);
  });

  Object.keys(preorders).forEach((preorderKey, index, preordersList) => {
    let coefficientsline = createArray(variablesCount);
    let coefficientsLineIndex = variablesLabels.indexOf(preorderKey);
    coefficientsline[coefficientsLineIndex] = 1;

    let slackVariablesLine = createArray(Object.keys(inputConsumption).length + preordersList.length);
    slackVariablesLine[Object.keys(inputConsumption).length + index] = -1;

    let artificialVariablesLine = createArray(preordersList.length);
    artificialVariablesLine[index] = 1;

    coefficientsLines.push(coefficientsline);
    slackVariablesLines.push(slackVariablesLine);
    artificialVariablesLines.push(artificialVariablesLine);
    independentTerms.push([preorders[preorderKey]]);
  });

  return {
    coefficientsLines: fillMatrix(coefficientsLines),
    slackVariablesLines: fillMatrix(slackVariablesLines),
    artificialVariablesLines: fillMatrix(artificialVariablesLines),
    independentTerms: fillMatrix(independentTerms)
  };
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

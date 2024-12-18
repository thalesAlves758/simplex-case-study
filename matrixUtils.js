import { copyObject, createArray, createOrderedArray, fixNumber } from "./utils.js";

// Função para construir tabela inicial
function buildInitialMatrix(data) {
  const { inputConsumption, availability, lucrativity, preorders } = data;

  // Obtém as chaves das restrições em formato de array
  const inputConsumptionKeys = Object.keys(inputConsumption);
  const preordersKeys = Object.keys(preorders);

  // Inicializa variáveis de rótulos
  const baseLabel = ['base'];
  const variablesLabels = Object.keys(lucrativity);
  const artificialVariablesLabels = createArray(preordersKeys.length);
  const slackVariablesLabels = createArray(inputConsumptionKeys.length + preordersKeys.length);
  const variablesCount = variablesLabels.length;
  const independentTermsLabel = ['b'];

  // Inicializa variáveis que guardam as linhas
  const coefficientsLines = [];
  const slackVariablesLines = [];
  const artificialVariablesLines = [];
  const independentTerms = [];
  const basicVariablesLines = [];
  const zLine = [];

  // Atribui à variável zLine a função objetivo já igualada a zero
  variablesLabels.forEach(lucrativityKey => {
    zLine.push(-lucrativity[lucrativityKey]);
  });

  inputConsumptionKeys.forEach((consumptionKey, index) => {
    // cria um array com zeros do tamanho da quantidade de coeficientes (x1, x2, x...)
    let coefficientsline = createArray(variablesCount);

    // Para cada coeficiente no consumo da iteração atual, atribui à sua posição o seu respectivo consumo
    Object.keys(inputConsumption[consumptionKey]).forEach(variableConsumptionKey => {
      let lineVariableIndex = variablesLabels.indexOf(variableConsumptionKey);

      coefficientsline[lineVariableIndex] = inputConsumption[consumptionKey][variableConsumptionKey];
    });

    // cria linha de váriáveis de folga, atribuindo por padrão o valor 1 à respectiva posição
    let slackVariablesLine = createArray(slackVariablesLabels.length);
    slackVariablesLine[index] = 1;
    slackVariablesLabels[index] = `f${index + 1}`;
    basicVariablesLines.push([slackVariablesLabels[index]]);

    // adiciona 0 da variável de folga à linha da função objetivo
    zLine.push(0);

    // popula as listas de linhas de coeficientes, variáveis de folga, variáveis artificiais
    // (com uma lista zerada no momento, apenas para respeitar o tamanho)
    // e termo independente
    coefficientsLines.push(coefficientsline);
    slackVariablesLines.push(slackVariablesLine);
    artificialVariablesLines.push(createArray(artificialVariablesLabels.length));
    independentTerms.push([availability[consumptionKey]]);
  });

  // para cada restrição de encomenda prévia
  preordersKeys.forEach((preorderKey, index) => {
    // cria linha para as colunas dos coeficientes
    let coefficientsline = createArray(variablesCount);
    let coefficientsLineIndex = variablesLabels.indexOf(preorderKey);
    coefficientsline[coefficientsLineIndex] = 1;

    // cria linha para colunas de variáveis de folga e adiciona 0 à linha do Z
    let slackVariablesLine = createArray(slackVariablesLabels.length);
    slackVariablesLine[inputConsumptionKeys.length + index] = -1;
    slackVariablesLabels[inputConsumptionKeys.length + index] = `f${inputConsumptionKeys.length + index + 1}`;
    zLine.push(0);

    // cria linha para as colunas de variáveis artificiais e adiciona 0 à linha do Z
    let artificialVariablesLine = createArray(artificialVariablesLabels.length);
    artificialVariablesLine[index] = 1;
    artificialVariablesLabels[index] = `a${index + 1}`;
    basicVariablesLines.push([artificialVariablesLabels[index]]);
    zLine.push(0);

    // popula as respectivas linhas
    coefficientsLines.push(coefficientsline);
    slackVariablesLines.push(slackVariablesLine);
    artificialVariablesLines.push(artificialVariablesLine);
    independentTerms.push([preorders[preorderKey]]);
  });

  // adiciona o 0 da coluna do termo independente
  zLine.push(0);

  // seta o header da tabela
  setHeader(coefficientsLines, variablesLabels);
  setHeader(slackVariablesLines, slackVariablesLabels);
  setHeader(artificialVariablesLines, artificialVariablesLabels);
  setHeader(independentTerms, independentTermsLabel);
  setHeader(basicVariablesLines, baseLabel);

  // junta as matrizes, formando apenas uma e nessa adiciona a linha do z
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

// obtém o índice da coluna pivô, iterando pela linha do Z para encontrar o menor valor negativo
function getPivotColumnIndex(zLine, columnLabelIndex, independentTermsColumnIndex) {
  return zLine.reduce((negativeTermIndex, currentTerm, index) => {
    if (index === columnLabelIndex || index === independentTermsColumnIndex || currentTerm >= 0) {
      return negativeTermIndex;
    }

    return (!negativeTermIndex || currentTerm < zLine[negativeTermIndex]) ? index : negativeTermIndex;
  }, null);
}

// obtém o íncide ca linha pivô, iterando pelas linhas para obter o menor fator de produção
function getPivotLineIndex(matrix, lineLabelIndex, independentTermsColumnIndex, pivotColumnIndex, columnLabelIndex) {
  let lowerProductionFactor;

  return matrix.reduce((pivotLineIndex, line, index) => {
    if (index === lineLabelIndex || isZLine(line, columnLabelIndex) || line[pivotColumnIndex] <= 0) {
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

  // atribui à linha pivô os elementos divididos pelo número pivô
  matrixCopy[pivotLineIndex] = matrixCopy[pivotLineIndex].map((lineItem, index, line) => {
    if (index === columnLabelIndex) {
      return lineItem;
    }

    return lineItem / line[pivotColumnIndex];
  });

  // realiza as operações de soma de múltiplos nas linhas pela linha pivô
  // e retorna a matriz escalonada
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

function createArray(length) {
  return Array(length).fill(0);
}

function createOrderedArray(startNumber, size, step = 1) {
  return createArray(size).map((_, index) => startNumber + (index * step));
}

function copyObject(object) {
  return JSON.parse(JSON.stringify(object));
}

function renderTable(matrix, headerIndex, columnLabelIndex, tableTitle, { lineIndexes = [], columnIndexes = [], lineBgHighlight = "blue", columnBgHighlight = "blue" } = {}) {
  let tableEl = ``;

  matrix.forEach((line, lineIndex) => {
    let lineHighlightClassName = lineIndexes.includes(lineIndex) ? lineBgHighlight : '';

    if (lineIndex === headerIndex) {
      tableEl += `
        <tr>
          ${line.map((label, columnIndex) => (`<th class="bold ${lineHighlightClassName} ${isHighlightColumn(columnIndexes, columnIndex) ? columnBgHighlight : ''}">${label}</th>`)).join('')}
        </tr>
      `;
      return;
    }

    tableEl += `
      <tr>
        ${line.map((value, columnIndex) => (`<td class="${columnIndex === columnLabelIndex ? 'bold' : ''} ${lineHighlightClassName} ${isHighlightColumn(columnIndexes, columnIndex) ? columnBgHighlight : ''}">${columnIndex === columnLabelIndex ? value : fixNumber(value)}</td>`)).join('')}
      </tr>
    `;
  });

  document.body.innerHTML += `
    <table>
      <caption>${tableTitle}</caption>
      ${tableEl}
    </table>
    <hr>
  `;
}

function fixNumber(number) {
  return Number(number.toFixed(2));
}

function isHighlightColumn(hightlightColumnsIndexes, columnIndex) {
  return hightlightColumnsIndexes.includes(columnIndex);
}

export { createArray, createOrderedArray, copyObject, fixNumber, renderTable };

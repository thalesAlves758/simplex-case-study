import data from './data.json' with { type: 'json' };

import { buildInitialMatrix } from './matrixUtils.js';

const { matrix } = buildInitialMatrix(data);

console.table(matrix);

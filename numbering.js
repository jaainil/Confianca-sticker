/* Shared sequence and page layout, independent of browser rendering. */
function buildKitSheets({from, to, kits, maxCols, maxRows, flow = 'column', fill = false, fillMode = 'restart'}) {
  if (![from, to, kits, maxCols, maxRows].every(Number.isInteger) ||
      from < 0 || to < from || to > 999 || kits < 1 || kits > 50 || maxCols < 1 || maxRows < 1) {
    throw new RangeError('Invalid kit range or sheet dimensions');
  }
  const count = to - from + 1;
  const requested = count * kits;
  const capacity = maxCols * maxRows;
  const total = fill ? Math.ceil(requested / capacity) * capacity : requested;
  const sheets = [];
  for (let i = 0; i < total; i++) {
    const position = i % capacity;
    if (position === 0) sheets.push({cols: 0, rows: 0, cells: []});
    const sheet = sheets[sheets.length - 1];
    const col = flow === 'column' ? Math.floor(position / maxRows) : position % maxCols;
    const row = flow === 'column' ? position % maxRows : Math.floor(position / maxCols);
    const n = i < requested || fillMode === 'restart' ? from + i % count : to + 1 + i - requested;
    sheet.cells.push({n, col, row, globalIdx: i});
    sheet.cols = Math.max(sheet.cols, col + 1);
    sheet.rows = Math.max(sheet.rows, row + 1);
  }
  return sheets;
}
if (typeof module !== 'undefined') module.exports = {buildKitSheets};

export function axeFormatter(violations): any {
  if (violations.length === 0) {
    return '';
  }
  const lineBreak = '\n\n';
  const horizontalLine = '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500';
  const violationsSummary =
    violations.length +
    (violations.length > 1 ? ' violations' : ' violation') +
    ' found';
  return (
    lineBreak +
    violationsSummary +
    lineBreak +
    horizontalLine +
    lineBreak +
    violations
      .map(violation => {
        return violation.nodes
          .map(node => {
            const selector = node.target.join(', ');
            const expectedText = `Violation found at ${selector}` + lineBreak;
            return (
              expectedText +
              node.html +
              lineBreak +
              'Received:' +
              lineBreak +
              (violation.help + ' (' + violation.id + ')') +
              lineBreak +
              node.failureSummary +
              lineBreak +
              (violation.helpUrl
                ? 'You can find more information on this issue here: \n' +
                  violation.helpUrl
                : '')
            );
          })
          .join(lineBreak);
      })
      .join(lineBreak + horizontalLine + lineBreak)
  );
}

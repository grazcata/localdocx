// Converter from HTML DOM to docx.Document using docx library

export function htmlToDocx(editorElement, options = {}) {
  const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } = window.docx;

  const title = options.title || 'Document';
  const children = [];

  function parseInline(node, currentStyle = {}) {
    const runs = [];

    node.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent;
        if (text) {
          runs.push(new TextRun({
            text: text,
            bold: !!currentStyle.bold,
            italics: !!currentStyle.italic,
            underline: currentStyle.underline ? {} : undefined,
            strike: !!currentStyle.strike,
            highlight: currentStyle.highlight,
            color: currentStyle.color,
            size: currentStyle.size || 24, // 12pt default (half-points)
            font: currentStyle.font || 'Calibri'
          }));
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const tag = child.tagName.toLowerCase();
        const style = { ...currentStyle };

        if (tag === 'b' || tag === 'strong') style.bold = true;
        if (tag === 'i' || tag === 'em') style.italic = true;
        if (tag === 'u') style.underline = true;
        if (tag === 's' || tag === 'strike' || tag === 'del') style.strike = true;
        if (tag === 'mark') style.highlight = 'yellow';
        
        // CSS inline styles
        if (child.style.fontWeight === 'bold' || parseInt(child.style.fontWeight, 10) >= 700) style.bold = true;
        if (child.style.fontStyle === 'italic') style.italic = true;
        if (child.style.textDecoration && child.style.textDecoration.includes('underline')) style.underline = true;
        if (child.style.textDecoration && child.style.textDecoration.includes('line-through')) style.strike = true;
        if (child.style.color) {
          // Normalize hex color without '#'
          const hex = rgbToHex(child.style.color);
          if (hex) style.color = hex.replace('#', '');
        }

        if (tag === 'br') {
          runs.push(new TextRun({ text: '', break: 1 }));
        } else {
          runs.push(...parseInline(child, style));
        }
      }
    });

    return runs;
  }

  function getAlignment(node) {
    const align = node.style.textAlign || (node.getAttribute && node.getAttribute('align'));
    if (align === 'center') return AlignmentType.CENTER;
    if (align === 'right') return AlignmentType.RIGHT;
    if (align === 'justify') return AlignmentType.JUSTIFIED;
    return AlignmentType.LEFT;
  }

  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (text) {
        children.push(new Paragraph({
          children: [new TextRun({ text, size: 24, font: 'Calibri' })]
        }));
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tag = node.tagName.toLowerCase();

    if (tag === 'h1') {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: getAlignment(node),
        spacing: { before: 240, after: 120 },
        children: parseInline(node, { size: 40, bold: true })
      }));
    } else if (tag === 'h2') {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        alignment: getAlignment(node),
        spacing: { before: 200, after: 100 },
        children: parseInline(node, { size: 32, bold: true })
      }));
    } else if (tag === 'h3') {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_3,
        alignment: getAlignment(node),
        spacing: { before: 160, after: 80 },
        children: parseInline(node, { size: 28, bold: true })
      }));
    } else if (tag === 'p' || tag === 'div') {
      const runs = parseInline(node);
      children.push(new Paragraph({
        alignment: getAlignment(node),
        spacing: { after: 120, line: 276 },
        children: runs.length ? runs : [new TextRun("")]
      }));
    } else if (tag === 'blockquote') {
      children.push(new Paragraph({
        indent: { left: 720 },
        spacing: { before: 120, after: 120 },
        children: parseInline(node, { italic: true, color: '555555' })
      }));
    } else if (tag === 'ul') {
      node.childNodes.forEach(li => {
        if (li.tagName && li.tagName.toLowerCase() === 'li') {
          children.push(new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: parseInline(li)
          }));
        }
      });
    } else if (tag === 'ol') {
      let count = 1;
      node.childNodes.forEach(li => {
        if (li.tagName && li.tagName.toLowerCase() === 'li') {
          const runs = [
            new TextRun({ text: `${count}.  `, bold: true }),
            ...parseInline(li)
          ];
          children.push(new Paragraph({
            indent: { left: 360 },
            spacing: { after: 60 },
            children: runs
          }));
          count++;
        }
      });
    } else if (tag === 'table') {
      const rows = [];
      const trs = node.querySelectorAll('tr');
      trs.forEach(tr => {
        const cells = [];
        tr.childNodes.forEach(td => {
          if (td.tagName && (td.tagName.toLowerCase() === 'td' || td.tagName.toLowerCase() === 'th')) {
            const isHeader = td.tagName.toLowerCase() === 'th';
            cells.push(new TableCell({
              children: [new Paragraph({
                children: parseInline(td, { bold: isHeader }),
                alignment: getAlignment(td)
              })],
              shading: isHeader ? { fill: 'F3F4F6' } : undefined,
              margins: { top: 120, bottom: 120, left: 160, right: 160 }
            }));
          }
        });
        if (cells.length) {
          rows.push(new TableRow({ children: cells }));
        }
      });
      if (rows.length) {
        children.push(new Table({
          rows,
          width: { size: 100, type: WidthType.PERCENTAGE }
        }));
        children.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
      }
    } else if (tag === 'hr') {
      children.push(new Paragraph({
        border: { bottom: { color: 'CCCCCC', space: 1, style: BorderStyle.SINGLE, size: 6 } },
        spacing: { before: 180, after: 180 },
        children: []
      }));
    } else {
      // Recurse children
      node.childNodes.forEach(child => processNode(child));
    }
  }

  // Iterate top-level child nodes of editor
  editorElement.childNodes.forEach(child => processNode(child));

  // If empty, add at least one empty paragraph
  if (children.length === 0) {
    children.push(new Paragraph({ children: [new TextRun("")] }));
  }

  const doc = new Document({
    creator: 'LocalDocx Mobile',
    title: title,
    description: 'Document créé avec LocalDocx',
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } // 1 inch margins
        }
      },
      children
    }]
  });

  return doc;
}

function rgbToHex(rgb) {
  if (!rgb) return null;
  if (rgb.startsWith('#')) return rgb;
  const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return null;
  return '#' + [match[1], match[2], match[3]].map(x => {
    const hex = parseInt(x, 10).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

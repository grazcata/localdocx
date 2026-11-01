import * as docx from 'docx';
import mammoth from 'mammoth';
import JSZip from 'jszip';

// Expose on window for easy access in our app logic
window.docx = docx;
window.mammoth = mammoth;
window.JSZip = JSZip;
